const Helpers = require('../classes/helpers');

const db = require('../config/db.config.js');
const Accessorials = db.accessorials;


exports.getall = async (req, res) => {

    let sortAndPagination = await Helpers.sortAndPagination(req);
    let where = {};

    Accessorials.findAndCountAll({
        where: where,
        ...sortAndPagination
    })
    .then(accessorials => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                accessorials: accessorials.rows,
                total: accessorials.count
            }
        })
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access accessorials table',
            'error': err
        });
    });
};

exports.get = (req, res) => {
    var id = req.params.id;

    Accessorials.findOne({
        where: {
            id: id
        }
    })
    .then(accessorials => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: accessorials
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access accessorials table',
            'error': err.msg
        });
    });
};

exports.create = (req, res) => {

    Accessorials.create({
     Type: req.body.type ,
     ServiceOption: req.body.ServiceOption
    }).then(() => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: Accessorials
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

exports.edit = (req, res) => {
    Accessorials.update({
        Type: req.body.type ,
        ServiceOption: req.body.ServiceOption
    }, {
        where: { id: req.params.id }
    }).then(() => {
        res.status(201).send({
            status: 1,
            msg: 'updated',
            data: Accessorials
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


    Accessorials.destroy({
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
            'description': 'Can not access Accessorials table',
            'error': err
        });
    });
};
