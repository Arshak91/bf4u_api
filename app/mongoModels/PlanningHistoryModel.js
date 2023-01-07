const mongoose = require('mongoose');
const mongoDB = require('../config/mongo_common.config');
const Schema = mongoose.Schema;

const planningHistorySchema = new Schema({
    ID: {
        type: Number,
        default: null
    },
    DataInfo: {
        type: JSON,
        default: null
    },
    UserInfo: {
        type: JSON,
        default: null
    }
},
{
    collection: 'planningHistory'
}
);

module.exports = planningHistory = mongoDB.model("planningHistory", planningHistorySchema);
