const db = require('../config/db.config.js');
const Shift = db.shift;
const Op = db.Sequelize.Op;
const attributes = ['id','shiftName','shift', 'break_time', 'drivingtime' , 'max_shift' , 'rest' , 'recharge', 'status'];

exports.create = (req, res) => {
   // console.log(req.body);
	Shift.create({
	   
		shiftName: req.body.powerUnit,
        shift: req.body.shift,
        break_time: req.body.break_time,
		max_shift: req.body.max_shift,
		drivingtime: req.body.drivingtime,
        rest: req.body.rest,
        recharge: req.body.recharge
 
	}).then(shift => {
		res.status(201).send({
			status: 1,
			data: shift
		});
	}).catch(err => {
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

exports.edit = (req, res) => {
	let id = req.params.id;
	Shift.update({
		shiftName: req.body.powerUnit,
        shift: req.body.shift,
        break_time: req.body.break_time,
		max_shift: req.body.max_shift,
		drivingtime:  req.body.drivingtime,
        rest: req.body.rest,
        recharge: req.body.recharge
       //  shiftid: req.body.shiftid,
       //  working_time:  req.body.working_time,
       //  max_working_time: req.body.max_working_time
	},
	{
		where: {
			id: id
		}
	}).then(shift => {
		res.status(201).send({
			status: 1,
			data: shift
		});
	}).catch(err => {
        //res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
        res.status(200).send({ status: 0, msg: err.message, err: err, data: req.body });
	});
};

exports.getall = (req, res) => {
    Shift.findAll({
		attributes:attributes
	})
	.then(shifts => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: shifts
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access shifts table',
			'error': err
		});
	});
};

exports.get = (req, res) => {
	var id = req.params.id;
	Shift.findOne({
		attributes:attributes,
		where: {
			id: id
		}
	})
	.then(shift => {
		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: shift
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access shifts table',
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

	Shift.destroy({
		where: {
			id: { [Op.in]: ids.split(',') }
		}
	}).then(shifts => {
		res.status(200).send({
			status: 1,
			msg: 'ok',
			data: shifts
		})
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access shifts table',
			'error': err
		});
	});
};