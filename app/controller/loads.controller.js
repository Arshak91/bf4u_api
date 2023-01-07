const moment = require("moment");
const uuidv1 = require("uuid/v1");
const db = require("../config/db.config.js");
const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");
const Helper = require("../classes/helpers.js");
const { NorderAttrb, OrderAttr } = require("../classes/joinColumns.js");
const osrm = require("../controller/osmap.controller");
const Calculations = require("../classes/calculations");
const pdfDocs = require("../classes/PDFDocs");
const DragDrop = require("../classes/dragdrop");
const driverClass = require("../classes/driver");
const loadErrors = require("../errors/loadsErros");
const Warnings = require("../warnings/loadBuildingWarnings");
const Mailer = require("../classes/mailer");
// const helper = new Helper();
const Load = db.load;
const LoadTemp = db.loadTemp;
const LoadRoute = db.loadRoute;
const Order = db.order;
const Event = db.events;
const Status = db.status;
const Op = db.Sequelize.Op;
const seq = db.sequelize;
const Equipment = db.equipment;
const companyEquipment = db.companyequipment;
const Vendors = db.vendors;
const Consignees = db.consignee;
const Driver = db.driver;
const Shift = db.shift;
const FileManager = require('../classes/files_manager');
const fileManager = new FileManager();
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
exports.createLoadFn = loadData => {
  return Load.create({

      carrierId: loadData.carrierId,
      equipmentId: loadData.equipmentId,
      driverId: loadData.driverId,
      depoId: loadData.depoId,

      nickname: loadData.nickname,
      flowType: loadData.flowType,

      orders: loadData.orders,
      stops: loadData.stops,

      start: loadData.start,
      startAddress: loadData.startAddress,
      end: loadData.end,
      endAddress: loadData.endAddress,
      startTime: loadData.startTime,
      endTime: loadData.endTime,

      weight: loadData.weight,  
      feet: loadData.feet,      
      cube: loadData.cube,

      totalDistance: loadData.totalDistance,
      totalDuration: loadData.totalDuration,

      fuelSurcharge: loadData.fuelSurcharge,
      loadCost: loadData.loadCost,
      loadCostPerMile: loadData.loadCostPerMile,

      status: 1,
      freezed: 0,
      return: loadData.return,
      planType: loadData.planType,
      comment: loadData.comment,
      totalcases: loadData.totalcases,

      dispatchDate: loadData.dispatchDate ? loadData.dispatchDate : null, //
      deliveryDate: loadData.deliveryDate ? loadData.deliveryDate : null, //

  }).then(load => {
      return Load.update(
          { nickname: load.nickname + load.id },
          { where: { id: load.id } }
      ).then(load => {
          return Order.update({
              status: 2,
              load_id: load.id,
              
          }, {
              where: {
                  id: {
                      [Op.in]: loadData.orders.split(",")
                  }
              }
          }).then(() => {
              return load;
          });
      });
  });
};

