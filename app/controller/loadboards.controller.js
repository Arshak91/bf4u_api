const db = require("../config/db.config.js");
const Helpers = require("../classes/helpers.js");
const Load = db.load;
const Order = db.order;
const Op = db.Sequelize.Op;
const LoadBoard = require("../mongoModels/LoadBoardModel");

const LoadBoardClass = require("../classes/loadboard");


function getFilterObject(query, userId=0){
    const filter = { };

    if(userId && userId > 0){ // for broker - only his loads
        filter["publishedBy.userId"] = parseInt(userId);
    }else{ // for carrier - only public loads
        filter["type"] = 0; // public
    }

    if(query.ids){
        //_id : { $in : [1,2,3,4] }
        filter["_id"] = { $in : query.ids.split(",") }; // parseInt(query.equipment_type)
    }
    
    if(query.equipment_type){
        filter["order.equipment.eqType"] = parseInt(query.equipment_type);
    }
    if(query.equipment_id){
        filter["order.equipment.id"] = parseInt(query.equipment_id);
    }

    if(query.start_state){
        filter["order.start.state"] = query.start_state;
    }
    if(query.start_city){
        filter["order.start.city"] = query.start_city;
    }
    if(query.start_zip){
        filter["order.start.zip"] = query.start_zip;
    }
    if(query.end_state){
        filter["order.end.state"] = query.end_state;
    }
    if(query.end_city){
        filter["order.end.city"] = query.end_city;
    }
    if(query.end_zip){
        filter["order.end.zip"] = query.end_zip;
    }

    // if(query.flat_rate){
    //     filter["order.flatRate"] = query.flat_rate
    // }
    // if(query.per_mile_rate){
    //     filter["order.perMileRate"] = query.per_mile_rate
    // }
    
    // flat rate
    if(query.flatRateMin && !query.flatRateMax){
        filter["order.flatRate"] = { $gte:query.flatRateMin };
    }else if(!query.flatRateMin && query.flatRateMax){
        filter["order.flatRate"] = { $lte:query.flatRateMax };
    }else if(query.flatRateMin && query.flatRateMax){
        filter["order.flatRate"] = { $gte:query.flatRateMin, $lte:query.flatRateMax };
    }
    // per mile rate
    if(query.perMileRateMin && !query.perMileRateMax){
        filter["order.perMileRate"] = { $gte:query.perMileRateMin };
    }else if(!query.perMileRateMin && query.perMileRateMax){
        filter["order.perMileRate"] = { $lte:query.perMileRateMax };
    }else if(query.perMileRateMin && query.perMileRateMax){
        filter["order.perMileRate"] = { $gte:query.perMileRateMin, $lte:query.perMileRateMax };
    }
    
    if(query.company){
        filter["$or"] = [
            { "order.company.pickupCompanyName": query.company },
            { "order.company.deliveryCompanyName": query.company }
        ];
    }

    if(query.mileMin && !query.mileMax){
        filter["order.distance"] = { $gte:query.mileMin };
    }else if(!query.mileMin && query.mileMax){
        filter["order.distance"] = { $lte:query.mileMax };
    }else if(query.mileMin && query.mileMax){
        filter["order.distance"] = { $gte:query.mileMin, $lte:query.mileMax };
    } // 727161.9
     
    if(query.sizeType){
        if(query.sizeMin && !query.sizeMax){
            filter[`order.${query.sizeType}`] = { $gte:query.sizeMin };
        }
        else if(!query.sizeMin && query.sizeMax){
            filter[`order.${query.sizeType}`] = { $lte:query.sizeMax };
        }
        else if(query.sizeMin && query.sizeMax){
            filter[`order.${query.sizeType}`] = { $gte:query.sizeMin, $lte:query.sizeMax };
        }
    }



    // -- Filters

    // ++ Equipment
    // ++ Mile
    // ++ State
    // ++ City
    // ++ ZIP
    // ++ Rate
    // Stop
    // ++ Company
    // Partial/Full
    // P/NP
    // ++ Size
    // ++ Weight
    // ++ Rate

    // + equipment_type: "s",
    // + equipment: "a",
    // + start_state: "start",
    // + start_city: "start city",
    // + start_zip: "zip",
    // + end_state: "end",
    // + end_city: "city",
    // + end_zip: "zip",
    // + flat_rate: "1112",
    // + per_mile_rate: "222",
    // + mileMin
    // + mileMax
    // + company: "ttt",
    // + sizeType
    // + sizeMin
    // + sizeMax
    // + totalDistance: 


    // order:
    //  company: { id: 0, deliveryCompanyName: "sasdf", pickupCompanyName: "sasdf" }
    //  end:
    //      city: "sasdf"
    //      country: "ca"
    //      lat: ""
    //      lon: ""
    //      state: "sasdf"
    //      timeWindowFrom: ""
    //      timeWindowTo: ""
    //      zip: "32"
    //      __proto__: Object
    //  equipment:
    //      eqType: 2
    //      __proto__: Object
    //  flatRate: 0
    //  perMileRate: 0
    //  postedDate: "2020-05-25T06:39:31.190Z"
    //  size: 12
    //  start:
    //      city: "sasdf"
    //      country: "ca"
    //      lat: ""
    //      lon: ""
    //      state: "sasdf"
    //      timeWindowFrom: ""
    //      timeWindowTo: ""
    //      zip: "11"
    //      __proto__: Object
    //  weight: 321
    //      __proto__: Object
    //  publishedBy:
    //      userId: 1
    //      userType: "shipper"
    //      __proto__: Object
    //  __v: 0
    //  _id: "5ecb6823af985a1a4498e7a6"
    // __proto__: Object


    // filter["order.postedDate"]= { $gte: new Date("2020-09-01") }

    return filter;
}

