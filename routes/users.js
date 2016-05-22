var express = require('express');
var router = express.Router();
var databaseHelper = require("./../helpers/databaseHelper");
var tokenHelper = require("./../helpers/tokenHelper");
var emailHelper = require("./../helpers/emailHelper");
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var async = require('async');
var moment = require('moment');

/* Register user. */
router.post('/register', function(req, res, next) {
    console.log(req.body);
    var emailAddress = req.body.emailAddress;
    var username = req.body.username;
    var password = req.body.password;
    var token = crypto.randomBytes(64).toString('hex');

    registerUser(emailAddress,username,password,token,res);
});

/* Register user. */
router.get('/verify', function(req, res, next) {
    console.log(req.query.email);
    console.log(req.query.token);
    
    var email = req.query.email;
    var token = req.query.token;

    var queryString = 'UPDATE "Users" SET status = \'1\' WHERE email_address = \''+email+'\' AND verification_token = \''+token+'\' AND status = \'0\'';
    console.log(queryString);

    databaseHelper.queryDB(queryString ,function(err,results){
        if(err){
            console.log(err);
        }

        if(results){
            console.log(results);
            if(results.rowCount > 0){
                res.json({ 
                    verified: true, 
                    message: 'Account verified!' 
                });    
            }else if (results.rowCount == 0) {
                res.json({ 
                    verified: false, 
                    message: 'Something went wrong in verification!' 
                }); 
            }
        }
    });
});

/* Register user. */
router.post('/check-username', function(req, res, next){
    console.log(req.body);
    var username = req.body.username;

    var queryString = 'SELECT username FROM "Users" WHERE username =\''+ username +'\'';
    
    databaseHelper.queryDB(queryString ,function(err,results){
        if(err){
            console.log(err);
        }

        if(results){
            if(results.rowCount > 0){
                res.json({ 
                    hasUsername: true, 
                    message: 'Username already exist!' 
                });    
            }else if (results.rowCount == 0) {
                res.json({ 
                    hasUsername: false, 
                    message: 'Valid username!' 
                }); 
            }
        }
    });
});

/* Register user. */
router.post('/check-email-address', function(req, res, next) {
    console.log(req.body);
    var emailAddress = req.body.emailAddress;
    
    var queryString = 'SELECT email_address FROM "Users" WHERE email_address =\''+ emailAddress +'\'';
    
    databaseHelper.queryDB(queryString ,function(err,results){
        if(err){
            console.log(err);
        }

        if(results){
            if(results.rowCount > 0){
                res.json({ 
                    hasEmailAddress: true, 
                    message: 'Email address already exist!' 
                });    
            }else if (results.rowCount == 0) {
                res.json({ 
                    hasEmailAddress: false, 
                    message: 'Valid email address!' 
                }); 
            }
        }
    });
});

/* Sign in user. */
router.post('/authenticate', function(req, res, next) {
    console.log(req.body);
    var username = req.body.username;
    var password = req.body.password;

    console.log("Username = " + username);
    console.log("Password = " + password);

    var queryString = 'SELECT * FROM "Users" WHERE username =\''+ username +'\'';

    console.log("Query String = " + queryString);

    databaseHelper.queryDB(queryString ,function(err,results){
        if(err){
            console.log(err);
        }

        if(results.rowCount == 0){
            res.json({ 
                success: false, 
                message: 'Wrong username or password.' 
            });
        }else if(results.rowCount == 1){
            bcrypt.compare(password, results.rows[0].password, function(err, bcryptRes) {
                console.log(bcryptRes);
                if(bcryptRes === true){
                    var user = {
                        id: results.rows[0].id,
                        username : results.rows[0].username,
                        status: results.rows[0].status
                    };

                    if(user.status == 0){
                        res.json({ 
                            success: false, 
                            message: 'Verify your account!' 
                        });
                    }else if (user.status == 1) {
                        res.json({ 
                            success: true, 
                            token: tokenHelper.generateToken(user),
                            message: 'Login successful!' 
                        }); 
                    };
                }else{
                    res.json({ 
                        success: false, 
                        message: 'Wrong username or password.' 
                    });
                }
            });
        }
    });
});