exports.create = (req, res) => {
    Load.create({

        carrierId: req.body.carrierId,
        equipmentId: req.body.equipmentId,
        driverId: req.body.driverId,
        depoId: req.body.depoId,

        nickname: req.body.nickname,
        flowType: req.body.flowType,

        orders: req.body.orders,
        stops: req.body.stops,

        start: req.body.start,
        startAddress: req.body.startAddress,
        end: req.body.end,
        endAddress: req.body.endAddress,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        //  anchorPoint: req.body.anchorPoint,
        //  anchorPointaddress: req.body.anchorPoint,

        weight: req.body.weight,  // Total Weight
        feet: req.body.feet,      // Total Feet
        cube: req.body.cube,

        totalDistance: req.body.totalDistance,
        totalDuration: req.body.totalDuration,

        fuelSurcharge: req.body.fuelSurcharge,
        loadCost: req.body.loadCost,
        loadCostPerMile: req.body.loadCostPerMile,

        status: 1,
        freezed: 0,

        comment: req.body.comment,
        totalcases: req.body.totalcases,
        return: req.body.return,
        planType: req.body.planType,
        dispatchDate: req.body.dispatchDate ? req.body.dispatchDate : null, //
        deliveryDate: req.body.deliveryDate ? req.body.deliveryDate : null, //

    }).then(load => {
        Load.update({
            nickname: load.nickname + load.id
        }, {
            where: { id: load.id }
        }).then(load => {
            Order.update({
                status: 2,
                load_id: load.id
            }, {
                where: {
                    id: {
                        [Op.in]: req.body.orders.split(",")
                    }
                }
            }).then(() => {
                res.status(201).send({
                    status: 1,
                    load_id: load.id,
                    data: load
                });
            }).catch(err => {
                res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
            });
        }).catch(err => {
            res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};
async function sendEmailsToDrivers (loadId, driverId) {
    const load = await Load.findOne({
        where: { id: loadId }
    });

    let oldDriver = null, newDriver = null;
    const drivers = await Driver.findAll({ where: { id: { [Op.in]: [load.driverId, driverId] } } });
    await Promise.all(drivers.map(async item => {
        if (item.id === load.driverId) oldDriver = item;
        else newDriver = item;
    }));
    if (!!load.driverId && (load.driverId !== driverId)) {
        Mailer.sendMail(oldDriver.email, "Confirmation", `You are unassigned from ${loadId} ID load.`); // old driver
        Mailer.sendMail(newDriver.email, "Confirmation", `${loadId} ID load is assigned to you.`); // new driver
    } 
    if (!load.driverId) {
        Mailer.sendMail(newDriver.email, "Confirmation", `${loadId} ID load is assigned to you.`); // new driver
    }
}
// Need change For Driver
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
        let { dataValues } = await companyEquipment.findOne({
            where: {
                id: req.body.assetId
            },
            include: includeFalse
        });
        assets = dataValues;
    }
    if (req.body.equipmentId) {
        let { dataValues } = await Equipment.findOne({
            attributes: eqAttr,
            where: {
                id: req.body.equipmentId
            }
        });
        equipment = dataValues;
    }
    carTypes = {
        ...assets,
        ...equipment
    };

    if (!!req.params.id && !!req.body.driverId) await Helper.sendEmailsToDrivers(req.params.id, req.body.driverId);

    let shift, driver, load;
    load = await Load.update({
        nickname: req.body.nickname,
        driverId: req.body.driverId,
        equipmentId: req.body.equipmentId ? req.body.equipmentId : 0,
        assetsId: req.body.assetId ? req.body.assetId : 0,
        loadCost: req.body.loadCost,
        status: req.body.status,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        carTypes: [carTypes],
    }, {
        where: { id: req.params.id }
    }).catch(err => {
        return res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });

        await Helper.changed({
            table: Load,
            user: req.user,
            type: "edit",
            loadId: req.params.id
        });
        let updateLoad = await Load.findOne({
            where: {
                id: req.params.id
            },
            include: includeFalse
        });
        if (req.body.editDriver) {
            let driver = await Driver.findOne({ where: {id: req.body.driverId}});
            let driverCl = new driverClass({data: {
                ...driver.dataValues,
                assetId: req.body.assetId
            }});
            await driverCl.edit();
        }
        if (load[0]) {
            let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
            let query = await Helper.createSelectQueryWithJoin5(tables, updateLoad.orders, OrderAttr);
            seq.query(query, { type: seq.QueryTypes.SELECT })
                .then(async orders => {
                    await Calculations.stops({loads: updateLoad, orders, loadType: 1, timezone}, true);
                    if (load.driverId) {
                        driver = await Driver.findOne({ where: { id: load.driverId }, include: [{ all: true, nested: false }] });
                    }
                    if (driver && driver.dataValues.shiftId) { shift = await Shift.findOne({ where: { id: driver.dataValues.shiftId } }); }
                    let newLoad = await Load.findOne({
                        where: {
                            id: req.params.id
                        },
                        include: includeFalse
                    });
                    const LatLon = await Helper.getLatLon(newLoad, orders);
                    const { distDur } = await osrm.GetDistDur(LatLon);
                    let { totalDuration, recharge } = await Helper.calcTotalDuration2({
                        load: newLoad,
                        news: orders,
                        distDur,
                        shift
                    });
                    // newLoad.dataValues.ordersDatas = [];
                    // newLoad.dataValues.ordersDatas = orders;
                    await Load.update({
                        totalDuration
                    }, { where: { id: req.params.id}});
                    await Helper.joinOrders(newLoad, newLoad.dataValues.orders, OrderAttr);
                    res.status(200).send({
                        status: 1,
                        msg: "ok",
                        data: newLoad
                    });

                }).catch(err => {
                    console.log("Error Load Edit: ", err.message);
                    res.status(500).send({
                        "description": "Can not access orders table",
                        "msg": err.message
                    });
                });
        } else {
            res.status(201).json({
                status: 0,
                msg: "Load doesn\"t updated",
                data: updateLoad
            });
        }
};

exports.getall = async (req, res, next) => {
    let key = false;
    let apiKey = req.headers["x-api-key"];
    if (apiKey) { key = true; }
    OrderAttr.push("statuses.color", "statuses.name as Status");
    let sortAndPagination = await Helper.sortAndPagination(req);
    let where = req.query;
    const data = await Helper.filters(where, Op, "load");
    if (data.bool) {
        Load.findAndCountAll({
            where: data.where,
            include: [{ all: true, nested: false }],
            distinct: true,
            ...sortAndPagination
        }).then(async loads => {
            if (loads) {
                
                const countQuery = Helper.createCountQuery("loads");
                const count = await seq.query(countQuery, { type: seq.QueryTypes.SELECT });
                const loadCount = count[0]["COUNT(*)"];

                var currentLoads = loads.rows;
                var lids = [];
                var oids = [];

                for (var i = 0; i < currentLoads.length; i++) {
    
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
                    let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
                if (loads.count) {
                    let query = Helper.createSelectQueryWithJoin5(tables, oids.join(","), OrderAttr);
                    seq.query(query, { type: seq.QueryTypes.SELECT })
                    .then(orders => {
                        if (orders) {
                            let quantity;
                            currentLoads.forEach(l => {
                                quantity = 0;
                                if (l.orders && l.orders.length > 0) {
                                    oids = l.orders.split(",");
                                    orders.forEach(o => {
                                        oids.forEach(async oid => {
                                            if (o.proof && o.proof.length) {
                                                const images = await fileManager.getById(o.proof);
                                                o.proof = images.map(x => ({ url: x.url, type: x.label }));
                                            }
                                            if (o.id == oid) {
                                                l.dataValues.ordersDatas.push(o);
                                                quantity += o.pieceCount;
                                            }
                                        });
                                        // if(l.id == o.load_id){
                                        //     l.dataValues.ordersDatas.push(o);
                                        // }
                                    });
                                    l.dataValues.pieceTotalQuantity = quantity;
                                }
                            });
                            if (key) {
                                req.loads = {
                                    loads: currentLoads,
                                    total: loads.count
                                };
                                next();
                            } else {
                                res.status(200).send({
                                status: 1,
                                msg: "ok",
                                data: {
                                    loads: currentLoads,
                                    total: loads.count
                                }
                            });
                            }
                            
                        } else {
                            res.status(500).send({
                                msg: "such orders doesn\"t exist",
                                status: 0
                            });
                        }

                    }).catch(err => {
                        res.status(500).send({
                            msg: !err.message ? "Can not access orders table!" : err.message,
                            status: 0
                        });
                    });
                } else {
                    res.status(200).json({
                        status: 1,
                        description: "such loads doesnt\"t exist",
                        data: {
                            loads: [],
                            total: 0
                        }
                    });
                }
            }
            }).catch(err => {
                res.status(500).send({
                    msg: !err.message ? "Can not access loads table!" : err.message,
                    status: 0
                });
            });
    } else {
        res.status(200).json({
            status: 1,
            description: "fillter incorrect",
            data: {
                loads: [],
                total: 0
            }
        });
    }    
};

exports.get = async (req, res) => {
    let id = req.params.id, load;
    load = await Load.findOne({
        where: {
            id: id
        }, include: [{ all: true, nested: false }],
    }).catch(err => {
        console.log(err.message);
    });
    if (!load) {
        return res.status(405).json(await Helper.getResponse(0, `${id} load is not Found`));
    }
    let currLoad = load.dataValues;
    currLoad.ordersDatas = [];
    let weekDay = await Helper.getWeekDay(currLoad.startTime);

    if (currLoad.depo.workinghours && currLoad.depo.workinghours[weekDay]) {
        currLoad.depo.dataValues.workingHours = {
            from: currLoad.depo.workinghours[weekDay].from ? currLoad.depo.workinghours[weekDay].from : null,
            to: currLoad.depo.workinghours[weekDay].to ? currLoad.depo.workinghours[weekDay].to : null,
        };
    } else {
        currLoad.depo.dataValues.workingHours = {
            from: null,
            to: null,
        };
    }
    let joinLoad = await Helper.addfieldsInOrdersDatas({load: currLoad});
    res.status(200).send({
        status: 1,
        msg: "ok",
        data: joinLoad.load
    });
};

exports.delete = (req, res) => {
    var ids = req.query.ids;
    if (!ids || ids.trim() == "") {
        req.status(200).send({
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
                [Op.in]: ids.split(",")
            }
        }
    }).then(orders => {
        Load.destroy({
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


    // Load.destroy({
    // 	where: {
    // 		id: { [Op.in]: ids.split(",") }
    // 	}
    // }).then(orders => {
    // 	res.status(200).send({
    // 		status: 1,
    // 		msg: "ok",
    // 		data: orders
    // 	})
    // }).catch(err => {
    // 	res.status(500).send({
    // 		"description": "Can not access loads table",
    // 		"error": err
    // 	});
    // })
};

exports.dissolveMany = async (req, res) => {
    var loadIds = req.body.loadIds;
    console.log(loadIds);
    Load.findAndCountAll({
        attributes: ["id", "orders", "loadTempId", "flowType", "driverId"],
        where: {
            id: {
                [Op.in]: loadIds //.split(",")
            }
            // freezed: 0
        },
        include: [{ all: true, nested: false }],
    }).then(async loads => {
        
        let lIds = "", loadTempsIds = [];
        let loadArr = [];
        for (var i = 0; i < loads.rows.length; i++) {
            loadTempsIds.push(loads.rows[i].loadTempId);
            loadArr.push({
                id: loads.rows[i].id,
                orderIds: loads.rows[i].orders,
                flowType: loads.rows[i].flowType
            });
            let message = `${loads.rows[i].dataValues.id} ID load is deleted`;
            if (process.env.SERVER != "local" && loads.rows[i].dataValues.driverId && loads.rows[i].dataValues.driver) {
                await Mailer.sendMail(loads.rows[i].dataValues.driver.email, "Canceled", message);
            }
            
        }
        await LoadTemp.update({
            disabled: 0
        }, {
            where: {
                id: {
                    [Op.in]: loadTempsIds
                }
            }
        });
        
        await Helper.unplannedOrders({
            loadArr
        }, true);
        Load.destroy({
            where: {
                id: {
                    [Op.in]: loadIds //.split(",")
                }
            }
        }).then(loads => {
            res.status(200).send({
                status: 1,
                msg: "ok",
                data: loads
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
            "description": "Can not access loads  table",
            "error": err
        });
    });
};

exports.dissolve = async (req, res) => {
    var id = req.params.id;

    Load.findAll({
        attributes: ["id", "loadTempId"],
        where: {
            id: id,
            freezed: 0
        }
    }).then( async load => {
        await LoadTemp.update({
            disabled: 0
        }, {
            where: {
                id: load.loadTempId
            }
        });
       await Order.update({
            status: 0,
            load_id: 0,
            isPlanned: 0,
            confirmed: 0
        }, {
            where: {
                load_id: id
            }
        }).then(orders => {
            Load.destroy({
                where: {
                    id: id
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
    }).catch(err => {
        //console.log(err)
        res.status(500).send({
            "description": "Can not access loads  table",
            "error": err
        });
    });
};

exports.assignrates = (req, res) => {
    Load.update({
        fuelSurcharge: req.body.fuelSurcharge,
        loadCost: req.body.loadCost,
        startTiem: req.body.startTime,
        endTime: req.body.endTime
    }, {
        where: {
            id: req.body.loadId
        }
    }).then(load => {
        res.status(201).send({
            status: 1,
            load_id: load.id,
            data: load
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};


// need check ???? -- yes !!!
exports.changeonwaystatus = (req, res) => {
    let id = req.body.id;
    let status = req.body.status;


    Load.findOne({
        where: { id: id }
    }).then(load => {
        if (!load) {
            res.status(500).send({ status: 0, msg: "no load with id", data: id });
            return;
        }

        let updateOrdersStatusesToInTransit = load.status == 1 && status == 2;
        Load.update({
            finishRequest: 0,
            status: status
        }, {
            where: { id: id }
        }).then(cnt => {
            if (updateOrdersStatusesToInTransit) {
                Order.update({
                    status: 4 // in transit
                }, {
                    where: {
                        id: {
                            [Op.in]: load.orders.split(",")
                        }
                    }
                }).then(cnt => {
                    res.status(200).send({
                        status: 1,
                        msg: "ok",
                        data: {
                            id: id,
                            status: status
                        }
                    });
                }).catch(err => {
                    res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
                });
            } else {
                res.status(200).send({
                    status: 1,
                    msg: "ok",
                    data: {
                        id: id,
                        status: status
                    }
                });
            }
        }).catch(err => {
            res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        });
    }).catch(err => {
        //console.log(err)
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};
exports.changeStatus = (req, res) => {

    var ids;
    if (req.params.id) {
        ids = [req.params.id];
    } else if (req.body.ids) {
        ids = req.body.ids;
    } else {
        ids = [];
    }

    Load.update({
        status: req.body.status,
    }, {
        where: {
            //id: req.params.id

            id: { [Op.in]: ids }
        }
    }).then(load => {

        if (req.body.status == -1) { // {freezed-value}
            Order.update({
                isplanned: -1
            }, {
                where: {
                    load_id: { [Op.id]: ids }
                }
            }).then(orders => {
                res.status(201).send({
                    status: 1,
                    msg: "ok",
                    data: load
                });
            }).catch(err => {
                res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
            });
        } else {
            res.status(201).send({
                status: 1,
                msg: "ok",
                data: load
            });
        }
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};
//  Load Start And Terminated

exports.changeOnWayStatus = async (req, res) => {

    let lid = req.params.id;
    let loadstatus = req.body.statusId;
    let load;
    let oids;
    let stopLocations;
    let uobj = {};
    let oresp;
    uobj.status = loadstatus;

    
    let lst = await Status.findOne({ where: {id:loadstatus} })
        .catch(err => { res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body }); });
    
    load = await Load.findOne({ where: {id:lid} })
        .catch(err => { res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body }); });
    let curSt = load.dataValues.status;
    let { finishRequest } = load.dataValues;
    console.log("current: ",curSt);
    let startTime;
    // if (loadstatus === 1 && loadstatus !== ) {

    // }
    if( loadstatus == 9 && (finishRequest == 1 || finishRequest == 0) && curSt != 13) {
        startTime = moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS");
        uobj.startedTime = startTime+"Z";
        uobj.finishedTime = null;
        let ost = await Status.findOne({  where: {id:5} })
            .catch(err => { res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body }); });

        oids = Helper.splitToIntArray(load.orders, ",");
        oresp =  await Order.update({ status: ost.id }, { where: { id: { [Op.in]: oids } }})
            .catch(err => { res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body }); });

        stopLocations = load.stopLocations;
        if(stopLocations){
            for (const el of stopLocations) {
                if( el.type.type == "order" ) {
                    el.type.data.statusId = ost.id;
                    el.type.data.statusColor = ost.color;
                    el.type.data.statusName = ost.name;
                    el.type.data.timeInfo.loads[lid].ata = null;
                    for (const load of el.type.data.timeInfo.loadsArr) {
                        if (load.id == lid) {
                            load.ata = null;
                        }
                    }
                    for (const item of el.type.datas) {
                        item.statusId = ost.id;
                        item.statusColor = ost.color;
                        item.statusName = ost.name;
                        item.timeInfo.loads[lid].ata = null;
                        for (const load of item.timeInfo.loadsArr) {
                            if (load.id == lid) {
                                load.ata = null;
                            }
                        }
                    }
                    for (const orderId of el.type.orders) {
                        let newOrder = await Order.findOne({where: {id: orderId}});
                        let { timeInfo } = newOrder.dataValues;
                        delete timeInfo.loads[lid].ata;
                        for (const load of timeInfo.loadsArr) {
                            if (load.id == lid) {
                                delete load.ata;
                            }
                        }
                        await Order.update({timeInfo}, {
                            where: {
                                id: orderId
                            }
                        });
                    }
                    
                }
            }
        }
        uobj.stopLocations = stopLocations;
        uobj.finishRequest = 0;
    }  // loop end
    console.log("Current Status", curSt );
    console.log("Input status ID:  ", loadstatus );
    // console.log("Update object:  ", uobj);
    
    await Load.update( uobj , { where: { id:lid } })
        .then(async  uresp => {
            await getoneload(lid).then(async load => {
            res.status(200).send({
                status: 1,
                msg: "OK",
                "updated Loads": uresp,
                "updated Orders": oresp,
                data: load.dataValues
            
            });
        }).catch(err => {
            res.status(500).json({
                msg: err.message,
                status: 0
            });
        });
    });

    
};




exports.updateOrdersOrdering = (req, res) => {
    let id = req.body.id;
    let idsStr = req.body.idsStr;

    Load.findOne({
        where: { id: id }
    }).then(load => {
        if (!load) {
            res.status(500).send({ status: 0, msg: "no load with id", data: id });
            return;
        }
        //console.log("1")
        Load.update({
            orders: idsStr
        }, {
            where: { id: id }
        }).then(cnt => {
            res.status(200).send({
                status: 1,
                msg: "ok",
                data: {
                    id: id,
                    idsStr: idsStr
                }
            });
            //console.log("2")
        }).catch(err => {
            res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
            //console.log("3")
        });
    }).catch(err => {
        //console.log(err)
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        //console.log("4")
    });
};

exports.removeOrderFromLoad = (req, res) => {
    let id = req.body.id;
    let idsStr = req.body.idsStr;
    let orderId = req.body.orderId;

    Load.findOne({
        where: { id: id }
    }).then(load => {
        if (!load) {
            res.status(500).send({ status: 0, msg: "no load with id", data: id });
            return;
        }

        Load.update({
            orders: idsStr
        }, {
            where: { id: id }
        }).then(cnt => {
            Order.update({
                load_id: 0,
                status: 1
            }, {
                where: { id: orderId }
            }).then(cnt => {
                res.status(200).send({
                    status: 1,
                    msg: "ok",
                    data: {
                        id: id,
                        idsStr: idsStr,
                        orderId: orderId
                    }
                });
            }).catch(err => {
                res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
            });
        }).catch(err => {
            res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

exports.setLoadRoute = (req, res) => {
    var loadId = req.params.id;
    var distance = req.body.distance;
    var route = req.body.route;

    LoadRoute.create({
        loadId: loadId,
        distance: distance,
        route: route
    }).then(loadRoute => {
        res.status(201).send({
            status: 1,
            msg: "Ok",
            data: loadRoute
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

exports.newordersforload = (req, res) => {
    Order.findAll({
        where: { isPlanned: 0 }
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
};


exports.getByDriverId = async (req, res) => {
    try {
        const orderBy = req.query.orderBy;
        delete req.query.orderBy;
        const order = req.query.order ? req.query.order : "desc";
        delete req.query.order;
        const page = req.query.page ? parseInt(req.query.page) : 1;
        delete req.query.page;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        delete req.query.limit;
        const offset = (page - 1) * limit;
        const orderArr = [];
        if (orderBy) {
            orderArr.push([orderBy, order]);
        }
        let where = req.query;
        if (where.start_time == "null") {
            delete where.start_time;
        }
        if (where.status == -1) {
            delete where.status;
        }
        const data = await Helper.filters(where, Op);
        const loads = await Load.findAndCountAll({
            where: data.where,
            include: [{ all: true, nested: true }],
            order: orderArr,
            offset,
            limit,
            distinct: true,
        });
        if (loads.rows.length) {
            let currentLoads = loads.rows;
            let lids = [];
            let oids = [];
            let allLoads = [];

            for (var i = 0; i < currentLoads.length; i++) {
                let weekDay = await Helper.getWeekDay(currentLoads[i].dataValues.startTime);
                if (currentLoads[i].dataValues.orders && currentLoads[i].dataValues.orders.length > 0) {

                    oids.push(currentLoads[i].orders);
                }

                lids.push(currentLoads[i].id);
                currentLoads[i].dataValues.ordersDatas = [];
                if (currentLoads[i].dataValues.depo.dataValues.workinghours && currentLoads[i].dataValues.depo.dataValues.workinghours[weekDay]) {
                    currentLoads[i].dataValues.depo.dataValues.workingHours = {
                        from: currentLoads[i].dataValues.depo.dataValues.workinghours[weekDay].from ? currentLoads[i].dataValues.depo.dataValues.workinghours[weekDay].from : null,
                        to: currentLoads[i].dataValues.depo.dataValues.workinghours[weekDay].to ? currentLoads[i].dataValues.depo.dataValues.workinghours[weekDay].to : null,
                    };
                } else {
                    currentLoads[i].dataValues.depo.dataValues.workingHours = {
                        from: null,
                        to: null,
                    };
                }
                allLoads.push(currentLoads[i].dataValues);
                await Helper.addfieldsInOrdersDatas({load: currentLoads[i].dataValues});
            }
            res.status(200).json({
                status: 1,
                msg: "ok",
                data: {
                    loads: currentLoads,
                    total: loads.count
                }
            });
        } else {
            res.status(200).json({
                status: 1,
                msg: "ok",
                data: {
                    loads: [],
                    total: 0
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            msg: error,
            status: 0
        });
    }
};

exports.updateLastLocation = async (req, res) => {
    try {
        const updateLoads = await Helper.updateLastLocation(req.body);
        res.json({
            status: updateLoads.status,
            msg: updateLoads.msg
        });
    } catch (error) {
        res.status(500).json({
            error,
            status: 0
        });
    }
};

exports.dispatch = async (req, res) => {
    try {
        const { loadsIds, location } = req.body;
        
        const loads = await Load.findAll({
            where: {
                id: {
                    [Op.in]: loadsIds
                }
            },
            include: [{ all: true, nested: false }],
        });
        let disp, urls = [], errors;
        for (const load of loads) {
            errors = await loadErrors.loadDispatchError(load);
            if (errors.status) {
                urls.push({
                    msg: errors.msg,
                    id: errors.id,
                    status: errors.status
                });
            } else {
                disp = await pdfDocs.dispatchLoad({load, location});
                if (disp.status) {
                    urls.push({
                        path: disp.url,
                        id: load.id,
                        status: disp.status
                    });
                    await Load.update({
                        dispatchUrl: disp.url
                    },{
                        where: {
                            id: load.id
                        }
                    });
                } else {
                    urls.push({
                        msg: disp.msg,
                        id: load.id,
                        status: disp.status
                    });
                }

            }
        }
        res.json({urls});

    } catch (error) {
        res.status(500).send({
            msg: "such Loads doesn't exist!!",
            error
        });
    }

};

exports.loadWithDur = async (req, res) => {
    OrderAttr.push("statuses.color", "statuses.name as Status");
    var id = req.params.id;

    Load.findOne({
        where: {
            id: id
        }, include: [{ all: true, nested: true }],
    })
        .then(async load => {
            const orderIds = await Helper.splitToIntArray(load.orders, ",");

            const orders = await Order.findAll({
                where: {
                    id: {
                        [Op.in]: orderIds
                    }
                },
                include: [{ all: true, nested: false }],
            });
            let str = "", type = [],
            date = new Date(load.startTime).getTime();
            // console.log("------------------------------------------", load.depo.dataValues.lat , load.depo.dataValues.lon);
            if (load.flowType == 2) {
               //  console.log("------------------------------------------", load.depo.dataValues.lat , load.depo.dataValues.lon);
                // str += `${JSON.parse(load.start).Lat},${JSON.parse(load.start).Lon};`;
                str += `${load.depo.dataValues.lat},${load.depo.dataValues.lon};`;
               //  console.log(str);
            }
            for (let i = 0; i < orders.length; i++) {
                str += `${orders[i].deliveryLat},${orders[i].deliveryLon};`;
            }
            console.log(str);
            const { distDur } = await osrm.GetDistDur(str);
            for (let i = 0; i < distDur.legs.length; i++) {
                // distDur.legs[i]["type"] = type[i];
                if (i>0) {
                    distDur.legs[i]["duration"] += (distDur.legs[i-1]["duration"] + 1200);
                }
                
            }
            res.json(distDur);
        });
};

exports.updateETA = async (req, res) => {
    try {
        let result, { timezone } = req.headers, startTime;
        console.log('here');
        let start = req.body.start;
        try {
            startTime = moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS");
            let updObj = {};
            if (start == 1) {
                updObj = {
                    // startedTime: startTime+"Z",
                    finishedTime: null
                };
            }
            start == 1 ? await Load.update({
                ...updObj
            }, {
                where: {
                    id: req.body.loadId
                }
            }) : null;
            // result = await Calculations.calcETA2({...req.body, start: req.body.start});
        } catch (error) {
            console.log("--1--1", error);
        }

        let newLoad = await Load.findOne({
            where: {
                id: req.body.loadId
            },
            include: [{ all: true, nested: false }],
        });
        let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
        let query = await  Helper.createSelectQueryWithJoin5(tables, newLoad.dataValues.orders, [
            ...OrderAttr,
            "consignees.email as consEmail",
            "consignees.companyLegalName"
        ]);
        let orders = await seq.query(query, { type: seq.QueryTypes.SELECT })
        .catch(err => {
            res.status(407).send({
                msg: !err.parent.sqlMessage ? "Can not access orders table 1" : err.parent.sqlMessage,
                status: 0
            });
        });
        let calc = await Calculations.stops({loads: {
            ...newLoad.dataValues,
            start
        }, orders, loadType: 1, timezone, start}, true);
        // calc.newLoad.ordersDatas = [];
        // calc.newLoad.ordersDatas = orders;

        res.status(200).send({
            status: 1,
            msg: "ok",
            data: calc.newLoad
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({
            msg: error.message,
            status: 0
        });
    }
    
};

exports.file = (req, res, next) => {
    req.urlBasedDirectory = "dispatches";
    next();
};

exports.setLoadOrderDatas = async (req, res) => {
    const list = await Load.findAll({});

    await Promise.all(list.map(async load => {
        load.dataValues.stopLocations.map(async stopLocation => {
            const tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
            const query = await Helper.createSelectQueryWithJoin5(tables, stopLocation.type.orders.join(','), OrderAttr);
            const orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
            stopLocation.type.datas = orders;
        });
        await Load.update({ stopLocations: load.dataValues.stopLocations }, { where: { id: load.dataValues.id } });
    }));

    const tempList = await LoadTemp.findAll({});

    await Promise.all(tempList.map(async temp => {
        temp.dataValues.stopLocations.map(async stopLocation => {
            const tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
            const query = await Helper.createSelectQueryWithJoin5(tables, stopLocation.type.orders.join(','), OrderAttr);
            const orders = await seq.query(query, { type: seq.QueryTypes.SELECT });
            stopLocation.type.datas = orders;
        });
        await LoadTemp.update({ stopLocations: temp.dataValues.stopLocations }, { where: { id: temp.dataValues.id } });
    }));

    return res.send({ msg: "ok", status: 1 });
};

exports.bulkEdit = async (req, res) => {
    const { idList, status } = req.body;
    try {
        await Load.update({
            status: Number(status)
        }, {
            where: { id: {
                [Op.in]: idList
            } }
        })
    } catch (error) {
        console.log(error);
        res.send({ msg: '', status: 0 });
    }
    return res.send({ status: 1, msg: 'ok' });
};

exports.editscript = async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    delete req.query.page;

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    delete req.query.limit;
    const offset = (page - 1) * limit;
    const AllLoads = await Load.findAll({
        offset,
        limit,
        include: [{ all: true, nested: false }],
    });
    console.log(AllLoads.length);
    let edit;
    for (const loads of AllLoads) {
        let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
        let query = await Helper.createSelectQueryWithJoin5(tables, loads.orders, OrderAttr);
        seq.query(query, { type: seq.QueryTypes.SELECT })
        .then(async orders => {
            if (orders.length > 0) {
                
                edit = await Calculations.stops({loads, orders, loadType: 1}, true);
                console.log(edit);
                res.json({
                    status: "ok"
                });
            } else {
                res.status(500).send({
                    "description": "such orders doesn\"t exist",
                    status: false
                });
            }

        }).catch(err => {
            res.status(500).send({
                "description": "Can not access orders table!",
                "error": err
            });
        });
    }
};




async function  getoneload(lid, res) {
    
    let load  = await Load.findOne({ // this is temp Bullshit!  must be chnaged 
        where: {
            id: lid
        },
        include: [{ all: true, nested: false }],
    });

        const orderIds = await Helper.splitToIntArray(load.orders, ",");
        let orders = [];
        const allOrders = await Order.findAll({
            where: {
                id: {
                    [Op.in]: orderIds
                }
            },
            include: [{ all: true, nested: false }],
        });

        orders.push(allOrders[0].dataValues);

        for (let i = 1; i < allOrders.length; i++) {
            orders.push(allOrders[i].dataValues);
        }

        load.dataValues.ordersDatas = [];
        let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
        let query = Helper.createSelectQueryWithJoin5(tables, load.orders, OrderAttr);
        let norders  = await seq.query(query, { type: seq.QueryTypes.SELECT });
        load.dataValues.ordersDatas = norders;
       //  console.log(load); 
        return load;

    //  end of  bulshit
}

exports.finished = async (req, res) => {
    try {
        const { loadId } = req.body;
        let endTime;
        endTime = moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS");
        await Load.update({
            finishRequest: 2,
            status: 10,
            finishedTime: endTime+"Z"
        }, {
            where: {
                id: loadId
            }
        });
        const newLoad = await Load.findOne({
            where: {
                id: loadId
            }
        });
        res.json({
            status: 1,
            msg: "ok",
            data: newLoad
        });
    } catch (error) {
        res.status(500).send({
            msg: error.message,
            status: 0
        });
    }
};

exports.confirmFinish = async (req, res) => {
    try {
        const { loadId } = req.body;
        await Load.update({
            finishRequest: 2,
            status: 10
        }, {
            where: {
                id: loadId
            }
        });
        const newLoad = await Load.findOne({
            where: {
                id: loadId
            }
        });
        res.json({
            status: 1,
            msg: "ok",
            data: newLoad
        });
    } catch (error) {
        res.status(500).send({
            "error": error
        });
    }
};

exports.addStopsScript = async (req, res) => {
    try {
        const Loads = await Load.findAll({});
        for (const load of Loads) {
            let arr = await Helper.splitToIntArray(load.orders, ",");
            await Load.update({
                stops: arr.length
            }, {
                where: {
                    id: load.id
                }
            });
        }
        const newLoads = await Load.findAll({});
        res.json({
            newLoads
        });
        
    } catch (error) {
        res.status(500).json({
            error
        });
    }
};


exports.getAllByFields = async (req, res) => {
    try {
        let { loads } = req;
        let arrLoads = [];
        for (const load of loads.loads) {
            let orderDatas = [], legs = [];
            for (const leg of load.dataValues.stopLocations) {
                if (leg.type.type == "order") {
                    legs.push({
                        data: {
                            type: leg.type.type,
                            info: {
                                id: leg.type.data.id,
                                invoiceNumber: leg.type.data.po,
                                weight: leg.type.data.weight,
                                volume: leg.type.data.cube,
                                serviceTime: leg.type.data.servicetime,
                                status: leg.type.data.statusName,
                                timeInfo: leg.type.data.timeInfo
                            },
                            warning: leg.type.warningStatus ? leg.type.warningStatus.name : null
                        },
                        distance: leg.distance,
                        duration: leg.duration
                    });
                }
                
            }
            
            for (const order of load.dataValues.ordersDatas) {
                let consignee = order.consigneeid ? await Consignees.findOne({ where: { id: order.consigneeid}}) : null;
                orderDatas.push({
                    id: order.id,
                    invoiceNumber: order.po,
                    customer: order.consigneeid ? consignee.name : null,
                    weight: order.weight,
                    volume: order.cube,
                    serviceTime: order.servicetime,
                    status: order.statusName
                });
            }
            
            arrLoads.push({
                Id: load.dataValues.id,
                loadName: load.dataValues.nickname,
                stops: load.dataValues.stops,
                start: {
                    Point: load.dataValues.start,
                    startTime: load.dataValues.startTime,
                    Address: load.dataValues.startAddress
                },
                end: {
                    Point: load.dataValues.end,
                    endTime: load.dataValues.endTime,
                    Address: load.dataValues.endAddress
                },
                emptyMile: load.dataValues.emptymile,
                totalDistance: load.dataValues.totalDistance,
                totalDuration: load.dataValues.totalDuration,
                return: load.dataValues.return == 0 ? "True" : "False",
                planType: load.dataValues.planType,
                legs: legs,
                asset: load.dataValues.assetsId ? load.dataValues.companyEquipment.name: null,
                orderSequence: load.dataValues.orders.split(","),
                orders: orderDatas,
            });
        }
        res.json({
            msg: "ok",
            loads: arrLoads,
            count: loads.total
        });
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: error.message,
        });
    }
};

exports.dropOrderFromLoads = async (data) => {
    try {
        let { timezone } = data;
        let { loadIds, orderId, order, user } = data, load, result = [];
        for (const loadId of loadIds) {
            load = await Load.findOne({
                where: { id: loadId },
                include: [{ all: true, nested: false }]
            });
            // let prevOrderIds = load.orders.split(",");
            let prevOrderIds = await Helper.splitToIntArray(load.orders, ",");
            let orderIndex = prevOrderIds.indexOf(orderId);
            if (orderIndex > -1) {
                prevOrderIds.splice(orderIndex, 1);
            }
            let remOrder = await DragDrop.removeOrderFromLoad({
                load: load,
                ordersIdsArr: prevOrderIds,
                orders: order,
                user: user
            });
            let loadArr = [];
            if (remOrder && remOrder.status) {
                let newLoads;
                if (!remOrder.delete) {
                    newLoads = await DragDrop.calculationForLoad({
                        arr: [loadId],
                        timezone
                    });
                }
                loadArr = loadArr.concat(newLoads.newLoads.rows.filter(row => {
                    return row.id == loadId;
                }));
                const warnings = await Warnings.addOrderFromLoadWarning({
                    load: loadArr[0],
                    order
                });
                result.push({
                    status: 1,
                    msg: warnings.msg,
                    warning: warnings.warning,
                    prevLoad: remOrder
                });
            }
        }
        return result;
    } catch (error) {
        return {
            status: 0,
            msg: error.message
        };
    }
};

exports.getExportsLoads = async (req, res) => {
    try {
        let ids, where = {}, exportArr, loads, orderIds, msg = "OK";
        if (req.body.ids && req.body.ids.length > 0) {
            ids = req.body.ids;
            where = {
                id: {
                    [Op.in]: ids
                }
            };
        }
        loads = await Load.findAndCountAll({
            where: where,
            include: includeTrue,
            distinct: true,
        });
        let info = await Helper.getRemoteInfoForKey(req);
        exportArr = await Helper.exportArr({
            loads: loads,
            orderIds,
            info
        });
        res.json({
            status: 1,
            data: exportArr.arr,
            errorData: exportArr.errorArr,
            msg: `Successed: ${exportArr.loadsArr.length}. Failed: ${exportArr.errorArr.length}.`
        });

    } catch (error) {
        res.status(409).json({
            status: 1,
            msg: "Error in Load Export",
        });
    }
};

// SOLO Mobile
exports.mobileSequence = async (req, res) => {
    console.log("start load sequence");
    try {
        let driver;
        if (req.user && req.user.email) {
            driver = await Driver.findOne({ where: { email: req.user.email }, include: [{ all: true, nested: false }] });
        }
        let { date, depot, equipment, id, name, params, points, shift, userId } = req.body, orderIds = [], orders = [];
        for (const point of points) {
            orderIds.push(point.id);
            let obj = {
                id: point.id,
                feet: point.feet,
                weight: point.weight,
                flowType: params.flowType,
                servicetime: point.serviceTime,
                eta: null,
                ata: null,
                driverId: driver ? driver.dataValues.id : null
            };
            let from = moment(`${point.date} ${point.from}`, "DD-MM-YYYY HH:mm A").format("YYYY-MM-DDTHH:mm:ss.SSS");
            let to = moment(`${point.date} ${point.to}`, "DD-MM-YYYY HH:mm A").format("YYYY-MM-DDTHH:mm:ss.SSS");
            if (params.flowType == 2) {
                obj.deliveryLat = point.findPoint.latitude;
                obj.deliveryLon = point.findPoint.longitude;
                obj.pickupLat = 0;
                obj.pickupLon = 0;
                obj.deliverydateFrom = from;
                obj.deliverydateTo = to;
                obj.pickupdateFrom = "1999-09-08T12:18:59.000Z";
                obj.pickupdateTo = "3000-09-08T12:18:59.000Z";
            } else if (params.flowType == 1) {
                obj.pickupLat = point.findPoint.latitude;
                obj.pickupLon = point.findPoint.longitude;
                obj.deliveryLat = 0;
                obj.deliveryLon = 0;
                obj.pickupdateFrom = from;
                obj.pickupdateTo = to;
                obj.deliverydateFrom = "1999-09-08T12:18:59.000Z";
                obj.deliverydateTo = "3000-09-08T12:18:59.000Z";
            }
            orders.push(obj);
        }
        let uuid = uuidv1(), PostServer = Helper.getRemoteInfoForKey(req).endPoint,
        url = Helper.getRemoteInfoForKey(req).host + "/orders/byids/" + orderIds.join(","),
        newDate = moment(date, "DD-MM-YYYY").format("YYYY-MM-DD"),
        loadStartTime = moment.utc(date, "DD-MM-YYYY HH:mm").format("YYYY-MM-DDTHH:mm:ss.SSS");
        let MapUrl = env.mapHost + env.mapPort + "/table/v1/driving/", timeLimit = 60;
        let dryRun = true, loadMinimize = true, singleRouteCalc = true;
        let data = {
            "execid": uuid,
            "PostServer": PostServer,
            "MapServer": MapUrl,
            "params": {
                "date": newDate,
                "loadStartTime": loadStartTime+"Z",
                "depoId": -1,
                "flowType": params.flowType,
                "maxStops": orderIds.length,
                "timeLimit": timeLimit,
                "selectedOrders": orderIds,
                "oVRP": params.returnType ? 0 : 1,
                "shiftId": -1,
                "dryRun": dryRun,
                "loadMinimize": loadMinimize,
                "singleRouteCalc": singleRouteCalc,
                "seqMode": true
            },
            "depo": depot,
            "shift": shift,
            "equipment": equipment,
            "Orders": orders
        }, obj = {}, ordersStr, startTime, pointArr = [];
        let eResp = await Helper.sendReqToEngine(data);
        if(eResp.status != 200 || !eResp.data[0]){
            res.status(409).json({
                status: 0,
                msg: eResp.data.Message ? eResp.data.Message : eResp.data.Data
            });
            console.log(orderIds);
        }else {
            // return eResp;
            let seqStatus = eResp.data[0].Status,
                infCount = eResp.data[0].Infeasibles ? eResp.data[0].Infeasibles.length : 0,
                algo = eResp.data[0].Algorithm;
            if (seqStatus == 3 && infCount == 0) {
                ordersStr = eResp.data[0].Loads[0].OrderIDs.join(",");
                for (const orderId of eResp.data[0].Loads[0].OrderIDs) {
                    for (const point of points) {
                        if (point.id == orderId) {
                            pointArr.push(point);
                        }
                    }
                }
                if (algo == 3) {
                    startTime = moment.utc(driver.dataValues.startTime).format("DD/MM/YYYY HH:mm A");
                } else {
                    startTime = moment.utc(eResp.data[0].Loads[0].FirstNodeStartTime).format("DD/MM/YYYY HH:mm A");
                }
                obj = {
                    ...req.body,
                    points: pointArr,
                    date: startTime,
                    params: {
                        flowType: params.flowType,
                        loadStartTime: startTime,
                        returnType: params.returnType
                    }
                };
                res.json({
                    status: 1,
                    data: obj
                });
            } else if (seqStatus == 2) {
                res.status(409).json({
                    status: 0,
                    msg: eResp.data[0].Exception.Message
                });
            }
        }
        
    } catch (error) {
        console.log("Error: ", error.message);
        res.status(409).json(await Helper.errorMsg(error.message));
    }
};

exports.mobileCalc = async (req, res) => {
    try {
        let data = req.body, calc;
        calc= await Calculations.soloCalc(data);
        res.json({
            data: {
                ...data,
                eta: calc
            },
            status: 1
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json(await Helper.errorMsg(error.message));
    }
};