const dotenv = require("dotenv").config();
const express = require("express");
const app = express();

let names = require("./names.json");
names = Object.entries(names).map(([name, times]) => ({
  name,
  times
}));

app.listen(process.env.PORT, () => {
  console.log(`Running on port ${process.env.PORT}`);
});

app.get(`/typehead/:searchValue`, (req, res) => {
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

  const filteredMatchedNames = matchedNames.filter(
    (_, index) => index < process.env.SUGGESTION_NUMBER
  );

  filteredMatchedNames.sort((a, b) => b.times - a.times);
  console.log("filteredMatchedNames", filteredMatchedNames);

  res.send(filteredMatchedNames);
});

// app.post("/typehead", (req, res) => {
//   res.send;
// });
