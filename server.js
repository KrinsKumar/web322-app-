/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Krinskumar Vaghasia Student ID: 169722212 Date: 15th Feb 2023
*
*  Cyclic Web App URL: https://dark-ruby-rhinoceros-cap.cyclic.app
*
*  GitHub Repository URL: https://github.com/KrinsKumar/web322-app-
*
********************************************************************************/ 
const express = require("express");
const path = require("path")
const app = express();
const blog = require("./blog-service")
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const exphbs = require("express-handlebars");
const stripJs = require('strip-js');

//Setting up the server-----------------------------------------------------------
cloudinary.config({
    cloud_name: 'dmiu3kgsb',
    api_key: '758865488423371',
    api_secret: '6sE0m_d1rRyTQu0qp7gxf7EYquI',
    secure: true
});

app.engine('.hbs', exphbs.engine({ extname: '.hbs',
    helpers: {
        navLink: function(url, options){
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function(context){
            return stripJs(context);
        }
    }})
);
app.set('view engine', '.hbs');

const upload = multer();

var HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));

app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});
//---------------------------------------------------------------------------------

function onHttpStart() {
    console.log("Express http server is listening on 8080");
}


app.get("/", function(req,res){
    res.redirect("/about");
})

app.get("/about", function(req,res) {
    res.render('about', {
        layout: 'main'
    })
})

app.get('/blog', async (req, res) => {
    let viewData = {};
    try{
        let posts = [];
        if(req.query.category){
            posts = await blog.getPublishedPostsByCategory(req.query.category);
        }else{
            posts = await blog.getPublishedPosts();
        }

        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
        let post = posts[0]; 
        viewData.posts = posts;
        viewData.post = post;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blog.getCategories();
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})
});

app.get('/blog/:id', async (req, res) => {
    let viewData = {};
    try{
        let posts = [];

        if(req.query.category){
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        }else{
            posts = await blogData.getPublishedPosts();
        }

        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.posts = posts;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        viewData.post = await blogData.getPostById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }

    try{
        let categories = await blogData.getCategories();
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    res.render("blog", {data: viewData})
});

app.get("/posts", function(req,res) {
    if (req.query.category) {
        blog.getPostsByCategory(req.query.category)
        .then((postsData) =>  res.render('posts', {
            layout: 'main',
            data: postsData
        }))
        .catch((err) => res.render('posts', {
            layout: 'main',
            data: {message: err}
        }))
    } else if (req.query.minDate) {
        blog.getPostsByMinDate(req.query.minDate)
        .then((postsData) =>  res.render('posts', {
            layout: 'main',
            data: postsData
        }))
        .catch((err) => res.render('posts', {
            layout: 'main',
            data: {message: err}
        }))
    } else {
        blog.getAllPosts()
        .then((allPosts) => res.render('posts', {
            layout: 'main',
            data: allPosts
        }))
        .catch((err) => res.render('posts', {
            layout: 'main',
            data: {message: err}
        }))
    }
})

app.get("/post/:value", function(req, res) {
    blog.getPostById(req.params.value)
    .then((post) => res.json(post))
    .catch((err) => {
        res.send("No post with this ID found");
        console.log(err);
    })
})

app.get("/categories", function(req,res) {
    blog.getCategories()
    .then((categoriesData) => res.render('categories', {
        layout: 'main',
        data: categoriesData
    }))
    .catch((err) => res.render('posts', {
        layout: 'main',
        data: {message: err}
    }))
})

app.get("/posts/add", function(req,res) {
    res.render('addPosts', {
        layout: 'main'
    })
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
        blog.addPost(req.body)
        .then(() => {
            res.redirect("/posts")
        })
        .catch((err) => {
            console.log(err)
            res.send("Failed to add the new Post try again");
        });
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
  