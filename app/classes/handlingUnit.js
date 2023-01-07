const db = require("../config/db.config.js");
const Check = require("../classes/checks");
const Helpers = require("../classes/helpers");
const Order = db.order;
const HandlingUnit = db.handlingUnit;
const Op = db.Sequelize.Op;
// const op = db.Sequelize.Op;
// const seq = db.sequelize;

module.exports = class OrderClass {


    constructor(params) {
        this.data = params.data;        
    }

    async create(){
        let { orders_id,
            HandlingType_id,
            Quantity,
            piecetype_id,
            productdescription,
            freightclasses_id,
            nmfcnumber,
            nmfcsubcode,
            Weight,
            Length,
            Width,
            Height,
            mintemperature,
            maxtemperature,
            stackable,
            turnable,
            hazmat,
            density,
            options,
            volume,
            sku,
            brand,
            specialneeds
        } = this.data;
        let handlingunit = await HandlingUnit.create({

            orders_id: orders_id,
            HandlingType_id: HandlingType_id,
            Quantity: Quantity,
            piecetype_id: piecetype_id,
            productdescription: productdescription,
            freightclasses_id: freightclasses_id,
            nmfcnumber: nmfcnumber,
            nmfcsubcode: nmfcsubcode,
            Weight: Weight,
            Length: Length,
            Width: Width,
            Height: Height,
            mintemperature: mintemperature,
            maxtemperature: maxtemperature,
            stackable: stackable,
            turnable: turnable,
            hazmat: hazmat,
            density: density,
            options: options,
            volume: volume,
            sku: sku,
            brand: brand,
            specialneeds: specialneeds,
        }).catch(err => {
            console.log(err);
        });
        return handlingunit;
    }


};

