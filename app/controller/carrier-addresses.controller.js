const Helper = require('../classes/helpers');
const db = require('../config/db.config.js');
const CarrierAddress = db.carrierAddress;
const Op = db.Sequelize.Op;


// read
exports.getall = async (req, res) => {
    let sortAndPagination = await Helper.sortAndPagination(req);
	var where = {};
	CarrierAddress.findAll({
		where: where,
		...sortAndPagination
	})
	.then(addresses => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: addresses
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access addresses table',
			'error': err
		});
	});
};

exports.get = (req, res) => {
	var id = req.params.id;
	CarrierAddress.findOne({
		where: {
			id: id
		}
	})
	.then(address => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: address
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access addresses table',
			'error': err.msg
		});
	});
};

// create
exports.create = (req, res) => {
	CarrierAddress.create({
        carrierId: req.body.carrierId,
        addressType: req.body.addressType,
		primery: req.body.primery,
        city: req.body.city,
        stateProvince: req.body.stateProvince,
        zipPostal: req.body.zipPostal
	}).then(address => {
		res.status(201).send({
            status: 1,
            msg: 'Ok',
			data: address
		});
	}).catch(err => {
		res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

// update
exports.edit = (req, res) => {
	var id = req.params.id;
	
	CarrierAddress.update({
        carrierId: req.body.carrierId,
        addressType: req.body.addressType,
		primery: req.body.primery,
        city: req.body.city,
        stateProvince: req.body.stateProvince,
        zipPostal: req.body.zipPostal
	},
	{
		where: {
			id: id
		}
	}
	).then(address => {
		res.status(200).send({
            status: 1,
            msg: 'Ok',
			data: address
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

	CarrierAddress.destroy({
		where: {
			id: { [Op.in]: ids.split(',') }
		}
	}).then(addresses => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: addresses
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access addresses table',
			'error': err
		});
	});
};
