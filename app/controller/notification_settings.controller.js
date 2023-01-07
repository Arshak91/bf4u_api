const Helpers = require('../classes/helpers');
const db = require('../config/db.config.js');
const Op = db.Sequelize.Op;
const NotificationSettingsService = require('../classes/notificationSettings');
const notificationService = new NotificationSettingsService();

exports.getById = async (req, res) => {
    try {
        const response = await notificationService.getByUserId(req.user.id);
        res.send(response);
    } catch (error) {
        console.log(error);
    }
};

exports.update = async (req, res) => {
    try {
        const response = await notificationService.update(req.user.id, req.body);
        res.send(response);
    } catch (error) {
        console.log(error);
    }
};