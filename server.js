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

app.use(express.json());

const connectDb = async () => {
  try {
    await mongoose.connect("mongodb://localhost/people");
    console.log("Connected to database");
  } catch (err) {
    console.log("An error occurred when trying to connect to database", err);
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
    });
  }
};

connectDb();
seedDb(names);

const makeMorePopular = async ({ name, times }) => {
  const updateData = { times: (times += 1) };
  return await Name.findOneAndUpdate({ name }, updateData, {
    new: true
  });
};

app.get("/typehead", async (req, res) => {
  const allNames = await Name.find().exec();
  filterByPopularity(allNames);
  const filteredNames = filterByMaxSuggestedResults(allNames);
  res.send(filteredNames);
});

app.get("/typehead/:searchValue", async (req, res) => {
  const allNames = await Name.find().exec();
  const searchValue = req.params.searchValue.toUpperCase();
  const matchedNames = allNames.filter(obj =>
    obj.name.toUpperCase().startsWith(searchValue)
  );

  const filteredMatchedNames = filterByMaxSuggestedResults(matchedNames);
  filterByPopularity(filteredMatchedNames);

  res.send(filteredMatchedNames);
});

app.post("/typehead/set", async ({ body: { name } }, res) => {
  const allNames = await Name.find().exec();
  const matchedObj = allNames.find(matchedName => name === matchedName.name);

  if (matchedObj) {
    makeMorePopular(matchedObj);
    console.log("success");
    res.sendStatus(200);
  } else {
    console.log("not found");
    res.sendStatus(400);
  }
});