/* Forgot Password*/
router.post('/forgot',function(req,res,next){
    var emailAddress = req.body.emailAddress;
    var queryString = 'SELECT email_address FROM "Users" WHERE email_address =\''+ emailAddress +'\'';
    var token = crypto.randomBytes(64).toString('hex');
        
        databaseHelper.queryDB(queryString ,function(err,results){
            if(err){
                console.log(err);
            }

            if(results){
                if(results.rowCount > 0){
                    var expirationDate = moment(new Date()).add(5,'m').format();

                    var queryString = "UPDATE \"Users\" SET reset_password_token='"+token+"', reset_password_time='"+expirationDate+"' WHERE email_address ='"+emailAddress+"'";
                    
                    databaseHelper.queryDB(queryString ,function(err,results){
                        if(err){
                            console.log(err);
                        }

                        if(results){
                            if(results.rowCount > 0){
                               var mailOptions = {
                                   from: 'noreply@sample.com',
                                   to: emailAddress,
                                   subject: 'Test send mail',
                                   text: 'Hello Mail!',
                                   html: '<b>Please click this link to reset your password:</b><br> <a href="http://localhost:3000/api/users/reset/'+token+'"> http://localhost:3000/api/users/reset/'+token+'</a> </br> <p>If you did not request this, please ignore this email and your password will remain unchanged.<p>'
                                };

                                emailHelper.sendMail(mailOptions,function(err,results){
                                    if(err){
                                        console.log(err);
                                     }

                                    if(results){
                                        console.log(results);
                                       res.json({ 
                                            success: true, 
                                            message: 'To reset password , please check your email address!' 
                                        });
                                    }
                                });
                            }
                        }
                    });
                    
                }else if (results.rowCount == 0) {
                    res.json({ 
                        success: false, 
                        message: 'Email address do not exist!' 
                    }); 
                }
            }

        });
});

router.get('/reset/:token',function(req,res,next){
  var resetToken = req.params.token;
  var dateNow = moment(new Date());

  var queryString = 'SELECT id FROM "Users" WHERE reset_password_token =\''+ resetToken +'\' AND reset_password_time > now()';

  databaseHelper.queryDB(queryString ,function(err,results){
    if(err){
        console.log(err);
    }

    if(results){
        if(results.rowCount > 0){
           res.json({ 
                success: true, 
                message: 'Can reset password.' 
            }); 
        }else if (results.rowCount == 0) {
            res.json({ 
                success: false, 
                message: 'Password reset token is invalid or has expired.' 
            }); 
        }
    }
  });
});


router.post('/reset/:token',function(req,res,next){
  var resetToken = req.params.token;
  var dateNow = moment(new Date());
  var password = req.body.password;

  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
        if(err){
          console.log(err);
        }    

        var queryString = 'UPDATE "Users" SET password = \''+ hash +'\' WHERE reset_password_token =\''+ resetToken +'\' AND reset_password_time > now()';

          databaseHelper.queryDB(queryString ,function(err,results){
            if(err){
                console.log(err);
            }

            if(results){
                if(results.rowCount > 0){
                    var queryString = 'SELECT email_address FROM "Users" WHERE reset_password_token =\''+ resetToken +'\'';
                    databaseHelper.queryDB(queryString ,function(err,results){
                        if(err){
                            console.log(err);
                        }

                        console.log(results);


                        if(results){
                          if(results.rowCount > 0){
                            var emailAddress = results.rows[0].email_address;

                            var mailOptions = {
                                  from: 'noreply@sample.com',
                                  to: emailAddress,
                                  subject: 'Test send mail',
                                  text: 'Hello Mail!',
                                  html: '<b>This is a confirmation that the password for your account ' + emailAddress + ' has just been changed.</b>'
                                };

                                emailHelper.sendMail(mailOptions,function(err,results){
                                   if(err){
                                       console.log(err);
                                   }

                                   if(results){
                                       console.log(results);    
                                   }
                            });

                          }
                        }
                    });
                    res.json({ 
                        success: true, 
                        message: 'Password was successfully changed.' 
                    });

                }else if (results.rowCount == 0) {
                    res.json({ 
                        success: false, 
                        message: 'Password reset token is invalid or has expired.' 
                    }); 
                }
            }
        });
    });
  }); 

});

/* Insert new user in DB. */
function registerUser(emailAddress,username,password,token,res){

    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            var queryString = 'INSERT INTO "Users" (email_address,username,password,verification_token) VALUES (\''+emailAddress+'\',\''+username+'\',\''+hash+'\',\''+token+'\')';

            console.log("Query String = " + queryString);

            databaseHelper.queryDB(queryString ,function(err,results){
                if(err){
                    console.log("insertUser error: " + err);
                    if(err.constraint === 'unique_username'){
                        res.json({ 
                            success: false, 
                            message: 'Username already exist!' 
                        }); 
                    }else if (err.constraint === 'unique_email_adress') {
                        res.json({ 
                            success: false, 
                            message: 'Email already exist!' 
                        });
                    }else{
                        console.log(err);
                    }

                }

                if(results){

                    var mailOptions = {
                      from: 'noreply@sample.com',
                      to: emailAddress,
                      subject: 'Test send mail',
                      text: 'Hello Mail!',
                      html: '<b>Please click this link to activate your account:</b> <br> <a href="http://localhost:3000/api/users/verify?email=' + emailAddress + '&token=' + token + '">http://localhost:3000/api/users/verify?email=' + emailAddress + '&token=' + token + '</a>'
                    };

                    emailHelper.sendMail(mailOptions,function(err,results){
                       if(err){
                           console.log(err);
                       }

                       if(results){
                           console.log(results);    
                       }
                    });

                    console.log(" insertUser results: " + results);
                    if(results.command === 'INSERT' && results.rowCount === 1){
                        res.json({ 
                            success: true, 
                            message: 'Registration successful!' 
                        });
                    } 

                }
         
            });  
        });
    }); 
};



module.exports = router;
