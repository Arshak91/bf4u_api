const db = require('../config/db.config.js');
const Driver = db.driver;
const Load = db.load;
const Route = db.loadRoute;
const Classifier = db.classifiers;
const AdditionalTransfer = db.additionalTransfers;
const Settlement = db.settlements;

const osrm = require('../controller/osmap.controller');

const Op = db.Sequelize.Op;

// app.get('/api/settlements_temp/loads/:id/:datefrom/:dateto', _settlements_temp.loads)
exports.loads = (req, res) => {
    const driverId = req.params.id
    
    let dateFrom = new Date(req.params.datefrom);
    dateFrom = dateFrom.toISOString().split('T')[0];

    let dateTo = new Date(req.params.dateto);
    dateTo.setDate(dateTo.getDate() + 1);
    dateTo = dateTo.toISOString().split('T')[0];

    const orderArr = [ ['id', 'desc'] ]
    
    Load.findAll({
        where: {
            driverId: driverId,
       //     status: 3, // 3 - delivered
            deliveryDate: {
                [Op.gte]: dateFrom
            },
            deliveryDate: {
                [Op.lt]: dateTo
            }
        },
        include: [{ all: true, nested: true }],
        order: orderArr,
    })
    .then(loads => {
        // manipulate 
        data = {}

        data.loads = loads

        // - get user's depo ? (shiper depo , carrier depo) vortexic enq vercnelu ed depo-n
        // ...

        // - make virtual trips
        // ...
        var trips = getTrips(loads)
        data = trips
        
        // - calcs empty miles
        // ...

        // - calcs trip's total duration
        // ...

        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: data
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access loads table',
            'error': err
        });
    });
};

function getTrips(loads){
    var trips = []
    // var trip = {
    //     distance: 0,
    //     duration: 0,
    //     totalMilage: 0,
    //     emptyMilage: 0,
    //     totalRate: 0,
    //     loadIds: [],
    //     loads: []
    // }
    

    // 1 - pickup drop - E2E
    // 2 - depo depo - D2D
    // 3 - depo drop - D2E
    // 4 - pickup depo - LP2D
    
    var _lastFlowType = 0
    var _loads = []

    //loads.foreach(l => {
    for(var i in loads){
        var l = loads[i]
        
        switch(l.flowType){
            case 1: 
                // ( if last depo -- already closed )
                // insert into _loads
                _loads.push(l)
                _lastFlowType = 1
                break;
            case 2:
                // check if last not depo, close last  (add last point to depo for empty milage) 
                if(_lastFlowType != 0){
                    trips.push(getNewTrip(_loads))
                    _loads = []
                    _lastFlowType = 0
                }
                // ( if last depo -- already closed )
                // ( create singleload trip )
                // insert into _loads
                //console.log(l)
                //console.log(_loads)
                //_loads.push(l)
                _loads.push(l)
                // close trip 
                trips.push(getNewTrip(_loads))
                _loads = []
                _lastFlowType = 0
                break;
            case 3:
                // check if last not depo, close last  (add last point to depo for empty milage)
                if(_lastFlowType != 0){
                    trips.push(getNewTrip(_loads))
                    _loads = []
                    _lastFlowType = 0
                }
                // ( if last depo -- already closed )
                // insert into _loads
                _loads.push(l)
                _lastFlowType = 3
                break;
            case 4:
                // ( if last depo -- already closed )
                // insert into _loads
                _loads.push(l)
                // close trip 
                trips.push(getNewTrip(_loads))
                _loads = []
                _lastFlowType = 0
                break;
        }
        
        if(i + 1 == loads.length){
            if(l.flowType != 2 && l.flowType != 4){
                // close trip
                if(_loads.length > 0){
                    trips.push(getNewTrip(_loads))
                    _loads = []
                    _lastFlowType = 0
                }
            }
        }
    }

    
    for(var i in trips){
        var t = trips[i]
        var routes = []
        t.loads.forEach(l => {
            routes.push(l.route)
        })
        t.distance = getDistance(routes)
        t.duration = getDuration(routes)
        var data = getEmptyMilageAndDuration(t.loads)
        t.emptyMilage = data.distance
        t.emptyDuration = data.duration
        t.totalMilage = 0
    }

    return trips
}

function getNewTrip(loads){
    var trip = {
        distance: 0,
        duration: 0,
        totalMilage: 0,
        emptyMilage: 0,
        totalRate: 0,
        loadIds: [],
        loads: loads
    }
    for(var i in loads){
        trip.loadIds.push(loads[i].id)
    }
    return trip
}

function getDistance(routes){
    var totalDistance = 0
    routes.forEach(r => {
        if(r != null){
            totalDistance += r.distance
        }
    })
    return totalDistance
}

function getDuration(routes){
    var totalDuration = 0
    routes.forEach(r => {
        if(r != null){
            totalDuration += r.duration
        }
    })
    return totalDuration
}

function getEmptyMilageAndDuration(loads){
    var emptyDistance = 0
    var emptyDuration = 0


    loads.forEach(l => {
        l.ordersDatas
    })
    //loads.ordersDatas
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // discuss with Aram

    for(var i = 1; i < loads.length; i++){
        var od1 = loads[i-1].ordersDatas;
        var od2 = loads[i].ordersDatas;

        var o1 = od1[od1.length - 1];
        var o2 = od2[od2.length - 1];

        var latlon1 = `${o1.deliveryLat},${o1.deliveryLon}`;
        var latlon2 = `${o2.pickupLat},${o2.pickupLon}`;

        var points = `${latlon2};${latlon1}`;

        // seq.query(Helper.createSelectQuery('orders', req.body.idsStr), { type: seq.QueryTypes.SELECT })
        // .then(news => {
        //     let newpoints = Helper.checkAndGetLatLon(load, news);
        //     osrm.GetDistDur(newpoints).then(dt => {

        var data = osrm.GetDistDur(points).distDur;

        emptyDistance += data.distance;
        emptyDuration += data.duration;
    }

    return {
        distance: emptyDistance,
        duration: emptyDuration
    };
}


