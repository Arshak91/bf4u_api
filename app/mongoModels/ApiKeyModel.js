const mongoose = require('mongoose');
const mongoDB = require('../config/mongo_common.config');
const Schema = mongoose.Schema;

const apiKeySchema = new Schema({
    Key: {
        type: String,
        default: null
    },
    Name: {
        type: String,
        default: 'Unique Key'
    },
    companyName: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        default: 'Keys for Clients'
    },
    Expire: {
        type: Date,
        required: true
    },
    host: {
        type: String,
        required: true
    },
    userId: {
        type: Number,
        default: 0
    }
},
{
    collection: 'ApiKeys'
}
);

module.exports = ApiKeys = mongoDB.model("ApiKeys", apiKeySchema);
