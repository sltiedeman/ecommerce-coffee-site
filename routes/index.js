var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();

//////////////////HOME PAGE GET/////////////////////
router.get('/', function(req, res, next){
	res.render('index', {username : req.session.username});
})

///////////////////REGISTER GET/////////////////////
router.get('/register', function(req, res, next){
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
			console.log(error);
			return res.render('register', {err : err});
		}
		passport.authenticate('local')(req, res, function(){
			console.log('==========');
			console.log(req.user);
			req.session.username = req.body.username;
			res.render('choices', {username : req.session.username});
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

// router.get('/login', function(req, res, next){
// 	//the user is already logged in
// 	if(req.session.username){
// 		res.redirect('/choices');
// 	}

// 	//They are here and are not logged in
// 	res.render('login');
// });

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
			return res.render('choices',{username: req.session.username, quarterPounds: req.session.quarterPounds, grind: req.session.grind, frequency: req.session.frequency});
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
			console.log("is true!!!!!!!!");

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
		Account.findOne({username: req.session.username},
		function (err, doc){
			//when data exists, find it here
			var grind = doc.grind;
			var frequency = doc.frequency;
			var pounds = doc.quarterPounds;
		});
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
		res.render('shipping', {username: req.session.username});
	}
});

router.get('/shipping', function(req, res, next){
	res.render('shipping');
});

module.exports = router;
