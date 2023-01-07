const uuidv1 = require('uuid/v1');
const apiKey = require('../mongoModels/ApiKeyModel.js');

module.exports = class ApiKey {
    constructor(params) {
        this.data = params.data;
    }

    async create() {
        console.log(this.data);
        const uKey = uuidv1();
        let key, error;
        key = await apiKey.create({
            Key: uKey,
            Expire: this.data.date,
            companyName: this.data.companyName,
            host: this.data.host,
            userId: this.data.userId
        }).catch(err => {
            error = err;
        });
        if (!key && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!key && !error) {
            return {
                status: 0,
                msg: "such key not registered"
            };
        } else {
            return {status: 1, key};
        }
    }
    async edit() {
        let id = this.data.id, updateKey, error;
        delete this.data.id;
        updateKey = await apiKey.findOneAndUpdate({
            _id: id
        }, {
            Expire: this.data.date
        }, {new: true}).catch(err => {
            error = err;
        });
        if (!updateKey && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!updateKey && !error) {
            return {
                status: 0,
                msg: "such key doesn't exist"
            };
        } else {
            return {status: 1, updateKey};
        }
    }
    async getOne() {
        let id = this.data.id, key, error;
        key = await apiKey.findOne({
            _id: id
        }).catch(err => {
            error = err;
        });
        if (!key && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!key && !error) {
            return {
                status: 0,
                msg: "such key doesn't exist"
            };
        } else {
            return {status: 1, key};
        }
    }
    async getBy() {
        let key, error;
        key = await apiKey.findOne(this.data).catch(err => {
            error = err;
        });
        if (!key && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!key && !error) {
            return {
                status: 0,
                msg: "such key doesn't exist"
            };
        } else {
            return {status: 1, key};
        }
    }
    async getAll() {
        let keys, count, error;
        let page = this.data.page ? Math.max(0, this.data.page*1) : Math.max(0, 1);
        let perPage = this.data.limit ? this.data.limit*1 : 10;        
        keys = await apiKey.find().sort('_id').limit(perPage).skip(perPage * (page - 1)).catch(err => {
            error = err;
        });
        count = await apiKey.find().sort('_id').limit(perPage).skip(perPage * (page - 1)).countDocuments();
        if (!keys && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!keys && !error) {
            return {
                status: 0,
                msg: "such keys doesn't exist"
            };
        } else {
            return {status: 1, keys, count};
        }
    }
    async deleteOne() {
        let id = this.data.id, key, error;
        key = await apiKey.findOneAndRemove({ _id: id }).catch(err => {
            error = err;
        });
        if (!key && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!key && !error) {
            return {
                status: 0,
                msg: "such key doesn't exist"
            };
        } else {
            return {status: 1, key};
        }
    }
};
