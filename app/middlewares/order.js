const db = require('../config/db.config.js');
const orderController = require('../controller/orderscontroller');
const Order = db.order;
const HandlingUnit = db.handlingUnit;


exports.createOrEdit = async (req, res) => {
    try {
        let item = req.body.orders[0], order;
        order = await Order.findOne({ where: {po: item.po}});
        if (order) {
            await HandlingUnit.destroy({ where: {orders_id: order.dataValues.id}}).catch(err => {
                console.log('handling remove error', err);
            });
            req.body = item;
            req.params.id = order.dataValues.id;
            return await orderController.uploadEdit(req, res);
        } else {
            return await orderController.uploadCreate(req, res);
        }
    } catch (error) {
        console.log('createOrEdit', error.message);
        res.status(409).json({ status: 0, msg: "catch error order create or edit"});
    }
};