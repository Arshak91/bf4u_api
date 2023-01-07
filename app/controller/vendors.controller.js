const db = require("../config/db.config.js");
const Helper = require("../classes/helpers");
const Osmap = require("./osmap.controller");
const Errors = require("../errors/vendorErrors");
const Search = require("../lib/search");

const Op = db.Sequelize.Op;
const Vendors = db.vendors;

exports.get = async (req, res) => {

    let id = req.params.id;
    Vendors.findOne({
        where: { id:id },
    }).then(vendors => {
        
        res.status(200).send({
            status: 1,
            msg: "ok", 
            data: vendors
        });

    }).catch(err => {

        res.status(500).send({
            status: 0,
            msg: err,
            data:req.params
        });        
    });
    


};

exports.getAll = async (req, res) => {

    let sortAndPagination = await Helper.sortAndPagination(req);
    let where = req.query, { text } = req.query, search;
    delete where.text;
    search = text ? await Search.searchVendor(text) : {};
    const data = await Helper.filters(where, Op);

    Vendors.findAndCountAll({
        where: {
            ...data.where,
            ...search
        },
        ...sortAndPagination
    })
    .then( vendors => {
        res.status(200).send({
            status: 1,
            msg: "ok",
            data: {
                vendors: vendors.rows,
                total: vendors.count
            }
        });
    }).catch(err => {
        res.status(500).send({
            status: 0,
            msg: "Can not access vendors table",
            err: err
        });
    });
        
};

exports.delete = async (req, res) => {
   
    let ids = req.body.ids; 
    if (!ids || ids.length == 0 ) {
        res.status(500).send({
            status: 0,
            msg: "no ids for delete"
        });
        return;
    }
    
    Vendors.destroy({
        where: {
            id: {
                [Op.in]: ids
            }
        }
    }).then(count => {

        res.status(200).send({
            status: 1,
            msg: "deleted",
            "Count": count, 
        });

    }).catch(err => {
        
        res.status(500).send({ 
            status: 0,
            msg: "fail on Vendors table",
            "error": err
        });
    });
    
};

exports.create = async (req, res) => {
    let obj = {
		...req.body,
		id: 1
	};
    const errors = await Errors.createAndEditError(obj);
    if (!errors.status) {
        res.status(409).send({
            status: errors.status,
            msg: errors.msg
        });
	} else {
        let { points } = errors;
        let stime =  req.body.serviceTime ? req.body.serviceTime*60 :0 ;
        if(isNaN(stime) ){stime=0;}
        await Vendors.create({
            name: req.body.name, 
            companyLegalName: req.body.companyLegalName, 
            email: req.body.email,
            address: req.body.address,
            address2: req.body.address2,
            phone1: req.body.phone1,
            phone2: req.body.phone2,
            contactPerson: req.body.contactPerson,
            points: points,
            notes: req.body.notes,
            serviceTime: stime,
        }).then( iresp => {
            res.status(200).send({
                status: 1,
                msg: "OK",
                data: iresp
            });
        }).catch(err => {
            res.status(409).send({
                status: 0,
                msg: err.original.sqlMessage,
                "Error": err
            });
        });
    }
};

exports.edit = async (req, res) => {
    let obj = {
        ...req.body,
        ...req.params
    };
    const errors = await Errors.createAndEditError(obj);
    if (!errors.status) {
        res.status(409).send({
            status: errors.status,
            msg: errors.msg
        });
	} else {
        let { points } = errors;
        let stime =  req.body.serviceTime ? req.body.serviceTime*60 :0 ;
        if(isNaN(stime) ){stime=0;}
        Vendors.update({
            name: req.body.name, 
            companyLegalName: req.body.companyLegalName, 
            email: req.body.email,
            address: req.body.address,
            address2: req.body.address2,
            phone1: req.body.phone1,
            phone2: req.body.phone2,
            contactPerson: req.body.contactPerson,
            points: points,
            notes: req.body.notes,
            serviceTime: stime,

        }, {
            where: { id: req.params.id }
        }).then( uresp => {
                res.status(200).send({
                    status: 1,
                    msg: "OK",
                    "updated": uresp
                });
        }).catch(err => {
            res.status(409).send({
                status: 0,
                msg: err.original.sqlMessage,
                "Error": err
            });
        });
    }
};

exports.script = async (req, res) => {
    const vendors = await Vendors.findAll({});
    let lat, lon;
    for (const vendor of vendors) {
        let points = [];
        for (const point of vendor.points) {
            let address = `${point.address.zip}+${point.address.city}+${point.address.streetAddress}+${point.address.state}`;
            const { data } = await Osmap.GeoLoc(address);
            lat = data.results[0].geometry.location.lat;
            lon = data.results[0].geometry.location.lng;
            point.address.lat = lat;
            point.address.lon = lon;
            points.push(point);
        }
        await Vendors.update({
            points
        },{
            where: {
                id: vendor.id
            }
        });
    }
    res.json({
        msg: "ok",
        status: 1
    });
};
