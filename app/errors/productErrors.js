const db = require('../config/db.config.js');

exports.createAndEditError = async (data, edit = null) => {
    let { ID, name, description, brandname, clas, unit, packsize, weight, width, height, length, companyId, notes, piecetypeid, handlingtype, manufacturernumber } = data, user;
    let msg = [], status = 1;
    
    // if (!companyId) {
    //     status = 0;
    //     msg.push({fname: "companyId is required", key: "companyId"});
    // }
    // if (!piecetypeid) {
    //     status = 0;
    //     msg.push({lname: "piecetypeid is required", key: "piecetypeid"});
    // }
    // if (!email) {
    //     status = 0;
    //     msg.push({email: "Email is required", key: "email"});
    // }
    // if (!country) {
    //     status = 0;
    //     msg.push({country: "Country is required", key: "country"});
    // }
    // if (!drivinglicence) {
    //     status = 0;
    //     msg.push({drivinglicence: "Driver License is required", key: "drivinglicence"});
    // }
    // if (!shiftId) {
    //     status = 0;
    //     msg.push({shiftId: "Shift is required", key: "shiftId"});
    // }
    // if (!assetId) {
    //     status = 0;
    //     msg.push({shiftId: "Asset is required", key: "assetId"});
    // }
    return {
        status,
        msg
    };
};
