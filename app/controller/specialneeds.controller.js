const Helpers = require('../classes/helpers');
const db = require('../config/db.config.js');
const SpecialNeeds = db.specialneeds;
// Get All
exports.getAll = async (req, res) => {

        let sortAndPagination = await Helpers.sortAndPagination(req);
        let where = {};

        SpecialNeeds.findAndCountAll({
            where: where,
           ...sortAndPagination
        })
        .then(SpecialNeedss => {
            res.status(200).send({
                status: 1,
                msg: 'ok',
                data: {
                    data: SpecialNeedss.rows,
                    total: SpecialNeedss.count
                }
            });
        }).catch(err => {
            res.status(500).send({
                'description': 'Can not access SpecialNeedss table',
                'error': err
            });
        });
    };
// Get
exports.get = async (req, res) => {
    const id = req.params.id;

    SpecialNeeds.findOne({
        where: {
            id: id
        }
    })
    .then(specialneeds => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: specialneeds
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access SpecialNeeds table',
            'error': err.msg
        });
    });
};
// Create
exports.create = async (req, res) => {
    
     SpecialNeeds.create(
        { 
            name:req.body.name,
            description:req.body.description,
            status:req.body.status,
        }
).then(specialneeds => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: specialneeds
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};
// Edit
exports.edit = async (req, res) => {
    SpecialNeeds.update(
        { 
            name:req.body.name,
            description:req.body.description,
            status:req.body.status,
        }, 
    { where: { id: req.params.id }
    }).then(specialneeds => {
        res.status(201).send({
            status: 1,
            msg: 'updated',
            data: specialneeds
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

    SpecialNeeds.destroy({
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
            'description': 'Can not access SpecialNeeds table',
            'error': err
        });
    });
};
