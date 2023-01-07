const Helper = require('../classes/helpers');
const db = require('../config/db.config.js');
const Errors = require('../errors/depoError');
const Depo = db.depo;
const Osmap = require('./osmap.controller');
const Search = require('../lib/search');
const Customer =  db.customer;
const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
    const errors = await Errors.createError(req.body);
    if (!errors.status) {
        res.status(408).json({
            status: errors.status,
            msg: errors.msg,
        });
    } else {
        let lat, lon, depo;
        let address = `${req.body.zip}+${req.body.city}+${req.body.streetaddress}+${req.body.state}`;
        const { data } = await Osmap.GeoLoc(address);
        if (data.status == 'ZERO_RESULTS') {
            res.status(409).json({
                status: 0,
                msg: 'address is wrong',
            });
        } else {
            lat = data.results[0].geometry.location.lat;
            lon = data.results[0].geometry.location.lng;
            console.log(lat, lon);
            
            depo = await Depo.create({
                name: req.body.name,

                customerId: req.body.customerId,

                streetaddress: req.body.streetaddress,
                city: req.body.city,
                state: req.body.state,
                zip: req.body.zip,
                country: req.body.country,
                countryCode: req.body.countryCode,

                lat: lat,
                lon: lon,
                workinghours: req.body.workinghours
            });
            if (depo) {
                res.status(201).send({
                    status: 1,
                    msg: 'created',
                    data: depo
                });
            } else {
                res.status(409).send({ status: 0, msg: 'Error'});
            }
        }
    }
};

exports.edit = async (req, res) => {
    let lat, lon;
    let address = `${req.body.zip}+${req.body.city}+${req.body.streetaddress}+${req.body.state}`;
    const { data } = await Osmap.GeoLoc(address);
    lat = data.results[0].geometry.location.lat;
    lon = data.results[0].geometry.location.lng;
    Depo.update({
        name: req.body.name,
        customerId: req.body.customerId,
        streetaddress: req.body.streetaddress,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        country: req.body.country,
        countryCode: req.body.countryCode,
        lat: lat,
        lon: lon,
        workinghours: req.body.workinghours
    }, {
        where: { id: req.params.id }
    }).then(depo => {
        res.status(201).send({
            status: 1,
            msg: 'updated',
            data: depo
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

exports.getall = async (req, res) => {
    
    let sortAndPagination = await Helper.sortAndPagination(req);
    let where = await Helper.filters(req.query, Op, 'depo');
	let search, { text } = where, depos;
	search = text ? await Search.depos(text) : {};
	delete where.text;

    depos = await Depo.findAndCountAll({
        where: {
            ...where,
            ...search
        },
        include: [{ all: true, nested: false }],
        ...sortAndPagination
    })
    .catch(err => {
        res.status(500).send({
            status: 0,
            msg: 'Can not access depos table',
            'error': err
        });
    });
    if (depos) {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                depos: depos.rows,
                total: depos.count
            }
        });
    } else {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                depos: [],
                total: 0
            }
        });
    }
};

exports.get = (req, res) => {
    var id = req.params.id;

    Depo.findOne({
        where: {
            id: id
        }
    })
    .then(depo => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: depo
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access depos table',
            'error': err.msg
        });
    });
};

exports.delete = (req, res) => {
    const { ids } = req.body;
    if (!ids || !ids.length) {
        req.status(200).send({
            status: 0,
            msg: 'no ids for delete'
        });
        return;
    }

    Depo.destroy({
        where: {
            id: {
                [Op.in]: ids
            }
        }
    }).then(count => {
        res.status(200).send({
            status: 1,
            msg: 'Depo deleted',
            data: count
        });
    }).catch(err => {
        //console.log(err)
        res.status(500).send({
            'description': 'Can not access depos table',
            'error': err
        });
    });
};

exports.getByUserId = (req, res) => {
    // console.log(req.headers);
    let id = req.params.id;
    // let cid = 17;  // this must be customer or user id;
    Depo.hasOne( Customer , { foreignKey: 'id', sourceKey: 'customerId'} );
    Depo.findOne({
        where: { 
            id: id, 
           //  customerId: cid 
        },
        include:[ { model: Customer }]
    })
    .then(depo => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: depo
          
        });
    }).catch(err => {
        console.log(err);
        res.status(500).send({
            'description': 'Can not access depos table',
            'error': err.msg
        });
    });
};

exports.getByUser = async (req, res) => {
    // let cid = 17;  // this must be customer or user id;
    let sortAndPagination = await Helper.sortAndPagination(req);
    let where = {};

    Depo.hasOne( Customer , { foreignKey: 'id', sourceKey: 'customerId'} );
    Depo.findAndCountAll({
        where: where,
        include:[ { model: Customer }], 
        ...sortAndPagination
    })
    .then(depos => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                depos: depos.rows,
                total: depos.count
            }
        });
    }).catch(err => {
        console.log(err);
        res.status(500).send({
            'description': 'Can not access depos table',
            'error': err.msg
        });
    });
};
