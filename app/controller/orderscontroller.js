const moment = require("moment");
const fs = require("fs");
const mime = require("mime");
const path = require("path");
const axios = require("axios");
const request = require("request");
const db = require("../config/db.config.js");
const Osmap = require("./osmap.controller");
const osrm = require("../controller/osmap.controller");
const { createLoadFn } = require("./loads.controller");
const { creatTempLoadsfromOrder } = require("./load_temps.controller");
const Helpers = require("../classes/helpers");
const Calculations = require("../classes/calculations");
const Logics = require("../classes/logics");
const Errors = require("../errors/orderErrors");
const Warnings = require("../warnings/orderWarnings");
const LoadTemp_Controller = require("../controller/load_temps.controller");
const Load_Controller = require("../controller/loads.controller");
const ClassApiKey = require("../mongoClasses/apiKey");
const UploadClass = require("../classes/uploads");
const Consignee = require("../controller/consignees.controller");
const orderClass = require("../classes/order");
const HandlingClass = require("../classes/handlingUnit");
const Check = require("../classes/checks");
const uuidv1 = require("uuid/v1");
const { NorderAttrb, OrderAttr } = require("../classes/joinColumns.js");
const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");
const FileManager = require('../classes/files_manager');
// const seq = db.sequelize;
const Op = db.Sequelize.Op;
const Order = db.order;
const HandlingUnit = db.handlingUnit;
const Images = db.image;
const Items = db.item;
const seq = db.sequelize;
const pieceType = db.piecetypes;
const freightClass = db.freightclasses;
const Load = db.load;
const LoadTemp = db.loadTemp;
const Czones = db.czones;
const Status = db.status;
const Consignees = db.consignee;
const Vendors = db.vendors;
const Settings = db.settings;
const GlobalSettings = db.appSettings;
const Depo = db.depo;
const Sequelize = db.Sequelize;
const sequelize = db.sequelize;
const includeTrue = [{ all: true, nested: true }];
const includeFalse = [{ all: true, nested: false }];
const fileManager = new FileManager();
const allowedExtensions = [
    "image/apng",
    "image/bmp",
    "image/gif",
    "image/x-icon",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/svg+xml",
    "image/webp"
];

const AutoplanAttributes = [
    "orders.id",
    "orders.feet",
    "orders.weight",
    "orders.cube",
    "orders.flowType",
    "orders.deliveryLat",
    "orders.deliveryLon",
    "orders.pickupLat",
    "orders.pickupLon",
    "orders.deliverydateFrom",
    "orders.deliverydateTo",
    "orders.pickupdateFrom",
    "orders.pickupdateTo",
    "orders.servicetime",
    "orders.eta",
    "orders.ata",
    "orders.timeWindows",
    "orders.pieceCount",
    "orders.consigneeid",
    "orders.mustbefirst as mustBeFirst",
    "consignees.driverId as driverId",
    "consignees.czone_id as zoneId"
];
// const OrderAttr = [
//     ...NorderAttrb,
//     // "transporttypes.color",
//     "statuses.color as statusColor",
//     "statuses.id as statusId",
//     "statuses.name as statusName",
//     "statuses.statustype as statusType",
//     "transporttypes.name as LoadType"
// ];

// methods
const saveHandlingUnits = async (units, orderId, req) => {
    const handlingUnit = [];
    const Images = [];
    if (!units.length) return [];
    for (const unit of units) {
        const unitSaved = await saveHandlingUnit(unit, orderId);
        handlingUnit.push(unitSaved);
        let saveImages;
        if (unit.images && unit.images.length) {
            saveImages = await saveHandlingUnitsImages(unit.images, unitSaved.id, req);
            Images.push(saveImages);
        }
        if (unit.id) {
            if (unit.removedImages && unit.removedImages.length) {
                await removeHandlingUnitImages(unit.removedImages, unit.id);
            }
        }
    }
    return {
        "handlingUnit": handlingUnit,
        Images
    };
};

const saveHandlingUnit = async (data, orderId) => {
    let handling, volume, piece, where;
    if (data.volume) {
        volume = data.volume;
    } else {
        if (!data.sku) {
            if (data.piecetype_id || (data.piecetype_id && data.freightclasses_id)) {
                if (data.freightclasses_id) {
                    where = {
                        id: data.piecetype_id,
                        freightclasses_id: data.freightclasses_id
                    };
                } else {
                    where = {
                        id: data.piecetype_id,
                    };
                }
                piece = await pieceType.findOne({
                    where
                });
                volume = data.Weight / piece.density;
            } else if (data.Length && data.Width && data.Height) {
                volume = data.Length * data.Width * data.Height;
            } else {
                volume = null;
            }
        } else {
            if (data.piecetype_id) {
                piece = await pieceType.findOne({
                    where: {
                        id: data.piecetype_id
                    }
                });
                volume = data.Weight / piece.density;
            } else {
                volume = null;
            }
        }
    }
    // console.log("here", orderId);

    if (data.id) {
        await HandlingUnit.update({
            HandlingType_id: data.HandlingType_id,
            Quantity: data.Quantity ? data.Quantity : 1,
            piecetype_id: data.piecetype_id ? data.piecetype_id : 0,
            sku: data.sku ? data.sku : 0,
            brand: data.brand ? data.brand : 0,
            specialneeds: data.specialneeds ? data.specialneeds : 0,
            productdescription: data.productdescription,
            freightclasses_id: data.freightclasses_id ? data.freightclasses_id : null, // ?
            nmfcnumber: data.nmfcnumber, // ?
            nmfcsubcode: data.nmfcsubcode, // ?
            Weight: data.Weight ? data.Weight : 0,
            Length: data.Length ? data.Length : 0,
            Width: data.Width ? data.Width : 0,
            Height: data.Height ? data.Height : 0,
            mintemperature: data.mintemperature ? data.mintemperature : 0,
            maxtemperature: data.maxtemperature ? data.maxtemperature : 0,
            stackable: data.stackable,
            turnable: data.turnable,
            density: piece ? piece.density : null,
            volume: volume,
            orders_id: orderId
        }, { where: { id: data.id } });
        handling = await HandlingUnit.findOne({ where: { id: data.id } });
    } else {
        handling = await HandlingUnit.create({
            HandlingType_id: data.HandlingType_id,
            Quantity: data.Quantity,
            piecetype_id: data.piecetype_id ? data.piecetype_id : 0,
            sku: data.sku ? data.sku : 0,
            brand: data.brand ? data.brand : 0,
            specialneeds: data.specialneeds ? data.specialneeds : 0,
            productdescription: data.productdescription,
            freightclasses_id: data.freightclasses_id, // ?
            nmfcnumber: data.nmfcnumber, // ?
            nmfcsubcode: data.nmfcsubcode, // ?
            Weight: data.Weight ? data.Weight : 0,
            Length: data.Length ? data.Length : 0,
            Width: data.Width ? data.Width : 0,
            Height: data.Height ? data.Height : 0,
            mintemperature: data.mintemperature ? data.mintemperature : 0,
            maxtemperature: data.maxtemperature ? data.maxtemperature : 0,
            stackable: data.stackable,
            turnable: data.turnable,
            density: piece ? piece.density : null,
            volume: volume,
            orders_id: orderId
        }).catch(err => {
            console.log("handling Err", err);
        });
    }
    return handling ? handling.dataValues : {};
};

const saveHandlingUnitsImages = async (images, unitId, req) => {
    let error, msg;
    for (const [i, image] of images.entries()) {
        let matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
            response = {};

        if (matches.length !== 3) {
            return {
                msg: "file is invalid",
                status: 0
            };
        }
        response.type = matches[1];
        response.data = Buffer.from(matches[2], "base64");
        let decodedImg = response;
        let imageBuffer = decodedImg.data;
        let type = decodedImg.type;
        let extension = mime.getExtension(type);
        let fileName = `image${i}_${Date.now()}.` + extension;
        let path = "./resources/0/images/";
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
        if (allowedExtensions.includes(type)) {
            try {
                console.log(`Action: Save Image -> File Path: ${path}${fileName} , File Name: ${fileName}`);
                let getInfo = await Helpers.getRemoteInfo(req);
                let { urls } = await Helpers.getOrderImagePath("images", fileName, getInfo.host);
                console.log(urls.Path);

                fs.writeFileSync(`${path}${fileName}`, imageBuffer, "utf8");
                await Images.create({
                    image_url: urls.Path,
                    HandlingUnits_id: unitId,
                    filename: fileName
                });
                error = false;
                msg = "image uploaded";
            } catch (e) {
                error = true;
                msg = e;
            }
        } else {
            error = true;
            msg = "image mimeType is invalid";
        }

    }
    if (!error) {
        return {
            msg,
            status: 1
        };
    } else {
        return {
            msg,
            status: 0
        };
    }
};

const removeHandlingUnitImages = async (imageIds, unitId) => {
    const images = await Images.findAll({
        where: {
            HandlingUnits_id: unitId
        }
    });
    if (images) {
        for (const image of images) {
            if (imageIds.includes(image.id)) {
                let filePath = `./resources/0/images/${image.filename}`;
                await Images.destroy({
                    where: {
                        id: image.id
                    }
                });
                console.log(`Action: Remove ->  Image Path: ${filePath}`);
                fs.unlinkSync(filePath);
            }
        }
        return {
            status: 1,
            msg: "Image successfully deleted"
        };
    } else {
        return {
            status: 0,
            msg: "such images doesn't exist"
        };
    }


};

const removeHandlingUnits = async (handlingUnitIds) => {
    let imageIds = [], images = [], product = [];
    for (const handlingUnitId of handlingUnitIds) {
        let images = await Images.findAll({
            where: {
                HandlingUnits_id: handlingUnitId
            }
        });
        if (images) {
            images.forEach(image => {
                imageIds.push(image.id * 1);
            });
        }
        images.push(await removeHandlingUnitImages(imageIds, handlingUnitId));
    }
    await HandlingUnit.destroy({
        where: {
            id: {
                [Op.in]: handlingUnitIds
            }
        }
    });
    return {
        images,
        product
    };
};

const saveItems = async (items, unit_id) => {
    let saveItem;
    for (const item of items) {
        saveItem = await saveHandlingUnitItem(item, unit_id);
    }
    return saveItem;
};

const saveHandlingUnitItem = async (item, unit_id) => {

    let piece, freight;
    if (item.piecetype_id) {
        piece = await pieceType.findOne({
            where: {
                id: item.piecetype_id
            }
        });
    }
    if (item.freightclasses_id) {
        freight = await freightClass.findOne({
            where: {
                id: item.freightclasses_id
            }
        });
    }
    let Item;
    if (item.sku) {
        // const Sku = await sku.findOne({
        //     where: {
        //         id: item.sku
        //     }
        // });
        // if (item.Weight) {
        //     item.volume = item.Weight/piece.density;
        // } else {
        //     item.volume = Sku.weight/piece.density;
        // }
        if (item.id) {
            await Items.update({
                ...item,
                Handling_Unit_id: unit_id
            }, {
                where: {
                    id: item.id
                }
            });
            Item = await Items.findOne({ where: { id: item.id } });
        } else {
            Item = await Items.create({
                ...item,
                Handling_Unit_id: unit_id
            });
        }

    } else {
        if (freight) {
            if (piece) {
                item.volume = item.Weight / piece.density;
            }
        } else if (!item.freightclasses_id && piece) {
            item.volume = item.Weight / piece.density;
        } else {
            item.volume = item.Length * item.Width * item.Height;
        }
        item.Handling_Unit_id = unit_id;
        item.density = piece.density;

        if (item.id) {
            await Items.update(item, {
                where: {
                    id: item.id
                }
            });
            Item = await Items.findOne({ where: { id: item.id } });
        } else {
            Item = await Items.create(item);
        }
    }
    return Item;
};

const removeHandlingUnitItems = (savedItems, unit_id) => {
    let condition = { where: { Handling_Unit_id: unit_id } };
    if (savedItems && savedItems.length) {
        condition = {
            where: {
                Handling_Unit_id: unit_id,
                [Op.and]: { id: { [Op.notIn]: savedItems.map(it => it.id) } }
            }
        };
    }
    return Items.destroy(condition);
};

const cleanImages = removed => {
    if (!removed.length) return Promise.resolve([]);
    return Images.destroy({ where: seq.or({ id: removed.map(img => img.id) }) });
};

// Common
function getTotals(Handling_Units, type) {

    let total = 1000;
    return total;
}

function getDateParam(date) {
    if (date) {
        return date;
    }
    var now = new Date();

    var month = now.getMonth() + 1;
    month = month >= 10 ? month : "0" + month;

    var day = now.getDate();
    day = day >= 10 ? day : "0" + day;

    date = now.getFullYear() + "-" + month + "-" + day;

    return date;
}

function findAll(where, res) {
    Order.findAll({
        where: where
    })
        .then(orders => {
            res.status(200).send({
                status: 1,
                msg: "ok",
                data: orders
            });
        }).catch(err => {
            res.status(500).send({
                "description": "Can not access orders table",
                "error": err
            });
        });
}

const checkPieceCount = async (data) => {
    let oldOrder, oldPieceQount = 0, oldQountity = 0, old = 0;
    let { id } = data;
    oldOrder = await Order.findOne({
        where: {
            id: +id
        },
        include: includeTrue,
    });
    if (oldOrder) {
        oldPieceQount = oldOrder.dataValues.pieceCount;
        for (const product of oldOrder.dataValues.HandlingUnits) {
            oldQountity += product.Quantity;
        }
        if (oldPieceQount == oldQountity) {
            old = 1;
        }
    }
    return { old, quantity: oldQountity, pieceCount: oldPieceQount };
};

exports.getall = async (req, res) => {
    try {
        // let bool = true;
        const sortAndPagiantion = await Helpers.sortAndPagination(req);
        const where = req.query;
        const data = await Helpers.filters(where, Op, "order");
        let orders;
        // console.log("filters:",data);
        if (data.bool) {
            orders = await Order.findAndCountAll({
                where: data.where,
                include: [
                    {
                        model: Status,
                        as: "Status",
                    },
                    {
                        model: Consignees,
                        as: "consignee",
                        include: includeFalse
                    },
                    {
                        model: Depo,
                        as: "depo",
                    }
                ],
                distinct: true,
                ...sortAndPagiantion
            });
            res.status(200).send({
                status: 1,
                msg: "ok",
                data: {
                    orders: orders.rows,
                    total: orders.count
                }
            });
        } else {
            res.status(200).send({
                status: 1,
                msg: "fillter incorrect",
                data: {
                    orders: [],
                    total: 0
                }
            });
        }

    } catch (err) {
        console.log(" -- orders all -- ", err)
        res.status(500).send({
            "description": "Can not access orders table",
            "error": err
        });
    }

};

exports.get = async (req, res) => {
    const id = req.params.id;
    try {
        const order = await Order.findOne({ where: { id }, include: includeTrue });
        if (order.dataValues.proof && order.dataValues.proof.length) {
            const proofs = await fileManager.getById(order.dataValues.proof);
            order.dataValues.proof = proofs.map(x => ({ url: x.url, type: x.label }));
        }
        return res.json(await Helpers.getResponse(1, 'ok', order.dataValues));
    } catch (error) {
        console.log(error);
        return res.send(await Helpers.getResponse(0, ''));
    }
};

