const db = require('../config/db.config.js');
const { NorderAttrb } = require('../classes/joinColumns.js');
const Helper = require('../classes/helpers.js');
const Equipment = db.equipment;
const seq = db.sequelize;

exports.addOrderFromLoadError = async (data) => {
    const { load, order } = data;
    let msg = "ok", error = false;
    // if (load.flowType != order.rows[0].flowType) {
    //     error = true;
    //     msg = "Flow types of orders and load must be the same.";
    // }
    const loadEqType = await Equipment.findOne({
        where: {
            id: load.equipmentId
        }
    });
    const orderEqType = await Equipment.findOne({
        where: {
            id: order.rows[0].eqType
        }
    });
    // if (loadEqType.eqType != orderEqType.eqType || loadEqType.eqType != 'Multi') {
    //     res.status(500).json({
    //         msg: "Load Equipment Type not Multi or Equipment Types are different",
    //         status: 0
    //     });
    // }
    
    if (load.flowType == 2 && order.rows[0].depoid && load.depoId != order.rows[0].depoid) {
        error  = true;
        msg = "All orders in the load must have the same depot.";
    }
    return {
        error,
        msg
    };
};

exports.manualLoadTempErrors = async (data) => {
    let { orders, flowType, depoId } = data;
    let error = false, msg = "ok";
    if (!flowType) {
        error = true;
        msg = "flowtype is required";
    }
    if (!orders) {
        error = true;
        msg = "orders is required";
    }
    if (flowType && (flowType == 1 || flowType == 2) && !depoId) {
        error = true;
        msg = "depoId is required";
    }
    if ((flowType || depoId) && orders) {
        let tables = ["orders", "Customers", "statuses", "transporttypes", "consignees"];
        let query = await Helper.createSelectQueryWithJoin5(tables, orders, NorderAttrb);
        const ordersArr = await seq.query(query, { type: seq.QueryTypes.SELECT });
        for (const order of ordersArr) {
            // if (flowType != order.flowType) {
            //     error = true;
            //     msg = "All orders in the load must have the same flowTypes.";
            // }
            if (depoId != order.depoid) {
                error = true;
                msg = "All orders in the load must have the same depot.";
            }
        }
    }
    return {
        error,
        msg
    };
};
