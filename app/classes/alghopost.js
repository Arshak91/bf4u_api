const Helper = require("../classes/helpers");
const db = require("../config/db.config.js");
const { NorderAttrb, OrderAttr } = require("../classes/joinColumns.js");
const Calculations = require("../classes/calculations");
const planningHistory = require("../mongoClasses/planningHistory");
const osrm = require("../controller/osmap.controller");
const seq = db.sequelize;
const Op = db.Sequelize.Op;
const Job = db.job;
const LoadTemp = db.loadTemp;
const Order = db.order;
const Depo = db.depo;
const Equipment = db.equipment;
const Shift = db.shift;


const includeFalse = [{ all: true, nested: false }];
const includeTrue = [{ all: true, nested: true }];
// const OrderAttr = [
//     ...NorderAttrb,
//     "transporttypes.color",
//     "statuses.color as statusColor",
//     "statuses.id as statusId",
//     "statuses.name as statusName",
//     "statuses.statustype as statusType",
//     "transporttypes.name as LoadType"
// ];

module.exports = class Alghopost {
    static async createLoadTemp(data) {
        try {
            // console.log("data", data);
            const object = data;
            const execId = object.UUID;
            const Loads = object.Loads;
            const flowType = object.FlowType;
            const algo = object.Algorithm;
            const returnees = JSON.parse(object.Returnees);
            let { timezone, manualStartTime } = returnees;

            let drivingMinutes = [];
            let con = [];
            const job = await Job.findOne({
                where: {
                    UUID: execId
                }
            });
            const { depoId, loadStartTime, oVRP, shiftId } = job.params;
            let i = 0, loadIds = [], loadTemps, addedDrivers = [], assignDriver;
            for (const load of Loads) {
                let driverId;
                // if (jobs.dataValues.params.assignDrivers == 1) {
                //     assignDriver = await this.assignDriver({
                //         item: load,
                //         addedDrivers
                //     });
                // }
                // driverId = assignDriver.addedDrivers[0] ? assignDriver.addedDrivers[0] : null;
                if (load.Equipment && load.Equipment.Driver && load.Equipment.Driver.Id) {
                    driverId = load.Equipment.Driver.Id;
                } else if (job.dataValues.params.fixedDriverCalc) {
                    let newOrders = await Order.findAndCountAll({
                        where: { id: { [Op.in]: load.OrderIDs } },
                        include: includeTrue,
                        attributes: ["consigneeid"],
                    });
                    for (const order of newOrders.rows) {
                        if (order.dataValues.consigneeid && order.dataValues.consignee && order.dataValues.consignee.driverId) {
                            driverId = order.dataValues.consignee.driverId;
                            break;
                        }
                    }
                }

                con = con.concat(load.OrderIDs);
                drivingMinutes.push(load.DrivingMinutes);
                let cube = 0, weight = 0, feet = 0,
                feelRates = 0, permileRates = 0;
                let idsStr = load.OrderIDs.join(",");
                let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
                let query = await Helper.createSelectQueryWithJoin5(tables, idsStr, OrderAttr);
                const order = await seq.query(query, { type: seq.QueryTypes.SELECT });

                const addreses = await Helper.getAddress(flowType, oVRP, load.OrderIDs, depoId);

                for (const item of order) {

                    cube += item.cube*1;
                    weight += item.weight*1;
                    feet += item.feet*1;
                    feelRates += item.rate*1;
                    permileRates += item.permileRate*1;
                }
                let orders = load.OrderIDs.toString();
                // let start = JSON.stringify(load.StartLocation);
                let end = JSON.stringify(load.EndLocation);
                let depo, equipment;
                if (depoId) {
                    depo = await Helper.getOne({key: "id", value: depoId, table: Depo});
                }
                let start = JSON.stringify({
                    Lat: depo.lat,
                    Lon: depo.lon
                });
                if (load.Equipment.typeId && load.Equipment.typeId !== "0") {
                    equipment = await Equipment.findOne({
                        where: {
                            id: load.Equipment.typeId
                        }
                    });
                }
                let carTypes = equipment ? [{...equipment.dataValues}] : [{
                    ...load.Equipment
                }];
                
                let newLoad = await LoadTemp.create({
                    UUID: object.UUID,
                    equipmentId: load.Equipment.typeId ? load.Equipment.typeId : 0,
                    driverId: driverId ? driverId : null,
                    shiftId,
                    depoId,
                    orders: orders,
                    stops: load.OrderIDs.length,
                    start,
                    end,
                    carTypes,
                    startTime: algo == 3 ? load.Equipment.Driver.startTime : manualStartTime == 1 ? loadStartTime : load.FirstNodeStartTime,
                    totalDistance: Number(load.TotalDistance).toFixed(2),
                    totalDuration: load.TotalMinutes*60,
                    flowType: flowType,
                    cube,
                    feet,
                    return: oVRP,
                    weight,
                    feelRates,
                    permileRates,
                    planType: "Auto",
                    disabled: 0,
                }).catch(err => {
                    console.log(err);
                });
                let getNewLoad;
                getNewLoad = await LoadTemp.findOne({ where: { id: newLoad.id }, include: includeFalse }).catch(err => {
                    console.log("load", err);
                });
                if (getNewLoad) {
                    await Calculations.stops({
                        loads: getNewLoad,
                        orders: order,
                        loadType: 0,
                        timezone
                    }, true).catch(err => {
                        console.log("calc stops catch");
                    });
                    query = await Helper.createSelectQueryWithJoin5(tables, orders, OrderAttr);
                    const ordersData = await seq.query(query, { type: seq.QueryTypes.SELECT });
                    const LatLon = await Helper.getLatLon(getNewLoad, ordersData);
                    const { distDur } = await osrm.GetDistDur(LatLon);
                    let shift = await Shift.findOne({ where: { id: shiftId } });
                    let { totalDuration } = await Helper.calcTotalDuration2({
                        load: getNewLoad,
                        news: ordersData,
                        distDur,
                        shift
                    });
                    console.log("algo Dist: ", load.TotalDistance, " calc Dist: ", distDur.distance);
                    console.log("algo Dur: ", load.TotalMinutes*60, " calc Dur: ", totalDuration);
                    let start = {}, end = {}, endAddress;
                    if (getNewLoad.dataValues.flowType == 1) { // LP2D
                        start.Lat = depo.lat;
                        start.Lon = depo.lon;
                        end.Lat = depo.lat;
                        end.Lon = depo.lon;
                        endAddress = depo.address;
                    } else if (getNewLoad.dataValues.flowType == 2) { // D2E
                                
                        start.Lat = depo.lat;
                        start.Lon = depo.lon;
                        if(getNewLoad.dataValues.return == 1){ // ret = 1 not return
                                            
                            end.Lat = order[order.length -1].deliveryLat;
                            end.Lon = order[order.length -1].deliveryLon;
                            endAddress = order[order.length -1].delivery;
                    

                        } else {
                                            
                            end.Lat = depo.lat;
                            end.Lon = depo.lon;
                            endAddress = depo.address;
                    
                        }
                    }
                    let emptymile = getNewLoad.dataValues.flowType == 2 || getNewLoad.dataValues.flowType == 1 ? await Calculations.emptymileage({
                        load: getNewLoad.dataValues,
                        order: order,
                        orderIds: idsStr,
                        start,
                        end,
                        ret: getNewLoad.dataValues.return
                    }) : 0;
                    await LoadTemp.update({
                        // totalDistance: distDur.distance,
                        // totalDuration: totalDuration,
                        startAddress: addreses.startAddress,
                        endAddress: addreses.endAddress,
                        emptymile: emptymile,
                    }, {
                        where: {
                            id: newLoad.id
                        }
                    });
                }
                loadIds.push(newLoad.id);
                // let historyClass = new planningHistory({data: {
                //     ID: newLoad.id,
                //     info: newLoad,
                //     // userInfo: 
                // }});
                // await historyClass.create();
            }
            let jobs;
            jobs = await Job.findOne({ where: { UUID: object.UUID } });
            loadTemps = await LoadTemp.findAndCountAll({ where: { id: {[Op.in]: loadIds}}});
            if (jobs.dataValues.params.assignDrivers == 1) {
                
                await Helper.addDriver(loadTemps.rows);
            }
            
            console.log("finish TempLoad");
            jobs.dataValues.defaultStructure = loadTemps.rows.map(x => ({ loadId: x.dataValues.id, orders: x.dataValues.orders.split(",") }));
            await Job.update(jobs.dataValues, { where: { id: jobs.dataValues.id } });
            return {
                status: 1,
                data: {
                    status: object.Status,
                    eta: object.ETA,
                    percentage: object.Percentage,
                    loadOrderIds: con,
                    drivingminutes: drivingMinutes,
                    totalRunTime: object.RuntimeSeconds,
                    totalDistance: object.GrandTotalDistance,
                    totalDuration: object.GrandTotalDuration,
                    Infeasible: object.Infeasibles,
                    loads: loadTemps.rows
                }
            };
        } catch (error) {
            console.log("Error createLoadTemp: ", error.message);
            return {
                status: 0,
                data: error
            };
        }
    }
};
