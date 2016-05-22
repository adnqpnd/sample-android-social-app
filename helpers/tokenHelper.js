var config = require('./../config');
var jwt = require('jsonwebtoken');

var secret = config.secret;

module.exports = {
    generateToken: function(payload){
       var token = jwt.sign(payload, secret,{
       		expiresInMinutes: 1440 // expires in 24 hours
        });

       return token;
    },

    checkToken: function(){
    	
    }
}
