const Helper = require('../classes/helpers');
const db = require('../config/db.config.js');

const Currency = db.currencies;

const Op = db.Sequelize.Op;


exports.create = (req, res) => {    
	Currency.create({
		alias: req.body.alias,
		fullAlias: req.body.fullAlias,
        name: req.body.name,
        symbol: req.body.symbol,
		
		// createdAd: new Date(),
		// updatedAt: new Date(),
	}).then(currency => {
		res.status(201).send({
			status: 1,
			data: currency
		});
	}).catch(err => {
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

exports.edit = (req, res) => {
	var id = req.params.id;
	
	Currency.update({
        alias: req.body.alias,
		fullAlias: req.body.fullAlias,
        name: req.body.name,
        symbol: req.body.symbol,
		
		// updatedAt: new Date(),
	}, {
		where: {
			id: id
		}
	}).then(currency => {
		res.status(200).send({
			status: 1,
			data: currency
		});
	}).catch(err => {
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

exports.getall = async (req, res) => {
	let sortAndPagination = await Helper.sortAndPagination(req);
    Currency.findAll({
		include: [{ all: true, nested: false }],
		...sortAndPagination
	})
	.then(currencies => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: currencies
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access currencies table',
			'error': err
		});
	});
};

exports.get = (req, res) => {
	let id = req.params.id;
	Currency.findOne({
		where: {
			id: { [Op.eq]: id }
		}
	})
	.then(currency => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: currency
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access currencies table',
			'error': err
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

	Currency.destroy({
		where: {
			id: { [Op.in]: ids.split(',') }
		}
	}).then(count => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: count
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access currencies table',
			'error': err
		});
	});
};
