var express = require('express');
var router = express.Router();
var moment = require('moment');
var databaseHelper = require("./../helpers/databaseHelper");



router.get('/:userId',function(req,res,next){
  var userId = req.params.userId;
  var page = req.query.page;
  var limit = req.query.limit;
  var skip = page > 0 ? ((page - 1) * limit) : 0;



  var queryString = 'SELECT * FROM "Posts" WHERE user_id =\''+ userId +'\' ORDER BY updated_at DESC'+' LIMIT '+ limit+' OFFSET ' + skip;
  console.log(queryString);

  databaseHelper.queryDB(queryString ,function(err,results){
    if(err){
        console.log(err);
    }

    if(results){
    	  res.json(results.rows);
        // console.log(results.rows);
    }
  });
});

router.get('/',function(req,res,next){
  var userId = req.query.userId;
  var page = req.query.page;
  var limit = req.query.limit;
  var skip = page > 0 ? ((page - 1) * limit) : 0;



  //var queryString = 'SELECT * FROM "Posts" WHERE user_id =\''+ userId +'\' LIMIT '+ limit+' OFFSET ' + skip;
  var queryString = "SELECT * FROM \"Posts\" WHERE user_id IN (SELECT following_id FROM \"User_Followers\" WHERE user_id = "+userId+") OR user_id = "+userId+" ORDER BY updated_at DESC LIMIT "+limit+"OFFSET "+ skip;
  console.log(queryString);

  databaseHelper.queryDB(queryString ,function(err,results){
    if(err){
        console.log(err);
    }

    if(results){
        res.json(results.rows);
        // console.log(results.rows);
    }
  });
});

/* GET home page. */
router.post('/create', function(req, res, next) {
  console.log(req.body);
  var message = req.body.message;
  var userId = req.body.userId;
  var todayDate = moment(new Date()).format();
  
  var queryString = 'INSERT INTO "Posts"(user_id, message, created_at, updated_at) VALUES ('+userId+',\''+message+'\',\''+todayDate+'\',\''+todayDate+'\')';
    console.log(queryString);

	databaseHelper.queryDB(queryString ,function(err,results){
	    if(err){
	        console.log(err);
	    }

	    if(results){
	        console.log(results);
	        if(results.rowCount > 0){
	            res.json({ 
	                message: message,
	                status: "Message Posted"
	            });    
	        }else if (results.rowCount == 0) {
	            res.json({ 
	                message: message,
	                status: 'Something went wrong in verification!' 
	            }); 
	        }
	    }
	});

});

module.exports = router;
