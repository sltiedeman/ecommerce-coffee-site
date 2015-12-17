var express = require('express');
var passport = require('passport');
var nodemailer = require('nodemailer');
var Account = require('../models/account');
var router = express.Router();
var vars = require('../config/vars.json');
var stripe = require('stripe');


//////////////////HOME PAGE GET/////////////////////
router.get('/', function(req, res, next){
	res.render('index', {username : req.session.username});
})

///////////////////REGISTER GET/////////////////////
router.get('/register', function(req, res, next){
	if (req.query.failedtoregister){
		res.render('register', {failed: "You must enter a password and username that does not exist"})
	}
	res.render('register');

});


//////////////////REGISTER POST/////////////////////
router.post('/register', function(req,res,next){
	Account.register(new Account({
		username: req.body.username
	}),
	req.body.password,
	function(error, account){
		if(error){
			console.log("----------------------");
			console.log(error);
			return res.redirect('/register?failedtoregister=1');
		}
		passport.authenticate('local')(req, res, function(){
			req.session.username = req.body.username;
			res.redirect('/choices')
		});
		
	});
});

router.get('/login', function(req, res, next){
	if(req.session.username){
		//will change to choices one this page exists
		res.redirect('/');
	}
	if(req.query.failedlogin){
		res.render('login', {failed: "Your username or password are incorrect."});
	}
	res.render('login');
});



router.post('/login', function(req, res, next){

	passport.authenticate('local', function(err,user,info){
		//program will still work without this code
		if (err) {
			return next(err); // will generate a 500 error
		}
		// generate a JSON response refelecting authentication status
		if (! user) {
			return res.redirect('/login?failedlogin=1');
		}
		if(user){
			//serialize and deserialize aren't mandatory
			passport.serializeUser(function(user,done){
				console.log("serializing" + user.username);
				done(null, user);
			});

			passport.deserializeUser(function(obj, done){
				console.log("deserializing " + obj);
				done(null, obj);
			})
			req.session.username = user.username;
			req.session.quarterPounds = user.quarterPounds;
			req.session.grind = user.grind;
			req.session.frequency = user.frequency;
			// return res.render('choices',{username: req.session.username, quarterPounds: req.session.quarterPounds, grind: req.session.grind, frequency: req.session.frequency});
			return res.redirect('/choices');
		}
		
	})(req,res,next);	
});


router.get('/logout', function(req, res, next){
	req.session.destroy();
	res.redirect('/');
})


//-----------------------GET CHOICES---------------------//

router.get('/choices', function(req, res, next){
	//Make sure the user is logged in!!

	if(req.session.username){
		//They do belong here.  Proceed with page
		//Check and see if they have any set preferences already.
		Account.findOne(
			{username: req.session.username},
			function (err, doc){
				console.log(doc);
				var currGrind = doc.grind ? doc.grind : undefined;
				var currFrequency = doc.frequency ? doc.frequency : undefined;
				var currQuarterPounds = doc.quarterPounds ? doc.quarterPounds : undefined;
				res.render('choices', {username: req.session.username, grind: currGrind, frequency: currFrequency, quarterPounds: currQuarterPounds });
		});
		
	}else{
		res.redirect('/');
	}
});

router.post('/choices', function(req, res, next){
	if(req.session.username){
		Account.findOne({username: req.session.username});
		// function (err, doc){
		// 	//when data exists, find it here
		// 	var grind = doc.grind;
		// 	var frequency = doc.frequency;
		// 	var pounds = doc.quarterPounds;
		// });
		var newGrind = req.body.grind;
		var newFrequency = req.body.frequency;
		var newPounds = req.body.quarterPounds;

		Account.findOneAndUpdate(
			{ username: req.session.username },
			{ grind: newGrind, frequency: newFrequency, quarterPounds: newPounds },
			{ upsert: true },		
			function(err,account){
				if (err) {
					res.send("There was an error saving your preferences" + err);
				}else{
					account.save;
				}
			}

		)
		// res.render('shipping', {username: req.session.username});
		res.redirect('/shipping');
	}
});

router.get('/shipping', function(req, res, next){
	if(req.session.username){
		Account.findOne(
			{username: req.session.username},
			function (err, doc){
				console.log(doc);
				var currFullName = doc.fullName ? doc.fullName : "";
				var currAddress1 = doc.address1 ? doc.address1 : "";
				var currAddress2 = doc.address2 ? doc.address2 : "";
				var currCity = doc.city ? doc.city : "";
				var currState = doc.state ? doc.state : "";
				var currZipCode = doc.zipCode ? doc.zipCode : "";
				var currDeliveryDate = doc.deliveryDate ? doc.deliveryDate : "";
				res.render('shipping', {username: req.session.username, fullName: currFullName, address1: currAddress1, address2: currAddress2, city: currCity, state: currState, zipCode: currZipCode, deliveryDate: currDeliveryDate });
		});
	}else{
		res.redirect('/');
	}
});

