const db = require('../config/db.config.js');
const HandlingUnit = db.handlingUnit;
const Image = db.image;
const Items = db.item;
const Op = db.Sequelize.Op;
const Order = db.order;


let includes = [{model: Image,  attributes: ['id', 'image_url']}];

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


    HandlingUnit.findAndCountAll({
        where: where,
        include:includes,
        order: orderArr,
        offset,
        limit
    })
    .then(handlingunits => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: {
                handlingunits: handlingunits.rows,
                total: handlingunits.count
            }
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access Handling Unit table',
            'error': err
        });
    });
};

exports.get = (req, res) => {
    var id = req.params.id;

    HandlingUnit.findOne({
        where: {
            id: id
        },
        include: [Image, Items]
    })
    .then(handlingunit => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: handlingunit
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access HandlingUnit table',
            'error': err.msg
        });
    });
};

exports.create = (req, res) => {
    // console.log(" ------" + req.body);




    HandlingUnit.create({

        HanlingTypeId: req.body.HandlingTypeId,
        Orders_id: req.body.Orders_id,

        Quantity: req.body.Quantity,
        Weight: req.body.Weight,
        Lenght: req.body.Lenght,
        Width: req.body.Width,
        Height: req.body.Height,
        density: req.body.Density,

        Options: req.body.Options

    }).then(handlingunit => {
        res.status(201).send({
            status: 1,
            msg: 'created',
            data: handlingunit
        });
    }).catch(err => {
        res.status(500).send({ status: 0, msg: err.message, err: err, data: req.body });
    });
};

exports.edit = (req, res) => {
    HandlingUnit.update({

        HanlingTypeId: req.body.HandlingTypeId,
        Quantity: req.body.Quantity,
        Weight: req.body.Weight,
        Lenght: req.body.Lenght,
        Width: req.body.Width,
        Height: req.body.Height,
        density: req.body.Density,
        Options: req.body.Options

    }, {
        where: { id: req.params.id }
    }).then(handlingunit => {
        res.status(201).send({
            status: 1,
            msg: 'updated',
            data: handlingunit
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

    HandlingUnit.destroy({
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
            'description': 'Can not access Handling Unit table',
            'error': err
        });
    });
};


//-------------------------------------------------------------------------------
/*

 // Image.belongsTo(HandlingUnit, { foreignKey: 'HandlingUnits_id'});
 // HandlingUnit.hasMany(Image, { foreignKey: 'HandlingUnits_id'});

 */
exports.scripts = async (req, res) => {
    const orders = await Order.findAll({});
    let unit, arr = [];
    for (const order of orders) {
        unit = await HandlingUnit.create({
            orders_id: order.id,
            HandlingType_id: 15,
            Quantity: 1,
            piecetype_id: 50,
            productdescription: '1EO',
            freightclasses_id: null,
            nmfcnumber: null,
            nmfcsubcode: null,
            Weight: 22000,
            Length: 5,
            Width: 5,
            Height: 5,
            mintemperature: 0,
            maxtemperature: 20,
            stackable: 0,
            turnable: 0,
            hazmat: 0,
            density: 6,
            options: null,
            volume: 3000,
            sku: 1,
            brand: 'new',
            specialneeds: 0
        });
        console.log(unit.id);
        arr.push(unit.id);
    }
    res.json({
        arr,
        status: 1
    });
};
