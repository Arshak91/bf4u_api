const Helper = require('../classes/helpers');
const db = require('../config/db.config.js');
const CarrierEquipment = db.carrierEquipment;
const Op = db.Sequelize.Op;
const seq = db.sequelize;

// read
exports.getall = async (req, res) => {
	
	let sortAndPagination = await Helper.sortAndPagination(req);
	let where = {};
	CarrierEquipment.findAll({
		where: where,
		...sortAndPagination
	})
	.then(carrierEquipments => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: carrierEquipments
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carrierEquipments table',
			'error': err
		});
	});
};

exports.get = (req, res) => {
	var id = req.params.id;
	CarrierEquipment.findOne({
		where: {
			id: id
		}
	})
	.then(carrierEquipment => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: carrierEquipment
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carrierEquipments table',
			'error': err.msg
		});
	});
};

// create
exports.create = (req, res) => {
	CarrierEquipment.create({
        carrierId: req.body.carrierId,
        equipmentType: req.body.equipmentType,
        tractorId: req.body.tractorId,
        trailerId: req.body.trailerId
	}).then(carrierEquipment => {
		res.status(201).send({
            status: 1,
            msg: 'Ok',
			data: carrierEquipment
		});
	}).catch(err => {
		res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

// update
exports.edit = (req, res) => {
	var id = req.params.id;
	
	CarrierEquipment.update({
        carrierId: req.body.carrierId,
        equipmentType: req.body.equipmentType,
        tractorId: req.body.tractorId,
        trailerId: req.body.trailerId
	},
	{
		where: {
			id: id
		}
	}
	).then(carrierEquipment => {
		res.status(200).send({
            status: 1,
            msg: 'Ok',
			data: carrierEquipment
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

	CarrierEquipment.destroy({
		where: {
			id: { [Op.in]: ids.split(',') }
		}
	}).then(carrierEquipments => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: carrierEquipments
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carrierEquipments table',
			'error': err
		});
	});
};

// get all equiptments for carrier
exports.getCarrierEquipments_ = (req, res) => {
	let carrierId = req.params.carrierid;
	if(!carrierId){
		carrierId = 0;
	}
	CarrierEquipment.findAll({
		where:{
			carrierId: { [Op.eq]: carrierId }
		}
	}).then(carrierEquipments => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: carrierEquipments
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carrier_equipments table',
			'error': err
		});
	});
};

exports.getCarrierEquipments = (req, res) => {
	var sql = '';
	if(req.params.carrierid > 0){
		sql = `SELECT eq.* FROM equipments eq 
				inner join carrier_equipments ce ON eq.id = ce.equipmentId
				WHERE ce.carrierId=${req.params.carrierid}`;
	}else{
		sql = `SELECT * FROM equipments` ;
	}

	seq.query(sql, { 
		type: seq.QueryTypes.SELECT
	}).then(carrierEquipments => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: carrierEquipments
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carrier_equipments table',
			'error': err
		});
	});
};

exports.getAllForCarrier = (req, res) => {
	let id = req.params.id;
	// var w = id == 0 ? '' : `WHERE ce.carrierId=${id}`

	// var sql = ''
	// if(id == 0){
	// 	sql = `SELECT tl.capacity, tl.type, tr.name, tr.power FROM tractors tr 
	// 	left join trucks tl `
	// }else{
		var sql = `SELECT ce.id, ce.equipmentType, ce.tractorId, ce.trailerId, tl.capacity, tl.type, tr.name, tr.power FROM carrier_equipments ce 
					left join tractors tr on tr.id = ce.tractorId
					left join trucks tl on tl.id = ce.trailerId 
					WHERE ce.carrierId=${id}`;
	// }

	seq.query(sql, { 
		type: seq.QueryTypes.SELECT
	})
	.then(result => {
		// console.log(result);
		
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: result
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access to tables',
			'error': err
		});
	});
};