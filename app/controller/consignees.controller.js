const db = require('../config/db.config.js');
const Helper = require('../classes/helpers');
const Osmap = require('./osmap.controller');
const Errors = require('../errors/consigneeErrors');
const orderController = require('./orderscontroller');
const Search = require('../lib/search');
const Excel = require('exceljs');
const moment = require('moment');
const Op = db.Sequelize.Op;
const Consignees = db.consignee;
const Order = db.order;

const includeFalse = [{ all: true, nested: false }];

exports.get = async (req, res) => {

    let id = req.params.id;
    
    Consignees.findOne({
        where: {id:id},
        include: includeFalse
    }).then(consignees => {
        res.status(200).send({
            status: 1,
            msg: "ok", 
            data: consignees
        });
    }).catch(err => {
        res.status(500).send({
            status: 0,
            msg: err,
            data:req.params
        });        
    });

};

exports.getAll = async (req, res) => {
    let sortAndPagination = await Helper.sortAndPagination(req);
    let where = req.query, { text, fields } = req.query, search, obj = {}, attr;
    delete where.text;
    delete where.fields;
    search = text ? await Search.searchConsignee(text, fields) : {};
    const data = await Helper.filters(where, Op, 'consignee');
    if (fields) {
        attr = fields.split(',');
        obj = {
            attributes: attr,
            where: {
                ...search,
                ...data.where
            },
            ...sortAndPagination
        };
    } else {
        obj = {
            where: {
                ...search,
                ...data.where
            },
            ...sortAndPagination,
            include: includeFalse,
            distinct: true,
        };
    }
    Consignees.findAndCountAll(obj)
    .then( consignees => {
        res.status(200).send({
            status: 1,
            msg: "ok",
            data: {
                consignees: consignees.rows,
                total: consignees.count
            }
        });
    }).catch(err => {
        res.status(500).send({
            status: 0,
            msg: "Can not access Consignees table",
            err: err
        });
    });
        
};

exports.delete = async (req, res) => {
   
    let ids = req.body.ids; 
    if (!ids || ids.length == 0 ) {
        res.status(500).send({
            status: 0,
            msg: 'no ids for delete'
        });
        return;
    }
    
    Consignees.destroy({
        where: {
            id: {
                [Op.in]: ids
            }
        }
    }).then(count => {
        res.status(200).send({
            status: 1,
            msg: 'deleted',
            "Count": count,
            
        });
    }).catch(err => {
        res.status(500).send({ 
            status: 0,
            msg: "fail on Consignee table",
            "error": err
        });
    });
    
};

exports.create = async (req, res) => {
    let obj = {
		...req.body,
		id: 1
	};
    const errors = await Errors.createAndEditError(obj);
    if (!errors.status) {
        res.status(409).send({
            status: errors.status,
            msg: errors.msg
        });
	} else {
        let { points } = errors;
        let driverId = req.body.driverId ? req.body.driverId : 0;
        if(isNaN(driverId) ){driverId=0;}

        let stime =  req.body.serviceTime ? req.body.serviceTime*60 :0 ;
        if(isNaN(stime) ){stime=0;}
        await Consignees.create({
            name: req.body.name, 
            companyLegalName: req.body.companyLegalName, 
            email: req.body.email,
            address: req.body.address ? req.body.address : "",
            address2: req.body.address2 ? req.body.address2 : "",
            phone1: req.body.phone1,
            phone2: req.body.phone2,
            contactPerson: req.body.contactPerson ? req.body.contactPerson : "",
            points: points,
            rating: req.body.rating,
            notes: req.body.notes ? req.body.notes : "",
            serviceTime: stime,
            proofSettings: req.body.proofSettings,
            driverId: driverId,
            mustbefirst: req.body.mustbefirst
        }).then( iresp => {
            res.status(200).send({
                status: 1,
                msg: "OK",
                data: iresp
            });
        }).catch(err => {
            res.status(409).send({
                status: 0,
                msg: err.original.sqlMessage,
                "Error": err
            });
        });
    }
};

