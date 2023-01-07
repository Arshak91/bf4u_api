const db = require('../config/db.config.js');
const Settings = db.settings;

const Equipment = db.equipment;
const Warnings = require('../warnings/orderWarnings');
const ZipCode = require('../mongoModels/ZipCodesModel');
const LoadBoard = require('../mongoModels/LoadBoardModel');
const { distance } = require('../controller/orderscontroller.js');

// const osrm = require('../controller/osmap.controller');

const Order = db.order;

async function getStartAddress(o){
    const pLatLon = await getLatLonByZip(o.country, o.pickupZip)
    console.log(pLatLon)

    return {
        lat: pLatLon.lat, // o.pickupLat,
        lon: pLatLon.lon, // o.pickupLon,
        country: o.pickupCountry,
        state: o.pickupState,
        zip: o.pickupZip,
        city: o.pickupCity,
        // nsew: String,               // N / S / E / W    
        timeWindowFrom: new Date(o.pickupdateFrom),
        timeWindowTo: new Date(o.pickupdateTo)
    }
}

async function getEndAddress(o){
    const dLatLon = await getLatLonByZip(o.country, o.deliveryZip)

    return {
        lat: dLatLon.lat, // o.deliveryLat,
        lon: dLatLon.lon, // o.deliveryLon,
        country: o.deliveryCountry,
        state: o.deliveryState,
        zip: o.deliveryZip,
        city: o.deliveryCity,
        timeWindowFrom: new Date(o.deliverydateFrom),
        timeWindowTo: new Date(o.deliverydateTo)
        // nsew: String,               // N / S / E / W    
    }
}


async function getLatLonByZip(country, zip){
    const filter = {
        Country: country.toUpperCase(),
        PostalCode: zip
    }

    if(filter.Country == 'CA'){
        PostalCode.zip = zip.substr(0,3)
    }

    const zipCode = await ZipCode.findOne(filter)

    if(zipCode){
        return {
            lat: zipCode.Latitude,
            lon: zipCode.Longitude
        }
    }

    return {
        lat: 0,
        lon: 0
    }

    // const { data } = await osrm.GeoLocByZip(zip)
    // lat = data.results[0].geometry.location.lat;
    // lon = data.results[0].geometry.location.lng;
    // return {
    //     lat,
    //     lon
    // }
}


async function createOrder(order){
    // order: {
    //     // orderId: 0,

    //     company: {
    //         id: 0, //o.companyId,
    //         deliveryCompanyName: order.deliveryCompanyName,
    //         pickupCompanyName: order.pickupCompanyName
    //     },
    //     equipment: {
    //         id: equipment.id,
    //         eqType: order.eqType,
    //         name: `${equipment.type} - ${equipment.name}`,
    //         feet: equipment.feet,
    //         weight: equipment.weight,
    //         cube: equipment.cube
    //     },
    //     // product: o.productDescription,        // Object,
    
    //     size: order.products && order.products.length ? Number(order.products[0].Size) : 0,
    //     weight: order.products && order.products.length ? Number(order.products[0].Weight) : 0,

    //     // size: Number,
    //     // weight: Number,
    //     loadType: order.loadtype,     // Partial/Full
    //     // poolNoPool: String,     
        
    //     flatRate: order.flatRate,
    //     perMileRate: order.perMileRate,

    //     start: start, // getStartAddress(order),
    //     end: end, // getEndAddress(order),
        
    //     distance: ddStatus ? distDur.distance : 0,           // (calculate)
    //     postedDate: new Date(),
        
    //     // contact: {
    //     //     telephone: String,
    //     //     email: String,
    //     //     person: String
    //     // }
    // },

    const o = await Order.create({
        // Load type
        // loadtype: order.loadtype,
        // load_id: order.load_id,

        flowType: 3, //order.flowType,
        depoid: 0,

        // Pickup
        pickupCompanyName: order.company.pickupCompanyName,

        pickupState: order.pickupState,
        pickupStreetAddress: order.pickupStreetAddress,
        pickupLocationtypeid: order.pickupLocationtype,
        // --
        pickupCountry: order.pickupCountry,
        pickupCountryCode: order.pickupCountryCode,
        pickupCity: order.pickupCity,
        pickupZip: order.pickupZip,
        pickupAccessorials: order.pickupAccessorials,
        // --
        pickupdateFrom: new Date(order.pickupdateFrom),
        pickupdateTo: new Date(order.pickupdateTo),
        // --
        pickupLon: order.pickupLon,
        pickupLat: order.pickupLat,

        vendorid: order.vendorId ? order.vendorId : 0,
        consigneeid: order.consigneeId ? order.consigneeId : 0,
        // Delivery
        deliveryCompanyName: order.deliveryCompanyName,
        deliveryState: order.deliveryState,
        deliveryStreetAddress: order.deliveryStreetAddress,
        deliveryLocationtypeid: order.deliveryLocationtype,
        // --
        deliveryCountry: order.deliveryCountry,
        deliveryCountryCode: order.deliveryCountryCode,
        deliveryCity: order.deliveryCity,
        deliveryZip: order.deliveryZip,
        deliveryAccessorials: order.deliveryAccessorials,
        // --
        deliverydateFrom: new Date(order.deliverydateFrom),
        deliverydateTo: new Date(order.deliverydateTo),
        // --
        deliveryLon: order.deliveryLon,
        deliveryLat: order.deliveryLat,

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
        delivery: `${order.deliveryStreetAddress}, ${order.deliveryCity}, ${order.deliveryState} ${order.deliveryZip}, ${order.deliveryCountry}`,
        pickup: `${order.pickupStreetAddress}, ${order.pickupCity}, ${order.pickupState} ${order.pickupZip}, ${order.pickupCountry}`

        })
        
        .then(async newOrder => {

        }).catch(err => {
            errorArr.push({ status: 0, msg: err.message, err: err, data: order });
        });
}


