const Products = require('../mongoModels/ProductsModel');
const idnProducts = require('../mongoModels/idnProductsModel');
const Helpers = require('../classes/helpers');

exports.getAll = async (req, res) => {
    try {
        let info = await Helpers.getRemoteInfo(req);        
        if (info.host == 'http://idn.beta.lessplatform.com' || info.host == 'http://test.beta.lessplatform.com') {
            let page = req.query.page ? Math.max(0, req.query.page*1) : Math.max(0, 1);
            let perPage = req.query.limit ? req.query.limit*1 : 10;        
            idnProducts.find().sort('_id').limit(perPage).skip(perPage * (page - 1))
                .then(async (product) => {
                let ct = await idnProducts.count();
                console.log(ct);
                    res.json({
                        status: 1,
                        msg: 'ok',
                        data: {
                            products: product,
                            total: ct
                        }
                    });
                });
        } else {
            let page = req.query.page ? Math.max(0, req.query.page*1) : Math.max(0, 1);
            let perPage = req.query.limit ? req.query.limit*1 : 10;        
            Products.find().sort('_id').limit(perPage).skip(perPage * (page - 1))
                .then(async (product) => {
                let ct = await Products.count();
                console.log(ct);
                    res.json({
                        status: 1,
                        msg: 'ok',
                        data: {
                            products: product,
                            total: ct
                        }
                    });
                });
        }
    } catch (error) {
        res.json({error});
    }
};

exports.getOne = async (req, res) => {
    try {
        let productId = req.params.id;
        let info = Helpers.getRemoteInfo(req);
        if (info.host == 'http://idn.beta.lessplatform.com' || info.host == 'http://test.beta.lessplatform.com') {
            const product = await idnProducts.findOne({
                ID: productId
            });
            res.json({
                status: 1,
                msg: 'ok',
                data: product
            });
        } else {
            const product = await Products.findOne({
                ID: productId
            });
            res.json({
                status: 1,
                msg: 'ok',
                data: product
            });
        }
    } catch (error) {
        res.json({error, msg: 'such product doesn\'t exist'});
    }
};


/************* Test */
const H = require('../classes/helpers');
exports.ProductTest = async (req, res) => {
    let page = req.query.page ? Math.max(0, req.query.page*1) : Math.max(0, 1);
        let perPage = req.query.limit ? req.query.limit*1 : 10;
        Products.find().limit(perPage).skip(perPage * page)
            .then(async (product) => {
                H.packSizeParserForLegacy(product);
                res.json({
                    status: 1,
                    msg: 'ok',
                    data: product
                });
            });
};