// Company
// Equipment
// Product
// Size
// Weight
// Partial/Full
// Pool/No Pool

// Pickup City
// N/S/E/W
// Pickup State
// Pickup Zip
// Pickup Country
// Pickup date/window

// Delivery City
// N/S/E/W
// Delivery State
// Delivery ZIP
// Delivery Country
// Delivery date/window

// Distance (calculate)
// Posted date
// Flat Rate
// Per mile rate

// Telephone
// E-mail
// Contact person



const mongoose = require('mongoose');
const conn = require('../config/mongo_common.config.js');
const Schema = mongoose.Schema;

const LoadBoardAddress = {
    lat: String,
    lon: String,
    country: String,
    state: String,
    zip: String,
    city: String,
    nsew: String,               // N / S / E / W    
    timeWindowFrom: Date,
    timeWindowTo: Date
}

const LoadBoardOrderSchema = {
    
    orderId: Number,

    company: {
        id: Number,
        name: String
    },
    equipment: {
        eqType: Number,
        name: String,

        id: Number,
        feet: Number,
        cube: Number,
        weight: Number
        // feet : equipment.value,
        // cube : equipment.maxVolume,
        // weight : equipment.maxweight
    },
    product: Object,

    size: Number,
    weight: Number,
    loadType: String,     // Partial/Full
    poolNoPool: String,             // Pool/No Pool

    start: LoadBoardAddress,
    end: LoadBoardAddress,
    
    distance: Number,               // (calculate)
    postedDate: Date,
    flatRate: Number,
    perMileRate: Number,

    contact: {
        telephone: String,
        email: String,
        person: String
    }
}

const LoadBoardPublisher = {
    userType: String, // broker, shipper, carrier
    userId: Number,
    dbName: String,
    phone: String,
    contactPerson: String,
    email: String
}

const LoadBoardTaker = {
    userType: String, // broker, shipper, carrier
    userId: Number,
    dbName: String,
}

const LoadBoard = new Schema({
    number: Number, // unique for algo
    type: Number, // 1 public , 2 private
    order: {
        type: LoadBoardOrderSchema,
        default: null,
        required: true
    },
    publishedBy: {
        type: LoadBoardPublisher,
        required: true
    },
    takenBy: {
        type: LoadBoardTaker,
    },
},
{
    collection: 'LoadBoards'
}
);

//console.log(conn)
module.exports = conn.model("LoadBoard", LoadBoard);