var passport = require('passport');
var Parse = require('parse').Parse;
var locomotive = require('locomotive');
var Controller = locomotive.Controller;
var AjaxController = new Controller();
var Utils = require('../models/lib/utils.js');

/**
 * Returns social network status
 */
AjaxController.checkStatus = function() {
    if (!this.req.session.passport.user)
        return; // Let it fail.
    console.log('@AjaxController.checkStatus - called');
    if (this.req.session.passport.user.accounts)
        return this.res.json(this.req.session.passport.user.accounts);
    else
        return this.res.json({});
}

module.exports = AjaxController;