exports.createInTimeOrderCreate = async (data) => {
    try {
        let consignee;
        let { name, companyLegalName, serviceTime, points, proofSettings } = data;
        consignee =  await Consignees.create({
            name: name,
            companyLegalName: companyLegalName,
            points: points,
            serviceTime: serviceTime ? serviceTime : 0,
            driverId: 0,
            proofSettings: proofSettings
        }).catch(err => {
            console.log(err);
        });
        return {
            status: 1,
            data: consignee
        };
    } catch (error) {
        return {
            status: 0,
            msg: error.message,
        };
    }
};

exports.updateInTimeOrderCreate = async (data) => {
    let { points, id } = data, newConsignee;
    const consignee = await Consignees.findOne({
        where: { id:id }
    });
    let existPoints = consignee.dataValues.points, newPoints;
    for (const point of existPoints) {
        if (point.address.streetAddress !== points[0].address.streetAddress) {
            newPoints = existPoints.concat(points);
        }
    }
    await Consignees.update({
        points: newPoints ? newPoints : existPoints,
    },{
        where: { id: id }
    }).catch(err => {
        console.log(err);
    });
    newConsignee = await Consignees.findOne({
        where: { id:id }
    });
    return {
        status: 1,
        data: newConsignee
    };
};

exports.edit = async (req, res) => {
    let obj = {
        ...req.body,
        ...req.params
    };
    let { timezone } = req.headers;
    const errors = await Errors.createAndEditError(obj);
    if (!errors.status) {
        res.status(409).send({
            status: errors.status,
            msg: errors.msg
        });
	} else {
        let updOrders;
        if (req.body.updateOrders) {
            updOrders = await Helper.updateOrdersAddress({
                id: req.params.id,
                points: req.body.points,
                user: req.user
            });
            if (updOrders.orderIds.length > 0) {
                await orderController.unplanOrder({
                    orderIds: updOrders.orderIds,
                    user: req.user,
                    timezone
                });
            }
        }
        if (req.body.updateMustbefirst) {
            let orders;
            orders = await Order.findAndCountAll({
                where: {
                    consigneeid: req.params.id,
                    isPlanned: 0
                }
            });
            if (orders && orders.rows && orders.rows.length > 0) {
                await Order.update({
                    mustbefirst: req.body.mustbefirst
                }, {
                    where: {
                        consigneeid: req.params.id,
                        isPlanned: 0
                    }
                });
            }
        }
        let { points } = errors;
        let driverId = req.body.driverId ? req.body.driverId : 0;
        if(isNaN(driverId) ){driverId=0;}

        let stime =  req.body.serviceTime ? req.body.serviceTime*60 :0 ;
        if(isNaN(stime) ){stime=0;}
        Consignees.update({
            name: req.body.name, 
            companyLegalName: req.body.companyLegalName, 
            email: req.body.email,
            address: req.body.address ? req.body.address : "",
            address2: req.body.address2 ? req.body.address2 : "",
            phone1: req.body.phone1,
            phone2: req.body.phone2,
            contactPerson: req.body.contactPerson,
            points: points,
            rating: req.body.rating,
            notes: req.body.notes,
            serviceTime: stime,
            proofSettings: req.body.proofSettings,
            driverId: driverId,
            mustbefirst: req.body.mustbefirst

        }, {
            where: { id: req.params.id }
        }).then( uresp => {
                res.status(200).send({
                    status: 1,
                    msg: "OK",
                    "updated": uresp
                });
        }).catch(err => {
            res.status(409).send({
                status: 0,
                msg: err.message,
                "Error": err
            });
        });
    }
};

exports.editDriver = async (req, res) => {
    try {
        let { driverId, consigneeIds } = req.body;
        let consignee;
        consignee = await Consignees.update({
            driverId: driverId
        }, {
            where: {
                id: {
                    [Op.in]: consigneeIds
                }
            }
        });
        res.json({
            status: 1,
            msg: "ok",
            consignee
        });
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: "Error"
        });
    }
};