exports.create = async (req, res) => {
    // console.log(req.body);
    //  type --> feet, weight, volume
    // let totalfeet = getTotals(req.body.handlingUnits, type);
    // let totalweight;
    // let totalvolume;
    try {
        const errors = await Errors.createOrderError(req.body.orders, req.companyName);
        if (errors.error) {
            res.status(409).json({
                status: errors.error,
                msg: errors.msg
            });
        } else {
            let apikey = req.headers["x-api-key"], key, userId, id;
            if (apikey) {
                key = new ClassApiKey({ data: { Key: apikey } });
                userId = await key.getBy();
            }
            if (req.user) {
                id = req.user.id;
            } else if (userId) {
                id = userId.key.userId;
            }
            let createdOrders = [], errorArr = [];
            let warning, message, warningArray = [];
            const settings = await Settings.findOne({
                where: {
                    userId: id
                }
            });
            let i = 0, upload = false;
            if (req.body.Automated) {
                upload = true;
            }
            for (const order of req.body.orders) {
                // let poOrder;
                // poOrder = await Order.findAndCountAll({ where: {po: order.po }});

                let pickupLatLon = {
                    lat: 0,
                    lon: 0
                }, deliveryLatLon = {
                    lat: 0,
                    lon: 0
                };
                let LatLons;
                let points = [], cons, consignee;
                cons = order.consigneeName ? await Helpers.getOne({
                    key: "name",
                    value: order.consigneeName.toLowerCase(),
                    table: Consignees
                }) : null;
                let pickupStr, deliveryStr, delivery, pickup;
                if (req.companyName == "limush" || req.companyName == "lm") {
                    pickupStr = `${order.pickupStreetAddress}`;
                    pickup = `${order.pickupStreetAddress}`;
                    deliveryStr = `${order.deliveryStreetAddress}`;
                    delivery = `${order.deliveryStreetAddress}`;
                } else {
                    pickupStr = `${order.pickupZip}+${order.pickupCity}+${order.pickupStreetAddress}+${order.pickupState}`;
                    pickup = `${order.pickupZip} ${order.pickupCity} ${order.pickupStreetAddress} ${order.pickupState}`;
                    deliveryStr = `${order.deliveryZip}+${order.deliveryCity}+${order.deliveryStreetAddress}+${order.deliveryState}`;
                    delivery = `${order.deliveryZip} ${order.deliveryCity} ${order.deliveryStreetAddress} ${order.deliveryState}`;
                }
                if (!order.deliveryLat && !order.deliveryLon && !cons && upload) {
                    LatLons = await Helpers.orderLatLon({
                        deliveryAddr: !order.deliveryLat && !order.deliveryLon ? deliveryStr : null
                    });
                    points.push({
                        address: {
                            lat: LatLons.deliveryLatLon.data.results[0].geometry.location.lat,
                            lon: LatLons.deliveryLatLon.data.results[0].geometry.location.lng,
                            zip: order.deliveryZip,
                            city: order.deliveryCity,
                            state: order.deliveryState,
                            country: order.deliveryCountry,
                            countryCode: order.deliveryCountryCode.toLowerCase(),
                            streetAddress: order.deliveryStreetAddress
                        }
                    });
                    consignee = await Consignee.createInTimeOrderCreate({
                        name: order.consigneeName,
                        companyLegalName: order.deliveryCompanyName,
                        serviceTime: order.serviceTime ? order.serviceTime : 0,
                        points: points

                    });
                    // console.log("-----", consignee);
                } else if (!order.deliveryLat && !order.deliveryLon && !cons && !upload) {
                    LatLons = await Helpers.orderLatLon({
                        deliveryAddr: !order.deliveryLat && !order.deliveryLon ? deliveryStr : null
                    });
                    // points.push({
                    //     address: {
                    //         lat: LatLons.deliveryLatLon.data.results[0].geometry.location.lat,
                    //         lon: LatLons.deliveryLatLon.data.results[0].geometry.location.lng,
                    //         zip: order.deliveryZip,
                    //         city: order.deliveryCity,
                    //         state: order.deliveryState,
                    //         country: order.deliveryCountry,
                    //         countryCode: order.deliveryCountryCode,
                    //         streetAddress: order.deliveryStreetAddress
                    //     }
                    // });
                    // consignee = await Consignee.createInTimeOrderCreate({
                    //     name: order.consigneeName,
                    //     companyLegalName: order.deliveryCompanyName,
                    //     serviceTime: order.serviceTime ? order.serviceTime : 0,
                    //     points: points
                    // });
                } else if (!order.deliveryLat && !order.deliveryLon && cons) {
                    for (const point of cons.dataValues.points) {
                        if (point.address.zip == order.deliveryZip && point.address.city == order.deliveryCity && point.address.state == order.deliveryState && point.address.country == order.deliveryCountry && point.address.countryCode == order.deliveryCountryCode && point.address.streetAddress == order.deliveryStreetAddress) {
                            order.deliveryLon = point.address.lon;
                            order.deliveryLat = point.address.lat;
                        }
                    }
                }
                let PickLatLons;
                if (!order.pickupLon && !order.pickupLat) {
                    PickLatLons = await Helpers.orderLatLon({
                        pickupAddr: !order.pickupLat && !order.pickupLon ? pickupStr : null
                    });
                }
                // console.log(LatLons);
                if (order.pickupLon && order.pickupLat) {
                    pickupLatLon.lat = order.pickupLat;
                    pickupLatLon.lon = order.pickupLon;
                } else {
                    pickupLatLon.lat = PickLatLons.pickupLatLon.data.results[0].geometry.location.lat;
                    pickupLatLon.lon = PickLatLons.pickupLatLon.data.results[0].geometry.location.lng;
                }
                if (order.deliveryLon && order.deliveryLat) {
                    deliveryLatLon.lat = order.deliveryLat;
                    deliveryLatLon.lon = order.deliveryLon;
                } else {
                    deliveryLatLon.lat = LatLons.deliveryLatLon.data.results[0].geometry.location.lat;
                    deliveryLatLon.lon = LatLons.deliveryLatLon.data.results[0].geometry.location.lng;
                }

                // console.log(LatLons.pickupLatLon.data.results[0].geometry.location);
                // console.log(LatLons.deliveryLatLon.data.results[0].geometry.location);
                let consignees;
                if (order.consigneeId) {
                    consignees = await Consignees.findOne({
                        where: {
                            id: order.consigneeId
                        }
                    });
                } else if (upload) {
                    consignees = consignee.data;
                }
                //  = order.consigneeId ?  : null;
                let vendors = order.vendorId ? await Vendors.findOne({
                    where: {
                        id: order.vendorId
                    }
                }) : null;
                warning = false, message = "ok";
                const { distDur, msg, status } = await Warnings.createOrder({
                    pickupLat: pickupLatLon.lat,
                    pickupLon: pickupLatLon.lon,
                    deliveryLat: deliveryLatLon.lat,
                    deliveryLon: deliveryLatLon.lon
                });
                if (!status) {
                    warning = true,
                        message = msg;
                }

                if (order.products && order.products.length) {
                    let timeWindows;
                    timeWindows = await Check.newTimeWindow({
                        pickupdateFrom: order.pickupdateFrom,
                        pickupdateTo: order.pickupdateTo,
                        deliverydateFrom: order.deliverydateFrom,
                        deliverydateTo: order.deliverydateTo,
                        companyName: req.companyName
                    });
                    delete timeWindows.status;
                    let newOrder = await Order.create({
                        // Load type
                        loadtype: order.loadtype ? order.loadtype : 0,
                        // load_id: order.load_id,

                        flowType: order.flowType,
                        depoid: order.depoid,

                        // Pickup
                        pickupCompanyName: order.pickupCompanyName,
                        pickupState: order.pickupState,
                        pickupStreetAddress: order.pickupStreetAddress,
                        pickupLocationtypeid: order.pickupLocationtype,
                        // --
                        pickupCountry: order.pickupCountry,
                        pickupCountryCode: order.pickupCountryCode.toLowerCase(),
                        pickupCity: order.pickupCity,
                        pickupZip: order.pickupZip,
                        pickupAccessorials: order.pickupAccessorials,
                        // --
                        pickupdateFrom: new Date(order.pickupdateFrom),
                        pickupdateTo: new Date(order.pickupdateTo),
                        // --
                        pickupLon: pickupLatLon.lon,
                        pickupLat: pickupLatLon.lat,
                        proof: order.proof ? order.proof : null,
                        vendorid: order.vendorId ? order.vendorId : 0,
                        consigneeid: consignees ? consignees.dataValues.id : 0,
                        // Delivery
                        deliveryCompanyName: order.deliveryCompanyName,
                        deliveryState: order.deliveryState,
                        deliveryStreetAddress: order.deliveryStreetAddress,
                        deliveryLocationtypeid: order.deliveryLocationtype,
                        // --
                        deliveryCountry: order.deliveryCountry,
                        deliveryCountryCode: order.deliveryCountryCode.toLowerCase(),
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
                        timeWindows,
                        mustbefirst: order.mustbefirst ? 1 : 0,
                        crossDock: order.crossDock,
                        orderType: order.orderType
                    });
                    // .then(async newOrder => {
                    if (!status) {
                        warningArray.push({
                            warning,
                            orderId: newOrder.id,
                            message
                        });
                    }
                    let handlingUnits = await saveHandlingUnits(order.products, newOrder.id, req);
                    const orderTypes = {
                        stackable: 0,
                        turnable: 0,
                        hazmat: 0
                    };
                    if (!handlingUnits.handlingUnit) {
                        console.log("error Handling", newOrder.id,);
                        res.status(500).json({ status: 0, msg: "handling error" });
                    }
                    let cube = 0, feet = 0, weight = 0, specialneeds = [], quantity = 0;
                    for (const item of handlingUnits.handlingUnit) {
                        if (item.stackable) orderTypes.stackable = 1;
                        if (item.turnable) orderTypes.turnable = 1;
                        if (item.hazmat) orderTypes.hazmat = 1;
                        if (item.Length && item.Width && item.Height) {
                            let val = item.Length * item.Width * item.Height;
                            cube += (val * item.Quantity);
                        } else if (item.volume > 0) {
                            cube += (item.volume * item.Quantity);
                        }
                        feet += item.Length ? (item.Length * item.Quantity) : 0;

                        weight += item.Weight && item.Quantity ? (item.Weight * item.Quantity) : 0;
                        quantity += item.Quantity;
                        specialneeds.push({
                            id: item.id,
                            specialneeds: item.specialneeds
                        });
                    }
                    let servicetime = 0, pieceTime = 0;
                    if (order.serviceTime) {
                        servicetime = order.serviceTime;
                    } else if (consignees) {
                        if (consignees.serviceTime) {
                            servicetime = consignees.dataValues.serviceTime;
                        } else {
                            if (settings) {
                                servicetime = settings.defaultServiceTime;
                            }
                        }
                    } else {
                        if (settings) {
                            servicetime = settings.dataValues.defaultServiceTime;
                        }
                    }
                    if (order.pieceTime) {
                        pieceTime = order.pieceTime;
                    } else {
                        if (settings) {
                            pieceTime = settings.dataValues.pieceTime ? settings.dataValues.pieceTime : 0;
                        }
                    }
                    // servicetime = parseInt(servicetime, 10);
                    await Order.update({
                        orderTypes: orderTypes,
                        cube: cube,
                        feet: feet,
                        pieceCount: order.pieceCount ? order.pieceCount : quantity,
                        weight: weight,
                        specialneeds: specialneeds,
                        servicetime: servicetime + (pieceTime * (order.pieceCount ? order.pieceCount : quantity)),
                        pieceTime: pieceTime
                    }, {
                        where: {
                            id: newOrder.id
                        }
                    }).catch(err => {
                        console.log("catch!!!!!", err.message);
                    });
                    const updateOrder = await Order.findOne({
                        where: {
                            id: newOrder.id
                        }
                    });
                    if (newOrder.loadtype && newOrder.loadtype == "2" && order.createLoad) {

                        const loadTemp = await creatTempLoadsfromOrder(newOrder);
                        createdOrders.push({
                            ...updateOrder.dataValues,
                            "products": handlingUnits.handlingUnit,
                            loadTemp
                        });
                    } else {
                        createdOrders.push({
                            ...updateOrder.dataValues,
                            "products": handlingUnits.handlingUnit
                        });
                    }
                    // }).catch(err => {
                    //     console.log("55555", err.message);
                    //     errorArr.push({ status: 0, msg: err.message, err: err, data: order });
                    // });
                } else {
                    errorArr.push({
                        status: 0,
                        msg: "Add products to the order."
                    });
                }
            }
            // console.log("error Arr", errorArr);
            res.status(200).json({
                status: 1,
                warnings: warningArray,
                warning: warningArray.length ? true : false,
                msg: "Order created",
                data: createdOrders,
                errors: errorArr,
                error: errorArr.length ? true : false,
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ status: 0, msg: error.message });
    }
};

exports.edit = async (req, res) => {
    try {
        let orders = [], upload = false;
        if (req.body.Automated) {
            upload = true;
        }
        orders.push(req.body);

        const errors = await Errors.createOrderError(orders, req.companyName);
        if (errors.error) {
            // console.log("error ----- here");
            res.status(409).json({
                status: errors.error,
                msg: errors.msg
            });
        } else {
            let pickupLatLon = {
                lat: 0,
                lon: 0
            }, deliveryLatLon = {
                lat: 0,
                lon: 0
            };
            let points = [], cons, consignee;
            cons = req.body.consigneeName ? await Helpers.getOne({
                key: "name",
                value: req.body.consigneeName,
                table: Consignees
            }) : null;
            let LatLons, userId, userKeyData;
            let pickupStr, deliveryStr, delivery, pickup;
            if (req.companyName == "limush" || req.companyName == "lm") {
                pickupStr = `${req.body.pickupStreetAddress}`;
                pickup = `${req.body.pickupStreetAddress}`;
                deliveryStr = `${req.body.deliveryStreetAddress}`;
                delivery = `${req.body.deliveryStreetAddress}`;
            } else {
                pickupStr = `${req.body.pickupZip}+${req.body.pickupCity}+${req.body.pickupStreetAddress}+${req.body.pickupState}`;
                pickup = `${req.body.pickupZip} ${req.body.pickupCity} ${req.body.pickupStreetAddress} ${req.body.pickupState}`;
                deliveryStr = `${req.body.deliveryZip}+${req.body.deliveryCity}+${req.body.deliveryStreetAddress}+${req.body.deliveryState}`;
                delivery = `${req.body.deliveryZip} ${req.body.deliveryCity} ${req.body.deliveryStreetAddress} ${req.body.deliveryState}`;
            }

            const currentOrder = await Order.findOne({ where: { id: req.body.id } });



            if (req.body.pickupCity && req.body.pickupCountry && req.body.pickupCountryCode && !upload) {
                if (req.body.pickupCity !== currentOrder.dataValues.pickupCity || req.body.pickupState !== currentOrder.dataValues.pickupState ||
                    req.body.pickupCountry !== currentOrder.dataValues.pickupCountry || req.body.pickupCountryCode !== currentOrder.dataValues.pickupCountryCode ||
                    req.body.pickupStreetAddress !== currentOrder.dataValues.pickupStreetAddress || req.body.pickupZip !== currentOrder.dataValues.pickupZip) {
                    const latLons = await Helpers.orderLatLon({
                        pickupAddr: `${req.body.pickupZip}+${req.body.pickupCity}+${req.body.pickupStreetAddress}+${req.body.pickupState}`
                    });
                    req.body.pickupLat = latLons.pickupLatLon.data.results[0].geometry.location.lat;
                    req.body.pickupLon = latLons.pickupLatLon.data.results[0].geometry.location.lng;
                }
            }



            if (req.body.deliveryCity && req.body.deliveryCountry && req.body.deliveryCountryCode && !upload) {
                if (req.body.deliveryCity !== currentOrder.dataValues.deliveryCity || req.body.deliveryState !== currentOrder.dataValues.deliveryState
                    || req.body.deliveryCountry !== currentOrder.dataValues.deliveryCountry || req.body.deliveryCountryCode !== currentOrder.dataValues.deliveryCountryCode
                    || req.body.deliveryStreetAddress !== currentOrder.dataValues.deliveryStreetAddress || req.body.deliveryZip !== currentOrder.dataValues.deliveryZip) {
                    const latLons = await Helpers.orderLatLon({
                        deliveryAddr: `${req.body.deliveryZip}+${req.body.deliveryCity}+${req.body.deliveryStreetAddress}+${req.body.deliveryState}`
                    });
                    req.body.deliveryLat = latLons.deliveryLatLon.data.results[0].geometry.location.lat;
                    req.body.deliveryLon = latLons.deliveryLatLon.data.results[0].geometry.location.lng;
                }
            }

            if (!req.body.deliveryLat && !req.body.deliveryLon && !cons && upload) {
                LatLons = await Helpers.orderLatLon({
                    pickupAddr: !req.body.pickupLat && !req.body.pickupLon ? pickupStr : null,
                    deliveryAddr: !req.body.deliveryLat && !req.body.deliveryLon ? deliveryStr : null
                });
                points.push({
                    address: {
                        lat: LatLons.deliveryLatLon.data.results[0].geometry.location.lat,
                        lon: LatLons.deliveryLatLon.data.results[0].geometry.location.lng,
                        zip: req.body.deliveryZip,
                        city: req.body.deliveryCity,
                        state: req.body.deliveryState,
                        country: req.body.deliveryCountry,
                        countryCode: req.body.deliveryCountryCode.toLowerCase(),
                        streetAddress: req.body.deliveryStreetAddress
                    }
                });
                consignee = await Consignee.createInTimeOrderCreate({
                    name: req.body.consigneeName,
                    companyLegalName: req.body.deliveryCompanyName,
                    serviceTime: req.body.serviceTime ? req.body.serviceTime : 0,
                    points: points

                });
                // console.log("-----", consignee);
            } else if (!req.body.deliveryLat && !req.body.deliveryLon && !cons && !upload) {
                LatLons = await Helpers.orderLatLon({
                    pickupAddr: !req.body.pickupLat && !req.body.pickupLon ? pickupStr : null,
                    deliveryAddr: !req.body.deliveryLat && !req.body.deliveryLon ? deliveryStr : null
                });
            } else if (!req.body.deliveryLat && !req.body.deliveryLon && cons) {
                for (const point of cons.dataValues.points) {
                    if (point.address.zip == req.body.deliveryZip && point.address.city == req.body.deliveryCity && point.address.state == req.body.deliveryState && point.address.country == req.body.deliveryCountry && point.address.countryCode == req.body.deliveryCountryCode && point.address.streetAddress == req.body.deliveryStreetAddress) {
                        req.body.deliveryLon = point.address.lon;
                        req.body.deliveryLat = point.address.lat;
                    }
                }
            } else if (!req.body.pickupLat && !req.body.pickupLon && !upload) {
                LatLons = await Helpers.orderLatLon({
                    pickupAddr: !req.body.pickupLat && !req.body.pickupLon ? pickupStr : null,
                    deliveryAddr: !req.body.deliveryLat && !req.body.deliveryLon ? deliveryStr : null
                });
            }
            if (req.body.pickupLon && req.body.pickupLat) {
                pickupLatLon.lat = req.body.pickupLat;
                pickupLatLon.lon = req.body.pickupLon;
            } else {
                pickupLatLon.lat = LatLons.pickupLatLon.data.results[0].geometry.location.lat;
                pickupLatLon.lon = LatLons.pickupLatLon.data.results[0].geometry.location.lng;
            }
            if (req.body.deliveryLon && req.body.deliveryLat) {
                deliveryLatLon.lat = req.body.deliveryLat;
                deliveryLatLon.lon = req.body.deliveryLon;
            } else {
                deliveryLatLon.lat = LatLons.deliveryLatLon.data.results[0].geometry.location.lat;
                deliveryLatLon.lon = LatLons.deliveryLatLon.data.results[0].geometry.location.lng;
            }
            // deliveryLatLon.lat = LatLons.deliveryLatLon.data.results[0].geometry.location.lat;
            // deliveryLatLon.lon = LatLons.deliveryLatLon.data.results[0].geometry.location.lng;
            // pickupLatLon.lat = LatLons.pickupLatLon.data.results[0].geometry.location.lat;
            // pickupLatLon.lon = LatLons.pickupLatLon.data.results[0].geometry.location.lng;
            let apikey = req.headers["x-api-key"], key;
            if (apikey) {
                key = new ClassApiKey({ data: { Key: apikey } });
                userKeyData = await key.getBy();
            }
            if (req.user) {
                userId = req.user.id;
            } else if (userKeyData) {
                userId = userKeyData.key.userId;
            }
            let settings, id, orderObj,
                consignees, vendors, warning, message;
            //
            settings = await Settings.findOne({
                where: {
                    userId: userId
                }
            });
            // consignee = req.body.consigneeId ? await Consignees.findOne({
            //     where: {
            //         id: req.body.consigneeId
            //     }
            // }) : null;
            if (req.body.consigneeId) {
                consignees = await Consignees.findOne({
                    where: {
                        id: req.body.consigneeId
                    }
                });
            } else if (upload) {
                consignees = consignee.data;
            }
            vendors = req.body.vendorId ? await Vendors.findOne({
                where: {
                    id: req.body.vendorId
                }
            }) : null;
            // Get data for single 
            warning = false, message = "Order Edited";
            const { distDur, msg, status } = await Warnings.editOrder(req.body);
            if (!status) {
                warning = true,
                    message = msg;
            }
            id = req.params.id;
            let timeWindows;
            timeWindows = await Check.newTimeWindow({
                pickupdateFrom: req.body.pickupdateFrom,
                pickupdateTo: req.body.pickupdateTo,
                deliverydateFrom: req.body.deliverydateFrom,
                deliverydateTo: req.body.deliverydateTo,
                companyName: req.companyName
            });
            delete timeWindows.status;
            orderObj = {
                id: id,
                // Load type
                loadtype: req.body.loadtype ? req.body.loadtype : 0,
                // load_id: req.body.load_id,
                flowType: req.body.flowType,
                // depoid: req.body.deliveryDepoId,
                depoid: req.body.depoid ? req.body.depoid * 1 : 0,

                // Pickup
                pickupCompanyName: req.body.pickupCompanyName,
                pickupState: req.body.pickupState,
                pickupStreetAddress: req.body.pickupStreetAddress,
                pickupLocationtypeid: req.body.pickupLocationtype,
                // --
                pickupCountry: req.body.pickupCountry,
                pickupCountryCode: req.body.pickupCountryCode.toLowerCase(),
                pickupCity: req.body.pickupCity,
                pickupZip: req.body.pickupZip,
                proof: req.body.proof ? req.body.proof : null,
                pickupAccessorials: req.body.pickupAccessorials,
                // --
                pickupdateFrom: new Date(req.body.pickupdateFrom),
                pickupdateTo: new Date(req.body.pickupdateTo),
                // --
                pickupLon: pickupLatLon.lon,
                pickupLat: pickupLatLon.lat,

                vendorid: req.body.vendorId ? req.body.vendorId * 1 : 0,
                consigneeid: consignees ? consignees.dataValues.id : 0,
                // Delivery
                deliveryCompanyName: req.body.deliveryCompanyName,
                deliveryState: req.body.deliveryState,
                deliveryStreetAddress: req.body.deliveryStreetAddress,
                deliveryLocationtypeid: req.body.deliveryLocationtype,
                // --
                deliveryCountry: req.body.deliveryCountry,
                deliveryCountryCode: req.body.deliveryCountryCode.toLowerCase(),
                deliveryCity: req.body.deliveryCity,
                deliveryZip: req.body.deliveryZip,
                deliveryAccessorials: req.body.deliveryAccessorials,
                // --
                deliverydateFrom: new Date(req.body.deliverydateFrom),
                deliverydateTo: new Date(req.body.deliverydateTo),
                // --
                deliveryLon: deliveryLatLon.lon,
                deliveryLat: deliveryLatLon.lat,

                // Equipment Type
                eqType: req.body.eqType,

                // References
                bol: req.body.bol,
                pro: req.body.pro,
                po: req.body.po,

                // Rating
                currency: req.body.currency,
                rate: req.body.rate ? req.body.rate : null,

                // Notes
                notes: req.body.notes,

                //// Dimentions
                pallet: null,

                // Other
                companyid: 0, // req.body.companyid ,
                carrierid: 0, // req.body.carrierid ,
                customerid: 0, // req.body.customerid ,

                //// Other
                custDistance: status ? distDur.distance : 0,
                custDuration: status ? distDur.duration : 0,
                bh: req.body.bh,
                delivery: `${delivery}, ${req.body.deliveryCountry}`,
                pickup: `${pickup}, ${req.body.pickupCountry}`,
                // pieceCount: req.body.pieceCount ? req.body.pieceCount : 0,
                // pieceTime: req.body.pieceTime ? req.body.pieceTime : 0,
                timeWindows,
                mustbefirst: req.body.mustbefirst ? 1 : 0,
                crossDock: req.body.crossDock,
                orderType: req.body.orderType
            };

            let cube = 0, feet = 0, weight = 0, specialneeds = [], handlingUnits, quantity = 0;
            let orderTypes = { stackable: 0, turnable: 0, hazmat: 0 }, oldQuantity;
            oldQuantity = await checkPieceCount({ id });
            if (req.body.removeProductIds && req.body.removeProductIds.length) { await removeHandlingUnits(req.body.removeProductIds); }
            if (req.body.products && req.body.products.length) {
                handlingUnits = await saveHandlingUnits(req.body.products, id, req);
                for (const item of handlingUnits.handlingUnit) {
                    if (item.stackable) orderTypes.stackable = 1;
                    if (item.turnable) orderTypes.turnable = 1;
                    if (item.hazmat) orderTypes.hazmat = 1;
                    if (item.Length && item.Width && item.Height) {
                        let val = item.Length * item.Width * item.Height;
                        cube += (val * item.Quantity);
                    } else
                        if (item.volume > 0) {
                            cube += (item.volume * item.Quantity);
                        }

                    feet += item.Length ? (item.Length * item.Quantity) : 0;
                    weight += item.Weight && item.Quantity ? (item.Weight * item.Quantity) : 0;
                    quantity += item.Quantity;
                    specialneeds.push({ id: item.id, specialneeds: item.specialneeds });
                }
            }
            let servicetime;
            if (req.body.serviceTime) {
                servicetime = req.body.serviceTime;
            } else if (consignees) {
                if (consignees.serviceTime) {
                    servicetime = consignees.dataValues.serviceTime;
                } else {
                    if (settings) {
                        servicetime = settings.defaultServiceTime;
                    }
                }
            } else {
                if (settings) {
                    servicetime = settings.defaultServiceTime;
                }
            }
            let changeOrder, order, newQuantity;
            servicetime = parseInt(servicetime, 10);
            if (!oldQuantity.old && req.body.pieceCount != oldQuantity.pieceCount) {
                newQuantity = req.body.pieceCount;
            } else if (oldQuantity.old && req.body.pieceCount != oldQuantity.pieceCount) {
                newQuantity = req.body.pieceCount;
            } else if (oldQuantity.old) {
                newQuantity = oldQuantity.pieceCount;
            }
            changeOrder = await Order.update({
                ...orderObj,
                cube,
                feet,
                weight,
                pieceCount: newQuantity,
                pieceTime: req.body.pieceTime,
                specialneeds: specialneeds,
                orderTypes: orderTypes,
                servicetime
            }, {
                where: { id: id }
            });
            order = await Order.findOne({
                where: {
                    id: id
                }
            });

            if (changeOrder[0]) {
                res.status(200).json({
                    status: 1,
                    warning,
                    msg: message,
                    data: [{
                        ...order.dataValues,
                        "products": handlingUnits
                    }],
                    error: false,
                });
            } else {
                res.status(200).json({
                    status: 1,
                    msg: "Order doesn\"t changed",
                    data: {}
                });
            }
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 0,
            error,
            msg: "catch error"
        });
    }

};

