// const axios = require("axios");
// const dateFormat = require("dateformat");
const db = require("../config/db.config.js");
const osrm = require("../controller/osmap.controller");
const orderController = require("../controller/orderscontroller");
const Helper = require("../classes/helpers");
const ClassLoad = require("../classes/load");
const Calculations = require("../classes/calculations");
const DragDrop = require("../classes/dragdrop");
const Checks = require("../classes/checks");
const driverClass = require("../classes/driver");
const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");
const { NorderAttrb,OrderAttr } = require("../classes/joinColumns.js");
const Errors = require("../errors/loadBuildingErrors");
const Warnings = require("../warnings/loadBuildingWarnings");
const Mailer = require("../classes/mailer");
const Algopost = require("../classes/alghopost");
const constants = require("../constants/socket");

// Services
const Notification = require('../classes/notification');
const NotificationService = new Notification();

// const OrderAttr = [
//     ...NorderAttrb,
//     // "transporttypes.color",
//     "statuses.color as statusColor",
//     "statuses.id as statusId",
//     "statuses.name as statusName",
//     "statuses.statustype as statusType",
//     "transporttypes.name as LoadType"
// ];

// Sequelize
const Op = db.Sequelize.Op;
const seq = db.sequelize;

// Models 
const LoadTemp = db.loadTemp;
const Order = db.order;
const Driver = db.driver;
const Load = db.load;
const Job = db.job;
const Equipment = db.equipment;
const companyEquipment = db.companyequipment;
const Depo = db.depo;
const Shift = db.shift;

const includeFalse = [{ all: true, nested: false }];
const includeTrue = [{ all: true, nested: true }];


// Methods
exports.create = async (req, res) => {
    try {
        const errors = await Errors.manualLoadTempErrors(req.body);
        let { timezone } = req.headers;
        if (errors.error) {
            res.status(409).json({ msg: errors.msg, status: 0 });
        } else {
            let ret, tables, query;
            if (req.body.flowType == 2) {
                ret = req.body.return;
            } else if (req.body.flowType == 1) { ret = 0; } // ret = 1 not return;

            let driver;
            if (req.body.driverId) {
                driver = await Driver.findOne({ where: { id: req.body.driverId }, include: [{ all: true, nested: false }] });
            }

            let feelRates = 0;
            let permileRates = 0;
            tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
            query = await Helper.createSelectQueryWithJoin5(tables, req.body.orders, OrderAttr);
            const orders = await seq.query(query, { type: seq.QueryTypes.SELECT });

            const LatLon = await Helper.getLatLon({
                depoId: req.body.depoId,
                flowType: req.body.flowType,
                return: req.body.return
            }, orders);
            const { distDur, status, msg } = await osrm.GetDistDur(LatLon);
            if (!status) {
                return res.json(await Helper.getResponse(0, msg));
            }
            for (const item of orders) {
                feelRates += item.rate;
                permileRates += item.permileRate;
            }

            const depo = await Depo.findOne({ where: { id: req.body.depoId } });

            let shift;
            if (driver && driver.dataValues.shiftId) { shift = await Shift.findOne({ where: { id: driver.dataValues.shiftId } }); }

            let data = { ...req.body, feelRates, permileRates, order: orders, driver, ret, "planType": "Manual" };
            let ld = new ClassLoad({ data, temp: 1 });
            const newLoadTemp = await ld.create();

            // call algo sequnse  ?


            //let { legs } = distDur; // ? 

            let { start, end, endAddress, startAddress } = await setLoadLocationAndAddressByFlowtype(req.body.flowType, ret, depo, data.order);
            console.log(endAddress, startAddress);


            // empty milage
            let mobj = { load: newLoadTemp, order: orders, start, end, ret, orderIds: newLoadTemp.orders, };
            let emptymile = req.body.flowType == 2 || req.body.flowType == 1 ? await Calculations.emptymileage(mobj) : 0;

            const equipment = await Equipment.findOne({
                where: { id: req.body.equipmentName }, include: includeFalse
            }).catch(err => { console.log("equipment", err); });

            const load = await LoadTemp.findOne({
                where: { id: newLoadTemp.id }, include: includeFalse
            }).catch(err => { console.log("load", err); });

            await LoadTemp.update({
                nickname: `${newLoadTemp.nickname}${newLoadTemp.id}`,
                emptymile: emptymile,
                carTypes: [equipment],
                start: JSON.stringify(start),
                end: JSON.stringify(end),
                endAddress,
                startAddress
            }, {
                where: { id: newLoadTemp.id },
            });
            let newLoad = await LoadTemp.findOne({
                where: {
                    id: newLoadTemp.id
                }
            });
            // Sequense

            let sequense, seqStatus, ordersStr, startTime, algo, infCount;
            // sequense = await Helper.getSingleLoadSequence(req, newLoad),
            seqStatus = sequense ? sequense.data[0].Status : 1;
            infCount = seqStatus == 3 ? sequense.data[0].Infeasibles.length : 0;
            algo = sequense ? sequense.data[0].Algorithm : 0;
            let seqWarning = {
                msg: "false"
            };
            if (seqStatus == 3 && infCount == 0) {
                ordersStr = sequense.data[0].Loads[0].OrderIDs.join(",");
                startTime = sequense.data[0].Loads[0].FirstNodeStartTime;
            } else if (seqStatus == 2) {
                ordersStr = req.body.orders;
                startTime = req.body.startTime;
                seqWarning.msg = sequense.data[0].Exception.Message;
            } else {
                seqStatus = 2;
                ordersStr = load.orders;
                startTime = load.startTime;
                seqWarning.msg = "Sequence algorithm cannot be used as there is an infeasible order in the load.";
            }


            // tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
            // query = await Helper.createSelectQueryWithJoin5(tables, ordersStr, OrderAttr);
            // const orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
            // const LatLon = await Helper.getLatLon(newLoadTemp, orders);
            // const { distDur } = await osrm.GetDistDur(LatLon);

            // let totalDuration = distDur.duration;
            let { totalDuration } = await Helper.calcTotalDuration2({
                load,
                news: orders,
                distDur,
                shift
            });
            await Calculations.stops({ loads: load, orders, loadType: 0, timezone }, true);


            let bool = false;
            let message = "";
            let warnings = await Warnings.manualLoadTempWarnings({ ...req.body, driver, totalDuration, shift: load.shift });
            if (warnings.error) { bool = true; message = warnings.msg; }

            await LoadTemp.update({
                orders: ordersStr,
                startTime: startTime,
                totalDistance: distDur.distance,
                totalDuration: totalDuration,
            }, {
                where: {
                    id: newLoadTemp.id
                }
            });
            let endLoad = await LoadTemp.findOne({
                where: {
                    id: newLoadTemp.id
                }
            });

            let oids = await Helper.splitToIntArray(req.body.orders, ",");
            let isPlanOrders = await Order.findAndCountAll({
                where: { id: { [Op.in]: oids } }
            });
            let orderArr;
            for (const order of isPlanOrders.rows) {
                orderArr = order.loadTempIds;
                orderArr.push(newLoadTemp.id);

                await Order.update({
                    loadTempIds: orderArr
                }, { where: { id: order.id } }).catch(err => {
                    res.status(500).send({ status: 0, msg: err.message, data: req.body });
                });
            }
            res.status(201).send({
                status: 1,
                load_id: endLoad.id,
                data: endLoad,
                warning: bool,
                msg: !bool ? "ok" : message,
                seqStatus,
                seqWarning: seqWarning.msg
            });
        }
    } catch (err) {
        console.log("Error: ", err.message);
        res.status(409).send({ status: 0, msg: err.message, err: err, data: req.body });
    }
};

exports.edit = async (req, res) => {
    const eqAttr = [
        "name",
        "type",
        "value",
        "eqType",
        "createdAt",
        "maxVolume",
        "maxweight",
        "updatedAt",
        "valueUnit",
        "horsePower",
        "trailerType",
        "externalWidth",
        "internalWidth",
        "externalHeight",
        "externalLength",
        "internalHeight",
        "internalLength"
    ];
    let assets, equipment, carTypes;
    let { timezone } = req.headers;
    if (req.body.assetId) {
        let compEquip = await companyEquipment.findOne({
            where: {
                id: req.body.assetId
            },
            include: includeFalse
        });
        assets = compEquip.dataValues;
    }
    if (req.body.equipmentId) {
        let equip = await Equipment.findOne({
            attributes: eqAttr,
            where: {
                id: req.body.equipmentId
            }
        });
        equipment = equip.dataValues;
    }
    carTypes = {
        ...assets,
        ...equipment
    };
    let updateObj = {
        nickname: req.body.nickname,
        assetsId: req.body.assetId ? req.body.assetId : 0,
        driverId: req.body.driverId,
        equipmentId: req.body.equipmentId ? req.body.equipmentId : 0,
        loadCost: req.body.loadCost,
        startTime: req.body.startTime,
        carTypes: [carTypes],
        endTime: req.body.endTime
    };
    const loadTemp = await Helper.getOne({ key: "id", value: req.params.id, table: LoadTemp });
    let totalDuration;
    if (req.body.driverId && loadTemp.driverId != req.body.driverId) {
        let newDriver = await Helper.getOne({ key: "id", value: req.body.driverId, table: Driver });
        totalDuration = (loadTemp.totalDuration - loadTemp.shift.rest) + newDriver.shift.rest;
        updateObj.totalDuration = totalDuration;
        updateObj.shiftId = newDriver.dataValues.shiftId;
    }

    let load = await Helper.changed({
        table: LoadTemp,
        user: req.user,
        type: "edit",
        loadId: req.params.id,
        object: updateObj
    });
    if (req.body.editDriver) {
        let driver = await Driver.findOne({ where: { id: req.body.driverId } });
        let driverCl = new driverClass({
            data: {
                ...driver.dataValues,
                assetId: req.body.assetId
            }
        });
        await driverCl.edit();
    }
    const updateLoadTemp = await LoadTemp.findOne({
        where: {
            id: req.params.id
        },
        include: includeFalse
    });
    if (load[0]) {
        let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"], orders;
        await Helper.joinOrders(updateLoadTemp, updateLoadTemp.dataValues.orders, OrderAttr);
        let query = await Helper.createSelectQueryWithJoin5(tables, updateLoadTemp.orders, OrderAttr);
        orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
        if (orders) {
            const { allStops, status } = await Calculations.stops({ loads: updateLoadTemp, orders, loadType: 0, timezone }, true);
            // updateLoadTemp.dataValues.ordersDatas = orders;
            if (status) {
                res.status(200).send({
                    status: 1,
                    msg: "ok",
                    data: updateLoadTemp,
                    allStops
                });
            }

        } else {
            res.status(409).send({
                msg: "Can not access orders table",
                status: 0
            });
        }
    } else {
        res.status(201).send({
            status: 0,
            msg: "LoadTemp doesn\"t updated",
            data: updateLoadTemp
        });
    }
};