exports.getAll = async (req, res) => {
    // console.log(" ----- ", req.user)
    // console.log(" --------------------------- ")
    // console.log("\n", " - query", req.query, "")

    // let sortAndPagination = await Helpers.sortAndPagination(req);
    // console.log("\n", " - sort", sortAndPagination, "")
    // const where = req.query;
    // const data = await Helpers.filters(where, Op);
    // //console.log("filters:",data);
    // console.log("\n", " - filter: ", data, "")

    try {
        const page = req.query.page ? Math.max(0, req.query.page*1) : Math.max(0, 1);
        const perPage = req.query.limit ? req.query.limit*1 : 10;
    
        const userId = req.user.type == "shipper" || req.user.type == "broker" ? req.user.id : 0

        // console.log(userId, req.user.type)

        const filter = getFilterObject(req.query, userId);
        // console.log("\n", " - filter: ", filter, "")

        LoadBoard.find(filter).sort({ _id : -1 }).limit(perPage).skip(perPage * (page - 1))
            .then(async (loadBoards) => {
                
                // console.log(loadBoards)
                let ct = await LoadBoard.find(filter).countDocuments();
                // console.log(ct);
                res.json({
                    status: 1,
                    msg: "ok",
                    data: {
                        //loads: loadBoards,
                        orders: loadBoards,
                        total: ct
                    }
                });
            });
    } catch (error) {
        console.log(error);
        res.json({error});
    }
};

exports.getByIds = async (req, res) => {
    try {
        // const page = req.query.page ? Math.max(0, req.query.page*1) : Math.max(0, 1);
        // const perPage = req.query.limit ? req.query.limit*1 : 10;
    
        //const filter = getFilterObject(req.query, req.user.id)

        console.log(req.params.ids);
        const filter = {
            //type: 0
            _id: { $in : req.params.ids.split(",") },
    
            //$or: [ { type: 0, type: undefined }, { type: 1, "publishedBy.type.userId": userId  } ]
        };
    
        // if(query.ids){
        //     //_id : { $in : [1,2,3,4] }
        //     filter["_id"] = { $in : query.ids.split(",") } // parseInt(query.equipment_type)
        // }
        

        // console.log("\n", " - filter: ", filter, "")
        LoadBoard.find(filter).sort({ _id : -1 }) // .limit(perPage).skip(perPage * (page - 1))
            .then(async (loadBoards) => {
                
                // console.log(loadBoards)
                // let ct = await LoadBoard.countDocuments();
                // console.log(ct);
                res.json({
                    status: 1,
                    msg: "ok",
                    data: {
                        //loads: loadBoards,
                        orders: loadBoards,
                        // total: ct
                    }
                });
            });
    } catch (error) {
        console.log(error)
        res.json({error});
    }
};

exports.getOne = async (req, res) => {
    if(req.user.type != "shipper" && req.user.type != "broker" && req.user.type != ""){
        return res.json({
            status: 0,
            msg: "Unauthorized request"
        });
    }

    try {
        const filter = {
            _id: req.params.id,
        }
        filter["publishedBy.userId"] = parseInt(req.user.id)

        LoadBoard.findOne(filter)
            .then(async (loadBoard) => {
                res.json({
                    status: 1,
                    msg: "ok",
                    data: loadBoard
                });
            });
    } catch (error) {
        console.log(error)
        res.json({error});
    }
};

