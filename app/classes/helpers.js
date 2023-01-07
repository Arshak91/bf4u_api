const moment = require("moment");
const uuidv1 = require("uuid/v1");
const axios = require("axios");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const ftp = require("ftp")
const { URL } = require("url");
const bcrypt = require("bcryptjs");
const db = require("../config/db.config.js");
const mdb = require("../config/mongo.config");
const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");
const Checks = require("../classes/checks");
const { NorderAttrb, OrderAttr } = require("../classes/joinColumns.js");
const Osmap = require("../controller/osmap.controller");
const ClassLoad = require("../classes/load");
const DriverClass = require("../classes/driver");
const Clients = require("../mongoModels/ClinetsModel");
const clientController = require("../mongoControllers/ClientsController");
const Mailer = require("../classes/mailer");
const FileManager = require('../classes/files_manager');
const User = db.user;
const UserRole = db.user_role;
const UserTypes = db.user_types;
const Op = db.Sequelize.Op;
const Job = db.job;
const Load = db.load;
const LoadTemp = db.loadTemp;
const Driver = db.driver;
const seq = db.sequelize;
const Order = db.order;
const Depo = db.depo;
const Shift = db.shift;
const Hunit = db.handlingUnit;
const Consignee = db.consignee;
const Vendors = db.vendors;
const FlowType = db.flowTypes;
const Statuses = db.status;
const sequelize = db.Sequelize;
const permissionGroup = db.permissionGroup;

const fs = require("fs");
const includeFalse = [{ all: true, nested: false }];
const includeTrue = [{ all: true, nested: true }];
// const OrderAttr = [
//     ...NorderAttrb,
//     "statuses.color as statusColor",
//     "statuses.id as statusId",
//     "statuses.name as statusName",
//     "statuses.statustype as statusType",
//     "transporttypes.name as LoadType"
// ];
const config = {
    host: "necsftp.com",
    user: "legacy_foods",
    password: "kk15F1!d",
    "promptForPass": false,
    "remote": "/",
    "secure": false,
    "secureOptions": null,
    "connTimeout": 100000,
    "pasvTimeout": 100000,
    "keepalive": 100000
};

