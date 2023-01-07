const Columns = require('../classes/joinColumns');
const Helper = require('../classes/helpers');
const Calc = require('../classes/calculations');
const Errors = require('../errors/driverErrors');
const Clients = require('../mongoModels/ClinetsModel');
const clientController = require('../mongoControllers/ClientsController');
const DriverClass = require('../classes/driver');
const ScheduleClass = require('../classes/schedule');
const Search = require('../lib/search');

const bcrypt = require('bcryptjs');
const db = require('../config/db.config.js');
const Mailer = require('../classes/mailer');
const seq = db.sequelize;
const DriverLess = db.driver;
const Driver = db.driverLoad;
const Schedule = db.schedules;
const User = db.user;
const UserRole = db.user_role;
const UserTypes = db.user_types;
const Depo = db.depo;

// const Shift = db.shift;
// const Carrier = db.carrier;

const Op = db.Sequelize.Op;
const includeFalse = [{ all: true, nested: false }];


exports.create = async (req, res) => {
    try {
        //  console.log(req.body);
        const errors = await Errors.createAndEditError(req.body);
        if (!errors.status) {
            res.status(409).send({
                status: errors.status,
                msg: errors.msg
            });
        } else {
            let schedule, driver, exUser, exDriver;
            let { activeMobile } = req.body;
            exUser = await User.findOne({ where: {email: req.body.email}});
            exDriver = await DriverLess.findOne({ where: {email: req.body.email}});
            if (exUser) {
                return res.status(409).json({
                    status: 0,
                    msg: 'This email address has been already assigned to another user.'
                });
            }
            if (exDriver) {
                return res.status(409).json({
                    status: 0,
                    msg: 'This email address has been already assigned to another user.'
                });
            }
            driver = await DriverLess.create({
                carrierId: req.body.carrierId ? req.body.carrierId : 0, 
                equipmentId: req.body.equipmentId,
                assetId: req.body.assetId ? req.body.assetId : null,
                shiftId: req.body.shiftId, 
                scheduleid: 0, 
                depotId: req.body.depotId ? req.body.depotId : 0, 
                
                type: req.body.type ? req.body.type : null,  
                eqType: req.body.eqType ? req.body.eqType : null, 
                status: req.body.status ? req.body.status : null, 
                startTime: req.body.startTime ? req.body.startTime : null, 
                endTime: req.body.endTime ? req.body.endTime : null,  

                fname: req.body.fname, 
                lname: req.body.lname, 
                email: req.body.email, 
                address: ` ${req.body.streetaddress || ''} , 
                        ${req.body.city || ''} , 
                        ${req.body.state || ''} , 
                        ${req.body.zip || ''} , 
                        ${req.body.country}`, 
                
                streetaddress: req.body.streetaddress  ? req.body.streetaddress : null,
                city: req.body.city  ? req.body.city : null,
                state: req.body.state  ? req.body.state : null,
                zip: req.body.zip  ? req.body.zip : null,
                country: req.body.country,
                countryCode: req.body.countryCode  ? req.body.countryCode : null,

                phone: req.body.phone  ? req.body.phone : null,

                rate: req.body.rate ? req.body.rate : null,
                hourlyRate: req.body.hourlyRate ? req.body.hourlyRate : null,
                perMileRate: req.body.perMileRate ? req.body.perMileRate : null,
                percentRate: req.body.percentRate ? req.body.percentRate : null,
                bonuses: req.body.bonuses ? req.body.bonuses : null,
                fuelsurcharge: req.body.fuelsurcharge ? req.body.fuelsurcharge : null,
                detention: req.body.detention ? req.body.detention : null,

                dob: req.body.dob ? req.body.dob : null,
                hdate: req.body.dob ? req.body.dob : null,

                easypass: req.body.easypass ? req.body.easypass : 0,
                ex_rev_per_mile: req.body.ex_rev_per_mile ? req.body.ex_rev_per_mile : 0,
                ex_rev_goal_week: req.body.ex_rev_goal_week ? req.body.ex_rev_goal_week :0 ,
                lengthofhaul_min: req.body.lengthofhaul_min ? req.body.lengthofhaul_min : 0, 
                lengthofhaul_max: req.body.lengthofhaul_min ? req.body.lengthofhaul_min : 0,
                use_sleeper_b_p: req.body.use_sleeper_b_p ? req.body.use_sleeper_b_p : 0,
                drivinglicence: req.body.drivinglicence ? req.body.drivinglicence : null,
                throughStates: req.body.throughStates ? req.body.throughStates : 0,
                pickupDeliveryStates: req.body.pickupDeliveryStates ? req.body.pickupDeliveryStates : null,
                prefTruckStops: req.body.prefTruckStops ? req.body.prefTruckStops : null,
                tollRoutes: req.body.tollRoutes ? req.body.tollRoutes : null,
                routeNumber: req.body.routeNumber ? req.body.routeNumber : null
            });
            if (driver) {
                schedule = await Schedule.create({

                    driverid: driver.id,
                    monday: req.body.monday,
                    tuesday: req.body.tuesday,
                    wednesday: req.body.wednesday,
                    thursday: req.body.thursday,
                    friday: req.body.friday,
                    saturday: req.body.saturday,
                    sunday: req.body.sunday

                });
                if (schedule) {
                    await DriverLess.update(
                        {
                            scheduleid: schedule.id
                        },{
                            where: { id: driver.id }
                        }
                    );
                    // let pass = Math.random().toString(36).substring(2);
                
                    let msg = "driver created", user,
                    obj = {
                        id: driver.id,
                        data: req.body,
                        user: req.user
                    };

                    // console.log('pass', pass);
                    if (activeMobile) {
                        user = await Helper.createUserDriver(obj);
                        msg = user.msg;
                    }
                    
                    res.json({
                        status: 1,
                        msg,
                        driver: driver,
                        schedule: schedule
                    });
                    
                } else {
                    return  res.status(409).send({
                        status: 0, msg: "Schedule not created", data: req.body
                    });
                }
            } else {
                return  res.status(409).send({
                    status: 0, msg: "Driver not created", data: req.body
                });
            }
        }
    } catch (error) {
        res.status(409).send({ status: 0, msg: error.message, err: error, data: req.body });
    }
    
};