// // 
exports.getall = async (req, res) => {
    let sortAndPagination = await Helper.sortAndPagination(req);
    let where = req.query;
    where.disabled = 0;
    const data = await Helper.filters(where, Op, "loadTemp");
    // console.log(data);
    if (data.bool) {
        LoadTemp.findAndCountAll({
            where: data.where,
            include: [{ all: true, nested: false }],
            distinct: true,
            ...sortAndPagination
        }).then(async loads => {
            if (loads.rows.length) {
                let currentLoads = loads.rows;
                let lids = [];
                let oids = [];
                let quantity;
                for (let i = 0; i < currentLoads.length; i++) {
                    quantity = 0;
                    // if(currentLoads[i].planType == "Auto"){ currentLoads[i].totalDuration = currentLoads[i].totalDuration*60;    } // tem solution
                    if (currentLoads[i].orders && currentLoads[i].orders.length > 0) {
                        oids.push(currentLoads[i].orders);
                    }
                    lids.push(currentLoads[i].id);
                    currentLoads[i].dataValues.ordersDatas = [];
                    currentLoads[i].dataValues.pieceTotalQuantity = 0;
                    await Helper.joinOrders(currentLoads[i], currentLoads[i].orders, OrderAttr);
                    currentLoads[i].dataValues.ordersDatas.map(item => quantity += item.pieceCount ? item.pieceCount : 0);
                    currentLoads[i].dataValues.pieceTotalQuantity = quantity;

                    // lids.push(currentLoads[i].id);
                    // currentLoads[i].dataValues.ordersDatas = [];
                    // await Helper.joinOrders(currentLoads[i], currentLoads[i].orders, OrderAttr);
                    // currentLoads[i].dataValues.ordersDatas.map(item => quantity += item.pieceCount ? item.pieceCount : 0);
                    // currentLoads[i].dataValues.pieceTotalQuantity = quantity;
                }

                res.status(200).send({
                    status: 1,
                    msg: "ok",
                    data: {
                        loads: currentLoads,
                        total: loads.count
                    }
                });
            } else {
                res.status(200).send({
                    status: 1,
                    msg: "ok",
                    data: {
                        loads: [],
                        total: 0
                    }
                });
            }


        }).catch(err => {
            res.status(500).send({
                "description": "Can not access loads table",
                "error": err
            });
        });
    } else {
        res.status(200).send({
            status: 1,
            msg: "fillter incorrect",
            data: {
                loads: [],
                total: 0
            }
        });
    }

};

exports.get = (req, res) => {
    var id = req.params.id;

    LoadTemp.findOne({
        where: {
            id: id
        }, include: [{ all: true, nested: false }],
    })
        .then(load => {

            // let tables = ["orders", "Customers"];
            let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
            let query = Helper.createSelectQueryWithJoin5(tables, load.orders, OrderAttr);
            // console.log(query);
            seq.query(query, { type: seq.QueryTypes.SELECT })
                .then(orders => {
                    //  if(load.planType == "Auto"){ load.totalDuration = load.totalDuration*60;   }  // temp solution 

                    load.dataValues.ordersDatas = orders;
                    res.status(200).send({
                        status: 1,
                        msg: "ok",
                        data: load
                    });

                }).catch(err => {
                    res.status(500).send({
                        "description": "Can not access orders table",
                        "error": err
                    });
                });
        }).catch(err => {
            res.status(500).send({
                "description": "Can not access loads table",
                "error": err.msg
            });
        });
};

// // 
exports.delete = (req, res) => {
    console.log(req);
    var ids = req.query.ids;
    if (!ids || ids.trim() == "") {
        req.status(500).send({
            status: 0,
            msg: "no ids for delete"
        });
        return;
    }

    Order.update({
        load_id: 0,
        status: 1
    }, {
        where: {
            load_id: {
                [Op.in]: Helper.splitToIntArray(ids, ",")
            }
        }
    }).then(() => {
        LoadTemp.destroy({
            where: {
                id: {
                    [Op.in]: ids.split(",")
                }
            }
        }).then(load => {
            res.status(200).send({
                status: 1,
                msg: "ok",
                data: load
            });
        }).catch(err => {
            //console.log(err)
            res.status(500).send({
                "description": "Can not access loads table",
                "error": err
            });
        });
    }).catch(err => {
        //console.log(err)
        res.status(500).send({
            "description": "Can not access orders  table",
            "error": err
        });
    });
};

exports.dissolveMany = async (req, res) => {
    let { loadIds } = req.body, loadTemps;
    console.log(loadIds);

    loadTemps = await LoadTemp.findAndCountAll({
        attributes: ["id", "orders", "UUID", "flowType"],
        where: {
            id: {
                [Op.in]: loadIds //.split(",")
            }
        }
    });
    if (loadTemps) {
        let loadArr = [];
        for (var i = 0; i < loadTemps.rows.length; i++) {
            loadArr.push({
                id: loadTemps.rows[i].dataValues.id,
                orderIds: loadTemps.rows[i].dataValues.orders,
                flowType: loadTemps.rows[i].dataValues.flowType
            });
        }
        await Helper.unplannedOrders({
            loadArr
        });
        let loads = await LoadTemp.destroy({
            where: {
                id: {
                    [Op.in]: loadIds //.split(",")
                }
            }
        });
        loadTemps = await LoadTemp.findAndCountAll({
            attributes: ["id", "orders", "UUID"],
            where: {
                id: {
                    [Op.in]: loadIds
                }
            }
        });
        // await Helper.checkLoadsByUUID({
        //     table: LoadTemp,
        //     loadTemps: loadTemps.rows
        // });
        res.status(200).send({
            status: 1,
            msg: "ok",
            data: loads
        });
    } else {
        res.status(500).send({
            msg: "Can not access loads  table",
            status: 0
        });
    }

};

exports.dissolve = async (req, res) => {
    var id = req.params.id;
    let loadTemps;

    loadTemps = await LoadTemp.findAndCountAll({
        attributes: ["id", "UUID", "flowType"],
        where: {
            id: id,
        }
    });
    if (loadTemps) {
        await Order.update({
            status: 0,
            load_id: 0,
            isPlanned: 0
        }, {
            where: {
                load_id: id
            }
        });
        await LoadTemp.destroy({
            where: {
                id: id
            }
        });
        // if (loadTemps.rows[0].UUID) {
        //     await Helper.checkLoadsByUUID({
        //         table: LoadTemp,
        //         loadTemps: loadTemps.rows
        //     });
        // }

        res.status(200).send({
            status: 1,
            msg: `${id} LoadTemp unplanned!`,
        });
    } else {
        res.status(409).send({
            msg: "Can not access loads  table",
            status: 0
        });
    }
};

// // 
exports.updateOrdersOrdering = (req, res) => {
    let id = req.body.id;
    let idsStr = req.body.idsStr;
    let { timezone } = req.headers;


    LoadTemp.findOne({
        where: { id: id },
        include: includeFalse
    }).then(async load => {
        if (!load) {
            res.status(500).send({ status: 0, msg: "no load with id", data: id });
            return;
        }
        const depo = await Depo.findOne({
            where: {
                id: load.depoId
            }
        });
        seq.query(Helper.createSelectQuery("orders", idsStr), { type: seq.QueryTypes.SELECT })
            .then(async news => {
                let newpoints = await Helper.getLatLon(load, news);
                let { distDur, status } = await osrm.GetDistDur(newpoints);
                if (!status) {
                    res.status(500).send({
                        msg: distDur.msg,
                        status: 0
                    });
                }
                let { totalDuration, recharge } = await Helper.calcTotalDuration2({
                    load,
                    news,
                    distDur
                });
                let start = {}, end = {}, endAddress;
                if (load.flowType == 1) { // LP2D
                    // start.Lat = order[0].pickupLat*1;
                    // start.Lon = order[0].pickupLon*1;
                    start.Lat = depo.lat;
                    start.Lon = depo.lon;
                    end.Lat = depo.lat;
                    end.Lon = depo.lon;
                    endAddress = depo.address;
                } else if (load.flowType == 2) { // D2E

                    start.Lat = depo.lat;
                    start.Lon = depo.lon;
                    if (load.return == 1) { // ret = 1 not return

                        end.Lat = news[news.length - 1].deliveryLat;
                        end.Lon = news[news.length - 1].deliveryLon;
                        endAddress = news[news.length - 1].delivery;


                    } else {

                        end.Lat = depo.lat;
                        end.Lon = depo.lon;
                        endAddress = depo.address;

                    }

                }
                let emptymile = load.flowType == 2 || load.flowType == 1 ? await Calculations.emptymileage({
                    load,
                    order: news,
                    orderIds: idsStr,
                    start,
                    end,
                    ret: load.return
                }) : 0;
                let updateObj = {
                    start: JSON.stringify(start),
                    end: JSON.stringify(end),
                    endAddress,
                    orders: idsStr,
                    totalDistance: distDur.distance,
                    totalDuration: totalDuration,
                    emptymile: emptymile,
                    busy: 1
                };
                await Helper.changed({
                    table: LoadTemp,
                    user: req.user,
                    type: "updateOrdersOrdering",
                    loadId: id,
                    object: updateObj
                });
                let newLoad = await LoadTemp.findOne({
                    where: {
                        id: load.id
                    },
                    include: includeFalse
                });
                newLoad.dataValues.ordersDatas = [];
                let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"], orders, flag = false;
                let query = await Helper.createSelectQueryWithJoin5(tables, idsStr, OrderAttr);
                orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
                if (orders) {
                    let oids = [];
                    if (newLoad.orders && newLoad.orders.length > 0) {
                        oids = newLoad.orders.split(",");
                        orders.forEach(o => {
                            oids.forEach(oid => {
                                if (o.id == oid) {
                                    newLoad.dataValues.ordersDatas.push(o);
                                }
                            });
                        });
                    }
                    let updatedLoad = await Calculations.stops({ loads: newLoad, orders, loadType: 0, timezone }, true);

                    newLoad = await LoadTemp.findOne({
                        where: {
                            id: load.id
                        },
                        include: includeFalse
                    });
                    newLoad.dataValues.ordersDatas = updatedLoad.newLoad.ordersDatas;
                    res.status(200).send({
                        status: 1,
                        msg: "ok",
                        data: {
                            id: id,
                            idsStr: idsStr,
                            newLoad: updatedLoad.newLoad
                        }
                    });
                } else {
                    res.status(500).send({
                        msg: "Can not access orders table",
                        status: 0
                    });
                }
            });
    }).catch(err => {
        console.log("Error: ", err.message);
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        //console.log("4")
    });
};

