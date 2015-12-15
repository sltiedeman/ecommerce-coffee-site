var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();

//////////////////HOME PAGE GET/////////////////////
router.get('/', function(req, res, next){
	res.render('index', {user: req.user});
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
			return res.render('index');
		}else{
			passport.authenticate('local')(req, res, function(){
				res.redirect('/');
			})
		}
	});
});

router.get('/login', function(req, res, next){
	res.render('login');
});

router.post('/login', passport.authenticate('local'), function(req, res){
	res.redirect('/');
});



module.exports = router;