module.exports = class LoadBoardClass{

    async create(data, user){
        let createdOrders = [];
        let warning, message, warningArray = [];
        // const settings = await Settings.findOne({
        //     where: {
        //         userId: user.id
        //     }
        // });
        for (const order of data.orders) {
            warning = false, message = "ok";

            const start = await getStartAddress(order);
            const end = await getEndAddress(order);

            const distData = {
                pickupLat: start.lat,
                pickupLon: start.lon,
                deliveryLat: end.lat,
                deliveryLon: end.lon
            }
            const { distDur, msg, ddStatus } = await Warnings.createOrder(distData);
            if (!ddStatus) {
                warning = true,
                message = msg;
            }

            let equipment = await Equipment.findOne({where: {id: order.eqId }})
            if(!equipment){
                equipment = { 
                    id: 0,
                    feet: 0,
                    weight: 0,
                    cube: 0
                }
            }
            
            let perMileRate= Number(order.perMileRate)
            if(isNaN(perMileRate)){
                perMileRate = 0
            }
            const distanceResult =  ddStatus ? distDur.distance : 0;

            // get next unique number
            let nextNumber = await LoadBoard.find({},{number: 1}).sort({number:-1}).limit(1)
            nextNumber = nextNumber.number ? nextNumber.number + 1 : 1

            const loadBoard = new LoadBoard({
                number: nextNumber,
                type: order.isPrivate ? parseInt(order.isPrivate) : 0,
                order: {
                    // orderId: 0,
    
                    company: {
                        id: 0, //o.companyId,
                        deliveryCompanyName: order.deliveryCompanyName,
                        pickupCompanyName: order.pickupCompanyName
                    },
                    equipment: {
                        id: equipment.id,
                        eqType: order.eqType,
                        name: `${equipment.type} - ${equipment.name}`,
                        feet: equipment.feet,
                        weight: equipment.weight,
                        cube: equipment.cube
                    },
                    // product: o.productDescription,        // Object,
                
                    size: order.products && order.products.length ? Number(order.products[0].Size) : 0,
                    weight: order.products && order.products.length ? Number(order.products[0].Weight) : 0,

                    // size: Number,
                    // weight: Number,
                    loadType: order.loadtype,     // Partial/Full
                    // poolNoPool: String,     
                    
                    flatRate: order.flatRate,
                    perMileRate: perMileRate,
                    perMileRateTotal: perMileRate * distanceResult,

                    start: start, // getStartAddress(order),
                    end: end, // getEndAddress(order),
                    
                    distance: distanceResult, // ddStatus ? distDur.distance : 0,           // (calculate)
                    postedDate: new Date(),
                    
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
    
            // console.log(' --- ', loadBoard)

            // for open
            // loadBoard.order.orderId = await createOrder(loadBoard.order)

            await loadBoard.save()

            createdOrders.push(loadBoard)
        }
        
        return {
            status: 1,
            warnings: warningArray,
            warning: warningArray.length ? true : false,
            msg: 'ok',
            data: createdOrders
        }
    }

    // edit
    async edit(id, data){
        let editOrders = [];
        let warning, message, warningArray = [];
        for (const order of data.orders) {
            warning = false, message = "ok";

            const start = await getStartAddress(order);
            const end = await getEndAddress(order);

            const distData = {
                pickupLat: start.lat,
                pickupLon: start.lon,
                deliveryLat: end.lat,
                deliveryLon: end.lon
            }
            const { distDur, msg, ddStatus } = await Warnings.createOrder(distData);
            if (!ddStatus) {
                warning = true,
                message = msg;
            }

            let equipment = await Equipment.findOne({where: {id: order.eqId }})
            if(!equipment){
                equipment = { 
                    id: 0,
                    feet: 0,
                    weight: 0,
                    cube: 0
                }
            }
            
            let perMileRate = Number(order.perMileRate)
            if(isNaN(perMileRate)){
                perMileRate = 0
            }
            const distanceResult =  ddStatus ? distDur.distance : 0;

            const loadBoard = await LoadBoard.findById(id);

            loadBoard.type = order.isPrivate ? parseInt(order.isPrivate) : 0;
            loadBoard.order = {
                company: {
                    id: 0,
                    deliveryCompanyName: order.deliveryCompanyName,
                    pickupCompanyName: order.pickupCompanyName
                },
                equipment: {
                    id: equipment.id,
                    eqType: order.eqType,
                    name: `${equipment.type} - ${equipment.name}`,
                    feet: equipment.feet,
                    weight: equipment.weight,
                    cube: equipment.cube
                },

                size: order.products && order.products.length ? Number(order.products[0].Size) : 0,
                weight: order.products && order.products.length ? Number(order.products[0].Weight) : 0,

                loadType: order.loadtype,
                
                flatRate: order.flatRate,
                perMileRate: perMileRate,
                perMileRateTotal: perMileRate * distanceResult,

                start: start,
                end: end,
                
                distance: distanceResult,
                postedDate: loadBoard.order.postedDate,
            };

            console.log(' --- ', loadBoard)

            await loadBoard.save();

            editOrders.push(loadBoard);
        }
        
        return {
            status: 1,
            warnings: warningArray,
            warning: warningArray.length ? true : false,
            msg: 'ok',
            data: editOrders
        }
    }

    // delete
    async delete(id){
        LoadBoard.deleteOne({ _id: id }, err => {
            if(err){
                // throw err
                return -1
            }

            return 1
        })
    }
}