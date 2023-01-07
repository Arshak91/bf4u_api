const Helpers = require('../classes/helpers');
const db = require('../config/db.config.js');
const Errors = require('../errors/equipmentsErrors');
const ClassEquipments = require('../classes/equipment');
const Search = require('../lib/search');
const Equipment = db.equipment;
const Op = db.Sequelize.Op;
const seq = db.sequelize;

exports.create = async (req, res) => {
	const errors = await Errors.createAndEditError(req.body);
    if (!errors.status) {
        res.status(409).send({
            status: errors.status,
            msg: errors.msg
        });
	} else {
		let data = { ...req.body };
		let equipment = new ClassEquipments({data}), newEquip;
		newEquip = await equipment.create();
		if (newEquip) {
			res.status(201).send({
				status: 1,
				data: newEquip
			});
		} else {
			res.status(409).send({
				status: 0,
				msg: "Equipment doesn't created!"
			});
		}
		
	}
};

exports.edit = (req, res) => {
	let id = req.params.id;
	let maxVolume = req.body.internalLength * req.body.internalWidth * req.body.internalHeight;
	Equipment.update({
		type: req.body.type,
		trailerType: req.body.trailerType,
        name: req.body.name,
        horsePower: req.body.horsePower,
        value: req.body.value,
		valueUnit: req.body.valueUnit,
		
		trailerSize: req.body.trailerSize,
        externalLength: req.body.externalLength,
        externalWidth: req.body.externalWidth,
        externalHeight: req.body.externalHeight,

        internalLength: req.body.internalLength,
        internalWidth: req.body.internalWidth,
		internalHeight: req.body.internalHeight,
		maxweight: req.body.maxweight,
		eqType: req.body.eqType,
		maxVolume: req.body.maxVolume ? req.body.maxVolume : maxVolume,
	},
	{
		where: {
			id: id
		}
	}).then(equipment => {
		res.status(201).send({
			status: 1,
			data: equipment
		});
	}).catch(err => {
        //res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

// SELECT ce.id, ce.equipmentType, ce.tractorId, ce.trailerId, tl.capacity, tl.type, tr.name, tr.power FROM carrier_equipments ce 
// 					left join tractors tr on tr.id = ce.tractorId
// 					left join trucks tl on tl.id = ce.trailerId 
// 					WHERE ce.carrierId=${id}`

exports.getall_ = (req, res) => {
	//ce.id, ce.equipmentType, ce.tractorId, ce.trailerId, tl.capacity, tl.type, tr.name, tr.power
	
	// var sql = `SELECT ce.id, ce.equipmentType, ce.tractorId, ce.trailerId, tl.capacity, tl.type, tr.name, tr.power FROM
	// 				tractors tr
	// 				left join trucks tl`

	//var sql = 'SELECT id = 0, equipmentType = 0, tractorId = 0, trailerId = 0, capacity, TYPE, null, null FROM trucks;'
	var sql = 'SELECT capacity, TYPE FROM trucks;';

	seq.query(sql, { 
		type: seq.QueryTypes.SELECT
	})
	.then(result => {
		console.log(result);
		
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

exports.getall = async (req, res) => {
	let where = req.query;
	let search, { text } = where;
	search = text ? await Search.equipments(text) : {};
	delete where.text;
	let sortAndPagination = await Helpers.sortAndPagination(req), equipments;
    equipments = await Equipment.findAndCountAll({
			where: {
				...where,
				...search
			},
			include: [{ all: true, nested: false }],
			...sortAndPagination 
		}
	).catch(err => {
		res.status(500).send({
			status: 0,
			msg: 'Can not access equipments table',
			error: err.message
		});
	});
	if (equipments) {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: {
                equipments: equipments.rows,
                total: equipments.count
            }
		});
	} else {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: {
                equipments: [],
                total: 0
            }
		});
	}
};

exports.getallByType = async (req, res) => {
	let type = req.params.type;
	console.log(type);
	Equipment.findAll({
		where: {
			type:type,
			maxVolume: {[Op.ne]: null}
		}
	})
	.then(equipments => {
		// console.log(equipments);
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: equipments
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access equipments table',
			'error': err
		});
	});
};


exports.get = (req, res) => {
	var id = req.params.id;
	Equipment.findOne({
		where: {
			id: id
		}
	})
	.then(equipment => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: equipment
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access equipments table',
			'error': err.msg
		});
	});
};

exports.delete = (req, res) => {
	let ids = req.body.ids;
	if(!ids.length){
		req.status(200).send({
			status: 0,
			msg: 'no ids for delete'
		});
		return;
	}

	Equipment.destroy({
		where: {
			id: { [Op.in]: ids }
		}
	}).then(items => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: items
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access equipments table',
			'error': err
		});
	});
};

exports.getCapacities = (req, res) => {
	Equipment.findAll({ 
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
			'description': 'Can not access equipments Board',
			'error': err.message
		});
	});
};

exports.getEquipmentsByeqType = (req, res) => {
	let eqType =  req.params.type; 
	if(!eqType) return;
	Equipment.findAll({ 
		attributes: [ 'id', 'name', 'eqType', 'value', 'maxVolume', 'maxweight' ], 
		where: { eqType:eqType }
	})
	.then(equipments => {
				
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data:{
				equipments
			}
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access equipments Board',
			'error': err.message
		});
	});
};


exports.getEquipmentsByeqTypeForSelect = (req, res) => {
	let eqType = req.params.type; 
	if(!eqType) return;
	Equipment.findAll({
		attributes: ['id', 'name', 'type'],
		where: { eqType: eqType }
	}).then(equipments => {
		const eqs = []
		equipments.forEach(eq => eqs.push({
			id: eq.id,
			name: `${eq.type} - ${eq.name}`
		}))
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: {
				equipments: eqs
			}
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access equipments table',
			'error': err
		});
	});
}

exports.getAllForFilter = async (req, res) => {
	// let sortAndPagination = await Helpers.sortAndPagination(req);
    // let where = {};
    // Equipment.findAndCountAll({
	// 	where: where,
	// 	include: [{ all: true, nested: false }],
	// 	...sortAndPagination
	// })
	Equipment.findAll({
		attributes: ['id', 'name', 'type', 'value', 'maxweight' ]
		// where: where,
		// include: [{ all: true, nested: false }],
		// ...sortAndPagination
	}).then(equipments => {
		const eqs = []
		equipments.forEach(eq => eqs.push({
			id: eq.id,
			name: `${eq.type} - ${eq.name}`,
			size: eq.value,
			weight: eq.maxweight
		}))
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: {
				equipments: eqs
			}
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access equipments table',
			'error': err
		});
	});
};