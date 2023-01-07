const mongoose = require('mongoose');
const conn = require('../config/mongo_common.config.js');
const Schema = mongoose.Schema;

const ZipCode = new Schema({
    Country: String,
    LocationName: String,
    PostalCode: String,
    Latitude: Number,
    Longitude: Number,
    Accuracy: Number
},
{
    collection: 'ZipCodes'
}
);

module.exports = conn.model("ZipCode", ZipCode);