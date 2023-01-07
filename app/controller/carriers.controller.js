const Helper = require('../classes/helpers');
const db = require('../config/db.config.js');
const Carrier = db.carrier;
const CarrierAddress = db.carrierAddress;
const CarrierEquipment = db.carrierEquipment;
const Op = db.Sequelize.Op;


// read
exports.getall = async (req, res) => {
	let sortAndPagination = await Helper.sortAndPagination(req);
	var where = {};
	Carrier.findAll({
		where: where,
		include: [{ all: true, nested: false }],
		...sortAndPagination

	})
	.then(carriers => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: carriers
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carriers table',
			'error': err
		});
	});
};
exports.get = (req, res) => {
	var id = req.params.id;
	Carrier.findOne({
		where: {
			id: id
		},
		include: [{ all: true, nested: false }],
	})
	.then(carrier => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: carrier
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carriers table',
			'error': err.msg
		});
	});
};

// create
exports.create = (req, res) => {
	Carrier.create({
		carrierType: req.body.carrierType,

        legalcompanyname: req.body.legalcompanyname,
        dbaname: req.body.dbaname,
        operation_authority: req.body.operation_authority,
		
        phone: req.body.phone,
        fax: req.body.fax,
        website: req.body.website,
        yearestablished: req.body.yearestablished,
        
        identification_number: req.body.identification_number,
        area_of_services: req.body.area_of_services,

        status: req.body.status
	}).then(carrier => {
		CarrierAddress.bulkCreate([
			{ 
				carrierId: carrier.id, 
				addressType: 'Physical', 
				address: req.body.physical_address,
				city: req.body.physical_city, 
				stateProvince: req.body.physical_state, 
				zipPostal: req.body.physical_zipcode
			},
			{ 
				carrierId: carrier.id, 
				addressType: 'Mailing', 
				address: req.body.mailing_address,
				city: req.body.mailing_city, 
				stateProvince: req.body.mailing_state, 
				zipPostal: req.body.mailing_zipcode
			}
		]).then(() => {
			return Carrier.findOne({where: { id: carrier.id }});
		}).then(carrier => {
			var eqs = [];
			if(req.body.selectedTractors){
				req.body.selectedTractors.split(',').forEach(t => {
					eq = {
						carrierId: carrier.id,
						equipmentType: 'Tractor',
						tractorId: t,
						trailerId: null,
					};
					eqs.push(eq);
				});
			}
			if(req.body.selectedTrailers){
				req.body.selectedTrailers.split(',').forEach(t => {
					eq = {
						carrierId: carrier.id,
						equipmentType: 'Trailer',
						tractorId: null,
						trailerId: t
					};
					eqs.push(eq);
				});
			}
			// req.body.equipments.forEach(e => {
			// 	eq = {
			// 		carrierId: carrier.id,
			// 		equipmentType: e.type,
			// 		tractorId: e.type == 'Tractor' ? e.id : null,
			// 		trailerId: e.type == 'Trailer' ? e.id : null,
			// 	}
			// })
			CarrierEquipment.bulkCreate(eqs).then(() => {
				return Carrier.findOne({where: { id: carrier.id }});
			}).then(carrier => {
				res.status(201).send({
					status: 1,
					msg: 'Ok',
					data: carrier
				});
			});
		});

		// // create driver if carrier is own-operator
		// if(carrierType == 'ownoperator'){

		// }

	}).catch(err => {
		res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};
// update
exports.edit = (req, res) => {
	var id = req.params.id;
	
	Carrier.update({
		carrierType: req.body.carrierType,
		
		legalcompanyname: req.body.legalcompanyname,
        dbaname: req.body.dbaname,
        
        phone: req.body.phone,
        fax: req.body.fax,
        website: req.body.website,
        yearestablished: req.body.yearestablished,
        
        operation_authority: req.body.operation_authority,
        identification_number: req.body.identification_number,
        area_of_services: req.body.area_of_services,
        
        status: req.body.status
	},
	{
		where: {
			id: id
		}
	}
	).then(carrier => {
		res.status(200).send({
            status: 1,
            msg: 'Ok',
			data: carrier
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

	Carrier.destroy({
		where: {
			id: { [Op.in]: ids.split(',') }
		}
	}).then(carriers => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: carriers
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carriers table',
			'error': err
		});
	});
};


exports.getAllActives = (req, res) => {
	var where = {};
	Carrier.findAll({
		where: {
			status: { [Op.eq]: 'Active' }
		}
	})
	.then(carriers => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: carriers
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carriers table',
			'error': err
		});
	});
};

