const Helpers = require('../classes/helpers');
const db = require('../config/db.config.js');
const Job = db.job;
const Op = db.Sequelize.Op;



exports.get = (req, res) => {
    var id = req.params.id;

    Job.findOne({
        where: {
            id: id
        }
    })
    .then(job => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: job
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access jobs table',
            'error': err.msg
        });
    });
};
exports.getall = async (req, res) => {

    let sortAndPagination = await Helpers.sortAndPagination(req);
    let where = {};

    Job.findAndCountAll({
        where: where,
        ...sortAndPagination
    })
    .then(jobs => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                jobs: jobs.rows,
                total: jobs.count
            }
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access jobs table',
            'error': err
        });
    });
};
exports.create = (req, res) => {
    
    Job.create({
        UUID: req.body.uuid, //req.body.nickname,
        autoPlanType: req.body.autoPlanType,
        autoPlanDate: req.body.autoPlanDate,
        autoPlanMaxCount: req.body.autoPlanMaxCount,
        feets: req.body.feets,
        loadIds: req.body.loadIds,
        status: req.body.status
    }).then(job => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: job
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};
exports.edit = (req, res) => {
    Job.update({
        UUID: req.body.UUID,
        autoPlanType: req.body.autoPlanType,
        autoPlanDate: req.body.autoPlanDate,
        autoPlanMaxCount: req.body.autoPlanMaxCount,
        feets: req.body.feets,
        loadIds: req.body.loadIds,
        status: req.body.status
    }, {
        where: { id: req.params.id }
    }).then(job => {
        res.status(201).send({
            status: 1,
            msg: 'updated',
            data: job
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

exports.delete = (req, res) => {
    let { ids } = req.body;
    if (!ids.length) {
        req.status(200).send({
            status: 0,
            msg: 'no ids for delete'
        });
        return;
    }


    Job.destroy({
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
            'description': 'Can not access jobs table',
            'error': err
        });
    });
};

exports.status = (req, res) => {
    Job.findOne({
        attributes: ['status'],
        where: {
            UUID: req.body.uuid
        }
    })
    .then(job => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: job.status
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access jobs table',
            'error': err.msg
        });
    });
};

exports.editStatus = async (req, res) => {
    try {
        const { id } = req.params;
        let uuid;
        const job = await Job.findOne({
            where: {
                id
            }
        });
        if (job) {
            uuid = job.UUID;
            res.json({
                uuid
            });
            // await fetch(`http://144.217.38.20:8110/status?execId=${uuid}`)
            //     .then(rez => rez.json())
            //     .then(async json => {
            //         const newJob = await Job.update({
            //             status: json.status
            //         }, {
            //             where: { id }
            //         })
            //         res.json({
            //             newJob
            //         })
            //     });
        }
    } catch (error) {
        res.status(501).json({
            error
        });
    }
    
};