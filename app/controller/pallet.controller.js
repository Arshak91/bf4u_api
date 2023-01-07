
const Helpers = require('../classes/helpers');
const db = require('../config/db.config.js');
const Op = db.Sequelize.Op;
const Pallet = db.pallet;
// Get All
exports.getAll = async (req, res) => {

    let sortAndPagination = await Helpers.sortAndPagination(req);
    let where = {};

    Pallet.findAndCountAll({
        where: where,
        ...sortAndPagination
    })
    .then(Pallets => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                Menus: Pallets.rows,
                total: Pallets.count
            }
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access Pallets table',
            'error': err
        });
    });
};
// Get
exports.get = async (req, res) => {
    const id = req.params.id;

    Pallet.findOne({
        where: {
            id: id
        }
    })
    .then(pallet => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: pallet
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access Pallet table',
            'error': err.msg
        });
    });
};
// Create
exports.create = async (req, res) => {
    
    Pallet.create(
        {
            size: req.body.size,
        }
    ).then(pallet => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: pallet
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};
// Edit
exports.edit = async (req, res) => {
    Pallet.update(
    {size:req.body.size,}, 
    { where: { id: req.params.id }
    }).then(pallet => {
        res.status(201).send({
            status: 1,
            msg: 'updated',
            data: pallet
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

    Pallet.destroy({
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
            'description': 'Can not access Pallet table',
            'error': err
        });
    });
};
