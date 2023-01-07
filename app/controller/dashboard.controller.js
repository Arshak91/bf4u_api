const db = require('../config/db.config.js');
const Helper = require('../classes/helpers');
const { NorderAttrb, OrderAttr } = require('../classes/joinColumns.js');
const Op = db.Sequelize.Op;

const LoadTemp = db.loadTemp;
const Order = db.order;
const Load = db.load;
const Status = db.status;
// const OrderAttr = [
//     ...NorderAttrb,
//     // 'transporttypes.color',
//     'statuses.color as statusColor',
//     'statuses.id as statusId',
//     'statuses.name as statusName',
//     'statuses.statustype as statusType',
//     'transporttypes.name as LoadType'
// ];

exports.getAll = async (req, res) => {
    try {
        let loadWhere = {
            ...req.query
        };
        let loadWeekWhere = {
            ...req.query
        };
        let orderWhere = {
            ...req.query
        };
        orderWhere.dashboard = 1;
        const loadData = await Helper.filters(loadWhere, Op, 'load');
        const loadWeekData = await Helper.filters(loadWeekWhere, Op, 'load', true);
        const orderData = await Helper.filters(orderWhere, Op, 'order');
        let loads, orders, weekLoads;
        if (loadData.bool) {
            loads = await groupLoads(loadData.where);
        }
        if (loadWeekData.bool) {
            weekLoads = await groupWeekLoads(loadWeekData.where);
        }
        if (orderData.bool) {
            orders = await groupOrders(orderData.where);
        }
        res.json({
            orders: orders.allArr,
            ordersPie: orders.arr,
            loads,
            weekLoads
        });
    } catch (error) {
        console.log(error);
        res.status(409).json(await Helper.errorMsg('Error'));
    }
};

async function groupOrders(where) {
    try {
        let allArr = [], arr = [], orders;
        let statuses = await Status.findAndCountAll({
            where: {
                type: {
                    [Op.in]: ['Both','Order']
                },
                statustype: '*'
            }
        });
        for (const status of statuses.rows) {
            orders = await Order.findAndCountAll({
                attributes: [ 'id', 'status' ],
                where: {
                    ...where,
                    status: status.id
                },
            }).catch(err => {
                console.log('message', err.message);
            });
            if (status.id != 0) {
                allArr.push({
                    name: status.name,
                    color: status.color,
                    value: orders.count
                });
                if (status.id == 6 || status.id == 8) {
                    arr.push({
                        name: status.name,
                        color: status.color,
                        value: orders.count
                    });
                }
                
            }
        }
        return {allArr, arr};
    } catch (error) {
        console.log(error);
        return await Helper.errorMsg('order Group Error');
    }
}
async function groupLoads(where) {
    try {
        let allArr = [], loads;
        let statuses = await Status.findAndCountAll({
            where: {
                type: {
                    [Op.in]: ['Both','Load']
                },
                statustype: '*'
            }
        });
        for (const status of statuses.rows) {
            loads = await Load.findAndCountAll({
                attributes: [ 'id', 'status' ],
                where: {
                    ...where,
                    status: status.id
                },
            }).catch(err => {
                console.log('message', err.message);
            });
            if (status.id != 0) {
                allArr.push({
                    name: status.name,
                    color: status.color,
                    value: loads.count
                });
            }
        }
        return allArr;
    } catch (error) {
        return await Helper.errorMsg('load Group Error');
    }
}
async function groupWeekLoads(where) {
    try {
        let data = {
            query: {
                orderBy: 'startTime',
                order: 'asc'
            },
        };
        let sortAndPagination = await Helper.sortAndPagination(data);
        let loads, totalDistance = 0, totalEmptyMile = 0, loadsArr = [];
        loads = await Load.findAndCountAll({
            attributes: [ 'id', 'status', 'totalDistance', 'emptymile', 'startTime' ],
            where: {
                ...where,
            },
            ...sortAndPagination
        }).catch(err => {
            console.log('message', err.message);
        });
        let emptyPerc = 0, totalPerc = 0, arr = [];
        let obj = {
            monday: { dist: 0, empty: 0 },
            tuesday: { dist: 0, empty: 0 },
            wednesday: { dist: 0, empty: 0 },
            thursday: { dist: 0, empty: 0 },
            friday: { dist: 0, empty: 0 },
            saturday: { dist: 0, empty: 0 },
            sunday: { dist: 0, empty: 0 }
        };
        
        for (const load of loads.rows) {
            let weekDay = await Helper.getWeekDay(load.dataValues.startTime);
            switch (weekDay) {
                case 'monday':
                    obj.monday.dist += (load.dataValues.totalDistance - load.dataValues.emptymile);
                    obj.monday.empty += load.dataValues.emptymile;
                    break;
                case 'tuesday':
                    obj.tuesday.dist += (load.dataValues.totalDistance - load.dataValues.emptymile);
                    obj.tuesday.empty += load.dataValues.emptymile;
                    break;
                case 'wednesday':
                    obj.wednesday.dist += (load.dataValues.totalDistance - load.dataValues.emptymile);
                    obj.wednesday.empty += load.dataValues.emptymile;
                    break;
                case 'thursday':
                    obj.thursday.dist += (load.dataValues.totalDistance - load.dataValues.emptymile);
                    obj.thursday.empty += load.dataValues.emptymile;
                    break;
                case 'friday':
                    obj.friday.dist += (load.dataValues.totalDistance - load.dataValues.emptymile);
                    obj.friday.empty += load.dataValues.emptymile;
                    break;
                case 'saturday':
                    obj.saturday.dist += (load.dataValues.totalDistance - load.dataValues.emptymile);
                    obj.saturday.empty += load.dataValues.emptymile;
                    break;
                case 'sunday':
                    obj.sunday.dist += (load.dataValues.totalDistance - load.dataValues.emptymile);
                    obj.sunday.empty += load.dataValues.emptymile;
                    break;
            
                default:
                    break;
            }
            totalDistance += load.dataValues.totalDistance;
            totalEmptyMile += load.dataValues.emptymile;
        }
        for (const key in obj) {
            arr.push({
                day: key,
                dist: obj[key].dist,
                empty: obj[key].empty
            });
        }
        emptyPerc = totalEmptyMile == 0 || totalEmptyMile > 0 ? (totalEmptyMile *100)/totalDistance : 0;
        totalPerc = 100 - emptyPerc;
        return {
            arr,
            emptyPerc,
            totalPerc
        };
    } catch (error) {
        console.log(error);
        return await Helper.errorMsg('load Week Group Error');
    }
}
