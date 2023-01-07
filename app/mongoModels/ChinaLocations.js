const mongoose = require('mongoose');
const mongoDB = require('../config/mongo_common.config');
const Schema = mongoose.Schema;

const chinaLocationsSchema = new Schema({
    ID: {
        type: Number,
        default: null
    },
    Name: {
        type: String,
        default: null
    },
    CompanyName: {
        type: String,
        default: null
    },
    CompanyType: {
        type: String,
        default: null
    }
},
{
    collection: 'chinaLocations'
}
);

module.exports = chinaLocations = mongoDB.model("chinaLocations", chinaLocationsSchema);