exports.removeOrderFromLoadTemp = async (req, res) => {            // need some changes yet

    let { timezone } = req.headers;
    let ordersIdsArr = await Helper.splitToIntArray(req.body.idsStr, ",");

    ordersIdsArr = ordersIdsArr.filter(id => {
        return parseInt(id, 10) !== req.body.orderId;
    });
    const removeOrder = await Order.findOne({
        where: {
            id: req.body.orderId
        }
    });
    console.log("ordersIdsArr", ordersIdsArr);
    let info = removeOrder.timeInfo;
    delete info.loadTemps[req.body.loadid];
    if (!ordersIdsArr.length) {
        await LoadTemp.destroy({
            where: {
                id: req.body.loadid
            }
        });
        let orderArr;
        orderArr = removeOrder.loadTempIds;
        orderArr = orderArr.filter(order => {
            return order != req.body.loadid;
        });

        await Order.update({
            loadTempIds: orderArr,
            timeInfo: info,
            status: 0,
            isPlanned: 0
        }, { where: { id: req.body.orderId } });
        res.json({
            status: 0,
            msg: "The load will be deleted as there are no orders in it.",
            delete: true,
            newLoad: []
        });
    } else {
        const ordersIdsUpdated = ordersIdsArr.join(",");
        LoadTemp.findOne({
            where: {
                id: req.body.loadid
            },
            include: includeFalse
        })
            .then(async load => {
                const depo = await Depo.findOne({
                    where: {
                        id: load.depoId
                    }
                });
                //  let ooids = splitToIntArray(load.orders, ",");
                //  let noids = splitToIntArray(req.body.idsStr, ",");

                let odistance;
                let oduration;

                seq.query(Helper.createSelectQuery("orders", load.orders), { type: seq.QueryTypes.SELECT })
                    .then(async old => {

                        let oldpoints = await Helper.getLatLon(load, old);

                        osrm.GetDistDur(oldpoints)
                            .then(dt => {
                                odistance = dt.distDur.distance;
                                oduration = dt.distDur.duration;
                            })
                            .then(() => {
                                seq.query(Helper.createSelectQuery("orders", ordersIdsUpdated), { type: seq.QueryTypes.SELECT })
                                    .then(async news => {

                                        let newpoints = await Helper.getLatLon(load, news);
                                        let { distDur } = await osrm.GetDistDur(newpoints);
                                        // let totalDuration = distDur.duration;
                                        let { totalDuration, recharge } = await Helper.calcTotalDuration2({
                                            load,
                                            news,
                                            distDur
                                        });

                                        let start = {}, end = {}, endAddress;
                                        if (load.flowType == 1) { // LP2D
                                            // start.Lat = order[0].pickupLat*1;
                                            // start.Lon = order[0].pickupLon*1;
                                            start.Lat = depo.lat;
                                            start.Lon = depo.lon;
                                            end.Lat = depo.lat;
                                            end.Lon = depo.lon;
                                            endAddress = depo.address;
                                        } else if (load.flowType == 2) { // D2E

                                            start.Lat = depo.lat;
                                            start.Lon = depo.lon;
                                            if (load.return == 1) { // ret = 1 not return

                                                end.Lat = news[news.length - 1].deliveryLat;
                                                end.Lon = news[news.length - 1].deliveryLon;
                                                endAddress = news[news.length - 1].delivery;


                                            } else {

                                                end.Lat = depo.lat;
                                                end.Lon = depo.lon;
                                                endAddress = depo.address;
                                            }

                                        }
                                        let emptymile = load.flowType == 2 || load.flowType == 1 ? await Calculations.emptymileage({
                                            load,
                                            order: news,
                                            orderIds: ordersIdsUpdated,
                                            start,
                                            end,
                                            ret: load.return
                                        }) : 0;
                                        if (distDur) {
                                            let updateObj = {
                                                start: JSON.stringify(start),
                                                end: JSON.stringify(end),
                                                endAddress,
                                                orders: ordersIdsUpdated,
                                                stops: news.length,
                                                totalDistance: distDur.distance,
                                                totalDuration: totalDuration,
                                                weight: load.weight - removeOrder.weight,
                                                cube: load.cube - removeOrder.cube,
                                                feet: load.feet - removeOrder.feet,
                                                feelRates: load.feelRates - removeOrder.rate,
                                                emptymile: emptymile,
                                                busy: 1
                                            };
                                            await Helper.changed({
                                                table: LoadTemp,
                                                user: req.user,
                                                type: "removeOrderFromLoadTemp",
                                                loadId: load.id,
                                                object: updateObj
                                            });
                                            let orderArr;
                                            orderArr = removeOrder.loadTempIds;
                                            orderArr = orderArr.filter(order => {
                                                return order != req.body.loadid;
                                            });

                                            await Order.update({
                                                loadTempIds: orderArr,
                                                timeInfo: info,
                                                status: 0,
                                                isPlanned: 0
                                            }, { where: { id: req.body.orderId } });
                                            let newLoad = await LoadTemp.findOne({
                                                where: {
                                                    id: load.id
                                                },
                                                include: includeFalse
                                            });
                                            newLoad.dataValues.ordersDatas = [];
                                            let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"], orders, flag;
                                            let query = await Helper.createSelectQueryWithJoin5(tables, ordersIdsUpdated, OrderAttr);
                                            orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
                                            if (orders) {
                                                let oids = [];
                                                if (newLoad.orders && newLoad.orders.split(",").length > 0) {
                                                    oids = newLoad.orders.split(",");
                                                    orders.forEach(o => {
                                                        oids.forEach(oid => {
                                                            if (o.id == oid) {
                                                                newLoad.dataValues.ordersDatas.push(o);
                                                            }
                                                        });
                                                    });
                                                }
                                                let updatedLoad = await Calculations.stops({ loads: newLoad, orders, loadType: 0, timezone }, true);

                                                newLoad = await LoadTemp.findOne({
                                                    where: {
                                                        id: load.id
                                                    },
                                                    include: includeFalse
                                                });
                                                newLoad.dataValues.ordersDatas = updatedLoad.newLoad.ordersDatas;
                                                // warnings = await Warnings.addOrderFromLoadWarning({ load: newLoad, order });

                                                res.status(200).send({
                                                    status: 1,
                                                    msg: "ok",
                                                    "Old Distance": odistance,
                                                    "Old Duration": oduration,
                                                    "New Distance": distDur.distance,
                                                    "New Duration": distDur.duration,
                                                    delete: false,
                                                    newLoad
                                                });
                                            } else {
                                                res.status(409).send({
                                                    msg: "Can not access orders table",
                                                    status: 0
                                                });
                                            }
                                        }
                                    }).catch(err => {
                                        res.status(500).send({ "Error On New order query": err });
                                    });

                            }).catch(err => { res.status(500).send({ "Error On map request": err }); });

                    }).catch(err => { res.status(500).send({ "Error On Old orders Query ": err }); });
            }).catch(err => {
                res.status(500).send({
                    "description": "Can not access loads table",
                    "error": err.msg
                });
            });
    }
};