exports.create = async (req, res) => {
    const lbc = new LoadBoardClass()
    
    const data = req.body

    // console.log(data)
    // return

    const user = {
        type: req.user.type, // broker, shipper, carrier
        id: req.user.id
    }
    
    const resModel = await lbc.create(data, user)

    res.status(201).send(resModel)
}

exports.createAPI = async (req, res) => {
    const lbc = new LoadBoardClass()
    
    const data = req.body

    const user = {
        type: "broker", // broker, shipper, carrier
        id: 1
    }

    const resModel = await lbc.create(data, user)

    res.status(201).send(resModel)
}

exports.edit = async (req, res) => {
    const lbc = new LoadBoardClass()
    
    const data = req.body

    const resModel = await lbc.edit(req.params.id, data)

    res.status(200).send(resModel)
}

exports.delete = async (req, res) => {
    const lbc = new LoadBoardClass()
    
    const result = await lbc.delete(req.params.id)

    if(result == -1){
        return res.status(500).send({
            "error": "LoadBoard delete error"
        });
    }

    res.status(200).send({
        status: 1,
        data: req.params.id
    })
}


// #############
// P U B L I S H

exports.publishLoads = async (req, res) => {
    // check request
    if(req.user.type !== "shipper"){
        return res.status(401).send("Unauthorized request")
    }
    
    if(req.body.loadIds == undefined){
        return res.status(500).send({
            "description": "loadIds is not set",
            "error": "Incorrect params"
        });
    }

    // publish
    try{
        let loads = await Load.findAll({ 
            where: { id: { [Op.in]: req.body.loadIds } },
            include: [{ all: true, nested: false }]
        });

        let orderIds = []
        loads.forEach(l => {
            orderIds.push(l.orders)
        })

        orderIds = Helper.splitToIntArray(orderIds.join(","), ",");

        // load orders and publish
        orderIds = await publishByOrderIds(orderIds, {
            type: req.user.type, // broker, shipper, carrier
            id: req.user.id
        })

        // return ok
        res.status(200).send({
            status: 1,
            msg: "ok",
            data: orderIds
        });
    }catch(err){
        console.log("bbb")
        console.log(err)
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    }
};

exports.publishOrders = async (req, res) => {
    // check request
    if(req.user.type !== "shipper"){
        return res.status(401).send("Unauthorized request")
    }
    
    if(req.body.orderIds == undefined){
        return res.status(500).send({
            "description": "orderIds is not set",
            "error": "Incorrect params"
        });
    }

    // publish
    try{
        // load orders and publish
        const orderIds = await publishByOrderIds(req.body.orderIds, {
            type: req.user.type, // broker, shipper, carrier
            id: req.user.id
        })

        // return ok
        res.status(200).send({
            status: 1,
            msg: "ok",
            data: orderIds
        });
    }catch(err){
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    }
};

async function publishByOrderIds(orderIds, user){
    const orders = await Order.findAll({ 
        where: { 
            id: { [Op.in]: orderIds },
            // flowType: 3, // E2E
            // loadtype: 2, // partial , chshtel karogha 2-@ full-na
        },
        include: [{ all: true, nested: false }]
    })
    // }).then(orders => {
    //     console.log("o", orders)
    // });

    await orders.forEach(async o => {
        const loadboardExist = await LoadBoard.find({ "order.orderId": o.id })
        if(!loadboardExist || loadboardExist.length == 0){
            return
        }

        // create mongodb model
        const loadboard = new LoadBoard({
            order: {

                orderId: o.id,

                company: {
                    id: o.companyId,
                    deliveryCompanyName: o.deliveryCompanyName,
                    pickupCompanyName: o.pickupCompanyName
                },
                equipment: {
                    eqType: o.eqType,
                    // name: String
                },
                product: o.productDescription,        // Object,
            
                size: o.feet,
                weight: o.weight,
                loadType: o.loadtype,               // Partial/Full
                // poolNoPool: String,              // Pool/No Pool
            
                start: getStartAddress(o),
                end: getEndAddress(o),
                
                distance: o.custDistance,           // (calculate)
                postedDate: new Date(),
                flatRate: o.flatRate,
                perMileRate: o.permileRate,
            
                // contact: {
                //     telephone: String,
                //     email: String,
                //     person: String
                // }
            },
            publishedBy: {
                userType: user.type, // broker, shipper, carrier
                userId: user.id,
                // dbName: String,
                // phone: String,
                // contactPerson: String,
                // email: String
            },
        })

        loadboard.save()

        o.isPublic = 1
        o.save()
    })

    console.log("orders published !!!")

    const oIds = orders.map(o => { 
        return o.id
    })

    return oIds
}

