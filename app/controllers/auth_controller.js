var passport = require('passport');
var Parse = require('parse').Parse;
var locomotive = require('locomotive');
var Controller = locomotive.Controller;
var AuthController = new Controller();
var Utils = require('../models/lib/utils.js');

function closeWindow(res) {
    res.send("<script>window.close()</script>");
}

AuthController.deAuthFacebook = function() {
    console.log('@AuthController.deAuthFacebook() - called');
    // clean req,user
    if (this.req.user.accounts && this.req.user.accounts.facebook) {
        delete this.req.user.facebook;
    }
    // clean session
    if (this.req.session.passport.user.accounts && this.req.session.passport.user.accounts.facebook) {
        delete this.req.session.passport.user.accounts.facebook;
    }
    // unlink from current Parse user
    if (Parse.FacebookUtility.isLinked()) {
        Parse.FacebookUtility.unlink();
    }
    // TODO: add is Empty check
    return this.res.json('done');
}

AuthController.authFacebook = function() {
    Parse.FacebookUtility.logIn(this, {
        success: function(authData) {
            console.log("@AuthController.authFacebook() - facebook auth done!");
            console.log(this.req.session);  // this session haven't update yet
            if (!Parse.User.current()) {
                console.log('@AuthController.authFacebook() - You haven\'t logged in to Parse yet!');
                return;
            }
            Parse.FacebookUtility.link(authData);
            console.log('@AuthController.authFacebook() - Is Linked: ' +Parse.FacebookUtility.isLinked());
            console.log('@AuthController.authFacebook() - Query for ' + authData.id + ' : ');
            /**
             * NOTE:
             * If a user is newly authenticated, there won't be any data shown on query,
             * because Parse haven't save it yet.
             */
            Parse.FacebookUtility.query(authData.id, function(user_array) {
                console.log(user_array);
            });
        },
        error: function(err) {
            console.log(err);
        }
    });
}

/**
 * When user done login at facebook.com, pass the credentials to a custom callback route,
 * then passport authenticate those credentials locally to determine whether it is a success.
 *
 * When user complete login on facebook.com, the thread will go back to AuthController.authFacebook()
 * as a callback.
 */

AuthController.before('callbackFacebook', passport.authenticate('facebook', { failureRedirect: '/fail' }));
AuthController.callbackFacebook = function() {
    console.log('@AuthController.callbackFacebook() - facebook callback');
    var key=this.req.session.key;
    var promise=Utils.findObjectWithKey(key);
    Utils.removeObjectWithKey(key);
    delete this.req.session.key;
    promise.resolve(this.req.user.accounts.facebook);
    closeWindow(this.res);
}

module.exports = AuthController;