const db = require("../config/db.config.js");
const moment = require("moment");
const orderController = require("../controller/orderscontroller");
const Consignee = require("../controller/consignees.controller");
const Check = require("../classes/checks");
const UploadClass = require("../classes/uploads");
const OrderClass = require("../classes/order");
const UploaderClass = require("../classes/uploader");
const Helper = require("./helpers.js");
const Warnings = require("../warnings/orderWarnings");
const Depo = db.depo;
const Consignees = db.consignee;
const Op = db.Sequelize.Op;

// const op = db.Sequelize.Op;
// const seq = db.sequelize;
let createTimeWindow = async (data) => {
    let { fromDay, fromHour, toDay, toHour, timezone, depo, userType, consigneeName } = data;
    let zone = timezone.split("C")[1].split(":")[0];
    let frDay = moment(new Date(fromDay)).add(1, "day").format("YYYY-MM-DD");
    let tDay = moment(new Date(toDay)).format("YYYY-MM-DD");
    let pFrom = moment(new Date(fromDay)).subtract(zone, "hours");
    let pickupFrom = moment(new Date(fromDay)).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let pickupTo = pFrom.add(1, "day").subtract(1, "second").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let startFrom = moment(`${frDay}T${moment(fromHour, "HH:mm").format("HH:mm:ss.SSS")}`, "YYYY-MM-DDTHH:mm:ss.SSS Z").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let entFrom = moment(`${frDay}T${moment(fromHour, "HH:mm").format("HH:mm:ss.SSS")}`, "YYYY-MM-DDTHH:mm:ss.SSS Z").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let endTo = moment(`${tDay}T${moment(toHour, "HH:mm").format("HH:mm:ss.SSS")}`, "YYYY-MM-DDTHH:mm:ss.SSS Z").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let timeWindows;
    timeWindows = await Check.newTimeWindow({
        pickupdateFrom: pickupFrom,
        pickupdateTo: pickupTo,
        deliverydateFrom: entFrom,
        deliverydateTo: endTo,
        consigneeName
    }, userType);
    delete timeWindows.status;
    let deliveryWindow = timeWindows.deliveryTimeWindows[timeWindows.deliveryTimeWindows.length-1];
    return {
        timeWindows,
        pickupFrom,
        pickupTo,
        deliveryFrom:  deliveryWindow.From,
        deliveryTo: deliveryWindow.To
    };
};

let createTimeWindowHilti = async (data) => {
    let { fromDay, fromHour, toDay, toHour, timezone, userType, consigneeName } = data;
    let toD = toDay ? toDay : moment(new Date(fromDay)).add(4, "day").format("YYYY-MM-DD");
    let zone = timezone.split("C")[1].split(":")[0];
    let frDay1 = moment(fromDay).format("YYYY-MM-DDTHH:mm:ss.SSS");
    let frDay = moment(frDay1).add(1, "day").format("YYYY-MM-DD");
    let tDay = moment(new Date(toD)).add(1, "day").subtract(1, "second").format("YYYY-MM-DD");
    let pFrom = moment(new Date(frDay1)).subtract(zone, "hours");
    let pickupFrom = moment(new Date(frDay1)).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let pickupTo = pFrom.add(1, "day").subtract(1, "second").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let startFrom = moment(`${frDay}T${moment(fromHour, "HH:mm").format("HH:mm:ss.SSS")}`, "YYYY-MM-DDTHH:mm:ss.SSS Z").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let entFrom = moment(`${frDay}T${moment(fromHour, "HH:mm").format("HH:mm:ss.SSS")}`, "YYYY-MM-DDTHH:mm:ss.SSS Z").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let endTo = moment(`${tDay}T${moment(toHour, "HH:mm").format("HH:mm:ss.SSS")}`, "YYYY-MM-DDTHH:mm:ss.SSS Z").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")+"Z";
    let timeWindows;
    timeWindows = await Check.newTimeWindow({
        pickupdateFrom: pickupFrom,
        pickupdateTo: pickupTo,
        deliverydateFrom: pickupFrom,
        deliverydateTo: endTo,
        consigneeName
    }, userType);
    delete timeWindows.status;
    let deliveryWindow = timeWindows.deliveryTimeWindows[timeWindows.deliveryTimeWindows.length-1];
    return {
        timeWindows,
        pickupFrom,
        pickupTo,
        deliveryFrom:  deliveryWindow.From,
        deliveryTo: deliveryWindow.To
    };
};

