const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

var userSchema = new mongoose.Schema({
    "userName" : {
        "type": String,
        "unique": true
    },
    "password" : String,
    "email" : String,
    "loginHistory" : [{
        "dateTime" : Date,
        "userAgent" : String
    }]
})

let User; // to be defined on new connection (see initialize)

module.exports.initialize = function() {
    return new Promise((res, rej) => {
        let db = mongoose.createConnection("mongodb+srv://krinskumar2:12345678%40Kk@dbs311.8cc2ark.mongodb.net/blog?retryWrites=true&w=majority");
//mongodb+srv://<username>:<password>@dbs311.8cc2ark.mongodb.net/blog?retryWrites=true&w=majority
//mongodb+srv://krinskumar2:12345678@Kk@dbs311.8cc2ark.mongodb.net/blog
        db.on('error', (err) => {
            rej(err);  // reject the promise with the provided error
        });

        db.once('open', () => {
            User = db.model("userss", userSchema);
            res();
        });
    })
}

module.exports.registerUser = function(userData) {
    return new Promise((res, rej) => {

        if (userData.password != userData.password2) {
            rej("Passwords do not match");
        } else {
            bcrypt.hash(userData.password, 10).then((hash) => {
                userData.password = hash;
                console.log(userData);
                let newUser = new User(userData);
                newUser.save().then(() => {
                    res()
                }).catch((err) => {
                    if (err.code == 11000) {
                        rej("User Name already taken");
                    } else {
                        rej("There was an error creating the user: " + err);
                    }
                })
            }).catch((err) => {
                rej("There was an error encrypting the password");
            })
        }
    });
}

module.exports.checkUser = function(userData) {
    return new Promise((res, rej) => {
        User.find({userName: userData.userName}).exec().then((user) => {
            if (!user || user.length == 0) {
                rej("Unable to find user: " + userData.userName);
            } else {
                bcrypt.compare(userData.password, user[0].password).then((result) => {
                    if(result) {
                        user[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                        User.updateOne({userName: userData.userName}, 
                            {$set: {loginHistory: user[0].loginHistory}}   
                        ).exec().then(() => {
                            res(user[0]);
                        }).catch((err) => {
                            rej("There was an error verifying the user: " + err);
                        });
                    } else {
                        rej("Incorrect Password for user: " + userData.userName);
                    }
                }).catch((err) => {
                    rej("There was an error verifying the user: " + err);
                })
            }
        }).catch((err) => {
            rej("Unable to find user: " + userData.userName);
        });
    });
}