exports.quickCreate = async (req, res) => {
    try {
        let { count, timezone } = req.body, drivers = [];
        let date = '2020-08-11T08:30:00.000Z', hours, startTime;
        hours = new Date(date).getTime() - (timezone * 60 *1000);
        startTime = new Date(hours);
        for (let i = 0; i < count; i++) {
            let drCl = new DriverClass({data: {fname: `Driver${i+1}`}});
            let driver = await drCl.create();
            let drSch = new ScheduleClass({data: {
                driverId: driver.dataValues.id,
                monday: { from: startTime},
                tuesday: { from: startTime},
                wednesday: { from: startTime},
                thursday: { from: startTime},
                friday: { from: startTime},
                saturday: { from: startTime},
                sunday: { from: startTime}
            }});
            let schedule = await drSch.create();
            let drUpCl = new DriverClass({data: {
                ...driver.dataValues,
                scheduleid: schedule.dataValues.id
            }});
            await drUpCl.edit();
            drivers.push(driver.dataValues.id);
        }
        res.json({
            status: 1,
            drivers
        });
    } catch (error) {
        console.log(error);
        res.status('409').json({
            status: 0,
            msg: 'catch Error',
            error
        });
    }
};

exports.edit = async (req, res) => {
    const errors = await Errors.createAndEditError(req.body, true);
    if (!errors.status) {
        res.status(409).send({
            status: errors.status,
            msg: errors.msg
        });
    } else {
        let exDriver;
        exDriver = await DriverLess.findOne({ where: {
            [Op.and]: [
                {email: req.body.email},
                {id: { [Op.ne]: req.params.id }}
            ]
            
        }});
        if (exDriver) {
            return res.status(409).json({
                status: 0,
                msg: 'This email address has been already assigned to another user.'
            });
        }
        DriverLess.findOne({ 
            where: {id: req.params.id }
        }).then( driver => {
            DriverLess.update({

                carrierId: req.body.carrierId,
                equipmentId: req.body.equipmentId,
                assetId: req.body.assetId,
                shiftId: req.body.shiftId,
                depotId: req.body.depotId,
                
                type: req.body.type,
                status: req.body.status,
                startTime: req.body.startTime,
                endTime: req.body.endTime,
        
                fname: req.body.fname,
                lname: req.body.lname,
                email: req.body.email,
                phone: req.body.phone,
        
                address: req.body.address,
                streetaddress: req.body.streetaddress,
                city: req.body.city,
                state: req.body.state,
                zip: req.body.zip,
                country: req.body.country,
                countryCode: req.body.countryCode,
        
                rate: req.body.rate,
                hourlyRate: req.body.hourlyRate,
                perMileRate: req.body.perMileRate,
                percentRate: req.body.percentRate,
                bonuses: req.body.bonuses,
                fuelsurcharge: req.body.fuelsurcharge,
                detention: req.body.detention,
        
                dob: req.body.dob,
                hdate: req.body.hdate,
        
                easypass: req.body.easypass,
                ex_rev_per_mile: req.body.ex_rev_per_mile,
                ex_rev_goal_week: req.body.ex_rev_goal_week,
                lengthofhaul_min: req.body.lengthofhaul_min,
                lengthofhaul_max: req.body.lengthofhaul_min,
                use_sleeper_b_p: req.body.use_sleeper_b_p,
        
                throughStates: req.body.throughStates, 
                pickupDeliveryStates: req.body.pickupDeliveryStates,
                prefTruckStops: req.body.prefTruckStops,
                drivinglicence: req.body.drivinglicence,
                tollRoutes: req.body.tollRoutes,
                eqType: req.body.eqType,
                routeNumber: req.body.routeNumber ? req.body.routeNumber : null
            },{
        
                where: { id: driver.id },
        
            }).then( async () => {
                //  console.log(driver.depoId);
                if (req.body.email) {
                    await User.update({email: req.body.email}, {where: {
                        email: driver.dataValues.email
                    }});
                }
                
                let schedule;
                if (driver.scheduleid) {
                    schedule = await Schedule.findOne({ where: { id: driver.scheduleid }});
                }
                if(!driver.scheduleid || !schedule){
                    await Schedule.create({

                        driverid: driver.id,
                        monday: req.body.monday,
                        tuesday: req.body.tuesday,
                        wednesday: req.body.wednesday,
                        thursday: req.body.thursday,
                        friday: req.body.friday,
                        saturday: req.body.saturday,
                        sunday: req.body.sunday
                    }).then( sch => {
                        DriverLess.update({
                            scheduleid: sch.id
                            },{
                                where: {id:driver.id}
                            });
                    }).catch(err => {
                        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
                    });
                }
                Schedule.update(
                    {
                        monday: req.body.monday,
                        tuesday: req.body.tuesday,
                        wednesday: req.body.wednesday,
                        thursday: req.body.thursday,
                        friday: req.body.friday,
                        saturday: req.body.saturday,
                        sunday: req.body.sunday
                    },
                    {
                        where: { id: driver.scheduleid }

                    }).then( () => {
                        res.status(201).send({
                            status: 1,
                            msg: 'updated',
                            driver: driver,
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
    }

};

exports.getall = async (req, res) => {
    let where = req.query, search;
    let { text } = req.query;
    delete where.text;
    let sortAndPagination = await  Helper.sortAndPagination(req);
    search = text ? await Search.searchDriver(text) : {};
    const data = await Helper.filters(where, Op, 'driver');

    if (!data.bool) {
        return res.status(409).json({
            status: 0,
            msg: 'fillter incorrect',
            data: {
                drivers: [],
                total: 0
            }
        });
    }
    DriverLess.findAndCountAll({
        where: {
            ...data.where,
            ...search
        },
        include: [{ all: true, nested: false }],
        ...sortAndPagination
    }).then(drivers => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                drivers: drivers.rows,
                total: drivers.count
            }
        });
    }).catch(err => {
        // console.log(err)
        res.status(500).send({
            msg: err.message ? err.message : 'Can not access drivers table',
            status: 0
        });
    });
};

exports.get = (req, res) => {
    var id = req.params.id;

    DriverLess.findOne({
        where: {
            id: id
        },
        include: [{ all: true, nested: false }],

    })
    .then(driver => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: driver
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access drivers table',
            'error': err.msg
        });
    });
};

exports.delete = async (req, res) => {
    var ids = req.body.ids;
    if (!ids || ids.length == 0 ) {
        res.status(409).send({
            status: 0,
            msg: 'no ids for delete'
        });
        return;
    }
    let drivers = await DriverLess.findAll({
        where: {
            id: {
                [Op.in]: ids
            }
        }
    });
    let userEmails = [];
    for (const driver of drivers) {
        userEmails.push(driver.email);
    }
    let schid = [];
    let sch = await Schedule.findAndCountAll({
        where: {
             driverid: {
                 [Op.in]: ids
             }
        },
       attributes:['id']
    });

    await sch.rows.forEach(el => {
        schid.push(el.dataValues.id);
    });
    
    DriverLess.destroy({
        where: {
            id: {
                [Op.in]: ids
            }
        }
    }).then(async count => {
        let delUser, users;
        try {
            users = await User.findAndCountAll({where: {
                email: {
                    [Op.in]: userEmails
                }
            }});
            if (users) {
                delUser = await User.destroy({
                    where: {
                        email: {
                            [Op.in]: userEmails
                        }
                    }
                });
                for (const user of users.rows) {
                    await UserTypes.destroy({
                        where: {
                            userId: user.id
                        }
                    });
                    await UserRole.destroy({
                        where: {
                            userId: user.id
                        }
                    });
                }
            }
            
            
        } catch (error) {
            console.log(error);
        }
        console.log(delUser);
        
        Schedule.destroy({
            where: {
                driverid: {
                    [Op.in] : ids
                }
            }
        }).then(sres => {
            res.status(200).send({
                status: 1,
                msg: 'deleted',
                "deleted drivers": count,
                "deleted schedules": sres,
                "deleted users": delUser
            });
        }).catch(err => {
            res.status(500).send({ status: 0, msg: err.message, err: err });
        });
        
    }).catch(err => {
        //console.log(err)
        res.status(500).send({
            'description': `Can not delete driver(s) ${ids}`,
            'error': err
        });
    });
};

// app.get('/api/drivers/byname/:name', drivers_controller.getAllByNameFiltered);
exports.getAllByNameFiltered = (req, res) => {
    const name = req.params.name;

    if(name == ''){
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: []
        });
    }

    DriverLess.findOne({
        where: {
            //carrierId: carrierId,
            [Op.or]: [
                {
                    fname: {
                        [Op.like]: `%${name}%`
                    }
                }, {
                    lname: {
                        [Op.like]: `%${name}%`
                    }
                }
            ]
        },
        include: [{ all: true, nested: true }],
    })
    .then(driver => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: driver
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access drivers table',
            'error': err.msg
        });
    });
};

