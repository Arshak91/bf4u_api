const db = require('../config/db.config.js');
const Settings = db.settings;

const Equipment = db.equipment;
const Warnings = require('../warnings/orderWarnings');
const ZipCode = require('../mongoModels/ZipCodesModel');
const CapacityBoard = require('../mongoModels/CapacityBoardModel');



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
module.exports = class CapacityBoardClass{

    // create
    async create(data, user){
        let createdOrders = [];
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

            let perMileRate= Number(order.perMileRate)
            if(isNaN(perMileRate)){
                perMileRate = 0
            }
            const distanceResult =  ddStatus ? distDur.distance : 0;

            // get next unique number
            let nextNumber = await CapacityBoard.find({},{number: 1}).sort({number:-1}).limit(1)
            nextNumber = nextNumber.number ? nextNumber.number + 1 : 1

            const capacityBoard = new CapacityBoard({
                number: nextNumber,
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
                
                    availableSize: order.products && order.products.length ? Number(order.products[0].SizeAvailable) : 0,
                    usedSize: order.products && order.products.length ? Number(order.products[0].SizeUsed) : 0,
                    availableWeight: order.products && order.products.length ? Number(order.products[0].WeightAvailable) : 0,
                    usedWeight: order.products && order.products.length ? Number(order.products[0].WeightUsed) : 0,

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
    
            await capacityBoard.save()

            createdOrders.push(capacityBoard)
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
    async edit(data){
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

            const capacityBoard = new CapacityBoard.findById(id);
            capacityBoard.order = {
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
            
                availableSize: order.products && order.products.length ? Number(order.products[0].SizeAvailable) : 0,
                usedSize: order.products && order.products.length ? Number(order.products[0].SizeUsed) : 0,
                availableWeight: order.products && order.products.length ? Number(order.products[0].WeightAvailable) : 0,
                usedWeight: order.products && order.products.length ? Number(order.products[0].WeightUsed) : 0,

                flatRate: order.flatRate,
                perMileRate: perMileRate,
                perMileRateTotal: perMileRate * distanceResult,

                start: start,
                end: end,
                
                distance: distanceResult,
                postedDate: capacityBoard.order.postedDate,
            };
    
            await capacityBoard.save();

            editOrders.push(capacityBoard);
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
        CapacityBoard.deleteOne({ _id: id }, err => {
            if(err){
                // throw err
                return -1
            }

            return 1
        })
    }
}


// orders: [
//     {
//       id: null,
//       flowType: 3,
//       depoid: null,
//       pickupCompanyName: '',
//       pickupDepoName: '',
//       pickupState: '',
//       pickupCity: '',
//       pickupCountry: 'ca',
//       pickupStreetAddress: '',
//       pickupZip: '',
//       pickupLocationtype: null,
//       pickupDate: '',
//       pickupdateFrom: '',
//       pickupdateTo: '',
//       pickupLat: '',
//       pickupLon: '',
//       pickupAccessorials: null,
//       vendorId: null,
//       vendorAddressId: null,
//       consigneeId: null,
//       consigneeAddressId: null,
//       deliveryCompanyName: '',
//       deliveryDepoName: '',
//       deliveryState: '',
//       deliveryCity: '',
//       deliveryCountry: 'ca',
//       deliveryStreetAddress: '',
//       deliveryZip: '',
//       deliveryLocationtype: null,
//       deliveryDate: '',
//       deliverydateFrom: '',
//       deliverydateTo: '',
//       deliveryLat: '',
//       deliveryLon: '',
//       deliveryAccessorials: null,
//       deliveryDepoId: null,
//       distance: 0,
//       eqType: '',
//       distributionModel: '',
//       bol: '',
//       pro: '',
//       po: '',
//       notes: '',
//       products: [Array]
//     }
//   ]
// }
// [
//   {
//     id: null,
//     HandlingType_id: null,
//     Quantity: '',
//     piecetype_id: null,
//     productdescription: '',
//     Weight: '123',
//     weightType: 'Feet',
//     WeightFull: '9456',
//     weightFullType: 'Feet',
//     Length: '',
//     Width: '',
//     Height: '',
//     unit: 'IN',
//     sku: '',
//     volume: '',
//     brand: '',
//     specialneeds: '',
//     mintemperature: '',
//     maxtemperature: '',
//     density: '',
//     stackable: false,
//     turnable: false,
//     sku: '',
//     volume: '',
//     brand: '',
//     specialneeds: '',
//     mintemperature: '',
//     maxtemperature: '',
//     density: '',
//     stackable: false,
//     turnable: false,
//     images: [],
//     removedImages: []
//   }
// ]