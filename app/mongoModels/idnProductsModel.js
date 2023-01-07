const mongoose = require('mongoose');
const mongoDB = require('../config/mongo_common.config.js');
const Schema = mongoose.Schema;

const productsSchema = new Schema({
    ID: {
        type: String,
        default: null
    },
    Name: {
        type: String,
        default: null
    },
    Brand: {
        type: String,
        default: null
    },
    Class: {
        type: String,
        default: null
    },
    Unit: {
        type: String,
        default: null
    },
    PackSize: {
        type: String,
        default: null
    },
    Weight: {
        type: String,
        default: null
    },
    Notes: {
        type: String,
        default: null
    },
    Manufacturer: {
        type: String,
        default: null
    }
},
{
    collection: 'idnproduct'
}
);

module.exports = idnProducts = mongoDB.model("idnproduct", productsSchema);
