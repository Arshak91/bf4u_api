const db = require('../config/db.config.js');
const osrm = require('../controller/osmap.controller');
const Helper = require('../classes/helpers.js');
const Calculations = require('../classes/calculations.js');
const Checks = require('../classes/checks');
const { NorderAttrb,OrderAttr } = require('../classes/joinColumns.js');
const Op = db.Sequelize.Op;
const seq = db.sequelize;
const LoadTemp = db.loadTemp;
const Load = db.load;
const Order = db.order;
const Depo = db.depo;
const includeFalse = [{ all: true, nested: false }];

// const OrderAttr = [
//     ...NorderAttrb,
//     // 'transporttypes.color',
//     'statuses.color as statusColor',
//     'statuses.id as statusId',
//     'statuses.name as statusName',
//     'statuses.statustype as statusType',
//     'transporttypes.name as LoadType'
// ];
module.exports = class DragDrop {
    static async addOrderFromLoad(data) {
        let returnObject = -1, orderId = '';
        const { load, orders, depo, user } = data;
        let weight = 0,
            cube = 0,
            feet = 0,
            rate = 0;
        for (const order of orders.rows) {
            orderId += `${order.dataValues.id},`;
            cube += (order.dataValues.cube ? order.dataValues.cube*1 : 0);
            weight += (order.dataValues.weight ? order.dataValues.weight*1 : 0);
            feet += (order.dataValues.feet ? order.dataValues.feet*1 : 0);
            rate += (order.dataValues.rate ? order.dataValues.rate*1 : 0);
        }
        
        let loadId = load.id;
        let odistance;
        let oduration;
        let oldids = 0;
        let newids;

        if (!load.orders) {
            newids = orderId;
        } else {

            oldids = load.orders;
            newids = load.orders + ',' + orderId;
        }
        newids = newids.slice(0, -1);
        orderId = orderId.slice(0, -1);
        let query = await Helper.createSelectQuery('orders', oldids);
        await seq.query(query, { type: seq.QueryTypes.SELECT })
            .then(async old => {

                if (oldids == 0) {

                    odistance = oduration = 0;

                    await seq.query(await Helper.createSelectQuery('orders', newids), { type: seq.QueryTypes.SELECT })
                        .then(async news => {
                            let newpoints = await Helper.getLatLon(load, news);
                            
                            //  here -----
                            let { distDur } = await osrm.GetDistDur(newpoints);
                            // let totalDuration = distDur.duration;
                            // let totalDuration = 0;
                            let { totalDuration, recharge } = await Helper.calcTotalDuration2({
                                load,
                                news,
                                distDur
                            });
                            // console.log('distDur', distDur);
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
                                if(load.return == 1){ // ret = 1 not return
                                    end.Lat = news[news.length -1].deliveryLat;
                                    end.Lon = news[news.length -1].deliveryLon;
                                    endAddress = news[news.length -1].delivery;
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
                                    end: JSON.stringify(end),
                                    endAddress: endAddress,
                                    orders: newids,
                                    totalDistance: distDur.distance,
                                    stops: news.length,
                                    totalDuration: totalDuration,
                                    weight: load.weight + weight,
                                    cube: load.cube + cube,
                                    feet: load.feet + feet,
                                    feelRates: load.feelRates + rate,
                                    emptymile: emptymile,
                                    busy: 1
                                };
                                await Helper.changed({
                                    table: LoadTemp,
                                    user,
                                    type: "addOrderFromLoad",
                                    loadId: loadId,
                                    object: updateObj
                                });
                                let oids = await Helper.splitToIntArray(orderId, ',');
                                let isPlanOrders = await Order.findAndCountAll({
                                    where: {id: { [Op.in]: oids } }
                                });
                                let orderArr;
                                for (const order of isPlanOrders.rows) {
                                    orderArr = order.loadTempIds;
                                    orderArr = orderArr.push(loadId);
                                    
                                    await Order.update({
                                        // loadTempIds: orderArr,
                                        isPlanned: 1
                                    }, { where: { id: order.id }});
                                }
                                const newLoad = await LoadTemp.findOne({
                                    where: {
                                        id: loadId
                                    },
                                    include: includeFalse
                                });
                                newLoad.dataValues.ordersDatas = [];
                                // let query = Helper.createSelectQuery('orders', newids, NorderAttrb);
                                let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"], orders;
                                let query = await Helper.createSelectQueryWithJoin5(tables, newids, OrderAttr);
                                orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
                                if (orders) {
                                    let oids = [];
                                    if (newLoad.orders && newLoad.orders.length > 0) {
                                        oids = newLoad.orders.split(',');
                                        orders.forEach(o => {
                                            oids.forEach(oid => {
                                                if (o.id == oid) {
                                                    newLoad.dataValues.ordersDatas.push(o);
                                                }
                                            });
                                        });
                                    }
                                    returnObject = {
                                        status: 1,
                                        msg: 'ok',
                                        "Old Distance": odistance,
                                        "Old Duration": oduration,
                                        "New Distance": distDur.distance,
                                        "New Duration": distDur.duration,
                                        newLoad
                                    };
                                } else {
                                    returnObject = {
                                        status: 0,
                                        msg: 'Can not access orders table',
                                    };
                                }
                            } else {
                                returnObject = {
                                    msg: `Fail on Osrm News ${newpoints} `,
                                    status: 0
                                };
                            }
                        }).catch(err => { returnObject = { msg: "Fail on Query New  ", status: 0, error: err}; });

                } else {
                    let oldpoints = await Helper.getLatLon(load, old);
                    await osrm.GetDistDur(oldpoints)
                        .then(async dt => {
                            
                            odistance = dt.distDur.distance;
                            oduration = dt.distDur.duration;
                        }).then(async () => {
                            query = await Helper.createSelectQuery('orders', newids);
                            await seq.query(query, { type: seq.QueryTypes.SELECT })
                                .then(async news => {
                                    let newpoints = await Helper.getLatLon(load, news);
                                    let { distDur } = await osrm.GetDistDur(newpoints);
                                    // let totalDuration = distDur.duration;
                                    let { totalDuration, recharge } = await Helper.calcTotalDuration2({
                                        load,
                                        news,
                                        distDur
                                    });
                                    // console.log('distDur2', distDur);
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
                                        if(load.return == 1){ // ret = 1 not return
                                                            
                                            end.Lat = news[news.length -1].deliveryLat;
                                            end.Lon = news[news.length -1].deliveryLon;
                                            endAddress = news[news.length -1].delivery;
                                    

                                        } else {
                                                            
                                            end.Lat = depo.lat;
                                            end.Lon = depo.lon;
                                            endAddress = depo.address;
                                        }
                                        
                                    }
                                    let emptymile = 0;
                                    if(load.flowType == 2 || load.flowType == 1){
                                        emptymile = await Calculations.emptymileage({
                                            load,
                                            order: news,
                                            orderIds: newids,
                                            start,
                                            end,
                                            ret: load.return
                                        });
                                    }
                                    if (distDur) {
                                        let updateObj = {
                                            end: JSON.stringify(end),
                                            endAddress: endAddress,
                                            orders: newids,
                                            stops: news.length,
                                            totalDistance: distDur.distance,
                                            totalDuration: totalDuration,
                                            weight: load.weight + weight,
                                            cube: load.cube + cube,
                                            feet: load.feet + feet,
                                            feelRates: load.feelRates + rate,
                                            emptymile: emptymile ? emptymile : 0,
                                            busy: 1
                                        };
                                        await Helper.changed({
                                            table: LoadTemp,
                                            user,
                                            type: "addOrderFromLoad",
                                            loadId: loadId,
                                            object: updateObj
                                        });
                                        let oids = await Helper.splitToIntArray(orderId, ',');
                                        let isPlanOrders = await Order.findAndCountAll({
                                            where: {id: { [Op.in]: oids } }
                                        });
                                        let orderArr = [];
                                        for (const order of isPlanOrders.rows) {
                                            orderArr = orderArr.concat(order.loadTempIds);
                                            await orderArr.push(loadId);
                                            console.log(orderArr, order.loadTempIds);
                                            await Order.update({
                                                // loadTempIds: orderArr,
                                                isPlanned: 1
                                            }, { where: { id: order.id }});
                                        }
                                        
                                        const newLoad = await LoadTemp.findOne({
                                            where: {
                                                id: loadId
                                            },
                                            include: includeFalse
                                        });
                                        newLoad.dataValues.ordersDatas = [];
                                        // let query = Helper.createSelectQuery('orders', newids, NorderAttrb);
                                        let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"], orders;
                                        let query = await Helper.createSelectQueryWithJoin5(tables, newids, OrderAttr);
                                        orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
                                        if (orders) {
                                            if (newLoad.orders && newLoad.orders.split(',').length > 0) {
                                                let oids = newLoad.orders.split(',');
                                                orders.forEach(o => {
                                                    oids.forEach(oid => {
                                                        if (o.id == oid) {
                                                            newLoad.dataValues.ordersDatas.push(o);
                                                        }
                                                    });
                                                });
                                            }
                                            returnObject = {
                                                status: 1,
                                                msg: 'ok',
                                                "Old Distance": odistance,
                                                "Old Duration": oduration,
                                                "New Distance": distDur.distance,
                                                "New Duration": distDur.duration,
                                                newLoad
                                            };
                                        } else {
                                            returnObject = {
                                                status: 0,
                                                msg: 'Can not access orders table',
                                            };
                                        }
                                    } else {
                                        returnObject = {msg: "Fail on Osrm News  ", status: 0};
                                    }
                                }).catch(err => { returnObject = {msg: "Fail on Query New  ", status: 0, error: err}; });

                        }).catch(err => { returnObject = {msg: "Fail on Osrm old ", status: 0, error: err}; });
                }
            }) .catch(err => { returnObject = {msg: "Fail on Old id Query", status: 0, error: err}; });
        return returnObject;
    }

    static async removeOrderFromLoadTemp(data, map = null) {
        const { ordersIdsArr, load, user } = data;
        let orders, deletedLoads = [];
        if (map) {
            orders = data.orders;
        } else {
            orders = data.orders.rows;
        }
        let weight = 0, cube = 0, feet = 0, rate = 0, OIds = [];
        if (orders && orders.length) {
            for (const order of orders) {
                OIds.push(order.id*1);
                cube += (order.cube ? order.cube*1 : 0);
                weight += (order.weight ? order.weight*1 : 0);
                feet += (order.feet ? order.feet*1 : 0);
                rate += (order.rate ? order.rate*1 : 0);
            }
        }
        let returnObject = -1;
        if (!ordersIdsArr.length) {
            await LoadTemp.destroy({
                where: {
                    id: load.id
                }
            });
            let unPlanOrders = await Order.findAndCountAll({
                where: { id: { [Op.in]: OIds } }
            });
            let orderArr, info;

            for (const order of unPlanOrders.rows) {
                orderArr = order.loadIds;
                // orderArr = orderArr.filter(item => {
                //     return item != load.id;
                // });
                let orderIndex = orderArr.indexOf(load.id);
                if (orderIndex > -1) {
                    orderArr.splice(orderIndex, 1);
                }
                info = order.timeInfo;
                delete info.loadTemps[load.id];
                await Order.update({
                    loadIds: orderArr,
                    confirmed: 0,
                    timeInfo: info
                }, { where: { id: order.id }}).catch(err => {
                    console.log("removeOrderFromLoadTemp1: ", err.message);
                });
            }
            
            deletedLoads.push(load.id);
            returnObject = {
                status: 1,
                msg: `This load ${load.id} will be deleted as there are no orders in it.`,
                newLoad: [],
                delete: true
            };
        } else {
            const ordersIdsUpdated = ordersIdsArr.join(',');
            await LoadTemp.findOne({
                where: {
                    id: load.id
                },
                include: includeFalse
            }).then(async load => {
                const depo = load.depoId ? await Depo.findOne({
                    where: {
                        id: load.depoId
                    }
                }) : null;

                let odistance;
                let oduration;
                let query = Helper.createSelectQuery('orders', load.orders);
                await seq.query(query, { type: seq.QueryTypes.SELECT })
                    .then(async old => {

                        let oldpoints = await Helper.getLatLon(load, old);

                        await osrm.GetDistDur(oldpoints)
                            .then(async dt => {
                                odistance = dt.distDur.distance;
                                oduration = dt.distDur.duration;
                            })
                            .then(async () => {
                                query = await Helper.createSelectQuery('orders', ordersIdsUpdated);
                                await seq.query(query, { type: seq.QueryTypes.SELECT })
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
                                            if(load.return == 1){ // ret = 1 not return
                                                                
                                                end.Lat = news[news.length -1].deliveryLat;
                                                end.Lon = news[news.length -1].deliveryLon;
                                                endAddress = news[news.length -1].delivery;
                                        

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
                                                end: JSON.stringify(end),
                                                endAddress: endAddress,
                                                orders: ordersIdsUpdated,
                                                stops: news.length,
                                                totalDistance: distDur.distance,
                                                totalDuration: totalDuration,
                                                weight: load.weight - weight,
                                                cube: load.cube - cube,
                                                feet: load.feet - feet,
                                                feelRates: load.feelRates - rate,
                                                emptymile: emptymile,
                                                busy: 1
                                            };
                                            await Helper.changed({
                                                table: LoadTemp,
                                                user,
                                                type: "removeOrderFromLoadTemp",
                                                loadId: load.id,
                                                object: updateObj
                                            });
                                            let unPlanOrders = await Order.findAndCountAll({
                                                where: { id: { [Op.in]: OIds } }
                                            });
                                            let orderArr, info;
                                            for (const order of unPlanOrders.rows) {
                                                orderArr = order.loadIds;
                                                // orderArr = orderArr.filter(order => {
                                                //     return order != load.id;
                                                // });
                                                let orderIndex = orderArr.indexOf(load.id);
                                                if (orderIndex > -1) {
                                                    orderArr.splice(orderIndex, 1);
                                                }
                                                info = order.timeInfo;
                                                delete info.loadTemps[load.id];
                                                await Order.update({
                                                    loadTempIds: orderArr,
                                                    status: 0,
                                                    confirmed: 0,
                                                    timeInfo: info
                                                }, { where: { id: order.id }}).catch(err => {
                                                    console.log("removeOrderFromLoadTemp 2: ", err.message);
                                                });
                                            }
                                            const newLoad = await LoadTemp.findOne({
                                                where: {
                                                    id: load.id
                                                },
                                                include: includeFalse
                                            });
                                            newLoad.dataValues.ordersDatas = [];
                                            let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"], orders;
                                            let query = await Helper.createSelectQueryWithJoin5(tables, ordersIdsUpdated, OrderAttr);
                                            orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
                                            if (orders) {
                                                let oids = [];
                                                if (newLoad.orders && newLoad.orders.split(',').length > 0) {
                                                    oids = newLoad.orders.split(',');
                                                    orders.forEach(o => {
                                                        oids.forEach(oid => {
                                                            if (o.id == oid) {
                                                                newLoad.dataValues.ordersDatas.push(o);
                                                            }
                                                        });
                                                    });
                                                }
                                                returnObject = {
                                                    status: 1,
                                                    msg: 'ok',
                                                    "Old Distance": odistance,
                                                    "Old Duration": oduration,
                                                    "New Distance": distDur.distance,
                                                    "New Duration": distDur.duration,
                                                    newLoad,
                                                    delete: false
                                                };
                                            } else {
                                                returnObject = {
                                                    status: 0,
                                                    msg: 'Can not access orders table',
                                                };
                                            }
                                        }
                                    }).catch(err => {
                                        console.log('removeOrderFromLoadTemp: ', err.message);
                                        returnObject = { msg :'Error On New order query', error: err, status: 0 };
                                    });

                            }).catch(err => {
                                console.log('removeOrderFromLoadTemp: ', err.message);
                                returnObject = {status: 0, msg: 'Error On map request', error: err };
                            });

                    }).catch(err => {
                        console.log('removeOrderFromLoadTemp: ', err.message);
                        returnObject = {status: 0, msg: 'Error On Old orders Query ', error: err };
                    });
            }).catch(err => {
                console.log('removeOrderFromLoadTemp: ', err.message);
                returnObject = {
                    status: 0,
                    msg: 'Can not access loads table',
                    'error': err.msg
                };
            });
        }
        
        return { ...returnObject, deletedLoads};
    }

    static async removeOrderFromLoad(data, map = null) {
        const { ordersIdsArr, load, user } = data;
        let orders, deletedLoads = [];
        if (map) {
            orders = data.orders;
        } else {
            orders = data.orders.rows;
        }
        let weight = 0, cube = 0, feet = 0, rate = 0, OIds = [];
        if (orders && orders.length) {
            for (const order of orders) {
                OIds.push(order.id*1);
                cube += (order.cube ? order.cube*1 : 0);
                weight += (order.weight ? order.weight*1 : 0);
                feet += (order.feet ? order.feet*1 : 0);
                rate += (order.rate ? order.rate*1 : 0);
            }
        }
        let returnObject = -1;
        if (!ordersIdsArr.length) {
            await Load.destroy({
                where: {
                    id: load.id
                }
            });
            let unPlanOrders = await Order.findAndCountAll({
                where: { id: { [Op.in]: OIds } }
            });
            let orderArr;

            for (const order of unPlanOrders.rows) {
                orderArr = order.loadIds;
                // orderArr = orderArr.filter(item => {
                //     return item != load.id;
                // });
                let orderIndex = orderArr.indexOf(load.id);
                if (orderIndex > -1) {
                    orderArr.splice(orderIndex, 1);
                }
                
                await Order.update({
                    loadIds: orderArr,
                    confirmed: 0,
                    timeInfo: {}
                }, { where: { id: order.id }});
            }
            
            deletedLoads.push(load.id);
            returnObject = {
                status: 1,
                msg: `This load ${load.id} will be deleted as there are no orders in it.`,
                newLoad: [],
                delete: true
            };
        } else {
            const ordersIdsUpdated = ordersIdsArr.join(',');
            await Load.findOne({
                where: {
                    id: load.id
                },
                include: includeFalse
            }).then(async load => {
                const depo = load.depoId ? await Depo.findOne({
                    where: {
                        id: load.depoId
                    }
                }) : null;

                let odistance;
                let oduration;
                let query = Helper.createSelectQuery('orders', load.orders);
                await seq.query(query, { type: seq.QueryTypes.SELECT })
                    .then(async old => {

                        let oldpoints = await Helper.getLatLon(load, old);

                        await osrm.GetDistDur(oldpoints)
                            .then(async dt => {
                                odistance = dt.distDur.distance;
                                oduration = dt.distDur.duration;
                            })
                            .then(async () => {
                                query = await Helper.createSelectQuery('orders', ordersIdsUpdated);
                                await seq.query(query, { type: seq.QueryTypes.SELECT })
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
                                            if(load.return == 1){ // ret = 1 not return
                                                                
                                                end.Lat = news[news.length -1].deliveryLat;
                                                end.Lon = news[news.length -1].deliveryLon;
                                                endAddress = news[news.length -1].delivery;
                                        

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
                                                end: JSON.stringify(end),
                                                endAddress: endAddress,
                                                orders: ordersIdsUpdated,
                                                stops: news.length,
                                                totalDistance: distDur.distance,
                                                totalDuration: totalDuration,
                                                weight: load.weight - weight,
                                                cube: load.cube - cube,
                                                feet: load.feet - feet,
                                                feelRates: load.feelRates - rate,
                                                emptymile: emptymile,
                                                busy: 1
                                            };
                                            await Helper.changed({
                                                table: Load,
                                                user,
                                                type: "removeOrderFromLoad",
                                                loadId: load.id,
                                                object: updateObj
                                            });
                                            let unPlanOrders = await Order.findAndCountAll({
                                                where: { id: { [Op.in]: OIds } }
                                            });
                                            let orderArr;
                                            for (const order of unPlanOrders.rows) {
                                                orderArr = order.loadIds;
                                                // orderArr = orderArr.filter(order => {
                                                //     return order != load.id;
                                                // });
                                                let orderIndex = orderArr.indexOf(load.id);
                                                if (orderIndex > -1) {
                                                    orderArr.splice(orderIndex, 1);
                                                }
                                                
                                                await Order.update({
                                                    loadIds: orderArr,
                                                    status: 0,
                                                    confirmed: 0
                                                }, { where: { id: order.id }});
                                            }
                                            const newLoad = await Load.findOne({
                                                where: {
                                                    id: load.id
                                                },
                                                include: includeFalse
                                            });
                                            newLoad.dataValues.ordersDatas = [];
                                            let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"], orders;
                                            let query = await Helper.createSelectQueryWithJoin5(tables, ordersIdsUpdated, OrderAttr);
                                            orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
                                            if (orders) {
                                                let oids = [];
                                                if (newLoad.orders && newLoad.orders.split(',').length > 0) {
                                                    oids = newLoad.orders.split(',');
                                                    orders.forEach(o => {
                                                        oids.forEach(oid => {
                                                            if (o.id == oid) {
                                                                newLoad.dataValues.ordersDatas.push(o);
                                                            }
                                                        });
                                                    });
                                                }
                                                returnObject = {
                                                    status: 1,
                                                    msg: 'ok',
                                                    "Old Distance": odistance,
                                                    "Old Duration": oduration,
                                                    "New Distance": distDur.distance,
                                                    "New Duration": distDur.duration,
                                                    newLoad,
                                                    delete: false
                                                };
                                            } else {
                                                returnObject = {
                                                    status: 0,
                                                    msg: 'Can not access orders table',
                                                };
                                            }
                                        }
                                    }).catch(err => { returnObject = { msg :'Error On New order query', error: err, status: 0 }; });

                            }).catch(err => { returnObject = {status: 0, msg: 'Error On map request', error: err }; });

                    }).catch(err => { returnObject = {status: 0, msg: 'Error On Old orders Query ', error: err }; });
            }).catch(err => {
                returnObject = {
                    status: 0,
                    msg: 'Can not access loads table',
                    'error': err.msg
                };
            });
        }
        
        return { ...returnObject, deletedLoads};
    }

    static async calculationForLoadTemp(data) {
        let loadTemps, newLoadTemps, {timezone} = data;
        loadTemps = await LoadTemp.findAndCountAll({
            where: {
                id: {
                    [Op.in]: data.arr
                }
            },
            include: includeFalse
        });
        for (const loadTemp of loadTemps.rows) {
            let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"], orders;
            let query = await Helper.createSelectQueryWithJoin5(tables, loadTemp.orders, OrderAttr);
            orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
            if (orders) {
                await Calculations.stops({ loads: loadTemp, orders, loadType: 0, timezone}, true);
            }
        }
        newLoadTemps = await LoadTemp.findAndCountAll({
            where: {
                id: {
                    [Op.in]: data.arr
                }
            },
            include: includeFalse
        });
        return {newLoadTemps};
    }

    static async calculationForLoad(data) {
        try {
            let loads, newLoads;
            let { timezone } = data;
            loads = await Load.findAndCountAll({
                where: {
                    id: {
                        [Op.in]: data.arr
                    }
                },
                include: includeFalse
            });
            for (const load of loads.rows) {
                let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"], orders;
                let query = await Helper.createSelectQueryWithJoin5(tables, load.orders, OrderAttr);
                orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
                if (orders) {
                    await Calculations.stops({ loads: load, orders, loadType: 1, timezone}, true);
                }
            }
            newLoads = await Load.findAndCountAll({
                where: {
                    id: {
                        [Op.in]: data.arr
                    }
                },
                include: includeFalse
            });
            return {newLoads};
        } catch (error) {
            return {
                status: 0,
                error
            };
        }
    }
};