exports.delete = async (req, res) => {
    let ids = req.body.ids;
    if (!ids.length) {
        res.status(200).send({
            status: 0,
            msg: "no ids for delete"
        });
        return;
    }


    Order.destroy({
        where: {
            id: {
                [Op.in]: ids
            }
        }
    }).then(async orders => {
        await HandlingUnit.destroy({
            where: {
                orders_id: {
                    [Op.in]: ids
                }
            }
        });
        res.status(200).send({
            status: 1,
            msg: "ok",
            data: orders
        });
    }).catch(err => {
        res.status(500).send({
            "description": "Can not access orders table",
            "error": err
        });
    });
};

////
//
exports.plannedunplanned = (req, res) => {
    var filter = req.params.filter;
    var where;
    switch (filter) {
        case "all":
            where = {};
            break;
        // case "Planned": where = { load_id: { [Op.gt]: 0 } }; break
        // case "Unplanned":  where = { load_id: { [Op.or]: { [Op.lt]: 0, [Op.eq]: null } } }; break
        case "Planned":
            where = { isPlanned: 1 };
            break;
        case "Unplanned":
            where = { isPlanned: 0 };
            break;
    }

    findAll(where, res);
};

exports.freezedunfreezed = (req, res) => {
    var filter = req.params.filter;
    var where;
    switch (filter) {
        case "all":
            where = {};
            break;
        // case "Planned": where = { load_id: { [Op.gt]: 0 } }; break
        // case "Unplanned":  where = { load_id: { [Op.or]: { [Op.lt]: 0, [Op.eq]: null } } }; break
        case "Freezed":
            where = { isfreezed: 1 };
            break;
        case "Unfreezed":
            where = { isfreezed: 0 };
            break;
    }

    findAll(where, res);
};

exports.statusfilter = (req, res) => {
    var filter = req.params.filter;
    var where;
    switch (filter) {
        case "all":
            where = {};
            break;
        // case "Planned": where = { load_id: { [Op.gt]: 0 } }; break
        // case "Unplanned":  where = { load_id: { [Op.or]: { [Op.lt]: 0, [Op.eq]: null } } }; break
        case "At Depot":
            where = { status: 2 };
            break;
        case "Arrived":
            where = { status: 3 };
            break;
        case "In Transit":
            where = { status: 4 };
            break;
        case "At Pickup":
            where = { status: 5 };
            break;
        case "Delay":
            where = { status: 6 };
            break;
        case "At Dropoff":
            where = { status: 7 };
            break;
    }

    findAll(where, res);

    // Order.findAll({
    // 	where: where
    // })
    // .then(orders => {
    // 	res.status(200).send({
    // 		status: 1,
    // 		msg: "ok",
    // 		data: orders
    // 	})
    // }).catch(err => {
    // 	res.status(500).send({
    // 		"description": "Can not access orders table",
    // 		"error": err
    // 	});
    // })
};

exports.changeonwaystatus = async (req, res) => {
    let nowDate = moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
    let resStatus = 1, resMessage = "ok";
    let { timezone } = req.headers;
    let id = req.params.id;
    let orders = req.body.orders;
    let status = req.body.statusid;
    let lid = req.body.loadid;
    let ata, ataId;
    if (req.body.ata) { ata = nowDate; ataId = req.body.ata.orderid; }
    ata = status == 5 || status == 0 ? null : nowDate;
    let durations;
    if (req.body.durations) { durations = req.body.durations; }
    let orderETA = [];
    let st = await Status.findOne({ where: { id: status } });
    let load = await Load.findOne({
        where: { id: lid },
        include: includeFalse
    }).catch(err => { res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body }); });
    let curSt = load.status;
    let ords = load.orders.split(",").map(function (item) { return parseInt(item, 10); });

    console.log(ords, id);
    if (!ords.includes(parseInt(id, 10))) {
        console.log("!!!");
        res.status(409).send({ status: 0, msg: `load ${lid} not include order by id ${id}`, data: req.body, orders: ords });
        return;
    }

    let stopLocations = load.stopLocations;

    if (stopLocations) {
        for (const [i, el] of stopLocations.entries()) {
            if (el.type.type == "order" && el.type.orders.includes(id * 1)) {
                el.type.data.statusId = st.id;
                el.type.data.statusColor = st.color;
                el.type.data.statusName = st.name;
                el.type.data.timeInfo.loads[lid].ata = status == 5 || status == 0 ? null : ata;
                for (const load of el.type.data.timeInfo.loadsArr) {
                    if (load.id == lid) {
                        load.ata = status == 5 || status == 0 ? null : ata;
                    }
                }
                for (const item of el.type.datas) {
                    item.statusId = st.id;
                    item.statusColor = st.color;
                    item.statusName = st.name;
                    item.timeInfo.loads[lid].ata = status == 5 || status == 0 ? null : ata;
                    for (const load of item.timeInfo.loadsArr) {
                        if (load.id == lid) {
                            load.ata = status == 5 || status == 0 ? null : ata;
                        }
                    }
                }
                if (!durations) {
                    let timeInfo = el.type.data.timeInfo;
                    timeInfo.loads[lid].ata = status == 5 || status == 0 ? null : ata;
                    timeInfo.loadsArr.forEach(item => {
                        if (item.id == lid) {
                            item.ata = status == 5 || status == 0 ? null : ata;
                        }
                    });

                    const updateBody = {
                        status: status,
                        timeInfo: timeInfo,
                    };
                    if (status !== 6) updateBody.proof = null;

                    await Order.update(updateBody, { where: { id: { [Op.in]: orders } } });
                    const destroyedFiles = await fileManager.deleteFroofImages(orders);
                    if (destroyedFiles && !destroyedFiles.err.length) {
                        console.log(destroyedFiles.err[0]);
                        resMessage = destroyedFiles.err[0].message;
                        resStatus = 0;
                    }
                }
            }
            if (durations) {
                orderETA.push({
                    id: el.type.data.id,
                    type: el.type.type,
                    dur: durations[i]
                });
            }
        }
    }
    let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
    let query = await Helpers.createSelectQueryWithJoin5(tables, load.dataValues.orders, OrderAttr);
    let dataOrders = await seq.query(query, { type: seq.QueryTypes.SELECT });
    await Calculations.stops({ loads: load, orders: dataOrders, loadType: 1, timezone }, true);
    // if (durations) {
    //     await Calculations.calcETA2({ loadId: lid, orderETA }, { ataId: id, ata, status });
    // }
    // await Load.update({ stopLocations: stopLocations }, { where: { id: lid } }).catch(err => {
    //     res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    // });
    // const newLoad = await Load.findOne({
    //     where: {
    //         id: lid
    //     }
    // });
    res.status(200).send({
        status: resStatus,
        msg: resMessage,
        data: {
            id: ords,
            status: status,
            Load: lid
        }
    });
};

