const db = require('../config/db.config.js');
const Config = db.config;
const Op = db.Sequelize.Op;

// read
exports.getall = (req, res) => {
    var where = req.name ? { name: { [Op.like]: req.name } } : {};
    
	Config.findAll({
		where: where
	})
	.then(configs => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: configs
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access configs table',
			'error': err
		});
	});
};

exports.get = (req, res) => {
	var id = req.params.id;
	Config.findOne({
		where: {
			id: id
		}
	})
	.then(config => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: config
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access configs table',
			'error': err.msg
		});
	});
};

// create
exports.create = (req, res) => {
	Carrier.create({
        name: req.body.name,
        value: req.body.value,
        status: req.body.status
	}).then(config => {
		res.status(201).send({
            status: 1,
            msg: 'Ok',
			data: config
		});
	}).catch(err => {
		res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

// update
exports.edit = (req, res) => {
	var id = req.params.id;
	
	Config.update({
		name: req.body.name,
        value: req.body.value,
        status: req.body.status
	},
	{
		where: {
			id: id
		}
	}
	).then(config => {
		res.status(200).send({
            status: 1,
            msg: 'Ok',
			data: config
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

	Config.destroy({
		where: {
			id: { [Op.in]: ids.split(',') }
		}
	}).then(configs => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: configs
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access configs table',
			'error': err
		});
	});
};
