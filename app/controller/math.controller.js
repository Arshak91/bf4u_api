const uuidv1 = require('uuid/v1');
const axios = require('axios');
const moment = require('moment');
const generate = require('project-name-generator');
const dateFormat = require('dateformat');
const db = require('../config/db.config.js');
const env = process.env.SERVER == 'local' ? require('../config/env.local') : require('../config/env');
const Helper = require('../classes/helpers');
const OrderClass = require("../classes/order");

const Op = db.Sequelize.Op;

const Load = db.loadTemp;
const Shift = db.shift;
const Depo = db.depo;
const Job = db.job;
const Drivers = db.driver;
const Settings = db.settings;
const GlobalSettings = db.appSettings;

const shiftattributes = ["shift", "break_time", "max_shift","rest", "recharge","drivingtime"];
const request = require('request');

const headers = {
    'Content-Type': 'application/json',
    'x-ads-key': '28DF6A13265BA58C9B400819E7104943',
};

exports.get = (req, res) => {
    var id = req.params.id;

    Load.findOne({
            where: {
                id: id
            }
        })
        .then(load => {
            res.status(200).send({
                status: 1,
                msg: 'ok',
                data: load
            });
        }).catch(err => {
            res.status(500).send({
                'description': 'Can not access loads table',
                'error': err.msg
            });
        });
};

exports.mathReport = async (req, res) =>{
    
    let resp;
    if(!req.params){
        res.status(400).send({msg:"No Parameters"});
    }
    const { host } = req.headers;
    let action = req.params.action;
    let pid = req.params.pid;
    console.log(req.params);
    let uuid = await Job.findOne({where: {id:pid } } );
    console.log(uuid.UUID);
    if(!uuid.UUID){
        res.status(500).send({
            msg:'Fail',
            "Error": ` No found Plan with this id\` ID:${pid} `
        });
        return;
    }
    const url  = `${env.engineHost}:${env.enginrPort}/${action}?execid=${uuid.UUID}`;
   //  console.log(url);
    
    if(action == "log"){
        resp = await axios.get(url, {
            headers: {
                ...headers,
                HostNameAlGO: host
            }
        }).catch(err  => {
            
            res.status(500).send({
                msg:'Fail',
                "Error": err
            });
            
        }); 
        if(resp){
           
            res.status(200).send({
                msg:'OK',
                "Log": resp.data
            }); 

        }


    } else if(action == "status"){
        // const testUrl = "http://ads.lessplatform.com/status";
        resp = await axios.post(url, {
            headers: {
                ...headers,
                HostNameAlGO: host
            }
        }).catch(err => {
            res.status(err.response.status).send({
                msg:'Fail: '+ err.message,
                "Error": err
            });
         });  
         // 0: Started
         // 1: Running
         // 2: Failed
         // 3: Finished

         if(resp){
            
            let arr = [];
            let eta = 0;
            let etas = [];
            let percent;
            let finalstatus;
            resp.data.forEach(element => {
                console.log("Algo Response -> Status:", element.ThreadOutcome.Status, "ETA: ", element.ThreadOutcome.ETA, "Job ID: ", pid, "Percentage: ", element.ThreadOutcome.Percentage);
                let status = element.ThreadOutcome.Status;
                let ETA = element.ThreadOutcome.ETA;
                percent = element.ThreadOutcome.Percentage;
                    arr.push(status);
                    etas.push(ETA);
            });
            
            if (arr.includes(0)) {
                    finalstatus = 'Started';
                    eta = Math.max(...etas);
            } else if (arr.includes(1) ) {
                    finalstatus = 'Running';
                    eta = Math.max(...etas);
            } else if ( arr.includes(2) ) {
                    finalstatus = 'Failed';
                    eta = Math.max(...etas);
            } else {
                    finalstatus = 'Finished';
                    eta = Math.max(...etas);
            }
            console.log("Final -> Status:", finalstatus, "ETA: ", Math.max(...etas), "Job ID: ", pid);
            res.status(200).send({
                msg:'OK',
                "Status": finalstatus,
                "ETA": eta,
                "Percentage": percent
            });

        }


    }




} ;

