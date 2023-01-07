const Helpers = require('../classes/helpers');
const db = require('../config/db.config.js');
const LocationType = db.locationtype;


exports.getall = async (req, res) => {

    let sortAndPagination = await Helpers.sortAndPagination(req);
    let where = {};

    LocationType.findAndCountAll({
        where: where,
        ...sortAndPagination
    })
    .then(locationtypes => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                locationtypes: locationtypes.rows,
                total: locationtypes.count
            }
        })
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access locationtypes table',
            'error': err
        });
    })
};

exports.get = (req, res) => {
    var id = req.params.id;

    LocationType.findOne({
        where: {
            id: id
        }
    })
    .then(locationtypes => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: locationtypes
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access Location Types table',
            'error': err.msg
        });
    });
};

exports.create = (req, res) => {
    var UUID = uuidv4();
    LocationType.create({
        location_type: req.body.location_type
    }).then(job => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: LocationType
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

exports.edit = (req, res) => {
    LocationType.update({
        location_type: req.body.location_type
    }, {
        where: { id: req.params.id }
    }).then(job => {
        res.status(201).send({
            status: 1,
            msg: 'updated',
            data: LocationType
        })
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


    LocationType.destroy({
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
        })
    }).catch(err => {
        //console.log(err)
        res.status(500).send({
            'description': 'Can not access LocationType table',
            'error': err
        });
    })
};
