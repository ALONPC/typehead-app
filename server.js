const dotenv = require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const {
  filterByMaxSuggestedResults,
  filterByPopularity
} = require("./src/lib.js");
const Name = require("./src/models/Name.js");

let names = require("./names.json");
names = Object.entries(names).map(([name, times]) => ({
  name,
  times
}));

app.listen(process.env.PORT, () => {
  console.log(`Running on port ${process.env.PORT}`);
});

app.use(express.json()); // necessary when using Content Type Application/JSON in a post request

// connecting to the database
const connectDb = async () => {
  try {
    await mongoose.connect("mongodb://localhost/people");
    console.log("Connected to database");
  } catch (error) {
    console.log("An error occurred when trying to connect to database");
  }
};

const seedDb = async namesArr => {
  for (const name of namesArr) {
    const newName = new Name(name);
    await newName.save((err, obj) => {
      if (err) {
        return console.error(err);
      }
      console.log(`${obj.name} saved in the collection`);
      console.log(obj);
    });
  }
};

// const getAllNamesInDb = () => {
//   const allNames = Name.find().exec();
//   return allNames;
//   //   try {
//   //     await Name.find().exec();
//   //     return [];
//   //   } catch (err) {
//   //     console.log("err on all names", err);
//   //   }
// };

connectDb();
seedDb(names);
// let allNames = getAllNamesInDb();

const makeMorePopular = async ({ name, times }) => {
  const updateData = { times: (times += 1) };
  const updatedName = await Name.findOneAndUpdate({ name }, updateData, {
    new: true
  });
  console.log("updatedName", updatedName);
  return updatedName;
};

app.get("/typehead", (req, res) => {
  filterByPopularity(names);
  const filteredNames = filterByMaxSuggestedResults(names);
  console.log("filteredNames", filteredNames);
  res.send(filteredNames);
});

app.get("/typehead/:searchValue", (req, res) => {
  console.log("req", req.params.searchValue);
  const searchValue = req.params.searchValue.toUpperCase();
  console.log("searchValue", searchValue);
  const matchedNames = [];
  names.forEach(obj => {
    if (obj.name.toUpperCase().startsWith(searchValue)) {
      console.log("match!", obj);
      matchedNames.push(obj);
    }
  });
  console.log("matchedNames", matchedNames);

  const filteredMatchedNames = filterByMaxSuggestedResults(matchedNames);
  filterByPopularity(filteredMatchedNames);

  res.send(filteredMatchedNames);
});

// check this with postman
app.post("/typehead/set", ({ body: { name } }, res) => {
  Name.find().exec((err, names) => {
    if (err) {
      console.log("err", err);
    }
    const matchedObj = names.find(matchedName => {
      if (name === matchedName.name) {
        console.log("found!");
        return matchedName;
      }
    });
    console.log("matchedObj", matchedObj);

    if (matchedObj) {
      makeMorePopular(matchedObj);
      console.log("success");
      res.sendStatus(200);
    } else {
      console.log("not found");
      res.sendStatus(400);
    }
  });
});
