const db = require('../config/db.config.js');
const Event = db.events;
const Op = db.Sequelize.Op;
const jwt = require('jsonwebtoken');

exports.create = async (req, res) => {
    try {
        const event = await Event.create({
            loads_id: req.body.loadsId,
            lat:req.body.lat,
            lon:req.body.lon,
            event_description: req.body.description,
            event_start_time: req.body.startTime,
            event_end_time: req.body.endTime,
            duration: req.body.duration
        });
        if (event) {
            res.status(201).send({
                status: 1,
                data: event
            });
        }
    } catch (err) {
        res.status(200).send({
            status: 0,
            msg: err.message,
            err: err,
            data: req.body
        });
    }
};

exports.edit = async (req, res) => {
    try {
        let id = req.params.id;
        const event = await Event.update({
            loads_id: req.body.loadsId,
            lat:req.body.lat,
            lon:req.body.lon,
            event_description: req.body.description,
            event_start_time: req.body.startTime,
            event_end_time: req.body.endTime,
            duration: req.body.duration
        },
        {
            where: {
                id
            }
        });
        if (event) {
            res.status(201).send({
                status: 1,
                data: event
            });
        }
    } catch (err) {
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
    }
};

exports.getAll = async (req, res) => {
    try {
        const events = await Event.findAll();
        if (events) {
            res.status(200).send({
                status: 1,
                msg: 'ok',
                data: events
            });
        }
    } catch (err) {
        res.status(500).send({
			'description': 'Can not access events table',
			'error': err
		});
    }
};

exports.getById = async (req, res) => {
    try {
        let id = req.params.id;
        const event = await Event.findOne({
            where: {
                id
            }
        });
        res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: event
		});
    } catch (err) {
        res.status(500).send({
			'description': 'Can not access trucks table',
			'error': err.msg
		});
    }
};