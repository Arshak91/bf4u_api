exports.authError = async (data) => {
    let error = false, msg = "ok";
    const { deviceType } = data.body;
    const { types, authorities } = data;
    switch (deviceType) {
        case "Mobile":
            if (authorities.includes("ROLE_PM") || authorities.includes("ROLE_ADMIN") || types == "courier") {
                error = true;
                msg = "you cannot log in with mobile application";
            }
            break;
        case "Browser":
            if (types == "driver") {
                error = true;
                msg = "you cannot log in with web browser";
            }
            break;
        default:
            break;
    }
    return {
        error,
        msg
    };
};