exports.setETA = async (req, res) => {
    Order.update(
        { size: req.body.eta, },
        {
            where: { id: req.params.id }
        }).then(order => {
            res.status(201).send({
                status: 1,
                msg: "updated",
                data: order
            });
        }).catch(err => {
            res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        });
};

////
//
exports.byids = async (req, res) => {
    try {
        const ids = req.params.ids;
        let where = req.query;
        let noTimeWindow = where.noTimeWindow;
        delete where.noTimeWindow;
        const orderIds = await Helpers.splitToIntArray(ids, ",");
        let tables = ["orders", "consignees"];
        let query = Helpers.createSelectQueryWithJoinConsignee(tables, orderIds.join(","), AutoplanAttributes);
        const orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
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
        res.status(200).send({
            status: 1,
            msg: "ok",
            data: {
                orders: orders,
            }
        });

    } catch (error) {
        res.status(500).json({
            msg: "Can not access orders table",
            error
        });
    }

};

exports.byIdsAndCoordsFillCoords = (req, res) => {
    var ids = req.params.ids;
    var idArr = ids.split(",");
    Order.findAll({
        where: {
            id: {
                [Op.in]: idArr
            }
        }
    })
        .then(orders => {
            var ordersResult = [];
            for (var i = 0; i < idArr.length; i++) {
                for (var j = 0; j < orders.length; j++) {
                    if (idArr[i] == orders[j].id) {
                        if (orders[j].deliveryLon == null || orders[j].deliveryLat == null || orders[j].deliveryLon == "" || orders[j].deliveryLat == "") {
                            //  console.log(2);
                            var oLonLat = alkMap.getOrderLonLatByAddress(orders[j]);
                            //  console.log(oLonLat);
                            if (oLonLat && oLonLat !== false && oLonLat.length > 0) {
                                orders[j].lon = oLonLat[0].Coords.Lon;
                                orders[j].lat = oLonLat[0].Coords.Lat;

                                Order.update({
                                    lon: orders[j].lon,
                                    lat: orders[j].lat
                                }, {
                                    where: { id: orders[j].id }
                                });
                            }
                        }

                        ordersResult.push(orders[j]);
                        break;
                    }
                }
            }

            res.status(200).send({
                status: 1,
                msg: "ok",
                data: ordersResult
            });
        }).catch(err => {
            res.status(500).send({
                "description": "Can not access orders table",
                "error": err
            });
        });
};

exports.byIdsAndCoords = (req, res) => {
    var ids = req.params.ids;
    var idArr = ids.split(",");
    Order.findAll({
        attributes: ["id", "delivaryLon", "deliveryLat"],
        where: {
            id: {
                [Op.in]: idArr
            }
        }
    })
        .then(orders => {
            var ordersResult = [];
            for (var i = 0; i < idArr.length; i++) {
                for (var j = 0; j < orders.length; j++) {
                    if (idArr[i] == orders[j].id) {
                        ordersResult.push(orders[j]);
                        break;
                    }
                }
            }

            res.status(200).send({
                status: 1,
                msg: "ok",
                data: ordersResult
            });
        }).catch(err => {
            res.status(500).send({
                "description": "Can not access orders table",
                "error": err
            });
        });
};

exports.byIdsAndCoordsMany = (req, res) => {
    //var borders = req.body.a //.orders
    var idArr = [];

    for (var key in req.body) {
        var arr = Array.isArray(req.body[key]) ? req.body[key] : [req.body[key]];
        arr.forEach(rb => {
            rb.split(",").forEach(rb0 => { idArr.push(rb0); });
        });
    }
    //console.log(idArr)
    if (idArr.length == 0) {
        res.status(200).send(Common([]));
        return;
    }

    Order.findAll({
        attributes: ["id", "deliveryLon", "deliveryLat"],
        where: {
            id: {
                [Op.in]: idArr
            }
        }
    })
        .then(orders => {

            var ordersResult = [];

            for (var key in req.body) {
                var arr = Array.isArray(req.body[key]) ? req.body[key] : [req.body[key]];
                arr.forEach(rb => {
                    var or = [];
                    var ords = rb.split(",");
                    ords.forEach(o => {
                        for (var j = 0; j < orders.length; j++) {
                            if (o == orders[j].id) {
                                or.push(orders[j]);
                                break;
                            }
                        }
                    });
                    ordersResult.push(or);
                });
            }

            res.status(200).send({
                status: 1,
                msg: "ok",
                data: ordersResult
            });
        }).catch(err => {
            res.status(500).send({
                "description": "Can not access orders table",
                "error": err
            });
        });
};

exports.byidssortedbydeliverydate = (req, res) => {
    var ids = req.params.ids;
    // findAll({
    // 	where: {
    // 		id: { [Op.in]: ids.split(",") }
    // 	}, res);

    Order.findAll({
        where: {
            id: {
                [Op.in]: ids.split(",")
            }
        },
        order: [

            ["deliverydateFrom", "ASC"]
        ]
    }).then(orders => {
        res.status(200).send({
            status: 1,
            msg: "ok",
            data: orders
        });
    }).catch(err => {
        res.status(500).send({
            "description": "Can not access orders table",
            "error": err
        });
    });
};

// DELETE After Testing
exports.getAutoPlan = async (req, res) => {
    console.log("getOrders Autoplan");
    try {
        const sortAndPagiantion = await Helpers.sortAndPagination(req);

        let where = req.query;
        let noTimeWindow = where.noTimeWindow;
        delete where.noTimeWindow;
        let filterWhere;

        let bool = false;
        if (where.depoid) {
            where[Op.or] = [{ depoid: where.depoid }, { depoid: null }];
        }
        delete where.depoid;
        if (where.deliveryDateFrom || where.deliveryDateTo || where.pickupDateFrom || where.pickupDateTo) {
            delete where.date;
            filterWhere = await Helpers.filters(where, Op);
            bool = true;
            if (!filterWhere.bool) {
                res.status(200).send({
                    status: 1,
                    msg: "filter error",
                    data: {
                        orders: [],
                        count: 0
                    }
                });
            }
            delete where.flowType;
        } else {

            let start = where.date;
            let end = moment(start).add(23.9998, "h").toISOString();

            // console.log("s", start.toString());
            // console.log("e", end.toString());

            if (where.flowType && where.flowType == "1") {

                where.pickupdateFrom = {
                    [Op.gte]: start,
                    [Op.lte]: end
                };
                delete where.flowType;
            }
            if (where.flowType && where.flowType == "2") {

                where.deliverydateTo = {
                    [Op.gte]: start,
                    [Op.lte]: end
                };
                delete where.flowType;
            }
            delete where.date;
        }

        const orders = await Order.findAndCountAll({
            //  attributes: autoplanattrb,
            where: bool ? filterWhere.where : where,
            include: includeFalse,
            distinct: true,
            ...sortAndPagiantion
        });
        var result = [];
        for (var i in orders.rows) {
            var o = orders.rows[i];
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
                // pallet: o.pallet,
                // eqType: o.eqType,
                flowType: o.flowType,
                // delivery: o.delivery,
                // pickup: o.pickup,
                // deliveryLatLon: `${o.deliveryLat},${o.deliveryLon}`,
                // pickupLatLon: `${o.pickupLat},${o.pickupLon}`,
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
                // Accessorials: o.Accessorials
            });
            //  console.log(result);
        }
        res.status(200).send({
            status: 1,
            msg: "ok",
            data: {
                orders: result,
                count: orders.count
            }
        });
    } catch (error) {
        console.log("getOrders Autoplan: ", error.message);
        res.status(500).send({
            status: 0,
            msg: error.message,
            data: {}
        });
    }
};

exports.getAutoplanCount = async (req, res) => {
    try {


        let { filters, params } = req.body;


        const sortAndPagiantion = await Helpers.sortAndPagination2(params);

        let where = {
            ...filters,
            ...params
        };
        let filterWhere, orders;
        if (where.depoid && where.depoid == where.depotId) {
            delete where.depotId;
        } else if (where.depoid && where.depoid != where.depotId) {
            return res.json({
                status: 1,
                msg: "filter error",
                data: {
                    count: 0
                }
            });
        } else if (!where.depoid) {
            where[Op.or] = [{ depoid: where.depotId }, { depoid: null }];
            delete where.depotId;
        }

        let bool = false;

        if (where.deliveryDateFrom || where.deliveryDateTo || where.pickupDateFrom || where.pickupDateTo) {
            delete where.date;
            filterWhere = await Helpers.filters(where, Op);
            bool = true;
            if (!filterWhere.bool) {
                res.status(200).send({
                    status: 1,
                    msg: "filter error",
                    data: {
                        count: 0
                    }
                });
            }
            delete where.flowType;
        } else {

            let start = where.date;
            let end = moment(start).add(23.9998, "h").toISOString();

            console.log("s", start.toString());
            console.log("e", end.toString());

            if (where.flowType && where.flowType == "1") {

                where.pickupdateFrom = {
                    [Op.gte]: start,
                    [Op.lte]: end
                };
                delete where.flowType;
            }
            if (where.flowType && where.flowType == "2") {

                where.deliverydateTo = {
                    [Op.gte]: start,
                    [Op.lte]: end
                };
                delete where.flowType;
            }
            delete where.date;
        }
        orders = await Order.count({
            attributes: ["id"],
            where: bool ? filterWhere.where : where,
            include: includeFalse,
            distinct: true,
            ...sortAndPagiantion
        });
        let count = sortAndPagiantion.limit < orders ? sortAndPagiantion.limit : orders;
        res.json({
            status: 1,
            msg: "OK",
            data: {
                count
            }
        });
    } catch (error) {
        res.json(await Helpers.errorMsg("Error in get orders count"));
    }
};

exports.getAutoPlanTwo = async (req, res) => {
    //console.log(req.body);

    const sortAndPagiantion = await Helpers.sortAndPagination(req);
    console.log(sortAndPagiantion);

    let where = req.query;
    let filterWhere;
    let bool = false;
    if (where.depoid) {
        where[Op.or] = [{ depoid: where.depoid }, { depoid: null }];
    }
    delete where.depoid;
    if (where.deliveryDateFrom || where.deliveryDateTo || where.pickupDateFrom || where.pickupDateTo) {
        delete where.date;
        filterWhere = await Helpers.filters(where, Op);
        bool = true;
        if (!filterWhere.bool) {
            res.status(200).send({
                status: 1,
                msg: "filter error",
                data: {
                    orders: [],
                    count: 0
                }
            });
        }
    } else {
        if (where.flowType && where.flowType == "1") {
            where.pickupdateFrom = {
                [Op.startsWith]: where.date
            };
        }
        if (where.flowType && where.flowType == "2") {
            where.deliverydateTo = {
                [Op.startsWith]: where.date
            };
        }
        delete where.date;
    }

    const orders = await Order.findAndCountAll({
        //  attributes: autoplanattrb,
        where: bool ? filterWhere.where : where,
        include: includeFalse,
        distinct: true,
        ...sortAndPagiantion
    });
    var result = [];
    for (var i in orders.rows) {
        var o = orders.rows[i];
        let full = false;
        if (o.loadtype == "2") {
            full = true;
        }
        result.push({
            id: o.id,
            feet: o.feet,
            weight: o.weight,
            cube: o.cube,

            // pallet: o.pallet,
            // eqType: o.eqType,
            flowType: o.flowType,

            // delivery: o.delivery,
            // pickup: o.pickup,

            // deliveryLatLon: `${o.deliveryLat},${o.deliveryLon}`,
            // pickupLatLon: `${o.pickupLat},${o.pickupLon}`,

            deliveryLat: o.deliveryLat,
            deliveryLon: o.deliveryLon,
            pickupLat: o.pickupLat,
            pickupLon: o.pickupLon,

            deliverydateFrom: o.deliverydateFrom,
            deliverydateTo: o.deliverydateTo,

            pickupdateFrom: o.pickupdateFrom,
            pickupdateTo: o.pickupdateTo,
            servicetime: o.servicetime,
            full
            // Accessorials: o.Accessorials
        });
        //  console.log(result);
    }
    res.status(200).send({
        status: 1,
        msg: "ok",
        data: {
            orders: result,
            count: orders.count
        }
    });
};


exports.distance = async (req, res) => {
    if (req.body.pickupStreetAddress && req.body.pickupCity && req.body.deliveryStreetAddress && req.body.deliveryCity) {
        const pickupLatLon = await osrm.GeoCode(`${req.body.pickupStreetAddress}, ${req.body.pickupCity}`);
        const deliveryLatLon = await osrm.GeoCode(`${req.body.deliveryStreetAddress}, ${req.body.deliveryCity}`);
        if (pickupLatLon.length && deliveryLatLon.length) {
            const LatLons = `${pickupLatLon[0].lat},${pickupLatLon[0].lon};${deliveryLatLon[0].lat},${deliveryLatLon[0].lon};`;
            const { distDur, status } = await osrm.GetDistDur(LatLons);

            res.status(200).send({
                status: 1,
                msg: "ok",
                data: {
                    distance: status ? distDur.distance : 0
                }
            });
        } else {
            res.status(200).send({
                status: 0
            });
        }

    } else {
        res.status(200).send({
            status: 0
        });
    }
};

exports.changeStatus = async (req, res) => {
    console.log(req.body);
    const oid = req.params.id;
    const sid = req.body.statusid;
    const lid = req.body.loadid;

    Order.update({

        status: req.params.sid

    }, {
        where: { id: oid }
    }).then(oresp => {
        // Some other update for load
        res.status(200).send({
            status: oresp,
            msg: "ok"
        });

    }).catch(err => {
        res.status(500).send({
            status: oresp,
            msg: err

        });
    });

};

exports.editAll = async (data) => {
    try {
        let orders;
        let { serviceTime, pieceTime } = data;
        let query = await Helpers.createEditQuery(serviceTime * 1, pieceTime * 1);
        orders = await seq.query(query, { type: seq.QueryTypes.UPDATE }).catch(err => {
            console.log(err);

        });
        return { orders };
    } catch (error) {
        return {
            status: 0,
            msg: "Error"
        };
    }
};

exports.image = async (req, res, next) => {
    req.urlBasedDirectory = "images";
    next();
};

