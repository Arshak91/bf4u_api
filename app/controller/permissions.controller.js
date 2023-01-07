
const Helpers = require('../classes/helpers');
const db = require('../config/db.config.js');
const Op = db.Sequelize.Op;
const Permissions = db.permissions;
const PermissionGroup = db.permissionGroup;
const PermissionType = require('../constants');

const highPermission = [
    'admin',
    'superadmin'
];
// Get All
exports.getList = async (req, res) => {
    return res.send({ msg: 'ok', data: PermissionType, status: 1 });
};

// get permission groups
exports.getGroupsList = async (req, res) => {
    let data = [];
    
    try {
        data = await PermissionGroup.findAndCountAll({ where: {} });
    } catch (error) {
        return res.send(Helpers.getResponse(0, error));
    }

    const response = data.rows.map(item => item.dataValues);

    return res.send({ status:1, msg: 'permission group list', data: response });
}

// Create permission
exports.create = async (req, res) => {
    await Permissions.create(req.body);
    if (highPermission.includes(req.body.name.trim().toLowerCase())) {
        return res.send({ status: 0, msg: `permission name ${req.body.name} is invalid` });
    }
    return res.send({ msg: 'Permissions created successfuly', data: null, status: 1 });
};
// Create permission group
exports.createGroup = async (req, res) => {
    await PermissionGroup.create(req.body);
    return res.send({ msg: 'Permissions created successfuly', data: null, status: 1 });
};
