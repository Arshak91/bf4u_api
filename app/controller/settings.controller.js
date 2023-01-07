const Helper = require("../classes/helpers");
const UserSettingsService = require('../classes/userSettings');
const UserService = new UserSettingsService();

exports.create = async (req, res) => {
    try {
        const result = await UserService.create(req.user, req.body);
        return res.send(result);
    } catch (error) {
        return Helper.getResponse(0, error.message);
    }
};

exports.edit = async (req, res) => {
    try {
        const result = await UserService.update(req.user, req.body);
        return res.send(result);
    } catch (error) {
        return Helper.getResponse(0, error.message);
    }
};

exports.get = async (req, res) => {
    try {
        const result = await UserService.getByUserId(req.user);
        return res.send(result);
    } catch (error) {
        return Helper.getResponse(0, error.message);
    }
};

exports.getAll = async (req, res) => {
    try {
        const result = await UserService.getAll(req);
        return res.send(result);
    } catch (error) {
        return Helper.getResponse(0, error.message);
    }
};

exports.delete = async (req, res) => {
    try {
        const result = await UserService.delete(req.body.ids);
        return res.send(result);
    } catch (error) {
        return Helper.getResponse(0, error.message);
    }
};
