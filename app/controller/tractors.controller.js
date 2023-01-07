//// will be deleted
////
const db = require('../config/db.config.js');
const Tractor = db.tractor;
const Op = db.Sequelize.Op;

exports.create = (req, res) => {
    // console.log(req.body)
	Tractor.create({
		name: req.body.name,
        power: req.body.power,
        powerUnit: req.body.powerUnit,
	}).then(tractor => {
		res.status(201).send({
			status: 1,
			data: tractor
		});
	}).catch(err => {
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

exports.edit = (req, res) => {
	let id = req.params.id;
	Tractor.update({
		name: req.body.name,
        power: req.body.power,
        powerUnit: req.body.powerUnit,
	},
	{
		where: {
			id: id
		}
	}).then(tractor => {
		res.status(201).send({
			status: 1,
			data: tractor
		});
	}).catch(err => {
        //res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};
exports.getall = (req, res) => {
    Tractor.findAll()
	.then(tractors => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: tractors
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access tractors table',
			'error': err
		});
	});
};

exports.get = (req, res) => {
	var id = req.params.id;
	Tractor.findOne({
		where: {
			id: id
		}
	})
	.then(tractor => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: tractor
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access tractors table',
			'error': err.msg
		});
	});
};

exports.delete = (req, res) => {
	var ids = req.query.ids;
	if(!ids || ids.trim() == ''){
		req.status(200).send({
			status: 0,
			msg: 'no ids for delete'
		});
		return;
	}

	Tractor.destroy({
		where: {
			id: { [Op.in]: ids.split(',') }
		}
	}).then(tractors => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: tractors
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access tractors table',
			'error': err
		});
	});
};