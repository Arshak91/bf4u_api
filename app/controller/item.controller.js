const db = require('../config/db.config.js');
const Item = db.item;

exports.getall = (req, res) => {

    const orderBy = req.query.orderBy;
    delete req.query.orderBy;
    const order = req.query.order ? req.query.order : 'desc';
    delete req.query.order;
    const orderArr = [];

    if (orderBy) {
        orderArr.push([orderBy, order]);
    }
    
    const page = req.query.page ? parseInt(req.query.page) : 1;
    delete req.query.page;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    delete req.query.limit;
    const offset = (page - 1) * limit;
    let where = {};

    Item.findAndCountAll({
        where: where,
        order: orderArr,
        offset,
        limit
    }).then(items => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                items: items.rows,
                total: items.count
            }
        })
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access Handling Unit table',
            'error': err
        });
    });
};

exports.get = (req, res) => {
    var id = req.params.id;

    Item.findOne({
        where: {
            id: id
        }
    })
    .then(item => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: item
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access Items table',
            'error': err.msg
        });
    });
};

exports.create = (req, res) => {
    
    Item.create({
        Handling_Unit_id: req.body.Handling_Unit_id,
        HandlingTypes_id: req.body.HandlingTypes_id, 
        Quantity: req.body.Quantity,
        Weight: req.body.Weight,
        Length: req.body.Length,
        Width: req.body.Width,
        Height: req.body.Height,
        NMFC_number: req.body.NMFC_number,
        NMFC_Sub_code: req.body.NMFC_Sub_code,
        freightclasses_id: req.body.freightclasses_id,
        Product_Description: req.body.Product_Description
        /*
        {
            "Handling_Unit_id": 2,
            "HandlingTypes_id": 1, 
            "Quantity": 1,
            "Weight": 10,
            "Length": 10,
            "Width": 10,
            "Height": 10,
            "NMFC_number": 555,
            "NMFC_Sub_code": 22,
            "Freight_Class": 55,
            "Product_Description": "some test desc."
        }
        
        */
        
    }).then(item => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: item
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

exports.edit = (req, res) => {
    Item.update({
        Handling_Unit_id: req.body.Handling_Unit_id,
        HandlingTypes_id: req.body.HandlingTypes_id, 
        Quantity: req.body.Quantity,
        Weight: req.body.Weight,
        Length: req.body.Length,
        Width: req.body.Width,
        Height: req.body.Height,
        NMFC_number: req.body.NMFC_number,
        NMFC_Sub_code: req.body.NMFC_Sub_code,
        freightclasses_id: req.body.freightclasses_id,
        Product_Description: req.body.Product_Description
    }, {
        where: { id: req.params.id }
    }).then(item => {
        res.status(201).send({
            status: 1,
            msg: 'updated',
            data: item
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


    Item.destroy({
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