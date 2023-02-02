const express = require("express");
const path = require("path")
const app = express();
const blog = require("./blog-service")

var HTTP_PORT = process.env.PORT || 8080;

function onHttpStart() {
    console.log("Express http server is listening on 8080");
}

app.use(express.static("public"));

app.get("/", function(req,res){
    res.redirect("/about");
})

app.get("/about", function(req,res) {
    res.sendFile(path.join(__dirname, "/views/about.html"));
})

app.get("/blog", function(req,res) {
    res.send("Beep-Boop, it seems that there are on posts right now.");
})

app.get("/posts", function(req,res) {
    res.send("Beep-Boop, it seems that there are on posts right now.");
})

app.get("/categories", function(req,res) {
    blog.getCategories()
    .then((categories) => res.send(categories))
    .catch(res.send("Beep-Boop, it seems that there are on posts right now."))
})

// for the pages that do not exist
app.use((req,res) => {
    res.status(404).send("the page that you are looking for does not exist!");
})

blog.initialize()
.then(() => {
    app.listen(HTTP_PORT, onHttpStart)
})
.catch((err) => {
    console.log(err);
}); 