exports.getBlocks = async (req, res) => {
    
    const orderBy = req.query.orderBy;
    delete req.query.orderBy;
    const order = req.query.order ? req.query.order : 'desc';
    delete req.query.order;
    const orderArr = [];
    if (orderBy) {
        orderArr.push([orderBy, order]);
    }
    
    const page = req.query.page ? parseInt(req.query.page) : 1;
    delete req.query.page;

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    delete req.query.limit;

    const offset = (page - 1) * limit;
    let where = {};
    let startDate = req.query.from;
    let endDate = req.query.to;
    if(startDate || endDate) {
        where = {

            [Op.or]: [{
                startTime: {
                    [Op.between]: [startDate, endDate]
                }
            }]
     };
    
    }
    let driversobj = await Driver.findAndCountAll({
            attributes: Columns.Blocksdriver,
            include: [ 
                {   
                    model: db.loaddriver,
                    attributes: Columns.Blocksload,
                    where, 
                    nested: true 

                } 
            ],
            where: { },
            order: orderArr,
            offset,
            limit
        }

    ).catch(err => {
            // console.log(err)
            res.status(500).send({ status: 0, msg: err.message, err: err });
    
    });
    const drivers =  driversobj.rows;
    for (let i = 0; i < drivers.length; i++) {
            
        let driver = drivers[i];
        let loads = driver.loads;
        
        
        for (let j = 0; j < loads.length; j++) {

            let load = loads[j];
            let lfo = [];
            let depo = await Depo.findOne({
                where: { id:load.depoId }
            }).catch(err => {
                // console.log(err)
                res.status(500).send({ status: 0, msg: err.message, err: err });
            });
            // adding day block to Load
            let ords = load.orders.split(',')
                .map(function (item) {
                    return parseInt(item, 10);
                });
            // console.log(ords);
            lfo.push( ords[0] );
            lfo.push(ords[ords.length-1]);
            let sorders = lfo.join(',').toString();
            // console.log(sorders);
            let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
            let query = Helper.createSelectQueryWithJoin5(tables,sorders,Columns.NorderAttrb);
            let orders =  await seq.query(query, { type: seq.QueryTypes.SELECT }).catch(err => {
                    // console.log(err)
                    res.status(500).send({ status: 0, msg: err.message, err: err });

            });
            load.dataValues.ordersDatas = orders;
            load.dataValues.depo = depo;
            load.dataValues.block = Calc.blockCalcForLoad(load);               
        }
        
    }       
    res.status(200).send({
       "data": {               
        "drivers": drivers,
        "total": drivers.length                
       }
        
    });
    
    
};

