const db = require('../config/db.config.js');
const Helper = require('../classes/helpers');

const Op = db.Sequelize.Op;
const User = db.user;

const UserService = require('../classes/userManagement');
const UserManagemetService = new UserService();

exports.getUserListForAdmin = async (req, res) => {
    const usersList = await User.findAndCountAll({
        where: {
            id: { [Op.notIn]: [req.user.id] }
        }
    });
    return res.send({ msg: 'ok', status: 1, data: usersList });
}

exports.create = async (req, res) => {
    const isValid = await UserManagemetService.validate(req.body);

    if (isValid && isValid.length) return res.send(Helper.getResponse(0, isValid[0]));

    const response = await UserManagemetService.create(req.body);

    return res.send(response);
};

exports.update = async (req, res) => {
    const body = req.body;
    body.id = req.params.id;

    const isValid = await UserManagemetService.validate(body, true);

    if (isValid &&  isValid.length) return res.send(Helper.getResponse(0, isValid[0]));

    const response = await UserManagemetService.update(body);

    return res.send(response);
};

exports.getList = async(req, res) => {
    const search = req.query.text;
    const filter = req.query;

    const response = await UserManagemetService.getList(req, search, filter);

    return res.send(response);
}

exports.delete = async(req, res) => {
    const response = await UserManagemetService.delete(req.body.idList);
    return res.send(response);
}