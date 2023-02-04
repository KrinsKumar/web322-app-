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
            posts = posts.filter(post => {return post.published;})
            res(posts);
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