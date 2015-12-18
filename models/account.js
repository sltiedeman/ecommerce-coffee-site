var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
	username: String,
	password: String,
	grind: String,
	frequency: String,
	quarterPounds: Number,
	fullName: String,
	address1: String,
	address2: String,
	city: String,
	state: String,
	zipCode: String,
	deliveryDate: String,
	emailaddress: String,
	accessLevel: Number,
	choices: String,
	shipping: String

});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);