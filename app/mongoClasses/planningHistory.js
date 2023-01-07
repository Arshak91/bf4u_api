const db = require('../config/db.config.js');
const planningHistory = require('../mongoModels/PlanningHistoryModel');
const Helpers = require('../classes/helpers');
const product = db.product;
const Op = db.Sequelize.Op;
// const seq = db.sequelize;

const includeFalse = [{ all: true, nested: false }];

module.exports = class Load {


    constructor(params) {
        this.data = params.data;        
    }

    async create(){
        let status = 1, history;
        history = await planningHistory.create({
            ID: this.data.ID,
            DataInfo: this.data.info,
            UserInfo: this.data.userInfo
        }).catch(err => {
            status = err ? 0 : 1;
        });
        
        return {
            data: history,
            status
        };

    }
    async edit() {
        let id = this.data.id, updateHistory, error;
        delete this.data.id;
        updateHistory = await planningHistory.findOneAndUpdate({
            _id: id
        }, {
            ID: this.data.ID,
            DataInfo: this.data.info,
            UserInfo: this.data.userInfo
        }, {new: true}).catch(err => {
            error = err;
        });
        if (!updateHistory && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!updateHistory && !error) {
            return {
                status: 0,
                msg: "such History doesn't exist"
            };
        } else {
            return {status: 1, msg: "ok", data: updateHistory};
        }
    }
    async createByApiKey(){
        
        let theProduct = await product.create({
            ID: this.data.ID ? this.data.ID : 0,
            name: this.data.name ? this.data.name : '',
            brandname: this.data.brandname ? this.data.brandname : '',
            class: this.data.class ? this.data.class : '',
            unit: this.data.unit ? this.data.unit : '',
            packsize: this.data.packsize ? this.data.packsize : '',
            weight: this.data.weight ? this.data.weight : 0,
            width: this.data.width ? this.data.width : 0,
            height: this.data.height ? this.data.height : 0,
            length: this.data.length ? this.data.length : 0,
            notes: this.data.notes ? this.data.notes : '',
            manufacturernumber: this.data.manufacturernumber ? this.data.manufacturernumber : ''
        });
        
        return theProduct;

    }
    async editByApiKey() {
        let updateProduct, error;
        delete this.data.id;
        updateProduct = await product.update({
            name: this.data.name ? this.data.name : '',
            brandname: this.data.brandname ? this.data.brandname : '',
            class: this.data.class ? this.data.class : '',
            unit: this.data.unit ? this.data.unit : '',
            packsize: this.data.packsize ? this.data.packsize : '',
            weight: this.data.weight ? this.data.weight : 0,
            width: this.data.width ? this.data.width : 0,
            height: this.data.height ? this.data.height : 0,
            length: this.data.length ? this.data.length : 0,
            notes: this.data.notes ? this.data.notes : '',
            manufacturernumber: this.data.manufacturernumber ? this.data.manufacturernumber : ''
        }, {
            where: {
                ID: this.data.ID
            }
        }).catch(err => {
            error = err;
        });
        if (!updateProduct && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!updateProduct && !error) {
            return {
                status: 0,
                msg: "such Product doesn't exist"
            };
        } else {
            return {status: 1, msg: "ok", data: updateProduct};
        }
    }
    async getOne() {
        let id = this.data.productId, history, error;
        history = await planningHistory.findOne({
            _id: id
        }).catch(err => {
            error = err;
        });
        if (!history && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!history && !error) {
            return {
                status: 0,
                msg: "such Product doesn't exist"
            };
        } else {
            return {status: 1, msg: "ok", data: history};
        }
    }
    async getByID() {
        let id = this.data.ID, pro, error;
        pro = await product.findOne({ where: {
            ID: id
        } }).catch(err => {
            error = err;
        });
        if (!pro && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!pro && !error) {
            return {
                status: 0,
                msg: "such Product doesn't exist"
            };
        } else {
            return {status: 1, msg: "ok", data: pro};
        }
    }
    async getAll() {
        this.data.query.orderBy = this.data.query.orderBy == 'id' ? this.data.query.orderBy = '_id' : this.data.query.orderBy;
        const sortAndPagiantion = await Helpers.sortAndPagination(this.data);
        const where = this.data.query;        
        let data = await Helpers.filters(where, Op);
        let products, error;
        products = await product.findAndCountAll({
            where: data.where,
            include: includeFalse,
            distinct: true,
            ...sortAndPagiantion
        }).catch(err => {
            error = err;
        });
        if (!products && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!products && !error) {
            return {
                status: 0,
                msg: "such key doesn't exist"
            };
        } else {
            return {status: 1, msg: "ok", data: products};
        }
    }
    async delete() {
        let ids = await Helpers.splitToIntArray(this.data.productIds, ',') , pro, error;
        pro = await product.destroy({ where: {
            _id: {
                [Op.in]: ids
            }
        } }).catch(err => {
            error = err;
        });
        if (!pro && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!pro && !error) {
            return {
                status: 0,
                msg: "such Product doesn't exist"
            };
        } else {
            return {status: 1, msg: "product(s) deleted"};
        }
    }


};

