const Helpers = require('../classes/helpers');
const db = require('../config/db.config.js');
const Notification = require('../classes/notification');
const Op = db.Sequelize.Op;

const NotificationService = new Notification();

exports.seen = async (req, res) => {
    const { id } = req.query;
    const result = await NotificationService.seen(id, req.user);
    return res.send(result);
};

exports.setAllNotificationSeen = async (req, res) => {
    const result = await NotificationService.setAllNotificationSeen(req.user.id);
    return res.send(result);
};

exports.delete = async (req, res) => {
    const result = await NotificationService.delete(req.body.idList);
    return res.send(result);
};

exports.getById = async (req, res) => {
    const result = await NotificationService.getById(req.params.id);
    return res.send(result);
};

exports.getList = async (req, res) => {
    const sortAndPaging = await Helpers.sortAndPagination(req);
    const filter = await Helpers.filters(req.query, Op, 'notification');
    const result = await NotificationService.getList(filter.where, sortAndPaging);
    return res.send(result);
}