exports.addOrderFromLoad = async (req, res) => {              //  Temp version need change 
    let id = req.body.loadid;
    let orderId = req.body.orderId;
    let { timezone } = req.headers;
    const order = await Order.findAndCountAll({
        where: {
            id: orderId
        }
    });

    LoadTemp.findOne({
        where: { id: id },
        include: includeFalse
    })
        .then(async load => {
            const depo = load.flowType == 2 || load.flowType == 1 ? await Depo.findOne({
                where: {
                    id: load.depoId
                }
            }) : null;
            // addOrderFromLoadErrors
            const errors = await Errors.addOrderFromLoadError({ load, order });
            if (errors.error) {
                res.status(409).json({
                    msg: errors.msg,
                    status: 0
                });
            } else {
                let warnings;
                let odistance;
                let oduration;
                let oldids = 0;
                let newids;

                if (!load.orders) {
                    newids = orderId;
                } else {

                    oldids = load.orders;
                    newids = load.orders + "," + orderId;

                }
                seq.query(Helper.createSelectQuery("orders", oldids), { type: seq.QueryTypes.SELECT })
                    .then(async old => {

                        if (oldids == 0) {

                            odistance = oduration = 0;

                            seq.query(Helper.createSelectQuery("orders", newids), { type: seq.QueryTypes.SELECT })
                                .then(async news => {
                                    let newpoints = await Helper.getLatLon(load, news);

                                    //  here -----
                                    let { distDur } = await osrm.GetDistDur(newpoints);
                                    // let totalDuration = distDur.duration;
                                    let { totalDuration, recharge } = await Helper.calcTotalDuration2({
                                        load,
                                        news,
                                        distDur
                                    });
                                    let start = {}, end = {}, endAddress;
                                    if (load.flowType == 1) { // LP2D
                                        // start.Lat = order[0].pickupLat*1;
                                        // start.Lon = order[0].pickupLon*1;
                                        start.Lat = depo.lat;
                                        start.Lon = depo.lon;
                                        end.Lat = depo.lat;
                                        end.Lon = depo.lon;
                                        endAddress = depo.address;
                                    } else if (load.flowType == 2) { // D2E

                                        start.Lat = depo.lat;
                                        start.Lon = depo.lon;
                                        if (load.return == 1) { // ret = 1 not return

                                            end.Lat = news[news.length - 1].deliveryLat;
                                            end.Lon = news[news.length - 1].deliveryLon;
                                            endAddress = news[news.length - 1].delivery;


                                        } else {

                                            end.Lat = depo.lat;
                                            end.Lon = depo.lon;
                                            endAddress = depo.address;

                                        }

                                    }
                                    const emptymile = load.flowType == 2 || load.flowType == 1 ? await Calculations.emptymileage({
                                        load,
                                        order: news,
                                        orderIds: newids,
                                        start,
                                        end,
                                        ret: load.return
                                    }) : 0;
                                    if (distDur) {
                                        let updateObj = {
                                            start: JSON.stringify(start),
                                            end: JSON.stringify(end),
                                            endAddress,
                                            orders: newids,
                                            totalDistance: distDur.distance,
                                            stops: news.length,
                                            totalDuration: totalDuration,
                                            weight: load.weight + order.rows[0].weight,
                                            cube: load.cube + order.rows[0].cube,
                                            feet: load.feet + order.rows[0].feet,
                                            feelRates: load.feelRates + order.rows[0].rate,
                                            emptymile: emptymile,
                                            busy: 1
                                        };
                                        await Helper.changed({
                                            table: LoadTemp,
                                            user: req.user,
                                            type: "addOrderFromLoad",
                                            loadId: id,
                                            object: updateObj
                                        });

                                        let isPlanOrders = await Order.findOne({
                                            where: { id: orderId }
                                        });
                                        let orderArr;
                                        orderArr = isPlanOrders.loadTempIds;
                                        orderArr.push(id);

                                        await Order.update({
                                            loadTempIds: orderArr,
                                            isPlanned: 1
                                        }, { where: { id: order.id } });

                                        const newLoad = await LoadTemp.findOne({
                                            where: {
                                                id
                                            },
                                            include: includeFalse
                                        });
                                        newLoad.dataValues.ordersDatas = [];
                                        // let query = Helper.createSelectQuery("orders", newids, NorderAttrb);
                                        let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"], orders;
                                        let query = await Helper.createSelectQueryWithJoin5(tables, newids, OrderAttr);
                                        orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
                                        if (orders) {
                                            let oids = [];
                                            if (newLoad.orders && newLoad.orders.length > 0) {
                                                oids = newLoad.orders.split(",");
                                                orders.forEach(o => {
                                                    oids.forEach(oid => {
                                                        if (o.id == oid) {
                                                            newLoad.dataValues.ordersDatas.push(o);
                                                        }
                                                    });
                                                });
                                            }
                                            let updatedLoad = await Calculations.stops({ loads: newLoad, orders, loadType: 0, timezone }, true);
                                            console.log(updatedLoad.newLoad, "newLoad");

                                            warnings = await Warnings.addOrderFromLoadWarning({ load: newLoad, order });
                                            res.status(200).send({
                                                status: 1,
                                                msg: warnings.msg,
                                                warning: warnings.warning,
                                                "Old Distance": odistance,
                                                "Old Duration": oduration,
                                                "New Distance": distDur.distance,
                                                "New Duration": distDur.duration,
                                                newLoad: updatedLoad.newLoad
                                            });
                                        } else {
                                            res.status(409).send({
                                                msg: "Can not access orders table",
                                                status: 0
                                            });
                                        }
                                    } else {
                                        res.status(500).send(`Fail on Osrm News ${newpoints} `);
                                    }
                                }).catch(err => { res.status(500).send("Fail on Query New  "); });

                        } //  if 
                        else {
                            let oldpoints = await Helper.getLatLon(load, old);
                            osrm.GetDistDur(oldpoints)
                                .then(dt => {
                                    odistance = dt.distDur.distance;
                                    oduration = dt.distDur.duration;
                                }).then(() => {
                                    seq.query(Helper.createSelectQuery("orders", newids), { type: seq.QueryTypes.SELECT })
                                        .then(async news => {
                                            let newpoints = await Helper.getLatLon(load, news);
                                            let infoPoints = await osrm.GetDistDur(newpoints);
                                            let { distDur } = infoPoints;
                                            // let totalDuration = distDur.duration;
                                            let { totalDuration, recharge } = await Helper.calcTotalDuration2({
                                                load,
                                                news,
                                                distDur
                                            });
                                            // console.log("distDur2", distDur);
                                            let start = {}, end = {}, endAddress;
                                            if (load.flowType == 1) { // LP2D
                                                // start.Lat = order[0].pickupLat*1;
                                                // start.Lon = order[0].pickupLon*1;
                                                start.Lat = depo.lat;
                                                start.Lon = depo.lon;
                                                end.Lat = depo.lat;
                                                end.Lon = depo.lon;
                                                endAddress = depo.address;
                                            } else if (load.flowType == 2) { // D2E

                                                start.Lat = depo.lat;
                                                start.Lon = depo.lon;
                                                if (load.return == 1) { // ret = 1 not return

                                                    end.Lat = news[news.length - 1].deliveryLat;
                                                    end.Lon = news[news.length - 1].deliveryLon;
                                                    endAddress = news[news.length - 1].delivery;


                                                } else {

                                                    end.Lat = depo.lat;
                                                    end.Lon = depo.lon;
                                                    endAddress = depo.address;

                                                }

                                            }
                                            const emptymile = load.flowType == 2 || load.flowType == 1 ? await Calculations.emptymileage({
                                                load,
                                                order: news,
                                                orderIds: newids,
                                                start,
                                                end,
                                                ret: load.return
                                            }) : 0;
                                            if (infoPoints) {
                                                let updateObj = {
                                                    start: JSON.stringify(start),
                                                    end: JSON.stringify(end),
                                                    endAddress,
                                                    orders: newids,
                                                    totalDistance: distDur.distance,
                                                    totalDuration: totalDuration,
                                                    weight: load.weight + order.rows[0].weight,
                                                    cube: load.cube + order.rows[0].cube,
                                                    feet: load.feet + order.rows[0].feet,
                                                    feelRates: load.feelRates + order.rows[0].rate,
                                                    emptymile: emptymile,
                                                    busy: 1
                                                };
                                                await Helper.changed({
                                                    table: LoadTemp,
                                                    user: req.user,
                                                    type: "addOrderFromLoad",
                                                    loadId: id,
                                                    object: updateObj
                                                });
                                                let isPlanOrders = await Order.findOne({
                                                    where: { id: orderId }
                                                });
                                                let orderArr;
                                                orderArr = isPlanOrders.loadTempIds;
                                                orderArr.push(id);

                                                await Order.update({
                                                    loadTempIds: orderArr,
                                                    isPlanned: 1
                                                }, { where: { id: orderId } });

                                                let newLoad = await LoadTemp.findOne({
                                                    where: {
                                                        id
                                                    },
                                                    include: includeFalse
                                                });
                                                newLoad.dataValues.ordersDatas = [];
                                                // let query = Helper.createSelectQuery("orders", newids, NorderAttrb);
                                                let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"], orders;
                                                let query = await Helper.createSelectQueryWithJoin5(tables, newids, OrderAttr);
                                                orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
                                                if (orders) {
                                                    let oids = [];
                                                    if (newLoad.orders && newLoad.orders.length > 0) {
                                                        oids = newLoad.orders.split(",");
                                                        orders.forEach(o => {
                                                            oids.forEach(oid => {
                                                                if (o.id == oid) {
                                                                    newLoad.dataValues.ordersDatas.push(o);
                                                                }
                                                            });
                                                        });
                                                    }

                                                    let updatedLoad = await Calculations.stops({ loads: newLoad, orders, loadType: 0, timezone }, true);

                                                    newLoad = await LoadTemp.findOne({
                                                        where: {
                                                            id
                                                        },
                                                        include: includeFalse
                                                    });
                                                    newLoad.dataValues.ordersDatas = updatedLoad.newLoad.ordersDatas;
                                                    warnings = await Warnings.addOrderFromLoadWarning({ load: newLoad, order });
                                                    res.status(200).send({
                                                        status: 1,
                                                        msg: warnings.msg,
                                                        warning: warnings.warning,
                                                        "Old Distance": odistance,
                                                        "Old Duration": oduration,
                                                        "New Distance": distDur.distance,
                                                        "New Duration": distDur.duration,
                                                        newLoad
                                                    });
                                                } else {
                                                    res.status(500).send({
                                                        msg: "Can not access orders table",
                                                        status: 0
                                                    });
                                                }
                                            } else {
                                                res.status(500).send("Fail on Osrm News  ");
                                            }

                                        }).catch(err => { res.status(500).send("Fail on Query New  "); });

                                }).catch(err => { res.status(500).send("Fail on Osrm old "); });


                        }  // else 
                    }).catch(err => { res.status(500).send("Fail on Old id Query"); });

            }

        }).catch(err => { res.status(500).send("fail On Load finde one "); });

};

