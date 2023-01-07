
const Helpers = require('../classes/helpers');
const db = require('../config/db.config.js');
const TransportType = db.transporrttype;
// Get All
exports.getAll = async (req, res) => {

    let sortAndPagination = Helpers.sortAndPagination(req);
    let where = {};

    TransportType.findAndCountAll({
        where: where,
        ...sortAndPagination
    })
        .then(TransportTypes => {
            res.status(200).send({
                status: 1,
                msg: 'ok',
                data: {
                    data: TransportTypes.rows,
                    total: TransportTypes.count
                }
            });
        }).catch(err => {
            res.status(500).send({
                'description': 'Can not access TransportTypes table',
                'error': err
            });
        });
    };
// Get
exports.get = async (req, res) => {
    const id = req.params.id;

    TransportType.findOne({
        where: {
            id: id
        }
    })
    .then(transporttype => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: transporttype
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access TransportType table',
            'error': err.msg
        });
    });
};
// Create
exports.create = async (req, res) => {
    
    TransportType.create({
        
        name:req.body.name,
        description:req.body.description,
        status:req.body.status,

    }).then(transporttype => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: transporttype
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};
// Edit
exports.edit = async (req, res) => {
    TransportType.update({
        name:req.body.name,
        description:req.body.description,
        status:req.body.status,
    }, 
    { 
        where: { id: req.params.id }
    }).then(transporttype => {
        res.status(201).send({
            status: 1,
            msg: 'updated',
            data: transporttype
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};
// Delete
exports.delete = async (req, res) => {
    var ids = req.query.ids;
    if (!ids || ids.trim() == '') {
        req.status(200).send({
            status: 0,
            msg: 'no ids for delete'
        });
        return;
    }

    TransportType.destroy({
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
        res.status(500).send({
            'description': 'Can not access TransportType table',
            'error': err
        });
    });
};



