const Helpers = require('../classes/helpers');
const db = require('../config/db.config.js');
const Menu = db.menu;

exports.getall = async (req, res) => {

    let sortAndPagination = await Helpers.sortAndPagination(req);
    let where = {};

    Menu.findAndCountAll({
        where: where,
        ...sortAndPagination
    })
    .then(Menus => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                Menus: Menus.rows,
                total: Menus.count
            }
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access Menus table',
            'error': err
        });
    });
};

exports.get = (req, res) => {
    var id = req.params.id;

    Menu.findOne({
        where: {
            id: id
        }
    })
    .then(menu => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: menu
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access Menu table',
            'error': err.msg
        });
    });
};

exports.create = (req, res) => {
    
     Menu.create({
           title: req.body.title,
           isfixed: req.body.isfixed,
           index: req.body.index,
           url: req.body.url
    }).then(menu => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: menu
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};
exports.edit = (req, res) => {
    Menu.update({
        title: req.body.title,
        isfixed: req.body.isfixed,
        index: req.body.index,
        url: req.body.url
    }, {
        where: { id: req.params.id }
    }).then(menu => {
        res.status(201).send({
            status: 1,
            msg: 'updated',
            data: menu
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


    Menu.destroy({
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
            'description': 'Can not access Menu table',
            'error': err
        });
    });
};