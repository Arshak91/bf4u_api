const db = require('../config/db.config.js');
const Op = db.Sequelize.Op;
const User = db.user;
const Settings = db.settings;
const PermissionGroup = db.permissionGroup;
const Permissions = db.permissions;
const permissions = require('../constants');

const highPermission = [
    'admin',
    'superadmin',
    'driver'
];

exports.checkPermission = async (req, res, next) => {
    const user = req.user;

    if (req.path.includes('/resources/')) return next();

    if (!user.permissionId) return res.status(401).send({ auth: false, data: null, status: 0 });
    
    const permission = await PermissionGroup.findOne({
        where: { id: user.permissionId }
    });

    if (!permission) return res.status(401).send({ auth: false, data: null, status: 0 });
    
    const isHighUserPermission = await checkPermissionLevel(permission);

    if (isHighUserPermission) {
        return next();
    }

    let str1 = req.method.toLowerCase()
    let str2 = req.originalUrl.indexOf('?') > 0 ? req.originalUrl.slice(0, req.originalUrl.indexOf('?')) : req.originalUrl;
    const filter = {
        requestMethod: str1,
        requestUrl: str2
    };
    const permissionList = await getDefaultPermissions(permission.permissions);
    const perm = await Permissions.findAll({
        where: { id: { [Op.in]: permissionList } }
    });
    const index = perm.findIndex(x => filter.requestMethod.includes(x.dataValues.requestMethod) && filter.requestUrl.includes(x.dataValues.requestUrl));
    if (index < 0) return res.status(403).send({ msg: 'User not have a permission', data: null, status: 0 });

    return next();
};

const getDefaultPermissions = async (arr) => {
    const defaultPermissions = await Permissions.findAll({
        where: { isDefault: 1 }
    });
    await Promise.all(defaultPermissions.map(item => {
        arr.push(item.id);
    }));
    return arr;
}

const checkPermissionLevel = async (permission) => (highPermission.includes(permission.name));