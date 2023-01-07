const db = require('../config/db.config.js');
const Equipment = db.equipment;
const Shift = db.shift;


exports.manualLoadTempWarnings = async (data) => {
    let { equipmentName, cube, weight, feet, driver, totalDuration, shift } = data;
    let error = false;
    let msg = "ok", 
        errorMsg = "Capacity(ies) of the vehicle is exceeded. Please check";
    if (equipmentName && cube) {
        const equipment = await Equipment.findOne({
            where: {
                id: equipmentName
            }
        });
        const { maxweight, maxVolume, value } = equipment;
        if (maxVolume < cube) {
            error = true;
            errorMsg += " volume,";
        }
        if (maxweight < weight) {
            error = true;
            errorMsg += " weight,";
        }
        if (feet > value) {
            error = true;
            errorMsg += " feet.";
        }
    }
    if (driver && driver.shift.shift < totalDuration) {
        error == true ? errorMsg += " And route time is over" : errorMsg = "Route time is over";
        error = true;
    } else if(shift && shift.shift < totalDuration) {
        error == true ? errorMsg += " And route time is over" : errorMsg = "Route time is over";
        error = true;
    }
    return {
        error,
        msg: !error ? msg : errorMsg
    };
    
};

exports.addOrderFromLoadWarning = async (data) => {
    const { load, order } = data;
    let msg = "ok", warning = false;
    // const loadShift = await Shift.findOne({where: { id: load.shiftId } });
    // let drivingTime = load.shiftId == 1 ? loadShift.drivingtime : 50400;
    // let startTime = new Date(load.startTime).getTime();
    if (!load) {
        warning = true;
        msg = "LOAD removed because haven't order";
    } else {
        if (load.flowType == 1) {
            if (load.warning) {
                warning = true;
                msg = "ETA of the order must be between its time window.";
            }
        } else if(load.flowType == 2) {
            if (load.warning) {
                warning = true;
                msg = "ETA of the order must be between its time window.";
            }
        }
    }
    
    return {
        warning,
        msg
    };
};
