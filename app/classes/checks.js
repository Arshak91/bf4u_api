const moment = require('moment');
class Checks  {

    static async waitingTime(data) {

        let { orders, distDur, flowType, startTime } = data;
        let { legs } = distDur;
        let newOrders = [], waitingTime;
        let totalWaiting = 0;
        if (flowType == 1) {
            newOrders.push({
                order: orders[0],
                servicetime: orders[0].servicetime
            });
            for (const [o, order] of orders.entries()) {
                if (o > 0 && orders[o].pickupLat != orders[o - 1].pickupLat && orders[o].pickupLon != orders[o - 1].pickupLon) {
                    newOrders.push({
                        order: orders[o],
                        servicetime: orders[o].servicetime
                    });
                } else if (o > 0 && orders[o].pickupLat == orders[o - 1].pickupLat && orders[o].pickupLon == orders[o - 1].pickupLon) {
                    newOrders[o-1].servicetime += newOrders[o].servicetime;
                }
            }
        } else if (flowType == 2) {
            newOrders.push({
                order: orders[0],
                servicetime: orders[0].servicetime
            });
            for (const [o, order] of orders.entries()) {
                if (o > 0 && orders[o].deliveryLat != orders[o - 1].deliveryLat && orders[o].deliveryLon != orders[o - 1].deliveryLon) {
                    newOrders.push({
                        order: orders[o],
                        servicetime: orders[o].servicetime
                    });
                } else if (o > 0 && orders[o].deliveryLat == orders[o - 1].deliveryLat && orders[o].deliveryLon == orders[o - 1].deliveryLon) {
                    newOrders[newOrders.length-1].servicetime += orders[o].servicetime;
                }
            }
        }
        for (const [o, order] of newOrders.entries()) {
           
            let obj =  { distDur, o, order, startTime, flowType };
            waitingTime = await this.checkWindow(obj);
                       
            totalWaiting += waitingTime;
            // console.log(legs[o]);
            startTime += ((legs[o].duration + waitingTime + order.servicetime) * 1000);
            // startTime += (order.servicetime * 1000);
            console.log('waitingTime', order.id, waitingTime);
            
        }

        return totalWaiting;
    }
    static async timeInfo(datas, orderTimeWindow) {
        let timeInfo = {
            id: 0,
            waiting: 0,
            arTime: null,
            leaveTime: null,
            eta: null,
            ata: null
        }, obj = {}, arr = [];
        let { flowType, allleg, tEta, loadId, duration, shiftVal, recharge, brTime, rest, shiftName } = datas;
        
        let waiting = 0, arTime = null, leaveTime = null, servicetime, ata = null, wait = 0, rech = false, restBool = false;
        if (flowType == 2) {
            servicetime = allleg.servicetime ? allleg.servicetime : 0;
            if (tEta < new Date(orderTimeWindow.deliveryFrom).getTime() && shiftName != 'Team shift') {
                waiting = new Date(orderTimeWindow.deliveryFrom).getTime() - tEta;
                if (duration > (brTime*1000) && duration + waiting >= (shiftVal*1000)) {
                    wait = ((shiftVal * 1000) - duration);
                    rech = true;
                } else if (duration < (brTime*1000) && duration + waiting >= (shiftVal*1000)) {
                    wait = ((shiftVal * 1000) - (duration + (rest*1000)));
                    restBool = true;
                    rech = true;
                } else {
                    wait = waiting;
                }
                arTime = tEta + wait + (rech ? (recharge*1000) : 0) + (restBool ? (rest*1000) : 0);
                leaveTime = arTime + (allleg.servicetime*1000);
                ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
            } else if (tEta < new Date(orderTimeWindow.deliveryFrom).getTime() && shiftName == 'Team shift') {
                waiting = new Date(orderTimeWindow.deliveryFrom).getTime() - tEta;
                wait = waiting;
                arTime = tEta + waiting;
                leaveTime = arTime + (allleg.servicetime*1000);
                ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
            } else if (tEta >= new Date(orderTimeWindow.deliveryFrom).getTime()) {
                waiting = 0;
                arTime = tEta;
                leaveTime = tEta + (servicetime*1000);
                ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
            }
        } else if (flowType == 1) {
            servicetime = allleg.servicetime ? allleg.servicetime : 0;
            if (tEta < new Date(orderTimeWindow.pickupFrom).getTime() && shiftName != 'Team shift') {
                waiting = new Date(orderTimeWindow.pickupFrom).getTime() - tEta;
                if (duration + waiting >= (shiftVal*1000)) {
                    wait = ((shiftVal * 1000) - duration);
                    rech = true;
                } else {
                    wait = waiting;
                }
                arTime = tEta + wait + rech ? (recharge*1000) : 0;
                leaveTime = arTime + (allleg.servicetime*1000);
                ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
            } else if (tEta < new Date(orderTimeWindow.pickupFrom).getTime() && shiftName == 'Team shift') {
                waiting = new Date(orderTimeWindow.pickupFrom).getTime() - tEta;
                wait = waiting;
                arTime = tEta + waiting;
                leaveTime = arTime + (allleg.servicetime*1000);
                ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
            } else if (tEta >= new Date(orderTimeWindow.pickupFrom).getTime()) {
                waiting = 0;
                arTime = tEta;
                leaveTime = tEta + (servicetime*1000);
                ata = allleg.timeInfo && allleg.timeInfo.loads && allleg.timeInfo.loads[loadId] && allleg.timeInfo.loads[loadId].ata ? allleg.timeInfo.loads[loadId].ata : null;
            }
        }
        timeInfo.waiting = wait/1000;
        timeInfo.arTime = new Date(arTime);
        timeInfo.leaveTime = new Date(leaveTime);
        timeInfo.eta = new Date(tEta);
        timeInfo.id = loadId;
        timeInfo.ata = ata;
        obj[loadId] = timeInfo;
        arr.push({
            ...timeInfo
        });
        wait = 0;
        return { arr, obj, info: { tEta, arTime, leaveTime } };
    }
    static async checkByLoadType(data) {
        try {
            let  { loadType, timeInfo, info, obj, arr, order, loadId, flowType } = data;
            let loadIds, loadTempIds, flowTypes;
            loadTempIds = order.loadTempIds ? order.loadTempIds : [];
            loadIds = order.loadIds ? order.loadIds : [];
            flowTypes = order.flowTypes ? order.flowTypes : [];

            if (loadType == 0) {
                if (!loadTempIds.includes(loadId)) {
                    loadTempIds.push(loadId);
                }
                if (timeInfo) {
                    info.loadTemps = timeInfo.loadTemps ? {
                        ...timeInfo.loadTemps,
                        ...obj
                    } : { ...obj };
                } else {
                    info.loadTemps = {
                        ...obj
                    };
                }
            } else {
                if (!loadIds.includes(loadId)) {
                    loadIds.push(loadId);
                }
                if (!flowTypes.includes(flowType)) {
                    flowTypes.push(flowType);
                }
                if (timeInfo && Object.keys(timeInfo).length) {
                    info.loadTemps = timeInfo.loadTemps;
                    info.loads = timeInfo.loads ? {
                        ...timeInfo.loads,
                        ...obj
                    } : { ...obj };
                    info.loadsArr = timeInfo.loadsArr.length > 0 ? timeInfo.loadsArr : [];
                    if (info.loadsArr.length > 0) {
                        for (const [l, load] of info.loadsArr.entries()) {
                            if (load.id == arr[0].id) {
                                info.loadsArr[l] = arr[0];
                                // info.loadsArr = info.loadsArr.concat(arr);
                            }
                        }
                    } else {
                        info.loadsArr = info.loadsArr.concat(arr);
                    }
                    
                } else {
                    info.loadTemps = timeInfo.loadTemps;
                    info.loads = {
                        ...obj
                    };
                    info.loadsArr = info.loadsArr.concat(arr);
                }
            }
            return {status: 1, newInfo: info, loadTempIds, loadIds, flowTypes};
        } catch (error) {
            return {
                status: 0,
                msg: "bug in loadType"
            };
        }
    }
    static async checkSameLocOrders(data) {
        try {
            let { orders, flowType } = data;
            let newOrders = [];
            if (flowType == 1) {
                newOrders.push({
                    order: orders[0],
                    servicetime: orders[0].servicetime
                });
                for (const [o, order] of orders.entries()) {
                    if (o > 0 && order.pickupLat != orders[o - 1].pickupLat && order.pickupLon != orders[o - 1].pickupLon) {
                        newOrders.push({
                            order: order,
                            servicetime: order.servicetime
                        });
                    } else if (o > 0 && order.pickupLat == orders[o - 1].pickupLat && order.pickupLon == orders[o - 1].pickupLon) {
                        newOrders[newOrders.length-1].servicetime += order.servicetime;
                    }
                }
            } else if (flowType == 2) {
                newOrders.push({
                    order: orders[0],
                    servicetime: orders[0].servicetime
                });
                for (const [o, order] of orders.entries()) {
                    if (o > 0 && order.deliveryLat != orders[o - 1].deliveryLat && order.deliveryLon != orders[o - 1].deliveryLon) {
                        newOrders.push({
                            order: order,
                            servicetime: order.servicetime
                        });
                    } else if (o > 0 && order.deliveryLat == orders[o - 1].deliveryLat && order.deliveryLon == orders[o - 1].deliveryLon) {
                        newOrders[newOrders.length-1].servicetime += order.servicetime;
                    }
                }
            }
            return {
                status: 1,
                newOrders
            };
        } catch (error) {
            return {
                status: 0,
                msg: error.message
            };
        }
    }
    // STOP
    static async waitingTime2(data) {

        let { newOrders, flowType, startTime, tDur, shiftVal } = data;
        let waitingTime;
        let totalWaiting = 0;
        let obj =  { order: newOrders, startTime, flowType, tDur, shiftVal };
        waitingTime = await this.checkWindow(obj);
                    
        totalWaiting += waitingTime;

        return totalWaiting;
    }

