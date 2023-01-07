const ClassApiKey = require('../mongoClasses/apiKey');
const Helper = require('../classes/helpers');


exports.create = async (req, res) => {
    try {
        let apiKey;
        let info = await Helper.getRemoteInfo(req);
        let data = {
            ...req.body,
            host: info.host,
            companyName: info.companyName
        };
        let key = new ClassApiKey({data});
        apiKey = await key.create();
        if (apiKey) {
            res.json({
                status: 1,
                msg: "ok",
                data: apiKey
            });
        } else {
            res.status(409).json({
                status: 0,
                msg: "Error create ApiKey"
            });
        }
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: error.message
        });
    }
};

exports.edit = async (req, res) => {
    try {
        let data = {
            ...req.body,
            ...req.params,
        }, updateApiKey;
        let key = new ClassApiKey({data});
        updateApiKey = await key.edit();
        if (updateApiKey.status) {
            res.json({
                status: updateApiKey.status,
                msg: "ok",
                data: updateApiKey
            });
        } else {
            res.status(409).json({
                status: updateApiKey.status,
                msg: updateApiKey.msg
            });
        }
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: error.message,
        });
    }
};

exports.getOne = async (req, res) => {
    try {
        let data = req.params;
        let key = new ClassApiKey({data}), apiKey;
        apiKey = await key.getOne();
        if (apiKey.status) {
            res.json({
                status: apiKey.status,
                msg: "ok",
                data: apiKey
            });
        } else {
            res.status(409).json({
                status: apiKey.status,
                msg: apiKey.msg
            });
        }
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: error.message,
        });
    }
};
exports.getAll = async (req, res) => {
    try {
        let data = req.query;
        let keys = new ClassApiKey({data}), apiKeys;
        apiKeys = await keys.getAll();
        if (apiKeys.status) {
            res.json({
                status: apiKeys.status,
                msg: "ok",
                data: apiKeys
            });
        } else {
            res.json({
                status: apiKeys.status,
                msg: apiKeys.msg,
            });
        }
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: error.message,
        });
    }
};

exports.deleteKey = async (req, res) => {
    try {
        let data = req.params;
        let key = new ClassApiKey({data}), apiKey;
        apiKey = await key.deleteOne();
        if (apiKey.status) {
            res.json({
                status: apiKey.status,
                msg: "ok",
                data: apiKey
            });
        } else {
            res.json({
                status: apiKey.status,
                msg: apiKey.msg,
            });
        }
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: error.message,
        });
    }
};
