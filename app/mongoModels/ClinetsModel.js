const mongoose = require('mongoose');
const mongoDB = require('../config/mongo_common.config');
const Schema = mongoose.Schema;

const clientsSchema = new Schema({
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
    },
    Email: {
        type: String,
        default: null
    },
    Phone: {
        type: String,
        default: null
    },
    Address1: {
        type: String,
        default: null
    },
    Address2: {
        type: String,
        default: null
    },
    ContactPerson: {
        type: String,
        default: null
    },
    ContactPersonPosition: {
        type: String,
        default: null
    },
    LastContactedDay: {
        type: String,
        default: null
    },
    Rating: {
        type: String,
        default: null
    },
    Type: {
        type: String,
        default: null
    },
    Users: [
        {
            Type: String,
            user: Object
        }
    ]
},
{
    collection: 'Clients'
}
);

module.exports = Clients = mongoDB.model("Clients", clientsSchema);
