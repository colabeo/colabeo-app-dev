var passport = require('passport');
var locomotive = require('locomotive');
var Controller = locomotive.Controller;
var Parse = require('parse').Parse;
var Utils = require('../models/lib/utils.js');
var YammerConnector = require('../models/lib/social-connectors/yammer-social-connector.js');

var MainPanelController = new Controller();

MainPanelController.fail = function() {
    console.log('fail!');
    this.res.send('fail!');
}

MainPanelController.show = function() {
    var self=this;
    if (!this.req.isAuthenticated()) {
        if (this.req.cookies['parse.token']) {
            var token=this.req.cookies['parse.token'];
            console.log("@mainpanel.show() - Token from cookie: " + token);
            Parse.User.become(token, function(user) {
                if (user) {
                    // set session cookie & render page
                    user.attributes.access_token=user._sessionToken; // pass on token
                    self.req.session.passport.user=Utils.makeupSessionUser(user);
                    self.req.user=user; // make-up passport authentication
                    console.log('@mainpanel.show() - req.session.passport.user:')
                    console.log(self.req.session.passport.user);
                    Utils.setSessionCookie(self.res, 'user', self.req.user);
                    self.render();
                }
                else {
                    console.log('@mainpanel.show() - Error occur when trying to retrive parse user from token!');
                    self.res.redirect('/login');
                }
            });
            return;
        }
        else
            return this.res.redirect("/login");
    }


    console.log("@mainpanel.show() - user = " + this.req.user.id + ' email= ' + this.req.user.get("email"));
    //this.req.session.passport.user=Utils.makeupSessionUser(this.req.user);    // no longer needed, since passport.serializeUser does the same thing.
    /**
     * Setting up cookies
     */
    if (this.req.session.remember_me=='on') {
        console.log('@mainpanel.show() - Remember Me is checked, setting up cookies...')
        this.res.cookie('parse.token', this.req.user._sessionToken, {expires: new Date(Date.now() + COOKIE_LIFECYCLE), httpOnly: true});
        delete this.req.session.remember_me;
    }
    Utils.setSessionCookie(this.res, 'user', this.req.user);
    console.log('@mainpanel.show() - req.session.passport.user:')
    console.log(self.req.session.passport.user);
    this.render();
}

MainPanelController.famous = function() {
    Utils.print();
    if (!this.req.isAuthenticated())
        return this.res.redirect("/login");
    //this.user = this.req.user;
    this.render('famous');
}

module.exports = MainPanelController;