exports.moveOrderLoadToLoad = async (req, res) => {
    try {
        let { timezone } = req.headers;
        const { currentLoadId, orderId, previousLoadId } = req.body;
        // currentLoadId - to
        // previousLoadId - from
        let changedOrder;
        const order = await Order.findAndCountAll({
            where: {
                id: orderId
            }
        });

        const currLoad = await LoadTemp.findOne({ // to
            where: { id: currentLoadId },
            include: [{ all: true, nested: false }]
        });
        const prevLoad = await LoadTemp.findOne({ // from
            where: { id: previousLoadId },
            include: [{ all: true, nested: false }]
        });
        let prevOrderIds = prevLoad.orders.split(","); // froms orders
        let remOrder, depo, addOrder, arr = [], loadArr = [];
        if (currLoad) {
            depo = currLoad.depoId ? await Depo.findOne({
                where: {
                    id: currLoad.depoId
                }
            }) : null;
            // addOrderFromLoadErrors
            const errors = await Errors.addOrderFromLoadError({ load: currLoad, order });
            if (errors.error) {
                res.status(409).json({
                    msg: errors.msg,
                    status: 0
                });
            } else {
                // to
                addOrder = await DragDrop.addOrderFromLoad({
                    load: currLoad,
                    orders: order,
                    depo,
                    user: req.user
                });
                if (addOrder && addOrder.status) {
                    prevOrderIds = prevOrderIds.filter(id => {
                        return parseInt(id, 10) != orderId;
                    });
                    //from
                    remOrder = await DragDrop.removeOrderFromLoadTemp({
                        load: prevLoad,
                        ordersIdsArr: prevOrderIds,
                        orders: order,
                        user: req.user
                    });

                    if (remOrder && remOrder.status) {
                        let newLoadTemps;


                        if (!remOrder.delete) {
                            arr.push(currentLoadId, previousLoadId);
                            newLoadTemps = await DragDrop.calculationForLoadTemp({
                                arr, timezone
                            });
                        } else {
                            arr.push(currentLoadId);
                            newLoadTemps = await DragDrop.calculationForLoadTemp({
                                arr, timezone
                            });
                        }

                        /// remove from remOrder

                        const remOrderStopLocation = !remOrder.delete ? remOrder.newLoad.dataValues.stopLocations.findIndex(x => x.type.data.id === orderId) : -1; // 5638-i stop hanelu hamar u pushel addOrder
                        console.log(remOrderStopLocation);
                        if (remOrderStopLocation > -1) {
                            addOrder.newLoad.dataValues.stopLocations.push(remOrder.newLoad.dataValues.stopLocations[remOrderStopLocation]);
                            remOrder.newLoad.dataValues.stopLocations.splice(remOrderStopLocation, 1);
                        }
                        ///

                        loadArr = loadArr.concat(newLoadTemps.newLoadTemps.rows.filter(row => {
                            return row.id == currentLoadId;
                        }));
                        const warnings = await Warnings.addOrderFromLoadWarning({
                            load: loadArr[0],
                            order
                        });
                        res.json({
                            status: 1,
                            msg: warnings.msg,
                            warning: warnings.warning,
                            currLoad: addOrder, // target load
                            prevLoad: remOrder
                        });
                    } else {
                        res.status(409).json({
                            msg: remOrder.msg,
                            status: remOrder.status
                        });
                    }
                } else {
                    res.status(409).json({
                        msg: addOrder.msg,
                        status: addOrder.status
                    });
                }
            }

        }
    } catch (error) {
        console.log("moveOrderLoadToLoad: ", error.message);
        res.status(409).json({
            msg: error.message,
            status: 0
        });
    }
};

exports.confirm = async (req, res) => {
    const id = req.params.id;

    LoadTemp.findOne({
        where: {
            id: id
        }, include: [{ all: true, nested: false }],
    })
        .then(async load => {
            let checkByFlowType;
            checkByFlowType = await Helper.checkOrdersByLoadFlowType({
                orderIds: load.orders,
                flowType: load.dataValues.flowType
            });
            if (checkByFlowType.status) {
                let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
                let query = await Helper.createSelectQueryWithJoin5(tables, load.orders, OrderAttr);
                seq.query(query, { type: seq.QueryTypes.SELECT })
                    .then(orders => {
                        load.dataValues.ordersDatas = orders;
                        Load.create({
                            carrierId: load.dataValues.carrierId,
                            equipmentId: load.dataValues.equipmentId,
                            assetsId: load.dataValues.assetsId,
                            driverId: load.dataValues.driverId,
                            depoId: load.dataValues.depoId,
                            shiftId: load.dataValues.shiftId,

                            nickname: load.dataValues.nickname,
                            flowType: load.dataValues.flowType,

                            totalDistance: load.dataValues.totalDistance,
                            totalDuration: load.dataValues.totalDuration,

                            // flowType: load.dataValues.flowType,

                            orders: load.dataValues.orders,
                            stops: load.dataValues.stops,
                            planType: load.dataValues.planType,

                            start: load.dataValues.start,
                            startAddress: load.dataValues.startAddress,
                            end: load.dataValues.end,
                            endAddress: load.dataValues.endAddress,
                            startTime: load.dataValues.startTime,

                            weight: load.dataValues.weight,  // Total Weight 
                            feet: load.dataValues.feet,      // Total Feet 
                            cube: load.dataValues.cube,

                            fuelSurcharge: load.dataValues.fuelSurcharge,
                            loadCost: load.dataValues.loadCost,
                            loadCostPerMile: load.dataValues.loadCostPerMile,

                            status: 1, // fix data
                            freezed: load.dataValues.freezed,
                            return: load.dataValues.return,
                            carTypes: load.dataValues.carTypes,

                            comment: load.dataValues.comment,
                            totalcases: load.dataValues.totalcases,
                            stopLocations: load.dataValues.stopLocations,
                            warning: load.dataValues.warning,
                            emptymile: load.dataValues.emptymile,
                            warningData: load.dataValues.warningData,
                            loadTempId: id,

                            dispatchDate: load.dataValues.dispatchDate ? load.dataValues.dispatchDate : null, // 
                            deliveryDate: load.dataValues.deliveryDate ? load.dataValues.deliveryDate : null, //
                        }).then(async load => {
                            let loads;
                            await Helper.confirmOrder({
                                newLoad: load
                            });
                            await LoadTemp.update({
                                disabled: 1,
                                confirmed: 1
                            }, {
                                where: {
                                    id: id
                                }
                            });
                            loads = await Load.findOne({
                                where: {
                                    id: load.id
                                },
                                include: [{ all: true, nested: false }],
                            });
                            if (loads) {
                                res.status(200).send({
                                    status: 1,
                                    msg: "ok",
                                    data: loads
                                });
                            } else {
                                res.status(409).send({
                                    msg: "Can not access loads table",
                                    status: 0
                                });
                            }
                        });
                    }).catch(err => {
                        res.status(409).send({
                            msg: "Can not access orders table",
                            status: 0
                        });
                    });
            } else {
                await LoadTemp.update({
                    confirmed: 2
                }, {
                    where: {
                        id: id
                    }
                });
                res.status(409).send({
                    status: checkByFlowType.status,
                    msg: checkByFlowType.msg,
                    id
                });
            }

        }).catch(err => {
            res.status(500).send({
                "description": "Can not access loads table",
                "error": err.msg
            });
        });
};

exports.confirmMany = async (req, res) => {
    const lIds = req.body.loadIds;
    let loadTemps;
    let { timezone } = req.headers;
    loadTemps = await LoadTemp.findAndCountAll({
        attributes: ["id"],
        where: {
            id: {
                [Op.in]: lIds
            }
        }
    });
    if (loadTemps) {
        let error = [], success = [], rest, loadIds = [], loads;
        for (const loadTemp of loadTemps.rows) {
            rest = await createLoadFromLoadtemps(loadTemp.id, timezone);
            if (rest.status) {
                loadIds.push(rest.loadId);
                success.push(rest);
            } else {
                error.push(rest);
            }
        }
        // loads = await Load.findAndCountAll({ where: { id: {[Op.in]: loadIds}}});
        // let addDriver = await Helper.addDriver(loads.rows);
        res.json({
            msg: "ok",
            status: 1,
            success,
            error
        });
    } else {
        res.status(409).json({
            status: 0,
            msg: "Error!"
        });
    }
};

// Autoplan 
exports.creatTempLoads = async (req, res) => {
    try {
        console.log(req.body);

        let uuid = req.body[0].UUID,
            status = [],
            eta = [],
            percentage = [],
            loadOrderIds = [],
            drivingminutes = [],
            totalRunTime = [],
            totalDistance = [],
            totalDuration = [],
            Infeasible = [],
            loads = [],
            InfeasibleCount = 0,
            loadsCount = 0,
            flag = false,
            jobUpdate;
        let totalDist = 0, user;
        for (const load of req.body) {
            if (load.Status == 3) {
                flag = true;
                let { data } = await Algopost.createLoadTemp(load);
                user = load.Returnees.user;
                status.push(data.status);
                eta.push(data.eta);
                percentage.push(data.percentage);
                loadOrderIds.push(data.loadOrderIds);
                drivingminutes.push(data.drivingminutes);
                totalRunTime.length == 0 ? totalRunTime.push(data.totalRunTime) : null;
                totalDistance.length == 0 ? totalDistance.push(data.totalDistance) : null;
                totalDuration.length == 0 ? totalDuration.push(data.totalDuration) : null;
                Infeasible = Infeasible.concat(data.Infeasible);
                loads = loads.concat(data.loads);
                InfeasibleCount += data.Infeasible.length;
                loadsCount += data.loads.length;
            } else {
                status.push(load.Status);
                eta.push(load.ETA);
                percentage.push(load.percentage);
                InfeasibleCount += load.InfeasibleCount;
                Infeasible = Infeasible.concat(load.Infeasibles);
            }
        }
        if (flag) {
            jobUpdate = await Job.update({
                status,
                eta,
                percentage,
                loadOrderIds,
                drivingminutes,
                totalRunTime,
                totalDistance,
                totalDuration,
                Infeasible,
                InfeasibleCount,
                loads,
                loadsCount
            }, {
                where: {
                    UUID: uuid
                }
            });
        } else {
            jobUpdate = await Job.update({
                totalRunTime: [0],
                status,
                eta,
                percentage,
                Infeasible,
                InfeasibleCount
            }, {
                where: {
                    UUID: uuid
                }
            });
        }

        res.json({
            status: true,
            msg: "ok",
            data: jobUpdate
        });


    } catch (error) {
        console.log("Error creatTempLoads: ", error.message);
        res.status(500).json({
            msg: "Error!!!",
            error
        });
    }
};

