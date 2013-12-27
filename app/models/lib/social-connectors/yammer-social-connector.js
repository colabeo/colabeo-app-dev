var https = require('https');

var YammerConnector = function() {
}

YammerConnector.prototype.init = function(id, accessToken) {
    this.accessToken = accessToken;
    this.id=id;
}

YammerConnector.prototype.getData = function(accessToken, apiPath, callback) {
    var options = {
        host: 'www.yammer.com',
        port: 443,
        path: "/api/v1" + apiPath + '?access_token=' + accessToken,
        method: 'GET'
    };

    console.log('get data from Yammer: ' + apiPath + '?access_token=' + accessToken);
//    this.invoke(options, accessToken, apiPath, callback);
    var buffer = ''; //this buffer will be populated with the chunks of the data received from facebook
    var request = https.get(options, function(result){
        result.setEncoding('utf8');
        result.on('data', function(chunk){
            buffer += chunk;
        });

        result.on('end', function(){
            callback(buffer);
        });
    });

    request.on('error', function(e){
        console.log('error from getData: ' + e.message)
        callback();
    });

    request.end();
}

YammerConnector.prototype.getContacts = function(callback) {
    this.getData(this.accessToken, '/users.json', function(data){
        //TODO to be implemented

        // self1.userFirebaseContactRef.set(contacts);
        console.log("@User.YammerConnector.getContacts()");
        callback(data);
    });
}

module.exports = YammerConnector;