exports.orderUpload = async (req, res) => {
    console.log("upload started");
    try {
        const uid = uuidv1();
        let fileArr = [], type = 2, info, classKey;
        info = await Helpers.getRemoteInfoForKey(req);
        if (!info) {
            console.log("fail on remote Info:");
        }
        const data = {
            host: info.host,
            userId: req.user.id
        }
        classKey = new ClassApiKey({
            data
        });
        let { key } = await classKey.getBy().catch(err => {
            console.log("fail key checking", err.message);
        });
        let { timezone, date, depotId, equipmentTypeId, RefreshProducts } = req.body;
        let depo = depotId ? await Depo.findOne({ where: { id: depotId } }) : null;
        let settings = req.user.id ? await Settings.findOne({ where: { userId: req.user.id } }) : null;
        if (!depo || !settings) {
            console.log("null depo or settings");
        }
        let b = req.body.changedFile ? Buffer.from(req.body.changedFile) : null;
        let s = b ? b.toString("base64") : null;
        if (!s) {
            console.log("changedFile: ", req.body.changedFile);
        }
        // console.log(req.body.changedFile);
        let fileName = req.body.fileName;
        if (req.files && req.files.files) {
            if (Array.isArray(req.files.files)) {
                for (const file of req.files.files) {
                    // CSV:  0
                    // EDF:  1
                    let ext = path.extname(file.name);
                    ext == ".csv" ? type = 0 :
                        ext == ".edf" ? type = 1 : type = 2;
                    if (type == 0 || type == 1) {
                        fileArr.push({
                            FileType: type,
                            FileName: file.name,
                            Data: Buffer.from(file.data).toString("base64")
                        });
                    }
                }
            } else {
                let file = req.files.files;
                let ext = path.extname(file.name);
                ext == ".csv" ? type = 0 :
                    ext == ".edf" ? type = 1 : type = 2;
                if (type == 0 || type == 1) {
                    fileArr.push({
                        FileType: type,
                        FileName: file.name,
                        Data: Buffer.from(file.data).toString("base64")
                    });
                }
                fileName = file.name;
            }
        } else {
            fileArr.push({
                FileType: req.body.fileType,
                FileName: fileName,
                Data: req.body.changedFile ? s : "null"
            });
        }
        console.log("pased file reading stage");
        if (req.body.saveFields != 0 && req.body.fileHeaders && req.user.id) {
            await Settings.update({ fileHeaders: JSON.parse(req.body.fileHeaders) }, {
                where: {
                    userId: req.user.id
                }
            });
        }

        let obj = {
            "UUID": uid,
            "RefreshProducts": RefreshProducts == 1 ? true : false,
            "Country": settings.dataValues.country,
            "CountryCode": settings.dataValues.countryCode,
            "EquipmentTypeId": equipmentTypeId,
            "Date": date,
            "TimeZoneOffset": timezone,
            "Depot": depo.dataValues,
            "Endpoints": {
                "Consignees": `${info.host}/apis/v1/consignees`,
                "Products": `${info.host}/apis/v1/products`,
                "HandlingTypes": `${info.host}/apis/v1/handlingtypes`,
                "PieceTypes": `${info.host}/apis/v1/piecetypes`,
                "Order": `${info.host}/apis/v1/orders`,
                "Upload": `${info.host}/apis/v1/uploads`
            },
            "Keys": {
                "Consignees": key.Key,
                "Products": key.Key,
                "HandlingTypes": key.Key,
                "PieceTypes": key.Key,
                "Order": key.Key,
                "Upload": key.Key
            },
            "Files": fileArr
        };
        let sendFile,
            url = "http://192.168.1.109:4774/upload";
        // url = `${env.uploadHost}${env.uploadPort}/upload`;
        console.log(url);
        if (fileArr.length) {
            const upClass = new UploadClass({ data: { UUID: uid } });
            await upClass.create();
            sendFile = await axios.post(url, obj, {
                headers: {
                    "content-type": "application/json"
                },
                // maxBodyLength: 1000000000
            }).catch(err => {
                console.log("post Upload Error: ", err.message);
            });
            console.log("post success");
        } else {
            return res.status(409).json({
                status: 0,
                msg: "file doesn\"t exist"
            });

        }


        res.json({
            status: 1,
            data: sendFile.data,
            UUID: uid,
        });
    } catch (error) {
        console.log("Upload ERROR: ", error.message);
        res.json({
            status: 0,
            msg: error.message,
            data: error
        });
    }
};

exports.getUploadOrdersStatus = async (req, res) => {
    try {
        let url = "http://192.168.1.109:4774/upload",
            // let url = `${env.uploadHost}${env.uploadPort}/upload`,
            result;
        let settings = await Settings.findOne({
            where: {
                userId: req.user.id
            }
        });
        if (settings.dataValues.userType !== "legacy") {
            let { uuid } = req.query, upload;
            let uploadCl = new UploadClass({
                data: {
                    UUID: uuid
                }
            });
            upload = await uploadCl.getOne();
            result = {
                data: {
                    Finished: upload.data.status == 2 || upload.data.status == 0 ? true : false,
                    Running: upload.data.status == 1 ? true : false,
                    statusText: upload.data.status == 2 || upload.data.status == 0 ? `created ${upload.data.orderCount} orders. ` : "Plesae Continue!",
                    upload: upload.data.status == 2 || upload.data.status == 0 ? upload : [],
                },
                status: 200
            };
        } else {
            result = await axios.get(url).catch(err => {
                console.log("get UploadStatus error: ", err.message);
            });
        }
        // console.log("status", result);
        let { data, status, statusText } = result;
        if (status == 200) {
            res.json({
                ...data,
                msg: data.statusText
            });
        } else {
            res.status(409).json({
                status: 0,
                msg: statusText
            });
        }

    } catch (error) {
        console.log(error);
        res.status(409).json({
            status: 0,
            msg: error.message
        });
    }
};

exports.orderUnPlan = async (req, res) => {
    try {
        let { orderIds, selctedLoads } = req.body, sLoads, currentLoads = [];
        let { timezone } = req.headers;
        let { result, loadTempIds } = await this.unplanOrder({
            orderIds,
            user: req.user,
            timezone
        });
        if (selctedLoads && selctedLoads.length) {
            sLoads = await LoadTemp.findAndCountAll({
                where: {
                    id: {
                        [Op.in]: selctedLoads
                    }
                },
                include: includeFalse
            });
            if (sLoads && sLoads.count) {
                currentLoads = sLoads.rows;
                for (let i = 0; i < currentLoads.length; i++) {
                    currentLoads[i].dataValues.ordersDatas = [];
                    await Helpers.joinOrders(currentLoads[i], currentLoads[i].orders, OrderAttr);
                }
            }
        }
        res.json({
            status: 1,
            data: result,
            selctedLoads: {
                data: currentLoads,
                total: currentLoads.length
            }
        });
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: error.message
        });
    }
};

exports.unplanOrder = async (data) => {
    try {
        let { orderIds, user, timezone } = data, result = [], loadTempIdsArr = [];
        for (const [o, orderId] of orderIds.entries()) {
            let order = await Order.findAndCountAll({ where: { id: orderId } });
            let loadTempIds = order.rows[0].dataValues.loadTempIds,
                loadIds = order.rows[0].loadIds, info = order.rows[0].timeInfo;
            let newLoad, newLoadTemp;
            if (loadIds && loadIds.length) {
                for (const id of loadIds) {
                    delete info.loads[id];
                }
                newLoad = await Load_Controller.dropOrderFromLoads({
                    loadIds,
                    orderId,
                    user: user,
                    order,
                    timezone
                });
            }

            if (loadTempIds && loadTempIds.length) {
                loadTempIdsArr = loadTempIdsArr.concat(loadTempIds);
                for (const id of loadTempIds) {
                    delete info.loadTemps[id];
                }
                newLoadTemp = await LoadTemp_Controller.dropOrderFromLoadTemps({
                    loadTempIds,
                    orderId,
                    user: user,
                    order,
                    timezone
                }).catch(err => {
                    console.log(err);
                });
            }
            console.log(o, orderId);
            await Order.update({
                isPlanned: 0,
                confirmed: 0,
                flowTypes: [],
                loadIds: [],
                loadTempIds: [],
                timeInfo: {}
            }, {
                where: { id: orderId }
            }).catch(err => {
                console.log(err.message);
            });

            if (newLoadTemp && newLoadTemp.length) {
                for (const load of newLoadTemp) {
                    result.push({
                        status: load.status,
                        msg: load.msg
                    });
                }

            }
            if (newLoad && newLoad.length) {
                for (const load of newLoad) {
                    result.push({
                        status: load.status,
                        msg: load.msg
                    });
                }

            } else {
                result.push({
                    status: 0
                });
            }

        }
        return {
            result,
            loadTempIds: loadTempIdsArr
        };
    } catch (error) {
        console.log("Error: ", error.message);
        return await this.errorMsg(`unplanOrder: ${error.message}`);
    }
};
async function checkConsignee(consignee, data) {
    const { shipToCompanyName, shipToStreetAddress, shipToCity, shipToState, shipToZip, shipToCountry, shipToCountryCode, shipDateFrom, shipDateTo } = data;
    let status, msg, index = -1, newAddress;
    let lastIndex = consignee.dataValues.points.length - 1;
    const lastPoint = consignee.dataValues.points[lastIndex];
    for (const [x, y] of consignee.dataValues.points.entries()) {
        const address = y.address;
        if (shipToStreetAddress && shipToZip && shipToCity && address.streetAddress && address.zip && address.city) {
            if (stringFormatter(address.streetAddress) === stringFormatter(shipToStreetAddress) &&
                stringFormatter(address.zip) === stringFormatter(shipToZip) &&
                stringFormatter(address.city) === stringFormatter(shipToCity)) {
                index = x;
                status = 1;
                msg = "Ok";
                newAddress = {
                    ...address
                };
                return { status, msg, consignee, newAddress };
            }
        }
    }

    if (index < 0) {
        const add = `${shipToZip}+${shipToCity}+${shipToState}+${shipToStreetAddress}`;
        const isValidAddress = await Osmap.GeoLoc(add);
        let points;
        if (isValidAddress.data.status == "OK") {
            points = await Helpers.pushPoints({
                LatLons: {
                    deliveryLatLon: isValidAddress
                },
                order: {
                    deliveryZip: shipToZip,
                    deliveryCity: shipToCity,
                    deliveryState: shipToState,
                    deliveryCountry: shipToCountry,
                    deliveryCountryCode: shipToCountryCode,
                    deliveryStreetAddress: shipToStreetAddress,
                    deliverydateFrom: shipDateFrom,
                    deliverydateTo: shipDateTo
                },
                timeWindow: consignee.dataValues.points[0]
            });
            newAddress = {
                lat: isValidAddress.data.results[0].geometry.location.lat,
                lon: isValidAddress.data.results[0].geometry.location.lng,
                zip: shipToZip,
                city: shipToCity,
                state: shipToState,
                country: shipToCountry,
                countryCode: shipToCountryCode,
                streetAddress: shipToStreetAddress
            };
            // consignee.dataValues.points.push({
            //     address: newAddress
            // });
            consignee.dataValues.points = consignee.dataValues.points.concat(points);
            await Consignees.update({ points: consignee.dataValues.points }, {
                where: { id: consignee.id }
            });
            status = 1;
            msg = "Ok";
        } else {
            status = 1;
            msg = "Ok";
            newAddress = {
                ...lastPoint.address
            };
        }
    }
    return { status, msg, consignee, newAddress };
}

function stringFormatter(str) {
    const newStr = `${str}`;
    return newStr.toLowerCase().trim();
}