exports.getDailyBlocks = async (req, res) => {
    try {
        let { from, to } = req.query;
        let sortAndPagination = await Helper.sortAndPagination(req);
        let where = {}, driversobj;
        if (from && to) {
            where = {
                [Op.or]: [{
                    startTime: {
                        [Op.between]: [from, to]
                    }
                }]
            };
        }
        driversobj = await Driver.findAndCountAll({
            attributes: Columns.Blocksdriver,
            include: [ 
                {   
                    model: db.loaddriver,
                    attributes: Columns.Blocksload,
                    include: includeFalse,
                    where, 
                    nested: true 

                } 
            ],
            where: { },
            ...sortAndPagination
        }).catch(err => {
            res.status(500).send({ status: 0, msg: err.message, err: err });
        });
        let drivers =  driversobj.rows;
        for (const driver of drivers) {
            let loads = driver.loads;
            for (const load of loads) {
                let { block, hours } = await Calc.dailyBlockCalcForLoad(load); 
                const depo = await Depo.findOne({
                    where: { id:load.depoId }
                }).catch(err => {
                    // console.log(err)
                    res.status(500).send({ status: 0, msg: err.message, err: err });
                });
                load.dataValues.block = block;
                load.dataValues.depo = depo;
                load.dataValues.hours = hours;
            }
        }
        res.status(200).send({
            "data": {               
                "drivers": drivers,
                "total": drivers.length                
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 0,
            msg: error.message
        });
    }
};

exports.registrationScript = async (req, res) => {
    try {
        let drivers, pass = 'demopass', user;
        drivers = await DriverLess.findAndCountAll();
        for (const driver of drivers.rows) {
            let schedule;
            user = await User.create({
                name: driver.fname,
                email: driver.email,
                password: bcrypt.hashSync(pass, 8)
            });
            if (user) {
                let userData = user.dataValues;
                await UserTypes.create({
                    userId: userData.id,
                    types: 'driver'
                });
                await UserRole.create({
                    roleId: 1,
                    userId: userData.id
                });
            }
            if (driver.scheduleid) {
                schedule = await Schedule.findOne({ where: { id: driver.scheduleid }});
            }
            if (!driver.scheduleid || !schedule) {
                let sch = await Schedule.create({
                    driverid: driver.id,
                    monday: {},
                    tuesday: {},
                    wednesday: {},
                    thursday: {},
                    friday: {},
                    saturday: {},
                    sunday: {}
                });
                DriverLess.update({
                    scheduleid: sch.id
                },{
                    where: {id:driver.id}
                });
            }
        }
        res.json({
            status: 1
        });
    } catch (error) {
        res.json({
            status: 0,
        });
    }
};

exports.createUser = async (req, res) => {
    try {
        let { ids } = req.body, { user } = req;
        let drivers, msg = 'drivers active for Mobile', driverArr = [];
        drivers = await DriverLess.findAndCountAll({
            where: {
                id: {
                    [Op.in]: ids
                }
            }
        });
        for (const driver of drivers.rows) {
            let obj = {
                id: driver.id,
                data: {
                    fname: driver.fname,
                    email: driver.email
                },
                user: user
            };
            const urls = req.get('host');
            const rull =  urls.slice(0, urls.indexOf('.'))
            let newUser = await Helper.createUserDriver(obj,rull);
            if (newUser.status) {
                driverArr.push(driver.id);
            }
        }
        res.json({
            status: 1,
            drivers: driverArr,
            msg,
        });
    } catch (error) {
        res.status(409).json(await Helper.errorMsg(error.message));
    }
};


