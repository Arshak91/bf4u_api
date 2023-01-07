const db = require('../config/db.config.js');
const User = db.user;

exports.createAndEditError = async (data, edit = null) => {
    let { fname, lname, email, country, drivinglicence, shiftId, assetId } = data;
    let msg = [], status = 1;

    if (!fname) {
        status = 0;
        msg.push({fname: "firstName is required", key: "fname"});
    }
    if (!lname) {
        status = 0;
        msg.push({lname: "lastName is required", key: "lname"});
    }
    if (!email) {
        status = 0;
        msg.push({email: "Email is required", key: "email"});
    }
    // if (!country) {
    //     status = 0;
    //     msg.push({country: "Country is required", key: "country"});
    // }
    // if (!drivinglicence) {
    //     status = 0;
    //     msg.push({drivinglicence: "Driver License is required", key: "drivinglicence"});
    // }
    if (!shiftId) {
        status = 0;
        msg.push({shiftId: "Shift is required", key: "shiftId"});
    }
    // if (!assetId) {
    //     status = 0;
    //     msg.push({shiftId: "Asset is required", key: "assetId"});
    // }
    return {
        status,
        msg
    };
};
