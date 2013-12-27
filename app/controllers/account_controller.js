var locomotive = require('locomotive');
var passport = require('passport')
var Controller = locomotive.Controller;
var Parse = require('parse').Parse;

var Account = require('../models/account');

var AccountController = new Controller();

AccountController.show = function() {
  if (!this.req.isAuthenticated())
    return this.res.redirect(this.urlFor({ action: 'login' }));

  this.user = this.req.user;
  this.render();
};

AccountController.new = function() {
  //console.log("Is parse here? " + parseApp);
    var query = new Parse.Query(Parse.User);
    query.find({
        success: function(users) {
            for (var i = 0; i < users.length; ++i) {
                console.log(users[i].get('username'));
            }
        }
    });
  this.render();
};

AccountController.registrationForm = function() {
    var message = this.req.flash('error');
    console.log("Message from reg form " + message);
    this.render({ message : message });
};

AccountController.loginForm = function() {
  console.log("login form - authenticated - " + this.req.isAuthenticated());
  var message = this.req.flash('error');
  this.render({ message : message });
};

AccountController.forgetPasswordForm = function() {
  console.log("forget Password form loading");
  this.render();
};

AccountController.forgetPassword = function() {
    console.log("forget Password calling " + this.param('email'));
    var self = this;
    Parse.User.requestPasswordReset(this.param("email"), {
        success: function() {
            // Password reset request was sent successfully
            self.redirect('/');
        },
        error: function(error) {
            // Show the error message somewhere
            alert("Error: " + error.code + " " + error.message);
        }
    });
    
};



AccountController.create = function() {
  var account = new Account();
  console.log("shit");

  account.email = this.param('email');
  account.password = this.param('password');
  account.name.first = this.param('name.first');
  account.name.last = this.param('name.last');

  var self = this;
  account.save(function (err) {
    if (err)
      return self.redirect(self.urlFor({ action: 'new' }));

    return self.redirect(self.urlFor({ action: 'login' }));
  });
};

AccountController.signup = function() {
    var user = new Parse.User();
    user.set("lastname", this.param('lastname'));
    user.set("firstname", this.param('firstname'));
    user.set("username", this.param('email'));
    user.set("password", this.param('password'));
    user.set("email", this.param('email'));

    var self = this;
    user.signUp(null, {
        success: function(user) {
            // Hooray! Let them use the app now.
            console.log("Sign up - success");
            self.redirect('/');
        },
        error: function(user, error) {
            // Show the error message somewhere and let the user try again.
            // alert("Error: " + error.code + " " + error.message);
            self.req.flash('error', error.message);
            self.redirect('/register');
        }
    });
}

AccountController.login = function () {
    var self = this;
    passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: this.urlFor({ action: 'login' }),
            failureFlash: true
        }
    )(this.__req, this.__res, this.__next);
};

//AccountController.after('login', function(req, res, next) {
//    // TODO: The 'res' here, can not be used to set cookies, don't know why.
//    console.log('@AccountController.after(\'login\'), trying to set cookies.');
//    this.res.cookie('foo', 'bar');
//    res.cookie('foo', 'bar');
//    this.__res.cookie('foo', 'bar');
//    // None of above works..
//    if (next)
//        next();
//});

AccountController.logout = function () {
    this.req.logout();
    Parse.User.logOut();
    this.res.clearCookie('parse.token');

    this.redirect('/');
};

AccountController.importContacts = function() {
    this.redirect('/');
};

AccountController.lookup = function() {
    var externalId = this.param('externalId');
    console.log(externalId);
    var query = new Parse.Query(Parse.User);
    var self = this;
    query.equalTo("email", externalId);
    query.find({
        success: function(users) {
            console.log("user - " + JSON.stringify(users[0]));
            self.res.json({ callee :  users[0] });
        }
    });
}

module.exports = AccountController;
