var passport = require('passport')
    , FacebookStrategy = require('passport-facebook').Strategy
var LocalStrategy = require('passport-local').Strategy;
var Account = require('../../app/models/account');
var Utils = require('../../app/models/lib/utils.js');

var Parse = require('parse').Parse;

module.exports = function () {
    /**
     * Facebook local authentication process, add credentials Parse.User.current()
     */
    passport.use(new FacebookStrategy({
            clientID: FACEBOOK_APP_ID,
            clientSecret: FACEBOOK_APP_SECRET,
            callbackURL: HOST_SERVER_URL + "/callback/facebook",
            passReqToCallback: true
        },
        function (req, facebookAccessToken, refreshToken, profile, done) {
            console.log('Facebook local authentication...');
            var account={
                provider: 'facebook',
                id: profile.id,
                access_token: facebookAccessToken
            }
            if (!req.user) { req.user={}; }
            if (!req.user.accounts) { req.user.accounts={}; }
            req.user.accounts.facebook=account; // This will be the current facebook user, differ from session facebook user, which is binding to Parse user.
            done(null, req.user);
        }
    ));

    // Use the LocalStrategy within Passport.
    passport.use(new LocalStrategy({
            //usernameField: 'email'
            passReqToCallback: true
        },
        function (req, email, password, done) {
            console.log("email - " + email);
            console.log("password - " + password);
            Parse.User.logIn(email, password, {
                success: function (user) {
                    if (req.body.RememberMe)
                        req.session.remember_me = req.body.RememberMe;

                    if (user.get("emailVerified"))
                        return done(null, user);
                    else {
                        var message = "email is not verified.";
                        return done(null, false, message);
                    }

                },
                error: function (user, error) {
                    console.log("login - error" + JSON.stringify(error));
                    return done(null, false, error.message);
                }
            });
        }
    ));

    // setup req.session.passport.user
    passport.serializeUser(function (user, done) {
        console.log("Serialize User..");
        var session_user=Utils.makeupSessionUser(user);
        //console.log(' - ', session_user);
        done(null, session_user); // TODO: pass facebook id as well
    });

    // repopulate req.user
    passport.deserializeUser(function (obj, done) {
        console.log('De-serialize User..');
        //console.log(' - ', obj);
        Parse.User.become(obj.access_token, function(user) {
            done(null, user);   // If no access_token provided or access_token is invalid, user will be Parse.User.current() as default.
        });
    });
}