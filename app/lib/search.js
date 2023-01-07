const db = require('../config/db.config.js');
const Op = db.Sequelize.Op;

exports.searchVendor = (text) => {
    let query = {
        [Op.or]: [
            { id: { [Op.like]: '%' + text + '%' } },
            { name: { [Op.like]: '%' + text + '%' } },
            { companyLegalName: { [Op.like]: '%' + text + '%' } },
            { email: { [Op.like]: '%' + text + '%' } },
            { address: { [Op.like]: '%' + text + '%' } },
            { address2: { [Op.like]: '%' + text + '%' } },
            { phone1: { [Op.like]: '%' + text + '%' } },
            { phone2: { [Op.like]: '%' + text + '%' } },
            { contactPerson: { [Op.like]: '%' + text + '%' } },
            { serviceTime: { [Op.like]: '%' + text + '%' } },
            { notes: { [Op.like]: '%' + text + '%' } }
        ]
    };
    return query;
};

exports.searchConsignee = (text, field) => {
    let query;
    if (field) {
        query = {
            [Op.or]: [
                { companyLegalName: { [Op.like]: '%' + text + '%' } }
            ]
        };
    } else {
        query = {
            [Op.or]: [
                { id: { [Op.like]: '%' + text + '%' } },
                { name: { [Op.like]: '%' + text + '%' } },
                { companyLegalName: { [Op.like]: '%' + text + '%' } },
                { email: { [Op.like]: '%' + text + '%' } },
                { address: { [Op.like]: '%' + text + '%' } },
                { address2: { [Op.like]: '%' + text + '%' } },
                { phone1: { [Op.like]: '%' + text + '%' } },
                { phone2: { [Op.like]: '%' + text + '%' } },
                { contactPerson: { [Op.like]: '%' + text + '%' } },
                { rating: { [Op.like]: '%' + text + '%' } },
                { serviceTime: { [Op.like]: '%' + text + '%' } },
                { notes: { [Op.like]: '%' + text + '%' } },
                { driverId: { [Op.like]: '%' + text + '%' } }
            ]
        };
    }
    return query;
};

exports.searchDriver = async (text) => {
    // let depoIds = await this.searchDriverByDepo(text);
    let query = {
        [Op.or]: [
            { id: { [Op.like]: '%' + text + '%' } },
            // { carrierId: { [Op.like]: '%' + text + '%' } },
            // { equipmentId: { [Op.like]: '%' + text + '%' } },
            // { assetId: { [Op.like]: '%' + text + '%' } },
            // { shiftId: { [Op.like]: '%' + text + '%' } },
            // { scheduleid: { [Op.like]: '%' + text + '%' } },
            // { depotId: { [Op.in]: depoIds } },
            { type: { [Op.like]: '%' + text + '%' } },
            // { eqType: { [Op.like]: '%' + text + '%' } },
            // { status: { [Op.like]: '%' + text + '%' } },
            // { startTime: { [Op.like]: '%' + text + '%' } },
            // { endTime: { [Op.like]: '%' + text + '%' } },
            { fname: { [Op.like]: '%' + text + '%' } },
            { lname: { [Op.like]: '%' + text + '%' } },
            { email: { [Op.like]: '%' + text + '%' } },
            { phone: { [Op.like]: '%' + text + '%' } },
            { address: { [Op.like]: '%' + text + '%' } },
            { streetaddress: { [Op.like]: '%' + text + '%' } },
            { city: { [Op.like]: '%' + text + '%' } },
            { state: { [Op.like]: '%' + text + '%' } },
            { zip: { [Op.like]: '%' + text + '%' } },
            { country: { [Op.like]: '%' + text + '%' } },
            { countryCode: { [Op.like]: '%' + text + '%' } },
            { rate: { [Op.like]: '%' + text + '%' } },
            { hourlyRate: { [Op.like]: '%' + text + '%' } },
            { perMileRate: { [Op.like]: '%' + text + '%' } },
            { percentRate: { [Op.like]: '%' + text + '%' } },
            { fuelsurcharge: { [Op.like]: '%' + text + '%' } },
            { detention: { [Op.like]: '%' + text + '%' } },
            { bonuses: { [Op.like]: '%' + text + '%' } },
            // { dob: { [Op.like]: '%' + text + '%' } },
            // { hdate: { [Op.like]: '%' + text + '%' } },
            { easypass: { [Op.like]: '%' + text + '%' } },
            { ex_rev_per_mile: { [Op.like]: '%' + text + '%' } },
            { ex_rev_goal_week: { [Op.like]: '%' + text + '%' } },
            { lengthofhaul_min: { [Op.like]: '%' + text + '%' } },
            { lengthofhaul_max: { [Op.like]: '%' + text + '%' } },
            // { drivinglicence: { [Op.like]: '%' + text + '%' } },
            { use_sleeper_b_p: { [Op.like]: '%' + text + '%' } },
            { throughStates: { [Op.like]: '%' + text + '%' } },
            { pickupDeliveryStates: { [Op.like]: '%' + text + '%' } },
            { prefTruckStops: { [Op.like]: '%' + text + '%' } },
            { tollRoutes: { [Op.like]: '%' + text + '%' } },
            { mobileActive: { [Op.like]: '%' + text + '%' } },
        ]
    };
    return query;
};

exports.searchHandlingTypes = (text) => {
    let query = {
        [Op.or]: [
            // { id: { [Op.like]: '%' + text + '%' } },
            { name: { [Op.like]: '%' + text + '%' } },
            { Type: { [Op.like]: '%' + text + '%' } },
            // { weight: { [Op.startsWith]: text } },
            // { width: { [Op.startsWith]: text } },
            // { height: { [Op.startsWith]: text } },
            // { length: { [Op.startsWith]: text } },
            // { depth: { [Op.startsWith]: text } },
            // { density: { [Op.startsWith]: text } },
            // { description: { [Op.like]: '%' + text + '%' } }
        ]
    };
    return query;
};

