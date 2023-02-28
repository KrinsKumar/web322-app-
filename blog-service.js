const fs = require("fs"); 

var posts = [];
var categories = [];

module.exports.initialize = function() {
    return new Promise((res, rej) => {
        // used to load the views.json file
        fs.readFile('data/posts.json', 'utf8', (err, data) => {
            if (err) {
                rej(err + 'Cannot read posts.json');
            } else {
                try{
                    posts = JSON.parse(data);
                    fs.readFile('data/categories.json', 'utf8', (err, data) => {
                        if (err) {
                            rej(err + 'Cannot read categories.json');
                        } else {
                            try{
                                categories = JSON.parse(data);
                                res();
                            } catch (err) {
                                rej(err + 'Cannot parse categories.json');
                            }
                        }
                    });
                } catch (err) {
                    rej(err + 'Cannot Parse posts.json');
                }
            }
        });
    });
}

module.exports.getAllPosts = function() {

    return new Promise((res, rej) => {
        if (posts.length === 0) {
            rej("No posts found");
        } else {
            res(posts);
        }
    })
}

module.exports.getPublishedPosts = function() {
    return new Promise((res, rej) => {
        if (posts.length === 0) {
            rej("No posts found");
        } else {
            res(posts.filter(post => post.published));
        }
    })
}

module.exports.getCategories = function() {
    return new Promise((res, rej) => {
        if (categories.length === 0) {
            rej("No categories found");
        } else {
            res(categories);
        }
    })
}

module.exports.addPost = function(postData) {
    return new Promise((res, rej) => {
        if(postData) {
            if (typeof(postData.published) === undefined)  postData.published = false;
            else postData.published = true;
            postData.id = posts.length + 1;
            postData.postDate = new Date();
            posts.push(postData);
            res();
        }
        rej();
    })
}

module.exports.getPostsByCategory = (category) => {
    return new Promise((res, rej) => {
        if (posts.length === 0) {
            rej("No post found")
        } else {
            res(posts.filter(post => post.category == category));
        }
    })
}

module.exports.getPostsByMinDate = (minDateStr) => {
    return new Promise((res, rej) => {
        if (posts.length !== 0) {
            res(posts.filter((post) => {
                return new Date(post.postDate) >= new Date(minDateStr);
            }));
        } else {
            rej("No post found")
        }
    })
}

module.exports.getPostById = (id) => {
    return new Promise((res, rej) => {
        if (posts.length !== 0) {
            res(posts.filter((post) => { return post.id == id})[0]);
        } else {
            rej("No post found")
        }
    })
}

module.exports.getPublishedPostsByCategory = (category) => {
    return new Promise((res, rej) => {
        if (posts.length === 0) {
            rej("No post found")
        } else {
            res(posts.filter(post => post.category == category && post.published));
        }
    })
}