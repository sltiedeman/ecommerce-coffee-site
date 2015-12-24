var express = require('express');
var passport = require('passport');
var nodemailer = require('nodemailer');
var Account = require('../models/account');
var router = express.Router();
// var vars = require('../config/vars.json');
var stripe = require('stripe');

//////////////////HOME PAGE GET/////////////////////
router.get('/', function(req, res, next){
	res.render('index', {username : req.session.username});
})

///////////////////REGISTER GET/////////////////////
router.get('/register', function(req, res, next){
	if (req.query.failedtoregister){
		res.render('register', {failed: "You must enter a password and username that does not exist"})
	}else if(req.query.passwordsmustmatch){
		res.render('register', {nomatch: "Your passwords must match"})
	}
	res.render('register');

});


//////////////////REGISTER POST/////////////////////
router.post('/register', function(req,res,next){
	if(req.body.password != req.body.password2){
		return res.redirect('/register?passwordsmustmatch=1')
	}
	Account.register(new Account({
		username: req.body.username,
		emailaddress: req.body.emailaddress,
		choices: "untouched",
		shipping: "untouched"

	}),
	req.body.password,
	function(error, account){
		if(error){
			return res.redirect('/register?failedtoregister=1');
		}
		passport.authenticate('local')(req, res, function(){
			req.session.username = req.body.username;
			req.session.emailaddress = req.body.emailaddress;
			console.log(req.session.emailaddress);
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
				done(null, user);
			});

			passport.deserializeUser(function(obj, done){
				done(null, obj);
			});
			if(user.accessLevel == 5){
				req.session.accessLevel = 'Admin';
			}
			req.session.username = user.username;
			req.session.quarterPounds = user.quarterPounds;
			req.session.grind = user.grind;
			req.session.frequency = user.frequency;
			req.session.emailaddress = user.emailaddress;
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
				res.render('choices', {username: req.session.username, grind: currGrind, frequency: currFrequency, quarterPounds: currQuarterPounds, accessLevel: req.session.accessLevel});
		});
		
	}else{
		res.redirect('/');
	}
});

router.post('/choices', function(req, res, next){
	if(req.session.username){
		Account.findOne({username: req.session.username});

		var newGrind = req.body.grind;
		var newFrequency = req.body.frequency;
		var newPounds = req.body.quarterPounds;
		var newChoice = req.body.choices;
		console.log('--------------------------')
		console.log(newChoice);

		Account.findOneAndUpdate(
			{ username: req.session.username },
			{ grind: newGrind, frequency: newFrequency, quarterPounds: newPounds, choices: newChoice },
			{ upsert: true },		
			function(err,account){
				if (err) {
					res.send("There was an error saving your preferences" + err);
				}else{
					account.save;
				}
			}

		)
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
		var newShipping = req.body.shipping;
		Account.findOneAndUpdate(
			{ username: req.session.username },
			{ fullName: newFullName, address1: newAddress1, address2: newAddress2, city: newCity, state: newState, zipCode: newZipCode, deliveryDate: newDeliveryDate, shipping: newShipping},
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
				var unalteredCharge = currQuarterPounds * 20.00;
				var totalCharge = (unalteredCharge).toFixed(2);
				var currCharge = unalteredCharge.toFixed(2);
				req.session.charge = totalCharge * 100;
				if(doc.choices == "untouched"){
					req.session.choices = true;
					res.render('choices', {username: req.session.username, choices: req.session.choices})
				}else if(doc.shipping == "untouched"){
					req.session.shipping = true;
					res.render('shipping', {username: req.session.username, shipping: req.session.shipping})
				}else{
					res.render('payment', {username: req.session.username, grind: currGrind, 
						frequency: currFrequency, quarterPounds: currQuarterPounds, 
						fullName: currFullName, address1: currAddress1, address2: currAddress2, 
						city: currCity, state: currState, zipCode: currZipCode, 
						deliveryDate: currDeliveryDate, charge: currCharge, totalCharge : totalCharge, key: "pk_test_KzKuz4A1dyTwp3wblI0PyCq8" });
				}
			});
	};
})

router.post('/payment', function(req, res, next){
	var stripe = require("stripe")(
	  "sk_test_NWYwCkzv8zQo8EYerx33QyXW"
	);

	stripe.charges.create({
	  amount: req.session.charge,
	  currency: "usd",
	  source: req.body.stripeToken, // obtained with Stripe.js
	  description: "Charge for " + req.body.stripeEmail
	}, function(err, charge) {
	});
	res.redirect('/thankyou');
})

router.get('/thankyou', function(req, res, next){
	console.log('------------------');
	console.log(req.session);
	res.render('thankyou', {username: req.session.username, emailaddress: req.session.emailaddress})
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
		res.redirect('/cancellation');
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

router.get('/intro', function(req, res, next){
	res.render('intro');
})

router.get('/admin', function(req, res, next){
	if(req.session.accessLevel == "Admin"){
		Account.find({}, function (err, doc, next){
			res.render('admin', {accounts:doc});
		});
	}else{
		res.redirect('/');
	}
})

router.get('/ourhistory', function(req, res, next){
	res.render('ourhistory');
});



module.exports = router;