router.post('/shipping', function(req, res, next){
	if(req.session.username){
		// Account.findOne({username: req.session.username});
		// function (err, doc){
		// 	//when data exists, find it here
		// 	var grind = doc.grind;
		// 	var frequency = doc.frequency;
		// 	var pounds = doc.quarterPounds;
		// });
		var newFullName = req.body.fullName;
		var newAddress1 = req.body.address1;
		var newAddress2 = req.body.address2;
		var newCity = req.body.city;
		var newState = req.body.state;
		var newZipCode = req.body.zipCode;
		var newDeliveryDate = req.body.deliveryDate;
		Account.findOneAndUpdate(
			{ username: req.session.username },
			{ fullName: newFullName, address1: newAddress1, address2: newAddress2, city: newCity, state: newState, zipCode: newZipCode, deliveryDate: newDeliveryDate},
			{ upsert: true },		
			function(err,account){
				if (err) {
					res.send("There was an error saving your preferences" + err);
				}else{
					account.save;
				}
			}

		)
		// res.render('shipping', {username: req.session.username});
		res.redirect('/payment');
	}
})

router.get('/payment', function(req, res, next){
	if(req.session.username){
		Account.findOne(
			{username: req.session.username},
			function (err,doc){
				var currGrind = doc.grind ? doc.grind : "N/A";
				var currFrequency = doc.frequency ? doc.frequency : "N/A";
				var	currQuarterPounds = doc.quarterPounds ? doc.quarterPounds: "N/A";
				var currFullName = doc.fullName ? doc.fullName : "N/A";
				var currAddress1 = doc.address1 ? doc.address1 : "N/A";
				var currAddress2 = doc.address2 ? doc.address2 : "N/A";
				var currCity = doc.city ? doc.city : "N/A";
				var currState = doc.state ? doc.state : "N/A";
				var currZipCode = doc.zipCode ? doc.zipCode : "N/A";
				var currDeliveryDate = doc.deliveryDate ? doc.deliveryDate : "N/A";
				var unalteredCharge = currQuarterPounds * 19.99;
				var totalCharge = (unalteredCharge + 5.95).toFixed(2);
				var currCharge = unalteredCharge.toFixed(2);
				res.render('payment', {username: req.session.username, grind: currGrind, 
					frequency: currFrequency, quarterPounds: currQuarterPounds, 
					fullName: currFullName, address1: currAddress1, address2: currAddress2, 
					city: currCity, state: currState, zipCode: currZipCode, 
					deliveryDate: currDeliveryDate, charge: currCharge, totalCharge : totalCharge, key: vars.key });

			});
	};
})

router.post('/payment', function(req, res, next){
	var stripe = require("stripe")(
	  "sk_test_NWYwCkzv8zQo8EYerx33QyXW"
	);

	var charge = req.body.totalCharge;
	console.log('----------------------------');
	console.log(charge);

	stripe.charges.create({
	  amount: 400,
	  currency: "usd",
	  source: "tok_17J6tgH48VAk7X4Me07EEUjm", // obtained with Stripe.js
	  description: "Charge for test@example.com"
	}, function(err, charge) {
	  // asynchronously called
	});
	res.redirect('/');
})

router.get('/account', function(req, res, next){
	if(req.session.username){
		Account.findOne(
			{username: req.session.username},
			function (err, doc){
				var currGrind = doc.grind ? doc.grind : "N/A";
				var currFrequency = doc.frequency ? doc.frequency : "N/A";
				var	currQuarterPounds = doc.quarterPounds ? doc.quarterPounds: "N/A";
				var currFullName = doc.fullName ? doc.fullName : "N/A";
				var currAddress1 = doc.address1 ? doc.address1 : "N/A";
				var currAddress2 = doc.address2 ? doc.address2 : "N/A";
				var currCity = doc.city ? doc.city : "N/A";
				var currState = doc.state ? doc.state : "N/A";
				var currZipCode = doc.zipCode ? doc.zipCode : "N/A";
				var currDeliveryDate = doc.deliveryDate ? doc.deliveryDate : "N/A";
				res.render('account', {username: req.session.username, 
					grind: currGrind, frequency: currFrequency, quarterPounds: currQuarterPounds, 
					fullName: currFullName, address1: currAddress1, address2: currAddress2, 
					city: currCity, state: currState, zipCode: currZipCode, 
					deliveryDate : currDeliveryDate});
		});
	}else{
		res.redirect('/');
	}
})

router.post('/cancellation', function(req, res, next){
	if(req.session.username){
		Account.findOneAndRemove(
			{username: req.session.username},
			{},
			function(err,user){
				
			}
		);
		req.session.destroy();
		res.redirect('/');
	}else{
		res.redirect('/cancellation');
	}
})

router.get('/cancellation', function(req, res, next){
	res.render('cancellation');
})

router.get('/email', function(req, res, next){
	var transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: vars.email,
			pass: vars.password
		}
	})
	var text = "This is a test email sent from my node server";
	var mailOptions = {
		from: 'Stephen Tiedemann <sltiedeman@gmail.com>',
		to: 'Stephen Tiedemann <sltiedeman@gmail.com>',
		subject: 'This is a test subject',
		text: text
	}

	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			console.log(error);
			res.json({response: error});
		}else{
			console.log("Message was successfully sent.  Response was " + info.response);
			res.json({response: "success"});
		}
	})
});

router.get('/contact', function(req, res, next){
	res.render('contact');
})

module.exports = router;
