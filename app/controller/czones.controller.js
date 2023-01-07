const Helpers = require('../classes/helpers');
const ClassCZones = require('../classes/czones');
exports.create = async (req, res) => {
    let data = req.body;
    let checkError = Helpers.checkErrors({...req.body}), ClZone, newZones;
    if (!checkError) {
        return res.status(409).json({
            status: 0,
            msg: "Invalid data"
        });
    }
    ClZone = new ClassCZones({data});
    newZones = await ClZone.create();
    res.json({
        status: 1,
        data: newZones
    });
};

exports.edit = async (req, res) => {
    let data = { ...req.body, id: req.params.id};
    let checkError = await Helpers.checkErrors({...req.body}), ClZone, newZones;
    if (!checkError) {
        return res.status(409).json({
            status: 0,
            msg: "Invalid data"
        });
    }
    ClZone = new ClassCZones({data});
    newZones = await ClZone.edit();
    res.json({
        status: 1,
        data: newZones
    });
};

exports.getAll = async (req, res) => {
    let cl = new ClassCZones({data: req}), czones;
    czones = await cl.getAll();
    if (czones.status) {
        res.json({
            status: czones.status,
            msg: czones.msg,
            data: {
                czones: czones.data.rows,
                total: czones.data.count
            },
        });
    } else {
        res.status(409).json({
            status: 0,
            msg: "Invalid Data",
            data: {},
        });
    }
};

exports.getOne = async (req, res) => {
    try {
        let cl = new ClassCZones({data: req.params});
        let czones;
        czones = await cl.getOne();
        if (czones.status) {
            res.json({
                status: czones.status,
                msg: czones.msg,
                data: czones.data
            });
        } else {
            res.status(409).json({
                status: czones.status,
                msg: czones.msg
            });
        }
        
    } catch (error) {
        res.status(409).json({error, msg: 'such product doesn\'t exist'});
    }
};

exports.delete = async (req, res) => {
    try {
        let cl = new ClassCZones({data: req.body});
        let delCZone = await cl.delete();
        if (delCZone.status) {
            res.json(delCZone);
        } else {
            res.status(409).json({
                msg: delCZone.msg,
                status: delCZone.status
            });
        }
    } catch (error) {
        res.status(409).json({error, msg: 'no product deleted'});
    }
};