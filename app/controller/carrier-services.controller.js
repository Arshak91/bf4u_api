const Helper = require('../classes/helpers');
const db = require('../config/db.config.js');

const CarrierService = db.carrierService;
const Op = db.Sequelize.Op;


// read
exports.getall = async (req, res) => {
	let sortAndPagination = await Helper.sortAndPagination(req);
	var where = {};
	CarrierService.findAll({
		where: where,
		...sortAndPagination
	})
	.then(services => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: services
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carrier_services table',
			'error': err
		});
	});
};

exports.get = (req, res) => {
	var id = req.params.id;
	CarrierService.findOne({
		where: {
			id: id
		}
	})
	.then(service => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: service
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carrier_service table',
			'error': err.msg
		});
	});
};

// create
exports.create = (req, res) => {
	CarrierService.create({
        name: req.body.name
	}).then(service => {
		res.status(201).send({
            status: 1,
            msg: 'Ok',
			data: service
		});
	}).catch(err => {
		res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

// update
exports.edit = (req, res) => {
	var id = req.params.id;
	
	CarrierService.update({
        name: req.body.name
	},
	{
		where: {
			id: id
		}
	}
	).then(service => {
		res.status(200).send({
            status: 1,
            msg: 'Ok',
			data: service
		});
	}).catch(err => {
		res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

// delete
exports.delete = (req, res) => {
	var ids = req.query.ids;
	if(!ids || ids.trim() == ''){
		req.status(200).send({
			status: 0,
			msg: 'no ids for delete'
		});
		return;
	}

	CarrierService.destroy({
		where: {
			id: { [Op.in]: ids.split(',') }
		}
	}).then(serviceids => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: serviceids
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carrier_service table',
			'error': err
		});
	});
};
