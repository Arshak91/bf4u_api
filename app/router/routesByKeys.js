const verifySignUp = require('./verifySignUp');
const authJwt = require('./verifyJwtToken');

module.exports = app => {
    const productController = require('../mongoControllers/ProductsController.js');
    const publicLoadsController = require('../mongoControllers/PublicLoadsController.js');
    const loads_controller = require('../controller/loads.controller.js');
    const consignees_controller = require('../controller/consignees.controller');
    const handling_type = require('../controller/handling_type.controller.js');
    const piecetypes = require('../controller/piecetypes.controller');
    const orders_controller = require('../controller/orderscontroller.js');
    const orders_middleware = require('../middlewares/order.js');
    const product_controller = require('../controller/products.controller.js');
    const depos_controller = require('../controller/depos.controller.js');
    const upload_controller = require('../controller/upload.controller');

    const loadboards_controller = require('../controller/loadboards.controller.js');
    const capacityboards_controller = require('../controller/capacityboards.controller.js');


    /***************************************************************** */
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        res.header("Access-Control-Allow-Headers", "timezone, x-access-token, Origin, Content-Type, Accept");
        next();
    });

    app.get('/apis/v1/*', [authJwt.verifyKey], (req, res, next) => {
        next();
    });
    app.post('/apis/v1/*', [authJwt.verifyKey], (req, res, next) => {
        next();
    });
    app.put('/apis/v1/*', [authJwt.verifyKey], (req, res, next) => {
        next();
    });
    app.delete('/apis/v1/*', [authJwt.verifyKey], (req, res, next) => {
        next();
    });

    // Flatbed
    app.post('/apis/v1/loadboards', loadboards_controller.createAPI);
    app.post('/apis/v1/capacityboards', capacityboards_controller.createAPI);
    // app.post('/apis/v1/flatbed/loadboards', loadboards_controller.createAPI);
    // app.post('/apis/v1/flatbed/capacityboards', capacityboards_controller.createAPI);

    // Loads
    app.get('/apis/v1/loads', loads_controller.getall, loads_controller.getAllByFields);

    // Consignee
    app.get('/apis/v1/consignees', consignees_controller.getAll);
    app.post('/apis/v1/consignees', consignees_controller.create);
    app.put('/apis/v1/consignees/:id', consignees_controller.edit);

    // HandlingType
    app.get('/apis/v1/handlingtypes', handling_type.getall);

    // PieceTypes
    app.get('/apis/v1/piecetypes', piecetypes.getall);

    // Order
    app.post('/apis/v1/orders', orders_middleware.createOrEdit);

    // Products
    app.get('/apis/v1/products', product_controller.getAll);
    app.post('/apis/v1/products', product_controller.createByApiKey);

    // Depo
    app.get('/apis/v1/depos', depos_controller.getall);

    // Uploads
    app.put('/apis/v1/uploads', upload_controller.edit);
};
