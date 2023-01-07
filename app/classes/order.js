const moment = require("moment");
const db = require("../config/db.config.js");
const Check = require("../classes/checks");
const Helpers = require("../classes/helpers");
const { NorderAttrb, AutoplanAttributes } = require("./joinColumns.js");
const Order = db.order;
const Op = db.Sequelize.Op;
const seq = db.sequelize;
const includeFalse = [{ all: true, nested: false }];
// const op = db.Sequelize.Op;
// const seq = db.sequelize;

module.exports = class OrderClass {


    constructor(params) {
        this.data = params.data;
        this.where = params.where;
        OrderClass.ids = params.ids;
    }


    async changeTimeWindows(){
        let { orderIds, companyName } = this.data;
        let newOrders = await Order.findAndCountAll({
            where: {
                id: {
                    [Op.in]: orderIds
                }
            }
        });
        for (const order of newOrders.rows) {
            let timeWindows;
            timeWindows = await Check.newTimeWindow({
                pickupdateFrom: order.dataValues.pickupdateFrom,
                pickupdateTo: order.dataValues.pickupdateTo,
                deliverydateFrom: order.dataValues.deliverydateFrom,
                deliverydateTo: order.dataValues.deliverydateTo,
                companyName: companyName
            });
            await Order.update({
                timeWindows
            }, { where: { id: order.dataValues.id }});
        }
        return await Helpers.getResponse(1, "Successfully updated");
    }

    async create(){
        let { dist, dur, order, pickupLatLon, consignees, deliveryLatLon, distDur, delivery, pickup, status } = this.data;
        let theLoad = await Order.create({
            // Load type
            loadtype: order.loadtype ? order.loadtype : 0,
            // load_id: order.load_id,

            flowType: order.flowType,
            depoid: order.orderType == 1 ? order.depoid ? order.depoid : null : null,

            // Pickup
            pickupCompanyName: order.pickupCompanyName,
            pickupState: order.pickupState,
            pickupStreetAddress: order.pickupStreetAddress,
            pickupLocationtypeid: order.pickupLocationtype,
            // --
            pickupCountry: order.pickupCountry,
            pickupCountryCode: order.pickupCountryCode,
            pickupCity: order.pickupCity,
            pickupZip: order.pickupZip,
            pickupAccessorials: order.pickupAccessorials,
            // --
            pickupdateFrom: new Date(order.pickupdateFrom),
            pickupdateTo: new Date(order.pickupdateTo),
            // --
            pickupLon: pickupLatLon.lon,
            pickupLat: pickupLatLon.lat,

            vendorid: order.vendorId ? order.vendorId : 0,
            consigneeid: consignees ? consignees.dataValues.id : 0,
            // Delivery
            deliveryCompanyName: order.deliveryCompanyName,
            deliveryState: order.deliveryState,
            deliveryStreetAddress: order.deliveryStreetAddress,
            deliveryLocationtypeid: order.deliveryLocationtype,
            // --
            deliveryCountry: order.deliveryCountry,
            deliveryCountryCode: order.deliveryCountryCode,
            deliveryCity: order.deliveryCity,
            deliveryZip: order.deliveryZip,
            deliveryAccessorials: order.deliveryAccessorials,
            // --
            deliverydateFrom: new Date(order.deliverydateFrom),
            deliverydateTo: new Date(order.deliverydateTo),
            // --
            deliveryLon: deliveryLatLon.lon,
            deliveryLat: deliveryLatLon.lat,

            // Equipment Type
            eqType: order.eqType,

            // References
            bol: order.bol,
            pro: order.pro,
            po: order.po,

            // Rating
            currency: order.currency,
            rate: order.rate ? order.rate : null,

            // Notes
            notes: order.notes,

            //// Statuses
            isPlanned: 0,
            confirmed: 0,
            status: 0,  // order.status,
            statusInternal: 1,
            isfreezed: 0,

            //// Dimentions
            pallet: null,

            // Other
            companyid: 0, // order.companyid ,
            carrierid: 0, // order.carrierid ,
            customerid: 0, // order.customerid ,

            //// Other
            // servicetime: 900,
            custDistance: status ? distDur.distance : 0,
            custDuration: status ? distDur.duration : 0,
            bh: order.bh,
            delivery: `${delivery}, ${order.deliveryCountry}`,
            pickup: `${pickup}, ${order.pickupCountry}`,
            loadTempIds: [],
            loadIds: [],
            flowTypes: [],
            timeInfo: {
                loadTemps: {},
                loads: {},
                loadsArr: []
            },
            pieceCount: order.pieceCount ? order.pieceCount : 0,
            timeWindows: order.timeWindows,
            mustbefirst: order.mustbefirst,
            crossDock: order.crossDock,
            cube: order.cube ? order.cube : 0,
            feet: order.feet ? order.feet : 0,
            weight: order.weight ? order.weight : 0,
            servicetime: order.servicetime ? order.servicetime : 0,
            pieceTime: order.pieceTime ? order.pieceTime : 0,
            orderType: order.orderType
        });
        
        return theLoad;

    }

    async update(){
        let { where, data } = this;
        await Order.update({
            ...data
        }, {
            where: {
                ...where
            }
        });
        let order = await Order.findOne({
            where: {
                ...where
            }
        });
        return await Helpers.getResponse(1, "Successfully updated", order.dataValues);
    }

    async sendAlgoOrders (){
        let data = this.data;
        let { isselected, ids, noTimeWindow } = this.data, where = {}, resp;
        delete this.data.isselected;
        if (isselected) {
            resp = await OrderClass.getOrdersByIds({ ids, noTimeWindow });
        }else {
            resp = await OrderClass.getOrderByFilter(this.data);
        }
        return {
            ...resp
        };
    }

    static async getOrdersByIds (data) {
        let { ids, noTimeWindow } = data;
        const idList = ids || this.ids;
        let tables = ["orders", "consignees"], orders = [];
        let query = await Helpers.createSelectQueryWithJoinConsignee(tables, idList.join(","), AutoplanAttributes);
        orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
        for (const o of orders) {
            if (noTimeWindow == 1) {
                if (o.deliverydateFrom) {
                    o.deliverydateFrom = "2018-01-01T00:00:00Z";
                }
                if (o.pickupdateFrom) {
                    o.pickupdateFrom = "2018-01-01T00:00:00Z";
                }
                if (o.deliverydateTo) {
                    o.deliverydateTo = "2030-01-01T00:00:00Z";
                }
                if (o.pickupdateTo) {
                    o.pickupdateTo = "2030-01-01T00:00:00Z";
                }
            }
        }
        return {
            orders: orders ? orders : [],
            count: orders.length
        };
    }
    static async getOrderByFilter(data) {
        let bool = false, where = {}, filterWhere;
        let { noTimeWindow, date, flowType, depoid, deliveryDateFrom, deliveryDateTo, pickupDateFrom, pickupDateTo } = data;
        const sortAndPagiantion = await Helpers.sortAndPagination({
            query: data
        });
        if (depoid) {
            data[Op.or] = [{ depoid: depoid }, { depoid: null }];
            delete data.depoid;
        }
        if (deliveryDateFrom || deliveryDateTo || pickupDateFrom || pickupDateTo) {
            delete data.date;
            delete data.flowType;
            filterWhere = await Helpers.filters(data, Op);
            bool = true;
            if (!filterWhere.bool) {
                return {
                    status: 0,
                    msg: "filter error",
                    data: {
                        orders: [],
                        count: 0
                    }
                };
            }
        } else {
            let start = date;
            
            let end = moment(start).add(23.9998, "h").toISOString();
            if (flowType && flowType == "1") {
                data.pickupdateFrom = {
                    [Op.gte]: start,
                    [Op.lte]: end
                };
            }
            if (flowType && flowType == "2") {
                data.deliverydateTo = {
                    [Op.gte]: start,
                    [Op.lte]: end
                };
            }
            delete data.date;
            delete data.flowType;
        }
        delete data.noTimeWindow;
        let orders = [];
        orders = await Order.findAndCountAll({
            //  attributes: autoplanattrb,
            where: bool ? filterWhere.where : data,
            include: includeFalse,
            distinct: true,
            ...sortAndPagiantion
        });
        let result = [];
        if (orders && orders.rows) {
            for (var i in orders.rows) {
                let o = orders.rows[i];
                let full = false;
                if (o.loadtype == "2") {
                    full = true;
                }
                if (noTimeWindow == 1) {
                    if (o.deliverydateFrom) {
                        o.deliverydateFrom = "2018-01-01T00:00:00Z";
                    }
                    if (o.pickupdateFrom) {
                        o.pickupdateFrom = "2018-01-01T00:00:00Z";
                    }
                    if (o.deliverydateTo) {
                        o.deliverydateTo = "2030-01-01T00:00:00Z";
                    }
                    if (o.pickupdateTo) {
                        o.pickupdateTo = "2030-01-01T00:00:00Z";
                    }
                }
                result.push({
                    id: o.id,
                    feet: o.feet,
                    weight: o.weight,
                    cube: o.cube,
                    depoid: o.depoid,
                    flowType: o.flowType,
                    consigneeid: o.consigneeid,
                    deliveryLat: o.deliveryLat,
                    deliveryLon: o.deliveryLon,
                    pickupLat: o.pickupLat,
                    pickupLon: o.pickupLon,
                    deliverydateFrom: o.deliverydateFrom,
                    deliverydateTo: o.deliverydateTo,
                    pickupdateFrom: o.pickupdateFrom,
                    pickupdateTo: o.pickupdateTo,
                    servicetime: o.servicetime,
                    full: full,
                    timeWindows: o.timeWindows,
                    pieceCount: o.pieceCount,
                    driverId: o.consigneeid && o.consignee ? o.consignee.driverId ? o.consignee.driverId : null : null,
                    zoneId: o.consigneeid && o.consignee ? o.consignee.czone_id ? o.consignee.czone_id : null : null,
                    mustBeFirst: o.mustbefirst ? 1 : 0
                });
            }
        }
        return {
            orders: result,
            count: orders.count
        };
    }
};

