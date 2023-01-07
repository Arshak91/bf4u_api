const db = require('../config/db.config.js');

const User = db.user;
const Settings = db.settings;

exports.userRole = async (req, res, next) => {
    let user, roles;
    user = await User.findOne({ where: {id: req.user.id}});
    
    roles = await user.getRoles();
    for(let i=0; i<roles.length; i++){
        console.log(roles[i].name);
        if(roles[i].name.toUpperCase() === "USER"){
            next();
            return;
        }
    }

    res.status(409).send("Require User Role!");
    return;
};

exports.adminRole = async (req, res, next) => {
    let user, roles;
    user = await User.findOne({ where: {id: req.user.id}});
    
    roles = await user.getRoles();
    for(let i=0; i<roles.length; i++){
        console.log(roles[i].name);
        if(roles[i].name.toUpperCase() === "ADMIN"){
            next();
            return;
        }
    }

    res.status(409).send("Require Admin Role!");
    return;
};

exports.shipperType = async (req, res, next) => {
    let user, types;
    user = await User.findOne({ where: {id: req.user.id}});
    
    types = await user.getTypes();
    for(let i=0; i<types.length; i++){
        console.log(types[i].name);
        if(types[i].type === "shipper"){
            next();
            return;
        }
    }

    res.status(409).json({msg: "Require shipper Role!"});
    return;
};
exports.driverType = async (req, res, next) => {
    let user, types;
    user = await User.findOne({ where: {id: req.user.id}});
    
    types = await user.getTypes();
    for(let i=0; i<types.length; i++){
        console.log(types[i].name);
        if(types[i].type === "driver"){
            next();
            return;
        }
    }

    res.status(409).json({msg: "Require driver Role!"});
    return;
};
exports.courierType = async (req, res, next) => {
    let user, types;
    user = await User.findOne({ where: {id: req.user.id}});
    
    types = await user.getTypes();
    for(let i=0; i<types.length; i++){
        console.log(types[i].name);
        if(types[i].type === "courier"){
            next();
            return;
        }
    }

    res.status(409).json({msg: "Require courier Role!"});
    return;
};

exports.brokerType = async (req, res, next) => {
    let user, types;
    user = await User.findOne({ where: {id: req.user.id}});
    
    types = await user.getTypes();
    for(let i=0; i<types.length; i++){
        console.log(types[i].name);
        if(types[i].type === "broker"){
            next();
            return;
        }
    }

    res.status(409).json({msg: "Require broker Role!"});
    return;
};

exports.userClientType = async (req, res, next) => {
    let settings, userId = req.user.id;
    settings = await Settings.findOne({
        where: { userId }
    });
    req.clientType = settings && settings.dataValues ? settings.dataValues.userType : '';
    next();
};