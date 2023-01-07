const mongoose = require('mongoose');
const conn = require('../config/mongo_common.config.js');
const Schema = mongoose.Schema;

const PublicLoadAddress = {
    lat: String,
    lon: String,
    country: String,
    zip: String,
    state: String,
    city: String,
    street: String,
    addressFull: String
};

const PublicLoadSchema = {
    loadId: Number,
    flowType: Number,
    orderIds: String,
	orders: [], // ?
	stops: Number,
    start: PublicLoadAddress,
	end: PublicLoadAddress,
	startTime: String,
	endTime: String,
	feet: Number,
	weight: Number,
	volume: Number, // (cube)
	pallet: Number,
	totalDistance: Number,
	totalDuration: Number,
	rate: Number, // loadCost
	fuelSurcharge: Number,
	pickupDate: String,
	deliveryDate: String,
	carTypes: Object
};

const PublicLoadPublisher = {
    userType: String, // broker, shipper, carrier
    userId: Number,
    dbName: String,
    phone: String,
    contactPerson: String,
    email: String
};

const PublicLoadTaker = {
    userType: String, // broker, shipper, carrier
    userId: Number,
    dbName: String,
};

const PublicLoad = new Schema({
    load: {
        type: PublicLoadSchema,
        default: null,
        required: true
    },
    publishedBy: {
        type: PublicLoadPublisher,
        required: true
    },
    takenBy: {
        type: PublicLoadTaker,
    },
},
{
    collection: 'PublicLoads'
}
);

//console.log(conn)
module.exports = conn.model("PublicLoads", PublicLoad);


// public load ->  carrie , shipper, broker 


// _id,
// load: { 
// 	id,
// 	flowType,
// 	orders, // ?
// 	stops,
// 	start: {
// 		lat,
// 		lon,
// 		city,
// 		zip,
// 		state,
// 		street
// 	},
// 	end: {
// 		lat,
// 		lon,
// 		city,
// 		zip,
// 		state,
// 		street
// 	},
// 	startTime,
// 	endTime,
// 	feet,
// 	weight,
// 	cube, // (volume)
// 	pallet,
// 	totalDistance,
// 	totalDuration,
// 	fuelSurcharge,
// 	rate, // loadCost
// 	pickupDate,
// 	deliveryDate,
// 	carTypes
// },
// publishedby: {
// 	id: 11.
// 	db: demo,
// 	phone: '',
// 	contactPerson: '',
// 	email: ''
// 	......
// },
// takedby:{
// 	type: '', // broker, shipper, carrier
// 	id: 11,
// 	db: demo,
// 	......
// }
