var https = require('https');

/**
 * `Strategy` constructor.
 *
 * @api public
 */
function SocialConnector() {
}

SocialConnector.prototype.invoke = function(options, accessToken, apiPath, done) {

    var buffer = ''; //this buffer will be populated with the chunks of the data received from facebook
    var request = https.get(options, function(result){
        result.setEncoding('utf8');
        result.on('data', function(chunk){
            buffer += chunk;
        });

        result.on('end', function(){
            done(buffer);
        });
    });

    request.on('error', function(e){
        console.log('error from getData: ' + e.message)
    });

    request.end();
}

SocialConnector.prototype.getData = function(accessToken, apiPath, callback) {
    throw new Error('SocialConnector#getData must be overridden by subclass');
}

module.exports = SocialConnector;