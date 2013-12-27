var locomotive = require('locomotive');
var Controller = locomotive.Controller;

var Parse = require('parse').Parse;

var ContactsController = new Controller();

ContactsController.add = function() {

    var newContact = {
        email : this.param("email"),
        lastname : this.param("lastName"),
        firstname : this.param("firstName")
    };

    var user = this.req.user;

    user.initFirebaseRef = function(uid, serverRootRef) {
        var self=this;
        this.fireBaseRef = serverRootRef.child('users').child(uid);
        this.fireBaseIndexRef=serverRootRef.child('index');
        this.fireBaseContactRef=this.fireBaseRef.child('contacts');
        this.fireBaseRef.child('email').once('value', function(snapshot) {
            if (snapshot.val()==null || snapshot.val()=='unknown')
            {
                if (self.attributes.email)
                {
                    console.log('Init user FirebaseRef, email=' + self.attributes.email)
                    self.fireBaseRef.update({email: self.attributes.email});
                }
                else
                {
                    console.log('Init user FirebaseRef, email=unknown')
                    self.fireBaseRef.update({email: 'unknown'});
                }
            }
        });
    };

    user.importContactByEmail = function(newContact, done) {
        var self = this;
        this.fireBaseContactRef.once('value', function (snapshot) {
            var contactList = snapshot.val();
            var conflict = false;
            for (var id in contactList) {
                console.log("contact in contactList" + JSON.stringify(id));
                if (contactList[id].email == newContact.email) {
                    conflict = true;
                }
            }

            if (!conflict) {
                console.log("new Contact" + JSON.stringify(newContact));
                self.fireBaseContactRef.push(newContact, function () {
                    console.log('contact added!');
                    var query = new Parse.Query(Parse.User);
                    query.equalTo( "email", newContact.email);  // find all the same user
                    query.first({
                        success: function(results) {
                            //console.log("Results" + JSON.stringify(results));
                            if ( results == undefined )  {
                                sendInviteEmail(user, newContact, function(json) {
                                    done(json);
                                });
                            }
                            else {
                                sendContactNotification(user, newContact, function(json) {
                                    done(json);
                                });
                            }
                        }
                    }); //End Query.first
                });
            } else {

            }
        });
    };

    console.log('/contact/add - this.res.user', this.req.user);
    console.log('/contact/add - Parse.User.current()', Parse.User.current());

    var self = this;

    user.initFirebaseRef(user.id, serverRootRef);
    user.importContactByEmail(newContact, function(json) {
        self.res.json(json);
    });
};

var sendInviteEmail = function(user, newContact,done) {
    var subject = user.get("firstname") + " has just invited you to chat with Colabeo";
    var text = "Hi " + newContact.firstname + ",\n\n" + user.get("firstname") + " has just invited you to use Colabeo. Please click on this link to add Colabeo extension to your chrome browser: www.colabeo.com/install.html Talk to you soon!";
    var to = newContact.email;
    var from = user.get("email");
    sendEmail(to,from,subject,text,done);
};

var sendContactNotification = function(user,newContact,done) {
    var subject = user.get("firstname") + " has just added you their contact list. Start calling today!"
    var text = "Hi " + newContact.firstname + ",\n\n" + user.get("firstname") + " has just added you to their Colabeo contact list. Open your browser and call them back."
    var to = newContact.email;
    var from = user.get("email");
    sendEmail(to,from,subject,text,done);
};

var sendEmail = function(to,from,subject,text,done) {
    var API_USERNAME = "chapman";
    var API_PASSWORD = "qwerty23";

    var sendgrid  = require('sendgrid')(API_USERNAME, API_PASSWORD);

    var smtpapiHeaders = new sendgrid.SmtpapiHeaders();
    smtpapiHeaders.addFilterSetting('subscriptiontrack', 'enable', '0');
    sendgrid.send({
        smtpapi: smtpapiHeaders,
        to:       to,
        from:     from,
        subject:  subject,
        text : text
    }, function(err, json) {
        if (err) {
            console.error(err);
            done({ message : "error" });
        }
        else {
            console.log(json);
            done(json);
        }
    });
};

module.exports = ContactsController;