module.exports = class Helper {


    // Query 
    static selectQueryProducts() {
        let query = "SELECT ";
        query += "upload.a.`Invoice Number` as po, ";
        query += "upload.bi.`Total Cases`, dc.id as consigneeId, dc.companyLegalName, dc.points, dc.serviceTime, ";
        query += `JSON_ARRAYAGG(
            JSON_OBJECT(
             "sku", upload.a.\`Item Number\`,
             "Quantity", upload.a.\`Quantity Shipped\`,
             "weight", upload.p.Weight,
             "handlingTypeId", (SELECT demo2.HandlingTypes.id FROM demo2.HandlingTypes WHERE LOWER(demo2.HandlingTypes.Type) = LOWER(upload.p.Unit)),
             "handlingType", upload.p.Unit,
             "piecetype", upload.p.Class,
             "piecetypeId", (SELECT demo2.piecetypes.id FROM demo2.piecetypes where LOWER(demo2.piecetypes.piecetype) = LOWER(upload.p.Class) ),
             "brand", upload.p.Brand,
             "productdescription", CONCAT(upload.p.Manufacturer," ", upload.p.\`Name\`)
             )
        ) as products `;
        query += "FROM upload.`all` as a ";
        query += "LEFT JOIN upload.byinvoce as bi ON upload.a.`Invoice Number` = REGEXP_REPLACE(upload.bi.`Invoice Number`,"[a - z] + ", ) ";
        query += "LEFT JOIN upload.legacyProducts as p ON p.ID = a.`Item Number` ";
        query += "LEFT JOIN demo2.consignees as dc ON dc.`name` = upload.bi.`Ship To Number` ";

        query += "WHERE 1 ";
        query += "AND upload.bi.`Total Cases` > 0 ";

        query += "GROUP BY  upload.a.`Invoice Number`";
        return query;
    }

    static createSelectQuery(table, val, attb) {
        let fls = "*";
        if (attb) {
            fls = attb.join(",");
        }
        let query = `SELECT ${fls} FROM ${table} WHERE ${table}.id IN (${val}) ORDER BY FIND_IN_SET(id, "${val}")`;
        return query;
    }
    static createCountQuery(table) {
        let query = `SELECT COUNT(*) FROM ${table};`;
        return query;
    }
    static createSelectQueryByLike(table, where, size, orderArr, offset, limit, page = null) {
        const orders = table[0];
        const customers = table[1];
        let fls = "*";
        let str = "WHERE";
        for (const key in where) {
            switch (key) {
                case "perMile":
                    str += ` ${orders}.permileRate = ${where[key]} AND`;
                    break;
                case "totalRateMin":
                    str += ` ${orders}.rate >= ${where[key] * 1} AND`;
                    break;
                case "totalRateMax":
                    str += ` ${orders}.rate <= ${where[key] * 1} AND`;
                    break;
                case "id":
                    str += ` ${orders}.id LIKE "${where[key]}" AND`;
                    break;
                case "deliverydateFrom":
                    str += ` ${orders}.deliverydateFrom LIKE "${where[key]}%" AND`;
                    break;
                case "pickupdateFrom":
                    str += ` ${orders}.pickupdateFrom LIKE "${where[key]}%" AND`;
                    break;
                case "pickup":
                    str += ` ${orders}.pickup LIKE "%${where[key]}%" AND`;
                    break;
                case "delivery":
                    str += ` ${orders}.delivery LIKE "%${where[key]}%" AND`;
                    break;
                case "loadtype":
                    str += ` ${orders}.loadtype LIKE "${where[key]}" AND`;
                    break;
                case "date":
                    let date = where.date;
                    let dtTo = new Date(date);
                    dtTo.setDate(dtTo.getDate() + 1);
                    dtTo = dtTo.toISOString().split("T")[0];
                    str += ` ${orders}.createdAt <= "%${dtTo}%" AND`;
                    break;
                case "customerName":
                    str += ` ${customers}.customerName LIKE "${where[key]}" AND`;
                    break;
                default:
                    str += ` ${orders}.${key} LIKE "%${where[key]}" AND`;
                    break;
            }
        }
        // if (size) {
        //     str += ` (feet LIKE "%${size}" OR weight LIKE "%${size}" OR cube LIKE "%${size}" OR pallet LIKE "%${size}")`
        // } else 
        if (Object.keys(where).length) {
            str = str.slice(0, -3);
        } else {
            str = str.slice(0, -5);
        }
        let query = `SELECT ${fls} FROM ${customers} left join ${orders} ON (${customers}.id = ${orders}.customerid) ${str} ORDER BY ${orders}.${orderArr[0]}, "${orderArr[1]}" ${page ? `LIMIT ${limit} OFFSET ${offset}` : ""} `;
        //console.log(query);
        return query;

    }
    static createSelectQueryWithJoin(tables, val, attb) {
        let fls = "*";
        if (attb) {
            fls = attb.join(",");
        }
        let orders = tables[0];
        let customers = tables[1] ? tables[1] : false;
        let statuses;
        tables[2] ? statuses = tables[2] : statuses = false;
        let query = `SELECT ${fls} FROM ${orders} 
            ${customers ? `LEFT JOIN ${customers} ON ${orders}.customerid = ${customers}.id ` : ""}
            ${statuses ? `LEFT JOIN ${statuses} ON ${orders}.status = ${statuses}.id` : ""}
            WHERE ${orders}.id IN (${val}) ORDER BY FIND_IN_SET(${orders}.id, "${val}")`;
        // console.log(query);
        return query;

    }
    static createSelectQueryWithJoinConsignee(tables, val, attb) {
        let fls = "*";
        if (attb) {
            fls = attb.join(",");
        }
        let orders = tables[0];
        let consignee = tables[1] ? tables[1] : false;
        let query = `SELECT ${fls} FROM ${orders} 
            ${consignee ? `LEFT JOIN ${consignee} ON ${orders}.consigneeid = ${consignee}.id ` : ""}
            WHERE ${orders}.id IN (${val}) ORDER BY FIND_IN_SET(${orders}.id, "${val}")`;
        // console.log(query);
        return query;

    }
    static createSelectQueryWithJoin3(tables, val, attb) {
        let fls = "*";
        if (attb) {
            fls = attb.join(",");
        }
        let orders = tables[0];
        let customers = tables[1];
        let statuses = tables[2];
        let query = `SELECT ${fls} FROM ${orders} 
                    LEFT JOIN ${customers} ON ${orders}.customerid = ${customers}.id 
                    LEFT JOIN ${statuses} ON ${orders}.status = ${statuses}.id  
                    WHERE ${orders}.id 
                    IN (${val}) 
                    ORDER BY FIND_IN_SET(${orders}.id, "${val}")`;
        // console.log(query);
        return query;

    }
    static createSelectQueryWithJoin4(tables, val, attb) {
        let fls = "*";
        if (attb) {
            fls = attb.join(",");
        }
        let orders = tables[0];
        let customers = tables[1];
        let statuses = tables[2];
        let loadTypes = tables[3];
        let query = `SELECT ${fls} FROM ${orders} 
                    LEFT JOIN ${customers} ON ${orders}.customerid = ${customers}.id 
                    LEFT JOIN ${statuses} ON ${orders}.status = ${statuses}.id
                    LEFT JOIN ${loadTypes} ON ${orders}.loadtype = ${loadTypes}.id  
                    WHERE ${orders}.id 
                    IN (${val}) 
                    ORDER BY FIND_IN_SET(${orders}.id, "${val}")`;
        // console.log(query);
        return query;

    }

    static createSelectQueryWithJoin5(tables, val, attb) {
        let fls = "*";
        if (attb) {
            fls = attb.join(",");
        }
        let orders = tables[0];
        let customers = tables[1];
        let statuses = tables[2];
        let loadTypes = tables[3];
        let consignees = tables[4];
        let query = `SELECT ${fls} FROM ${orders} LEFT JOIN ${customers} ON ${orders}.customerid = ${customers}.id LEFT JOIN ${statuses} ON ${orders}.status = ${statuses}.id
                    LEFT JOIN ${loadTypes} ON ${orders}.loadtype = ${loadTypes}.id
                    LEFT JOIN ${consignees} ON ${orders}.consigneeid = ${consignees}.id
                    WHERE ${orders}.id IN (${val}) 
                    ORDER BY FIND_IN_SET(${orders}.id, "${val}")`;
        // console.log(query);
        return query;

    }
    static createSelectQueryWithJoin6(tables, val, attb) {
        let fls = "*";
        if (attb) {
            fls = attb.join(",");
        }
        let orders = tables[0];
        let customers = tables[1];
        let statuses = tables[2];
        let loadTypes = tables[3];
        let consignees = tables[4];
        let accessorials = tables[5];
        let query = `SELECT ${fls} FROM ${orders} LEFT JOIN ${customers} ON ${orders}.customerid = ${customers}.id
                    LEFT JOIN ${statuses} ON ${orders}.status = ${statuses}.id
                    LEFT JOIN ${loadTypes} ON ${orders}.loadtype = ${loadTypes}.id
                    LEFT JOIN ${consignees} ON ${orders}.consigneeid = ${consignees}.id
                    LEFT JOIN ${accessorials} ON ${orders}.pickupAccessorials = ${accessorials}.id
                    WHERE ${orders}.id IN (${val}) 
                    ORDER BY FIND_IN_SET(${orders}.id, "${val}")`;
        // console.log(query);
        return query;
    }

    static createEditQuery(serviceTime, pieceTime) {
        let query = `UPDATE orders SET orders.servicetime = ${serviceTime} + ( orders.pieceCount * ${pieceTime}), orders.pieceTime = ${pieceTime}
        where orders.id > 0;`;
        return query;
    }

    static async getOne(data) {
        const { key, value, table } = data;
        let loadTemp;
        loadTemp = await table.findOne({
            where: {
                [key]: value
            },
            include: includeFalse
        }).catch(err => {
            console.log("catch find ", err);
        });
        return loadTemp;
    }
    static async getAll(data) {
        const { key, value, table } = data;
        let result;
        result = await table.findAndCountAll({
            where: {
                [key]: value
            },
            include: includeFalse
        });
        return result;
    }
    static async getOrderTimeWindow(time, order, timezone) {
        let zone = timezone ? timezone.split(":")[0] : null;
        let data = moment(time, "x").format("YYYY-MM-DD"), timeWindows = {};
        if (!order || !order.timeWindows || !order.timeWindows.deliveryTimeWindows) {
            console.log(order);
        }
        for (const item of order.timeWindows.deliveryTimeWindows) {
            if (moment(item.From.split("T")[0], "YYYY-MM-DD") <= moment(data, "YYYY-MM-DD")) {
                timeWindows.deliveryFrom = item.From;
                timeWindows.deliveryTo = item.To;
            } else if (moment(item.From.split("T")[0], "YYYY-MM-DD") > moment(data, "YYYY-MM-DD")) {
                timeWindows.deliveryFrom = item.From;
                timeWindows.deliveryTo = item.To;
                break;
            }
        }
        for (const item of order.timeWindows.pickupTimeWindows) {
            if (moment(item.From.split("T")[0], "YYYY-MM-DD") <= moment(data, "YYYY-MM-DD")) {
                timeWindows.pickupFrom = item.From;
                timeWindows.pickupTo = item.To;
            } else if (moment(item.From.split("T")[0], "YYYY-MM-DD") > moment(data, "YYYY-MM-DD")) {
                timeWindows.pickupFrom = item.From;
                timeWindows.pickupTo = item.To;
            }
        }
        return timeWindows;
    }
    static async getResponse(status, msg, data) {
        return {
            status,
            msg,
            data: data || null
        };
    }
    // string spliter 
    static splitToIntArray(text, dl) {
        let array = text.split(dl).map(function (item) {
            return parseInt(item, 10);
        });
        return array;
    }
    // nominatim 
    static checkAndGetLatLon(load, orders) {

        let points = "";
        let count = orders.length;

        for (let i = 0; i < count; i++) {
            const el = orders[i];

            if (load.depo > 0) {
                points += `${load.depo.lat},${load.depo.lon};`;
            }
            if (count == 1) {
                points += `${el.deliveryLat},${el.deliveryLon};`;
            }

            if (el.flowType == 0) {
                points += `${el.pickupLat},${el.pickupLon};`;

            } else {
                points += `${el.deliveryLat},${el.deliveryLon};`;
            }


        }
        //console.log(points);
        return points.slice(0, -1);
    }
    static async getLatLon(loadTemp, orders) {
        try {
            // let lastPort;
            // const depoIds = JSON.parse(loadTemp.depoId);
            // const portIds = JSON.parse(loadTemp.portIds);
            // const port = Port.findOne({
            //     where: {
            //         id: portIds[0]
            //     }
            // });
            // if (portIds.length == 2) {
            //     lastPort = Port.findOne({
            //         where: {
            //             id: portIds[1]
            //         }
            //     });
            // }
            // const lastDepo = Depo.findOne({
            //     where: {
            //         id: depoIds[depoIds.length-1]
            //     }
            // });
            const depo = loadTemp.depoId ? await seq.query(Helper.createSelectQuery("depos", loadTemp.depoId), { type: seq.QueryTypes.SELECT }) : "";

            let points = "";
            let newPoints;
            if (loadTemp.flowType == 2) {
                points += `${depo[0].lat},${depo[0].lon};`;
                for (const order of orders) {
                    points += `${order.deliveryLat},${order.deliveryLon};`;
                }
                newPoints = await this.joinLatLon(points);
                if (loadTemp.return == 0) {
                    newPoints += `${depo[0].lat},${depo[0].lon};`;
                }
            } else if (loadTemp.flowType == 1) {
                points += `${depo[0].lat},${depo[0].lon};`;
                for (const order of orders) {
                    points += `${order.pickupLat},${order.pickupLon};`;
                }
                newPoints = await this.joinLatLon(points);
                newPoints += `${depo[0].lat},${depo[0].lon};`;
            }
            // else if (loadTemp.flowType == 4) {
            //     points += `${depo[0].lat},${depo[0].lon};`;
            //     points += `${lastDepo.lat},${lastDepo.lon};`;
            // } else if (loadTemp.flowType == 6) {
            //     points += `${lastDepo.lat},${lastDepo.lon};`;
            //     points += `${port.lat},${port.lon};`;
            // } else if (loadTemp.flowType == 7) {
            //     points += `${port.lat},${port.lon};`;
            //     points += `${lastPort.lat},${lastPort.lon};`;
            // } else if (loadTemp.flowType == 8) {
            //     points += `${port.lat},${port.lon};`;
            //     points += `${depo[0].lat},${depo[0].lon};`;
            // }
            return newPoints;
        } catch (error) {
            return error;
        }

    }
    // get date formated
    static getDateFormated(date) {

        date = date ? new Date(date) : new Date();

        var yyyy = date.getFullYear();
        var dd = date.getDate();
        var mm = date.getMonth() + 1;

        if (dd < 10) {
            dd = "0" + dd;
        }
        if (mm < 10) {
            mm = "0" + mm;
        }

        date = dd + "/" + mm + "/" + yyyy;
        return date;
    }
    // get date from end formated for flatbed orders
    static getFlatbedDatesFromEndFormated(date) {

        date = date ? new Date(date) : new Date();

        var yyyy = date.getFullYear();
        var dd = date.getDate();
        var mm = date.getMonth() + 1;

        if (dd < 10) {
            dd = "0" + dd;
        }
        if (mm < 10) {
            mm = "0" + mm;
        }

        date = `${yyyy}-${mm}-${dd}`;

        const from = new Date(date)
        const to = new Date(date)

        to.setDate(to.getDate() + 1);

        return {
            from,
            to
        };
    }

    static getFilePaths(directory, fileName, location = null) {
        console.log(location);

        // get user id based directory for carriers, shippers
        var dir = `resources/${directory}/${fileName}`;

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        //  Delete after testing
        let paths;
        if (location) {
            let host;
            if (location.host == "localhost:4200") {
                host = "localhost:8080";
            } else {
                host = location.host;
            }
            paths = {
                urls: {
                    Path: `${location.protocol}//${host}/${directory}/pdf/${fileName}`,
                },

                filePath: `${dir}/${fileName}`
            };
        } else {
            paths = {
                urls: {
                    localPath: `http://localhost:8080/api/${dir}/${fileName}`,
                    // Path: `http://${host}/api/${directory}/pdf/${fileName}`,
                },

                filePath: `${dir}/${fileName}`
            };
        }

        return paths;
    }

    // get files paths
    static getPaths(directory, fileName, userId, location = null) {
        console.log(location);

        // get user id based directory for carriers, shippers
        var userIdBasedDir = userId;

        var dir = `resources/${userIdBasedDir}/${directory}`;

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        //  Delete after testing
        let paths;
        if (location) {
            let host;
            if (location.host == "localhost:4200") {
                host = "localhost:8080";
            } else {
                host = location.host;
            }
            paths = {
                urls: {
                    Path: `${location.protocol}//${host}/${directory}/pdf/${fileName}`,
                },

                filePath: `${dir}/${fileName}`
            };
        } else {
            paths = {
                urls: {
                    localPath: `http://localhost:8080/api/${directory}/pdf/${fileName}`,
                    // Path: `http://${host}/api/${directory}/pdf/${fileName}`,
                },

                filePath: `${dir}/${fileName}`
            };
        }

        return paths;
    }
    static async updateJob(data, uid) {
        try {

            let orderIds = [];
            let drivingMinutes = [];
            for (const load of data.Loads) {
                orderIds = orderIds.concat(load.OrderIDs);
                drivingMinutes.push(load.DrivingMinutes);
            }
            const jsonOrderId = JSON.stringify(orderIds);
            const jsondrivingMinutes = JSON.stringify(drivingMinutes);
            const job = await Job.update({
                status: data.Status,
                eta: data.ETA,
                percentage: data.Percentage,
                loadOrderIds: jsonOrderId,
                drivingminutes: jsondrivingMinutes,
                totalRunTime: data.RuntimeSeconds
            }, {
                where: {
                    UUID: uid
                }
            });
            return job;
        } catch (error) {
            return error;
        }
    }
    static async updateLastLocation(data) {
        try {
            const { loadId, location } = data;
            let updateLoc;

            const load = await Load.findOne({
                where: {
                    id: loadId
                }
            });
            if (load) {
                updateLoc = await Load.update({
                    lastlocatoins: location
                }, {
                    where: {
                        id: loadId
                    }
                });
                return {
                    status: 1,
                    msg: "ok",
                    updateLoc
                };
            } else {
                return {
                    status: 0,
                    msg: "such Load doesn't exist"
                };
            }
        } catch (error) {
            return {
                status: 0,
                msg: "error"
            };
        }

    }
    static async getStatusAutoplan(uid) {
        let statusUrl = `${env.engineHost}:${env.enginrPort}/status?execid=${uid}`;
        const result = await axios.get(statusUrl);
        const dataLength = result.data.length;
        const { ETA } = result.data[dataLength - 1].ThreadOutcome;

        return ETA;
    }
    static async findLoads(data) {

    }

    static async filters(where, Op, data = null, week = null) {
        let bool = true;
        let type;
        if (data && data == "product") {
            if (where.Manufacturer) {
                where = {
                    ...where,
                    manufacturernumber: where.Manufacturer
                };
                delete where.Manufacturer;
            }
            if (where.Brand) {
                where = {
                    ...where,
                    brandname: where.Brand
                };
                delete where.Brand;
            }
        }
        if (data && data == 'notification') {
            let obj;
            obj = await this.notificationFilter(where);
            where = {
                ...where,
                ...obj
            };
        }
        if (data && data == "loadTemp") {
            let ids = {
                loadTempIds: {}
            }, obj = {};
            if (where.id || where.bol || where.po || where.pro || where.customersIds) {
                ids = await this.loadFiltersById(where);
            }
            obj = await this.loadFilters(where, week);
            where = {
                ...where,
                ...obj,
                ...ids.loadTempIds
            };
        }
        if (data && data == 'userManagement') {
            let obj = {};
            obj = await this.userManagementFilters(where, week);
            where = {
                ...obj,
                ...where
            };
        }
        if (data && data == "consignee") {
            let obj = {};
            obj = await this.consigneeFilters(where, week);
            where = {
                ...obj,
                ...where
            };
        }
        if (data && data == "load") {
            let ids = {
                loadIds: {}
            }, obj = {};
            if (where.id || where.bol || where.po || where.pro || where.customersIds) {
                ids = await this.loadFiltersById(where, "load");
            }
            obj = await this.loadFilters(where, week);
            where = {
                ...where,
                ...obj,
                ...ids.loadIds
            };
        }

        if (data && data == "order") {
            let obj;
            obj = await this.orderFilters(where);
            where = {
                ...where,
                ...obj
            };

        }

        if (data && data == "depo") {
            let obj;
            obj = await this.deposFilter(where);
            where = {
                ...where,
                ...obj
            };
            return where
        }

        if (data && data == "products") {
            let obj;
            obj = await this.productFilter(where);
            where = {
                ...where,
                ...obj
            };
            // return where;
        }
        if (data && data === "companyequipment") {
            let obj;
            obj = await this.companyEquipmentFilter(where);
            where = {
                ...where,
                ...obj
            };
            // return where
        }
        if (data && data == "driver") {
            let sday, arr = [], drivers, from;
            if (where.date) {
                sday = await this.getWeekDay(where.date);
                drivers = await Driver.findAndCountAll({ where: { status: 1 }, include: includeFalse });

                for (const driver of drivers.rows) {
                    from = driver.schedule.dataValues[sday] && driver.schedule.dataValues[sday].from ? driver.schedule.dataValues[sday].from : null;
                    if (from) {
                        arr.push(driver.id);
                    }
                }
                where.id = {
                    [Op.in]: arr
                };
                delete where.date;
            }
        }
        if (where.startDate) {
            let endMil = new Date(where.startDate).getTime() + 86399999;
            let start = where.startDate, end = new Date(endMil).toISOString();
            where.startTime = {
                [Op.gte]: start,
                [Op.lte]: end
            };
            delete where.startDate;
        }
        // if (where.startDateFromTime) {

        // }
        // if (where.startDateToTime) {

        // }
        if (where.finish) {
            where.finishRequest = {
                [Op.ne]: where.finish
            };
            delete where.finish;
        }
        if (where.start_time) {
            where.startTime = {
                [Op.startsWith]: where.start_time
            };
            delete where.start_time;
        }
        if (where.onlyFinish) {
            where.finishRequest = 2;
            delete where.onlyFinish;
        } else {
            delete where.onlyFinish;
        }

        if (where.name) {
            where.name = {
                [Op.startsWith]: where.name
            };
        }

        if ((where.sizeMin || where.sizeMax) && !where.sizeType) {
            bool = false;
        }
        if (where.sizeType) {
            type = where.sizeType;
        }
        if (where.driverAssigned == 0) {
            where.driverId = null;
        } else if (where.driverAssigned == 1) {
            where.driverId = {
                [Op.gte]: 1
            };
        }
        delete where.sizeType;
        delete where.driverAssigned;
        if ((where.sizeMin && where.sizeMax) && (where.sizeMax * 1 > where.sizeMin * 1)) {
            where[type] = {
                [Op.between]: [where.sizeMin * 1, where.sizeMax * 1]
            };
            delete where.sizeMin;
            delete where.sizeMax;
        } else if (where.sizeMin && !where.sizeMax) {
            where[type] = {
                [Op.gte]: where.sizeMin
            };
            delete where.sizeMin;
        } else if (where.sizeMax && !where.sizeMin) {
            where[type] = {
                [Op.lte]: where.sizeMax
            };
            delete where.sizeMax;
        } else if (where.sizeMax * 1 <= where.sizeMin * 1) {
            delete where.sizeMin;
            delete where.sizeMax;
            bool = false;
        }

        if ((where.totalRateMin && where.totalRateMax) && (where.totalRateMax * 1 > where.totalRateMin * 1)) {
            where.rate = {
                [Op.between]: [where.totalRateMin * 1, where.totalRateMax * 1]
            };
            delete where.totalRateMin;
            delete where.totalRateMax;
        } else if (where.totalRateMin && !where.totalRateMax) {
            where.rate = {
                [Op.gte]: where.totalRateMin * 1
            };
            delete where.totalRateMin;
        } else if (where.totalRateMax && !where.totalRateMin) {
            where.rate = {
                [Op.lte]: where.totalRateMax * 1
            };
            delete where.totalRateMax;
        } else if (where.totalRateMax * 1 <= where.totalRateMin * 1) {
            delete where.totalRateMin;
            delete where.totalRateMax;
            bool = false;
        }


        if ((where.deliveryDateFrom && where.deliveryDateTo) && (where.deliveryDateTo > where.deliveryDateFrom)) {
            where.deliverydateFrom = {
                [Op.gte]: where.deliveryDateFrom
            };
            where.deliverydateTo = {
                [Op.lte]: where.deliveryDateTo
            };
            delete where.deliveryDateTo;
            delete where.deliveryDateFrom;
        } else if (where.deliveryDateFrom && !where.deliveryDateTo) {
            where.deliverydateFrom = {
                [Op.gte]: where.deliveryDateFrom
            };
            delete where.deliveryDateFrom;
        } else if (where.deliveryDateTo && !where.deliveryDateFrom) {
            where.deliverydateTo = {
                [Op.lte]: where.deliveryDateTo
            };
            delete where.deliveryDateTo;
        } else if (where.deliveryDateTo <= where.deliveryDateFrom) {
            delete where.deliveryDateTo;
            delete where.deliveryDateFrom;
            bool = false;
        }

        if ((where.pickupDateFrom && where.pickupDateTo) && (where.pickupDateTo > where.pickupDateFrom)) {

            where.pickupdateFrom = {
                [Op.gte]: where.pickupDateFrom
            };
            where.pickupdateTo = {
                [Op.lte]: where.pickupDateTo
            };
            delete where.pickupDateTo;
            delete where.pickupDateFrom;
        } else if (where.pickupDateFrom && !where.pickupDateTo) {
            where.pickupdateFrom = {
                [Op.gte]: where.pickupDateFrom
            };
            delete where.pickupDateFrom;
        } else if (where.pickupDateTo && !where.pickupDateFrom) {
            where.pickupdateTo = {
                [Op.lte]: where.pickupDateTo
            };
            delete where.pickupDateTo;
        } else if (where.pickupDateTo <= where.pickupDateFrom) {
            delete where.pickupDateTo;
            delete where.pickupDateFrom;
            bool = false;
        }

        if ((where.mileMin && where.mileMax) && (where.mileMax * 1 > where.mileMin * 1)) {
            where.totalDistance = {
                [Op.between]: [where.mileMin * 1, where.mileMax * 1]
            };
            delete where.mileMin;
            delete where.mileMax;
        } else if (where.mileMin && !where.mileMax) {
            where.totalDistance = {
                [Op.gte]: where.mileMin * 1
            };
            delete where.mileMin;
        } else if (where.mileMax && !where.mileMin) {
            where.totalDistance = {
                [Op.lte]: where.mileMax * 1
            };
            delete where.mileMax;
        } else if (where.mileMax * 1 <= where.mileMin * 1) {
            delete where.mileMin;
            delete where.mileMax;
            bool = false;
        }

        if ((where.stopsMin && where.stopsMax) && (where.stopsMax * 1 > where.stopsMin * 1)) {
            where.stops = {
                [Op.between]: [where.stopsMin * 1, where.stopsMax * 1]
            };
            delete where.stopsMin;
            delete where.stopsMax;
        } else if (where.stopsMin && !where.stopsMax) {
            where.stops = {
                [Op.gte]: where.stopsMin * 1
            };
            delete where.stopsMin;
        } else if (where.stopsMax && !where.stopsMin) {
            where.stops = {
                [Op.lte]: where.stopsMax * 1
            };
            delete where.stopsMax;
        } else if ((where.stopsMin && where.stopsMax) && (where.stopsMax * 1 == where.stopsMin * 1)) {
            where.stops = where.stopsMin * 1;
            delete where.stopsMin;
            delete where.stopsMax;
        } else if (where.stopsMax * 1 < where.stopsMin * 1) {
            delete where.stopsMin;
            delete where.stopsMax;
            bool = false;
        }

        if ((where.loadCostMin && where.loadCostMax) && (where.loadCostMax * 1 > where.loadCostMin * 1)) {

            where.loadCost = {
                [Op.between]: [where.loadCostMin * 1, where.loadCostMax * 1]
            };
            delete where.loadCostMin;
            delete where.loadCostMax;
            // console.log(where);
        } else if (where.loadCostMin && !where.loadCostMax) {
            where.loadCost = {
                [Op.gte]: where.loadCostMin * 1
            };
            delete where.loadCostMin;
        } else if (where.loadCostMax && !where.loadCostMin) {
            where.loadCost = {
                [Op.lte]: where.loadCostMax * 1
            };
            delete where.loadCostMax;
        } else if (where.loadCostMax * 1 <= where.loadCostMin * 1) {
            delete where.loadCostMin;
            delete where.loadCostMax;
            bool = false;
        }
        if (where.orderIds) {
            let arr = [];
            const orderIds = where.orderIds.split(",");
            // console.log("ids", orderIds);

            for (const orderId of orderIds) {
                arr.push({
                    [Op.and]: [{
                        [Op.like]: `%${orderId}%`
                    }]
                });
            }
            for (const i in arr) {
                where.orders = {
                    [Op.and]: arr[i]
                };
            }
            delete where.orderIds;
        }
        if (where.handlingUnit) {
            const handlingUnit = where.handlingUnit.split(",");
            const obj = {};
            for (const item of handlingUnit) {
                item == "stackable" ? obj[item] = 1 : "";
                item == "turnable" ? obj[item] = 1 : "";
                item == "hazmat" ? obj[item] = 1 : "";
            }

            where.orderTypes = obj;
            delete where.handlingUnit;
        }
        if (where.statuses) {
            let statuses = where.statuses.split(",");
            statuses = statuses.map(el => { return parseInt(el, 10); });
            where.status = { [Op.in]: statuses };

            delete where.statuses;
            // console.log(where.status);
        }

        if (where.deliveryCompanyName) {
            where.deliveryCompanyName = {
                [Op.like]: `%${where.deliveryCompanyName}%`
            };
        }
        if (where.pickupCompanyName) {
            where.pickupCompanyName = {
                [Op.like]: `%${where.pickupCompanyName}%`
            };
        }
        for (const key in where) {

            switch (key) {
                case "perMileMin":
                    // where.permileRate = where[key];
                    delete where.perMileMin;
                    break;
                case "perMileMax":
                    // where.permileRate = where[key];
                    delete where.perMileMax;
                    break;
                case "id":
                    if (data != "load" && data != "loadTemp" && data != "driver" && data != "order" && data != "consignee") {
                        const ids = await this.splitToIntArray(where[key], ",");
                        where.id = {
                            [Op.in]: ids
                        };
                    }

                    // where.id = {
                    //     [Op.like]: where[key]
                    // };
                    break;
                case "pickup":
                    where.pickup = {
                        [Op.substring]: where[key]
                    };
                    break;
                case "delivery":
                    where.delivery = {
                        [Op.substring]: where[key]
                    };
                    break;
                case "loadtype":
                    where.loadtype = {
                        [Op.like]: where[key]
                    };
                    break;
                case "date":
                    let date = where.date;
                    let dtTo = new Date(date);
                    dtTo.setDate(dtTo.getDate() + 1);
                    dtTo = dtTo.toISOString().split("T")[0];
                    where.createdAt = {
                        [Op.lte]: dtTo
                    };
                    delete where.date;
                    break;
                default:
                    break;
            }
        }

        return { where, bool };
    }

    static async loadFiltersById(data, load = null) {
        try {
            let ids = [], loadIds = [], loadTempIds = [], orders, orderWhere = {}, consIds;
            for (const key in data) {
                switch (key) {
                    case "po":
                        orderWhere.po = data.po;
                        delete data.po;
                        break;
                    case "pro":
                        orderWhere.pro = data.pro;
                        delete data.pro;
                        break;
                    case "bol":
                        orderWhere.bol = data.bol;
                        delete data.bol;
                        break;
                    case "customersIds":
                        consIds = await this.splitToIntArray(data.customersIds, ",");
                        orderWhere.consigneeid = {
                            [Op.in]: consIds
                        };
                        delete data.customersIds;
                        break;
                    default:
                        break;
                }
            }
            if (orderWhere.po || orderWhere.pro || orderWhere.bol) {
                orders = await Order.findAndCountAll({
                    where: orderWhere
                });
                for (const order of orders.rows) {
                    if (load) {
                        loadIds = loadIds.concat(order.loadIds);
                    } else {
                        loadTempIds = loadTempIds.concat(order.loadTempIds);
                    }
                }
            }
            if (orderWhere.consigneeid) {
                let orders = await Order.findAndCountAll({ where: orderWhere, attributes: ["id", "loadTempIds", "loadIds"] });
                for (const order of orders.rows) {
                    if (load) {
                        loadIds = loadIds.concat(order.dataValues.loadIds);
                    } else {
                        loadTempIds = loadTempIds.concat(order.dataValues.loadTempIds);
                    }

                }
            }
            if (data.id) {
                ids = await this.splitToIntArray(data.id, ",");
            }
            if (load) {
                loadIds = loadIds.concat(ids);
            } else {
                loadTempIds = loadTempIds.concat(ids);
            }
            return {
                status: 1,
                loadIds: {
                    id: {
                        [Op.in]: loadIds
                    }
                },
                loadTempIds: {
                    id: {
                        [Op.in]: loadTempIds
                    }
                }
            };

        } catch (error) {
            return {
                status: 0,
                msg: error.message
            };
        }
    }
    static async loadFilters(data, week = null, loadTemp = null) {
        try {
            let where = {};
            let from, to, start, end, driverIds;
            if (week) {
                from = data.thisWeekFrom;
                to = data.thisWeekTo;
            } else {
                from = data.from;
                to = data.to;
            }
            delete data.from;
            delete data.to;
            delete data.thisWeekFrom;
            delete data.thisWeekTo;
            if (from) {
                start = {
                    [Op.gte]: from
                };
            }
            if (to) {
                end = {
                    [Op.lte]: to
                };
            }
            if (start || end) {
                where.startTime = {
                    ...start,
                    ...end
                };
            }
            if (data.driversIds) {
                driverIds = await this.splitToIntArray(data.driversIds, ",");
                where.driverId = {
                    [Op.in]: driverIds
                };
                delete data.driversIds;
            }
            delete data.today;
            delete data.delivery;
            return where;
        } catch (error) {
            return {
                status: 0,
                msg: error.message
            };
        }
    }

    static async userManagementFilters(data) {
        let where = {};

        if (data) {
            if (data.id) {
                where.id = { [Op.like]: `%${data.id}%` };
                delete data.id;
            }
            if (data.name) {
                where.name = { [Op.like]: `%${data.name}%` };
                delete data.name;
            }
            if (data.username) {
                where.username = { [Op.like]: `%${data.username}%` };
                delete data.username;
            }
            if (data.email) {
                where.email = { [Op.like]: `%${data.email}%` };
                delete data.email;
            }
            if (data.permissionId) {
                where.permissionId = { [Op.like]: `%${data.permissionId}%` };
                delete data.permissionId;
            }
        }
        return where;
    }

    static async consigneeFilters(data) {
        let where = {}, driverIdsArr, depoIdsArr, zoneIdsArr;
        if (data.ids) {
            let ids = [];
            ids = await this.splitToIntArray(data.ids, ",");
            where.id = { [Op.in]: ids };
            delete data.ids;
        }
        if (data.contactPerson) {
            where.contactPerson = { [Op.like]: "%" + data.contactPerson + "%" };
            delete data.contactPerson;
        }
        if (data.notes) {
            where.notes = { [Op.like]: "%" + data.notes + "%" };
            delete data.notes;
        }
        if (data.companyLegalName) {
            where.companyLegalName = { [Op.like]: "%" + data.companyLegalName + "%" };
            delete data.companyLegalName;
        }
        if (data.email) {
            where.email = { [Op.like]: "%" + data.email + "%" };
            delete data.email;
        }
        if (data.phone1) {
            where.phone1 = { [Op.like]: "%" + data.phone1 + "%" };
            delete data.phone1;
        }
        if (data.phone2) {
            where.phone2 = { [Op.like]: "%" + data.phone2 + "%" };
            delete data.phone2;
        }
        if (data.driverIds && data.driverIds.length) {
            driverIdsArr = await this.splitToIntArray(data.driverIds, ",");
            where.driverId = {
                [Op.in]: driverIdsArr
            };
            delete data.driverIds;
        }
        if (data.depoIds && data.depoIds.length) {
            depoIdsArr = await this.splitToIntArray(data.depoIds, ",");
            if (depoIdsArr.includes(0)) {
                where = {
                    ...where,
                    [Op.or]: [
                        {
                            depo_id: {
                                [Op.in]: depoIdsArr
                            }
                        },
                        {
                            depo_id: {
                                [Op.eq]: null
                            }
                        }
                    ]
                };
            } else {
                where.depo_id = {
                    [Op.in]: depoIdsArr
                };
            }
            delete data.depoIds;
        }
        if (data.zoneIds && data.zoneIds.length) {
            zoneIdsArr = await this.splitToIntArray(data.zoneIds, ",");
            if (zoneIdsArr.includes(0)) {
                where = {
                    ...where,
                    [Op.or]: [
                        {
                            czone_id: {
                                [Op.in]: zoneIdsArr
                            }
                        },
                        {
                            czone_id: {
                                [Op.eq]: null
                            }
                        }
                    ]
                };
            } else {
                where.czone_id = {
                    [Op.in]: zoneIdsArr
                };
            }
            delete data.zoneIds;
        }
        let arr = [];

        const query = "SELECT IFNULL(JSON_LENGTH(points), 0) AS my_count, id FROM mt.consignees ORDER BY IFNULL(JSON_LENGTH(points), 0) DESC";
        const dataX = await seq.query(query, { type: seq.QueryTypes.SELECT });

        let count = dataX.length ? dataX[0].my_count : 0;

        if (data.city) {
            // arr.push(sequelize.where(sequelize.fn("JSON_EXTRACT", sequelize.col("points"), "$[2].address.city"), data.city));
            const x = [];
            for (let i = 0; i < count; i++) {
                let jsonExt = sequelize.fn('JSON_EXTRACT', sequelize.col('points'), `$[${i}].address.city`);
                x.push(sequelize.where(sequelize.fn('LOWER', jsonExt), { [Op.like]: `%${data.city.toLowerCase()}%` }));
            }
            arr.push({ [Op.or]: x });
            delete data.city;
        }
        if (data.state) {
            const x = [];
            for (let i = 0; i < count; i++) {
                let jsonExt = sequelize.fn('JSON_EXTRACT', sequelize.col('points'), `$[${i}].address.state`);
                x.push(sequelize.where(sequelize.fn('LOWER', jsonExt), { [Op.like]: `%${data.state.toLowerCase()}%` }));
            }
            arr.push({ [Op.or]: x });
            delete data.state;
        }
        if (data.zip) {
            const x = [];
            for (let i = 0; i < count; i++) {
                let jsonExt = sequelize.fn('JSON_EXTRACT', sequelize.col('points'), `$[${i}].address.zip`);
                x.push(sequelize.where(sequelize.fn('LOWER', jsonExt), { [Op.like]: `%${data.zip.toLowerCase()}%` }));
            }
            arr.push({ [Op.or]: x });
            delete data.zip;
        }
        return {
            ...where,
            [Op.and]: arr
        };
    }
    static async companyEquipmentFilter(data) {
        let where = {};

        if (data) {
            if (data.id) {
                where.id = { [Op.like]: `%${data.id}%` };
                delete data.id;
            }
            if (data.name) {
                where.name = { [Op.like]: `%${data.name}%` };
                delete data.name;
            }
            if (data.platNumber) {
                where.platNumber = { [Op.like]: `%${data.platNumber}%` };
                delete data.platNumber;
            }
            if (data.VIN) {
                where.VIN = { [Op.like]: `%${data.VIN}%` };
                delete data.VIN;
            }
            if (data.equipment) {
                where.equipmentId = { [Op.like]: `%${data.equipment}%` };
                delete data.equipment;
            }
            if (data.licenses) {
                where.licenses = { [Op.like]: `%${data.licenses}%` };
                delete data.licenses;
            }
            if (data.licenses) {
                where.licenses = { [Op.like]: `%${data.licenses}%` };
                delete data.licenses;
            }
            if (data.inspaction) {
                where.inspaction = { [Op.like]: `%${data.inspaction}%` };
                delete data.inspaction;
            }
            if (data.yom) {
                where.yom = { [Op.like]: `%${data.yom}%` };
                delete data.yom;
            }
            if (data.brand) {
                where.brand = { [Op.like]: `%${data.brand}%` };
                delete data.brand;
            }
            if (data.model) {
                where.model = { [Op.like]: `%${data.model}%` };
                delete data.model;
            }
            if (data.exploitation) {
                where.exploitation = { [Op.like]: `%${data.exploitation}%` };
                delete data.exploitation;
            }
            if (data.depo) {
                where.depoId = { [Op.like]: `%${data.depo}%` };
                delete data.depo;
            }
        }
        return where;

    }

    static async notificationFilter(data) {
        let where = {};

        if (data) {
            if (data.id) {
                where.id = { [Op.like]: `%${data.id}%` };
                delete data.id;
            }
            if (data.name) {
                where.name = { [Op.like]: `%${data.name}%` };
                delete data.name;
            }
            if (data.seen) {
                where.seen = data.seen;
                delete data.seen
            }
            if (data.type) {
                where.type = data.type;
                delete data.type;
            }
            if (data.title) {
                where.title = { [Op.like]: `%${data.title}%` };
                delete data.title;
            }
            if (data.content) {
                where.content = { [Op.like]: `%${data.content}%` };
                delete data.content;
            }
        }
        return where;
    }

    static async productFilter(data) {
        let where = {};

        if (data) {
            if (data.id) {
                where.id = { [Op.like]: `%${data.id}%` };
                delete data.id;
            }
            if (data.name) {
                where.name = { [Op.like]: `%${data.name}%` };
                delete data.name;
            }
            if (data.brand) {
                where.brandName = { [Op.like]: `%${data.brand}%` };
                delete data.brand;
            }
            if (data.sku) {
                where.sku = { [Op.like]: `%${data.sku}%` };
                delete data.sku;
            }
            if (data.class) {
                where.class = { [Op.like]: `%${data.class}%` };
                delete data.class;
            }
            if (data.unit) {
                where.unit = { [Op.like]: `%${data.unit}%` };
                delete data.unit;
            }
            if (data.packSize) {
                where.packSize = { [Op.like]: `%${data.packSize}%` };
                delete data.packSize
            }
            if (data.weight) {
                where.weight = { [Op.like]: `%${data.weight}%` };
                delete data.weight
            }
            if (data.weight) {
                where.manufacturernumber = { [Op.like]: `%${data.manufacturer}%` };
                delete data.manufacturer
            }
            if (data.notes) {
                where.notes = { [Op.like]: `%${data.notes}%` };
                delete data.notes
            }
        }
        return where;
    }
    static async deposFilter(data) {
        let where = {};

        if (data) {
            if (data.id) {
                where.id = { [Op.like]: `%${data.id}%` };
                delete data.id;
            }
            if (data.name) {
                where.name = { [Op.like]: `%${data.name}%` };
                delete data.name;
            }
            if (data.streetaddress) {
                where.streetaddress = { [Op.like]: `%${data.streetaddress}%` };
                delete data.streetaddress;
            }
            if (data.city) {
                where.city = { [Op.like]: `%${data.city}%` };
                delete data.city;
            }
            if (data.state) {
                where.state = { [Op.like]: `%${data.state}%` };
                delete data.state;
            }
            if (data.zip) {
                where.zip = { [Op.like]: `%${data.zip}%` };
                delete data.zip;
            }
            if (data.country) {
                where.country = { [Op.like]: `%${data.country}%` };
                delete data.country
            }
        }
        return where;
    }
    static async orderFilters(data) {
        let delivery, where = {};
        let from, to;
        from = data.from;
        to = data.to;
        delete data.from;
        delete data.to;
        delete data.thisWeekFrom;
        delete data.thisWeekTo;
        let flowArr = [];
        if (data.flowTypes) {
            let flTypes = await this.splitToIntArray(data.flowTypes, ",");
            flTypes.length > 1
                ? flowArr.push({
                    [Op.or]: [
                        sequelize.where(sequelize.fn("JSON_EXTRACT", sequelize.col("flowTypes"), "$[0]"), [flTypes[0]]),
                        sequelize.where(sequelize.fn("JSON_EXTRACT", sequelize.col("flowTypes"), "$[0]"), [flTypes[1]])
                    ]
                })
                : flowArr.push({
                    [Op.or]: [
                        sequelize.where(sequelize.fn("JSON_EXTRACT", sequelize.col("flowTypes"), "$[0]"), [flTypes[0]]),
                        sequelize.where(sequelize.fn("JSON_EXTRACT", sequelize.col("flowTypes"), "$[1]"), [flTypes[0]]),
                    ]
                });
            delete data.flowTypes;
        }
        if (data.id) {
            where.id = {[Op.in]: data.id.split(',')  };
            delete data.id;
        }
        if (data.crossDock) {
            where.crossDock = +data.crossDock;
            delete data.crossDock;
        }
        if (data.country) {
            where.deliveryCountry =  { [Op.like]: `%${data.country}%` };
            where.pickupCountry = { [Op.like]: `%${data.country}%` };
            delete data.country;
        }
        if (data.dashboard) {
            delivery = data.dashboard;
            delete data.dashboard;
        } else {
            delivery = 0;
            delete data.dashboard;
        }
        if (from || (data.today && data.today != 0)) {
            if (delivery) {
                where.deliveryDateFrom = from;
            } else {
                where.pickupDateFrom = from;
            }
        }
        if (to || (data.today && data.today != 0)) {
            if (delivery) {
                where.deliveryDateTo = to;
            } else {
                where.pickupDateTo = to;
            }
        }
        if (data.customersIds) {
            let consIds = await this.splitToIntArray(data.customersIds, ",");
            where.consigneeid = {
                [Op.in]: consIds
            };
        }
        if (data.zoneIds) {
            let zoneIds, query, consignee, consignees = { rows: [] }, consigneeIds = [], zoneNull = 0;
            zoneIds = await this.splitToIntArray(data.zoneIds, ",");
            for (const [z, zoneId] of zoneIds.entries()) {
                if (zoneId == 0) {
                    zoneNull = 1;
                }
            }
            consignees = zoneNull ? await Consignee.findAndCountAll({
                where: {
                    czone_id: null
                }
            }) : consignees;
            consignee = await Consignee.findAndCountAll({
                attributes: ["id"],
                where: {
                    czone_id: {
                        [Op.in]: zoneIds
                    }
                }
            });
            consignees.rows = consignees.rows.concat(consignee.rows);
            consignees.rows.forEach(id => {
                if (where.consigneeid && where.consigneeid[Op.in].length) {
                    if (where.consigneeid[Op.in].includes(id.dataValues.id)) {
                        consigneeIds.push(id.dataValues.id);
                    }
                } else if (!where.consigneeid) {
                    consigneeIds.push(id.dataValues.id);
                }

            });
            query = {
                consigneeid: {
                    [Op.in]: consigneeIds
                }
            };

            where = {
                ...where,
                ...query
            };
            delete data.zoneIds;
        }
        if (data.rating && (data.rating == "A" || data.rating == "B" || data.rating == "C")) {
            let conIds = [], ratingWhere = {};
            let consignees = await Consignee.findAndCountAll({
                where: {
                    rating: data.rating
                }
            });
            for (const consignee of consignees.rows) {
                if (where.consigneeid && where.consigneeid[Op.in].length) {
                    if (where.consigneeid[Op.in].includes(consignee.id)) {
                        conIds.push(consignee.id);
                    }
                } else if (!where.consigneeid) {
                    conIds.push(consignee.id);
                }
            }
            ratingWhere = {
                consigneeid: {
                    [Op.in]: conIds
                }
            };
            where = {
                ...where,
                ...ratingWhere
            };
            delete data.rating;
        } else if (data.rating && (data.rating != "A" || data.rating != "B" || data.rating != "C")) {
            delete data.rating;
        } else {
            delete data.rating;
        }
        delete data.today;
        delete data.customersIds;
        if (data.specialNeeds) {
            let sid = data.specialNeeds;
            let orders = await this.getHandlingUnitBySpecialNeeds(sid).catch(err => { console.log(err); });
            let arr = [];
            for (const id of orders.rows) {
                arr.push(id.orders_id * 1);
            }
            where.id = {
                [Op.in]: arr
            };

            delete data.specialNeeds;
        }
        return {
            ...where,
            [Op.and]: flowArr
        };
    }
    static async sortAndPagination(req) {
        // console.log(req.query);
        const orderBy = req.query.orderBy;
        delete req.query.orderBy;

        const order = req.query.order ? req.query.order : "desc";
        delete req.query.order;

        const orderArr = [];
        if (orderBy) { orderArr.push([orderBy, order]); }

        const page = req.query.page ? parseInt(req.query.page) : 1;
        delete req.query.page;

        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        delete req.query.limit;

        const offset = (page - 1) * limit;

        return { order: orderArr, offset, limit };
    }
    static async sortAndPagination2(data) {
        // console.log(req.query);
        const orderBy = data.orderBy;
        delete data.orderBy;

        const order = data.order ? data.order : "desc";
        delete data.order;

        const orderArr = [];
        if (orderBy) { orderArr.push([orderBy, order]); }

        const page = data.page ? parseInt(data.page) : 1;
        delete data.page;

        const limit = data.limit ? parseInt(data.limit) : 10;
        delete data.limit;

        const offset = (page - 1) * limit;

        return { order: orderArr, offset, limit };
    }
    static async joinOrders(currentLoads, oids, OrderAttr) {
        // currentLoads.dataValues.pieceTotalQuantity = 0;
        currentLoads.dataValues.ordersDatas = [];
        let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
        let query = await this.createSelectQueryWithJoin5(tables, oids, OrderAttr), orders;
        orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
        if (orders) {
            if (currentLoads.dataValues.orders && currentLoads.dataValues.orders.length > 0) {
                oids = currentLoads.dataValues.orders.split(",");
                let quantity = 0;
                let proofList;
                const ordersDatas = [];
                orders.map(o => {
                      oids.map(async oid => {
                        if (+o.id === +oid) {
                            if (o.proof) {
                                // const fileManager = new FileManager();
                                // proofList = await fileManager.getById([+oid]);
                                o.proof = proofList;
                            } else {o.proof = [];}
                            ordersDatas.push(o);
                        }
                    });
                });
                currentLoads.dataValues.ordersDatas = ordersDatas;
                currentLoads.dataValues.pieceTotalQuantity = quantity;
            }
            return {
                loads: currentLoads,
            };
        } else {
            return {
                err: "Error",
                status: 0
            };
        }
    }
    static async getAddress(flowType, ret, orderIds, depoId) {
        try {
            let address = {};
            let oids = orderIds.join(",");
            let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
            let query = await Helper.createSelectQueryWithJoin5(tables, oids, OrderAttr);
            const orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
            const depo = await Depo.findOne({
                where: {
                    id: depoId
                }
            });
            address.startAddress = "";
            address.endAddress = "";
            if (flowType == 1) {
                let data = orders[0];
                for (const item in data) {
                    if (data[item] && (item == "pickupStreetAddress" || item == "pickupCity" || item == "pickupZip" || item == "pickupCountry")) {
                        address.startAddress += `${data[item]}, `;
                    }
                }
                address.endAddress = depo.address;
            } else if (flowType == 2 && ret == 0) {
                address.startAddress = depo.address;
                address.endAddress = depo.address;
            } else if (flowType == 2 && ret == 1) {
                let data = orders[orders.length - 1];
                address.endAddress = `${data.deliveryStreetAddress}, ${data.deliveryCity || ``}, ${data.deliveryZip || ``}, ${data.deliveryCountry}`;
                for (const item in data) {
                    if (data[item] && (item == "deliveryStreetAddress" || item == "deliveryCity" || item == "deliveryZip" || item == "deliveryCountry")) {
                        address.endAddress += `${data[item]}, `;
                    }
                }
                address.startAddress = depo.address;
            }
            return address;
        } catch (error) {
            return {
                error
            };
        }

    }
    static async joinLatLon(points) {
        points.slice(0, -1);
        const arr = [];
        const str = points.split(";");
        let strlast = str[str.length - 1];
        // let newStr = "";

        for (let i = 0; i < str.length; i++) {

            if (!arr.includes(str[i]) && str[i] !== "" || (arr.includes(str[i]) && str[i] != str[i - 1])) {
                arr.push(str[i]);
            }
        }
        // for (let i = 1; i < str.length; i++) {
        //     console.log(i);
        //     if (str[i] != str[i-1]) {
        //         newStr += `${str[i-1]};`;
        //     }
        // }
        if (arr[arr.length - 1] != strlast) {
            arr.push(strlast);
        }

        return arr.join(";");
    }
    static async getHandlingUnitBySpecialNeeds(sid) {
        const hu = Hunit.findAndCountAll({
            where: { specialneeds: sid * 1 },
        });
        return hu;
    }

    static async calcTotalDuration(data) {
        let { load, news, distDur, totalDuration, shift } = data;
        let waitingTime, startTime = new Date(load.startTime).getTime();
        waitingTime = await Checks.waitingTime({
            orders: news,
            distDur,
            flowType: load.flowType,
            startTime
        });

        for (const order of news) {
            totalDuration += order.servicetime;
            console.log("serviceTime", order.id, order.servicetime);

        }

        totalDuration += waitingTime;
        if (shift && totalDuration >= shift.break_time) {
            totalDuration += shift.rest;
        } else if (load.shiftId && totalDuration >= load.shift.break_time) {
            totalDuration += load.shift.rest;
        }

        return totalDuration;
    }

    // Algo 
    static async getSingleLoadSequence(req, load, job) {
        // console.log(load.dataValues.carTypes);
        load = load.dataValues;
        let orders = load.orders, noTimeWindow = req.body.noTimeWindow, { user } = req;
        let { timezone } = req.headers;
        // load = await LoadTemp.findOne({ where: { id: 1414 } });
        let uuid = load.UUID, cluster = 0;
        if (!uuid) { uuid = uuidv1(); }

        let depoId = load.depoId;
        let dep = await Depo.findOne({ where: { id: depoId } });
        let lat = dep.dataValues.lat;
        let lon = dep.dataValues.lon;
        let depo = { "lat": lat, "lon": lon };

        let equipment = [
            {
                "carCount": "1",
                "feet": load.carTypes[0].value,
                "weight": load.carTypes[0].maxweight,
                "cube": load.carTypes[0].maxVolume
            }
        ];

        let shiftId = load.shiftId;
        let shif = await Shift.findOne({ where: { id: shiftId } });
        let shift = {
            "shift": shif.dataValues.shift,
            "break_time": shif.dataValues.break_time,
            "max_shift": shif.dataValues.max_shift,
            "rest": shif.dataValues.rest,
            "recharge": shif.dataValues.recharge,
            "drivingtime": shif.dataValues.drivingtime
        };

        let date = moment.utc(load.startTime).format("YYYY-MM-DD");
        let loadStartTime = load.startTime;
        let maxStops = load.orders.split(",").length;
        let timeLimit = 60;
        let selectedOrders = load.orders.split(",");
        let flowType = load.flowType;
        let oVRP = load.return;

        let dryRun = false;
        let loadMinimize = true;
        let singleRouteCalc = true;

        let PostServer = this.getRemoteInfoForKey(req);
        let url = this.getRemoteInfoForKey(req).host + "/orders/byids/" + load.orders;
        let MapUrl = env.mapHost + env.mapPort + "/table/v1/driving/";
        url += `?noTimeWindow=${noTimeWindow}`;
        const firstSequence = job ? job.dataValues.defaultStructure ? job.dataValues.defaultStructure.filter(x => x.loadId === load.id)[0].orders : [] : [];
        let data = {
            "execid": uuid,
            "PostServer": `${PostServer.host}/loadtemps/sequence`,
            "ErrorServer": `${PostServer.host}/planning/engine/error`,
            "MapServer": MapUrl,
            "params": {
                "date": date,
                "loadStartTime": loadStartTime,
                "depoId": depoId,
                "flowType": flowType,
                "maxStops": maxStops,
                "timeLimit": timeLimit,
                "selectedOrders": selectedOrders,
                "PreliminaryResultLoad": firstSequence,
                "oVRP": oVRP,
                "shiftId": shiftId,
                "dryRun": dryRun,
                "loadMinimize": loadMinimize,
                "singleRouteCalc": singleRouteCalc,
                "seqMode": true,
                "noTimeWindow": noTimeWindow ? true : false
            },
            "depo": depo,
            "shift": shift,
            "equipment": equipment,
            "Returnees": JSON.stringify({
                loadId: load.id,
                user,
                timezone,
                orders: orders.split(","),
                startTime: loadStartTime,
                ret: load.return,
                depotId: dep.dataValues,
                shiftId: shif.dataValues,
                confirmed: load.confirmed
            }),
            "link": url
        };

        console.log(JSON.stringify(data));
        let eResp = await this.sendReqToEngine(data, cluster);
        console.log("Engine: ", eResp.data.Message);
        console.log("Engine Status: ", eResp.status);
        if (eResp.status != 200) {
            console.log(orders);
            return orders;
        } else {
            console.log(eResp.data);
            return eResp;
        }

    }

    static getRemoteInfo(req) {
        let host, endPoint;
        let api = "";
        let uri = api + "/autoplan", companyName;
        const myURL = req.headers.referer ? new URL(req.headers.referer) : req.headers["x-forwarded-host"];
        if (req.headers.host == "localhost:8080") {
            // endPoint =  "http://test.beta.lessplatform.com"+ uri;
            // host = "http://test.beta.lessplatform.com";
            endPoint = "http://localhost:8080" + uri;
            host = "http://localhost:8080";
            companyName = req.headers.host.split(".")[0];
        } else if (req.headers.type == "postman") {
            endPoint = `${myURL.origin}` + uri;
            host = `${myURL.origin}`;
            companyName = myURL.hostname.split(".")[0];
        } else if (req.headers.referer) {
            endPoint = `${myURL.origin}` + uri;
            host = `${myURL.origin}`;
            companyName = myURL.hostname.split(".")[0];
        } else {
            endPoint = `http://${myURL}` + uri;
            host = `http://${myURL}`;
            companyName = myURL.split(".")[0];
        }
        let info = {
            host,
            userName: req.user ? req.user.username : null,
            email: req.user ? req.user.email : null,
            userType: req.user ? req.user.type : null,
            userAgent: req.headers["user-agent"],
            endPoint,
            companyName
        };
        return info;
    }

    static getRemoteInfoForKey(req) {
        let host, endPoint;
        let api = "";
        let uri = api + "/autoplan", companyName;
        const myURL = req.headers["x-forwarded-host"];
        if (req.headers.host == "192.168.1.87:8080") {
            // endPoint =  "http://test.beta.lessplatform.com"+ uri;
            // host = "http://test.beta.lessplatform.com";
            endPoint = "http://192.168.1.87:8080" + uri;
            host = "http://192.168.1.87:8080";
        } else if (req.headers.host == "localhost:8080") {
            endPoint = "http://192.168.1.87:8080" + uri;
            host = "http://192.168.1.87:8080";
        } else {
            endPoint = `http://${myURL}` + uri;
            host = `http://${myURL}`;
        }
        let info = {
            host,
            userName: req.user ? req.user.username : null,
            email: req.user ? req.user.email : null,
            userType: req.user ? req.user.type : null,
            userAgent: req.headers["user-agent"],
            endPoint,
            companyName
        };
        return info;
    }

    static async sendReqToEngine(obj) {
        try {
            let url;
            let headers = {
                "x-ads-key": "28DF6A13265BA58C9B400819E7104943",
            };
            url = `${env.engineHost}:${env.enginrPort}/dispatch/seq/singular`;
            const res = await axios.post(url, obj, headers);
            return res;

        } catch (error) {
            console.error(error);
            return;
        }
    }


    // Custom For Customer

    static packSizeParserSingleForLegacy(PackSize) {

        let re = /\D+/g; // get only string character
        let size;
        let mesh;

        if (PackSize) {

            let match = PackSize.match(re);
            let npackname = PackSize.toLowerCase().replace(" ", ";").replace("/", ";").replace("x", ";");

            if (!match) { size = 0; }
            if (match) {

                mesh = match[match.length - 1].toLowerCase();

                let fpackname = npackname.replace(mesh.trim(), "");
                let parts = fpackname.split(";");

                if (parts[parts.length - 1] == "") { parts.pop(); }
                //-
                if (parts.length == 1) {
                    size = parseInt(parts[0]);
                }
                if (parts.length == 2) {
                    let c = parseInt(parts[0], 10);
                    let w = parseFloat(parts[1]);
                    size = c * w;
                }
                if (parts.length > 2) {
                    size = 0;
                }
                //-
            }
            let obj = { size: size, unit: mesh };
            return obj;

        } else {
            let obj = { size: 0, unit: "" };
            return obj;
        }
    }

    static packSizeParserForLegacy(data) { // test

        let re = /\D+/g;
        // let units = [ "lb", "oz", "ct",  "ml", "gl", "l", "lt", "can", "ea", "kg", "gm", "gr" ];
        let weight;
        let fweight;
        data.forEach(el => {

            let packname = el.PackSize;

            if (packname) {

                let match = packname.match(re);
                let npackname = packname.toLowerCase().replace(" ", ";").replace("/", ";").replace("x", ";");
                // console.log(npackname);
                if (!match) { weight = 0; }
                if (match) {

                    let mesh = match[match.length - 1].toLowerCase();
                    let fpackname = npackname.replace(mesh.trim(), "");
                    let parts = fpackname.split(";");

                    if (parts[parts.length - 1] == "") { parts.pop(); }
                    if (parts.length == 1) {
                        weight = parseInt(parts[0]);
                    }
                    if (parts.length == 2) {
                        let c = parseInt(parts[0], 10);
                        let w = parseFloat(parts[1]);
                        weight = c * w;
                    }
                    if (parts.length > 2) {
                        weight = 0;
                    }
                    // ----
                    if (el.Weight == 0) {
                        fweight = weight;
                    }
                    return fweight;

                }


            }

        });

    }

    static async addfieldsInOrdersDatas(data) {
        let { load } = data;
        let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees","files"];
        let query = this.createSelectQueryWithJoin5(tables, load.orders, OrderAttr);
        const orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
        if (load && load.orders.length > 0) {
            // let oids = load.dataValues.orders.split(",");
            let oids = await this.splitToIntArray(load.orders, ",");
            let quantity = 0;
            for (const o of orders) {
                // let { vendor, consignee } = await Helper.addfieldsInOrdersDatas({o})
                let vendor = {}, consignee = {}, proof = [];
                if (o.vendorid) {
                    vendor = await Vendors.findOne({ where: { id: o.vendorid } });
                }
                if (o.consigneeid) {
                    consignee = await Consignee.findOne({ where: { id: o.consigneeid } });
                }
                if (o.proof) {
                    const fileManager = new FileManager();
                    proof = await fileManager.getById(o.proof);
                    o.proof = proof;
                }
                oids.forEach(oid => {
                    if (o.id == oid) {
                        load.ordersDatas.push({ ...o, vendor, consignee });
                        quantity += o.pieceCount;
                    }
                });
            }
            load.pieceTotalQuantity = quantity;
            
        }

        return {
            status: 1,
            load
        };
    }

    static async checkLoadsByUUID(data) {
        let { table, loadTemps } = data;
        console.log(data);
        let rest;
        for (const loadTemp of loadTemps) {
            if (loadTemp.UUID) {
                rest = await this.getAll({
                    table,
                    key: "UUID",
                    value: loadTemp.UUID
                });
                if (!rest.count) {
                    await Job.destroy({
                        where: {
                            UUID: loadTemp.UUID
                        }
                    });
                }
            } else {
                console.log(`${loadTemp.id} LoadTemp don"t have UUID`);
            }

        }
        return { status: 1 };
    }

    static async changed(data) {
        try {
            let { table, user, type, loadId, object } = data, one, changed;
            one = await table.findOne({ where: { id: loadId } });
            changed = one && one.dataValues.changed && Array.isArray(one.dataValues.changed) ? one.dataValues.changed : [];
            changed.push({
                change: true,
                user: {
                    id: user.id,
                    username: user.username
                },
                changeTime: new Date(Date.now()),
                type
            });
            let rest = await table.update({
                ...object,
                changed
            }, {
                where: {
                    id: loadId
                }
            });
            return rest;
        } catch (error) {
            console.log(error);
        }


    }

    static async checkHoursCon(datas) {
        let error = true, address = false, msg = "ok";
        for (const data of datas) {
            if (data.address.zip && data.address.city && data.address.streetAddress && data.address.state) {
                address = true;
            }
            if (data.Monday.workingHours.to || data.Monday.workingHours.from || data.Monday.deliveryHours.to || data.Monday.deliveryHours.from) {
                error = false;
            }
            if (data.Tuesday.workingHours.to || data.Tuesday.workingHours.from || data.Tuesday.deliveryHours.to || data.Tuesday.deliveryHours.from) {
                error = false;
            }
            if (data.Wednesday.workingHours.to || data.Wednesday.workingHours.from || data.Wednesday.deliveryHours.to || data.Wednesday.deliveryHours.from) {
                error = false;
            }
            if (data.Thursday.workingHours.to || data.Thursday.workingHours.from || data.Thursday.deliveryHours.to || data.Thursday.deliveryHours.from) {
                error = false;
            }
            if (data.Friday.workingHours.to || data.Friday.workingHours.from || data.Friday.deliveryHours.to || data.Friday.deliveryHours.from) {
                error = false;
            }
            if (data.Saturday.workingHours.to || data.Saturday.workingHours.from || data.Saturday.deliveryHours.to || data.Saturday.deliveryHours.from) {
                error = false;
            }
            if (data.Sunday.workingHours.to || data.Sunday.workingHours.from || data.Sunday.deliveryHours.to || data.Sunday.deliveryHours.from) {
                error = false;
            }
        }

        if (!error) {
            msg = "Error";
        }
        return {
            error,
            address,
            msg
        };
    }
    static async checkHoursVen(datas) {
        let error = true, address = false, msg = "ok";
        for (const data of datas) {
            if (data.address.zip && data.address.city && data.address.streetAddress && data.address.state) {
                address = true;
            }
            if (data.Monday.workingHours.to || data.Monday.workingHours.from || data.Monday.pickupHours.to || data.Monday.pickupHours.from) {
                error = false;
            }
            if (data.Tuesday.workingHours.to || data.Tuesday.workingHours.from || data.Tuesday.pickupHours.to || data.Tuesday.pickupHours.from) {
                error = false;
            }
            if (data.Wednesday.workingHours.to || data.Wednesday.workingHours.from || data.Wednesday.pickupHours.to || data.Wednesday.pickupHours.from) {
                error = false;
            }
            if (data.Thursday.workingHours.to || data.Thursday.workingHours.from || data.Thursday.pickupHours.to || data.Thursday.pickupHours.from) {
                error = false;
            }
            if (data.Friday.workingHours.to || data.Friday.workingHours.from || data.Friday.pickupHours.to || data.Friday.pickupHours.from) {
                error = false;
            }
            if (data.Saturday.workingHours.to || data.Saturday.workingHours.from || data.Saturday.pickupHours.to || data.Saturday.pickupHours.from) {
                error = false;
            }
            if (data.Sunday.workingHours.to || data.Sunday.workingHours.from || data.Sunday.pickupHours.to || data.Sunday.pickupHours.from) {
                error = false;
            }
        }

        if (!error) {
            msg = "Error";
        }
        return {
            error,
            address,
            msg
        };
    }

    static async findLatLon(points) {
        let lat, lon;
        let errors = [], pointArr = [];
        for (const [p, point] of points.entries()) {
            if (point.address.zip && point.address.city && point.address.streetAddress && point.address.state) {
                let address = `${point.address.zip}+${point.address.city}+${point.address.streetAddress}+${point.address.state}`;
                const { data } = await Osmap.GeoLoc(address);
                if (data.status == "ZERO_RESULTS") {
                    lat = null;
                    lon = null;
                    errors.push({
                        index: p,
                        msg: "The mentioned address is not correct."
                    });
                } else if (data.status == "REQUEST_DENIED") {
                    lat = null;
                    lon = null;
                    errors.push({
                        index: p,
                        msg: data.error_message
                    });
                } else {
                    lat = data.results[0].geometry.location.lat;
                    lon = data.results[0].geometry.location.lng;
                }
            } else {
                errors.push({
                    index: p,
                    msg: "The mentioned address is not correct."
                });
            }
            point.address.lat = lat;
            point.address.lon = lon;
            pointArr.push(point);

        }

        return { lat, lon, errors, pointArr };
    }

    static getOrderImagePath(directory, fileName, refHost) {
        const dir = `./resources/0/${directory}`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let paths, fullHost;
        if (refHost == "http://localhost:4200") {
            fullHost = "http://localhost:8080";
        } else {
            fullHost = refHost;
        }
        paths = {
            urls: {
                Path: `${fullHost}/${directory}/${fileName}`
            },
            filePath: `${dir}/${fileName}`
        };
        console.log("dir", dir);
        console.log("path", `${fullHost}/${directory}/${fileName}`);

        return paths;
    }
    static async orderLatLon(datas) {
        try {
            let { pickupAddr, deliveryAddr } = datas;
            let delCity, delCountry, delCountryCode, pickCity, pickCountry, pickCountryCode;
            let pickupLatLon = pickupAddr ? await Osmap.GeoLoc(pickupAddr) : null;
            let deliveryLatLon = deliveryAddr ? await Osmap.GeoLoc(deliveryAddr) : null;
            if (deliveryLatLon && deliveryLatLon.data.status == "OK") {
                for (const item of deliveryLatLon.data.results[0].address_components) {
                    if (item.types.includes("locality")) {
                        delCity = item.long_name;
                    }
                    if (item.types.includes("country")) {
                        delCountry = item.long_name;
                        delCountryCode = item.short_name;
                    }
                }
            }
            if (pickupLatLon && pickupLatLon.data.status == "OK") {
                for (const item of pickupLatLon.data.results[0].address_components) {
                    if (item.types.includes("locality")) {
                        pickCity = item.long_name;
                    }
                    if (item.types.includes("country")) {
                        pickCountry = item.long_name;
                        pickCountryCode = item.short_name;
                    }
                }
            }

            return {
                pickupLatLon: pickupLatLon,
                pickupAddress: {
                    pickCity,
                    pickCountry,
                    pickCountryCode
                },
                deliveryLatLon: deliveryLatLon,
                deliveryAddress: {
                    delCity,
                    delCountry,
                    delCountryCode
                }
            };

        } catch (error) {
            return {
                status: 0,
                msg: error.message
            };
        }
    }

    static async checkOrdersByLoadFlowType(data) {
        try {
            let { orderIds, flowType } = data;
            let flowTypes, orders, status = 1, msg = "ok";
            let orderIdsArr = await this.splitToIntArray(orderIds, ",");
            flowTypes = await FlowType.findAndCountAll({
                where: { status: 1 }
            });
            orders = await Order.findAndCountAll({
                where: {
                    id: { [Op.in]: orderIdsArr }
                }
            });
            for (const order of orders.rows) {
                if (order.flowTypes && order.flowTypes.length) {
                    if (order.flowTypes.includes(flowType)) {
                        status = 0;
                        msg = "You cannot confirm the loadTemp as its orders are already in the confirmed Load with the same flow type.";
                        break;
                    }
                    if (flowType == 3) {
                        status = 0;
                        msg = "You cannot confirm the loadTemp.";
                        break;
                    }
                    if (order.flowTypes.includes(3) && flowType) {
                        status = 0;
                        msg = "You cannot confirm the loadTemp as E2E FlowType.";
                        break;
                    }
                }

            }
            return {
                status,
                msg
            };
        } catch (error) {
            return {
                status: 0,
                msg: error.Message
            };
        }
    }

    static async unplannedOrders(data, load = null) {
        try {
            let { loadArr } = data;
            let orderArr, OIds, flowTypeArr, info;
            for (const item of loadArr) {
                OIds = await Helper.splitToIntArray(item.orderIds, ",");
                let isPlanOrders = await Order.findAndCountAll({
                    where: { id: { [Op.in]: OIds } }
                });
                for (const order of isPlanOrders.rows) {
                    let obj = {};
                    orderArr = load ? order.loadIds : order.loadTempIds;
                    info = order.timeInfo;
                    flowTypeArr = order.flowTypes;
                    let index = orderArr.indexOf(item.id);
                    if (index > -1) {
                        orderArr.splice(index, 1);
                    }
                    if (load) {
                        delete info.loads[item.id];
                        let loadIndex = [];
                        for (const loadItem of info.loadsArr) {
                            if (loadItem.id != item.id) {
                                loadIndex.push(loadItem);
                            }
                        }
                        info.loadsArr = loadIndex;
                        let flowIndex = flowTypeArr.indexOf(item.flowType);
                        if (flowIndex > -1) {
                            flowTypeArr.splice(flowIndex, 1);
                        }

                        obj = {
                            loadIds: orderArr,
                            flowTypes: flowTypeArr,
                            timeInfo: info,
                            status: 0,
                            confirmed: 0,
                            // isPlanned: 0
                        };
                    } else {
                        delete info.loadTemps[item.id];
                        obj = {
                            loadTempIds: orderArr,
                            timeInfo: info,
                            isPlanned: 0
                        };
                    }
                    await Order.update(obj, { where: { id: order.id } });
                }

            }
            return {
                status: 1,
                msg: "ok"
            };
        } catch (error) {
            return {
                status: 0,
                msg: error.Message
            };
        }

    }

    static async confirmOrder(data) {
        try {
            let { newLoad } = data;
            const orderIds = await Helper.splitToIntArray(newLoad.orders, ",");
            let isPlanOrders = await Order.findAndCountAll({
                where: { id: { [Op.in]: orderIds } }
            });
            let orderArr, flowTypes;
            for (const order of isPlanOrders.rows) {
                orderArr = order.loadIds;
                flowTypes = order.flowTypes;
                orderArr.push(newLoad.id);
                flowTypes.push(newLoad.flowType);


                let isPlanned = 0;
                if (flowTypes.includes(3) || flowTypes.includes(1) || flowTypes.includes(2)) {
                    isPlanned = 1;
                }

                await Order.update({
                    loadIds: orderArr,
                    flowTypes,
                    confirmed: 1,
                    isPlanned
                }, { where: { id: order.id } });
            }
            return {
                status: 1
            };
        } catch (error) {
            return {
                status: 0,
                error
            };
        }
    }

    static async groupConcatOrderIds(data) {
        try {
            let newArr;
            newArr = data.reduce((acc, cur) => {
                const accLastArr = acc[acc.length - 1] || [];
                if (accLastArr[accLastArr.length - 1] === cur[0]) {
                    acc[acc.length - 1] = accLastArr.concat(cur.slice(1));
                } else {
                    acc.push(cur);
                }
                return acc;
            }, []);
            return {
                status: 1,
                newArr,
                msg: "Ok"
            };
        } catch (error) {
            return {
                status: 0,
                newArr: [],
                msg: "catch Error reduce"
            };
        }
    }

    static async errorMsg(text) {
        return {
            status: 0,
            msg: text
        };
    }

    static async getWeekDay(date) {
        try {
            let sday;
            let weekDate = moment(date)._i;
            const thedate = new Date(weekDate);
            let day = thedate.getDay();
            if (day == 1) { sday = "monday"; }
            if (day == 2) { sday = "tuesday"; }
            if (day == 3) { sday = "wednesday"; }
            if (day == 4) { sday = "thursday"; }
            if (day == 5) { sday = "friday"; }
            if (day == 6) { sday = "saturday"; }
            if (day == 0) { sday = "sunday"; }
            return sday;
        } catch (error) {
            return {
                status: 0,
                msg: error.message
            };
        }
    }

    static async checkArTime(data) {
        try {
            let { eta, order, flowType } = data;
            const lateETA = await Statuses.findOne({ where: { id: 3 } });
            const overTime = await Statuses.findOne({ where: { id: 14 } });
            const departTime = await Statuses.findOne({ where: { id: 16 } });
            let arrTime = null, waiting = 0, warnings = [];
            if (flowType == 2) {
                if (new Date(order.deliverydateFrom).getTime() >= eta && new Date(order.deliverydateTo).getTime() >= eta + (order.servicetime * 1000)) {
                    arrTime = new Date(order.deliverydateFrom).getTime();
                    waiting = (new Date(order.deliverydateFrom).getTime() - eta);
                } else if (new Date(order.deliverydateFrom).getTime() <= eta && new Date(order.deliverydateTo).getTime() >= eta + (order.servicetime * 1000)) {
                    arrTime = eta;
                } else if (new Date(order.deliverydateTo).getTime() < eta) {
                    arrTime = eta;
                    warnings.push({ orderId: order.id, status: lateETA });
                } else if (new Date(order.deliverydateTo).getTime() + 60000 < eta + (order.servicetime * 1000)) {
                    arrTime = eta;
                    warnings.push({ orderId: order.id, status: departTime });
                } else {
                    arrTime = eta;
                }
            } else if (flowType == 1) {
                if (new Date(order.pickupdateFrom).getTime() >= eta && new Date(order.pickupdateTo).getTime() >= eta + (order.servicetime * 1000)) {
                    arrTime = new Date(order.pickupdateFrom).getTime();
                    waiting = (new Date(order.pickupdateFrom).getTime() - eta);
                } else if (new Date(order.pickupdateFrom).getTime() <= eta && new Date(order.pickupdateTo).getTime() >= eta + (order.servicetime * 1000)) {
                    arrTime = eta;
                } else if (new Date(order.pickupdateTo).getTime() < eta) {
                    arrTime = eta;
                    warnings.push({ orderId: order.id, status: lateETA });
                } else if (new Date(order.pickupdateTo).getTime() + 60000 < eta + (order.servicetime * 1000)) {
                    arrTime = eta;
                    warnings.push({ orderId: order.id, status: departTime });
                } else {
                    arrTime = eta;
                }
            }
            return {
                status: 1,
                arrTime,
                waiting,
                warnings
            };
        } catch (error) {
            return {
                status: 0
            };
        }
    }

    static async addDriver(data) {
        try {
            let drivers, addedDrivers = [], assignDriver, addedLoads = [], sday, startMill, timeFEta, driverStart, warnings = [];
            for (const item of data) {
                assignDriver = await this.assignDriver({
                    item,
                    addedDrivers
                });
                addedDrivers = addedDrivers.concat(assignDriver.addedDrivers);
            }
            return {
                status: 1,
                addedDrivers
            };
        } catch (error) {
            return await Helper.errorMsg("error add Driver");
        }
    }
    static async assignDriver(data) {
        let { item, addedDrivers } = data;
        let driverWhere = item.depoId ? {
            status: 1,
            depotId: item.depoId
        } : { status: 1 }, sday;
        let startMill, timeFEta, driverStart, warnings = [];
        let drivers = await Driver.findAndCountAll({
            where: {
                ...driverWhere
            }, include: includeTrue
        });
        if (!item.driverId) {
            let lt = item.startTime, fEta = item.stopLocations[0].type.data.timeInfo.loadTemps[item.id].eta, drFrom;
            sday = await this.getWeekDay(lt);
            let st = moment.utc(item.startTime).format("YYYY-MM-DDTHH:mm:ss.SSS");
            let date = st.split("T")[0];
            let drTime;
            startMill = await this.convertMilisecond(`${st}Z`);
            timeFEta = await this.convertMilisecond(fEta);
            for (const driver of drivers.rows) {
                if (!item.driverId && !addedDrivers.includes(driver.id) && driver.assetId && driver.scheduleid && driver.schedule && driver.schedule[sday] && driver.schedule[sday].from && driver.shiftId && driver.shift) {
                    drTime = driver.schedule[sday].from.split("T");
                    drFrom = `${date}T${drTime[1]}`;
                    driverStart = await this.convertMilisecond(drFrom);
                    let driverFrom = driverStart, driverTo = (driverStart + (driver.shift.dataValues.shift * 1000));
                    if (driverFrom <= startMill && driverTo >= (startMill + (item.totalDuration * 1000))) {
                        console.log("loadId", item.id);
                        console.log("sDay", sday);
                        // console.log("driverFrom", new Date(driverFrom), driverFrom);
                        // console.log("driverTo", new Date(driverTo), driverTo);
                        // console.log("startMill1", new Date(startMill), startMill);
                        // console.log("startMill2", new Date(startMill + (item.totalDuration*1000)), startMill + (item.totalDuration*1000));
                        let capCalc, warningData;
                        warningData = item.warningData ? item.warningData : {};
                        capCalc = this.capacityCalc({ driver, load: item });
                        let loadTemps = await LoadTemp.findOne({ where: { id: item.id } });
                        let ld = new ClassLoad({
                            data: {
                                ...loadTemps.dataValues,
                                driverId: driver.id,
                                assetsId: driver.assetId,
                                equipmentId: driver.companyEquipment.equipmentId,
                                warning: !capCalc ? 1 : 0,
                                warningData: {
                                    ...loadTemps.dataValues.warningData,
                                    ...warningData
                                },
                                id: item.id
                            }, temp: 1
                        });
                        await ld.edit();
                        if (!capCalc) {
                            warnings.push({
                                loadId: item.id,
                                msg: "capacity Warning"
                            });
                        }
                        addedDrivers.push(driver.id);
                        // addedLoads.push(item.id);
                        break;
                    }
                }
            }
        }
        return { addedDrivers, warnings };
    }
    static async convertMilisecond(data) {
        try {
            let date = data;
            let timeArr = date.split("T");
            // let millisecond = (Number(timeArr[1].split(":")[0])*60*60*1000)+(Number(timeArr[1].split(":")[1])*60*1000)+(Number(timeArr[1].split(":")[2].split(".")[0])*1000)+(Number(timeArr[1].split(".")[1].slice(0, -1)*1));
            let millisecond = new Date(date).getTime();
            return millisecond;
        } catch (error) {
            return await Helper.errorMsg("Error convert");
        }
    }

    static async capacityCalc(data) {
        try {
            let { driver, load } = data, success = false;
            let volume = driver.assetId && driver.companyEquipment && driver.companyEquipment.equipmentId && driver.companyEquipment.equipment
                ? driver.companyEquipment.equipment.maxVolume : 0;
            let cube = load.cube;
            if (volume >= cube) {
                success = true;
            }
            return success;
        } catch (error) {
            return await Helper.errorMsg("error in capacity Calc");
        }
    }

    static async updateLoadEndTime(loadId) {
        const load = await Load.findOne({
            where: { id: loadId }
        });

        if (!!load) {
            const startTime = new Date(load.startTime);
            const endTime = startTime.getTime() + (load.totalDuration * 1000);
            await load.update({
                ...load,
                endTime: new Date(endTime)
            }, {
                where: {
                    id: load.id
                }
            });
        }
    }
    static async checkingDriverExistsWorkTimes(driverId, load) {
        const { startTime, totalDuration, id } = load;
        let result = { message: "Invalid Date, the Driver is busy in this date.", status: 0, isValid: false }

        const driver = await Driver.findOne({
            where: { id: driverId }
        });

        if (!driver) { result.message = "Driver not found"; return result; }

        const loads = await Load.findAll({
            where: { driverId: driver.id }
        });

        // if (!loads.length) { result.message = "Loads not found"; return result; }

        const currentOrderStartTime = new Date(startTime);
        const currentOrderEndTime = currentOrderStartTime.getTime() + (totalDuration * 1000);
        const arr = [];
        const currentOrder = {
            start: currentOrderStartTime.getTime(),
            end: currentOrderEndTime,
            id,
            totalDuration
        };
        arr.push(currentOrder);
        await Promise.all(loads.map(async item => {
            const start = new Date(item.start).getTime();
            const end = new Date(item.end).getTime();

            arr.push({
                start,
                end,
                id: item.id,
                totalDuration: item.totalDuration
            });

        }));

        arr.sort((x, y) => x.start - y.start);

        const index = arr.findIndex(x => x.id === currentOrder.id);

        if ((index - 1) >= 0 && ((index + 1) >= (arr.length - 1))) {
            if ((arr[index - 1].end > currentOrder.start) && (arr[index + 1].start < currentOrder.end)) result.isValid = true; result.status = 0;
        }

        if (index === 0) {
            if (arr[index + 1].start < currentOrder.end) result.isValid = true; result.status = 0;
        }

        if (index === arr.length - 1) {
            if (arr[index - 1].end > currentOrder.start) result.isValid = true; result.status = 0;
        }

        return result;
    }
    static async createUserDriver(obj, url) {
        try {
            let pass = "demopass", user, msg, existUser;
            existUser = await User.findOne({ where: { email: obj.data.email } });
            if (existUser) {
                await User.update({
                    password: bcrypt.hashSync(pass, 8)
                }, {
                    where: {
                        email: obj.data.email
                    }
                });
                user = await User.findOne({
                    where: {
                        email: obj.data.email
                    }
                });
            } else {
                user = await User.create({
                    name: obj.data.fname,
                    email: obj.data.email,
                    password: bcrypt.hashSync(pass, 8)
                });
            }


            let clientUser, newUser, userData;
            clientUser = await Clients.findOne({ Email: obj.user.email });
            if (!clientUser) {
                newUser = await clientController.create({
                    ...obj.user,
                });
            }
            if (!existUser) {
                await Clients.findOneAndUpdate({
                    Email: obj.user.email
                }, {
                    $push: { Users: { Type: "driver", user: user.dataValues } }
                }, { new: true });
            }

            if ((clientUser || newUser) && !existUser) {
                userData = user.dataValues;
                await UserTypes.create({
                    userId: userData.id,
                    types: "driver"
                });
                await UserRole.create({
                    roleId: 1,
                    userId: userData.id
                });
            }

            const permissionGroups = await permissionGroup.findOne({ where: { name: 'driver' } });
            if (permissionGroups) {
                await User.update({
                    permissionId: permissionGroups.dataValues.id,
                    roleName: 'driver'
                }, { where: { id: user.id } })
                await Driver.update({
                    mobileActive: 1
                }, {
                    where: { id: obj.id }   
                })
            };

            let subject = "Less Platform driver registration";
            let text = `
                Welcome aboard, ${obj.data.fname}!\r\n
                First tap on the link below and install our apps from Google Play and App Store.\r\n
                Android: http://bit.ly/LessPlatformDriverApp \r\n
                IOS: https://apps.apple.com/us/app/less-platform-driver-app/id1575331805 \r\n  
                \r\n
            Then login using your credentials:\r\n
            Company name:  ${url.split('.')[0].replace('http://', '')}
            Email: ${obj.data.email}\r\n
            Password: ${pass}\r\n
            \r\n
            \r\n
            Please, make sure to keep it safe and don"t share it with anyone.\r\n
            If you didn"t try to sign up, don"t worry. You can safely ignore this email.`;
            await Mailer.sendMail(user.email, subject, text);
            msg = "A message is sent to the driver\"s email that contains his password.";
            let driver = await Driver.findOne({ where: { id: obj.id } });
            let cl = new DriverClass({
                data: {
                    id: obj.id,
                    ...driver.dataValues,
                    mobileActive: 1
                }
            });
            await cl.edit();
            return {
                status: 1,
                msg,
            };
        } catch (error) {
            return await this.errorMsg(error.message);
        }
    }
    // STOP
    static async calcTotalDuration2(data) {
        let { load, news, distDur, shift } = data;
        let waitingTime = 0, startTime = new Date(load.startTime).getTime(), tDur = 0, fullDur = 0;
        let { legs } = distDur;

        let sameOrders = await Checks.checkSameLocOrders({
            orders: news,
            flowType: load.flowType
        });
        let i = 0, bool = false;
        let rech = 0, waitTime = 0;
        let { brTime, shiftVal, rest, recharge, status } = await this.checkShift({ shift, load });
        if (!status) {
            console.log("error in check Shift");
        }
        if (!distDur || !distDur.legs) {
            console.log("error");
        }
        for (const [l, leg] of distDur.legs.entries()) {

            if (sameOrders.newOrders[l]) {
                tDur += leg.duration;
                if ((tDur >= brTime && (tDur - fullDur) >= brTime)) {
                    if (i == 0) {
                        tDur += rest;
                    }

                    if ((tDur - fullDur) < shiftVal && distDur.legs[l + 1] && ((tDur - fullDur) + (distDur.legs[l + 1].duration) > shiftVal)) {
                        fullDur += ((tDur - fullDur) + recharge);
                        tDur = 0;
                    } else if ((tDur - fullDur) > shiftVal && distDur.legs[l + 1]) {
                        fullDur += ((tDur - fullDur) + recharge);
                        tDur = 0;
                    }
                    if ((tDur - fullDur) > shiftVal && !distDur.legs[l + 1]) {
                        fullDur += ((tDur - fullDur) + recharge);
                        tDur = 0;
                    }
                    // if (tDur - fullDur > shiftVal) {
                    //     bool = false;
                    // }
                    // if ((i > 0 && (tDur - fullDur) < shiftVal && distDur.legs[l+1] && (tDur + distDur.legs[l+1].duration) > shiftVal)) {
                    //     fullDur += ((tDur - fullDur) + recharge);
                    //     tDur = 0;
                    //     rech += recharge;
                    //     bool = true;
                    // } else if (i == 0 && (tDur - fullDur) > shiftVal) {
                    //     tDur += (rest * Math.floor(tDur / shiftVal));
                    //     tDur += (recharge * Math.floor(tDur / shiftVal));
                    //     fullDur += (tDur - fullDur);
                    //     tDur = 0;
                    // } else if (i == 0 && (tDur - fullDur) >= shiftVal) {
                    //     tDur += rest;
                    //     tDur += recharge;
                    //     fullDur += (tDur - fullDur);
                    //     tDur = 0;
                    // }else if ((tDur - fullDur) < shiftVal && ((tDur - fullDur) + waitingTime) > shiftVal) {
                    //     waitTime = shiftVal - tDur;
                    //     rech = recharge;

                    //     tDur += rest;
                    //     if (waitTime > rest) {
                    //         tDur += (waitTime - rest);
                    //     }


                    //     tDur += recharge;
                    //     fullDur += (tDur - fullDur);
                    //     tDur = 0;
                    // }
                    i++;
                }
                if (tDur == 0) {
                    tDur = fullDur;
                    i = 0;
                }
                // tDur += waitingTime;
                // waitTime = waitingTime;

                // startTime += ((tDur) * 1000);
                waitingTime = await Checks.waitingTime2({
                    newOrders: sameOrders.newOrders[l],
                    flowType: load.flowType,
                    startTime,
                    tDur,
                    shiftVal
                });
                tDur += (waitingTime / 1000);
                tDur += sameOrders.newOrders[l].servicetime;
            } else {
                tDur += leg.duration;
            }
        }
        // fullDur = tDur;
        console.log(tDur);
        return {
            totalDuration: tDur,
            recharge: rech
        };
    }

    static async checkShift(data) {
        try {
            let { shift, load } = data;
            let brTime, shiftVal, rest, recharge, shiftName;
            if (shift) {
                rest = shift.rest; brTime = shift.break_time; shiftVal = shift.shift; recharge = shift.recharge, shiftName = shift.shiftName;
            } else if (load.shiftId) {
                rest = load.shift.rest; brTime = load.shift.break_time; shiftVal = load.shift.shift; recharge = load.shift.recharge, shiftName = load.shift.shiftName;
            }
            return { brTime, shiftVal, rest, recharge, status: 1, shiftName };
        } catch (error) {
            console.log("checkShift", error.message);
            return await this.errorMsg("checkShift catch error");
        }
    }
    static async getMilisecond(text) {
        let miliSeconds = moment(text, "DD/MM/YYYY HH:mm A").format("x");
        return miliSeconds;
    }
    static async fixLatLonByFlowType(points, flowtype) {
        let arr = points;
        for (const [i, item] of arr.entries()) {
            arr[i].deliveryLon = flowtype == 2 ? item.findPoint.longitude : 0;
            arr[i].deliveryLat = flowtype == 2 ? item.findPoint.latitude : 0;
            arr[i].pickupLon = flowtype == 1 ? item.findPoint.longitude : 0;
            arr[i].pickupLat = flowtype == 1 ? item.findPoint.latitude : 0;
        }
        return arr;
    }

    static async checkConfirmedOrdersByConsignee(data) {
        let { id } = data, orders, ordersArr = [], confOrdersArr = [];
        orders = await Order.findAndCountAll({
            where: {
                consigneeid: id
            }
        });
        for (const order of orders.rows) {
            if (!order.loadIds || (order.loadIds && !order.loadIds.length)) {
                ordersArr.push(order);
            } else if (order.loadIds && order.loadIds.length) {
                confOrdersArr.push(order);
            }
        }
        return { ordersArr, confOrdersArr };
    }

    static async updateOrdersConsigneeAddreses(data, bool = null) {
        try {
            let { orders, before, after } = data, orderIds = [];
            for (const order of orders) {
                if (!bool && order.deliveryStreetAddress == before.streetAddress && order.deliveryZip == before.zip) {
                    await Order.update({
                        deliveryCity: after.address.city,
                        deliveryCountry: after.address.country,
                        deliveryCountryCode: after.address.countryCode,
                        deliveryState: after.address.state,
                        deliveryStreetAddress: after.address.streetAddress,
                        deliveryZip: after.address.zip
                    }, { where: { id: order.id } });
                    orderIds.push(order.id);
                } else if (bool && order.deliveryStreetAddress == before.streetAddress && order.deliveryZip == before.zip) {
                    await Order.update({
                        consigneeid: null
                    }, { where: { id: order.id } });
                    orderIds.push(order.id);
                }
            }
            return {
                status: 1,
                orderIds
            };
        } catch (error) {
            console.log("Error: ", error.message);
            return await this.errorMsg(`updateOrdersConsigneeAddreses: ${error.message}`);
        }
    }

    static async updateOrdersAddress(data) {
        try {
            let { points, id, user } = data, consignee, befPoints, largePoints, orders, index = [], orderIds = [];
            orders = await this.checkConfirmedOrdersByConsignee({ id });
            consignee = await Consignee.findOne({ where: { id } });
            befPoints = consignee.dataValues.points;
            if (befPoints.length > points.length) {
                largePoints = befPoints;
            } else {
                largePoints = points;
            }
            for (const [p, point] of largePoints.entries()) {
                if (points[p] && points[p].address.index !== "") {
                    let i = points[p].address.index;
                    index.push(i);
                    if (befPoints[i].address.zip != points[p].address.zip || befPoints[i].address.streetAddress != points[p].address.streetAddress) {
                        let consAddr = await this.updateOrdersConsigneeAddreses({
                            user,
                            orders: orders.ordersArr,
                            before: {
                                streetAddress: befPoints[i].address.streetAddress,
                                zip: befPoints[i].address.zip
                            },
                            after: {
                                address: points[p].address
                            }
                        });
                        await this.updateOrdersConsigneeAddreses({
                            user,
                            orders: orders.confOrdersArr,
                            before: {
                                streetAddress: befPoints[i].address.streetAddress,
                                zip: befPoints[i].address.zip
                            },
                            after: {
                                address: points[p].address
                            }
                        }, true);
                        orderIds = orderIds.concat(consAddr.orderIds);
                    }
                }
            }
            return {
                status: 1,
                orderIds
            };

        } catch (error) {
            console.log("Error: ", error.message);
            return await this.errorMsg(`updateOrdersAddress: ${error.message}`);
        }
    }

    static async pushPoints(data) {
        try {
            let points = [];
            let { LatLons, order, timeWindow } = data;
            let window = {};
            if (timeWindow) {
                window = {
                    ...timeWindow
                };
            } else {
                window = {
                    Friday: {
                        deliveryHours: {
                            from: order.deliverydateFrom,
                            to: order.deliverydateTo
                        }
                    },
                    Monday: {
                        deliveryHours: {
                            from: order.deliverydateFrom,
                            to: order.deliverydateTo
                        }
                    },
                    Sunday: {
                        deliveryHours: {
                            from: order.deliverydateFrom,
                            to: order.deliverydateTo
                        }
                    },
                    Tuesday: {
                        deliveryHours: {
                            from: order.deliverydateFrom,
                            to: order.deliverydateTo
                        }
                    },
                    Saturday: {
                        deliveryHours: {
                            from: order.deliverydateFrom,
                            to: order.deliverydateTo
                        }
                    },
                    Thursday: {
                        deliveryHours: {
                            from: order.deliverydateFrom,
                            to: order.deliverydateTo
                        }
                    },
                    Wednesday: {
                        deliveryHours: {
                            from: order.deliverydateFrom,
                            to: order.deliverydateTo
                        }
                    }
                };
            }
            await points.push({
                ...window,
                address: {
                    lat: LatLons.deliveryLatLon.data.status == "OK" ? LatLons.deliveryLatLon.data.results[0].geometry.location.lat : 0,
                    lon: LatLons.deliveryLatLon.data.status == "OK" ? LatLons.deliveryLatLon.data.results[0].geometry.location.lng : 0,
                    zip: order.deliveryZip,
                    city: order.deliveryCity ? order.deliveryCity : LatLons.deliveryAddress.delCity ? LatLons.deliveryAddress.delCity : null,
                    state: order.deliveryState,
                    country: order.deliveryCountry ? order.deliveryCountry : LatLons.deliveryAddress.delCountry,
                    countryCode: order.deliveryCountryCode ? order.deliveryCountryCode : LatLons.deliveryAddress.delCountryCode,
                    streetAddress: order.deliveryStreetAddress
                },
            });
            return points;
        } catch (error) {
            return this.errorMsg(error.message);
        }
    }

    static async makeTimeWindows(data) {
        let { order, timezone } = data;
        let FridayDeliveryHours = order.FridayDeliveryHours ? order.FridayDeliveryHours.split("-") : "";
        let FridayWorkingHours = order.FridayWorkingHours ? order.FridayWorkingHours.split("-") : "";
        let MondayDeliveryHours = order.MondayDeliveryHours ? order.MondayDeliveryHours.split("-") : "";
        let MondayWorkingHours = order.MondayWorkingHours ? order.MondayWorkingHours.split("-") : "";
        let SaturdayDeliveryHours = order.SaturdayDeliveryHours ? order.SaturdayDeliveryHours.split("-") : "";
        let SaturdayWorkingHours = order.SaturdayWorkingHours ? order.SaturdayWorkingHours.split("-") : "";
        let SundayDeliveryHours = order.SundayDeliveryHours ? order.SundayDeliveryHours.split("-") : "";
        let SundayWorkingHours = order.SundayWorkingHours ? order.SundayWorkingHours.split("-") : "";
        let ThursdayDeliveryHours = order.ThursdayDeliveryHours ? order.ThursdayDeliveryHours.split("-") : "";
        let ThursdayWorkingHours = order.ThursdayWorkingHours ? order.ThursdayWorkingHours.split("-") : "";
        let TuesdayDeliveryHours = order.TuesdayDeliveryHours ? order.TuesdayDeliveryHours.split("-") : "";
        let TuesdayWorkingHours = order.TuesdayWorkingHours ? order.TuesdayWorkingHours.split("-") : "";
        let WednesdayDeliveryHours = order.WednesdayDeliveryHours ? order.WednesdayDeliveryHours.split("-") : "";
        let WednesdayWorkingHours = order.WednesdayWorkingHours ? order.WednesdayWorkingHours.split("-") : "";
        return {
            FridayDelivery: {
                from: FridayDeliveryHours && FridayDeliveryHours[0] ? moment(FridayDeliveryHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: FridayDeliveryHours && FridayDeliveryHours[1] ? moment(FridayDeliveryHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            MondayDelivery: {
                from: MondayDeliveryHours && MondayDeliveryHours[0] ? moment(MondayDeliveryHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: MondayDeliveryHours && MondayDeliveryHours[1] ? moment(MondayDeliveryHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            SaturdayDelivery: {
                from: SaturdayDeliveryHours && SaturdayDeliveryHours[0] ? moment(SaturdayDeliveryHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: SaturdayDeliveryHours && SaturdayDeliveryHours[1] ? moment(SaturdayDeliveryHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            SundayDelivery: {
                from: SundayDeliveryHours && SundayDeliveryHours[0] ? moment(SundayDeliveryHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: SundayDeliveryHours && SundayDeliveryHours[1] ? moment(SundayDeliveryHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            ThursdayDelivery: {
                from: ThursdayDeliveryHours && ThursdayDeliveryHours[0] ? moment(ThursdayDeliveryHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: ThursdayDeliveryHours && ThursdayDeliveryHours[1] ? moment(ThursdayDeliveryHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            TuesdayDelivery: {
                from: TuesdayDeliveryHours && TuesdayDeliveryHours[0] ? moment(TuesdayDeliveryHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: TuesdayDeliveryHours && TuesdayDeliveryHours[1] ? moment(TuesdayDeliveryHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            WednesdayDelivery: {
                from: WednesdayDeliveryHours && WednesdayDeliveryHours[0] ? moment(WednesdayDeliveryHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: WednesdayDeliveryHours && WednesdayDeliveryHours[1] ? moment(WednesdayDeliveryHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            FridayWorking: {
                from: FridayWorkingHours && FridayWorkingHours[0] ? moment(FridayWorkingHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: FridayWorkingHours && FridayWorkingHours[1] ? moment(FridayWorkingHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            MondayWorking: {
                from: MondayWorkingHours && MondayWorkingHours[0] ? moment(MondayWorkingHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: MondayWorkingHours && MondayWorkingHours[1] ? moment(MondayWorkingHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            SaturdayWorking: {
                from: SaturdayWorkingHours && SaturdayWorkingHours[0] ? moment(SaturdayWorkingHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: SaturdayWorkingHours && SaturdayWorkingHours[1] ? moment(SaturdayWorkingHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            SundayWorking: {
                from: SundayWorkingHours && SundayWorkingHours[0] ? moment(SundayWorkingHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: SundayWorkingHours && SundayWorkingHours[1] ? moment(SundayWorkingHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            ThursdayWorking: {
                from: ThursdayWorkingHours && ThursdayWorkingHours[0] ? moment(ThursdayWorkingHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: ThursdayWorkingHours && ThursdayWorkingHours[1] ? moment(ThursdayWorkingHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            TuesdayWorking: {
                from: TuesdayWorkingHours && TuesdayWorkingHours[0] ? moment(TuesdayWorkingHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: TuesdayWorkingHours && TuesdayWorkingHours[1] ? moment(TuesdayWorkingHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
            WednesdayWorking: {
                from: WednesdayWorkingHours && WednesdayWorkingHours[0] ? moment(WednesdayWorkingHours[0], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
                to: WednesdayWorkingHours && WednesdayWorkingHours[1] ? moment(WednesdayWorkingHours[1], "HH:mm:ss").subtract(timezone, "hours").format("YYYY-MM-DDTHH:mm:ss.SSS") : "",
            },
        };
    }
    static async pushPointsScript(data) {
        try {
            let points = [], orderObj;
            let { order, timezone } = data;
            orderObj = await this.makeTimeWindows({
                order,
                timezone
            });
            await points.push({
                Friday: {
                    workingHours: {
                        from: orderObj.FridayWorking.from ? orderObj.FridayWorking.from + "Z" : "",
                        to: orderObj.FridayWorking.to ? orderObj.FridayWorking.to + "Z" : ""
                    },
                    deliveryHours: {
                        from: orderObj.FridayDelivery.from ? orderObj.FridayDelivery.from + "Z" : "",
                        to: orderObj.FridayDelivery.to ? orderObj.FridayDelivery.to + "Z" : ""
                    }
                },
                Monday: {
                    workingHours: {
                        from: orderObj.MondayWorking.from ? orderObj.MondayWorking.from + "Z" : "",
                        to: orderObj.MondayWorking.to ? orderObj.MondayWorking.to + "Z" : ""
                    },
                    deliveryHours: {
                        from: orderObj.MondayDelivery.from ? orderObj.MondayDelivery.from + "Z" : "",
                        to: orderObj.MondayDelivery.to ? orderObj.MondayDelivery.to + "Z" : ""
                    }
                },
                Sunday: {
                    workingHours: {
                        from: orderObj.SundayWorking.from ? orderObj.SundayWorking.from + "Z" : "",
                        to: orderObj.SundayWorking.to ? orderObj.SundayWorking.to + "Z" : ""
                    },
                    deliveryHours: {
                        from: orderObj.SundayDelivery.from ? orderObj.SundayDelivery.from + "Z" : "",
                        to: orderObj.SundayDelivery.to ? orderObj.SundayDelivery.to + "Z" : ""
                    }
                },
                Tuesday: {
                    workingHours: {
                        from: orderObj.TuesdayWorking.from ? orderObj.TuesdayWorking.from + "Z" : "",
                        to: orderObj.TuesdayWorking.to ? orderObj.TuesdayWorking.to + "Z" : ""
                    },
                    deliveryHours: {
                        from: orderObj.TuesdayDelivery.from ? orderObj.TuesdayDelivery.from + "Z" : "",
                        to: orderObj.TuesdayDelivery.to ? orderObj.TuesdayDelivery.to + "Z" : ""
                    }
                },
                Saturday: {
                    workingHours: {
                        from: orderObj.SaturdayWorking.from ? orderObj.SaturdayWorking.from + "Z" : "",
                        to: orderObj.SaturdayWorking.to ? orderObj.SaturdayWorking.to + "Z" : ""
                    },
                    deliveryHours: {
                        from: orderObj.SaturdayDelivery.from ? orderObj.SaturdayDelivery.from + "Z" : "",
                        to: orderObj.SaturdayDelivery.to ? orderObj.SaturdayDelivery.to + "Z" : ""
                    }
                },
                Thursday: {
                    workingHours: {
                        from: orderObj.ThursdayWorking.from ? orderObj.ThursdayWorking.from + "Z" : "",
                        to: orderObj.ThursdayWorking.to ? orderObj.ThursdayWorking.to + "Z" : ""
                    },
                    deliveryHours: {
                        from: orderObj.ThursdayDelivery.from ? orderObj.ThursdayDelivery.from + "Z" : "",
                        to: orderObj.ThursdayDelivery.to ? orderObj.ThursdayDelivery.to + "Z" : ""
                    }
                },
                Wednesday: {
                    workingHours: {
                        from: orderObj.WednesdayWorking.from ? orderObj.WednesdayWorking.from + "Z" : "",
                        to: orderObj.WednesdayWorking.to ? orderObj.WednesdayWorking.to + "Z" : ""
                    },
                    deliveryHours: {
                        from: orderObj.WednesdayDelivery.from ? orderObj.WednesdayDelivery.from + "Z" : "",
                        to: orderObj.WednesdayDelivery.to ? orderObj.WednesdayDelivery.to + "Z" : ""
                    }
                }
            });
            return points;
        } catch (error) {
            return this.errorMsg(error.message);
        }
    }

    static async checkErrors() {
        let obj = arguments["0"], status = 1;
        for (const i in obj) {
            if (!i || (Array.isArray(i) && !i.length)) {
                status = 0;
            }
        }
        return status;
    }

    static async exportArr(data) {
        let { loads, orderIds, info } = data;
        let rNumber = "", order, arr = [], errorArr = [], loadsArr = [];
        for (const load of loads.rows) {
            let bool = 0;
            orderIds = await Helper.splitToIntArray(load.orders, ",");
            // if (load.assetsId && load.companyEquipment) {
            //     rNumber = load.companyEquipment.name ? load.companyEquipment.name : "";
            //     bool = 1;
            // } else 
            if (load.driverId && load.driver && load.driver.routeNumber) {
                rNumber = load.driver.routeNumber;
                bool = 1;
            } else if (load.driverId && load.driver && !load.driver.routeNumber) {
                errorArr.push({
                    id: load.id,
                    msg: `${load.id} Load Driver havn"t routeNumber`
                });
            } else {
                errorArr.push({
                    id: load.id,
                    msg: `${load.id} Load haven"t Driver`
                });
            }
            if (bool == 1) {
                loadsArr.push({
                    id: load.id,
                    msg: `Success`
                });
                for (const [o, orderId] of orderIds.entries()) {
                    order = await Order.findOne({ attributes: ["id", "po"], where: { id: orderId } });
                    arr.push({
                        "Invoice Number": order.dataValues.po.trim(),
                        "Route Number": rNumber.trim(),
                        "Order Index": `${o + 1}`.length == 1 ? `00${o + 1}` : `${o + 1}`.length == 2 ? `0${o + 1}` : 0
                    });
                }
            }

        }
        // fs.writeFileSync("./app/files/text.csv", arr, "utf8");

        const csvWriter = await createCsvWriter({
            path: "./text1.csv",
            header: [
                { id: "Invoice Number", title: "Invoice Number" },
                { id: "Route Number", title: "Route" },
                { id: "Order Index", title: "Stop" },
            ]
        });
        await csvWriter.writeRecords(arr)       // returns a promise
            .then(() => {
                console.log("...Done");
            });
        let filePath = fs.createReadStream("./text1.csv");
        const c = new ftp();
        if (info.host == "http://legacy.beta.lessplatform.com") {
            c.on("ready", function () {
                c.put(filePath, "LessFreight/" + moment(new Date()).format("YYYYMMDDTHHmmss") + ".csv", function (err) {
                    if (err) throw err;
                    c.end();
                });
            });
            c.connect(config);
        }
        return { arr, errorArr, loadsArr };
    }

    static async getDrivers(data) {
        let { loadStartTime } = data, drivers, arrDrivers = [];
        drivers = await Driver.findAndCountAll({
            where: { status: 1 },
            include: includeFalse
        });
        let weekDay = await this.getWeekDay(loadStartTime);
        let startDay = loadStartTime.split("T")[0];
        for (const driver of drivers.rows) {
            let schedule = driver.dataValues.schedule.dataValues[weekDay];
            if (schedule && schedule.from) {
                let driverTime = schedule.from.split("T")[1];
                arrDrivers.push({
                    Id: driver.dataValues.id,
                    startTime: `${startDay}T${driverTime}`
                });
            }
        }
        return arrDrivers;

    }

    static async sendEmailsToDrivers(loadId, driverId) {
        const load = await Load.findOne({
            where: { id: loadId }
        });

        let oldDriver = null, newDriver = null;
        const drivers = await Driver.findAll({ where: { id: { [Op.in]: [load.driverId, driverId] } } });
        await Promise.all(drivers.map(async item => {
            if (item.id === load.driverId) oldDriver = item;
            else newDriver = item;
        }));
        if (!!load.driverId && (load.driverId !== driverId) && oldDriver) {
            Mailer.sendMail(oldDriver.email, "Confirmation", `You are unassigned from ${loadId} ID load.`); // old driver
            Mailer.sendMail(newDriver.email, "Confirmation", `${loadId} ID load is assigned to you.`); // new driver
        }
        if (!load.driverId) {
            Mailer.sendMail(newDriver.email, "Confirmation", `${loadId} ID load is assigned to you.`); // new driver
        }
    }

    static async reverseObject(data) {
        let obj = {};
        for (const key in data) {
            obj[data[key]] = key;
        }
        return obj;
    }

    static async ordersByType(data) {
        let { type, orderIds, depo } = data;
        let pickupObj = {}, deliveryObj = {};
        let orders = await Order.findAndCountAll({
            where: {
                id: { [Op.in]: orderIds },
                orderType: {
                    [Op.or]: [
                        { [Op.ne]: type },
                        { [Op.eq]: null },
                    ]

                }
            }
        });
        for (const order of orders.rows) {
            pickupObj = {
                pickupdateFrom: order.dataValues.deliverydateFrom,
                pickupdateTo: order.dataValues.deliverydateTo,
                pickupCompanyName: order.dataValues.deliveryCompanyName,
                pickupStreetAddress: order.dataValues.deliveryStreetAddress,
                pickupCity: order.dataValues.deliveryCity,
                pickupState: order.dataValues.deliveryState,
                pickupZip: order.dataValues.deliveryZip,
                pickupLat: order.dataValues.deliveryLat,
                pickupLon: order.dataValues.deliveryLon,
                pickupCountry: order.dataValues.deliveryCountry,
                pickupCountryCode: order.dataValues.deliveryCountryCode,
                pickupAccessorials: order.dataValues.deliveryAccessorials,
            };
            deliveryObj = {
                deliverydateFrom: order.dataValues.pickupdateFrom,
                deliverydateTo: order.dataValues.pickupdateTo,
                deliveryCompanyName: order.dataValues.pickupCompanyName,
                deliveryStreetAddress: order.dataValues.pickupStreetAddress,
                deliveryCity: order.dataValues.pickupCity,
                deliveryState: order.dataValues.pickupState,
                deliveryZip: order.dataValues.pickupZip,
                deliveryLat: order.dataValues.pickupLat,
                deliveryLon: order.dataValues.pickupLon,
                deliveryCountry: order.dataValues.pickupCountry,
                deliveryCountryCode: order.dataValues.pickupCountryCode,
                deliveryAccessorials: order.dataValues.pickupAccessorials,
            };
        }

    }

    static async addWarningInStops(data) {
        let { warnings, alllegs, i, warningsArr } = data;
        let warning = 0, thisLeg = alllegs[i];
        if (warnings.length) {
            for (const elem of warnings) {
                if (thisLeg["type"].orders.includes(elem.orderId)) {
                    warning = 1;
                    thisLeg["type"].warningStatus = elem.status.dataValues;
                    warningsArr[thisLeg["type"].data.id] = elem.status.dataValues.name;
                    break;
                } else {
                    thisLeg["type"].warningStatus = null;
                }
            }
        } else {
            thisLeg["type"].warningStatus = null;
        }
        return {
            alllegs: thisLeg,
            warning
        };
    }

}; // End of Class

