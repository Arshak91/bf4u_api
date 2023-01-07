exports.createAndEditError = async (data) => {
    let { VIN, platNumber, licenses, inspaction, equipmentId } = data;
    let msg = [], status = 1;

    if (!VIN) {
        status = 0;
        msg.push({
            key: 'VIN',
            msg: "VIN is required"
        });
    }
    if (!platNumber) {
        status = 0;
        msg.push({
            key: 'platNumber',
            msg: "Plat Number is required"
        });
    }
    // if (!licenses) {
    //     status = 0;
    //     msg.push({
    //         key: 'licenses',
    //         msg: "Licenses is required"
    //     });
    // }
    if (!inspaction) {
        status = 0;
        msg.push({
            key: 'inspaction',
            msg: "Inspection is required"
        });
    }
    if (!equipmentId) {
        status = 0;
        msg.push({
            key: 'equipmentId',
            msg: "Equipment is required"
        });
    }
    return {
        status,
        msg
    };
};
