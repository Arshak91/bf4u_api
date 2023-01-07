const db = require('../config/db.config.js');
const env = process.env.SERVER == 'local' ? require('../config/env.local') : require('../config/env');

// const seq = db.sequelize;
const Op = db.Sequelize.Op;
const seq = db.sequelize;
const NotificationTemplates = require('../classes/notificationTemplates');
const errorMessages = require('../classes/errors');
const Helper = require('../classes/helpers.js');
const notificationTemplatesService = new NotificationTemplates();

exports.getList = async (req, res) => {
    try {
        const response = await notificationTemplatesService.getList(req.user.id);
        return res.send(response);
    } catch (error) {
        console.log(error);
        return Helper.getResponse(0, errorMessages.requestFailed());
    }
};

exports.getById = async (req, res) => {
    try {
        const response = await notificationTemplatesService.getById(req.user.id, req.params.id);
        return res.send(response);
    } catch (error) {
        console.log(error);
        return Helper.getResponse(0, errorMessages.requestFailed());
    }
};

exports.create = async (req, res) => {
    try {
        const response = await notificationTemplatesService.create(req.user.id, req.body);
        return res.send(response);
    } catch (error) {
        console.log(error);
        return Helper.getResponse(0, errorMessages.requestFailed());
    }
};

exports.update = async (req, res) => {
    try {
        const response = await notificationTemplatesService.update(req.params.id, req.body, req.user.id);
        return res.send(response);
    } catch (error) {
        console.log(error);
        return Helper.getResponse(0, errorMessages.requestFailed());
    }
};