module.exports = class Logics {


    constructor(params) {
        this.data = params.data;
        this.timezone = params.timezone;
        this.depo = params.depo;
        this.info = params.info;
        this.fileHeaders = params.fileHeaders;
    }

    async upload() {
        let keys = this.data[0], orderObj = {}, order, createdOrders=[], warningArray=[];
        let timeWindow, depo = this.depo ? this.depo.dataValues : null;
        let { uuid, userId, fileName, serviceTime, userType } = this.info;
        for (const [i, item] of this.data.entries()) {
            if (i > 0) {
                
                timeWindow = await createTimeWindow({
                    fromDay: item.__EMPTY_5,
                    fromHour: item.__EMPTY_7,
                    toDay: item.__EMPTY_6,
                    toHour: item.__EMPTY_8,
                    timezone: this.timezone,
                    depo: this.depo,
                    userType,
                    consigneeName: item.__EMPTY,
                });
                // console.log(: timeWindow.);
                orderObj[keys.__EMPTY] = item.__EMPTY;
                orderObj[keys.__EMPTY_1] = item.__EMPTY_1;
                orderObj[keys.__EMPTY_2] = item.__EMPTY_2;
                orderObj[keys.__EMPTY_3] = item.__EMPTY_3;
                orderObj[keys.__EMPTY_4] = item.__EMPTY_4;
                orderObj[keys.__EMPTY_5] = item.__EMPTY_5;
                orderObj[keys.__EMPTY_6] = item.__EMPTY_6;
                orderObj[keys.__EMPTY_7] = item.__EMPTY_7;
                orderObj[keys.__EMPTY_8] = item.__EMPTY_8;
                orderObj[keys.__EMPTY_9] = item.__EMPTY_9;
                orderObj[keys.__EMPTY_10] = item.__EMPTY_10;
                orderObj[keys.__EMPTY_11] = item.__EMPTY_11;
                orderObj[keys.__EMPTY_12] = item.__EMPTY_12;
                orderObj[keys.__EMPTY_13] = item.__EMPTY_13;
                orderObj[keys.__EMPTY_14] = item.__EMPTY_14;
                orderObj[keys.__EMPTY_15] = item.__EMPTY_15;
                order = await orderController.uploadCreate({
                    body: {
                        orders: [{
                            products: [
                                {
                                    volume: item.__EMPTY_9,
                                    Quantity: 1,
                                    productdescription: "",
                                    freightclasses_id: 0,
                                    nmfcnumber: "0",
                                    nmfcsubcode: "0"
                                }
                            ],
                            flowType: 2,
                            pickupStreetAddress: item.__EMPTY_12,
                            deliveryCompanyName: item.__EMPTY_1,
                            deliveryState: item.__EMPTY_4,
                            pickupdateFrom: timeWindow.pickupFrom,
                            pickupdateTo: timeWindow.pickupTo,
                            pickupCompanyName: item.__EMPTY_11,
                            deliverydateFrom: timeWindow.deliveryFrom,
                            deliverydateTo: timeWindow.deliveryTo,
                            eqType: 1,
                            timeWindows: timeWindow.timeWindows,
                            deliveryStreetAddress: item.__EMPTY_2,
                            deliveryCity: item.__EMPTY_3,
                            deliveryCountry: "CHINA",
                            pickupCountry: "CHINA",
                            consigneeName: item.__EMPTY,
                            serviceTime: serviceTime,
                            pieceCount: 1,
                            crossDock: item.__EMPTY_14 == "A" ? 1 : 0
                        }],
                        uniqlo: 1,
                        Automated: 1
                    }
                });
                createdOrders = createdOrders.concat(order.data);
                warningArray = warningArray.concat(order.warnings);
            }
        }
        const upClass = new UploadClass({ data: {
            UUID: uuid,
            status: 2,
            failed: warningArray,
            FileName: fileName,
            userId,
            orderCount: createdOrders.length
        }});
        await upClass.edit();
        return Helper.getResponse(1, `Created ${createdOrders.length} Order`, {
            count: createdOrders.length
        });
    }

    async uploadHilti() {
        let keys = this.data[0], orderObj = {}, order, createdOrders=[], warningArray=[];
        let timeWindow, depo = this.depo ? this.depo.dataValues : null;
        let { uuid, userId, fileName, serviceTime, userType } = this.info, pickupDepo, deliveryDepo;
        for (const [i, item] of this.data.entries()) {
            console.log(i);
            let depos = await Helper.getPickupAndDeliveryDepos({
                ShipperAddress: item.ShipperAddress,
                shipperZip: item["Postal Code"],
                ConsigneeAddress: item.ConsigneeAddress,
                consZip: item.ConsigneePostalCode
            });
            timeWindow = await createTimeWindowHilti({
                fromDay: item.ShipDate,
                fromHour: "00:00",
                toDay: item.DeliveryDate,
                toHour: "23:59",
                timezone: this.timezone,
                userType,
                consigneeName: item.ConsigneeName,
            });
            order = await orderController.create({
                body: {
                    orders: [{
                        products: [
                            {
                                volume: 0,
                                Quantity: item.Pieces*1,
                                Weight: item.Weight*1,
                                productdescription: "",
                                freightclasses_id: 0,
                                nmfcnumber: "0",
                                nmfcsubcode: "0"
                            }
                        ],
                        flowType: 2,
                        pickupStreetAddress: item.ShipperAddress,
                        pickupCountry: item.ShipperCountry,
                        pickupdateFrom: timeWindow.pickupFrom,
                        pickupdateTo: timeWindow.pickupTo,
                        pickupCompanyName: item.ShipperName,
                        pickupCity: item.ShipperCity,
                        pickupState: item.ShipperState,
                        pickupZip: item["Postal Code"],
                        pickupDepoId: depos.shipCount > 0 ? depos.pickupDepo[0].id : null,

                        deliveryZip: item.ConsigneePostalCode,
                        deliveryCompanyName: item.ConsigneeName,
                        deliveryState: item.ConsigneeState,
                        deliverydateFrom: timeWindow.deliveryFrom,
                        deliverydateTo: timeWindow.deliveryTo,
                        deliveryStreetAddress: item.ConsigneeAddress,
                        deliveryCity: item.ConsigneeCity,
                        deliveryCountry: item.ConsigneeCountry,
                        deliveryDepoId: depos.consCount > 0 ? depos.deliveryDepo[0].id : null,
                        eqType: 1,
                        timeWindows: timeWindow.timeWindows,
                        
                        consigneeName: item.ConsigneeName,
                        serviceTime: serviceTime,
                        pieceCount: item.Pieces*1,
                        crossDock: 0,
                        bol: item["BOL Number"],
                        po: item["PO Number"],
                        pro: item.InvoiceNumber,
                        serviceType: item["Functional Area"],
                        rate: item.PaidAmount*1,
                        pickupDepo: depos.shipCount > 0 ? depos.pickupDepo[0] : null,
                        deliveryDepo: depos.consCount > 0 ? depos.deliveryDepo[0] : null,
                        loadtype: item.Mode
                    }],
                    uniqlo: 1,
                    Automated: 1
                }
            });
            createdOrders = createdOrders.concat(order.data);
            warningArray = warningArray.concat(order.warnings);
        }
        const upClass = new UploadClass({ data: {
            UUID: uuid,
            status: 2,
            failed: warningArray,
            FileName: fileName,
            userId,
            orderCount: createdOrders.length
        }});
        await upClass.edit();
        return Helper.getResponse(1, `Created ${createdOrders.length} Order`, {
            count: createdOrders.length
        });
    }

    async UploadAll() {
        let { uuid, userId, fileName, serviceTime, pieceTime, userType, companyName, proofSettings } = this.info, createdOrders = [], errorArr = [];
        let { fileHeaders, timezone, depo, req } = this, cons, createCons, timeWindow, orderDepo, pickup = {}, delivery = {};
        fileHeaders = await Helper.reverseObject(JSON.parse(fileHeaders)) ;
        for (const [i, item] of this.data.entries()) {
            let dateTimeCheck = await this.checkDateTimeFormats({item, fileHeaders});
            if (!dateTimeCheck.status) {
                errorArr.push({
                    ID: item[fileHeaders["Order Number"]],
                    Cause: "Order's Date is Wrong",
                    status: 0
                });
            } else {
                orderDepo = item[fileHeaders["Depot Name"]] ? await Helper.getOne({
                    key: "name",
                    value: item[fileHeaders["Depot Name"]],
                    table: Depo
                }) : 1;
                if (!orderDepo) {
                    errorArr.push({
                        ID: item[fileHeaders["Order Number"]],
                        Cause: "Order's Depo unavailable",
                        status: 0,
                    });

                } else {
                    item[fileHeaders["Delivery Date"]] = moment(item[fileHeaders["Delivery Date"]]).format("YYYY-MM-DD") || moment().format("YYYY-MM-DD");
                    orderDepo = orderDepo && orderDepo != 1 ? orderDepo : depo;
                    let pickupStr, deliverStr, orderType = 1;
                    if (!item[fileHeaders["Pick up Date"]] && ((!item[fileHeaders["Delivery Window End"]] && item[fileHeaders["Delivery Period"]]) || (item[fileHeaders["Delivery Window End"]] && item[fileHeaders["Delivery Period"]]))) {
                        timeWindow = await this.createTimeFormat({
                            deliveryDate: item[fileHeaders["Delivery Date"]],
                            deliveryStart: item[fileHeaders["Delivery Window Start"]],
                            period: item[fileHeaders["Delivery Period"]],
                            timezone
                        }, 1);
                    } else if (!item[fileHeaders["Pick up Date"]] && item[fileHeaders["Delivery Window End"]] && !item[fileHeaders["Delivery Period"]]) {
                        timeWindow = await this.createTimeFormat({
                            deliveryDate: item[fileHeaders["Delivery Date"]],
                            deliveryStart: item[fileHeaders["Delivery Window Start"]],
                            deliveryEnd: item[fileHeaders["Delivery Window End"]],
                            timezone
                        }, 2);
                    }else if (item[fileHeaders["Pick up Date"]] && item[fileHeaders["Delivery Date"]]) {
                        timeWindow = await this.createTimeFormat({
                            pickupDate: moment(item[fileHeaders["Pick up Date"]]).format("YYYY-MM-DD"),
                            pickupStart: item[fileHeaders["Pick up Window Start"]],
                            pickupEnd: item[fileHeaders["Pick up Window End"]],
                            deliveryDate: item[fileHeaders["Delivery Date"]],
                            deliveryStart: item[fileHeaders["Delivery Window Start"]],
                            deliveryEnd: item[fileHeaders["Delivery Window End"]],
                            timezone
                        }, 3);
                    }
                    let newCons = false;
                    if (item.Type && item.Type == "pick up") {
                        orderType = 0;
                        pickupStr = `${item[fileHeaders["Zip Code"]]}+${item[fileHeaders["City"]]}+${item[fileHeaders["Customer Address"]]}+${item[fileHeaders["State"]]}`;
                        let LatLons = await Helper.orderLatLon({
                            pickupAddr: pickupStr
                        });
                        pickup = {
                            pickupLat: LatLons.pickupLatLon.data.status == "OK" ? LatLons.pickupLatLon.data.results[0].geometry.location.lat : 0,
                            pickupLon: LatLons.pickupLatLon.data.status == "OK" ? LatLons.pickupLatLon.data.results[0].geometry.location.lng : 0,
                            pickupCompanyName: item[fileHeaders["Customer name"]] ? item[fileHeaders["Customer name"]] : null,
                            pickupState: item[fileHeaders["State"]],
                            pickupStreetAddress: item[fileHeaders["Customer Address"]],
                            pickupCountry: LatLons.pickupAddress.pickCountry,
                            pickupCountryCode: LatLons.pickupAddress.pickCountryCode.toLowerCase(),
                            pickupCity: item[fileHeaders["City"]],
                            pickupZip: item[fileHeaders["Zip Code"]],
                            pickupStr: `${item[fileHeaders["Zip Code"]]} ${item[fileHeaders["City"]]} ${item[fileHeaders["Customer Address"]]} ${item[fileHeaders["State"]]}`
                        };
                        delivery = {
                            deliveryCompanyName: orderDepo.dataValues.name,
                            deliveryState: orderDepo.dataValues.state,
                            deliveryStreetAddress: orderDepo.dataValues.streetaddress,
                            deliveryCountry: orderDepo.dataValues.country,
                            deliveryCountryCode: orderDepo.dataValues.countryCode.toLowerCase(),
                            deliveryCity: orderDepo.dataValues.city,
                            deliveryZip: orderDepo.dataValues.zip,
                            deliveryLat: orderDepo.dataValues.lat,
                            deliveryLon: orderDepo.dataValues.lon,
                            deliverStr: orderDepo.dataValues.address
                        };
                    } else {
                        orderType = 1;
                        deliverStr = `${item[fileHeaders["Zip Code"]]} ${item[fileHeaders["City"]]} ${item[fileHeaders["Customer Address"]]} ${item[fileHeaders["State"]]}`;
                        
                        // updates from browser to check consigness exists
                        const existCons = item[fileHeaders["Customer name"]] ? await Consignees.findOne({
                            where: { companyLegalName: item[fileHeaders["Customer name"]] }
                        }) : false;

                        cons = existCons ? existCons : null;
                        
                        // cons = item[fileHeaders["Customer name"]] ? await Helper.getOne({
                        //     key: "companyLegalName",
                        //     value: item[fileHeaders["Customer name"]],
                        //     table: Consignees
                        // }) : null;
                        if (cons) {
                            createCons = {
                                status: 1
                            };
                            createCons = await this.updateConsignee({
                                id: cons.dataValues.id,
                                item,
                                fileHeaders,
                                serviceTime,
                                delivery: {
                                    from: timeWindow.deliveryDateFrom+"Z",
                                    to: timeWindow.deliveryDateTo+"Z"
                                },
                                proofSettings
                            });
                            cons = createCons.data;
                        }
                        if (!cons) {
                            createCons = await this.createConsignee({
                                item,
                                fileHeaders,
                                serviceTime,
                                delivery: {
                                    from: timeWindow.deliveryDateFrom+"Z",
                                    to: timeWindow.deliveryDateTo+"Z"
                                },
                                proofSettings
                            });
                            cons = createCons.data;
                            newCons = true;
                        }
                        if (newCons) {
                            delivery = createCons && !createCons.status ? null : {
                                deliveryCompanyName: cons.dataValues.companyLegalName,
                                deliveryState: cons.dataValues.points[0].address.state,
                                deliveryStreetAddress: cons.dataValues.points[0].address.streetAddress,
                                deliveryCountry: cons.dataValues.points[0].address.country,
                                deliveryCountryCode: cons.dataValues.points[0].address.countryCode.toLowerCase(),
                                deliveryCity: cons.dataValues.points[0].address.city,
                                deliveryZip: cons.dataValues.points[0].address.zip,
                                deliveryLat: cons.dataValues.points[0].address.lat,
                                deliveryLon: cons.dataValues.points[0].address.lon,
                                deliverStr
                            };
                        } else {
                            for (const con of cons.dataValues.points) {
                                if (con.address.streetAddress == item[fileHeaders["Customer Address"]] && con.address.city == item[fileHeaders["City"]] && con.address.state == item[fileHeaders["State"]]) {
                                    delivery = createCons && !createCons.status ? null : {
                                        deliveryCompanyName: cons.companyLegalName,
                                        deliveryState: con.address.state,
                                        deliveryStreetAddress: con.address.streetAddress,
                                        deliveryCountry: con.address.country,
                                        deliveryCountryCode: con.address.countryCode.toLowerCase(),
                                        deliveryCity: con.address.city,
                                        deliveryZip: con.address.zip,
                                        deliveryLat: con.address.lat,
                                        deliveryLon: con.address.lon,
                                        deliverStr
                                    };
                                }
                            }
                        }

                        pickup = {
                            pickupLat: orderDepo.dataValues.lat,
                            pickupLon: orderDepo.dataValues.lon,
                            pickupCompanyName: orderDepo.dataValues.name,
                            pickupState: orderDepo.dataValues.state,
                            pickupStreetAddress: orderDepo.dataValues.streetaddress,
                            pickupCountry: orderDepo.dataValues.country,
                            pickupCountryCode: orderDepo.dataValues.countryCode.toLowerCase(),
                            pickupCity: orderDepo.dataValues.city,
                            pickupZip: orderDepo.dataValues.zip,
                            pickupStr: orderDepo.dataValues.address
                        };
                    }
                    if (createCons && !createCons.status) {
                        errorArr.push({
                            ID: item[fileHeaders["Order Number"]],
                            Cause: "Could not create the order and the customer due to the customer's wrong address",
                            status: 0
                        });
                    } else {
                        let timeWindows = await Check.newTimeWindow({
                            pickupdateFrom: timeWindow.pickupDateFrom+"Z",
                            pickupdateTo: timeWindow.pickupDateTo+"Z",
                            deliverydateFrom: timeWindow.deliveryDateFrom+"Z",
                            deliverydateTo: timeWindow.deliveryDateTo+"Z",
                            companyName
                        });
                        delete timeWindows.status;
                        const { distDur, msg, status } = await Warnings.createOrder({
                            pickupLat: pickup.pickupLat,
                            pickupLon: pickup.pickupLon,
                            deliveryLat: delivery.deliveryLat,
                            deliveryLon: delivery.deliveryLon
                        });
                        let products = [
                            {
                                HandlingType_id: fileHeaders["type"] && item[fileHeaders["type"]] ? item[fileHeaders["type"]] : 33,
                                volume: item[fileHeaders["Volume"]]/item[fileHeaders["Quantity"]],
                                Quantity: item[fileHeaders["Quantity"]]*1,
                                Weight: item[fileHeaders["Weight"]]/item[fileHeaders["Quantity"]],
                                Length: item[fileHeaders["Size"]]/item[fileHeaders["Quantity"]],
                                productdescription: "",
                                freightclasses_id: 0,
                                nmfcnumber: "0",
                                nmfcsubcode: "0"
                            }
                        ];
                        let ordClass =  new OrderClass({data: {
                            order: {
                                depoid: orderDepo.dataValues.id,
                                po: item[fileHeaders["Order Number"]] ? item[fileHeaders["Order Number"]] : null,
                                eqType: 4,
                                //pickup
                                pickupCompanyName: pickup.pickupCompanyName,
                                pickupState: pickup.pickupState,
                                pickupStreetAddress: pickup.pickupStreetAddress,
                                pickupCountry: pickup.pickupCountry,
                                pickupCountryCode: pickup.pickupCountryCode,
                                pickupCity: pickup.pickupCity,
                                pickupZip: pickup.pickupZip,
                                pickupdateFrom: timeWindow.pickupDateFrom+"Z",
                                pickupdateTo: timeWindow.pickupDateTo+"Z",
                                //delivery
                                deliveryCompanyName: delivery.deliveryCompanyName,
                                deliveryState: delivery.deliveryState,
                                deliveryStreetAddress: delivery.deliveryStreetAddress,
                                deliveryCountry: delivery.deliveryCountry,
                                deliveryCountryCode: delivery.deliveryCountryCode,
                                deliveryCity: delivery.deliveryCity,
                                deliveryZip: delivery.deliveryZip,
                                deliverydateFrom: timeWindow.deliveryDateFrom+"Z",
                                deliverydateTo: timeWindow.deliveryDateTo+"Z",
                                pieceCount: item[fileHeaders["Quantity"]],
                                timeWindows,
                                cube: item[fileHeaders["Volume"]] && typeof(+item[fileHeaders["Volume"]]) == "number" ? item[fileHeaders["Volume"]]*1 : 1,
                                feet: item[fileHeaders["Size"]] && typeof(+item[fileHeaders["Size"]]) == "number" ? item[fileHeaders["Size"]]*1 : 1,
                                weight: item[fileHeaders["Weight"]] && typeof(+item[fileHeaders["Weight"]]) == "number" ? item[fileHeaders["Weight"]]*1 : 1,
                                servicetime: serviceTime + (pieceTime * item[fileHeaders["Quantity"]]),
                                pieceTime,
                                flowType: 2,
                                orderType: orderType
                            },
                            consignees: cons,
                            pickupLatLon:{
                                lat: pickup.pickupLat,
                                lon: pickup.pickupLon
                            },
                            // consignees:,
                            deliveryLatLon:{
                                lat: delivery.deliveryLat,
                                lon: delivery.deliveryLon
                            },
                            distDur,
                            delivery: deliverStr,
                            pickup: pickupStr,
                            status
                        }});
                        let newOrder = await ordClass.create().catch(err => {
                            console.log("order create: ", err.message);
                        });
                        let uploadCl = new UploaderClass({
                            units: products,
                            orderId: newOrder.id,
                            req
                        });
                        let handlingUnits = await uploadCl.saveHandlingUnits().catch(err => {
                            console.log("Handling create: ", err.message);
                        });
                        createdOrders.push({
                            ...newOrder.dataValues,
                            "products": handlingUnits.handlingUnit
                        });
                        console.log(i);
                    }
                    
                }
            }
        }
        const upClass = new UploadClass({ data: {
            UUID: uuid,
            status: 2,
            failed: errorArr,
            FileName: fileName,
            userId,
            orderCount: createdOrders.length
        }});
        await upClass.edit();
        return Helper.getResponse(1, `Created ${createdOrders.length} Order`, {
            count: createdOrders.length
        });
    }

    async createConsignee(data) {
        let { item, fileHeaders, serviceTime, delivery, proofSettings } = data;
        let country = {}, LatLons, points = [], consignee;
        let deliveryStr = `${item[fileHeaders["Zip Code"]]}+${item[fileHeaders["City"]]}+${item[fileHeaders["Customer Address"]]}+${item[fileHeaders["State"]]}`;
        LatLons = await Helper.orderLatLon({
            deliveryAddr: deliveryStr
        });
        if (LatLons.deliveryLatLon.data.status == "ZERO_RESULTS") {
            return await Helper.getResponse(0, `Map: ${LatLons.deliveryLatLon.data.status}`);
        }
        for (const item of LatLons.deliveryLatLon.data.results[0].address_components) {
            if (item.types.includes("country")) {
                country = item;
            }
        }
        points = await Helper.pushPoints({
            LatLons,
            order: {
                deliveryZip: item[fileHeaders["Zip Code"]],
                deliveryCity: item[fileHeaders["City"]],
                deliveryState: item[fileHeaders["State"]],
                deliveryCountry: LatLons.deliveryLatLon.data.status == "OK" ? country.long_name : "",
                deliveryCountryCode: LatLons.deliveryLatLon.data.status == "OK" ? country.short_name.toLowerCase() : "",
                deliveryStreetAddress: item[fileHeaders["Customer Address"]],
                deliverydateFrom: delivery.from,
                deliverydateTo: delivery.to
            }
        });
        consignee = await Consignee.createInTimeOrderCreate({
            companyLegalName: item[fileHeaders["Customer name"]] ? item[fileHeaders["Customer name"]] : null,
            serviceTime: serviceTime ? serviceTime : 0,
            points: points,
            proofSettings
        });
        return consignee;
    }
    async updateConsignee(data) {
        let { item, fileHeaders, delivery, id } = data;
        let country = {}, LatLons, points = [], consignee;
        let deliveryStr = `${item[fileHeaders["Zip Code"]]}+${item[fileHeaders["City"]]}+${item[fileHeaders["Customer Address"]]}+${item[fileHeaders["State"]]}`;
        LatLons = await Helper.orderLatLon({
            deliveryAddr: deliveryStr
        });
        if (LatLons.deliveryLatLon.data.status == "ZERO_RESULTS") {
            return await Helper.getResponse(0, `Map: ${LatLons.deliveryLatLon.data.status}`);
        }
        for (const item of LatLons.deliveryLatLon.data.results[0].address_components) {
            if (item.types.includes("country")) {
                country = item;
            }
        }
        points = await Helper.pushPoints({
            LatLons,
            order: {
                deliveryZip: item[fileHeaders["Zip Code"]],
                deliveryCity: item[fileHeaders["City"]],
                deliveryState: item[fileHeaders["State"]],
                deliveryCountry: LatLons.deliveryLatLon.data.status == "OK" ? country.long_name : "",
                deliveryCountryCode: LatLons.deliveryLatLon.data.status == "OK" ? country.short_name.toLowerCase() : "",
                deliveryStreetAddress: item[fileHeaders["Customer Address"]],
                deliverydateFrom: delivery.from,
                deliverydateTo: delivery.to
            }
        });
        consignee = await Consignee.updateInTimeOrderCreate({
            points: points,
            id
        });
        return consignee;
    }

    async createTimeFormat(data, key) {
        let { deliveryDate, period, timezone, deliveryStart, deliveryEnd } = data;
        let { pickupDate, pickupStart, pickupEnd } = data;
        let zone = timezone.split("C")[1].split(":")[0];
        let pickupDateFrom, pickupDateTo, deliveryDateFrom, deliveryDateTo, deliveryStatus = 1, pickupStatus = 1;

        deliveryStart = moment(deliveryStart, "H:mm").format("HH:mm");
        deliveryEnd = moment(deliveryEnd, "H:mm").format("HH:mm");
        pickupStart = moment(pickupStart, "H:mm").format("HH:mm");
        pickupEnd = moment(pickupEnd, "H:mm").format("HH:mm");

        if (deliveryEnd && moment(deliveryStart, "H:mm") >= moment(deliveryEnd, "H:mm")) {
            deliveryStatus = 0;
        }
        if (pickupStart && pickupEnd && moment(pickupStart, "H:mm") >= moment(pickupEnd, "H:mm")) {
            pickupStatus = 0;
        }
        if (key == 1) {
            pickupDateFrom = moment(`${deliveryDate}T00:00:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            pickupDateTo = moment(`${deliveryDate}T${deliveryStart}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            deliveryDateFrom = moment(`${deliveryDate}T${deliveryStart}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            deliveryDateTo = moment(`${deliveryDate}T${deliveryStart}:00.000`).subtract(zone, "hours").add(period, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
        } else if (key == 2) {
            pickupDateFrom = moment(`${deliveryDate}T00:00:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            pickupDateTo = moment(`${deliveryDate}T${deliveryStart}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            deliveryDateFrom = moment(`${deliveryDate}T${deliveryStart}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            deliveryDateTo = !deliveryStatus
            ? moment(`${deliveryDate}T${deliveryEnd}:00.000`).add(1, "day").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")
            : moment(`${deliveryDate}T${deliveryEnd}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
        } else if (key == 3) {
            pickupDateFrom = moment(`${pickupDate}T${pickupStart}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            pickupDateTo = !pickupStatus
            ? moment(`${pickupDate}T${pickupEnd}:00.000`).add(1, "day").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")
            : moment(`${pickupDate}T${pickupEnd}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            deliveryDateFrom = moment(`${deliveryDate}T${deliveryStart}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
            deliveryDateTo = !deliveryStatus
            ? moment(`${deliveryDate}T${deliveryEnd}:00.000`).add(1, "day").subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS")
            : moment(`${deliveryDate}T${deliveryEnd}:00.000`).subtract(zone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS");
        }
        return {
            pickupDateFrom,
            pickupDateTo,
            deliveryDateFrom,
            deliveryDateTo
        };
    }

    async checkDateTimeFormats(data) {
        let { item, fileHeaders } = data, status = 1;
        let deliveryDate, deliveryStart, deliveryEnd;
        let pickupDate, pickupStart, pickupEnd;
        if (!item[fileHeaders["Pick up Date"]] && ((!item[fileHeaders["Delivery Window End"]] && item[fileHeaders["Delivery Period"]]) || (item[fileHeaders["Delivery Window End"]] && item[fileHeaders["Delivery Period"]]))) {
            deliveryDate = item[fileHeaders["Delivery Date"]] ? moment(item[fileHeaders["Delivery Date"]], ["YYYY-MM-DD", "M/DD/YY", "M/DD/YYYY", "MM/D/YYYY"], true) : 1;
            deliveryStart = item[fileHeaders["Delivery Window Start"]] ? moment(item[fileHeaders["Delivery Window Start"]], "H:mm", true) : 1;
        } else if (!item[fileHeaders["Pick up Date"]] && item[fileHeaders["Delivery Window End"]] && !item[fileHeaders["Delivery Period"]]) {
            deliveryDate = item[fileHeaders["Delivery Date"]] ? moment(item[fileHeaders["Delivery Date"]], ["YYYY-MM-DD", "M/DD/YY", "M/DD/YYYY", "MM/D/YYYY"], true) : 1;
            deliveryStart = item[fileHeaders["Delivery Window Start"]] ? moment(item[fileHeaders["Delivery Window Start"]], "H:mm", true) : 1;
            deliveryEnd = item[fileHeaders["Delivery Window End"]] ? moment(item[fileHeaders["Delivery Window End"]], "H:mm", true) : 1;
        }else if (item[fileHeaders["Pick up Date"]] && item[fileHeaders["Delivery Date"]]) {
            pickupDate = item[fileHeaders["Pick up Date"]] ? moment(item[fileHeaders["Pick up Date"]], ["YYYY-MM-DD", "M/DD/YY", "M/DD/YYYY", "MM/D/YYYY"], true) : 1;
            pickupStart = item[fileHeaders["Pick up Window Start"]] ? moment(item[fileHeaders["Pick up Window Start"]], "H:mm", true) : 1;
            pickupEnd = item[fileHeaders["Pick up Window End"]] ? moment(item[fileHeaders["Pick up Window End"]], "H:mm", true) : 1;
            deliveryDate = item[fileHeaders["Delivery Date"]] ? moment(item[fileHeaders["Delivery Date"]], ["YYYY-MM-DD", "M/DD/YY", "M/DD/YYYY", "MM/D/YYYY"], true) : 1;
            deliveryStart = item[fileHeaders["Delivery Window Start"]] ? moment(item[fileHeaders["Delivery Window Start"]], "H:mm", true) : 1;
            deliveryEnd = item[fileHeaders["Delivery Window End"]] ? moment(item[fileHeaders["Delivery Window End"]], "H:mm", true) : 1;
        }
        if ((deliveryDate && !deliveryDate.isValid()) || (deliveryStart && !deliveryStart.isValid()) || (deliveryEnd && !deliveryEnd.isValid()) ||
            (pickupDate && !pickupDate.isValid()) || (pickupStart && !pickupStart.isValid()) || (pickupEnd && !pickupEnd.isValid())) {
            status = 0;
        }
        return { status };
    }
};
