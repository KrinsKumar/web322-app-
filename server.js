const express = require("express");
const path = require("path")
const app = express();
const blog = require("./blog-service")
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')

cloudinary.config({
    cloud_name: 'dmiu3kgsb',
    api_key: '758865488423371',
    api_secret: '6sE0m_d1rRyTQu0qp7gxf7EYquI',
    secure: true
});

const upload = multer();

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
    blog.getPublishedPosts()
    .then((posts) => res.json(posts))
    .catch((err) => {
        res.send("Beep-Boop, it seems that there are on posts right now.<br>" + 
        '<a href="/about">Go Back</a>');
        console.log(err);
    })
})

app.get("/posts", function(req,res) {

    if (req.query.category) {
        blog.getPostsByCategory(req.query.category)
        .then((posts) =>  res.json(posts))
        .catch((err) => {
            res.send("Looks like no post exist here")
            console.log(err);
        })
    } else if (req.query.minDate) {
        blog.getPostsByMinDate(req.query.minDate)
        .then((posts) =>  res.json(posts))
        .catch((err) => {
            res.send("Looks like no post exist here");
            console.log(err);
        })
    } else {
        blog.getAllPosts()
        .then((allPosts) => res.json(allPosts))
        .catch((err) => {
            res.send("Beep-Boop, it seems that there are on posts right now.<br>" + 
            '<a href="/about">Go Back</a>')
            console.log(err);
        })
    }
})

app.get("/post/value", function(req, res) {
    blog.getPostById(req.value)
    .then((post) => res.json(post))
    .catch((err) => {
        res.send("No post with this ID found");
        console.log(err);
    })
})

app.get("/categories", function(req,res) {
    blog.getCategories()
    .then((categories) => res.json(categories))
    .catch((err) => {
        res.send("Beep-Boop, it seems that there are on posts right now.");
        console.log(err);
    })
})

app.get("/posts/add", function(req,res) {
    res.sendFile(path.join(__dirname, "/views/addPosts.html"));
})

app.post("/posts/add", upload.single("featureImage"), function(req, res) {
    if(req.file){
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
    
        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }
    
        upload(req).then((uploaded)=>{
            processPost(uploaded.url);
        });
    }else{
        processPost("");
    }
     
    function processPost(imageUrl){
        req.body.featureImage = imageUrl;
        blog.addPost(req.body).then(() => {
            res.redirect("/posts")
        })
    } 
    
})

// for the pages that do not exist
app.use((req,res) => {
    res.status(404).send("the page that you are looking for does not exist!<br>" + 
    '<a href="/about">Go to the main Page</a>');
})

blog.initialize()
.then(() => {
    app.listen(HTTP_PORT, onHttpStart)
})
.catch((err) => {
    console.log(err);
}); 