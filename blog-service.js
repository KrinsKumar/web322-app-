const Sequelize = require('sequelize');
const {gte} = Sequelize.Op;

var sequelize = new Sequelize('eruaoruu', 'eruaoruu', 'ppdIVQ9SuRbPIpD58MqRNOoKkaGayswT', {
    host: 'isilo.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
})

var Post = sequelize.define('Post', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featuredImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
});

var Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

Post.belongsTo(Category, {foreignKey: 'category'});

module.exports.initialize = function() {
    return new Promise((res, rej) => {
        sequelize.sync().then(() => {
            res();
        }).catch((err) => {
            rej("unable to sync the database" + err);
        })
    });
}

module.exports.getAllPosts = function() {
    return new Promise((res, rej) => {
        Post.findAll().then((post) => {
            res(post);
        }).catch((err) => {
            rej("no results returned" + err);
        })
    });
}

module.exports.getPublishedPosts = function() {
    return new Promise((res, rej) => {
        post.findAll({
            where: {published: true}
        }).then((post) => {
            res(post);
        }).catch((err) => {
            rej("no results returned" + err);
        }) 
    });
}

module.exports.getCategories = function() {
    return new Promise((res, rej) => {
        Category.findAll().then((category) => {
            res(category);
        }).catch((err) => {
            rej("no results returned" + err);
        })
    });
}

module.exports.addPost = function(postData) {
    return new Promise((res, rej) => {
        postData.published = (postData.published) ? true : false;
        for (let val in postData) {
            if (postData[val] == "") {
                postData[val] = null;
            }
        }
        postData.postDate = new Date();
        Post.create({
            title: postData.title,
            body: postData.body,
            postDate: postData.postDate,
            featuredImage: postData.featuredImage,
            published: postData.published,
            category: postData.category
        }).then(() => {
            res('Post added');
        }).catch((err) => {
            rej("unable to add post" + err);
        })
    });
}

module.exports.getPostsByCategory = (categoryy) => {
    return new Promise((res, rej) => {
        Post.findAll({
            where: {category: categoryy}
        }).then((post) => {
            res(post);
        }).catch((err) => {
            rej("no results returned" + err);
        })
    });
}

module.exports.getPostsByMinDate = (minDateStr) => {
    return new Promise((res, rej) => {
        Post.findAll({
            where: {[gte]: new Date(minDateStr)}
        }).then((post) => {
            res(post);
        }).catch((err) => {
            rej("no results returned" + err);
        })
    });
}

module.exports.getPostById = (idd) => {
    return new Promise((res, rej) => {
        Post.findAll({
            where: {id: idd}
        }).then((post) => {
            res(post[0]);
        }).catch((err) => {
            rej("no results returned" + err);
        })
    });
}

module.exports.getPublishedPostsByCategory = (category) => {
    return new Promise((res, rej) => {
        Post.findAll({
            where: {category: category, published: true}
        }).then((post) => {
            res(post);
        }).catch((err) => {
            rej("no results returned" + err);
        })
    });
}