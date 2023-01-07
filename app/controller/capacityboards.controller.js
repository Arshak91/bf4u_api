const db = require('../config/db.config.js');
const Helper = require('../classes/helpers.js');
const Load = db.load;
const Order = db.order;
const Op = db.Sequelize.Op;
const CapacityBoard = require('../mongoModels/CapacityBoardModel');
const CapacityBoardClass = require('../classes/capacityboard');

function getFilterObject(query, userId){
    const filter = {}

    if(userId && userId > 0){ // for carrier - only his loads
        filter['publishedBy.userId'] = parseInt(userId)
    // }else{ // for broker, shipper - only public loads
    //     filter['type'] = 0 // public
    }

    if(query.equipment_type){
        filter['order.equipment.eqType'] = parseInt(query.equipment_type)
    }
    if(query.equipment_id){
        filter['order.equipment.id'] = parseInt(query.equipment_id)
    }

    if(query.start_state){
        filter['order.start.state'] = query.start_state
    }
    if(query.start_city){
        filter['order.start.city'] = query.start_city
    }
    if(query.start_zip){
        filter['order.start.zip'] = query.start_zip
    }
    if(query.end_state){
        filter['order.end.state'] = query.end_state
    }
    if(query.end_city){
        filter['order.end.city'] = query.end_city
    }
    if(query.end_zip){
        filter['order.end.zip'] = query.end_zip
    }

    // if(query.flat_rate){
    //     filter['order.flatRate'] = query.flat_rate
    // }
    // if(query.per_mile_rate){
    //     filter['order.perMileRate'] = query.per_mile_rate
    // }
    
    // flat rate
    if(query.flatRateMin && !query.flatRateMax){
        filter['order.flatRate'] = { $gte:query.flatRateMin }
    }else if(!query.flatRateMin && query.flatRateMax){
        filter['order.flatRate'] = { $lte:query.flatRateMax }
    }else if(query.flatRateMin && query.flatRateMax){
        filter['order.flatRate'] = { $gte:query.flatRateMin, $lte:query.flatRateMax }
    }
    // per mile rate
    if(query.perMileRateMin && !query.perMileRateMax){
        filter['order.perMileRate'] = { $gte:query.perMileRateMin }
    }else if(!query.perMileRateMin && query.perMileRateMax){
        filter['order.perMileRate'] = { $lte:query.perMileRateMax }
    }else if(query.perMileRateMin && query.perMileRateMax){
        filter['order.perMileRate'] = { $gte:query.perMileRateMin, $lte:query.perMileRateMax }
    }
    

    if(query.company){
        filter['$or'] = [
            { 'order.company.pickupCompanyName': query.company },
            { 'order.company.deliveryCompanyName': query.company }
        ]
    }

    if(query.mileMin && !query.mileMax){
        filter['order.distance'] = { $gte:query.mileMin }
    }else if(!query.mileMin && query.mileMax){
        filter['order.distance'] = { $lte:query.mileMax }
    }else if(query.mileMin && query.mileMax){
        filter['order.distance'] = { $gte:query.mileMin, $lte:query.mileMax }
    } // 727161.9
     
    if(query.sizeType){
        if(query.sizeMin && !query.sizeMax){
            filter[`order.${sizeType}`] = { $gte:query.sizeMin }
        }
        else if(!query.sizeMin && query.sizeMax){
            filter[`order.${sizeType}`] = { $lte:query.sizeMax }
        }
        else if(query.sizeMin && query.sizeMax){
            filter[`order.${sizeType}`] = { $gte:query.sizeMin, $lte:query.sizeMax }
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

    // + equipment_type: 's',
    // + equipment: 'a',
    // + start_state: 'start',
    // + start_city: 'start city',
    // + start_zip: 'zip',
    // + end_state: 'end',
    // + end_city: 'city',
    // + end_zip: 'zip',
    // + flat_rate: '1112',
    // + per_mile_rate: '222',
    // + mileMin
    // + mileMax
    // + company: 'ttt',
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


    return filter
}

exports.getAll = (req, res) => {
    try {
        let page = req.query.page ? Math.max(0, req.query.page*1) : Math.max(0, 1);
        let perPage = req.query.limit ? req.query.limit*1 : 10;
        
        const userId = req.user.type == 'carrier' ? req.user.id : 0

        const filter = getFilterObject(req.query, userId)
        // console.log('\n', ' - filter: ', filter, '')

        CapacityBoard.find(filter).sort({ _id : -1 }).limit(perPage).skip(perPage * (page - 1))
            .then(async (capacityBoards) => {
                let ct = await CapacityBoard.find(filter).countDocuments();
                // console.log(ct);
                res.json({
                    status: 1,
                    msg: 'ok',
                    data: {
                        //loads: capacityBoards,
                        orders: capacityBoards,
                        total: ct
                    }
                });
            });
    } catch (error) {
        res.json({error});
    }
};


exports.create = async (req, res) => {
    const lbc = new CapacityBoardClass()
    
    const data = req.body

    const user = {
        type: req.user.type, // broker, shipper, carrier
        id: req.user.id
    }

    const resModel = await lbc.create(data, user)

    res.status(201).send(resModel)
}


exports.createAPI = async (req, res) => {
    const lbc = new CapacityBoardClass()
    
    const data = req.body

    const user = {
        type: 'carrier', // broker, shipper, carrier
        id: 1
    }

    const resModel = await lbc.create(data, user)

    res.status(201).send(resModel)
}


exports.edit = async (req, res) => {
    const cbc = new CapacityBoardClass()
    
    const data = req.body

    const resModel = await cbc.edit(req.params.id, data)

    res.status(200).send(resModel)
}

exports.delete = async (req, res) => {
    const cbc = new CapacityBoardClass()
    
    const result = await cbc.delete(req.params.id)

    if(result == -1){
        return res.status(500).send({
            'error': 'CapacityBoard delete error'
        });
    }

    res.status(200).send({
        status: 1,
        data: req.params.id
    })
}

exports.publishLoads = async (req, res) => {
    // check request
    if(req.user.type !== 'carrier'){
        return res.status(401).send('Unauthorized request')
    }
    
    if(req.body.loadIds == undefined){
        return res.status(500).send({
            'description': 'loadIds is not set',
            'error': 'Incorrect params'
        });
    }

    // publish
    try{
        let loads = await Load.findAll({ 
            where: { id: { [Op.in]: req.body.loadIds } },
            include: [{ all: true, nested: false }]
        });

        const CapacityBoard = require('../mongoModels/CapacityBoardModel');
        
        let orderIds = []
        loads.forEach(l => {
            orderIds.push(l.orders)
        })

        orderIds = Helper.splitToIntArray(orderIds.join(','), ',');

        Order.findAll({
            where: {
                id: {
                    [Op.in]: orderIds
                }
            },
            include: [{ all: true, nested: false }],
        }).then(async orders => {

            await loads.forEach(async l => {
                l.isPublic = 1

                const oIds = Helper.splitToIntArray(l.orders, ',');

                const loadOrders = []
                orders.forEach(o => {
                    oIds.forEach(oId => {
                        if(o.id == oId){
                            loadOrders.push(o) 
                        }
                    })
                })
                //console.log(loadOrders)

                // create mongodb model
                let pl = new CapacityBoard({
                    load: {
                        loadId: l.id,
                        flowType: l.flowType,
                        orderIds: l.orders, // [Object], // ?
                        orders: loadOrders, // l.ordersDatas, // [Object], // ? 
                        stops: l.stops,
                        start: setCapacityBoardAddresses(l.start, l.startAddress),
                        end: setCapacityBoardAddresses(l.end, l.endAddress),
                        startTime: l.startTime,
                        endTime: l.endTime,
                        feet: l.feet,
                        weight: l.weight,
                        volume: l.cube, // (cube)
                        pallet: l.pallet,
                        totalDistance: l.totalDistance,
                        totalDuration: l.totalDuration,
                        rate: l.loadCost, // loadCost
                        fuelSurcharge: l.fuelSurcharge,
                        pickupDate: l.pickupDate,
                        deliveryDate: l.deliveryDate,
                        carTypes: l.carTypes
                    },
                    publishedBy: {
                        userType: req.user.type, // broker, shipper, carrier
                        userId: req.user.id,
                        // dbName: String,
                        // phone: String,
                        // contactPerson: String,
                        // email: String
                    },
                })

                console.log('kkk')
                pl.save()

                l.save()
            })

            let loadIds = loads.map(l => { 
                return l.id
            })

            console.log('published')

            res.status(200).send({
                status: 1,
                msg: 'ok',
                data: loadIds
            });
        }).catch(err => {
            console.log('eee')
            console.log(err)
            res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        })
    }catch(err){
        console.log('bbb')
        console.log(err)
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    }
};

exports.publishOrders = async (req, res) => {
    // check request
    if(req.user.type !== 'carrier'){
        return res.status(401).send('Unauthorized request')
    }
    
    if(req.body.loadIds == undefined){
        return res.status(500).send({
            'description': 'loadIds is not set',
            'error': 'Incorrect params'
        });
    }

    // publish
    try{
        let loads = await Load.findAll({ 
            where: { id: { [Op.in]: req.body.loadIds } },
            include: [{ all: true, nested: false }]
        });

        const CapacityBoard = require('../mongoModels/CapacityBoardModel');
        
        let orderIds = []
        loads.forEach(l => {
            orderIds.push(l.orders)
        })

        orderIds = Helper.splitToIntArray(orderIds.join(','), ',');

        Order.findAll({
            where: {
                id: {
                    [Op.in]: orderIds
                }
            },
            include: [{ all: true, nested: false }],
        }).then(async orders => {

            await loads.forEach(async l => {
                l.isPublic = 1

                const oIds = Helper.splitToIntArray(l.orders, ',');

                const loadOrders = []
                orders.forEach(o => {
                    oIds.forEach(oId => {
                        if(o.id == oId){
                            loadOrders.push(o) 
                        }
                    })
                })
                //console.log(loadOrders)

                // create mongodb model
                let pl = new CapacityBoard({
                    load: {
                        loadId: l.id,
                        flowType: l.flowType,
                        orderIds: l.orders, // [Object], // ?
                        orders: loadOrders, // l.ordersDatas, // [Object], // ? 
                        stops: l.stops,
                        start: setCapacityBoardAddresses(l.start, l.startAddress),
                        end: setCapacityBoardAddresses(l.end, l.endAddress),
                        startTime: l.startTime,
                        endTime: l.endTime,
                        feet: l.feet,
                        weight: l.weight,
                        volume: l.cube, // (cube)
                        pallet: l.pallet,
                        totalDistance: l.totalDistance,
                        totalDuration: l.totalDuration,
                        rate: l.loadCost, // loadCost
                        fuelSurcharge: l.fuelSurcharge,
                        pickupDate: l.pickupDate,
                        deliveryDate: l.deliveryDate,
                        carTypes: l.carTypes
                    },
                    publishedBy: {
                        userType: req.user.type, // broker, shipper, carrier
                        userId: req.user.id,
                        // dbName: String,
                        // phone: String,
                        // contactPerson: String,
                        // email: String
                    },
                })

                console.log('kkk')
                pl.save()

                l.save()
            })

            let loadIds = loads.map(l => { 
                return l.id
            })

            console.log('published')

            res.status(200).send({
                status: 1,
                msg: 'ok',
                data: loadIds
            });
        }).catch(err => {
            console.log('eee')
            console.log(err)
            res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        })
    }catch(err){
        console.log('bbb')
        console.log(err)
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    }
};


function setCapacityBoardAddresses(locStr, addressStr){
    let addr = { }

    if(locStr){
        const loc = JSON.parse(locStr);

        addr['lat'] = loc.Lat;
        addr['lon'] = loc.Lon;
    }

    if(addressStr && addressStr != null){
        const address = addressStr.split(',').map(v => v.trim());
        addr['country'] = address.pop();
        addr['zip'] = address.pop();
        // addr['state'] = '';
        addr['city'] = address.length > 1 ? address.pop() : address[0];
        addr['street'] = address.length > 0 ? address.pop() : address[0];
        addr['addressFull'] = address;
    }

    return addr;
}









// ############
// for engine

exports.ordersForEngine = async (req, res) => {
    try{
        console.log(' ---- cap - order for engine', req.query)

        const date = Helper.getFlatbedDatesFromEndFormated(req.query.date)
        
        // console.log(date)

        let userId = parseInt(req.query.userid)
        if(isNaN(userId)){
            userId = 0
        }

        // get capacity boards
        const CapacityBoard = require('../mongoModels/CapacityBoardModel');
        const capacityBoards = await CapacityBoard.find({
            // "order.start.timeWindowFrom": { $and: [
            //     { $gte: date.date },
            //     { $lte: date.to }
            // ] }
            "order.start.timeWindowFrom": { 
                $gte: date.from ,
                $lte: date.to
            },
            "publishedBy.userId": userId
        }).sort('_id')//.limit(perPage).skip(perPage * (page - 1))

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
            // "order.start.timeWindowFrom": { $and: [
            //     { $gte: date.date },
            //     { $lte: date.to }
            // ] }

            "order.start.timeWindowFrom": {
                $gte: date.from,
                $lte: date.to
            }
            //"publishedBy.userId": req.query.userid
        })
        
        // get orders
        // const cutromOrders = await Order.findAll({ where: { }  });

        // combine

        // console.log(' - cb', capacityBoards.length)
        // console.log(' - lb', loadBoards.length)


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
            // console.log(' lb', lb)
            orders.push({
                "id": idIndex++, // lb.number, // lb._id,
                "sid": `load__${lb._id}`,
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
}

function getDateFromEnd(date){
    
    date = date ? new Date(date) : new Date();
    
    var yyyy = date.getFullYear();
    var dd = date.getDate();
    var mm = date.getMonth() + 1;

    if (dd < 10) {
    dd = '0' + dd;
    } 
    if (mm < 10) {
    mm = '0' + mm;
    } 
    
    date = `${yyyy}-${mm}-${dd}`;

    const from = new Date(date)
    const to = new Date(date)

    to.setDate(to.getDate()+1);

    return {
        from,
        to
    };
}