exports.editZones = async (req, res) => {
    let { zoneId, consigneeIds } = req.body, consignee;
    let checkError = Helper.checkErrors({zoneId, consigneeIds});
    if (!checkError) {
        return res.status(409).json({
            status: 0,
            msg: "Invalid data"
        });
    }
    consignee = await Consignees.update({
        czone_id: zoneId
    }, {
        where: {
            id: {
                [Op.in]: consigneeIds
            }
        }
    });
    res.json({
        status: 1,
        data: consignee
    });
};

exports.editDepos = async (req, res) => {
    let { depoId, consigneeIds } = req.body, consignee;
    let checkError = Helper.checkErrors({depoId, consigneeIds});
    if (!checkError) {
        return res.status(409).json({
            status: 0,
            msg: "Invalid data"
        });
    }
    consignee = await Consignees.update({
        depo_id: depoId
    }, {
        where: {
            id: {
                [Op.in]: consigneeIds
            }
        }
    });
    res.json({
        status: 1,
        data: consignee
    });
};

exports.script = async (req, res) => {
    const consignees = await Consignees.findAll({
        where: {
            id: {
                [Op.in]: [223, 1893, 2186]
            }
        }
    });
    let lat, lon, i = 0, consigneIds = [];
    for (const consignee of consignees) {
        let points = [];
        for (const point of consignee.points) {
            let address = `${point.address.zip}+${point.address.city}+${point.address.streetAddress}+${point.address.state}`;
            const LatLon = !point.address.lat && !point.address.lon ? await Osmap.GeoLoc(address) : null;
            if (LatLon && LatLon.data.status != "OK") {
                consigneIds.push(consignee.id);
            }
            lat = LatLon ? LatLon.data.status == "OK" ? LatLon.data.results[0].geometry.location.lat : 0 : point.address.lat;
            lon = LatLon ? LatLon.data.status == "OK" ? LatLon.data.results[0].geometry.location.lng : 0 : point.address.lon;
            point.address.lat = lat;
            point.address.lon = lon;
            points.push(point);
        }
        await Consignees.update({
            points
        },{
            where: {
                id: consignee.id
            }
        });
        console.log(i);
        i++;
    }
    console.log(consigneIds);
    res.json({
        msg: "ok",
        status: 1
    });
};

exports.readFile = async (req, res) => {
    console.log(req.body, req.files, req.body.path+'/'+req.files.file.name);
    let workbook = new Excel.Workbook();
    
    let str = req.files.file.data;
    let path = `${req.body.path}/${req.files.file.name}`, arr = [], data = {}, finalArr = [];
    await workbook.xlsx.readFile(path).then(function() {
        let workSheet =  workbook.getWorksheet('Sheet1');
        workSheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
            data = {};
            if (rowNumber == 1) {
                arr.push(row.values);
                arr[0].shift();
            } else {
                for (const [i, item] of arr[0].entries()) {
                    data[item] = row.values[i+1];
                }
                finalArr.push(data);
            }
        });
        console.log(finalArr);
    });
    let i = 0;
    for (const item of finalArr) {
        console.log(item.name, i);
        i++;
        let consignee, obj = {}, window, points = [], addObj = {}, timezone = '-5';
        consignee = await Consignees.findOne({ where: {id: item.id}});
        let address = consignee.dataValues.points[0].address;
        if (address.city == item.city && address.zip == item.zip && address.state == item.state && address.country == item.country
            && address.countryCode == item.countryCode && address.streetAddress == item.streetAddress) {
            addObj = address;
        } else {
            let address = `${item.zip}+${item.city}+${item.streetAddress}+${item.state}`;
            const LatLon = await Osmap.GeoLoc(address);
            addObj = {
                lat: LatLon.data.status == "OK" ? LatLon.data.results[0].geometry.location.lat : 0,
                lon: LatLon.data.status == "OK" ? LatLon.data.results[0].geometry.location.lon : 0,
                city: item.city,
                zip: item.zip,
                state: item.state,
                country: item.country,
                countryCode: item.countryCode,
                streetAddress: item.streetAddress
            };
        }
        window = await Helper.pushPointsScript({order: item, timezone});
        points.push({
            ...window[0],
            address: addObj
        });
        obj = {
            name: item.name ? item.name : consignee.dataValues.name,
            companyLegalName: item.companyLegalName ? item.companyLegalName : consignee.dataValues.companyLegalName,
            contactPerson: item.contactPerson ? item.contactPerson : consignee.dataValues.contactPerson,
            email: item.email ? item.email : consignee.dataValues.email,
            phone1: item.phone1 ? item.phone1 : consignee.dataValues.phone1,
            phone2: item.phone2 ? item.phone2 : consignee.dataValues.phone2,
            points,
            rating: item.rating && item.rating.result ? item.rating.result : consignee.dataValues.rating,
            serviceTime: 0,
            driverId: item.driverId ? item.driverId : consignee.dataValues.driverId,
            czone_id: item.czone_id ? item.czone_id : consignee.dataValues.czone_id,
            depo_id: item.depo_id ? item.depo_id : consignee.dataValues.depo_id,
            mustbefirst: item.mustbefirst ? item.mustbefirst : consignee.dataValues.mustbefirst
        };
        await Consignees.update(obj, {
            where: {
                id: item.id
            }
        });
    }
    
    res.json({
        msg: "hello",
        data: finalArr
    });
};

