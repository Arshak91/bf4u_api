const Helper = require('../classes/helpers');
const db = require('../config/db.config.js');
const FlowType = db.flowTypes;
const Op = db.Sequelize.Op;


exports.get = (req, res) => {
    var id = req.params.id;

    FlowType.findOne({
        where: {
            id: id
        }
    })
    .then(flowtype => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: flowtype
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access FlowType table',
            'error': err.msg
        });
    });
};
exports.getall = async (req, res) => {

    let sortAndPagination = await Helper.sortAndPagination(req);
    let where = { status: { [Op.ne]: 0 } };
    FlowType.findAndCountAll({
        where: where,
        ...sortAndPagination
    })
    .then(flowtypes => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                flowtypes: flowtypes.rows,
                total: flowtypes.count
            }
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access FlowType table',
            'error': err
        });
    });
};
exports.create = (req, res) => {
    
    FlowType.create({
        index: req.body.index,
        name: req.body.name,
        description: req.body.description,
        modeltype: req.body.modeltype,
        status: req.body.status
        
    }).then(flowtypes => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: flowtypes
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};
exports.edit = (req, res) => {
    FlowType.update({

        index: req.body.index,
        name: req.body.name,
        description: req.body.description,
        modeltype: req.body.modeltype,
        status: req.body.status
    }, {
        where: { id: req.params.id }
    }).then(flowtypes => {
        res.status(201).send({
            status: 1,
            msg: 'updated',
            data: flowtypes
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};
exports.delete = (req, res) => {
    var ids = req.query.ids;
    if (!ids || ids.trim() == '') {
        req.status(200).send({
            status: 0,
            msg: 'no ids for delete'
        });
        return;
    }


    FlowType.destroy({
        where: {
            id: {
                [Op.in]: ids.split(',')
            }
        }
    }).then(count => {
        res.status(200).send({
            status: 1,
            msg: 'deleted',
            data: count
        });
    }).catch(err => {
        //console.log(err)
        res.status(500).send({
            'description': 'Can not access jobs table',
            'error': err
        });
    });
};
