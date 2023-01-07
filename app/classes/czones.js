const db = require('../config/db.config.js');
const Helpers = require('../classes/helpers');
const CZones = db.czones;
const Op = db.Sequelize.Op;

const includeFalse = [{ all: true, nested: false }];

module.exports = class Load {


    constructor(params) {
        this.data = params.data;
    }

    async create(){
        
        let theCZones = await CZones.create({
            name: this.data.name,
            color: this.data.color,
        });
        
        return theCZones;

    }

    async edit() {
        let id = this.data.id, updatetheCZones, error;
        delete this.data.id;
        updatetheCZones = await CZones.update({
            name: this.data.name,
            color: this.data.color
        }, {
            where: {
                id: id
            }
        }).catch(err => {
            error = err;
        });
        if (!updatetheCZones && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!updatetheCZones && !error) {
            return {
                status: 0,
                msg: "such CZones doesn't exist"
            };
        } else {
            return {status: 1, msg: "ok", data: updatetheCZones};
        }
    }

    async getAll() {
        this.data.query.orderBy = this.data.query.orderBy == 'id' ? this.data.query.orderBy = 'id' : this.data.query.orderBy;
        const sortAndPagiantion = await Helpers.sortAndPagination(this.data);
        const where = this.data.query;        
        let data = await Helpers.filters(where, Op);
        let products, error;
        products = await CZones.findAndCountAll({
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

    async getOne() {
        let id = this.data.czoneId, czone, error;
        czone = await CZones.findOne({ where: {
            id: id
        } }).catch(err => {
            error = err;
        });
        if (!czone && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!czone && !error) {
            return {
                status: 0,
                msg: "such CZone doesn't exist"
            };
        } else {
            return {status: 1, msg: "ok", data: czone};
        }
    }

    async delete() {
        let { ids } = this.data , czone, error;
        czone = await CZones.destroy({ where: {
            id: {
                [Op.in]: ids
            }
        } }).catch(err => {
            error = err;
        });
        if (!czone && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!czone && !error) {
            return {
                status: 0,
                msg: "such Product doesn't exist"
            };
        } else {
            return {status: 1, msg: "czone(s) deleted"};
        }
    }
};