exports.searchProducts = async (text) => {
    let query;
    query = {
        [Op.or]: [
            { ID: { [Op.like]: '%' + text + '%' } },
            { _id: { [Op.like]: '%' + text + '%' } },
            { name: { [Op.like]: '%' + text + '%' } },
            { sku: { [Op.like]: '%' + text + '%' } },
            { description: { [Op.like]: '%' + text + '%' } },
            { brandname: { [Op.like]: '%' + text + '%' } },
            { class: { [Op.like]: '%' + text + '%' } },
            { unit: { [Op.like]: '%' + text + '%' } },
            { packsize: { [Op.like]: '%' + text + '%' } },
            { weight: { [Op.like]: '%' + text + '%' } },
            { Weight: { [Op.like]: '%' + text + '%' } },
            { height: { [Op.like]: '%' + text + '%' } },
            { length: { [Op.like]: '%' + text + '%' } },
            { notes: { [Op.like]: '%' + text + '%' } },
            { manufacturernumber: { [Op.like]: '%' + text + '%' } },
            { handlingtype: { [Op.like]: '%' + text + '%' } }
        ]
    };
    return query;
};

exports.assets = (text) => {
    let query = {
        [Op.or]: [
            { id: { [Op.like]: '%' + text + '%' } },
            { companyType: { [Op.like]: '%' + text + '%' } },
            { name: { [Op.like]: '%' + text + '%' } },
            { platNumber: { [Op.like]: '%' + text + '%' } },
            { attachment: { [Op.like]: '%' + text + '%' } },
            { licenses: { [Op.like]: '%' + text + '%' } },
            { VIN: { [Op.like]: '%' + text + '%' } },
            { brand: { [Op.like]: '%' + text + '%' } },
            { cabinType: { [Op.like]: '%' + text + '%' } },
            { inspaction: { [Op.like]: '%' + text + '%' } },
            { yom: { [Op.like]: '%' + text + '%' } },
            { model: { [Op.like]: '%' + text + '%' } },
            { exploitation: { [Op.like]: '%' + text + '%' } },
            { info: { [Op.like]: '%' + text + '%' } },
            { '$equipment.name$': { [Op.like]: '%' + text + '%' } },
            { '$equipment.eqType$': { [Op.like]: '%' + text + '%' } },
            { '$depo.name$': { [Op.like]: '%' + text + '%' } },
        ]
    };
    return query;
};

exports.equipments = (text) => {
    let query = {
        [Op.or]: [
            { id: { [Op.like]: '%' + text + '%' } },
            { type: { [Op.like]: '%' + text + '%' } },
            { trailerType: { [Op.like]: '%' + text + '%' } },
            { name: { [Op.like]: '%' + text + '%' } },
            { horsePower:  { [Op.like]: '%' + text + '%' } },
            { value: { [Op.like]: '%' + text + '%' } },
            { valueUnit: { [Op.like]: '%' + text + '%' } },
            { externalLength: { [Op.like]: '%' + text + '%' } },
            { externalWidth: { [Op.like]: '%' + text + '%' } },
            { externalHeight: { [Op.like]: '%' + text + '%' } },
            { internalLength: { [Op.like]: '%' + text + '%' } },
            { internalWidth: { [Op.like]: '%' + text + '%' } },
            { internalHeight: { [Op.like]: '%' + text + '%' } },
            { maxWeight:  { [Op.like]: '%' + text + '%' } },
            { maxVolume:  { [Op.like]: '%' + text + '%' } },
            { eqType: { [Op.like]: '%' + text + '%' } },
        ]
    };
    return query;
};

exports.depos = (text) => {
    let query = {
        [Op.or]: [
            { id: { [Op.like]: '%' + text + '%' } },
            { name: { [Op.like]: '%' + text + '%' } },
            { address: { [Op.like]: '%' + text + '%' } },
            { streetaddress: { [Op.like]: '%' + text + '%' } },
            { city: { [Op.like]: '%' + text + '%'  }},
            { state: { [Op.like]: '%' + text + '%' } },
            { zip: { [Op.like]: '%' + text + '%' } },
            { country: { [Op.like]: '%' + text + '%' } },
            { countryCode: { [Op.like]: '%' + text + '%' } },
        ]
    };
    return query;
};

exports.userManagement = async (text) => {
    let query = {
        [Op.or]: [
            { id: { [Op.like]: '%' + text + '%' } },
            { name: { [Op.like]: '%' + text + '%' } },
            { username: { [Op.like]: '%' + text + '%' } },
            { email: { [Op.like]: '%' + text + '%' } },
            { permissionId: { [Op.like]: '%' + text + '%' } },
        ]
    }
    return query;
}
// exports.searchDriverByDepo = async (text) => {
//     let query = {
//         [Op.or]: [
//             { name: { [Op.like]: '%' + text + '%' } },
//             { address: { [Op.like]: '%' + text + '%' } },
//             { streetaddress: { [Op.like]: '%' + text + '%' } },
//             { city: { [Op.like]: '%' + text + '%' } },
//             { state: { [Op.like]: '%' + text + '%' } },
//             { zip: { [Op.like]: '%' + text + '%' } },
//             { country: { [Op.like]: '%' + text + '%' } },
//             { countryCode: { [Op.like]: '%' + text + '%' } },
//         ]
//     }, depos, depoIds = [];
//     depos = await Depo.findAndCountAll({
//         attributes: ['id'],
//         where: {
//             ...query
//         }
//     });
//     for (const depo of depos.rows) {
//         depoIds.push(depo.dataValues.id);
//     }
//     return depoIds;
// };