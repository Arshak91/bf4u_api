exports.loadDispatchError = async (load) => {
    let msg = "ok", status = 0, id;
    if (!load.carTypes || !load.carTypes.length) {
        msg = "Please assign asset to the load.";
        id = load.id,
        status = 1;
    }
    return {
        msg,
        id,
        status
    };
};