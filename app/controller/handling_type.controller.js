const Helper = require('../classes/helpers');
const db = require('../config/db.config.js');
const Search = require('../lib/search');
const HandlingType = db.handlingType;
const Op = db.Sequelize.Op;


exports.getall = async (req, res) => {

    let sortAndPagination = await Helper.sortAndPagination(req);
    let where = req.query, { text } = req.query, search;
    delete where.text;
    search = text ? await Search.searchHandlingTypes(text) : {};

    HandlingType.findAndCountAll({
        where: {
            ...where,
            ...search
        },
        ...sortAndPagination
    })
    .then(handlingtypes => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                handlingtypes: handlingtypes.rows,
                total: handlingtypes.count
            }
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access Handling Unit table',
            'error': err
        });
    });
};
//---
exports.get = async (req, res) => {
    try {
        const id = req.params.id;
        let handlingtype;
        handlingtype = await HandlingType.findOne({
            where: {
                id: id
            },
            include: [{ all: true, nested: false }]
        });
        if (handlingtype) {
            res.status(200).send({
                status: 1,
                msg: 'ok',
                data: handlingtype
            });
        } else {
            res.status(409).send({
                msg: 'Can not access HandlingType table',
                status: 0
            });
        }
    } catch (error) {
        res.status(500).send({
            msg: 'Can not access HandlingType table',
            'error': error
        });
    }
};

exports.create = (req, res) => {
    // console.log(" ------" + req.body);
    let disable = req.body.disabled == "0" ? req.body.disabled : 0;
    HandlingType.create({

        name: req.body.name ? req.body.name : null,
        Type: req.body.Type,
        weight: req.body.weight ? req.body.weight : null,

        width: req.body.width ? req.body.width : null,
        height: req.body.height ? req.body.height : null,
        length: req.body.length ? req.body.length : null,

        depth: req.body.depth ? req.body.depth : null,
        density: req.body.density ? req.body.density : null,

        disabled: disable,
        description: req.body.description ? req.body.description : null


    }).then(handlingtype => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: handlingtype
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

exports.edit = (req, res) => {
    HandlingType.update({
        
        name: req.body.name ? req.body.name : null,
        Type: req.body.Type,
        weight: req.body.weight ? req.body.weight : null,

        width: req.body.width ? req.body.width : null,
        height: req.body.height ? req.body.height : null,
        length: req.body.length ? req.body.length : null,

        depth: req.body.depth ? req.body.depth : null,
        density: req.body.density ? req.body.density : null,

        disabled: req.body.disabled,
        description: req.body.description ? req.body.description : null
        
    }, {
        where: { id: req.params.id }
    }).then(handlingtype => {
        res.status(201).send({
            status: 1,
            msg: 'updated',
            data: handlingtype
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

exports.delete = (req, res) => {
    
    var ids = req.body.ids;
    
    if (ids.length <= 0 ) {
        req.status(200).send({
            status: 0,
            msg: 'no ids for delete'
        });
        return;
    }

    HandlingType.destroy({
        where: {
            id: {
                [Op.in]: ids
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
            'description': 'Can not access HandlingType Unit table',
            'error': err
        });
    });
};