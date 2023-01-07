const UploadClass = require("../classes/uploads");
const Helper = require("../classes/helpers");
const ClassApiKey = require("../mongoClasses/apiKey");

exports.create = async (req, res) => {
    try {
        let apikey = req.headers["x-api-key"];
        let userId, key, id;
        if (apikey) {
            key = new ClassApiKey({data: {Key: apikey}});
            userId = await key.getBy();
        }
        if(req.user) {
            id = req.user.id;
        } else if (userId) {
            id = userId.key.userId;
        }
        let upCl = new UploadClass({data: {...req.body, userId: id} }), upload;
        upload = await upCl.create();
        res.json({
            ...upload
        });
    } catch (error) {
        console.log(error.message);
        res.status(409).json({
            status: 0,
            msg: `Upload Create: ${error.message}`,
            error
        });
    }
};
exports.edit = async (req, res) => {
    try {
        let apikey = req.headers["x-api-key"];
        let userId, key, id;
        if (apikey) {
            key = new ClassApiKey({data: {Key: apikey}});
            userId = await key.getBy();
        }
        if(req.user) {
            id = req.user.id;
        } else if (userId) {
            id = userId.key.userId;
        }
        let upCl = new UploadClass({data: { ...req.body, userId: id }}), upload;
        upload = await upCl.edit();
        res.json({
            ...upload
        });
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: `UploadEdit Error: ${error.message}`,
            error
        });
    }
};

exports.getAll = async (req, res) => {
    try {
        let sortAndPagination = await Helper.sortAndPagination(req), where = {}, uploads;
        let allCl = new UploadClass({data: {sortAndPagination, where}});
        uploads = await allCl.getAll();
        res.json({
            ...uploads
        });
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: "catch error",
            error
        });
    }
};

exports.getOne = async (req, res) => {
    try {
        let upload;
        let allCl = new UploadClass({data: {...req.params}});
        upload = await allCl.getOne();
        res.json({
            ...upload
        });
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: "catch error",
            error
        });
    }
};
exports.delete = async (req, res) => {
    try {
        let upload, { ids } = req.body;
        let allCl = new UploadClass({data: {ids: ids}});
        upload = await allCl.delete();
        res.json({
            ...upload
        });
    } catch (error) {
        res.status(409).json({
            status: 0,
            msg: "catch error",
            error
        });
    }
};