exports.uploadCreate = async (req, res) => {
    // console.log(req.body);
    //  type --> feet, weight, volume
    // let totalfeet = getTotals(req.body.handlingUnits, type);
    // let totalweight;
    // let totalvolume;
    try {
        // console.log("Create Order");
        const errors = await Errors.createOrderError(req.body.orders, req.companyName);
        if (errors.error) {
            res.status(409).json({
                status: errors.error,
                msg: errors.msg
            });
        } else {
            let apikey = req.headers["x-api-key"], key, userId, id;
            if (apikey) {
                key = new ClassApiKey({ data: { Key: apikey } });
                userId = await key.getBy();
            } else {
                console.log("no API key");
            }
            if (userId) {
                id = userId.key.userId;
            }
            let createdOrders = [], errorArr = [];
            let warning, message, warningArray = [];
            const settings = await Settings.findOne({
                where: {
                    userId: id
                }
            }).catch(err => {
                console.log("Settings not found: ", err.message);
            });
            let i = 0, upload = false;
            if (req.body.Automated) {
                upload = true;
            }
            for (const order of req.body.orders) {
                // let poOrder;
                // poOrder = await Order.findAndCountAll({ where: {po: order.po }});

                let pickupLatLon = {
                    lat: 0,
                    lon: 0
                }, deliveryLatLon = {
                    lat: 0,
                    lon: 0
                };
                let LatLons;
                let points, cons, consignee;
                if (order.consigneeName) {
                    const cons1 = await Consignees.findOne({
                        where: {
                            [Op.and]: [
                                sequelize.where(
                                    sequelize.fn("lower", sequelize.col("name")),
                                    sequelize.fn("lower", order.consigneeName.toLowerCase())

                                )
                            ]
                        },
                    });
                    const shipObj = {
                        shipToCompanyName: order.shipToCompanyName,
                        shipToStreetAddress: order.shipToStreetAddress,
                        shipToCity: order.shipToCity,
                        shipToState: order.shipToState,
                        shipToZip: order.shipToZip,
                        shipToCountry: order.shipToCountry,
                        shipToCountryCode: order.shipToCountryCode.toLowerCase(),
                        shipDateFrom: order.deliverydateFrom,
                        shipDateTo: order.deliverydateTo
                    };
                    const isValidConsignee = cons1 ? await checkConsignee(cons1, shipObj) : null;
                    if (isValidConsignee && isValidConsignee.status === 1) {
                        cons = isValidConsignee.consignee;
                        order.deliveryZip = isValidConsignee.newAddress.zip ? isValidConsignee.newAddress.zip : order.deliveryZip;
                        order.deliveryCity = isValidConsignee.newAddress.city ? isValidConsignee.newAddress.city : order.deliveryCity;
                        order.deliveryStreetAddress = isValidConsignee.newAddress.streetAddress ? isValidConsignee.newAddress.streetAddress : order.deliveryStreetAddress;
                        order.deliveryState = isValidConsignee.newAddress.state ? isValidConsignee.newAddress.state : order.deliveryState;
                        order.deliveryCountry = isValidConsignee.newAddress.country ? isValidConsignee.newAddress.country : order.deliveryCountry;
                        order.deliveryCountryCode = isValidConsignee.newAddress.countryCode ? isValidConsignee.newAddress.countryCode : order.deliveryCountryCode;
                        order.deliveryLon = isValidConsignee.newAddress.lon ? isValidConsignee.newAddress.lon : null;
                        order.deliveryLat = isValidConsignee.newAddress.lat ? isValidConsignee.newAddress.lat : null;
                    }
                    // !TODO make method to checking consigee from address
                }
                let pickupStr, deliveryStr, delivery, pickup, pickupAddress = {}, deliveryAddress = {};
                if (req.companyName == "limush" || req.companyName == "lm") {
                    pickupStr = `${order.pickupStreetAddress}`;
                    pickup = `${order.pickupStreetAddress}`;
                    deliveryStr = `${order.deliveryStreetAddress}`;
                    delivery = `${order.deliveryStreetAddress}`;
                } else {
                    pickupStr = `${order.pickupZip}+${order.pickupCity}+${order.pickupStreetAddress}+${order.pickupState}`;
                    pickup = `${order.pickupZip} ${order.pickupCity} ${order.pickupStreetAddress} ${order.pickupState}`;
                    deliveryStr = `${order.deliveryZip}+${order.deliveryCity}+${order.deliveryStreetAddress}+${order.deliveryState}`;
                    delivery = `${order.deliveryZip} ${order.deliveryCity} ${order.deliveryStreetAddress} ${order.deliveryState}`;
                }
                if (!order.deliveryLat && !order.deliveryLon && !cons && upload) {
                    LatLons = await Helpers.orderLatLon({
                        pickupAddr: !order.pickupLat && !order.pickupLon ? pickupStr : null,
                        deliveryAddr: !order.deliveryLat && !order.deliveryLon ? deliveryStr : null
                    });
                    pickupAddress = {
                        city: LatLons.pickupAddress.pickCity,
                        country: LatLons.pickupAddress.pickCountry,
                        countryCode: LatLons.pickupAddress.pickCountryCode.toLowerCase()
                    },
                        deliveryAddress = {
                            city: LatLons.deliveryAddress.delCity,
                            country: LatLons.deliveryAddress.delCountry,
                            countryCode: LatLons.deliveryAddress.delCountryCode.toLowerCase()
                        };
                    points = await Helpers.pushPoints({ LatLons, order });
                    consignee = await Consignee.createInTimeOrderCreate({
                        name: order.consigneeName,
                        companyLegalName: order.deliveryCompanyName,
                        serviceTime: order.serviceTime ? order.serviceTime : 0,
                        points: points,
                        proofSettings: settings.dataValues.proofDefault
                    });
                } else if (!order.deliveryLat && !order.deliveryLon && !cons && !upload) {
                    LatLons = await Helpers.orderLatLon({
                        pickupAddr: !order.pickupLat && !order.pickupLon ? pickupStr : null,
                        deliveryAddr: !order.deliveryLat && !order.deliveryLon ? deliveryStr : null
                    });
                    pickupAddress = {
                        city: LatLons.pickupAddress.pickCity,
                        country: LatLons.pickupAddress.pickCountry,
                        countryCode: LatLons.pickupAddress.pickCountryCode
                    },
                        deliveryAddress = {
                            city: LatLons.deliveryAddress.delCity,
                            country: LatLons.deliveryAddress.delCountry,
                            countryCode: LatLons.deliveryAddress.delCountryCode
                        };
                } else if (!order.deliveryLat && !order.deliveryLon && cons) {
                    for (const point of cons.dataValues.points) {
                        if (point.address.zip == order.deliveryZip && point.address.city == order.deliveryCity && point.address.state == order.deliveryState && point.address.country == order.deliveryCountry && point.address.countryCode == order.deliveryCountryCode && point.address.streetAddress == order.deliveryStreetAddress) {
                            order.deliveryLon = point.address.lon;
                            order.deliveryLat = point.address.lat;
                            deliveryAddress = {
                                city: point.address.city,
                                country: point.address.country,
                                countryCode: point.address.countryCode
                            };
                        }
                    }
                }
                // console.log(LatLons);
                if (order.pickupLon && order.pickupLat) {
                    pickupLatLon.lat = order.pickupLat;
                    pickupLatLon.lon = order.pickupLon;
                } else {
                    if (!LatLons || !LatLons.pickupLatLon) {
                        LatLons = await Helpers.orderLatLon({
                            pickupAddr: !order.pickupLat || !order.pickupLon ? pickupStr : null,
                        });
                        pickupAddress = {
                            city: LatLons.deliveryAddress.pickCity,
                            country: LatLons.deliveryAddress.pickCountry,
                            countryCode: LatLons.deliveryAddress.pickCountryCode
                        };
                    }
                    if (LatLons.pickupLatLon.data.status != "OK") {
                        return res.status(409).json({
                            error: true,
                            status: 0,
                            msg: [{
                                msg: "Invalid order address.",
                                key: "map"
                            }]
                        });
                    }
                    pickupLatLon.lat = LatLons.pickupLatLon.data.results[0].geometry.location.lat;
                    pickupLatLon.lon = LatLons.pickupLatLon.data.results[0].geometry.location.lng;
                }
                if (order.deliveryLon && order.deliveryLat) {
                    deliveryLatLon.lat = order.deliveryLat;
                    deliveryLatLon.lon = order.deliveryLon;
                } else {
                    if (!LatLons || !LatLons.deliveryLatLon) {
                        LatLons = await Helpers.orderLatLon({
                            deliveryAddr: !order.deliveryLat || !order.deliveryLon ? deliveryStr : null
                        });
                        deliveryAddress = {
                            city: LatLons.deliveryAddress.delCity,
                            country: LatLons.deliveryAddress.delCountry,
                            countryCode: LatLons.deliveryAddress.delCountryCode
                        };
                    }
                    if (LatLons.deliveryLatLon && LatLons.deliveryLatLon.data && LatLons.deliveryLatLon.data.status != "OK") {
                        return res.status(409).json({
                            error: true,
                            status: 0,
                            msg: [{
                                msg: "Invalid order address.",
                                key: "map"
                            }]
                        });
                    }
                    deliveryLatLon.lat = LatLons.deliveryLatLon.data.results[0].geometry.location.lat;
                    deliveryLatLon.lon = LatLons.deliveryLatLon.data.results[0].geometry.location.lng;
                }

                // console.log(LatLons.pickupLatLon.data.results[0].geometry.location);
                // console.log(LatLons.deliveryLatLon.data.results[0].geometry.location);
                let consignees;
                if (order.consigneeId) {
                    consignees = await Consignees.findOne({
                        where: {
                            id: order.consigneeId
                        }
                    });
                } else if (upload && cons) {
                    consignees = cons;
                } else if (upload && !cons) {
                    consignees = consignee.data;
                }
                //  = order.consigneeId ?  : null;
                let vendors = order.vendorId ? await Vendors.findOne({
                    where: {
                        id: order.vendorId
                    }
                }) : null;
                warning = false, message = "ok";
                const { distDur, msg, status } = await Warnings.createOrder({
                    pickupLat: pickupLatLon.lat,
                    pickupLon: pickupLatLon.lon,
                    deliveryLat: deliveryLatLon.lat,
                    deliveryLon: deliveryLatLon.lon
                });
                if (!status) {
                    warning = true,
                        message = msg;
                }

                if (order.products && order.products.length) {
                    let timeWindows;
                    timeWindows = await Check.newTimeWindow({
                        pickupdateFrom: order.pickupdateFrom,
                        pickupdateTo: order.pickupdateTo,
                        deliverydateFrom: order.deliverydateFrom,
                        deliverydateTo: order.deliverydateTo,
                        companyName: req.companyName
                    });
                    delete timeWindows.status;

                    let newOrder = await Order.create({
                        // Load type
                        loadtype: order.loadtype ? order.loadtype : 0,
                        // load_id: order.load_id,

                        flowType: order.flowType,
                        depoid: order.depoid,

                        // Pickup
                        pickupCompanyName: order.pickupCompanyName,
                        pickupState: order.pickupState,
                        pickupStreetAddress: order.pickupStreetAddress,
                        pickupLocationtypeid: order.pickupLocationtype,
                        // --
                        pickupCountry: order.pickupCountry ? order.pickupCountry : pickupAddress.country,
                        pickupCountryCode: order.pickupCountryCode ? order.pickupCountryCode.toLowerCase() : pickupAddress.countryCode.toLowerCase(),
                        pickupCity: order.pickupCity ? order.pickupCity : pickupAddress.city,
                        pickupZip: order.pickupZip,
                        pickupAccessorials: order.pickupAccessorials,
                        proof: consignees && consignees.dataValues.proofSettings ? consignees.dataValues.proofSettings : null,
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
                        deliveryCountry: order.deliveryCountry ? order.deliveryCountry : deliveryAddress.country,
                        deliveryCountryCode: order.deliveryCountryCode ? order.deliveryCountryCode.toLowerCase() : deliveryAddress.countryCode.toLowerCase(),
                        deliveryCity: order.deliveryCity ? order.deliveryCity : deliveryAddress.city,
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
                        rate: order.rate,

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
                        timeWindows,
                        mustbefirst: consignees.dataValues.mustbefirst,
                        crossDock: order.crossDock || 0
                    }).catch(err => {
                        console.log("Error Order create: ", err.message);
                    });
                    res.status(200).json({
                        status: 1,
                        warnings: warningArray,
                        warning: warningArray.length ? true : false,
                        msg: "Order created",
                        data: [newOrder.dataValues],
                        errors: errorArr,
                        error: errorArr.length ? true : false,
                    });
                    // .then(async newOrder => {
                    if (!status) {
                        warningArray.push({
                            warning,
                            orderId: newOrder.id,
                            message
                        });
                    }
                    let handlingUnits;
                    handlingUnits = await saveHandlingUnits(order.products, newOrder.id, req);
                    if (!handlingUnits) {
                        console.log("Error HandlingUnit: ");
                    }
                    const orderTypes = {
                        stackable: 0,
                        turnable: 0,
                        hazmat: 0
                    };
                    if (!handlingUnits.handlingUnit) {
                        console.log("error Handling", newOrder.id,);
                        return res.status(500).json({ status: 0, msg: "handling error" });
                    }
                    let cube = 0, feet = 0, weight = 0, specialneeds = [], quantity = 0;
                    for (const item of handlingUnits.handlingUnit) {
                        if (item.stackable) orderTypes.stackable = 1;
                        if (item.turnable) orderTypes.turnable = 1;
                        if (item.hazmat) orderTypes.hazmat = 1;
                        if (item.Length && item.Width && item.Height) {
                            let val = item.Length * item.Width * item.Height;
                            cube += (val * item.Quantity);
                        } else if (item.volume > 0) {
                            cube += (item.volume * item.Quantity);
                        }
                        feet += item.Length ? (item.Length * item.Quantity) : 0;

                        weight += item.Weight && item.Quantity ? (item.Weight * item.Quantity) : 0;
                        quantity += item.Quantity;
                        specialneeds.push({
                            id: item.id,
                            specialneeds: item.specialneeds
                        });
                    }
                    let servicetime = 0, pieceTime = 0;
                    if (order.flowType == 1) {
                        servicetime = order.serviceTime ? order.serviceTime
                            : vendors ? vendors.serviceTime
                                : settings ? settings.defaultServiceTime : 0;
                    } else if (order.flowType == 2) {
                        if (order.serviceTime) {
                            servicetime = order.serviceTime;
                        } else if (consignees) {
                            if (consignees.serviceTime) {
                                servicetime = consignees.dataValues.serviceTime;
                            } else {
                                if (settings) {
                                    servicetime = settings.dataValues.defaultServiceTime;
                                }
                            }
                        } else {
                            if (settings) {
                                servicetime = settings.dataValues.defaultServiceTime;
                            }
                        }
                        if (order.pieceTime) {
                            pieceTime = order.pieceTime;
                        } else {
                            if (settings) {
                                pieceTime = settings.dataValues.pieceTime ? settings.dataValues.pieceTime : 0;
                            }
                        }
                    } else if (order.flowType == 3) {
                        servicetime = order.serviceTime ? order.serviceTime
                            : settings ? settings.dataValues.defaultServiceTime : 0;
                    }
                    // servicetime = parseInt(servicetime, 10);
                    await Order.update({
                        orderTypes: orderTypes,
                        cube: cube,
                        feet: feet,
                        pieceCount: order.pieceCount ? order.pieceCount : quantity,
                        weight: weight,
                        specialneeds: specialneeds,
                        servicetime: servicetime + (pieceTime * order.pieceCount),
                        pieceTime: pieceTime
                    }, {
                        where: {
                            id: newOrder.id
                        }
                    }).catch(err => {
                        console.log("Error Order edit: ", err.message);
                    });
                    const updateOrder = await Order.findOne({
                        where: {
                            id: newOrder.id
                        }
                    });
                    if (newOrder.loadtype && newOrder.loadtype == "2" && order.createLoad) {

                        const loadTemp = await creatTempLoadsfromOrder(newOrder);
                        createdOrders.push({
                            ...updateOrder.dataValues,
                            "products": handlingUnits.handlingUnit,
                            loadTemp
                        });
                    } else {
                        createdOrders.push({
                            ...updateOrder.dataValues,
                            "products": handlingUnits.handlingUnit
                        });
                    }
                    // }).catch(err => {
                    //     console.log("55555", err.message);
                    //     errorArr.push({ status: 0, msg: err.message, err: err, data: order });
                    // });
                } else {
                    errorArr.push({
                        status: 0,
                        msg: "Add products to the order."
                    });
                }
            }
            // console.log("error Arr", errorArr);

        }
    } catch (error) {
        console.log("ERROR: ", error.message);
        res.status(500).json({ status: 0, msg: error.message });
    }
};

