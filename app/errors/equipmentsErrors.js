exports.createAndEditError = async (data) => {
    let { name,
    type,
    eqType,
    value,
    maxVolume,
    maxweight } = data;
    let msg = [], status = 1;
    if (!name) {
        status = 0;
        msg.push({
            key: "name",
            msg: "Name is required",
        });
    }
    if (!type) {
        status = 0;
        msg.push({
            key: "type",
            msg: "Type is required"
        });
    }
    if (!eqType) {
        status = 0;
        msg.push({
            key: "eqType",
            msg: "Equipment Type is required"
        });
    }
    if (!value) {
        status = 0;
        msg.push({
            key: "value",
            msg: "Value is required"
        });
    }
    if (!maxVolume) {
        status = 0;
        msg.push({
            key: "maxVolume",
            msg: "maxVolume is required"
        });
    }
    if (!maxweight) {
        status = 0;
        msg.push({
            key: "maxweight",
            msg: "maxWeight is required"
        });
    }
    return {
        status,
        msg
    };
};