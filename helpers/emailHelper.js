var config = require('./../config');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
	    user: config.emailService.username,
		  pass: config.emailService.password
	}
});

module.exports = {
    sendMail: function(mailOptions,callback){
       transporter.sendMail(mailOptions,function(error,info){
         if(error){
             console.log('Error sending mail!');
             console.log(error);
             callback(error,null);  
         }else{
             console.log('Mail sent successful!');
             callback(null,info);
         } 
       });
    }
}
