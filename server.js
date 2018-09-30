var express = require("express");

var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cheerio = require("cheerio");
var request = require("request");

var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/18-scraper", { useNewUrlParser: true });

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes
// Route for home
app.get("/", function(req, res) {
    res.render("index")
});

// A GET route for scraping the medium website
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    request("https://medium.com/", (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
  
      // An empty array to save the data that we'll scrape
    const results = [];

  
    // (i: iterator. element: the current element)
    $("a.ds-link h3").each((i, el) => {
        const title = $(el).text();
        const parent = $(el).parent();
        const link = parent.attr('href');
        const summary = parent.next().text();
        console.log("TITLE ====", title);
        console.log("LINK ====", link);
        console.log("SUMMARY =====", summary);
        results.push({
            title: title,
            link: link,
            summary: summary
        });
         // Create a new Article using the `results` object built from scraping
         db.Article.create(results)
         .then(function(dbArticle) {
           // View the added result in the console
           console.log(dbArticle);
         })
         .catch(function(err) {
           // If an error occurred, send it to the client
           return res.json(err);
         });
    })

      // If we were able to successfully scrape and save an Article, send a message to the client
      res.send("Scrape Complete");
        };
    });
  });

//   Route for clearing articles
app.get("/clear", function(req, res) {
db.Article.deleteMany({})
    .then(function(dbArticle) {
         // If we were able to successfully find Articles, send them back to the client
         res.json(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.json(err);
    });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
      .then(function(dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  
  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate("note")
      .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  
  // Route for saving/updating an Article's associated Note
  app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function(dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });








// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });
  