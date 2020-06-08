
// Dependencies
var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose")
// Require axios and cheerio. This makes the scraping possible
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models as db
var db = require("./models/Index");
var PORT = process.env.PORT || 3000;
// Initialize Express
var app = express();
//Configure Middleware
//Use Morgan logger for loggin requests
app.use(logger("dev"));
//Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));


mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/headline", { useNewUrlParser: true });

console.log("Mongoose connection");

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
  // Make a request via axios for the news section of `ycombinator`
  axios.get("https://buffalonews.com/").then(function(response) {
    // Load the html body from axios into cheerio
    var $ = cheerio.load(response.data);
    // For each element with a "title" class
    $("div.headline").each(function(i) {
      if (i > 20)
{
  return
}      // Save the text and href of each link enclosed in the current element
      var result = {};

      result.title= $(this)
      .children("a")
      .text();

      result.link = $(this)
      .children("a")
        .attr("href");
     
        db.Article.create(result).then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err)
        })
    });
  });

  // Send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
});
app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    })
})

app.get("/articles/:id", function(req, res) {
  db.Article.find({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    })
})
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
  .then(function(dbNote) {
    return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
  })
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  })
})
// Listen on port 3000
app.listen(PORT, function() {
  console.log("App running on port 3000!");
});