exports.getLoadsBy = async (req, res) => {
    const data = req.body;
    const orders = await seq.query(Helper.createSelectQuery("orders", data.ids), { type: seq.QueryTypes.SELECT });
    const LatLon = await Helper.getLatLon(newLoadTemp, orders);
    const { distDur } = await osrm.GetDistDur(LatLon);
    const Loads = LoadTemp.findAll({
        where: {
            flowType: data.flowType,
            id: {
                [Op.in]: data.ids
            },
            return: data.return
        }
    });
    res.json({
        Loads
    });
};

exports.creatTempLoadsfromOrder = (order) => {
    try {
        console.log("order", order);
    } catch (error) {
        return {
            status: 0,
            msg: error.message
        };
    }


};

exports.getUpdatedLoadTemps = async (req, res) => {
    let sortAndPagination = await Helper.sortAndPagination(req);
    let where = req.query, loadIds, loads, orders, selectedLoads;
    where.disabled = 0;
    const data = await Helper.filters(where, Op);
    if (where.selectedLoads) {
        loadIds = await Helper.splitToIntArray(where.selectedLoads, ",");
        delete where.selectedLoads;
        selectedLoads = await LoadTemp.findAndCountAll({
            where: {
                id: {
                    [Op.in]: loadIds
                }
            },
            include: [{ all: true, nested: false }],
            distinct: true,
        });
        if (selectedLoads && selectedLoads.count) {
            let currentLoads = selectedLoads.rows;
            let lids = [];
            let oids = "";
            for (let i = 0; i < currentLoads.length; i++) {
                if (currentLoads[i].orders && currentLoads[i].orders.length > 0) {
                    oids += currentLoads[i].orders;
                }
                lids.push(currentLoads[i].id);
                currentLoads[i].dataValues.ordersDatas = [];
            }
            let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];

            let query = await Helper.createSelectQueryWithJoin5(tables, oids, OrderAttr);
            orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
            let quantity;

            currentLoads.forEach(l => {
                if (l.orders && l.orders.length > 0) {
                    oids = l.orders.split(",");
                    orders.forEach(o => {
                        quantity = 0;

                        oids.forEach(oid => {
                            if (o.id == oid) {
                                l.dataValues.ordersDatas.push(o);
                                l.dataValues.ordersDatas.map(item => quantity += item.pieceCount ? item.pieceCount : 0);
                                l.dataValues.pieceTotalQuantity = quantity;
                            }
                        });

                    });
                }
            });
        }
    }
    if (data.bool) {
        loads = await LoadTemp.findAndCountAll({
            where: data.where,
            include: [{ all: true, nested: false }],
            ...sortAndPagination,
            distinct: true,
        });
        if (loads.rows.length) {
            let currentLoads = loads.rows;
            let lids = [];
            let oids = [];

            for (let i = 0; i < currentLoads.length; i++) {

                // if(currentLoads[i].planType == "Auto"){ currentLoads[i].totalDuration = currentLoads[i].totalDuration*60;    } // tem solution

                if (currentLoads[i].orders && currentLoads[i].orders.length > 0) {
                    oids.push(currentLoads[i].orders);
                }
                lids.push(currentLoads[i].id);
                currentLoads[i].dataValues.ordersDatas = [];
            }

            oids = oids.join(",").split(",")
                .map(function (item) {
                    return parseInt(item, 10);
                });
            // let tables = ["orders", "Customers"];
            let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
            let query = await Helper.createSelectQueryWithJoin5(tables, oids.join(","), OrderAttr);
            //  console.log(query);
            orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
            let quantity;
            currentLoads.forEach(l => {
                if (l.orders && l.orders.length > 0) {
                    oids = l.orders.split(",");
                    orders.forEach(o => {
                        quantity = 0;
                        oids.forEach(oid => {
                            if (o.id == oid) {
                                l.dataValues.ordersDatas.push(o);
                                l.dataValues.ordersDatas.map(item => quantity += item.pieceCount ? item.pieceCount : 0);
                                l.dataValues.pieceTotalQuantity = quantity;
                            }
                        });
                    });
                }
            });

            res.status(200).send({
                status: 1,
                msg: "ok",
                data: {
                    loads: currentLoads,
                    selectedLoads: selectedLoads,
                    total: loads.count
                }
            });
        } else {
            res.status(200).send({
                status: 1,
                msg: "ok",
                data: {
                    loads: [],
                    total: 0
                }
            });
        }
    } else {
        res.status(200).send({
            status: 1,
            msg: "fillter incorrect",
            data: {
                loads: [],
                total: 0
            }
        });
    }
};

exports.remOrderfromLoadInMap = async (req, res) => {
    try {
        let { loadsOrdersIds, selectedLoads } = req.body;
        let { timezone } = req.headers;
        let ordersIdsArr, orders, ROrders, remOrders, load, result = [], sLoads;
        let removeOrders = [], loadDeleted = [];

        for (const ids of loadsOrdersIds) {
            load = await LoadTemp.findOne({
                where: {
                    id: ids.loadId
                }
            });
            ordersIdsArr = await Helper.splitToIntArray(ids.orderIdsStr, ",");
            ordersIdsArr = ordersIdsArr.filter(id => {
                return ids.remOrderIds.includes(id) == false;
            });
            console.log("ordersIdsArr", ordersIdsArr);

            let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
            let query1 = ordersIdsArr.length ? await Helper.createSelectQueryWithJoin5(tables, ordersIdsArr.join(","), OrderAttr) : null;
            let query2 = ids.remOrderIds.length ? await Helper.createSelectQueryWithJoin5(tables, ids.remOrderIds.join(","), OrderAttr) : null;
            //  console.log(query);
            orders = ordersIdsArr.length ? await seq.query(query1, { type: seq.QueryTypes.SELECT }) : null;
            ROrders = ids.remOrderIds.length ? await seq.query(query2, { type: seq.QueryTypes.SELECT }) : null;
            removeOrders = removeOrders.concat(ROrders);
            remOrders = await DragDrop.removeOrderFromLoadTemp({
                load: load,
                ordersIdsArr: ordersIdsArr,
                orders: ROrders,
                user: req.user
            }, true);
            loadDeleted = loadDeleted.concat(remOrders.deletedLoads);
            if (remOrders && remOrders.status) {
                await Order.update({
                    isPlanned: 0,
                    load_id: 0,
                    status: 0
                }, {
                    where: {
                        id: {
                            [Op.in]: ids.remOrderIds
                        }
                    }
                });
                if (!remOrders.delete) {
                    await Calculations.stops({ loads: remOrders.newLoad, orders, loadType: 0, timezone }, true);
                }

                result.push({
                    status: 1,
                    msg: remOrders.msg,
                    delete: remOrders.delete,
                    // warning: warnings.warning,
                    // currLoad: addOrder,
                    prevLoad: remOrders
                });
            } else {
                result.push({
                    msg: remOrders.msg,
                    status: remOrders.status
                });
            }
        }
        if (selectedLoads.length) {
            sLoads = await LoadTemp.findAndCountAll({
                where: {
                    id: {
                        [Op.in]: selectedLoads
                    }
                },
                include: [{ all: true, nested: false }],
                distinct: true,
            });
            if (sLoads && sLoads.count) {
                let currentLoads = sLoads.rows;
                let lids = [];
                let oids = "";
                for (let i = 0; i < currentLoads.length; i++) {
                    if (currentLoads[i].orders && currentLoads[i].orders.length > 0) {
                        oids += currentLoads[i].orders;
                    }
                    lids.push(currentLoads[i].id);
                    currentLoads[i].dataValues.ordersDatas = [];
                    await Helper.joinOrders(currentLoads[i], currentLoads[i].orders, OrderAttr);
                }
            }
        }
        res.json({
            result,
            status: 1,
            selctedLoads: {
                data: sLoads.rows,
                total: sLoads.count
            },
            removeOrders,
            loadDeleted
        });
    } catch (error) {
        res.status(409).json({
            msg: "Error",
            status: 0
        });
    }
};

