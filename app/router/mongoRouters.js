const verifySignUp = require('./verifySignUp');
const authJwt = require('./verifyJwtToken');

module.exports = app => {
    const productController = require('../mongoControllers/ProductsController.js');
    const publicLoadsController = require('../mongoControllers/PublicLoadsController.js');
    const planningController = require('../mongoControllers/PlanningController.js');
    const apiKeyController = require('../mongoControllers/ApiKeyController.js');


    /***************************************************************** */
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        res.header("Access-Control-Allow-Headers", "timezone, x-access-token, Origin, Content-Type, Accept");
        next();
    });

    app.get('/api/*', [authJwt.verifyToken], (req, res, next) => {
        next();
    });
    app.put('/api/*', [authJwt.verifyToken], (req, res, next) => {
        next();
    });
    app.post('/api/*', [authJwt.verifyToken], (req, res, next) => {
        next();
    });
    app.delete('/api/*', [authJwt.verifyToken], (req, res, next) => {
        next();
    });


    app.post('/autoplan/flatbed', planningController.createPlannings);
    app.get('/api/plannings', planningController.getAll);


    app.get('/api/products', productController.getAll);
    app.get('/api/products/:id', productController.getOne);

    app.get('/api/publicloads', publicLoadsController.getAll);
    app.get('/api/publicloads/:id', publicLoadsController.getOne);

    app.post('/apikey', apiKeyController.create);
    app.put('/apikey/:id', apiKeyController.edit);
    app.get('/apikey/:id', apiKeyController.getOne);
    app.get('/apikey', apiKeyController.getAll);
    app.delete('/apikey/:id', apiKeyController.deleteKey);

    /**Test**/
    app.get('/api/ptest', productController.ProductTest);
};
