var Firebase = require('firebase');
var FirebaseTokenGenerator = require("firebase-token-generator");

var FIREBASE_URL = 'https://koalalab-berry.firebaseio.com/';
var YOUR_FIREBASE_SECRET = 'EyziaFZwrpPxf8GoUOPsci9u6DCZhVzRhCjJX9VZ';

var tokenGenerator = new FirebaseTokenGenerator(YOUR_FIREBASE_SECRET);
var AUTH_TOKEN = tokenGenerator.createToken({some: "arbitrary", data: "here"});

serverRootRef = new Firebase(FIREBASE_URL); // this is the global Firebase object
// Log me in
serverRootRef.auth(AUTH_TOKEN, function(error) {
    if(error) {
        console.log("Firebase Login Failed!", error);
    } else {
        console.log("Firebase Login Success!");
    }
});