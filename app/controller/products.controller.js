const db = require("../config/db.config.js");
// const Helpers = require("../classes/helpers");
const ProductClass = require("../classes/product");
const Errors = require("../errors/productErrors");
const Products = db.product;
// const Op = db.Sequelize.Op;

// const includeFalse = [{ all: true, nested: false }];

exports.getAll = async (req, res) => {
    try {
        let cl = new ProductClass({data: req}), products;
        products = await cl.getAll();
        if (products.status) {
            let productArr = [];
            for (const product of products.data.rows) {
                productArr.push({
                    Brand: product.brandname,
                    Class: product.class,
                    ID: product.ID,
                    sku: product.sku,
                    Manufacturer: product.manufacturernumber,
                    Name: product.name,
                    Notes: product.notes,
                    PackSize: product.packsize,
                    Unit: product.unit,
                    Weight: product.weight,
                    _id: product._id,
                    width: product.width,
                    height: product.height,
                    length: product.length
                });
            }
            res.json({
                status: 1,
                msg: "ok",
                data: {
                    products: productArr,
                    total: products.data.count
                },
            });
        } else {
            res.status(409).json({
                status: products.status,
                msg: products.msg
            });
        }
    } catch (error) {
        res.json({error});
    }
};

exports.getOne = async (req, res) => {
    try {
        let cl = new ProductClass({data: req.params});
        let product;
        product = await cl.getOne();
        if (product.status) {
            res.json({
                status: product.status,
                msg: product.msg,
                data: {
                    Brand: product.data.brandname,
                    Class: product.data.class,
                    ID: product.data.ID,
                    sku: product.data.sku,
                    Manufacturer: product.data.manufacturernumber,
                    Name: product.data.name,
                    Notes: product.data.notes,
                    PackSize: product.data.packsize,
                    Unit: product.data.unit,
                    Weight: product.data.weight,
                    _id: product.data._id,
                    width: product.data.width,
                    height: product.data.height,
                    length: product.data.length
                }
            });
        } else {
            res.status(409).json({
                status: product.status,
                msg: product.msg
            });
        }
        
    } catch (error) {
        res.json({error, msg: "such product doesn\"t exist"});
    }
};

exports.create = async (req, res) => {
    try {
        const errors = await Errors.createAndEditError(req.body);
        if (!errors.status) {
            res.status(409).send({
                status: errors.status,
                msg: errors.msg
            });
        } else {
            let product;
            let cl = new ProductClass({data: req.body});
            product = await cl.create();
            if (product) {
                res.json({
                    status: 1,
                    msg: "ok",
                    data: product
                });
            } else {
                res.status(409).json({
                    status: product.status,
                    msg: product.msg,
                });
            }
        }
    } catch (error) {
        res.status(409).json({error, msg: "no product created"});
    }
};

exports.createByApiKey = async (req, res) => {
    try {
        const errors = await Errors.createAndEditError(req.body);
        if (!errors.status) {
            res.status(409).send({
                status: errors.status,
                msg: errors.msg
            });
        } else {
            let newProduct, product;
            let cl = new ProductClass({data: req.body});
            product = await cl.getByID();
            if (product.status) {
                newProduct = await cl.edit();
            } else {
                newProduct = await cl.create();
            }
            if (newProduct) {
                res.json({
                    status: 1,
                    msg: "ok",
                    data: newProduct
                });
            } else {
                res.status(409).json({
                    status: newProduct.status,
                    msg: newProduct.msg,
                });
            }
            
        }
    } catch (error) {
        res.status(409).json({error, msg: "no product created"});
    }
};

exports.edit = async (req, res) => {
    try {
        const errors = await Errors.createAndEditError(req.body, true);
        if (!errors.status) {
            res.status(409).send({
                status: errors.status,
                msg: errors.msg
            });
        } else {
            let product, data = {
                ...req.body,
                id: req.params.id
            };
            let cl = new ProductClass({data});
            product = await cl.edit();
            if (product) {
                res.json(product);
            } else {
                res.status(409).json({
                    status: 0,
                    msg: "Error",
                });
            }
        }
    } catch (error) {
        res.status(409).json({error, msg: "no product created"});
    }
};

exports.delete = async (req, res) => {
    try {
        let cl = new ProductClass({data: req.body});
        let delProduct = await cl.delete();
        if (delProduct.status) {
            res.json(delProduct);
        } else {
            res.status(409).json({
                msg: delProduct.msg,
                status: delProduct.status
            });
        }
    } catch (error) {
        res.status(409).json({error, msg: "no product deleted"});
    }
};

/************* Test */
const H = require("../classes/helpers");
exports.ProductTest = async (req, res) => {
    let page = req.query.page ? Math.max(0, req.query.page*1) : Math.max(0, 1);
        let perPage = req.query.limit ? req.query.limit*1 : 10;
        Products.find().limit(perPage).skip(perPage * page)
            .then(async (product) => {
                H.packSizeParserForLegacy(product);
                res.json({
                    status: 1,
                    msg: "ok",
                    data: product
                });
            });
};