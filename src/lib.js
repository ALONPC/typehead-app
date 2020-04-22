exports.filterByMaxSuggestedResults = arr =>
  arr.filter((_, index) => index < process.env.SUGGESTION_NUMBER);

exports.filterByPopularity = arr => {
  arr.sort((a, b) => b.times - a.times);
  console.log("filteredByPopularity", arr);
};