exports.addOrderInLoadOnMap = async (req, res) => {
    try {
        let { timezone } = req.headers;
        const { currentLoadId, orderId, previousLoadId, selectedLoadIds } = req.body;
        let prevLoad, arr = [], sLoads, prevOrderIds, loadArr = [], warnings;
        const order = await Order.findAndCountAll({
            where: {
                id: orderId
            }
        });

        const currLoad = await LoadTemp.findOne({
            where: { id: currentLoadId },
            include: [{ all: true, nested: false }]
        });
        if (previousLoadId) {
            prevLoad = await LoadTemp.findOne({
                where: { id: previousLoadId },
                include: [{ all: true, nested: false }]
            });
            prevOrderIds = prevLoad.orders.split(",");
        }
        let remOrder, depo, addOrder;
        if (currLoad) {
            depo = currLoad.depoId ? await Depo.findOne({
                where: {
                    id: currLoad.depoId
                }
            }) : null;
            // addOrderFromLoadErrors
            const errors = await Errors.addOrderFromLoadError({ load: currLoad, order });
            if (errors.error) {
                res.status(409).json({
                    msg: errors.msg,
                    status: 0
                });
            } else {
                addOrder = await DragDrop.addOrderFromLoad({
                    load: currLoad,
                    orders: order,
                    depo,
                    user: req.user
                });
                let flag = false;
                if (addOrder && addOrder.status) {
                    if (prevLoad) {
                        prevOrderIds = prevOrderIds.filter(id => {
                            return parseInt(id, 10) != orderId;
                        });
                        remOrder = await DragDrop.removeOrderFromLoadTemp({
                            load: prevLoad,
                            ordersIdsArr: prevOrderIds,
                            orders: order,
                            user: req.user
                        });

                        if (remOrder && remOrder.status) {
                            let newLoadTemps;
                            if (!remOrder.delete) {
                                arr.push(currentLoadId, previousLoadId);
                                newLoadTemps = await DragDrop.calculationForLoadTemp({
                                    arr, timezone
                                });
                            } else {
                                arr.push(currentLoadId);
                                newLoadTemps = await DragDrop.calculationForLoadTemp({
                                    arr, timezone
                                });
                            }
                            loadArr = loadArr.concat(newLoadTemps.newLoadTemps.rows.filter(row => {
                                return row.id == currentLoadId;
                            }));
                            warnings = await Warnings.addOrderFromLoadWarning({
                                load: loadArr[0],
                                order
                            });
                            if (selectedLoadIds.length) {
                                sLoads = await LoadTemp.findAndCountAll({
                                    where: {
                                        id: {
                                            [Op.in]: selectedLoadIds
                                        }
                                    },
                                    include: [{ all: true, nested: false }],
                                    distinct: true,
                                });
                                if (sLoads && sLoads.count) {
                                    let currentLoads = sLoads.rows;
                                    let lids = [];
                                    let oids = "";
                                    for (let i = 0; i < currentLoads.length; i++) {
                                        if (currentLoads[i].orders && currentLoads[i].orders.length > 0) {
                                            oids += currentLoads[i].orders;
                                        }
                                        lids.push(currentLoads[i].id);
                                        currentLoads[i].dataValues.ordersDatas = [];
                                        await Helper.joinOrders(currentLoads[i], currentLoads[i].orders, OrderAttr);
                                    }
                                }
                            }
                            res.json({
                                status: 1,
                                msg: warnings.msg,
                                warning: warnings.warning,
                                currLoad: addOrder,
                                prevLoad: remOrder,
                                selctedLoads: {
                                    data: sLoads.rows,
                                    total: sLoads.count
                                }
                            });
                        } else {
                            res.status(409).json({
                                msg: remOrder.msg,
                                status: remOrder.status
                            });
                        }
                    } else {
                        let newLoadTemps;
                        arr.push(currentLoadId);
                        newLoadTemps = await DragDrop.calculationForLoadTemp({
                            arr, timezone
                        });
                        loadArr = loadArr.concat(newLoadTemps.newLoadTemps.rows.filter(row => {
                            return row.id == currentLoadId;
                        }));
                        warnings = await Warnings.addOrderFromLoadWarning({
                            load: loadArr[0],
                            order
                        });
                        if (selectedLoadIds && selectedLoadIds.length) {
                            sLoads = await LoadTemp.findAndCountAll({
                                where: {
                                    id: {
                                        [Op.in]: selectedLoadIds
                                    }
                                },
                                include: [{ all: true, nested: false }],
                                distinct: true,
                            });
                            if (sLoads && sLoads.count) {
                                let currentLoads = sLoads.rows;
                                let lids = [];
                                let oids = "";
                                for (let i = 0; i < currentLoads.length; i++) {
                                    if (currentLoads[i].orders && currentLoads[i].orders.length > 0) {
                                        oids += currentLoads[i].orders;
                                    }
                                    lids.push(currentLoads[i].id);
                                    currentLoads[i].dataValues.ordersDatas = [];
                                    await Helper.joinOrders(currentLoads[i], currentLoads[i].orders, OrderAttr);
                                }
                            }
                        }
                        res.json({
                            status: 1,
                            msg: warnings.msg,
                            warning: warnings.warning,
                            currLoad: addOrder,
                            prevLoad: remOrder,
                            selctedLoads: {
                                data: sLoads.rows,
                                total: sLoads.count
                            }
                        });
                    }
                } else {
                    res.status(409).json({
                        msg: addOrder.msg,
                        status: addOrder.status
                    });
                }
            }

        }
    } catch (error) {
        res.status(409).json({
            msg: error.message,
            status: 0
        });
    }
};

exports.sequences = async (req, res) => {
    try {
        let { loadId } = req.body;
        let { timezone } = req.headers, status = 1, message = "ok";
        let sequense, load;
        load = await LoadTemp.findOne({
            where: {
                id: loadId
            },
            include: includeFalse
        });
        let driver;
        const { driverId, UUID, orders } = load.dataValues;
        const orderIds = await Helper.splitToIntArray(orders, ",");
        if (orderIds.length === 1) {
            return res.json({
                msg: "Planning can't sequence because have 1 Order",
                status: 0
            });
        }
        if (driverId) {
            driver = await Driver.findOne({ where: { id: driverId }, include: [{ all: true, nested: false }] });
        }
        let shift;
        if (driver && driver.dataValues.shiftId) { shift = await Shift.findOne({ where: { id: driver.dataValues.shiftId } }); }
        // Sequence
        const job = await Job.findOne({ where: { UUID } });
        sequense = await Helper.getSingleLoadSequence(req, load, job);
        if (sequense && sequense.data.Data == "Started.") {
            message = "Sequence started";
        } else {
            status = 0;
            message = sequense.data.Message;
        }
        return res.json({
            msg: message,
            status
        });
    } catch (error) {
        console.log("Sequence: ", error);
        res.status(409).json({
            msg: "Error",
            status: 0,
            data: error,
        });
    }
};

exports.planningSequence = async (req, res) => {
    console.log("Sequence POST Request");
    let seqStatus, ordersStr, algo, infCount;
    let seqData = req.body[0];
    let { Loads, Returnees, Status, UUID, Infeasibles, Algorithm, FlowType, Exception, Message } = seqData;
    let { loadId, user, timezone, orders, startTime, ret, depotId, shiftId, confirmed } = JSON.parse(Returnees);
    const depot = depotId;
    const shiftData = shiftId;
    if (!Status) {
        return res.status(409).json(await Helper.errorMsg(Message));
    }
    let OrderIDs, FirstNodeStartTime;
    if (Status == 3) {
        OrderIDs = Loads[0].OrderIDs;
        FirstNodeStartTime = Loads[0].FirstNodeStartTime;
    }
    seqStatus = Status;
    infCount = Infeasibles.length;
    algo = Algorithm;
    let seqWarning = {
        msg: "false"
    };
    if (seqStatus == 3 && infCount == 0) {
        ordersStr = OrderIDs.join(",");
        startTime = FirstNodeStartTime;
    } else if (seqStatus == 2) {
        ordersStr = orders.join(",");
        seqWarning.msg = Exception.Message;
    } else {
        seqStatus = 2;
        ordersStr = orders.join(",");
        seqWarning.msg = "Sequence algorithm cannot be used as there is an infeasible order in the load.";
    }
    let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
    let query = await Helper.createSelectQueryWithJoin5(tables, ordersStr, OrderAttr);
    const newOrders = await seq.query(query, { type: seq.QueryTypes.SELECT });
    const LatLon = await Helper.getLatLon({
        depoId: depot.id,
        flowType: FlowType,
        return: ret
    }, newOrders);
    const { distDur } = await osrm.GetDistDur(LatLon);
    let { totalDuration, recharge } = await Helper.calcTotalDuration2({
        load: {
            startTime: startTime,
            flowType: FlowType
        },
        news: newOrders,
        distDur,
        shift: shiftData
    });
    const planning = await LoadTemp.findOne({
        where: {
            id: loadId
        },
        include: includeFalse
    });
    await Calculations.stops({ loads: planning, orders: newOrders, loadType: 0, timezone }, true);

    await LoadTemp.update({
        orders: ordersStr,
        startTime: startTime,
        totalDistance: distDur.distance,
        totalDuration: totalDuration,
    }, {
        where: {
            id: loadId
        }
    });
    const socket = require("../../server");
    let updLoad = await LoadTemp.findOne({
        where: {
            id: loadId
        },
        include: includeFalse
    });
    updLoad.dataValues.ordersDatas = [];
    await Helper.joinOrders(updLoad, updLoad.dataValues.orders, OrderAttr);
    const notData = {
        title: "Sequence",
        content: "Planning SuccessFully sequenced",
        type: 1,
        userId: user ? user.id : null
    };
    const pushNotification = await NotificationService.create(notData, user.id);
    await socket.sendNotificationToUser(constants.socketHandler.sequenceNotification, user.id, {...pushNotification.data.dataValues, planning: updLoad.dataValues});
    console.log("sequenceNotification send!");
    res.json({
        msg: "ok",
        status: 1,
        data: updLoad,
        seqStatus,
        seqWarning
    });
};

