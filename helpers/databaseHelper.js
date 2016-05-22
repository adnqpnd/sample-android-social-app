var config = require('./../config');
var pg = require('pg');

console.log(config.database);
var conString = "postgres://"+config.database.username+":"+config.database.password+"@"+config.database.hostname+"/"+config.database.dbname;

//TODO Implement Callback

module.exports = {
    queryDB: function(queryString,callback){
        pg.connect(conString, function(err, client, done) {
            if(err) {
                callback(err,null);
                console.error('error running query', err);
            }
            client.query(queryString, function(err, result) {
                done();

                if(err) {
                    callback(err,null);
                    console.error('error running query', err);
                }

                callback(null,result);
            });
        });
    }
}
