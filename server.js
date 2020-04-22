const dotenv = require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { filterByMaxSuggestedResults, filterByPopularity } = require("./lib.js");

let names = require("./names.json");
names = Object.entries(names).map(([name, times]) => ({
  name,
  times
}));

app.listen(process.env.PORT, () => {
  console.log(`Running on port ${process.env.PORT}`);
});

app.use(express.json()); // necessary when using Content Type Application/JSON in a post request

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

app.post("/typehead/set", ({ body: { name } }, res) => {
  const searchValue = name;
  console.log("searchValue", searchValue);
  const matchedObj = names.find(matchedName => {
    if (searchValue === matchedName.name) {
      console.log("found!");
      return matchedName;
    }
  });
  console.log("matchedObj", matchedObj);

  if (matchedObj) {
    //here do the update
    console.log("success");
    res.sendStatus(200);
  } else {
    console.log("not found");
    res.sendStatus(400);
  }
});
