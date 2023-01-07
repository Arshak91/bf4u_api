exports.createError = async (data) => {
    let { name,
    streetaddress,
    city,
    state,
    zip,
    country,
    countryCode } = data;
    let msg = {}, status = 1;
    if (!name) {
        status = 0;
        msg.name = "is required";
    }
    if (!streetaddress) {
        status = 0;
        msg.streetaddress = "is required";
    }
    if (!city) {
        status = 0;
        msg.city = "is required";
    }
    if (!state) {
        status = 0;
        msg.state = "is required";
    }
    if (!zip) {
        status = 0;
        msg.zip = "is required";
    }
    if (!country) {
        status = 0;
        msg.country = "is required";
    }
    if (!countryCode) {
        status = 0;
        msg.countryCode = "is required";
    }
    return {
        status,
        msg
    };
};