//app.get('/api/settlements_temp/classifiers/:filter', _settlements_temp.getClassifiers)
exports.getClassifiers = (req, res) => {
    const filter = req.params.filter;
    
    where = {
        name: {
            [Op.like]: `%${filter}%`
        }
    }

    // get carrierId or shipperId and filter
    carrierId = null
    shipperId = null

    if(carrierId > 0){
        where.carrierId = carrierId
    }else if(shipperId > 0){
        where.shipperId = shipperId
    }

    Classifier.findAll({
        where: where
    })
    .then(classifiers => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: classifiers
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access classifiers table',
            'error': err
        });
    });
};

//app.get('/api/settlements_temp/classifiers/ad/:type', _settlements_temp.getClassifiersIncAdditionsDeductions)
exports.getClassifiersIncAdditionsDeductions = (req, res) => {
    const type = req.params.type

    if(type == 'add'){
        where = {
            type: 1
        }
    }else if(type == 'ded'){
        where = {
            type: 1
        }
    }else{
        where = { }
    }

    // get carrierId or shipperId and filter
    carrierId = null
    shipperId = null

    if(carrierId > 0){
        where.carrierId = carrierId
    }else if(shipperId > 0){
        where.shipperId = shipperId
    }

    Classifier.findAll({
        where: where
    })
    .then(classifiers => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: classifiers
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access classifiers table',
            'error': err
        });
    });
};

// app.post('/api/settlements_temp/classifiers/:filter', _settlements_temp.setClassifier)
exports.setClassifier = (req, res) => {    
    
    // get carrierId or shipperId
    carrierId = null
    shipperId = null

    Classifier.create({
        type: req.body.type,
        name: req.body.name,

        carrierId: carrierId,
        shipperId: shipperId,
        
        status: req.body.status
    }).then(classifier => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: classifier
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

//app.put('/api/settlements_temp/classifiers/:id', _settlements_temp.editClassifiers)
exports.editClassifiers = (req, res) => {
    Classifier.update({
        type: req.body.type,
        name: req.body.name,
        
        status: req.body.status,
    }, {
        where: { id: req.params.id }
    }).then(classifier => {
        res.status(200).send({
            status: 1,
            msg: 'updated',
            data: classifier
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};


// app.post('/api/settlements_temp/additinaltransfers', _settlements_temp.createAdditionalTransfer)
exports.createAdditionalTransfer = (req, res) => {
    AdditionalTransfer.create({
        driverId: req.body.driverId,
        type: req.body.type,
        classifierId:  req.body.classifierId,
        sum: req.body.sum,
        status: req.body.status
    }).then(additionalTransfers => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: additionalTransfers
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

// app.get('/api/settlements_temp/additinaltransfers', _settlements_temp.getAdditionalTransfers)
exports.getAdditionalTransfers = (req, res) => {
    const driverId = req.params.driverId
   
    AdditionalTransfer.findAll({
        where: {
            driverId: driverId
        }
    })
    .then(additionalTransfers => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: additionalTransfers
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access additional_transfers table',
            'error': err
        });
    });
};

// app.put('/api/settlements_temp/additinaltransfers/:id', _settlements_temp.editAdditionalTransfer)
exports.editAdditionalTransfer = (req, res) => {
    AdditionalTransfer.update({
        sum: req.body.sum
    }, {
        where: { id: req.params.id }
    }).then(additionalTransfer => {
        res.status(200).send({
            status: 1,
            msg: 'updated',
            data: additionalTransfer
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};


// app.post('/api/settlements_temp/settlements', _settlements_temp.createSettlement)
exports.createSettlement = (req, res) => {
    // - store settlements

    Settlement.create({
        driverId: req.body.driverId,
        carrierId: req.body.carrierId,
        shipperId: req.body.shipperId,
        fromDate: req.body.fromDate,
        toDate: req.body.toDate,
        loads: req.body.loads,
        paymentType: req.body.paymentType, // 1 = Flat , 2 = Mile , 3 = Percentage , 4 = Hour
        currencyId: req.body.currencyId,
        fuelSurcharge: req.body.fuelSurcharge,
        detention: req.body.detention,
    
        additionId: req.body.additionId,
        deductionId: req.body.deductionId,
        prepaymentAmount: req.body.prepaymentAmount,

        paymentAmount: req.body.paymentAmount,
		name: req.body.name,
        status: req.body.status // 'Pending', 'Paid'
    }).then(additionalTransfers => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: additionalTransfers
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

// app.get('/api/settlements_temp/settlements/:driverId', _settlements_temp.getSettlements)
exports.getSettlements = (req, res) => {
    const driverId = req.params.driverId
   
    Settlement.findAll({
        where: {
            driverId: driverId
        }
    })
    .then(settlements => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: settlements
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access settlements table',
            'error': err
        });
    });
};


exports.setDriverPayment = (req, res) => {
    var amount = req.body.amount
    var driverId = req.body.driverId

    // get from driver payments table

    // send email
    .sendDriverPaymentDoneEmail(dirverId, settlementId)
}