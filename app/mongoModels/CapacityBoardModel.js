const mongoose = require('mongoose');
const conn = require('../config/mongo_common.config.js');
const Schema = mongoose.Schema;

const CapacityBoardAddress = {
    lat: String,
    lon: String,
    country: String,
    state: String,
    zip: String,
    city: String,
    nsew: String,               // N / S / E / W    
    dateWindow: String,
    timeWindowFrom: Date,
    timeWindowTo: Date
}

const CapacityBoardOrderSchema = {
    
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
    
    availableSize: Number,
    usedSize: Number,
    availableWeight: Number,
    usedWeight: Number,

    flatRate: Number,
    perMileRate: Number,      // (calculated)

    start: CapacityBoardAddress,
    end: CapacityBoardAddress,
    
    distance: Number,               // (calculate)
    postedDate: Date,

    contact: {
        telephone: String,
        email: String,
        person: String
    }
}

const CapacityBoardPublisher = {
    userType: String, // broker, shipper, carrier
    userId: Number,
    dbName: String,
    phone: String,
    contactPerson: String,
    email: String
}

const CapacityBoardTaker = {
    userType: String, // broker, shipper, carrier
    userId: Number,
    dbName: String,
}

const CapacityBoard = new Schema({
    number: Number, // unique for algo
    order: {
        type: CapacityBoardOrderSchema,
        default: null,
        required: true
    },
    publishedBy: {
        type: CapacityBoardPublisher,
        required: true
    },
    takenBy: {
        type: CapacityBoardTaker,
    },
},
{
    collection: 'CapacityBoards'
}
);

//console.log(conn)
module.exports = conn.model("CapacityBoard", CapacityBoard);