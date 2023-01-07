const db = require('../config/db.config.js');
const Status = db.status;
const Op = db.Sequelize.Op;

exports.create = (req, res) => {
    // console.log(req.body);
	Status.create({
		type: req.body.type,
		name: req.body.name,
		statustype: req.body.statustype
	}).then(status => {
		res.status(201).send({
			status: 1,
			data: status
		});
	}).catch(err => {
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

exports.edit = async (req, res) => {
	let id = req.params.id;
	await Status.update({
		type: req.body.type,
		name: req.body.name,
		statustype: req.body.statustype,
		color: req.body.color
	},
	{
		where: {
			id: id
		}
	}).then(status => {
		res.status(201).send({
			status: 1,
			data: status
		});
	}).catch(err => {
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

exports.getall = (req, res) => {
    Status.findAll()
	.then(statuses => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: statuses
		});
	}).catch(err => {
		res.status(500).send({
			msg: !err.message ? 'Can not access statuses table' : err.message,
			status: 0
		});
	});
};

exports.get = (req, res) => {

	let id = [];
	req.params.id.split(",").map(el => { id.push(el); });		
	Status.findAll({
		where:{ 
			id: { 
				[Op.in]:id
			} 
		}
	})
	.then(status => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: status
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access statuses table',
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

	Status.destroy({
		where: {
			id: { [Op.in]: ids.split(',') }
		}
	}).then(orders => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: orders
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access statuses table',
			'error': err
		});
	});
};


/******************** */
exports.getLoadStatuses = (req, res) => {
	
	const where = {
		[Op.or]:[{type: "Both"},{type: "Load"}],
		statustype: "*",
		
	};
	Status.findAll({where:where})
	.then(statuses => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: statuses
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access statuses table',
			'error': err
		});
	});
};

exports.getOrderStatuses = (req, res) => {
	
	const where = {
		[Op.or]:[{type: "Both"},{type: "Order"}],
		statustype: "*",
	};
	Status.findAll({where: where})
	.then(statuses => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: statuses
		});
	}).catch(err => {
		console.log(' -- order statuses -- ', err)
		res.status(500).send({
			'description': 'Can not access statuses table',
			'error': err
		});
	});
};

exports.getLoadWarnning = (req, res) => {
	const where = {
		type: "Load",
		statustype: "**"
	};
	Status.findAll({where:where})
	.then(statuses => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: statuses
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access statuses table',
			'error': err
		});
	});
};

exports.getOrderWarnning = (req, res) => {
	const where = {
		type: "Order",
		statustype: "**"
	};
	Status.findAll({where:where})
	.then(statuses => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: statuses
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access statuses table',
			'error': err
		});
	});
};