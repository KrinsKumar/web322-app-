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
const authData = require("./auth-service");
const clientSessions = require("client-sessions");

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
        },
        formatDate: function(dateObj){
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
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

app.use(express.urlencoded({ extended: true }));

app.use(clientSessions({
    cookieName: "session",
    secret: "web322_a3",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));

app.use(function(req,res,next) {
    res.locals.session = req.session;
    next();
})

function ensureLogin(req,res,next){
    if(!req.session.user){
        res.redirect("/login");
    }else{
        next();
    }
}

//---------------------------------------------------------------------------------
function onHttpStart() {
    console.log("Express http server is listening on 8080");
};

app.get("/", function(req,res){
    res.redirect("/blog");
});

app.get("/about", function(req,res) {
    res.render('about', {
        layout: 'main'
    })
});

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
            posts = await blog.getPublishedPostsByCategory(req.query.category);
        }else{
            posts = await blog.getPublishedPosts();
        }

        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.posts = posts;

    }catch(err){
        viewData.message = "No Results 1";
    }

    try{
        viewData.post = await blog.getPostById(req.params.id);
    }catch(err){
        viewData.message = "No Results 2"; 
    }

    try{
        let categories = await blog.getCategories();
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "No Results 3"
    }

    res.render("blog", {data: viewData})
});

app.get("/posts", ensureLogin, function(req,res) {

    blog.getAllPosts()
    .then((allPosts) => {
        if (allPosts.length == 0) {
            postsPresent = false;
            res.render('posts', {
                layout: 'main',
                data: {message: "No posts found"}
            })
        } else {
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
        }
    })

});

app.get("/post/:value", ensureLogin, function(req, res) {
    blog.getPostById(req.params.value)
    .then((post) => res.json(post))
    .catch((err) => {
        res.send("No post with this ID found");
        console.log(err);
    })
});

app.get("/categories", ensureLogin, function(req,res) {
    blog.getCategories()
    .then((categoriesData) => {
        if (categoriesData.length == 0) {
            res.render('categories', {
                layout: 'main',
                data: {message: "No categories found"}
            })
        } else {
                res.render('categories', {
                layout: 'main',
                data: categoriesData
                })
            }
        }
    )
    .catch((err) => res.render('posts', {
        layout: 'main',
        data: {message: err}
    }))
});

app.get("/posts/add", ensureLogin, function(req,res) {
    blog.getCategories().then((categories) => {
        res.render('addPosts', {
            layout: 'main',
            data: categories
        })
    }).catch((err) => {
        res.render('addPosts', {
            layout: 'main',
            data: []
        })
    })
});

app.post("/posts/add", ensureLogin, upload.single("featureImage"), function(req, res) {
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
            return result;
        }
    
        upload(req).then((uploaded)=>{
            processPost(uploaded.url);
        });
    }else{
        processPost("");
    }
     
    function processPost(imageUrl){
        req.body.featuredImage = imageUrl;
        blog.addPost(req.body)
        .then(() => {
            res.redirect("/posts")
        })
        .catch((err) => {
            res.render('404', {
              layout: 'main'  
            })
        });
    } 
    
});

app.get("/categories/add", ensureLogin, function(req,res) {
    res.render('addCategory', {
        layout: 'main'
    })
});

app.post("/categories/add", ensureLogin, function(req,res) {
    blog.addCategory(req.body)
    .then(() => {
        res.redirect("/categories")
    })
    .catch((err) => {
        res.render('404', {
          layout: 'main'  
        })
    });
});

app.get('/category/delete/:id', ensureLogin, function(req, res) {
    blog.deleteCategoryById(req.params.id)
    .then(() => {
        res.redirect('/categories')
    })
    .catch((err) => {
        res.status(500).send("Unable to Remove Category / Category not found");
    });
});

app.get('/post/delete/:id', ensureLogin, function(req, res) {
    blog.deletePostById(req.params.id)
    .then(() => {
        res.redirect('/posts')
    })
    .catch((err) => {
        res.status(500).send("Unable to Remove Post / Post not found");
    });
});

app.get('/login', function(req, res) {
    res.render('login', {
        layout: 'main'
    })
});

app.post('/login', function(req, res) {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body).then((user) => {
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        res.redirect('/posts');
    }).catch((err) => {
        res.render('login', {
            layout: 'main',
            errorMessage: err,
            userName: req.body.userName
        })
    })
})

app.get('/register', function(req, res) {
    res.render('register', {
        layout: 'main'
    })
});

app.post('/register', function(req, res) {
    authData.registerUser(req.body).then(() => {
        res.render('register', {
            layout: 'main',
            successMessage: "User Created"
        })
    }).catch((err) => {
        res.render('register', {
            layout: 'main',
            errorMessage: err,
            userName: req.body.userName
        })
    })
});

app.get('/logout', function(req, res) {
    req.session.reset();
    res.redirect('/');
});

app.get('/userHistory', ensureLogin, function(req, res) {
    res.render('userHistory', {
        layout: 'main'
    })
});

// for the pages that do not exist
app.use((req,res) => {
    res.render('404', {
      layout: 'main'  
    })
});

blog.initialize()
.then(authData.initialize)
.then(() => {
    app.listen(HTTP_PORT, onHttpStart)
})
.catch((err) => {
    console.log(err);
});