// working version
exports.execute = async (req, res) => {
       
    try {
        
        // const prot = req.body.location.protocol;
        // let hs = req.body.location.host;
        
        // if(hs.includes('localhost')){
        //     // hs = 'beta.lessplatform.com:81';
        //     hs = 'test.beta.lessplatform.com';
        //     console.log("hs :", hs);
        // }
        // const host = prot + "//" + hs;
        // // const endpoint =  host + "/api/autoplan";
        const remoteInfo = await getRemoteInfo(req);
        const { endPoint } =  remoteInfo;
        const uid = uuidv1();
        let settings;
        settings = await GlobalSettings.findOne({});
        let {
            filters, depotId, loadStartTime, maxCount, timeLimit,
            selectedOrders, flowType, cluster, loadMinimize,
            fixedDriverCalc, firstStopCalc, Balanced, zoneGrouping,
            minNodesInCluster, deliverAsap, manualStartTime
        } = req.body;
        let { timezone, host } = req.headers;
        let shiftid = req.body.shiftId;
        let date = moment(req.body.date)._i;
        let maxStops = req.body.maxStop;
        let equipment = req.body.equipments;
        let dreturn  = req.body.return;
        let noTimeWindow  = req.body.noTimeWindow ? req.body.noTimeWindow : 0;
        let drivers;
        if (fixedDriverCalc) {
            drivers = await Helper.getDrivers({loadStartTime});
        }
        /**** */
        let isselected = false;
        let isfilters = false;
        if(filters) { isfilters = true; console.log("filters exist"); }
        if(selectedOrders.length > 0 ){
            
            isselected = true;
            if(selectedOrders.length < 3){
                res.status(500).send({
                    msg: "the selected orders are less then 3"
                });
                return;
            }
        }
        /** */
        if(!maxStops){ maxStops = Number.MAX_VALUE;}

        // let url = "/api/orders/getAutoPlan?";
        // if(isselected){ url = "/api/orders/byids/"; }
        let url = "/orders/getAutoPlan?";
        if(isselected){ url = "/orders/byids/"; }
        let link = remoteInfo.host + url;

        /*** */
        let obj = {};
        const params = {
            priorityCalc: false,
            singleRouteCalc: false,
            dryRun: false,
            seqMode: false,
            loadMinimize: loadMinimize == 1 ? true : false,
            fixedDriverCalc: fixedDriverCalc == 1 ? true : false,
            date: date,
            loadStartTime: loadStartTime,
            depoId: depotId,
            flowType: flowType,
            maxStops: maxStops,
            timeLimit: timeLimit ,
            selectedOrders: selectedOrders,
            oVRP: dreturn,
            shiftId: shiftid,
            cubeCalc: true,
            deliveryCalc: flowType == 2 ? true: false,
            DPC: 0, // -
            DurationMultiplier: !settings.dataValues.durationMultiplier ? 1.0 : settings.dataValues.durationMultiplier,
            IterationMultiplier: !settings.dataValues.IterationMultiplier ? 1.0 : settings.dataValues.IterationMultiplier,
            manualStartTime: manualStartTime ? true : false,
            firstStopCalc: firstStopCalc ? true : false,
            Balanced: Balanced ? true : false,
            zoneGrouping: zoneGrouping ? true : false,
            noTimeWindow: noTimeWindow ? true : false,
            minNodesInCluster: minNodesInCluster > 0 ? minNodesInCluster : 7,
            deliverAsap: deliverAsap ? true : false
        };

        if(filters != undefined){
            delete filters.deliverydateFrom;
            delete filters.pickupdateFrom;
        }
        let ordersWhere = {};
        if(!isselected){
            link += `limit=${maxCount}`;
            link += `&depoid=${depotId}`;
            link += `&flowType=${flowType}`;
            link += `&date=${date}`;
            link += `&isPlanned=0&noTimeWindow=${noTimeWindow}&`;
            ordersWhere = {
                limit: maxCount,
                depoid: depotId,
                flowType: flowType,
                date: date,
                isPlanned: 0,
                noTimeWindow: noTimeWindow,
                isselected
            };
        }else{
            let ostr =  selectedOrders.join(',');
            link += ostr;
            link += `?noTimeWindow=${noTimeWindow}`;
            ordersWhere = {
                ids: selectedOrders,
                noTimeWindow: noTimeWindow,
                isselected
            };
        }

        if(filters){
            if(!isselected){
                await Object.keys(filters).forEach(async function (item) {
                    if(filters[item]!= undefined)
                    {
                        if (item != 'flowType' ) {
                            await Helper.filters({
                                item: filters[item]
                            }, Op).then(() => {
                                if (item == "deliveryDateFrom" || item == "deliveryDateTo" || item == "pickupDateFrom" || item == "pickupDateTo" ) {
                                    link +=  item + "=" + filters[item] + "&";
                                    ordersWhere[item] = filters[item];
                                } else {
                                    link +=  item + "=" + encodeURIComponent(filters[item]) + "&";
                                    ordersWhere[item] = filters[item];
                                }
                            });
                        }

                    }
                });
            }

        }
        let orderCl = new OrderClass({
            data: ordersWhere
        });
        const Orders = await orderCl.sendAlgoOrders();
        const shift = await Shift.findOne({
            attributes: shiftattributes,
            where: {
                id: shiftid
            }
        });
        if (shift) {
            const depo = await Depo.findOne({
                attributes: ["lat","lon"],
                where: {
                    id: depotId
                }
            });
            if (depo) {
                if(!isselected){
                    link = link.slice(0, -1);
                }

                obj = {
                    "execid": uid,
                    "PostServer":endPoint,
                    "params": params,
                    "depo": depo.dataValues,
                    "shift": shift.dataValues,
                    "equipment": equipment,
                    "Orders": Orders.orders,
                    "host": host,
                    // "link": encodeURI(link),
                    // "Drivers": drivers,
                    "MapServer": `${env.mapHost}${env.mapPort}/table/v1/driving/`,
                    "Returnees": JSON.stringify({
                        timezone,
                        manualStartTime: manualStartTime ? 1 : 0,
                        user: req.user
                    })
                };
                const name = generate().dashed;

                const now = new Date();
                const jobDate = dateFormat(now, "dd-mm-yyyy");
                const jobName = `${name}-${jobDate}`;
                const job = await Job.create({
                    name: jobName,
                    UUID: uid,
                    params: {
                        ...params,
                        assignDrivers: req.body.assignDrivers
                    },
                });
                if (job) {
                    sendReqToEngine(obj,cluster).then(async engine => {
                        console.log('algo response', engine);
                        if (engine && engine.data.Data == 'Started.') {
                            
                            const startJob =  await Job.update({
                                status: 0
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            let ETA;
                            setTimeout(async () => {
                                ETA = await Helper.getStatusAutoplan(uid);
                                res.json({
                                    data: engine.data,
                                    job: startJob,
                                    jobId: job.id,
                                    ETA
                                });
                            }, 5000);
                        } else if (engine && engine.data.Data == 'Running.') {
                            const runJob =  await Job.update({
                                status: 1
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            let ETA;
                            setTimeout(async () => {
                                ETA = await Helper.getStatusAutoplan(uid);
                                res.json({
                                    data: engine.data,
                                    job: runJob,
                                    jobId: job.id,
                                    ETA
                                });
                            }, 5000);
                        } else if(engine && engine.data.Data == 'Finished.') {
                            await Job.update({
                                status: 3
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            let warning = false;
                            const finishJob =  await Helper.getOne({
                                key: 'UUID',
                                value: uid,
                                table: Job
                            });
                            if (finishJob.Infeasible && finishJob.Infeasible.length > 0) {
                                warning = true;
                            }
                            res.json({
                                warning,
                                data: engine.data,
                                job: finishJob,
                                jobId: job.id,
                                ETA: 0
                            });
                        }
                        else if(engine.data && !engine.data.Data) {
                            const failJob = await Job.update({
                                status: 2
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            
                            res.status(409).json({
                                status: false,
                                msg: engine.data.Message,
                                jobId: job.id,
                                data: engine.data
                            });
                        } else {
                            await Job.update({
                                status: 2
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            
                            res.status(409).json({
                                status: false,
                                msg: engine.data.Data,
                                jobId: job.id,
                                data: engine.data
                            });
                        }
                    }); 
                }  //  job If close 
            } 
        }
    } catch (err) {
        console.log('Algo Error: ', err.message);
        res.status(500).json({
            'description': 'Can not access',
            'error': err.msg ,
        });
    }
};

exports.executeTime = async (req, res) => {
       
    try {
        // const prot = req.body.location.protocol;
        // let hs = req.body.location.host;
        
        // if(hs.includes('localhost')){
        //     // hs = 'beta.lessplatform.com:81';
        //     hs = 'test.beta.lessplatform.com';
        //     console.log("hs :", hs);
        // }
        // const host = prot + "//" + hs;
        // // const endpoint =  host + "/api/autoplan";
        let { timezone, host } = req.headers;
        const remoteInfo = await getRemoteInfo(req);
        const { endPoint } =  remoteInfo;
        const uid = uuidv1();
 
        let settings;
        settings = await GlobalSettings.findOne({});
        let filters = req.body.filters;
        let shiftid = req.body.shiftId;
        let depotId = req.body.depotId;
        let date = moment(req.body.date)._i;
        let loadStartTime = req.body.loadStartTime;
        let maxCount = req.body.maxCount;
        let maxStops = req.body.maxStop;
        let timelimit = req.body.timeLimit;
        let selectedOrders = req.body.selectedOrders;
        let equipment = req.body.equipments;
        let flowType = req.body.flowType;
        let dreturn  = req.body.return;
        let cluster  = req.body.cluster;
        let loadMinimize  = req.body.loadMinimize;
        let fixedDriverCalc  = req.body.fixedDriverCalc;
        let firstStopCalc  = req.body.firstStopCalc;
        let Balanced  = req.body.Balanced;
        let zoneGrouping  = req.body.zoneGrouping;
        let noTimeWindow  = req.body.noTimeWindow ? req.body.noTimeWindow : 0;
        let { minNodesInCluster, deliverAsap, manualStartTime } = req.body;

        /**** */
        if(!maxStops){ maxStops = Number.MAX_VALUE;}
        let isselected = false;
        let isfilters = false;
        if(filters){ isfilters = true; console.log("filters exist"); }
        if(selectedOrders.length > 0 ){
            isselected = true;
            if(selectedOrders.length < 3){
                res.status(500).send({
                    msg: "the Selected orders are less then 3"
                });
                return;
            }
        }
        /** */
        // let url = "/api/orders/getAutoPlan?";
        // if(isselected){ url = "/api/orders/byids/"; }
        let url = "/orders/getAutoPlan?";
        if(isselected){ url = "/orders/byids/"; }
        let link = remoteInfo.host + url;
        /*** */
        let obj ={};
        var params = {
            priorityCalc: false,
            singleRouteCalc: false,
            dryRun: false,
            seqMode: false,
            loadMinimize: loadMinimize == 1 ? true : false,
            fixedDriverCalc: fixedDriverCalc == 1 ? true : false,
            date: date,
            loadStartTime: loadStartTime,
            depoId: depotId,
            flowType: flowType,
            maxStops: maxStops,
            timeLimit: timelimit ,
            selectedOrders: selectedOrders,
            oVRP: dreturn,
            shiftId: shiftid,
            cubeCalc: true,
            deliveryCalc: flowType == 2 ? true: false,
            DurationMultiplier: !settings.dataValues.durationMultiplier ? 1.0 : settings.dataValues.durationMultiplier,
            IterationMultiplier: !settings.dataValues.IterationMultiplier ? 1.0 : settings.dataValues.IterationMultiplier,
            manualStartTime: manualStartTime ? true : false,
            firstStopCalc: firstStopCalc ? true : false,
            Balanced: Balanced ? true : false,
            zoneGrouping: zoneGrouping ? true : false,
            noTimeWindow: noTimeWindow ? true : false,
            minNodesInCluster: minNodesInCluster > 0 ? minNodesInCluster : 7,
            deliverAsap: deliverAsap ? true : false
        };

        if(filters != undefined){
            delete filters.deliverydateFrom;
            delete filters.pickupdateFrom;
        }
        let ordersWhere = {};
        if(!isselected){
            link += `limit=${maxCount}`;
            link += `&depoid=${depotId}`;
            link += `&flowType=${flowType}`;
            link += `&date=${date}&`;
            link += `isPlanned=0&noTimeWindow=${noTimeWindow}&`;
            ordersWhere = {
                limit: maxCount,
                depoid: depotId,
                flowType: flowType,
                date: date,
                isPlanned: 0,
                noTimeWindow: noTimeWindow,
                isselected
            };
        }else{
            let ostr =  selectedOrders.join(',');
            link += ostr;
            link += `?noTimeWindow=${noTimeWindow}`;
            ordersWhere = {
                ids: selectedOrders,
                noTimeWindow: noTimeWindow,
                isselected
            };
        }
       
        if(filters){
            if(!isselected){
                await Object.keys(filters).forEach(async function (item) {
                    if(filters[item]!= undefined)
                    {
                        if (item != 'flowType' ) {
                            await Helper.filters({
                                item: filters[item]
                            }, Op).then(() => {
                                if (item == "deliveryDateFrom" || item == "deliveryDateTo" || item == "pickupDateFrom" || item == "pickupDateTo" ) {
                                    link +=  item + "=" + filters[item] + "&";
                                    ordersWhere[item] = filters[item];
                                } else {
                                    link +=  item + "=" + encodeURIComponent(filters[item]) + "&";
                                    ordersWhere[item] = filters[item];
                                }
                            });                       
                        }
                        
                    }
                });
            }
        }
        let orderCl = new OrderClass({
            data: ordersWhere
        });
        const Orders = await orderCl.sendAlgoOrders();
        const shift = await Shift.findOne({
            attributes: shiftattributes,
            where: {
                id: shiftid
            }
            
        });
        if (shift) {
            const depo = await Depo.findOne({
                attributes: ["lat","lon"],
                where: {
                    id: depotId
                }
            });
            if (depo) {
                if(!isselected){
                    link = link.slice(0, -1);
                }
                            
                obj = {
                    "execid": uid,
                    "PostServer":endPoint,
                    "params": params,
                    "depo": depo.dataValues,
                    "shift": shift.dataValues,
                    "equipment": equipment,
                    // "link": encodeURI(link),
                    "host": host,
                    "Orders": Orders.orders,
                    "MapServer": `${env.mapHost}${env.mapPort}/table/v1/driving/`,
                    "Returnees": JSON.stringify({
                        timezone,
                        manualStartTime: manualStartTime ? 1 : 0
                    })
                };
                const name = generate().dashed;
                console.log(name);
                
                const now = new Date();
                const jobDate = dateFormat(now, "dd-mm-yyyy");
                const jobName = `${name}-${jobDate}`;
                const job = await Job.create({
                    name: jobName,
                    UUID: uid,
                    params: {
                        ...params,
                        assignDrivers: req.body.assignDrivers
                    },
                });
 
                if (job) {
                    sendReqToEngineTime(obj,cluster).then(async engine => {
                        if (engine && engine.data.Data == 'Started.') {
                            
                            const startJob =  await Job.update({
                                status: 0
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            let ETA;
                            setTimeout(async () => {
                                ETA = await Helper.getStatusAutoplan(uid);
                                res.json({
                                    data: engine.data,
                                    job: startJob,
                                    jobId: job.id,
                                    ETA
                                });
                            }, 5000);
                        } else if (engine && engine.data.Data == 'Running.') {
                            const runJob =  await Job.update({
                                status: 1
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            let ETA;
                            setTimeout(async () => {
                                ETA = await Helper.getStatusAutoplan(uid);
                                res.json({
                                    data: engine.data,
                                    job: runJob,
                                    jobId: job.id,
                                    ETA
                                });
                            }, 5000);
                        } else if(engine && engine.data.Data == 'Finished.') {
                            await Job.update({
                                status: 3
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            let warning = false;
                            const finishJob =  await Helper.getOne({
                                key: 'UUID',
                                value: uid,
                                table: Job
                            });
                            if (finishJob.Infeasible && finishJob.Infeasible.length > 0) {
                                warning = true;
                            }
                            res.json({
                                warning,
                                data: engine.data,
                                job: finishJob,
                                jobId: job.id,
                                ETA: 0
                            });
                        }
                        else if(!engine.data.Data) {
                            const failJob = await Job.update({
                                status: 2
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            
                            res.status(409).json({
                                status: false,
                                msg: engine.data.Message,
                                jobId: job.id,
                                data: engine.data
                            });
                        } else {
                            await Job.update({
                                status: 2
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            
                            res.status(409).json({
                                status: false,
                                msg: engine.data.Data,
                                jobId: job.id,
                                data: engine.data
                            });
                        }
                    }); 
                }  //  job If close 
            } 
        }
    } catch (err) {
        console.log('Algo Error: ', err.message);
        res.status(500).json({
            'description': 'Can not access',
            'error': err.msg ,
        });
    }
};

exports.executeInstance = async (req, res) => {   // not working  
       
    try {
        
        // const prot = req.body.location.protocol;
        // let hs = req.body.location.host;
        
        // if(hs.includes('localhost')){
        //     // hs = 'beta.lessplatform.com:81';
        //     hs = 'test.beta.lessplatform.com';
        //     console.log("hs :", hs);
        // }
        // const host = prot + "//" + hs;
        // // const endpoint =  host + "/api/autoplan";
        let { timezone, host } = req.headers;
        const remoteInfo = await getRemoteInfo(req);
        const { endPoint } =  remoteInfo;
        const uid = uuidv1();

        let filters = req.body.filters;
        let shiftid = req.body.shiftId;
        let depotId = req.body.depotId;
  
        let date = moment(req.body.date)._i, settings;
        let sday;

        settings = await GlobalSettings.findOne({});
        const thedate = new Date(date);
        let day = thedate.getDay();
            if(day == 1) { sday = "monday";   }
            if(day == 2) { sday = "tuesday";  }
            if(day == 3) { sday = "wednesday";}
            if(day == 4) { sday = "thursday"; }
            if(day == 5) { sday = "friday";   }
            if(day == 6) { sday = "saturday"; }
            if(day == 0) { sday = "sunday";   }

        // let loadStartTime = req.body.loadStartTime;
        let maxCount = req.body.maxCount;
        let maxStops = req.body.maxStop;
        let timelimit = req.body.timeLimit;
        let selectedOrders = req.body.selectedOrders;
        // let equipment = req.body.equipments;
        let flowType = req.body.flowType;
        let dreturn  = req.body.return;
        let cluster  = req.body.cluster;
        let drivers = req.body.drivers;
        let loadMinimize  = req.body.loadMinimize;
        let fixedDriverCalc  = req.body.fixedDriverCalc;
        let firstStopCalc  = req.body.firstStopCalc;
        let Balanced  = req.body.Balanced;
        let zoneGrouping  = req.body.zoneGrouping;
        let noTimeWindow  = req.body.noTimeWindow ? req.body.noTimeWindow : 0;
        let { minNodesInCluster, deliverAsap, manualStartTime } = req.body;

        /**** */
        if(!maxStops){ maxStops = Number.MAX_VALUE;}
        let isselected = false;
        let isfilters = false;
        if(filters){ isfilters = true; console.log("filters exist"); }
        if(selectedOrders.length > 0 ){
            isselected = true;
            if(selectedOrders.length < 3){
                res.status(500).send({
                    msg: "the Selected orders are less then 3"
                });
                return;
            }
        }

        // let url = "/api/orders/getAutoPlan?";
        // if(isselected){ url = "/api/orders/byids/"; }
        let url = "/orders/getAutoPlan?";
        if(isselected){ url = "/orders/byids/"; }
        let link = remoteInfo.host + url;
        let drvs;
        drvs = await Drivers.findAndCountAll({
            where: {
                id: {
                    [Op.in]:drivers
                }
            },
            include: [
                { model: db.shift },
                { model: db.schedules },
                {
                    model: db.companyequipment,
                    include: [{ model: db.equipment }]
                },
            ],
        }).catch(err => {
            res.status(500).send({
                status:0,
                msg: "Fail",
                "Error": err
                });
            });
        let equipments = [] ;
        let drivertimes = [];
        for (const drv of drvs.rows) {
            let equipment = {};
            let drivertime ={};
            if(drv.schedule){
                let dst;
                let time = drv.dataValues.schedule.dataValues[sday].from ? drv.schedule[sday].from.split('T') : ['2020-03-26T', '00:00:00.000Z'];

                if(time[1]){ time = time[1]; } else { time = "00:00:00.000Z"; }
                let milliseconds = (Number(time.split(':')[0])*60*60*1000)+(Number(time.split(':')[1])*60*1000)+(Number(time.split(':')[2].split('.')[0])*1000)+(Number(time.split('.')[1].slice(0, -1)*1));
                let finishDate = new Date(date).getTime() + milliseconds;
                // dst = `${date}T${time}`;
                dst = moment(finishDate, "x").format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
                drivertime.startTime = dst;
                drivertime.Id = drv.id;
                drivertime.Virtual = false;
                // if(!drv.schedule[sday].from) {
                //     drivertime.startTime = date;
                // }
            }
            else {
                let d = date.split('T');
                let time = "00:00:00.000Z";
                let dst = `${d[0]}T${time}`;
                drivertime.startTime = dst;
                drivertime.Id = drv.id;
                drivertime.Virtual = false;
            }
            let equipmet = drv.companyEquipment ? drv.companyEquipment.dataValues.equipment.dataValues : null;
            drivertimes.push(drivertime);
            if(drv.companyEquipment){
                equipment.typeId = equipmet.id;
                equipment.carCount = 1;
                equipment.feet = equipmet.value;
                equipment.weight = equipmet.maxweight;
                equipment.cube =  equipmet.maxVolume;
            }
            else {
                //  not final yet
                equipment.typeId = 0;
                equipment.carCount = 1;
                equipment.feet = 53;
                equipment.weight = 45000;
                equipment.cube =  4865;
            }

            equipments.push(equipment);
        }
        let obj ={};
        var params = {
            priorityCalc: false,
            singleRouteCalc: false,
            dryRun: false,
            seqMode: false,
            loadMinimize: loadMinimize == 1 ? true : false,
            fixedDriverCalc: fixedDriverCalc == 1 ? true : false,
            date: date,
            loadStartTime: date,
            depoId: depotId,
            flowType: flowType,
            maxStops: maxStops,
            timeLimit: timelimit ,
            selectedOrders: selectedOrders,
            oVRP: dreturn,
            shiftId: drvs.rows[0].shiftId,
            cubeCalc: true,
            deliveryCalc: flowType == 2 ? true: false,
            DurationMultiplier: !settings.dataValues.durationMultiplier ? 1.0 : settings.dataValues.durationMultiplier,
            IterationMultiplier: !settings.dataValues.IterationMultiplier ? 1.0 : settings.dataValues.IterationMultiplier,
            manualStartTime: manualStartTime ? true : false,
            firstStopCalc: firstStopCalc ? true : false,
            Balanced: Balanced ? true : false,
            zoneGrouping: zoneGrouping ? true : false,
            noTimeWindow: noTimeWindow ? true : false,
            minNodesInCluster: minNodesInCluster > 0 ? minNodesInCluster : 7,
            deliverAsap: deliverAsap ? true : false
        };
        // console.log(obj);
        // console.log(date);
        if(filters != undefined){
            delete filters.deliverydateFrom;
            delete filters.pickupdateFrom;
        }
        let ordersWhere = {};
        if(!isselected){
            link += `limit=${maxCount}`;
            link += `&depoid=${depotId}`;
            link += `&flowType=${flowType}`;
            link += `&date=${date}&`;
            link += `isPlanned=0&noTimeWindow=${noTimeWindow}&`;
            ordersWhere = {
                limit: maxCount,
                depoid: depotId,
                flowType: flowType,
                date: date,
                isPlanned: 0,
                noTimeWindow: noTimeWindow,
                isselected
            };
        }else{
            let ostr =  selectedOrders.join(',');
            link += ostr;
            link += `?noTimeWindow=${noTimeWindow}`;
            ordersWhere = {
                ids: selectedOrders,
                noTimeWindow: noTimeWindow,
                isselected
            };
        }

        if(filters){
            if(!isselected){
            await Object.keys(filters).forEach(async function (item) {
                if(filters[item]!= undefined)
                {
                    if (item != 'flowType' ) {
                        await Helper.filters({
                            item: filters[item]
                        }, Op).then(() => {
                            if (item == "deliveryDateFrom" || item == "deliveryDateTo" || item == "pickupDateFrom" || item == "pickupDateTo" ) {
                                link +=  item + "=" + filters[item] + "&";
                                ordersWhere[item] = filters[item];
                            } else {
                                link +=  item + "=" + encodeURIComponent(filters[item]) + "&";
                                ordersWhere[item] = filters[item];
                            }
                        });
                    }

                }
            });
            }
        }

        let orderCl = new OrderClass({
            data: ordersWhere
        });
        const Orders = await orderCl.sendAlgoOrders();

        const shift = await Shift.findOne({
            attributes: shiftattributes,
            where: { id: drvs.rows[0].dataValues.shiftId }
        });
        if (shift) {
            const depo = await Depo.findOne({
                attributes: ["lat","lon"],
                where: { id: depotId }
            });
            if (depo) {
                if(!isselected){
                    link = link.slice(0, -1);
                }
                obj = {
                    "execid": uid,
                    "PostServer": endPoint,
                    "params": params,
                    "depo": depo.dataValues,
                    "shift": shift.dataValues,
                    "equipment": equipments,
                    "Drivers": drivertimes,
                    "host": host,
                    // "link": encodeURI(link),
                    "Orders": Orders.orders,
                    "MapServer": `${env.mapHost}${env.mapPort}/table/v1/driving/`,
                    "Returnees": JSON.stringify({
                        timezone,
                        manualStartTime: manualStartTime ? 1 : 0
                    })
                };
                const name = generate().dashed;

                const now = new Date();
                const jobDate = dateFormat(now, "dd-mm-yyyy");
                const jobName = `${name}-${jobDate}`;
                const job = await Job.create({
                    name: jobName,
                    UUID: uid,
                    params: {
                        ...params,
                        assignDrivers: req.body.assignDrivers
                    },
                    filters,
                    status: [],
                    eta: [],
                    percentage: [],
                    loadOrderIds: [],
                    drivingminutes: [],
                    totalRunTime: [],
                    totalDistance: [],
                    totalDuration: [],
                    Infeasible: [],
                    loads: []
                });

                if (job) {
                    sendReqToEngineInstance(obj,cluster).then(async engine => {
                        if (engine && engine.data.Data == 'Started.') {
                            
                            const startJob =  await Job.update({
                                status: 0
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            let ETA;
                            setTimeout(async () => {
                                ETA = await Helper.getStatusAutoplan(uid);
                                res.json({
                                    data: engine.data,
                                    job: startJob,
                                    jobId: job.id,
                                    ETA
                                });
                            }, 5000);
                        } else if (engine && engine.data.Data == 'Running.') {
                            const runJob =  await Job.update({
                                status: 1
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            let ETA;
                            setTimeout(async () => {
                                ETA = await Helper.getStatusAutoplan(uid);
                                res.json({
                                    data: engine.data,
                                    job: runJob,
                                    jobId: job.id,
                                    ETA
                                });
                            }, 5000);
                        } else if(engine && engine.data.Data == 'Finished.') {
                            await Job.update({
                                status: 3
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            let warning = false;
                            const finishJob =  await Helper.getOne({
                                key: 'UUID',
                                value: uid,
                                table: Job
                            });
                            if (finishJob.Infeasible && finishJob.Infeasible.length > 0) {
                                warning = true;
                            }
                            res.json({
                                warning,
                                data: engine.data,
                                job: finishJob,
                                jobId: job.id,
                                ETA: 0
                            });
                        }
                        else if(engine && !engine.data.Data) {
                            const failJob = await Job.update({
                                status: 2
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            
                            res.status(409).json({
                                status: false,
                                msg: engine.data.Message,
                                jobId: job.id,
                                data: engine.data
                            });
                        } else {
                            await Job.update({
                                status: 2
                            }, {
                                where: {
                                    UUID: uid
                                }
                            });
                            
                            res.status(409).json({
                                status: false,
                                msg: engine.data.Data,
                                jobId: job.id,
                                data: engine.data
                            });
                        }
                    }); 
                }  //  job If close 
            } 
        }
    } catch (err) {
        console.log('Algo Error: ', err.message);
        res.status(500).json({
            'msg': 'Can not access',
            'error': err.msg ,
        });
    }
};

// ---------------------------
const sendReqToEngine = async (obj, cluster) => {
    try {
        console.log("VRP: ",JSON.stringify(obj));
        let url;
        if (cluster == 0) {
            
            url  = `${env.engineHost}:${env.enginrPort}/dispatch/vrp/singular`;
            // url  = `${env.engineHost}:${env.enginrPort}/create/vrp/single`;
        }
        if (cluster == 1) {
            
            url  = `${env.engineHost}:${env.enginrPort}/dispatch/vrp/cluster`;
            // url  = `${env.engineHost}:${env.enginrPort}/create/vrp/cluster`;
        }
      
        const res = await axios.post(url, obj, {
            headers: {
                ...headers,
                HostNameAlGO: obj.host
            }
        });
        // console.log('res!!', res);
        return res;
        
    } catch (error) {
        console.error(error.message);
        return {
            data: {
                Message: error.message
            }
        };
    }
    
};

const sendReqToEngineTime = async (obj, cluster) => {
    try {
        console.log("T-VRP: ",JSON.stringify(obj));
        let url;
        if (cluster == 0) {
            
            url  = `${env.engineHost}:${env.enginrPort}/dispatch/tvrp/singular`;
            // url  = `${env.engineHost}:${env.enginrPort}/create/tvrp/single`;
        }
        if (cluster == 1) {
            
            url  = `${env.engineHost}:${env.enginrPort}/dispatch/tvrp/cluster`;
            // url  = `${env.engineHost}:${env.enginrPort}/create/tvrp/cluster`;
        }
      
        const res = await axios.post(url, obj, {
            headers: {
                ...headers,
                HostNameAlGO: obj.host
            }
        });
        // console.log('res!!', res);
        return res;
        
    } catch (error) {
        console.error(error);
        return;
    }
    
};

const sendReqToEngineInstance = async (obj, cluster) => {
    try {
        console.log("QAP: ",JSON.stringify(obj));
        let url;
        if (cluster == 0) {
            
            url  = `${env.engineHost}:${env.enginrPort}/dispatch/qap/singular`;
            // url  = `${env.engineHost}:${env.enginrPort}/create/qap/single`;
        }
        if (cluster == 1) {
            
            url  = `${env.engineHost}:${env.enginrPort}/dispatch/qap/cluster`;
            // url  = `${env.engineHost}:${env.enginrPort}/create/qap/cluster`;
        }
        const res = await axios.post(url, obj, {
            headers: {
                ...headers,
                HostNameAlGO: obj.host
            }
        });
        // console.log('res!!', res);
        return res;
        
    } catch (error) {
        console.error(error);
        return;
    }
    
};

const sendReqToEnginePDP = async (obj, cluster) => {
    try {
        console.log("VRP: ", JSON.stringify(obj));

        let url;
        if (cluster == 0) {
            url  = `${env.engineHost}:${env.enginrPort}/dispatch/pdp/singular`;
        }else if (cluster == 1) {
            url  = `${env.engineHost}:${env.enginrPort}/dispatch/pdp/cluster`;
        }
      
        console.log(url)
        const res = await axios.post(url, obj);
        // console.log('res!!', res);
        return res;
        
    } catch (error) {
        console.error(error);
        return;
    }
};

function getRemoteInfo(req){    
    let host, endPoint;
    let api="";
    let uri = api+"/autoplan";
    if(req.headers.host == "192.168.1.87:8080" || req.headers.host == "localhost:8080"){
        // endPoint =  "http://test2.beta.lessplatform.com"+ uri;
        // host = "http://test2.beta.lessplatform.com";
        // endPoint =  "http://idn.beta.lessplatform.com"+ uri;
        // host = "http://idn.beta.lessplatform.com";
        endPoint =  "http://192.168.1.87:8080"+ uri;
        host = "http://192.168.1.87:8080";
    }else{
        endPoint = `http://${req.body.location.host}` + uri;
        host = `http://${req.body.location.host}`;
    }
    let info = {
        host,
        userName:req.user.username,
        email:req.user.email,
        userType:req.user.type,
        userAgent:req.headers['user-agent'],
        endPoint,
    };
    return info;
}








// ---------------------- //
// F L A T B E D
// ---------------------- //


exports.executeLoadBoards = async (req, res) => {
    const remoteInfo = await getRemoteInfoFlatbed(req, 'loadboard');
    
    // console.log(' ---------------- load ')
    
    const ordersUrl = "/loadboards/engine/orders?";

    executeFlatbed(req, res, remoteInfo, ordersUrl);
}

exports.executeCapacityBoards = async (req, res) => {
    const remoteInfo = await getRemoteInfoFlatbed(req, 'capacityboard');

    // console.log(' ---------------- cap ')
    
    const ordersUrl = "/capacityboards/engine/orders?";

    executeFlatbed(req, res, remoteInfo, ordersUrl);
}

// exports.executePublicBoards = async (req, res) => {

async function executeFlatbed(req, res, remoteInfo, ordersUrl){

    // console.log(' --', req.user.id)

    //const link = '/api/loadboards/engine/orders'

    try {
        
        // const prot = req.body.location.protocol;
        // let hs = req.body.location.host;
        
        // if(hs.includes('localhost')){
        //     // hs = 'beta.lessplatform.com:81';
        //     hs = 'test.beta.lessplatform.com';
        //     console.log("hs :", hs);
        // }
        // const host = prot + "//" + hs;
        // // const endpoint =  host + "/api/autoplan";

        // const remoteInfo = await getRemoteInfoFlatbed(req);
        const { endPoint } =  remoteInfo;

        // console.log(' endPoint:', endPoint);

        const uid = uuidv1();
        const equipments = [
            // {
            //     typeId : equipment.id, // get from db-s
            //     carCount : 1,
            //     feet : equipment.value, // get from db-s
            //     cube : equipment.maxVolume, // get from db-s
            //     weight : equipment.maxweight // get from db-s
            // }
            {
                typeId : 1,
                carCount : 1,
                feet : 500.3,
                cube : 100,
                weight : 65000,
            }
        ];

        let date0 = req.body.date
        // date0 = '2020-07-01T04:00:00'

        console.log(req.body)
        console.log(date0)

        let filters = req.body.filters;
        let shiftid = 1; // req.body.shiftId;
        let depotId = 0; // req.body.depotId;
        let date = moment(date0)._i; // moment(req.body.date)._i;
        let loadStartTime = date // new Date(date0); // req.body.loadStartTime;
        let maxCount = 99999; //req.body.maxCount;
        let maxStops = 10; //req.body.maxStop;
        let timelimit = 100000; // req.body.timeLimit;
        let selectedOrders = []; // req.body.selectedOrders;
        let equipment = equipments; // req.body.equipments;
        let flowType = 3; // req.body.flowType;
        let dreturn = 0; // req.body.return;
        let Return = 0;
        let cluster = 0; // req.body.cluster;
        let loadMinimize = 1; // req.body.loadMinimize;
        let fixedDriverCalc = false; // req.body.fixedDriverCalc;

        /**** */
        let isselected = false;
        // let isfilters = false;
        // if(filters) { isfilters = true; console.log("filters exist"); }

        // console.log(req.body.date)
        // console.log(date)

        if(selectedOrders.length > 0 ){
            isselected = true;
            if(selectedOrders.length < 3){
                return res.status(500).send({
                    msg: "the selected orders are less then 3"
                });
            }
        }
        /** */
        if(!maxStops){ maxStops = Number.MAX_VALUE;}

        let url = ordersUrl; // "/loadboards/engine/orders?";
        // if(isselected){ url = "/orders/byids/"; }
        let link = remoteInfo.host + url;

        /*** */
        // let obj = {};
        const params = {
            flatBedCalc: true,
            priorityCalc: false,
            singleRouteCalc: false,
            dryRun: false,
            seqMode: false,
            loadMinimize: loadMinimize, // == 1 ? true : false,
            fixedDriverCalc: fixedDriverCalc, // == 1 ? true : false,
            date: date,
            loadStartTime: loadStartTime,
            depoId: depotId,
            flowType: flowType,
            maxStops: maxStops,
            timeLimit: timelimit ,
            selectedOrders: selectedOrders,
            oVRP: dreturn,
            Return: Return,
            shiftId: shiftid,
            cubeCalc: true,
            deliveryCalc: flowType == 2 ? true: false,
            DPC: 0 // -
        };

        if(filters != undefined){
            delete filters.deliverydateFrom;
            delete filters.pickupdateFrom;
        }
        if(!isselected){
            // link += `depoid=${depotId}`;
            // link += `&limit=${maxCount}`;
            // link += `&flowType=${flowType}`;
            // link += `&isPlanned=0&`;

            link += `&date=${date}&userid=${req.user.id}`;

            // console.log(' --', req.user.id);
            // link += `&date=${date}`;
            // link += `&userid=${req.user.id}`;
            // console.log(' --', link)
        }else{
            let ostr = selectedOrders.join(',');
            link += ostr;
        }
       
        if(filters){
            if(!isselected){
                Object.keys(filters).forEach(function (item){
                    if(filters[item]!= undefined){
                        if (item != 'flowType' ) {
                            Helper.filters({
                                item: filters[item]
                            }, Op).then(() => {
                                if (item == "deliveryDateFrom" || item == "deliveryDateTo" || item == "pickupDateFrom" || item == "pickupDateTo" ) {
                                    link +=  item + "=" + filters[item] + "&";
                                } else {
                                    link +=  item + "=" + encodeURIComponent(filters[item]) + "&";
                                }
                            });                       
                        }
                    }
                });
            }
        }
        
        const shift = await Shift.findOne({
            attributes: shiftattributes,
            where: {
                id: shiftid
            }    
        });
        if (shift) {
            
            if(!isselected && link.substr(link.length-1, 1) == '&'){
                link = link.slice(0, -1);  
            }

            // console.log(' ---- ', link)

            const obj = {
                "execid": uid,
                "PostServer": endPoint,
                "params": params,
                // "depo": depo.dataValues,
                "shift": shift.dataValues,
                "equipment": equipment,
                "link": link,
                //"link": "http://ads.lessplatform.com/random?count=100&seed=1",
                "MapServer": `${env.mapHost}${env.mapPort}/table/v1/driving/`
            };
            const name = generate().dashed;
            // console.log(obj);
            
            const now = new Date();
            const jobDate = dateFormat(now, "dd-mm-yyyy");
            const jobName = `${name}-${jobDate}`;
            const job = await Job.create({
                name: jobName,
                UUID: uid,
                params: params,
            });

            if (job) {
                sendReqToEnginePDP(obj, cluster).then(async engine => {
                    if (engine && engine.data.Data == 'Started.') {
                        const startJob =  await Job.update({
                            status: 0
                        }, {
                            where: {
                                UUID: uid
                            }
                        });
                        let ETA;
                        setTimeout(async () => {
                            ETA = await Helper.getStatusAutoplan(uid);
                            res.json({
                                data: engine.data,
                                job: startJob,
                                jobId: job.id,
                                ETA
                            });
                        }, 5000);
                    } else if (engine && engine.data.Data == 'Running.') {
                        const runJob =  await Job.update({
                            status: 1
                        }, {
                            where: {
                                UUID: uid
                            }
                        });
                        let ETA;
                        setTimeout(async () => {
                            ETA = await Helper.getStatusAutoplan(uid);
                            res.json({
                                data: engine.data,
                                job: runJob,
                                jobId: job.id,
                                ETA
                            });
                        }, 5000);
                    } else if(engine && engine.data.Data == 'Finished.') {
                        await Job.update({
                            status: 3
                        }, {
                            where: {
                                UUID: uid
                            }
                        });
                        let warning = false;
                        const finishJob =  await Helper.getOne({
                            key: 'UUID',
                            value: uid,
                            table: Job
                        });
                        if (finishJob.Infeasible && finishJob.Infeasible.length > 0) {
                            warning = true;
                        }
                        res.json({
                            warning,
                            data: engine.data,
                            job: finishJob,
                            jobId: job.id,
                            ETA: 0
                        });
                    }
                    else if(engine && !engine.data.Data) {
                        const failJob = await Job.update({
                            status: 2
                        }, {
                            where: {
                                UUID: uid
                            }
                        });
                        
                        res.status(409).json({
                            status: false,
                            msg: engine.data.Message,
                            jobId: job.id,
                            data: engine.data
                        });
                    }
                }); 
            }  //  job If close 
        }
    } catch (err) {
        res.status(500).json({
            'description': 'Can not access',
            'error': err.msg ,
        });
    }


    return

    try{
        let date = req.query.date

        // get capacity boards
        const CapacityBoard = require('../mongoModels/CapacityBoardModel');
        const capacityBoards = await CapacityBoard.find(filter).sort('_id').limit(perPage).skip(perPage * (page - 1))

        // get large capacity
        let largeCB = 0
        capacityBoards.forEach(cb => {
            if(largeCB < cb.availableSize){
                largeCB = cb.availableSize // availableWeight
            }
        })

        // get loadboard filter fith max size and weight
        const LoadBoard = require('../mongoModels/LoadBoardModel');
        const loadBoards = await LoadBoard.find({
            
            // postedDate: { $and: [
            //     { $gte: date },
            //     { $lte: date }
            // ] }


            // filter['$or'] = [
            //     { 'order.company.pickupCompanyName': query.company },
            //     { 'order.company.deliveryCompanyName': query.company }
            // ]
        })

        // get orders
        const cutromOrders = await Order.findAll({ where: { }  });

        // combine

        // create post data
        const orders = []
        capacityBoards.forEach(cb => {
            orders.push({
                "id": cb._id,
                "feet": cb.order.usedSize,
                "weight": cb.order.usedWeight,
                // "cube": 0,
                "flowType": 3,
                "deliveryLat": cb.order.end.lat,
                "deliveryLon": cb.order.end.lon,
                "pickupLat": cb.order.start.lat,
                "pickupLon": cb.order.start.lat,
                "deliverydateFrom": cb.order.end.timeWindowFrom,
                "deliverydateTo": cb.order.end.timeWindowTo,
                "pickupdateFrom": cb.order.start.timeWindowFrom,
                "pickupdateTo": cb.order.start.timeWindowTo,
                "servicetime": 1200
            })
        })
        loadBoards.forEach(lb => {
            orders.push({
                "id": lb._id,
                "feet": lb.order.size,
                "weight": lb.order.weight,
                // "cube": 0,
                "flowType": 3,
                "deliveryLat": lb.order.end.lat,
                "deliveryLon": lb.order.end.lon,
                "pickupLat": lb.order.start.lat,
                "pickupLon": lb.order.start.lat,
                "deliverydateFrom": lb.order.end.timeWindowFrom,
                "deliverydateTo": lb.order.end.timeWindowTo,
                "pickupdateFrom": lb.order.start.timeWindowFrom,
                "pickupdateTo": lb.order.start.timeWindowTo,
                "servicetime": 1200
            })
        })

        const data = {
            "status": 1,
            "msg": "ok",
            "data": {
                "orders": orders ,
                "count": orders.length
            }
        }

        console.log(data)

        // request to api



        // // create place where will get orders vor AI
    
        const data2 = {
            "status": 1,
            "msg": "ok",
            "data": {
                "orders": [
                    {
                        "id": 221245,
                        "feet": null,
                        "weight": 9999,
                        "cube": 9999,
                        "flowType": 2,
                        "deliveryLat": "33.817132",
                        "deliveryLon": "-101.3954168",
                        "pickupLat": "37.0721692",
                        "pickupLon": "-100.7354768",
                        "deliverydateFrom": "2020-05-25T18:02:12.851562-04:00",
                        "deliverydateTo": "2020-05-26T03:02:12.8516367-04:00",
                        "pickupdateFrom": "2020-05-25T15:02:12.8516712-04:00",
                        "pickupdateTo": "2020-05-26T02:02:12.8517028-04:00",
                        "servicetime": 1200
                    }
                ],
                "count": 1
            }
        }

        res.status(200).json({
            ok: "ok"
        })
    }catch(ex){
        res.json({ex});
    }

};


function getRemoteInfoFlatbed(req, type){    
    let host, endPoint;
    let api="";
    let uri = `${api}/autoplan/flatbed?type=${type}`;
    if(req.headers.host == "localhost:8080"){
        // endPoint = "http://192.168.88.38:8080"+ uri;
        // host = "http://192.168.88.38:8080";
        endPoint = "http://192.168.0.104:8080"+ uri;
        host = "http://192.168.0.104:8080";
        // endPoint = "http://192.168.1.7:8080"+ uri;
        // host = "http://192.168.1.7:8080";
        // endPoint = "http://172.20.10.3:8080"+ uri;
        // host = "http://172.20.10.3:8080";
    }else{
        // endPoint = `${env.engineHost}${uri}`;
        endPoint = `http://flatbed.beta.lessplatform.com${uri}`;
        
        host = `http://flatbed.beta.lessplatform.com`;
    }
    let info = {
        host,
        userName:req.user.username,
        email:req.user.email,
        userType:req.user.type,
        userAgent:req.headers['user-agent'],
        endPoint,
    };
    return info;
}