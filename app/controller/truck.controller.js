//will be deleted
//
const db = require('../config/db.config.js');
const Truck = db.truck;
const Op = db.Sequelize.Op;
// test
exports.create = (req, res) => {
	Truck.create({
		type: req.body.type,
		capacity: req.body.capacity,
		
        externalSize: req.body.externalSize,
        internalSize: req.body.internalSize,
	}).then(truck => {
		res.status(201).send({
			status: 1,
			data: truck
		});
	}).catch(err => {
        //res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

exports.edit = (req, res) => {
	let id = req.params.id;
	Truck.update({
		type: req.body.type,
		capacity: req.body.capacity,
		
        externalSize: req.body.externalSize,
        internalSize: req.body.internalSize,
	},
	{
		where: {
			id: id
		}
	}).then(truck => {
		res.status(201).send({
			status: 1,
			data: truck
		});
	}).catch(err => {
        //res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

exports.getall = (req, res) => {
    Truck.findAll()
	.then(trucks => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: trucks
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access trucks table',
			'error': err
		});
	});
};

exports.get = (req, res) => {
	var id = req.params.id;
	Truck.findOne({
		where: {
			id: id
		}
	})
	.then(truck => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: truck
		})
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access trucks table',
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
		})
		return;
	}

	Truck.destroy({
		where: {
			id: { [Op.in]: ids.split(',') }
		}
	}).then(orders => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: orders
		})
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access trucks table',
			'error': err
		});
	});
};

exports.getCapacities = (req, res) => {
	Truck.findAll({ 
		attributes: [ 'id', 'capacity' ]
	})
	.then(orders => {
		var capacities = {};
		
		orders.forEach(o => {
			capacities[o.id] = o.capacity;
		});
		
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data:{
				capacities: capacities
			}
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access trucks Board',
			'error': err.message
		});
	});
};