exports.addMultiOrdersInLoadOnMap = async (req, res) => {
    try {
        let { timezone } = req.headers;
        let { orderIds, selectedLoadIds, loadId, clean } = req.body,
            arrIds = [], arr = [], addOrder, loadArr = [], warnings, sLoads;
        let loadTemp = await LoadTemp.findOne({ where: { id: loadId }, include: [{ all: true, nested: false }] });
        let loadOrderIds = await Helper.splitToIntArray(loadTemp.dataValues.orders, ",");
        let success = [], failed = [], msg = "ok", failorders = "";
        for (const orderId of orderIds) {
            if (!loadOrderIds.includes(orderId)) {
                arrIds.push(orderId);
            }
        }
        // one order +- 15 seconds
        await orderController.unplanOrder({
            orderIds: arrIds,
            user: req.user,
            timezone
        });
   
        let depo = loadTemp.depoId ? await Depo.findOne({
            where: {
                id: loadTemp.depoId
            }
        }) : null;
        for (const id of arrIds) {
            // if (clean) {
            //     await cleanLoad({
            //         orderId: id,
            //     });
            // }
            let order = await Order.findAndCountAll({
                where: {
                    id
                }
            });
            let errors = await Errors.addOrderFromLoadError({ load: loadTemp, order });
            if (errors.error) {
                failorders += `${id},`;
                failed.push({
                    orderId: id,
                    msg: errors.msg
                });
            } else {
                addOrder = await DragDrop.addOrderFromLoad({
                    load: loadTemp,
                    orders: order,
                    depo,
                    user: req.user
                });
                if (addOrder && addOrder.status) {
                    let newLoadTemps;
                    arr.push(loadId);
                    newLoadTemps = await DragDrop.calculationForLoadTemp({
                        arr, timezone
                    });
                    loadArr = loadArr.concat(newLoadTemps.newLoadTemps.rows.filter(row => {
                        return row.id == loadId;
                    }));
                    warnings = await Warnings.addOrderFromLoadWarning({
                        load: loadArr[0],
                        order
                    });
                    loadTemp = await LoadTemp.findOne({ where: { id: loadId }, include: [{ all: true, nested: false }] });
                    success.push({
                        orderId: id,
                        msg: warnings.msg,
                        warning: warnings.warning,
                        addOrder
                    });
                }
            }
        }
        if (selectedLoadIds && selectedLoadIds.length) {
            sLoads = await LoadTemp.findAndCountAll({
                where: {
                    id: {
                        [Op.in]: selectedLoadIds
                    }
                },
                include: [{ all: true, nested: false }],
                distinct: true,
            });
            if (sLoads && sLoads.count) {
                let currentLoads = sLoads.rows;
                let lids = [];
                let oids = "";
                for (let i = 0; i < currentLoads.length; i++) {
                    if (currentLoads[i].orders && currentLoads[i].orders.length > 0) {
                        oids += currentLoads[i].orders;
                    }
                    lids.push(currentLoads[i].id);
                    currentLoads[i].dataValues.ordersDatas = [];
                    await Helper.joinOrders(currentLoads[i], currentLoads[i].orders, OrderAttr);
                }
            }
        }
        res.json({
            status: 1,
            success: success[success.length - 1],
            warning: failed.length ? true : false,
            msg: !failed.length ? msg : `The mentioned orders cannot be added to the load. (${failorders})`,
            selctedLoads: {
                data: sLoads ? sLoads.rows : null,
                total: sLoads ? sLoads.count : null
            }
        });
    } catch (error) {
        res.status(409).json({
            msg: error.message,
            status: 0
        });
    }
};

async function setLoadLocationAndAddressByFlowtype(flowType, ret, depo, order) {
    let start = {}, end = {}, endAddress = "", startAddress = "";
    if (flowType == 1) { // LP2D
        start.Lat = depo.lat;
        start.Lon = depo.lon;
        startAddress += depo.address;
        end.Lat = depo.lat;
        end.Lon = depo.lon;
        endAddress += depo.address;
    } else if (flowType == 2) { // D2E

        start.Lat = depo.lat;
        start.Lon = depo.lon;
        startAddress += depo.address;
        if (ret == 1) { // ret = 1 not return

            end.Lat = order[order.length - 1].deliveryLat;
            end.Lon = order[order.length - 1].deliveryLon;
            endAddress += order[order.length - 1].delivery;

        } else {

            end.Lat = depo.lat;
            end.Lon = depo.lon;
            endAddress += depo.address;

        }

    }
    return {
        start,
        end,
        endAddress,
        startAddress
    };

}

/****************************** */
/// test

async function createLoadFromLoadtemps(id, timezone) {
    let load;
    load = await LoadTemp.findOne({
        where: {
            id: id
        }, include: [{ all: true, nested: false }],
    });
    if (load) {
        let checkByFlowType, message;
        checkByFlowType = await Helper.checkOrdersByLoadFlowType({
            orderIds: load.orders,
            flowType: load.dataValues.flowType
        });
        if (checkByFlowType.status) {
            let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"], orders, newLoad;
            let query = await Helper.createSelectQueryWithJoin5(tables, load.orders, OrderAttr);
            orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
            if (orders) {
                load.dataValues.ordersDatas = orders;
                newLoad = await Load.create({
                    uuid: load.dataValues.UUID,
                    carrierId: load.dataValues.carrierId,
                    equipmentId: load.dataValues.equipmentId,
                    assetsId: load.dataValues.assetsId,
                    driverId: load.dataValues.driverId,
                    depoId: load.dataValues.depoId,
                    shiftId: load.dataValues.shiftId,

                    nickname: load.dataValues.nickname,
                    flowType: load.dataValues.flowType,

                    totalDistance: load.dataValues.totalDistance,
                    totalDuration: load.dataValues.totalDuration,

                    // flowType: load.dataValues.flowType,

                    orders: load.dataValues.orders,
                    stops: load.dataValues.stops,
                    return: load.dataValues.return,
                    planType: load.dataValues.planType,

                    start: load.dataValues.start,
                    startAddress: load.dataValues.startAddress,
                    end: load.dataValues.end,
                    endAddress: load.dataValues.endAddress,
                    startTime: load.dataValues.startTime,

                    weight: load.dataValues.weight,  // Total Weight 
                    feet: load.dataValues.feet,      // Total Feet 
                    cube: load.dataValues.cube,

                    fuelSurcharge: load.dataValues.fuelSurcharge,
                    loadCost: load.dataValues.loadCost,
                    loadCostPerMile: load.dataValues.loadCostPerMile,
                    carTypes: load.dataValues.carTypes,
                    stopLocations: load.dataValues.stopLocations,
                    warning: load.dataValues.warning,
                    emptymile: load.dataValues.emptymile,
                    loadTempId: id,

                    status: 1, // fix data
                    freezed: load.dataValues.freezed,

                    comment: load.dataValues.comment,
                    totalcases: load.dataValues.totalcases,

                    dispatchDate: load.dataValues.dispatchDate ? load.dataValues.dispatchDate : null, // 
                    deliveryDate: load.dataValues.deliveryDate ? load.dataValues.deliveryDate : null, //
                    finishRequest: 0
                });
                if (newLoad) {
                    const loads = await Load.findOne({
                        where: {
                            id: newLoad.id
                        },
                        include: [{ all: true, nested: false }],
                    });
                    let conf;
                    conf = await Helper.confirmOrder({
                        newLoad
                    });

                    if (conf.status) {
                        await Calculations.stops({ loads: loads, orders, loadType: 1, timezone }, true);
                        await LoadTemp.update({
                            disabled: 1,
                            confirmed: 1
                        }, {
                            where: {
                                id: id
                            }
                        });
                        message = `${loads.dataValues.id} ID load is assigned to you.`;
                        if (process.env.SERVER != "local" && loads.dataValues.driverId && loads.dataValues.driver) {
                            await Mailer.sendMail(loads.dataValues.driver.email, "Confirmation", message);
                        }
                        return { status: 1, loadId: newLoad.id };
                    } else {
                        await LoadTemp.update({
                            confirmed: 2
                        }, {
                            where: {
                                id: id
                            }
                        });
                        return { status: 0, id };
                    }

                } else {
                    await LoadTemp.update({
                        confirmed: 2
                    }, {
                        where: {
                            id: id
                        }
                    });
                    return { status: 0, id };
                }
            }
        } else {
            await LoadTemp.update({
                confirmed: 2
            }, {
                where: {
                    id: id
                }
            });
            return {
                status: checkByFlowType.status,
                msg: checkByFlowType.msg,
                id
            };
        }

    } else {
        return { status: 0, id };
    }
}

exports.dropOrderFromLoadTemps = async (data) => {
    try {
        let { loadTempIds, orderId, order, user, timezone } = data, loadTemp, result = [];
        for (const loadTempId of loadTempIds) {
            loadTemp = await LoadTemp.findOne({
                where: { id: loadTempId },
                include: [{ all: true, nested: false }]
            });
            let prevOrderIds = await Helper.splitToIntArray(loadTemp.orders, ",");
            let orderIndex = prevOrderIds.indexOf(orderId);
            if (orderIndex > -1) {
                prevOrderIds.splice(orderIndex, 1);
            }
            let remOrder = await DragDrop.removeOrderFromLoadTemp({
                load: loadTemp,
                ordersIdsArr: prevOrderIds,
                orders: order,
                user: user
            });
            let loadArr = [];
            if (remOrder && remOrder.status) {
                let newLoadTemps;
                if (!remOrder.delete) {
                    newLoadTemps = await DragDrop.calculationForLoadTemp({
                        arr: [loadTempId],
                        timezone
                    });
                    loadArr = loadArr.concat(newLoadTemps.newLoadTemps.rows.filter(row => {
                        return row.id == loadTempId;
                    }));
                } else {
                    loadArr = loadArr.concat([]);
                }

                const warnings = await Warnings.addOrderFromLoadWarning({
                    load: loadArr[0],
                    order
                });
                result.push({
                    status: 1,
                    msg: warnings.msg,
                    warning: warnings.warning,
                    prevLoad: remOrder,
                    loadTempId
                });
            }
        }
        return result;
    } catch (error) {
        return {
            status: 0,
            error
        };
    }
};

exports.getExportsLoadTemps = async (req, res) => {
    let ids, where = {}, exportArr, loadTemps, orderIds, msg = "OK";
    if (req.body.ids && req.body.ids.length > 0) {
        ids = req.body.ids;
        where = {
            id: {
                [Op.in]: ids
            }
        };
    }
    loadTemps = await LoadTemp.findAndCountAll({
        where: {
            ...where,
            disabled: 0
        },
        include: includeTrue,
        distinct: true,
    });
    let info = await Helper.getRemoteInfoForKey(req);
    exportArr = await Helper.exportArr({
        loads: loadTemps,
        orderIds,
        info
    });
    res.json({
        status: 1,
        data: exportArr.arr,
        errorData: exportArr.errorArr,
        msg: `Successed: ${exportArr.loadsArr.length}. Failed: ${exportArr.errorArr.length}.`
    });
};

// async function cleanLoad(data) {
//     try {

//     } catch (error) {

//     }
// }