exports.uploadEdit = async (req, res) => {
    try {
        console.log("Update Order");
        let orders = [], upload = false;
        if (req.body.Automated) {
            upload = true;
        }
        orders.push(req.body);
        const errors = await Errors.createOrderError(orders, req.companyName);
        if (errors.error) {
            // console.log("error ----- here");
            return res.status(409).json({
                status: errors.error,
                msg: errors.msg
            });
        } else {
            let pickupLatLon = {
                lat: 0,
                lon: 0
            }, deliveryLatLon = {
                lat: 0,
                lon: 0
            };
            let points, cons, consignee;
            if (req.body.consigneeName) {
                const cons1 = await Consignees.findOne({
                    where: {
                        [Op.and]: [
                            sequelize.where(
                                sequelize.fn("lower", sequelize.col("name")),
                                sequelize.fn("lower", req.body.consigneeName.toLowerCase())
                            )
                        ]
                    },
                });
                const shipObj = {
                    shipToCompanyName: req.body.shipToCompanyName,
                    shipToStreetAddress: req.body.shipToStreetAddress,
                    shipToCity: req.body.shipToCity,
                    shipToState: req.body.shipToState,
                    shipToZip: req.body.shipToZip,
                    shipToCountry: req.body.shipToCountry,
                    shipToCountryCode: req.body.shipToCountryCode
                };
                const isValidConsignee = cons1 ? await checkConsignee(cons1, shipObj) : null;
                if (isValidConsignee && isValidConsignee.status === 1) {
                    cons = isValidConsignee.consignee;
                    req.body.deliveryZip = isValidConsignee.newAddress.zip ? isValidConsignee.newAddress.zip : req.body.deliveryZip;
                    req.body.deliveryCity = isValidConsignee.newAddress.city ? isValidConsignee.newAddress.city : req.body.deliveryCity;
                    req.body.deliveryStreetAddress = isValidConsignee.newAddress.streetAddress ? isValidConsignee.newAddress.streetAddress : req.body.deliveryStreetAddress;
                    req.body.deliveryState = isValidConsignee.newAddress.state ? isValidConsignee.newAddress.state : req.body.deliveryState;
                    req.body.deliveryCountry = isValidConsignee.newAddress.country ? isValidConsignee.newAddress.country : req.body.deliveryCountry;
                    req.body.deliveryCountryCode = isValidConsignee.newAddress.countryCode ? isValidConsignee.newAddress.countryCode : req.body.deliveryCountryCode;
                    req.body.deliveryLon = isValidConsignee.newAddress.lon ? isValidConsignee.newAddress.lon : null;
                    req.body.deliveryLon = isValidConsignee.newAddress.lon ? isValidConsignee.newAddress.lon : null;
                }
            }
            let LatLons, userId, userKeyData;
            let pickupStr, deliveryStr, delivery, pickup, pickupAddress = {}, deliveryAddress = {};
            let apikey = req.headers["x-api-key"], key;
            if (apikey) {
                key = new ClassApiKey({ data: { Key: apikey } });
                userKeyData = await key.getBy();
            }
            if (userKeyData) {
                userId = userKeyData.key.userId;
            }
            let settings, id, orderObj,
                consignees, vendors, warning, message, changeOrder, order;
            //
            settings = await Settings.findOne({
                where: {
                    userId: userId
                }
            });
            if (req.companyName == "limush" || req.companyName == "lm") {
                pickupStr = `${req.body.pickupStreetAddress}`;
                pickup = `${req.body.pickupStreetAddress}`;
                deliveryStr = `${req.body.deliveryStreetAddress}`;
                delivery = `${req.body.deliveryStreetAddress}`;
            } else {
                pickupStr = `${req.body.pickupZip}+${req.body.pickupCity}+${req.body.pickupStreetAddress}+${req.body.pickupState}`;
                pickup = `${req.body.pickupZip} ${req.body.pickupCity} ${req.body.pickupStreetAddress} ${req.body.pickupState}`;
                deliveryStr = `${req.body.deliveryZip}+${req.body.deliveryCity}+${req.body.deliveryStreetAddress}+${req.body.deliveryState}`;
                delivery = `${req.body.deliveryZip} ${req.body.deliveryCity} ${req.body.deliveryStreetAddress} ${req.body.deliveryState}`;
            }
            if (!req.body.deliveryLat && !req.body.deliveryLon && !cons && upload) {
                LatLons = await Helpers.orderLatLon({
                    pickupAddr: !req.body.pickupLat && !req.body.pickupLon ? pickupStr : null,
                    deliveryAddr: !req.body.deliveryLat && !req.body.deliveryLon ? deliveryStr : null
                });
                pickupAddress = {
                    city: LatLons.pickupAddress.pickCity,
                    country: LatLons.pickupAddress.pickCountry,
                    countryCode: LatLons.pickupAddress.pickCountryCode
                },
                    deliveryAddress = {
                        city: LatLons.deliveryAddress.delCity,
                        country: LatLons.deliveryAddress.delCountry,
                        countryCode: LatLons.deliveryAddress.delCountryCode
                    };
                points = await Helpers.pushPoints({ LatLons, order: req.body });
                consignee = await Consignee.createInTimeOrderCreate({
                    name: req.body.consigneeName,
                    companyLegalName: req.body.deliveryCompanyName,
                    serviceTime: req.body.serviceTime ? req.body.serviceTime : 0,
                    points: points,
                    proofSettings: settings.dataValues.proofDefault

                });
                // console.log("-----", consignee);
            } else if (!req.body.deliveryLat && !req.body.deliveryLon && !cons && !upload) {
                LatLons = await Helpers.orderLatLon({
                    pickupAddr: !req.body.pickupLat && !req.body.pickupLon ? pickupStr : null,
                    deliveryAddr: !req.body.deliveryLat && !req.body.deliveryLon ? deliveryStr : null
                });
                pickupAddress = {
                    city: LatLons.pickupAddress.pickCity,
                    country: LatLons.pickupAddress.pickCountry,
                    countryCode: LatLons.pickupAddress.pickCountryCode
                },
                    deliveryAddress = {
                        city: LatLons.deliveryAddress.delCity,
                        country: LatLons.deliveryAddress.delCountry,
                        countryCode: LatLons.deliveryAddress.delCountryCode
                    };
            } else if (!req.body.deliveryLat && !req.body.deliveryLon && cons) {
                for (const point of cons.dataValues.points) {
                    if (point.address.zip == req.body.deliveryZip && point.address.city == req.body.deliveryCity && point.address.state == req.body.deliveryState && point.address.country == req.body.deliveryCountry && point.address.countryCode == req.body.deliveryCountryCode && point.address.streetAddress == req.body.deliveryStreetAddress) {
                        req.body.deliveryLon = point.address.lon;
                        req.body.deliveryLat = point.address.lat;
                        deliveryAddress = {
                            city: point.address.city,
                            country: point.address.country,
                            countryCode: point.address.countryCode
                        };
                    }
                }
            }
            if (req.body.pickupLon && req.body.pickupLat) {
                pickupLatLon.lat = req.body.pickupLat;
                pickupLatLon.lon = req.body.pickupLon;
            } else {
                if (!LatLons || !LatLons.pickupLatLon) {
                    LatLons = await Helpers.orderLatLon({
                        pickupAddr: !req.body.pickupLat || !req.body.pickupLon ? pickupStr : null,
                    });
                    pickupAddress = {
                        city: LatLons.deliveryAddress.pickCity,
                        country: LatLons.deliveryAddress.pickCountry,
                        countryCode: LatLons.deliveryAddress.pickCountryCode
                    };
                }
                if (LatLons.pickupLatLon.data.status != "OK") {
                    return res.status(409).json({
                        error: true,
                        status: 0,
                        msg: [{
                            msg: "Invalid order address.",
                            key: "map"
                        }]
                    });
                }
                pickupLatLon.lat = LatLons.pickupLatLon.data.results[0].geometry.location.lat;
                pickupLatLon.lon = LatLons.pickupLatLon.data.results[0].geometry.location.lng;
            }
            if (req.body.deliveryLon && req.body.deliveryLat) {
                deliveryLatLon.lat = req.body.deliveryLat;
                deliveryLatLon.lon = req.body.deliveryLon;
            } else {
                if (!LatLons || !LatLons.deliveryLatLon) {
                    LatLons = await Helpers.orderLatLon({
                        deliveryAddr: !req.body.deliveryLat || !req.body.deliveryLon ? deliveryStr : null
                    });
                    deliveryAddress = {
                        city: LatLons.deliveryAddress.delCity,
                        country: LatLons.deliveryAddress.delCountry,
                        countryCode: LatLons.deliveryAddress.delCountryCode
                    };
                }
                if (LatLons.deliveryLatLon && LatLons.deliveryLatLon.data && LatLons.deliveryLatLon.data.status != "OK") {
                    return res.status(409).json({
                        error: true,
                        status: 0,
                        msg: [{
                            msg: "Invalid order address.",
                            key: "map"
                        }]
                    });
                }
                if (!LatLons.deliveryLatLon || !LatLons.deliveryLatLon.data) {
                    console.log(LatLons.deliveryLatLon.data.results[0].geometry.location.lat);
                }
                deliveryLatLon.lat = LatLons.deliveryLatLon.data.results[0].geometry.location.lat;
                deliveryLatLon.lon = LatLons.deliveryLatLon.data.results[0].geometry.location.lng;
            }
            // deliveryLatLon.lat = LatLons.deliveryLatLon.data.results[0].geometry.location.lat;
            // deliveryLatLon.lon = LatLons.deliveryLatLon.data.results[0].geometry.location.lng;
            // pickupLatLon.lat = LatLons.pickupLatLon.data.results[0].geometry.location.lat;
            // pickupLatLon.lon = LatLons.pickupLatLon.data.results[0].geometry.location.lng;

            // consignee = req.body.consigneeId ? await Consignees.findOne({
            //     where: {
            //         id: req.body.consigneeId
            //     }
            // }) : null;
            if (req.body.consigneeId) {
                consignees = await Consignees.findOne({
                    where: {
                        id: req.body.consigneeId
                    }
                });
            } else if (upload && cons) {
                consignees = cons;
            } else if (upload && !cons) {
                consignees = consignee.data;
            }
            vendors = req.body.vendorId ? await Vendors.findOne({
                where: {
                    id: req.body.vendorId
                }
            }) : null;
            // Get data for single 
            warning = false, message = "Order Edited";
            const { distDur, msg, status } = await Warnings.editOrder({
                pickupLat: pickupLatLon.lat,
                pickupLon: pickupLatLon.lon,
                deliveryLat: deliveryLatLon.lat,
                deliveryLon: deliveryLatLon.lon
            });
            if (!status) {
                warning = true,
                    message = msg;
            }
            id = req.params.id;
            let timeWindows;
            timeWindows = await Check.newTimeWindow({
                pickupdateFrom: req.body.pickupdateFrom,
                pickupdateTo: req.body.pickupdateTo,
                deliverydateFrom: req.body.deliverydateFrom,
                deliverydateTo: req.body.deliverydateTo,
                companyName: req.companyName
            });
            delete timeWindows.status;
            orderObj = {
                id: id,
                // Load type
                loadtype: req.body.loadtype ? req.body.loadtype : 0,
                // load_id: req.body.load_id,
                flowType: req.body.flowType,
                // depoid: req.body.deliveryDepoId,
                depoid: req.body.depoid ? req.body.depoid * 1 : 0,

                // Pickup
                pickupCompanyName: req.body.pickupCompanyName,
                pickupState: req.body.pickupState,
                pickupStreetAddress: req.body.pickupStreetAddress,
                pickupLocationtypeid: req.body.pickupLocationtype,
                // --
                pickupCountry: req.body.pickupCountry ? req.body.pickupCountry : pickupAddress.country,
                pickupCountryCode: req.body.pickupCountryCode ? req.body.pickupCountryCode.toLowerCase() : pickupAddress.countryCode.toLowerCase(),
                pickupCity: req.body.pickupCity ? req.body.pickupCity : pickupAddress.city,
                pickupZip: req.body.pickupZip,
                pickupAccessorials: req.body.pickupAccessorials,
                // --
                pickupdateFrom: new Date(req.body.pickupdateFrom),
                pickupdateTo: new Date(req.body.pickupdateTo),
                // --
                pickupLon: pickupLatLon.lon,
                pickupLat: pickupLatLon.lat,

                vendorid: req.body.vendorId ? req.body.vendorId * 1 : 0,
                consigneeid: consignees ? consignees.dataValues.id : 0,
                proof: consignees && consignees.dataValues.proofSettings ? consignees.dataValues.proofSettings : null,
                // Delivery
                deliveryCompanyName: req.body.deliveryCompanyName,
                deliveryState: req.body.deliveryState,
                deliveryStreetAddress: req.body.deliveryStreetAddress,
                deliveryLocationtypeid: req.body.deliveryLocationtype,
                // --
                deliveryCountry: req.body.deliveryCountry ? req.body.deliveryCountry : deliveryAddress.country,
                deliveryCountryCode: req.body.deliveryCountryCode ? req.body.deliveryCountryCode.toLowerCase() : deliveryAddress.countryCode.toLowerCase(),
                deliveryCity: req.body.deliveryCity ? req.body.deliveryCity : deliveryAddress.city,
                deliveryZip: req.body.deliveryZip,
                deliveryAccessorials: req.body.deliveryAccessorials,
                // --
                deliverydateFrom: new Date(req.body.deliverydateFrom),
                deliverydateTo: new Date(req.body.deliverydateTo),
                // --
                deliveryLon: deliveryLatLon.lon,
                deliveryLat: deliveryLatLon.lat,

                // Equipment Type
                eqType: req.body.eqType,

                // References
                bol: req.body.bol,
                pro: req.body.pro,
                po: req.body.po,

                // Rating
                currency: req.body.currency,
                rate: req.body.rate,

                // Notes
                notes: req.body.notes,

                //// Dimentions
                pallet: null,

                // Other
                companyid: 0, // req.body.companyid ,
                carrierid: 0, // req.body.carrierid ,
                customerid: 0, // req.body.customerid ,

                //// Other
                custDistance: status ? distDur.distance : 0,
                custDuration: status ? distDur.duration : 0,
                bh: req.body.bh,
                delivery: `${delivery}, ${req.body.deliveryCountry}`,
                pickup: `${pickup}, ${req.body.pickupCountry}`,
                pieceCount: req.body.pieceCount ? req.body.pieceCount : 0,
                pieceTime: req.body.pieceTime ? req.body.pieceTime : 0,
                timeWindows,
                mustbefirst: consignees.dataValues.mustbefirst,
                crossDock: req.body.crossDock || 0
            };
            changeOrder = await Order.update({
                ...orderObj
            }, {
                where: { id: id }
            });
            order = await Order.findOne({
                where: {
                    id: id
                }
            });
            if (changeOrder[0]) {
                res.status(200).json({
                    status: 1,
                    warning,
                    msg: message,
                    data: [{
                        ...order.dataValues
                    }],
                    error: false,
                });
            } else {
                return res.status(200).json({
                    status: 1,
                    msg: "Order doesn\"t changed",
                    data: {}
                });
            }
            let cube = 0, feet = 0, weight = 0, specialneeds = [], handlingUnits, quantity = 0;
            let orderTypes = { stackable: 0, turnable: 0, hazmat: 0 };
            if (req.body.removeProductIds && req.body.removeProductIds.length) { await removeHandlingUnits(req.body.removeProductIds); }
            if (req.body.products && req.body.products.length) {
                handlingUnits = await saveHandlingUnits(req.body.products, id, req);
                for (const item of handlingUnits.handlingUnit) {
                    if (item.stackable) orderTypes.stackable = 1;
                    if (item.turnable) orderTypes.turnable = 1;
                    if (item.hazmat) orderTypes.hazmat = 1;
                    if (item.Length && item.Width && item.Height) {
                        let val = item.Length * item.Width * item.Height;
                        cube += (val * item.Quantity);
                    } else
                        if (item.volume > 0) {
                            cube += (item.volume * item.Quantity);
                        }

                    feet += item.Length ? (item.Length * item.Quantity) : 0;
                    weight += item.Weight && item.Quantity ? (item.Weight * item.Quantity) : 0;
                    quantity += item.Quantity;
                    specialneeds.push({ id: item.id, specialneeds: item.specialneeds });
                }
            }
            let servicetime;
            if (req.body.flowType == 1) {
                servicetime = req.body.serviceTime ? req.body.serviceTime
                    : vendors ? vendors.serviceTime
                        : settings ? settings.dataValues.defaultServiceTime : 0;
            } else if (req.body.flowType == 2) {
                if (req.body.serviceTime) {
                    servicetime = req.body.serviceTime;
                } else if (consignees) {
                    if (consignees.serviceTime) {
                        servicetime = consignees.dataValues.serviceTime;
                    } else {
                        if (settings) {
                            servicetime = settings.dataValues.defaultServiceTime;
                        }
                    }
                } else {
                    if (settings) {
                        servicetime = settings.dataValues.defaultServiceTime;
                    }
                }
            } else if (req.body.flowType == 3) {
                servicetime = req.body.serviceTime ? req.body.serviceTime
                    : settings ? settings.dataValues.defaultServiceTime : 0;
            }
            servicetime = parseInt(servicetime, 10);
            await Order.update({
                cube,
                feet,
                weight,
                pieceCount: req.body.pieceCount ? req.body.pieceCount : quantity,
                specialneeds: specialneeds,
                orderTypes: orderTypes,
                servicetime
            }, {
                where: { id: id }
            });
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: 0,
            error,
            msg: error.message
        });
    }

};

exports.getLoads = async (req, res) => {
    try {
        let { loadTempIds, loadIds } = req.query, arrLoadIds, arrLoadTempIds, loads, loadTemps, data = {};
        arrLoadIds = loadIds && loadIds.length ? await Helpers.splitToIntArray(loadIds, ",") : null;
        arrLoadTempIds = loadTempIds && loadTempIds.length ? await Helpers.splitToIntArray(loadTempIds, ",") : null;

        if (arrLoadIds) {
            loads = await Load.findAndCountAll({
                attributes: ["id", "nickname"],
                where: { id: { [Op.in]: arrLoadIds } }
            });
            data.loads = loads.rows;
        }
        if (arrLoadTempIds) {
            loadTemps = await LoadTemp.findAndCountAll({
                attributes: ["id", "nickname"],
                where: {
                    id: { [Op.in]: arrLoadTempIds },
                    disabled: 0
                }
            });
            data.loadTemps = loadTemps.rows;
        }
        res.json({
            status: 1,
            data
        });

    } catch (error) {
        console.log("Error: ", error.message);
        res.status(409).json(await Helpers.errorMsg(error.message));
    }
};

exports.bulkEditPlanningOrders = async (data) => {
    let { orderIds } = data;
    let orders, loadTempIds = [], loadIds = [];
    orders = await Order.findAndCountAll({
        attributes: ["loadIds", "loadTempIds"],
        where: {
            id: {
                [Op.in]: orderIds
            }
        }
    });
    for (const order of orders.rows) {
        loadTempIds = loadTempIds.concat(order.loadTempIds);
        loadIds = loadIds.concat(order.loadIds);
    }
};