    static async checkWindow(data) {
        try {
            const { order, startTime, flowType, tDur, shiftVal } = data;
            let dur = tDur * 1000;
            let from; 
            let to;
            let waiting, wait;
            if (flowType == 1) {
                from = new Date(order.order.pickupdateFrom).getTime();
                to = new Date(order.order.pickupdateTo).getTime();
            } else if (flowType == 2) {
                from = new Date(order.order.deliverydateFrom).getTime();
                to = new Date(order.order.deliverydateTo).getTime();
            }
            if ((startTime + dur) < from) {
                if (shiftVal < dur/1000) {
                    waiting = (dur - (shiftVal*1000));
                } else {
                    waiting = (from - (startTime + dur));
                }
                if ((dur + waiting) >= shiftVal*1000) {
                    wait = (shiftVal*1000 - dur);
                } else {
                    wait = waiting;
                }
            } else {
                wait = 0;
            }
            return wait;
        } catch (error) {
            return error;
        }
        
    }

    static async newTimeWindow(data) {
        try {
            let { pickupdateFrom, pickupdateTo, deliverydateFrom, deliverydateTo, companyName } = data,
            pickupTimeWindows = [], deliveryTimeWindows = [];

            let pickupFrom = moment.utc(pickupdateFrom), pickupTo = moment.utc(pickupdateTo);
            let deliveryFrom = moment.utc(deliverydateFrom), deliveryTo = moment.utc(deliverydateTo);
            let pickupCount = pickupTo.diff(pickupFrom, 'days'), pFrom = pickupFrom.format('HH:mm:ss.SSS'), pTo = pickupTo.format('HH:mm:ss.SSS'), pDate, pDateTo;
            let deliveryCount = deliveryTo.diff(deliveryFrom, 'days'), dFrom = deliveryFrom.format('HH:mm:ss.SSS'), dTo = deliveryTo.format('HH:mm:ss.SSS'), dDate, dDateTo;
            if (pickupCount > 0 && (companyName == 'uniqlo' || companyName == 'tuniqlo')) {
                for (let i = 0; i <= pickupCount; i++) {
                    pDate = pickupFrom.format('YYYY-MM-DD');
                    pickupTimeWindows.push({
                        "From": `${pDate}T${pFrom}Z`,
                        "To": `${pDate}T${pTo}Z`,
                    });
                    pickupFrom.add(1, 'days');
                }
            } else {
                pDate = pickupFrom.format('YYYY-MM-DD');
                pDateTo = pickupTo.format('YYYY-MM-DD');
                pickupTimeWindows.push({
                    "From": `${pDate}T${pFrom}Z`,
                    "To": `${pDateTo}T${pTo}Z`,
                });
            }
            
            if (deliveryCount > 0 && (companyName == 'uniqlo' || companyName == 'tuniqlo')) {
                for (let i = 0; i <= deliveryCount; i++) {
                    dDate = deliveryFrom.format('YYYY-MM-DD');
                    deliveryTimeWindows.push({
                        "From": `${dDate}T${dFrom}Z`,
                        "To": `${dDate}T${dTo}Z`,
                    });
                    deliveryFrom.add(1, 'days');
                }
            } else {
                dDate = deliveryFrom.format('YYYY-MM-DD');
                dDateTo = deliveryTo.format('YYYY-MM-DD');
                deliveryTimeWindows.push({
                    "From": `${dDate}T${dFrom}Z`,
                    "To": `${dDateTo}T${dTo}Z`,
                });
            }
            
            
            return {
                pickupTimeWindows,
                deliveryTimeWindows,
                status: 1
            };
        } catch (error) {
            console.log('Error: ', error.message);
            return {
                status: 0,
                msg: error.message
            };
        }
    }
}
module.exports = Checks;