exports.getAllWithParams1 = (req, res) => {
	Carrier.findAll({
		where:{
			'$equips.carrierId$': { [Op.eq]: '$carriers.id$' }
		},
		include: [{
			model: CarrierEquipment,
			as: 'equips'
		}]
	}).then(carriers => {
		// ok
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: carriers
		});
	}).catch(err => {
		console.log(err);
		res.status(500).send({
			'description': 'Can not access Carrier Page',
			'error': err
		});
	});

	// Carrier.findOne({
	// 	where: { id: req.params.id },
	// 	//attributes: ['name', 'username', 'email'],
	// 	include: [{
	// 		model: CarrierEquipment,
	// 		//attributes: ['id', 'name'],
	// 		through: {
	// 			attributes: ['userId', 'roleId'],
	// 		}
	// 	}]
	// }).then(user => {
	// 	res.status(200).send({
	// 		'description': '>>> User Contents!',
	// 		'user': user
	// 	});
	// }).catch(err => {
	// 	res.status(500).send({
	// 		'description': 'Can not access User Page',
	// 		'error': err
	// 	});
	// })


	// Carrier.findAll()
	// .then(carriers => {
	// 	CarrierEquipment.findAll({
	// 		where:{
	// 			carrierId: { [Op.eq]: id }
	// 		}
	// 	}).then(equipments => {
	// 		carrier.equipments = equipments

	// 		CarrierAddress.findAll({
	// 			where: {
	// 				carrierId: { [Op.eq]: id }
	// 			}
	// 		}).then(addresses => {
	// 			carrier.addresses = addresses

	// 			// ok
	// 			res.status(200).send({
	// 				status: 1,
	// 				msg: 'Ok',
	// 				data: carrier
	// 			})

	// 		}).catch(err => {
	// 			console.log('error in addresses --- ')
	// 			console.log(err)
	// 		})
	// 		console.log('ADDR')
	// 	}).catch(err => {
	// 		console.log('error in equipments --- ')
	// 		console.log(err)
	// 	})
	// 	console.log('EQUIP')
	// }).catch(err => {
	// 	res.status(500).send({
	// 		'description': 'Can not access carriers table',
	// 		'error': err.msg
	// 	});
	// })
};

exports.getWithParamsForCarrier = (req, res) => {
	let id = req.params.id;
	Carrier.findOne({
		where: { 
			id: { [Op.eq]: id } 
		}
	}).then(carrier => {
		CarrierEquipment.findAll({
			where:{
				carrierId: { [Op.eq]: id }
			}
		}).then(equipments => {
			carrier.equipments = equipments;

			CarrierAddress.findAll({
				where: {
					carrierId: { [Op.eq]: id }
				}
			}).then(addresses => {
				carrier.addresses = addresses;

				// ok
				res.status(200).send({
					status: 1,
					msg: 'Ok',
					data: carrier
				});

			}).catch(err => {
				// console.log('error in addresses --- ');
				// console.log(err);
			});
			// console.log('ADDR');
		}).catch(err => {
			// console.log('error in equipments --- ');
			// console.log(err);
		});
		// console.log('EQUIP');
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access carriers table',
			'error': err.msg
		});
	});
};

exports.getNamesByIds = (req, res) => {
	let ids = req.query.ids;
	Carrier.findAll({
		attributes: ['id', 'legalcompanyname'],
		where: {
			id: { [Op.in]: ids.split(',') }
		}
	})
	.then(carriers => {
		let carriersResult = [];
		carriers.forEach(c => {
			carriersResult.push({
				id: c.id,
				name: c.legalcompanyname
			});
		});
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: carriersResult
		});
	}).catch(err => {
		// console.log(err);
		res.status(500).send({
			'description': 'Can not access Carriers table',
			'error': err
		});
	});
};