exports.bulkEdit = async (req, res) => {
    const { depotId, orderIds, type } = req.body;
    let timeWindow = {};

    for (const item in req.body) {
        if (item == "deliverydateFrom" && req.body[item]) {
            timeWindow[item] = req.body[item];
            timeStatus = 1;
        }
        if (item == "deliverydateTo" && req.body[item]) {
            timeWindow[item] = req.body[item];
            timeStatus = 1;
        }
        if (item == "pickupdateFrom" && req.body[item]) {
            timeWindow[item] = req.body[item];
            timeStatus = 1;
        }
        if (item == "pickupdateTo" && req.body[item]) {
            timeWindow[item] = req.body[item];
            timeStatus = 1;
        }
    };

    let errorStatus;
    errorStatus = await Helpers.checkErrors({ depotId, orderIds });
    if (!errorStatus) {
        return res.status(409).json({
            status: errorStatus,
            msg: "invalid data"
        });
    };

    const orders = await Order.findAll({ where: { id: { [Op.in]: orderIds } } });

    const orderBulkeditBodyType = {
        pickup: 0,
        delivery: 1
    };

    let depo = await Depo.findOne({ where: { id: depotId } });

    orders.map(async item => {
        let updateBody = {};
        if (!depo) depo = await Depo.findOne({ where: { id: item.dataValues.depoid } });
        if (type === 0 || type ===  1) {
            if (type === orderBulkeditBodyType.pickup) {
                updateBody = {
                    orderType: type,
                    depoid: depo.dataValues.id,
                    deliveryCompanyName: depo.dataValues.name,
                    deliveryStreetAddress: depo.dataValues.streetaddress,
                    deliveryCity: depo.dataValues.city,
                    deliveryState: depo.dataValues.state,
                    deliveryZip: depo.dataValues.zip,
                    deliveryCountry: depo.dataValues.country,
                    deliveryCountryCode: depo.dataValues.countryCode,
                    deliveryLon: depo.dataValues.lon,
                    deliveryLat: depo.dataValues.lat,
                    delivery: `${depo.dataValues.zip} ${depo.dataValues.city} ${depo.dataValues.streetaddress} ${depo.dataValues.state}`,
                };
            } else if (type === orderBulkeditBodyType.delivery) {
                updateBody = {
                    orderType: type,
                    depoid: depo.dataValues.id,
                    pickupCompanyName: depo.dataValues.name,
                    pickupStreetAddress: depo.dataValues.streetaddress,
                    pickupCity: depo.dataValues.city,
                    pickupState: depo.dataValues.state,
                    pickupZip: depo.dataValues.zip,
                    pickupCountry: depo.dataValues.country,
                    pickupCountryCode: depo.dataValues.countryCode,
                    pickupLon: depo.dataValues.lon,
                    pickupLat: depo.dataValues.lat,
                    pickup: `${depo.dataValues.zip} ${depo.dataValues.city} ${depo.dataValues.streetaddress} ${depo.dataValues.state}`,
                };
            };
        } 
        if (depotId && depo && type !== 0 && type !== 1) {
            updateBody = {
                depoid: depo.dataValues.id,
                pickupCompanyName: depo.dataValues.name,
                pickupStreetAddress: depo.dataValues.streetaddress,
                pickupCity: depo.dataValues.city,
                pickupState: depo.dataValues.state,
                pickupZip: depo.dataValues.zip,
                pickupCountry: depo.dataValues.country,
                pickupCountryCode: depo.dataValues.countryCode,
                pickupLon: depo.dataValues.lon,
                pickupLat: depo.dataValues.lat,
                pickup: `${depo.dataValues.zip} ${depo.dataValues.city} ${depo.dataValues.streetaddress} ${depo.dataValues.state}`,
            };
            if (type) {
                updateBody.type = type;
            }
        };
        console.log({
            ...updateBody,
            ...timeWindow 
        });
        await Order.update({
            ...updateBody,
            ...timeWindow
        }, {
            where: { id: item.dataValues.id }
        });
    });

    res.json({
        status: 1,
        msg: 'ok'
    });
};

// exports.bulkEdit = async (req, res) => {
//     let { depotId, orderIds, editMode, type } = req.body, depo, pickup, delivery, timeWindow = {}, depoObj = {}, timeStatus = 0, typeObj = {};
//     let where = {
//         id: {
//             [Op.in]: orderIds
//         }
//     };
//     for (const item in req.body) {
//         if (item == "deliverydateFrom" && req.body[item]) {
//             timeWindow[item] = req.body[item];
//             timeStatus = 1;
//         }
//         if (item == "deliverydateTo" && req.body[item]) {
//             timeWindow[item] = req.body[item];
//             timeStatus = 1;
//         }
//         if (item == "pickupdateFrom" && req.body[item]) {
//             timeWindow[item] = req.body[item];
//             timeStatus = 1;
//         }
//         if (item == "pickupdateTo" && req.body[item]) {
//             timeWindow[item] = req.body[item];
//             timeStatus = 1;
//         }
//     }
//     let orders, errorStatus;
//     errorStatus = await Helpers.checkErrors({ depotId, orderIds });
//     if (!errorStatus) {
//         return res.status(409).json({
//             status: errorStatus,
//             msg: "invalid data"
//         });
//     }
//     // if (editMode) {
//     // bulkEditPlanningOrders({orderIds})
//     // }
//     depo = await Depo.findOne({ where: { id: depotId } });

//     if (depo && req.companyName == "limush" || req.companyName == "lm") pickup = `${depo.dataValues.streetaddress}`;

//     const orderBulkeditBodyType = {
//         pickup: 0,
//         delivery: 1
//     };

//     let updatedAddress = {};
//     if (!!type && depo) {
//         if (type === orderBulkeditBodyType.pickup) {
//             delivery = `${depo.dataValues.zip} ${depo.dataValues.city} ${depo.dataValues.streetaddress} ${depo.dataValues.state}`;
//         } else if (type === orderBulkeditBodyType.delivery) {
//             pickup = `${depo.dataValues.zip} ${depo.dataValues.city} ${depo.dataValues.streetaddress} ${depo.dataValues.state}`;
//         }
//     }

//     if (!type && depo) {
//         if (pickup) {
//             updatedAddress = {
//                 depoid: depotId,
//                 pickupCompanyName: depo.dataValues.name,
//                 pickupStreetAddress: depo.dataValues.streetaddress,
//                 pickupCity: depo.dataValues.city,
//                 pickupState: depo.dataValues.state,
//                 pickupZip: depo.dataValues.zip,
//                 pickupCountry: depo.dataValues.country,
//                 pickupCountryCode: depo.dataValues.countryCode,
//                 pickupLon: depo.dataValues.lon,
//                 pickupLat: depo.dataValues.lat,
//                 pickup: pickup,
//             };
//         } else if (delivery) {
//             updatedAddress = {
//                 depoid: depotId,
//                 deliveryCompanyName: depo.dataValues.name,
//                 deliveryStreetAddress: depo.dataValues.streetaddress,
//                 deliveryCity: depo.dataValues.city,
//                 deliveryState: depo.dataValues.state,
//                 deliveryZip: depo.dataValues.zip,
//                 deliveryCountry: depo.dataValues.country,
//                 deliveryCountryCode: depo.dataValues.countryCode,
//                 deliveryLon: depo.dataValues.lon,
//                 deliveryLat: depo.dataValues.lat,
//                 delivery: delivery,
//             };
//         }
//     };

//     let orderCl = new orderClass({
//         data: {
//             ...updatedAddress,
//             ...timeWindow,
//             orderType: type
//         },
//         where
//     });
//     await orderCl.update();

//     res.json({
//         status: 1,
//         orders
//     });
//     if (timeStatus) {
//         orderCl = new orderClass({ data: { orderIds, companyName: req.companyName } });
//         await orderCl.changeTimeWindows();
//     }
// };

exports.upload = async (req, res) => {
    const uid = uuidv1();
    let fileArr = [], type = 2, info;
    info = await Helpers.getRemoteInfoForKey(req);
    if (!info) {
        console.log("fail on remote Info:");
        return res.json(await Helpers.getResponse(0, "fail on remote Info."));
    }
    let { saveFields, timezone, depotId, fileHeaders, fileName } = req.body;
    let depo = depotId ? await Depo.findOne({ where: { id: depotId } }) : null;
    let settings = req.user.id ? await Settings.findOne({ where: { userId: req.user.id } }) : null;
    let globalSettings = await GlobalSettings.findOne();
    if (!depo || !settings) {
        console.log("null depo or settings");
        return res.json(await Helpers.getResponse(0, "null depo or settings."));
    }
    if (saveFields != 0 && fileHeaders && req.user.id) {
        await Settings.update({ fileHeaders: JSON.parse(fileHeaders) }, {
            where: {
                userId: req.user.id
            }
        });
    }
    const upClass = new UploadClass({ data: { UUID: uid } });
    await upClass.create();
    let logicCl = new Logics({
        data: JSON.parse(req.body.changedFile),
        info: {
            uuid: uid,
            userId: req.user.id,
            fileName,
            serviceTime: globalSettings.dataValues.defaultServiceTime,
            pieceTime: globalSettings.dataValues.pieceTime,
            userType: settings.dataValues.userType,
            proofSettings: settings.dataValues.proofDefault,
            companyName: req.companyName
        },
        timezone,
        depo,
        fileHeaders,
        req
    });
    await logicCl.UploadAll().catch(err => {
        console.log(err.message);
    });
    res.json({
        status: 1,
        data: [],
        UUID: uid,
    });


};

exports.scriptAddress = async (req, res) => {
    try {
        let orders;
        orders = await Order.findAndCountAll();
        for (const order of orders.rows) {
            if (!order.delivery) {
                console.log(order.id);
                await Order.update({
                    delivery: `${order.deliveryStreetAddress}, ${order.deliveryCity}, ${order.deliveryState} ${order.deliveryZip}, ${order.deliveryCountry}`,
                }, { where: { id: order.id } });
            }
            if (!order.pickup) {

                await Order.update({
                    pickup: `${order.pickupStreetAddress}, ${order.pickupCity}, ${order.pickupState} ${order.pickupZip}, ${order.pickupCountry}`,
                }, { where: { id: order.id } });
            }
        }
        res.json({
            status: 1
        });
    } catch (error) {
        console.log(error);
    }
};

exports.scriptLatLon = async (req, res) => {
    const sortAndPagiantion = await Helpers.sortAndPagination(req);
    const where = req.query;
    const data = await Helpers.filters(where, Op);
    const orders = await Order.findAndCountAll({ where: data.where, ...sortAndPagiantion });
    let i = 0;
    for (const order of orders.rows) {
        let pickupAddress = `${order.pickupZip}+${order.pickupCity}+${order.pickupStreetAddress}+${order.pickupState}`;
        let deliveryAddress = `${order.deliveryZip}+${order.deliveryCity}+${order.deliveryStreetAddress}+${order.deliveryState}`;
        let pickupData = !order.pickupLat && !order.pickupLon ? await Osmap.GeoLoc(pickupAddress) : null;
        let deliveryData = !order.deliveryLat && !order.deliveryLon ? await Osmap.GeoLoc(deliveryAddress) : null;
        let pickupLat,
            pickupLon,
            deliveryLat,
            deliveryLon;
        try {
            if (pickupData) {
                pickupLat = pickupData.data.results[0].geometry.location.lat;
                pickupLon = pickupData.data.results[0].geometry.location.lng;
            }
            if (deliveryData) {
                deliveryLat = deliveryData.data.results[0].geometry.location.lat,
                    deliveryLon = deliveryData.data.results[0].geometry.location.lng;
            }

        } catch (error) {
            console.log("id", order.id);

        }
        if (pickupData) {
            await Order.update({
                pickupLat,
                pickupLon
            }, {
                where: {
                    id: order.id
                }
            }).then(o => {
                console.log(i, o);
                i++;
            }).catch(err => {
                console.log(order.id, err);
            });
        }
        if (deliveryData) {
            await Order.update({
                deliveryLat,
                deliveryLon,
            }, {
                where: {
                    id: order.id
                }
            }).then(o => {
                console.log(i, o);
                i++;
            }).catch(err => {
                console.log(order.id, err);
            });
        }


    }
    res.json({
        msg: "ok",
        status: 1
    });
};

exports.scriptEditCube = async (req, res) => {
    try {
        let orders, handlingUnit;
        orders = await Order.findAndCountAll({});
        let i = 0;
        for (const order of orders.rows) {
            i++;
            handlingUnit = await HandlingUnit.findAndCountAll({
                attributes: ["id"],
                where: {
                    orders_id: order.id
                }
            });
            console.log(i, order.id);

            if (handlingUnit.count == 1) {
                await HandlingUnit.update({
                    HandlingType_id: 11,
                    Quantity: order.pieceCount,
                    Weight: order.pieceCount ? order.weight / order.pieceCount : 0,
                    volume: order.pieceCount ? order.cube / order.pieceCount : 0
                }, {
                    where: {
                        id: handlingUnit.rows[0].dataValues.id
                    }
                });
            } else if (handlingUnit.count == 0) {
                await HandlingUnit.create({
                    orders_id: order.id,
                    HandlingType_id: 11,
                    Quantity: order.pieceCount,
                    Weight: order.pieceCount ? order.weight / order.pieceCount * 1 : 0,
                    volume: order.pieceCount ? order.cube * 1 / order.pieceCount * 1 : 0
                });
            }
        }
        res.json({
            status: 1,
            msg: "ok"
        });
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: "Error",
            error
        });
    }
};

exports.scriptUpdateTimeWindows = async (req, res) => {
    try {
        let orders;
        orders = await Order.findAndCountAll();
        let i = 0;
        for (const order of orders.rows) {
            let timeWindows;
            timeWindows = await Check.newTimeWindow({
                pickupdateFrom: order.dataValues.pickupdateFrom,
                pickupdateTo: order.dataValues.pickupdateTo,
                deliverydateFrom: order.dataValues.deliverydateFrom,
                deliverydateTo: order.dataValues.deliverydateTo,
                companyName: req.companyName
            });
            console.log(i, order.dataValues.id);
            await Order.update({
                timeWindows
            }, { where: { id: order.dataValues.id } });
            i++;
        }
        res.json({
            status: 1
        });
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: "Error: " + error.message,
            error
        });
    }
};

exports.scriptCreateOrder = async (req, res) => {
    let orders = await Order.findAndCountAll({}), consignees;
    let order = orders.rows[0].dataValues;
    let handlingUnit = await HandlingUnit.findOne({
        where: { orders_id: order.id }
    });
    consignees = await Consignees.findAndCountAll({

    });

    for (const [c, consignee] of consignees.rows.entries()) {
        console.log(c);
        delete order.id;
        let addr = consignee.dataValues.points[0].address;
        let orderCl = new orderClass({
            data: {
                order: {
                    ...order,
                    deliverydateFrom: "2021-02-14T02:00:00Z",
                    deliverydateTo: "2021-02-14T12:30:00Z",
                    delivery: `${addr.streetAddress}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}`,
                    deliveryCompanyName: consignee.companyLegalName,
                    deliveryStreetAddress: addr.streetAddress,
                    deliveryCity: addr.city,
                    deliveryState: addr.state,
                    deliveryZip: addr.zip,
                    deliveryCountry: addr.country,
                    deliveryCountryCode: addr.countryCode,
                    deliveryLon: addr.lon,
                    deliveryLat: addr.lat,
                    consigneeid: consignee.dataValues.id
                },
                consignees: {
                    ...consignee
                },
                pickupLatLon: {
                    lat: order.pickupLat,
                    lon: order.pickupLon
                },
                deliveryLatLon: {
                    lat: addr.lat,
                    lon: addr.lon
                },
                dist: order.custDistance,
                dur: order.custDuration,
                delivery: `${addr.streetAddress}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}`,
                pickup: order.pickup,
                status: 0

            }
        });
        let newOrd = await orderCl.create();
        let handCl = new HandlingClass({
            data: {
                ...handlingUnit.dataValues,
                orders_id: newOrd.dataValues.id
            }
        });
        await handCl.create();
    }
    res.json({
        status: 1
    });

};

exports.scriptUpdateOrderAddr = async (req, res) => {
    let orders = await Order.findAndCountAll({
        include: includeFalse
    });
    for (const [o, order] of orders.rows.entries()) {
        let orderData = order.dataValues;
        let consignee = orderData.consignee.dataValues;
        let addr = consignee.points[0].address;
        Order.update({
            deliverydateFrom: orderData.deliverydateFrom,
            deliverydateTo: orderData.deliverydateTo,
            delivery: `${addr.streetAddress}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}`,
            deliveryCompanyName: consignee.companyLegalName,
            deliveryStreetAddress: addr.streetAddress,
            deliveryCity: addr.city,
            deliveryState: addr.state,
            deliveryZip: addr.zip,
            deliveryCountry: addr.country,
            deliveryCountryCode: addr.countryCode,
            deliveryLon: addr.lon,
            deliveryLat: addr.lat,
        }, {
            where: {
                id: orderData.id
            }
        });
        console.log(o);
    }
    res.json({
        status: 1
    });
};
