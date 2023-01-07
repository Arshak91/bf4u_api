const osrm = require('../controller/osmap.controller');

exports.editOrder = async (data) => {
    const pickupLatLon = `${data.pickupLat},${data.pickupLon}`;
    const deliveryLatLon = `${data.deliveryLat},${data.deliveryLon}`;
    const LatLons = `${pickupLatLon};${deliveryLatLon};`;
    let msg;
    const { distDur, status } = await osrm.GetDistDur(LatLons);
    if (!status) {
        msg = "There are problems with the map server.";
    }
    return {
        distDur,
        status,
        msg
    };
};

exports.createOrder = async (data) => {
    const pickupLatLon = `${data.pickupLat},${data.pickupLon}`;
    const deliveryLatLon = `${data.deliveryLat},${data.deliveryLon}`;
    const LatLons = `${pickupLatLon};${deliveryLatLon};`;
    let msg;
    const { distDur, status } = await osrm.GetDistDur(LatLons);
    if (!status) {
        msg = "Can't connect to map server.";
    }
    return {
        distDur,
        status,
        msg
    };
};
