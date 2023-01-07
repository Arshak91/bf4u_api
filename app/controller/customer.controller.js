const db = require('../config/db.config.js');
const Helper = require('../classes/helpers');
const seq = db.sequelize;
const Customer = db.customer;
const Op = db.Sequelize.Op;


exports.create = (req, res) => {    
	Customer.create({
		//Name: req.body.name,
		companyName: req.body.companyName,
		customerName: req.body.customerName,

        Address_p: req.body.address_p,
        Address1: req.body.address1,
		
		rate: req.body.rate,
		
		phone1: req.body.phone1,
        phone2: req.body.phone2,
		
		Type: req.body.type,
        note: req.body.note,
  
		contactperson: req.body.contactperson,
        contactpersonposition: req.body.contactpersonposition,
        industrytype: req.body.industrytype,
        email: req.body.email,
        lastcontactedday: null, //new Date(),
		
		country: req.body.country,
        state: req.body.state,
		city: req.body.city,
		
		workinghours: req.body.workinghours,
		deliveryhours: req.body.deliveryhours,

		createdAd: new Date(),
		updatedAt: new Date(),
	}).then(customer => {
		res.status(201).send({
			status: 1,
			data: customer
		});
	}).catch(err => {
        //res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

exports.edit = (req, res) => {
	var id = req.params.id;
	
	Customer.update({
        //Name: req.body.name,
		companyName: req.body.companyName,
		customerName: req.body.customerName,
		
        Address_p: req.body.address_p,
        Address1: req.body.address1,
        Rating: req.body.rating,
        phone1: req.body.phone1,
        phone2: req.body.phone2,
        Type: req.body.type,
		note: req.body.note,
		
		updatedAt: new Date(),
		
		contactperson: req.body.contactperson,
        contactpersonposition: req.body.contactpersonposition,
        industrytype: req.body.industrytype,
        email: req.body.email,
        lastcontactedday: null, //new Date(),
        country: req.body.country,
        state: req.body.state,
        city: req.body.city,
		
		workinghours: req.body.workinghours,
		deliveryhours: req.body.deliveryhours
	},
	{
		where: {
			id: id
		}
	}).then(customer => {
		res.status(201).send({
			status: 1,
			data: customer
		});
	}).catch(err => {
        //res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

exports.getall = async (req, res) => {
	let sortAndPagination = await Helper.sortAndPagination(req);
    Customer.findAll({
		include: [{ all: true, nested: false }],
		...sortAndPagination
	})
	.then(customers => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: customers
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access Customers table',
			'error': err
		});
	});
};

exports.get = (req, res) => {
	let id = req.params.id;
	Customer.findOne({
		where: {
			id: { [Op.eq]: id }
		}
	})
	.then(customer => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: customer
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access Customers table',
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

	Customer.destroy({
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
			'description': 'Can not access Customers table',
			'error': err
		});
	});
};

exports.getNamesByIds = (req, res) => {
	let ids = req.query.ids;
	Customer.findAll({
		attributes: ['id', 'customerName'],
		where: {
			id: { [Op.in]: ids.split(',') }
		}
	})
	.then(customers => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: customers
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access Customers table',
			'error': err
		});
	});
};