function getStartAddress(o){
    return {
        lat: o.pickupLat,
        lon: o.pickupLon,
        country: o.pickupCountry,
        state: o.pickupState,
        zip: o.pickupZip,
        city: o.pickupCity,
        // nsew: String,               // N / S / E / W    
        timeWindowFrom: o.pickupdateFrom,
        timeWindowTo: o.pickupdateTo
    }
}

function getEndAddress(o){
    return {
        lat: o.deliveryLat,
        lon: o.deliveryLon,
        country: o.deliveryCountry,
        state: o.deliveryState,
        zip: o.deliveryZip,
        city: o.deliveryCity,
        timeWindowFrom: o.deliverydateFrom,
        timeWindowTo: o.deliverydateTo
        // nsew: String,               // N / S / E / W    
    }
}





// ############
// for engine

exports.ordersForEngine = async (req, res) => {
    try{

        // console.log(" ---- load - order for engine", req.query)

        const date = Helpers.getFlatbedDatesFromEndFormated(req.query.date)

        // console.log(date)

        // date.from = new Date("2019-09-01")
        // date.to = new Date()

        // console.log(date)

        // get capacity boards
        const CapacityBoard = require("../mongoModels/CapacityBoardModel");
        const capacityBoards = await CapacityBoard.find({
            // "order.start.timeWindowFrom": { $and: [
            //     { $gte: date.date },
            //     { $lte: date.to }
            // ] }
            "order.start.timeWindowFrom": { 
                $gte: date.from,
                $lte: date.to
            }
        }).sort("_id")//.limit(perPage).skip(perPage * (page - 1))

        // console.log(" --- cap --- ", capacityBoards)

        // get large capacity
        let largeCB = 0
        capacityBoards.forEach(cb => {
            if(largeCB < cb.availableSize){
                largeCB = cb.availableSize // availableWeight
            }
        })

        // get loadboard filter fith max size and weight
        // console.log(" -- uid", req.query.userid)
        let userId = parseInt(req.query.userid)
        if(isNaN(userId)){
            userId = 0
        }
        
        const LoadBoard = require("../mongoModels/LoadBoardModel");
        const loadBoards = await LoadBoard.find({
            // "order.start.timeWindowFrom": { $and: [
            //     { $gte: date.date },
            //     { $lte: date.to }
            // ] }

            "order.start.timeWindowFrom": {
                $gte: date.from,
                $lte: date.to
            },
            "publishedBy.userId": userId
        })
        
        // get orders
        // const cutromOrders = await Order.findAll({ where: { }  });

        // combine

        // console.log(" - cb", capacityBoards.length)
        // console.log(" - lb", loadBoards.length)


        let idIndex = 1

        // create post data
        const orders = []
        capacityBoards.forEach(cb => {
            // console.log(cb.number)
            orders.push({
                "id": idIndex++, // cb.number, // cb._id,
                "sid": `cap__${cb._id}`,
                "feet": cb.order.usedSize,
                "weight": cb.order.usedWeight,
                "cube": 0,
                "flowType": 3,
                "deliveryLat": cb.order.end.lat,
                "deliveryLon": cb.order.end.lon,
                "pickupLat": cb.order.start.lat,
                "pickupLon": cb.order.start.lon,
                "deliverydateFrom": cb.order.end.timeWindowFrom,
                "deliverydateTo": cb.order.end.timeWindowTo,
                "pickupdateFrom": cb.order.start.timeWindowFrom,
                "pickupdateTo": cb.order.start.timeWindowTo,
                "servicetime": 1200
            })
        })

        loadBoards.forEach(lb => {
            // console.log(" lb", lb)
            orders.push({
                "id": idIndex++, // lb.number, // lb._id,
                "sid": `load__${lb._id}`,
                "feet": lb.order.size,
                "weight": lb.order.weight,
                "cube": 0,
                "flowType": 3,
                "deliveryLat": lb.order.end.lat,
                "deliveryLon": lb.order.end.lon,
                "pickupLat": lb.order.start.lat,
                "pickupLon": lb.order.start.lon,
                "deliverydateFrom": lb.order.end.timeWindowFrom,
                "deliverydateTo": lb.order.end.timeWindowTo,
                "pickupdateFrom": lb.order.start.timeWindowFrom,
                "pickupdateTo": lb.order.start.timeWindowTo,
                "servicetime": 1200
            })
        })

        const data = {
            status: 1,
            msg: "ok",
            data: {
                orders: orders ,
                count: orders.length
            }
        }

        // console.log(data)

        // response
        return res.status(200).json(data)
    }catch(ex){
        res.json({ex});
    }
}
