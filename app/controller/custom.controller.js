const osrm = require('../controller/osmap.controller');
const db = require('../config/db.config.js');
const Helper = require('../classes/helpers');
const seq = db.sequelize;

exports.getProducts = async (req, res) => {
    try {
        let query = await Helper.selectQueryProducts();
        
        let data = await seq.query(query, { type: seq.QueryTypes.SELECT });
        res.json(data);
    } catch (error) {
        res.json({
            error
        });
    }
};