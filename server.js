const dotenv = require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const {
  filterByMaxSuggestedResults,
  filterByPopularity,
} = require("./src/lib.js");
const Name = require("./src/models/Name.js");

let names = require("./names.json");
names = Object.entries(names).map(([name, times]) => ({
  name,
  times,
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

const seedDb = async (namesArr) => {
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
    new: true,
  });
};

app.get("/typehead/:prefix?", async (req, res) => {
  try {
    const searchValue = req.params.prefix;
    let finalMatchedNames = [];
    if (searchValue) {
      console.log("with paremeter");
      const regex = new RegExp(`^${searchValue}`, "i"); // means it will search and return any name that starts with the search value
      const [trueMatchedName, ...restOfMatchedNames] = await Name.find({
        name: regex,
      });
      filterByPopularity(restOfMatchedNames);
      finalMatchedNames = [trueMatchedName, ...restOfMatchedNames];
    } else {
      console.log("no parameter");
      finalMatchedNames = await Name.find();
      filterByPopularity(finalMatchedNames);
    }

    const filteredMatchedNames = filterByMaxSuggestedResults(finalMatchedNames);
    res.send(filteredMatchedNames);
    res.sendStatus(200);
  } catch (err) {
    return console.error(err);
  }
});

app.post("/typehead/set", async ({ body: { name } }, res) => {
  try {
    const allNames = await Name.find().exec();
    const matchedObj = allNames.find(
      (matchedName) => name === matchedName.name
    );

    if (matchedObj) {
      const matchedResult = await makeMorePopular(matchedObj);
      console.log(
        `${matchedResult.name} became *slightly* more popular with ${matchedResult.times} searches!`
      );
      res.send(matchedResult);
      res.sendStatus(200);
    } else {
      res.send("Not found!");
      res.sendStatus(400);
    }
  } catch (err) {
    return console.error(err);
  }
});
