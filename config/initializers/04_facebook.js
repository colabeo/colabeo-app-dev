var passport = require('passport');
var Parse = require('parse').Parse;
var Utils = require('../../app/models/lib/utils.js');

module.exports = function () {
    Parse.FacebookUtility = {
        /**
         * Gets whether the user has their account linked to Facebook.
         * @param user  - Parser.User
         */
        isLinked: function(user) {
            user = user || Parse.User.current();
            return !!user.attributes.facebook;
        },

        /**
         * Pops up a window and let user login to social networks, creates entry to Parse.
         * @param callee - locomotive controller, something with a req/res...
         */
        logIn: function(callee, options) {
            var promise=new Parse.Promise();
            var key=Utils.generateUniqueKey();
            callee.req.session.key=key;
            Utils.storeObjectWithKey(promise, key);
            passport.authenticate('facebook')(callee.__req, callee.__res, callee.__next);
            promise.done(function(result) {
                if (options.success && result.id)
                    options.success.call(callee, result);
                else
                    options.error.call(callee, result);
            });
        },

        query: function(subString, callback) {
            var query = new Parse.Query(Parse.User);
            query.contains('facebook', subString);
            query.find({
                success: function (result_array) {;
                    callback(result_array);
                },
                error: function(err) {
                    throw (err);
                }
            });
        },

        link: function(result, user) {
            user = user || Parse.User.current();
            if (Parse._.isString(result))
                user.set('facebook', result);
            else
                user.set('facebook', JSON.stringify(result));
            user.save();
        },

        /**
         * logout from this social network, delete entry from Parse.
         */
        unlink: function(user) {
            user = user || Parse.User.current();
            user.unset('facebook');
            user.save();
        }
    }
}


//console.log(Parse);