exports.scriptUpdatePoints = async (req, res) => {
    let consignees;
    consignees = await Consignees.findAndCountAll({
        where: {
            id: {
            
                [Op.lte]: 2780
            }
        }
    });
    let i = 0;
    for (const item of consignees.rows) {
        console.log(i, item.id);
        i++;
        let arr = [];
        if (item.points) {
            for (const point of item.points) {
                let obj = {
                    "Friday":{
                       "workingHours":{
                          "to":"",
                          "from":""
                       },
                       "deliveryHours":{
                          "to":"",
                          "from":""
                       }
                    },
                    "Monday":{
                       "workingHours":{
                          "to":"",
                          "from":""
                       },
                       "deliveryHours":{
                          "to":"",
                          "from":""
                       }
                    },
                    "Sunday":{
                       "workingHours":{
                          "to":"",
                          "from":""
                       },
                       "deliveryHours":{
                          "to":"",
                          "from":""
                       }
                    },
                    "Tuesday":{
                       "workingHours":{
                          "to":"",
                          "from":""
                       },
                       "deliveryHours":{
                          "to":"",
                          "from":""
                       }
                    },
                    "address":{

                    },
                    "Saturday":{
                       "workingHours":{
                          "to":"",
                          "from":""
                       },
                       "deliveryHours":{
                          "to":"",
                          "from":""
                       }
                    },
                    "Thursday":{
                       "workingHours":{
                          "to":"",
                          "from":""
                       },
                       "deliveryHours":{
                          "to":"",
                          "from":""
                       }
                    },
                    "Wednesday":{
                       "workingHours":{
                          "to":"",
                          "from":""
                       },
                       "deliveryHours":{
                          "to":"",
                          "from":""
                       }
                    }
                }
                obj.Friday.workingHours.to = point.Friday && point.Friday.workingHours && point.Friday.workingHours.to ? moment.utc(point.Friday.workingHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Friday.workingHours.from = point.Friday && point.Friday.workingHours && point.Friday.workingHours.from ? moment.utc(point.Friday.workingHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Friday.deliveryHours.to = point.Friday && point.Friday.deliveryHours && point.Friday.deliveryHours.to ? moment.utc(point.Friday.deliveryHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Friday.deliveryHours.from = point.Friday && point.Friday.deliveryHours && point.Friday.deliveryHours.from ? moment.utc(point.Friday.deliveryHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Monday.workingHours.to = point.Monday && point.Monday.workingHours && point.Monday.workingHours.to ? moment.utc(point.Monday.workingHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Monday.workingHours.from = point.Monday && point.Monday.workingHours && point.Monday.workingHours.from ? moment.utc(point.Monday.workingHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Monday.deliveryHours.to = point.Monday && point.Monday.deliveryHours && point.Monday.deliveryHours.to ? moment.utc(point.Monday.deliveryHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Monday.deliveryHours.from = point.Monday && point.Monday.deliveryHours && point.Monday.deliveryHours.from ? moment.utc(point.Monday.deliveryHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Sunday.workingHours.to = point.Sunday && point.Sunday.workingHours && point.Sunday.workingHours.to ? moment.utc(point.Sunday.workingHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Sunday.workingHours.from = point.Sunday && point.Sunday.workingHours && point.Sunday.workingHours.from ? moment.utc(point.Sunday.workingHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Sunday.deliveryHours.to = point.Sunday && point.Sunday.deliveryHours && point.Sunday.deliveryHours.to ? moment.utc(point.Sunday.deliveryHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Sunday.deliveryHours.from = point.Sunday && point.Sunday.deliveryHours && point.Sunday.deliveryHours.from ? moment.utc(point.Sunday.deliveryHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Tuesday.workingHours.to = point.Tuesday && point.Tuesday.workingHours && point.Tuesday.workingHours.to ? moment.utc(point.Tuesday.workingHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Tuesday.workingHours.from = point.Tuesday && point.Tuesday.workingHours && point.Tuesday.workingHours.from ? moment.utc(point.Tuesday.workingHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Tuesday.deliveryHours.to = point.Tuesday && point.Tuesday.deliveryHours && point.Tuesday.deliveryHours.to ? moment.utc(point.Tuesday.deliveryHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Tuesday.deliveryHours.from = point.Tuesday && point.Tuesday.deliveryHours && point.Tuesday.deliveryHours.from ? moment.utc(point.Tuesday.deliveryHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Saturday.workingHours.to = point.Saturday && point.Saturday.workingHours && point.Saturday.workingHours.to ? moment.utc(point.Saturday.workingHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Saturday.workingHours.from = point.Saturday && point.Saturday.workingHours && point.Saturday.workingHours.from ? moment.utc(point.Saturday.workingHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Saturday.deliveryHours.to = point.Saturday && point.Saturday.deliveryHours && point.Saturday.deliveryHours.to ? moment.utc(point.Saturday.deliveryHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Saturday.deliveryHours.from = point.Saturday && point.Saturday.deliveryHours && point.Saturday.deliveryHours.from ? moment.utc(point.Saturday.deliveryHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Thursday.workingHours.to = point.Thursday && point.Thursday.workingHours && point.Thursday.workingHours.to ? moment.utc(point.Thursday.workingHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Thursday.workingHours.from = point.Thursday && point.Thursday.workingHours && point.Thursday.workingHours.from ? moment.utc(point.Thursday.workingHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Thursday.deliveryHours.to = point.Thursday && point.Thursday.deliveryHours && point.Thursday.deliveryHours.to ? moment.utc(point.Thursday.deliveryHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Thursday.deliveryHours.from = point.Thursday && point.Thursday.deliveryHours && point.Thursday.deliveryHours.from ? moment.utc(point.Thursday.deliveryHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Wednesday.workingHours.to = point.Wednesday && point.Wednesday.workingHours && point.Wednesday.workingHours.to ? moment.utc(point.Wednesday.workingHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Wednesday.workingHours.from = point.Wednesday && point.Wednesday.workingHours && point.Wednesday.workingHours.from ? moment.utc(point.Wednesday.workingHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Wednesday.deliveryHours.to = point.Wednesday && point.Wednesday.deliveryHours && point.Wednesday.deliveryHours.to ? moment.utc(point.Wednesday.deliveryHours.to, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.Wednesday.deliveryHours.from = point.Wednesday && point.Wednesday.deliveryHours && point.Wednesday.deliveryHours.from ? moment.utc(point.Wednesday.deliveryHours.from, 'YYYY-MM-DDTHH:mm:ss.SSS').subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS')+"Z" : "";
                obj.address = point.address;
                arr.push(obj)
                // console.log(arr);
                // console.log(obj.Friday.workingHours.to, point.Friday.workingHours.to)
                console.log('hello');
            };
        }
        await Consignees.update({points: arr}, {
            where: {
                id: item.id
            }
        })
    }
}

