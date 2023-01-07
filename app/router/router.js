const verifySignUp = require("./verifySignUp");
const authJwt = require("./verifyJwtToken");

module.exports = function(app) {
    // Auth
    const auth_controller = require("../controller/auth.controller.js");
    const orders_controller = require("../controller/orderscontroller.js");
    // const gmap_controller = require("../controller/gmapcontroller.js");
    const customers_controller = require("../controller/customer.controller.js");
    const trucks_controller = require("../controller/truck.controller");
    const carriers_controller = require("../controller/carriers.controller.js");
    const load_temps_controller = require("../controller/load_temps.controller.js");
    const loads_controller = require("../controller/loads.controller.js");
    const jobs_controller = require("../controller/jobs.controller.js");
    const tractors_controller = require("../controller/tractors.controller.js");
    const shifts_controller = require("../controller/shifts.controller.js");

    const loadboards_controller = require("../controller/loadboards.controller.js");
    const capacityboards_controller = require("../controller/capacityboards.controller.js");

    const carrier_addresses_controller = require("../controller/carrier-addresses.controller.js");
    const carrier_equipments_controller = require("../controller/carrier-equipments.controller.js");
    const carrier_services_controller = require("../controller/carrier-services.controller.js");
    const company_equipments_controller = require("../controller/company-equipment.controller.js");

    const equipments_controller = require("../controller/equipments.controller.js");
    const statuses_controller = require("../controller/statuses.controller.js");

    const math_controller = require("../controller/math.controller.js");

    const drivers_controller = require("../controller/drivers.controller.js");
    const depos_controller = require("../controller/depos.controller.js");

    const handling_unit = require("../controller/handling_unit.controller.js");
    const handling_type = require("../controller/handling_type.controller.js");
    const item = require("../controller/item.controller.js");

    const locationtype = require("../controller/locationType.controller");
    const accessorials = require("../controller/accessorial.lcontlroller");
    const piecetypes = require("../controller/piecetypes.controller");
    const freightclasses = require("../controller/freightclasses.contlroller");
    const configs_controller = require("../controller/configs.controller.js");

    const invoices_controller = require("../controller/invoices.controller.js");
    const settlements_controller = require("../controller/settlements.controller.js");
    const bols_controller = require("../controller/bols.controller.js");
    const files_controller = require("../controller/files.controller.js");

    const geocode_controller = require("../controller/osmap.controller.js");

    const images_controller = require("../controller/images.controller.js");

    const _settlements_temp = require("../controller/_settlements_temp.controller.js");
    const currencies_controller = require("../controller/currencies_controller.js");
    const events_controller = require("../controller/evets.controller.js");

    const markers_controller = require("../controller/marker.controller");
    const flowtypes = require("../controller/flowtypes.controller");
    const menu = require("../controller/menu.controller");
    const pallet_controller = require("../controller/pallet.controller");
    const transporttypes = require("../controller/transporttype.controller");
    const specialneeds = require("../controller/specialneeds.controller");
    const schedules = require("../controller/schedule.controller");
    const consignees_controller = require("../controller/consignees.controller");
    const vendors_controller = require("../controller/vendors.controller");
    const settings_controller = require("../controller/settings.controller");
    const product_controller = require("../controller/products.controller.js");
    const product_custom_controller = require("../controller/custom.controller");
    const dashboard_controller = require("../controller/dashboard.controller");
    const upload_controller = require("../controller/upload.controller");
    const czones_controller = require("../controller/czones.controller");
    const contact_controller = require("../controller/contact.us.controller");
    const notification_controller = require("../controller/notification.controller");
    const notification_template_controller = require("../controller/notification.template.controller");
    const notification_settings_controller = require("../controller/notification_settings.controller");
    const permissions_controller = require('../controller/permissions.controller');
    const users_controller = require('../controller/user.controller');
    const proof_controller = require("../controller/proof.controller");
    const general_controller = require('../controller/general');
    const app_settongs_controller = require('../controller/appSettings.controller');
    const fs = require('fs');

    /****************************************************************************************************************************** */

    /** permission checking */
    const Permissions = require('../middlewares/permission');
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        res.header("Access-Control-Allow-Headers", "timezone, x-access-token, Origin, Content-Type, Accept");
        next();
    });

    app.post("/auth/signup", [verifySignUp.checkDuplicateUserNameOrEmail, verifySignUp.checkRolesExisted], auth_controller.signup);
    app.post("/auth/signin", auth_controller.signin);

    app.get('/api/*', [authJwt.verifyToken], [Permissions.checkPermission], (req, res, next) => {
        next();
    });
    app.put("/api/*", [authJwt.verifyToken], (req, res, next) => {
        next();
    });
    app.post("/api/*", [authJwt.verifyToken], (req, res, next) => {
        next();
    });
    app.delete("/api/*", [authJwt.verifyToken], (req, res, next) => {
        next();
    });

    // socket test

    app.post('/api/socketTest', auth_controller.testSocket)


    //
    // auth
    // app.post("/api/auth/signup", [verifySignUp.checkDuplicateUserNameOrEmail, verifySignUp.checkRolesExisted], auth_controller.signup);
    app.post("/api/auth/changepassword", auth_controller.changePassword);//
    app.post("/api/signout", auth_controller.logOut);

    // // // // // // // / // // // // // // // // // //
    // test //
    app.get("/api/test/user", [authJwt.verifyToken], auth_controller.userContent);
    app.get("/api/test/pm", [authJwt.verifyToken, authJwt.isPmOrAdmin], auth_controller.managementBoard);
    app.get("/api/test/admin", [authJwt.verifyToken, authJwt.isAdmin], auth_controller.adminBoard);
    app.get("/api/test", (req, res) => {
        res.status(201).send({ test: "test" });
    });
    // test end //
    // // /// /// // / // / // / // / / // / /  / // / / 
    
    // _settlements_temp

    app.get('/api/getFile/:file', getImage);

    async function getImage(req, res) {
        const Helper = require('../classes/helpers');
        let path;
        // TODO: auth check

        path = await Helper.getFilePaths('0/images/proof', 'signature_1619527868929_1502_44186_.png', undefined);
        if (path) {
            return res.send({ url: path });
        
        } else {
          res.status(500).send({ status: 0 });
        }
    }


    app.get("/api/settlements_temp/loads/:id/:datefrom/:dateto", _settlements_temp.loads);
    app.get("/api/settlements_temp/classifiers/:filter", _settlements_temp.getClassifiers);
    app.post("/api/settlements_temp/classifiers/:filter", _settlements_temp.setClassifier);
    app.put("/api/settlements_temp/classifiers/:id", _settlements_temp.editClassifiers);
    app.post("/api/settlements_temp/additinaltransfers", _settlements_temp.createAdditionalTransfer);
    app.get("/api/settlements_temp/additinaltransfers/:driverId", _settlements_temp.getAdditionalTransfers);
    app.put("/api/settlements_temp/additinaltransfers/:id", _settlements_temp.editAdditionalTransfer);

    app.post("/api/settlements_temp/settlements", _settlements_temp.createSettlement);
    app.get("/api/settlements_temp/settlements/:driverId", _settlements_temp.getSettlements);
    
    
    // // Currencies
    app.get("/api/currencies/:id", currencies_controller.get);
    app.get("/api/currencies", currencies_controller.getall);
    app.post("/api/currencies", currencies_controller.create);
    app.put("/api/currencies/:id", currencies_controller.edit);
    app.delete("/api/currencies", currencies_controller.delete);

    // // end _settlements_temp

    // -----------------------------------------------------------------------------------------------
    // generate csv file


    // // orders
    // app.get("/api/orders/getautoplan", orders_controller.getAutoPlan );
    app.get("/api/orders/getAutoPlan", orders_controller.getAutoPlan );
    // app.get("/orders/getautoplan", orders_controller.getAutoPlan );
    app.post("/api/orders/count", orders_controller.getAutoplanCount);
    app.get("/orders/getAutoPlan", orders_controller.getAutoPlan );
    app.get("/api/orders/byids/sortedbydeliverydate/:ids", orders_controller.byidssortedbydeliverydate);
    // app.get("/api/orders/byids/:ids", orders_controller.byids);
    app.get("/orders/byids/:ids", orders_controller.byids);
    app.get("/api/orders/byidsandcoordswithoutfillcoords/:ids", orders_controller.byIdsAndCoords);
    app.post("/api/orders/byidsandcoordswithoutfillcoords", orders_controller.byIdsAndCoordsMany);
    app.get("/api/orders/byidsandcoords/:ids", orders_controller.byIdsAndCoordsFillCoords);
    app.get("/api/orders/plannedunplanned/:filter", orders_controller.plannedunplanned);
    app.get("/api/orders/freezedunfreezed/:filter", orders_controller.freezedunfreezed);
    app.get("/api/orders/statusfilter/:filter", orders_controller.statusfilter);
    app.post("/api/orders/distance", orders_controller.distance);
    app.post("/api/orders/eta/:id", orders_controller.setETA);

    app.get("/api/orders/:id", orders_controller.get);
    app.get("/api/orders", orders_controller.getall);
    app.get("/api/order/loads", orders_controller.getLoads);
    app.delete("/api/orders", orders_controller.delete);
    app.post("/api/orders", orders_controller.create);
    app.put("/api/orders/:id", orders_controller.edit);
    app.put("/api/orders-bulk-edit", orders_controller.bulkEdit);
    app.put("/api/all/orders", orders_controller.editAll);
    // app.post("/api/orders/planunplan/:id", orders_controller.planunplan);
    // Change Order status
    app.post("/api/orders/changestatus/:id", orders_controller.changeonwaystatus);

    app.get("/images/:file", [orders_controller.image], files_controller.get);
    app.post("/api/orders/send/file", orders_controller.orderUpload);
    app.get("/api/orders/get/status", orders_controller.getUploadOrdersStatus);
    app.put("/api/order/unplan", orders_controller.orderUnPlan);
    // Orders Upload
    app.post("/api/orders/upload", orders_controller.upload);

    // // Images
    app.get("/api/images/:file", images_controller.get);
    app.post("/api/images", images_controller.upload);

    // // Invoices
    app.get("/api/invoices/:orderId", invoices_controller.get);
    app.get("/api/invoices/pdf/:file", [invoices_controller.file], files_controller.get);

    // // Settlements
    app.get("/api/settlements/:loadId", settlements_controller.get);
    app.get("/api/settlements/pdf/:file", [settlements_controller.file], files_controller.get);
    app.get("/api/settlements/driver/:id", settlements_controller.getDriverSettlement);

    // // BOL
    app.get("/api/bols/:orderId", bols_controller.get);
    app.get("/api/bols/pdf/:file", [bols_controller.file], files_controller.get);

    // // Files
    app.get("/api/files/:file", files_controller.get);
    app.get("/api/files/download/:file", files_controller.download);
    
    // // temp
    

    // // Carriers
    app.get("/api/carriers/names", carriers_controller.getNamesByIds);
    app.get("/api/carriers/withparams/forcarrier/:id", carriers_controller.getWithParamsForCarrier);

    app.get("/api/carriers/actives", carriers_controller.getAllActives);
    app.get("/api/carriers/:id", carriers_controller.get);
    app.get("/api/carriers", carriers_controller.getall);
    app.delete("/api/carriers", carriers_controller.delete);
    app.post("/api/carriers", carriers_controller.create);
    app.put("/api/carriers/:id", carriers_controller.edit);

    // // Customers
    app.get("/api/customers/names", customers_controller.getNamesByIds);
    app.get("/api/customers/:id", customers_controller.get);
    app.get("/api/customers", customers_controller.getall);
    app.post("/api/customers", customers_controller.create);
    app.put("/api/customers/:id", customers_controller.edit);
    app.delete("/api/customers", customers_controller.delete);

    // // Carrier Addresses
    app.get("/api/carrieraddresses/:id", carrier_addresses_controller.get);
    app.get("/api/carrieraddresses", carrier_addresses_controller.getall);
    app.post("/api/carrieraddresses", carrier_addresses_controller.create);
    app.delete("/api/carrieraddresses", carrier_addresses_controller.delete);

    // // Carrier Equipments
    app.get("/api/carrierequipments/forcarrier/:id", carrier_equipments_controller.getAllForCarrier);
    app.get("/api/carrierequipments/forplanning/:carrierid", carrier_equipments_controller.getCarrierEquipments);
    app.get("/api/carrierequipments/:id", carrier_equipments_controller.get);
    app.get("/api/carrierequipments", carrier_equipments_controller.getall);
    app.post("/api/carrierequipments", carrier_equipments_controller.create);
    app.put("/api/carrierequipments/:id", carrier_equipments_controller.edit);
    app.delete("/api/carrierequipments", carrier_equipments_controller.delete);

    // // Company Equipment
    app.get("/api/companyEquipment/with/type", company_equipments_controller.getallWithOrWithoutTrailer);
    app.get("/api/companyequipment/:id", company_equipments_controller.get);
    app.get("/api/companyEquipment/gp/:field", company_equipments_controller.getall);
    app.get("/api/companyequipment", company_equipments_controller.getall);
    app.post("/api/companyequipment", company_equipments_controller.create);
    app.put("/api/companyequipment/:id", company_equipments_controller.edit);
    app.delete("/api/companyequipment", company_equipments_controller.delete);

    // // Carrier Services
    app.get("/api/carrierservices/:id", carrier_services_controller.get);
    app.get("/api/carrierservices", carrier_services_controller.getall);
    app.post("/api/carrierservices", carrier_services_controller.create);
    app.put("/api/carrierservices/:d", carrier_services_controller.edit);
    app.delete("/api/carrierservices", carrier_services_controller.delete);

    // // Configs
    app.get("/api/configs/:id", configs_controller.get);
    app.get("/api/configs", configs_controller.getall);
    app.post("/api/configs", configs_controller.create);
    app.put("/api/configs", configs_controller.edit);
    app.delete("/api/configs", configs_controller.delete);

    // // Trucks
    app.get("/api/trucks", trucks_controller.getall);
    app.post("/api/trucks", trucks_controller.create);
    app.delete("/api/trucks", trucks_controller.delete);
    app.get("/api/trucks/capacities", trucks_controller.getCapacities);

    // // Equipments
    app.get("/api/equipments/forfilter", equipments_controller.getAllForFilter);
    app.get("/api/equipments/eqtype/forselect/:type", equipments_controller.getEquipmentsByeqTypeForSelect);
    app.get("/api/equipments/:id", equipments_controller.get);
    app.get("/api/equipments", equipments_controller.getall);
    app.post("/api/equipments", equipments_controller.create);
    app.put("/api/equipments/:id", equipments_controller.edit);
    app.delete("/api/equipments", equipments_controller.delete);
    app.get("/api/equipments/capacities", equipments_controller.getCapacities);
    app.get("/api/equipments/type/:type", equipments_controller.getallByType);
    app.get("/api/equipments/eqtype/:type", equipments_controller.getEquipmentsByeqType);

    // // Statuses
    app.get("/api/statuses/:id", statuses_controller.get);
    app.get("/api/statuses", statuses_controller.getall);
    app.get("/api/load/statuses", statuses_controller.getLoadStatuses);
    app.get("/api/order/statuses", statuses_controller.getOrderStatuses);
    app.get("/api/load/warnning", statuses_controller.getLoadWarnning);
    app.get("/api/order/warnning", statuses_controller.getOrderWarnning);
    app.post("/api/statuses", statuses_controller.create);
    app.put("/api/statuses/:id", statuses_controller.edit);
    app.delete("/api/statuses", statuses_controller.delete);


    // // Trailers
    app.get("/api/trailers/:id", trucks_controller.get);
    app.get("/api/trailers", trucks_controller.getall);
    app.post("/api/trailers", trucks_controller.create);
    app.put("/api/trailers", trucks_controller.edit);
    app.delete("/api/trailers", trucks_controller.delete);
    app.get("/api/trailers/capacities", trucks_controller.getCapacities);

    // // Tractors
    app.get("/api/tractors/:id", tractors_controller.get);
    app.get("/api/tractors", tractors_controller.getall);
    app.post("/api/tractors", tractors_controller.create);
    app.put("/api/tractors/:id", tractors_controller.edit);
    app.delete("/api/tractors", tractors_controller.delete);

    // // Shift
    app.get("/api/shifts/:id", shifts_controller.get);
    app.get("/api/shifts", shifts_controller.getall);
    app.post("/api/shifts", shifts_controller.create);
    app.put("/api/shifts/:id", shifts_controller.edit);
    app.delete("/api/shifts", shifts_controller.delete);

    // -----------
    // gmap
    // app.get("/api/gmap/longlat", gmap_controller.getlonglat);
    // app.get("/api/gmap/distancematrix", gmap_controller.getDistance);
    // app.get("/api/gmap/distancestimes", gmap_controller.getDistancesTimes);
    // ------------

    // // LoadBoard
    app.post("/api/loadboards/publish/loads", loadboards_controller.publishLoads);
    app.post("/api/loadboards/publish/orders", loadboards_controller.publishOrders);
    app.post("/api/loadboards", loadboards_controller.create);
    app.put("/api/loadboards/:id", loadboards_controller.edit);
    app.delete("/api/loadboards/:id", loadboards_controller.delete);
    app.get("/api/loadboards/publics/:ids", loadboards_controller.getByIds);
    app.get("/api/loadboards/publics", loadboards_controller.getAll);
    app.get("/api/loadboards/:id", loadboards_controller.getOne);
    
    
    app.post("/api/capacityboards/publish/loads", capacityboards_controller.publishLoads);
    app.post("/api/capacityboards/publish/orders", capacityboards_controller.publishOrders);
    app.post("/api/capacityboards", capacityboards_controller.create);
    app.put("/api/capacityboards/:id", capacityboards_controller.edit);
    app.delete("/api/capacityboards/:id", capacityboards_controller.delete);
    app.get("/api/capacityboards/publics", capacityboards_controller.getAll);
    
    app.post("/api/math/execute/loadboards", math_controller.executeLoadBoards);
    app.post("/api/math/execute/capacityboards", math_controller.executeCapacityBoards);
    


    // app.post("/api/loadboards/engine/orders", loadboards_controller.ordersForEngine);
    app.get("/loadboards/engine/orders", loadboards_controller.ordersForEngine);
    app.get("/capacityboards/engine/orders", capacityboards_controller.ordersForEngine);
    

    // // Loads
    app.post("/api/updateassignrates", loads_controller.assignrates);

    // // Loads
    app.delete("/api/loads/dissolve/:id", loads_controller.dissolve);
    app.post("/api/loads/dissolvemany", loads_controller.dissolveMany);
    app.get("/api/loads/newordersforload", loads_controller.newordersforload);
    app.get("/api/loads/:id", loads_controller.get);
    app.get("/api/loads", loads_controller.getall);
    // app.post("/api/loads/create", loads_controller.createapi);
    app.post("/api/loads", loads_controller.create);
    //app.put("/api/loads/:id", trucks_controller.edit);
    app.delete("/api/loads", loads_controller.delete);
    // app.post("/api/loads/changestatus/:id", loads_controller.changeStatus);
                   //     Load Start
    app.post("/api/loads/changestatus/:id", loads_controller.changeOnWayStatus);
    app.post("/api/loads/changestatus", loads_controller.changeonwaystatus);
    app.post("/api/exports/loads", loads_controller.getExportsLoads);

    app.post("/api/loads/updateordersordering", loads_controller.updateOrdersOrdering);
    app.post("/api/loads/removeorderfromload", loads_controller.removeOrderFromLoad);

    app.post("/api/loads/setroute/:id", loads_controller.setLoadRoute);
    app.put("/api/loads/:id", loads_controller.edit);
    app.post("/api/loads/driver/finish", loads_controller.finished);
    app.post("/api/loads/finish/confirm", loads_controller.confirmFinish);

    // app.get("/api/loads/dispatch/:id", loads_controller.dispatch);
    app.post("/api/loads/dispatchMany", loads_controller.dispatch);
    app.put('/api/load/bulkedit', loads_controller.bulkEdit);
    app.get("/dispatches/pdf/:file", [loads_controller.file], files_controller.get);
    app.get('/setLoadOrderDatas', loads_controller.setLoadOrderDatas)

    // // load_temp
    app.get("/api/loadtemps/:id", load_temps_controller.get);
    app.get("/api/loadtemps", load_temps_controller.getall);
    app.get("/api/updated/loadtemps", load_temps_controller.getUpdatedLoadTemps);
    app.put("/api/loadtemps/:id", load_temps_controller.edit);

    //  // Manual Plan
    app.post("/api/loadtemps", load_temps_controller.create);
    app.delete("/api/loadtemps", load_temps_controller.delete);
    app.post("/api/loadtemps/updateordersordering", load_temps_controller.updateOrdersOrdering);
    app.post("/api/loadtemps/removeOrderFromLoadTemp", load_temps_controller.removeOrderFromLoadTemp);
    app.post("/api/loadtemps/addorderfromload", load_temps_controller.addOrderFromLoad);
    app.post("/api/loadtemps/moveorderloadtoload", load_temps_controller.moveOrderLoadToLoad);
    app.put("/api/loadtemps/map/remorderfromload", load_temps_controller.remOrderfromLoadInMap);
    app.put("/api/loadtemps/addorderinload/map", load_temps_controller.addOrderInLoadOnMap);
    app.put("/api/loadtemps/multi/addorderinload/map", load_temps_controller.addMultiOrdersInLoadOnMap);
    app.delete("/api/loadtemps/dissolve/:id", load_temps_controller.dissolve);
    app.post("/api/loadtemps/dissolvemany", load_temps_controller.dissolveMany);
    // app.post("/api/loadtemps/freez", load_temps_controller.freezLoad);
    // app.post("/api/loadtemps/unfreez", load_temps_controller.unfreezLoad);
    app.post("/api/loadtemps/confirm/:id", load_temps_controller.confirm);
    app.post("/api/loadtemps/confirmmany", load_temps_controller.confirmMany);
    app.put("/api/loadtemps/edit/sequences", load_temps_controller.sequences);
    app.post("/api/exports/planning", load_temps_controller.getExportsLoadTemps);
    // app.post("/api/autoplan", load_temps_controller.creatTempLoads);
    app.post("/autoplan", load_temps_controller.creatTempLoads);
    app.post("/loadtemps/sequence", load_temps_controller.planningSequence);

    app.post("/api/proof/approve", proof_controller.approve)

    // // jobs (plan)
    app.get("/api/jobs/status", jobs_controller.status);
    app.get("/api/jobs/:id", jobs_controller.get);
    app.get("/api/jobs", jobs_controller.getall);
    app.put("/api/jobs/:id", jobs_controller.edit);
    app.post("/api/jobs", jobs_controller.create);
    app.delete("/api/jobs", jobs_controller.delete);
    app.put("/api/jobs/status/:id", jobs_controller.editStatus);

    // // drivers
    app.get("/api/drivers/byname/:name", drivers_controller.getAllByNameFiltered);
    // get loads with blocks for Calendar 
    app.get("/api/drivers/blocks", drivers_controller.getBlocks); 
    app.get("/api/drivers/daily/blocks", drivers_controller.getDailyBlocks); 
    app.get("/api/drivers/:id", drivers_controller.get);
    app.get("/api/drivers", drivers_controller.getall);
    
    app.put("/api/drivers/:id", drivers_controller.edit);
    app.post("/api/drivers", drivers_controller.create);
    app.post("/api/drivers-quick", drivers_controller.quickCreate);
    app.delete("/api/drivers", drivers_controller.delete);
    app.post("/api/driver/user", drivers_controller.createUser);
    
    // Loads for Driver // Mobile
    app.get("/api/driver/loads", loads_controller.getByDriverId);
    app.put("/api/driver/lastLocation", loads_controller.updateLastLocation);
    app.put("/api/driver/loadsETA", loads_controller.updateETA);
    
    //  users

    app.get('/api/admin/getUsersList', users_controller.getUserListForAdmin);

    //user management

    app.post('/api/userManagement', users_controller.create);
    app.put('/api/userManagement/:id', users_controller.update);
    app.get('/api/userManagement', users_controller.getList);
    app.delete('/api/userManagement', users_controller.delete);

    // // depos
    app.get("/api/depots/customer/:id", depos_controller.getByUserId);
    app.get("/api/depots/customer", depos_controller.getByUser);

    app.get("/api/depos/:id", depos_controller.get);
    app.get("/api/depos", depos_controller.getall);

    app.put("/api/depos/:id", depos_controller.edit);
    app.post("/api/depos", depos_controller.create);
    app.delete("/api/depos", depos_controller.delete);

    // // Handling unit
    app.get("/api/handlingunits", handling_unit.getall);
    app.get("/api/handlingunits/:id", handling_unit.get);
    app.put("/api/handlingunits/:id", handling_unit.edit);
    app.post("/api/handlingunits/", handling_unit.create);
    app.delete("/api/handlingunits", handling_unit.delete);

    // // Handling Types
    app.get("/api/handlingtypes", handling_type.getall);
    app.get("/api/handlingtypes/:id", handling_type.get);
    app.put("/api/handlingtypes/:id", handling_type.edit);
    app.post("/api/handlingtypes", handling_type.create);
    app.delete("/api/handlingtypes", handling_type.delete);

    app.get("/api/items", item.getall);
    app.get("/api/items/:id", item.get);
    app.post("/api/items/", item.create);
    app.put("/api/items/:id", item.edit);

    // // Location types
    app.get("/api/locationtypes", locationtype.getall);

    // // Accessorials types
    app.get("/api/accessorials", accessorials.getall);

    // // Flowtypes
    app.get("/api/flowtypes", flowtypes.getall);
    app.get("/api/flowtypes/:id", flowtypes.get);
    app.post("/api/flowtypes/", flowtypes.create);
    app.put("/api/flowtypes/:id", flowtypes.edit);

    // // Piecetypes
    app.get("/api/piecetypes", piecetypes.getall);

    // // Freightclasses
    app.get("/api/freightclasses", freightclasses.getall);

    
    // // Math Execute
    app.get("/api/math/report/:action/:pid", math_controller.mathReport);
    app.post("/api/math/execute", math_controller.execute);
    app.post("/api/math/executetime", math_controller.executeTime);
    app.post("/api/math/executeinstance", math_controller.executeInstance);

    // // Menu
    app.get("/api/menu", menu.getall);
    app.get("/api/menu/:id", menu.get);
    app.post("/api/menu/", menu.create);
    app.put("/api/menu/:id", menu.edit);

    // // Geocode
    app.get("/api/geocode", geocode_controller.GeoCode);

    // // Events
    app.post("/api/events", events_controller.create);
    app.put("/api/events/:id", events_controller.create);
    app.get("/api/events", events_controller.getAll);
    app.get("/api/events/:id", events_controller.getById);

    app.get("/main-marker", markers_controller.getMainMarker);
    app.get("/marker", markers_controller.getMarker);
    app.get("/unplanned-marker", markers_controller.getUnplannedMarker);
    app.get("/planned-marker", markers_controller.getPlannedMarker);
    app.get("/event-marker", markers_controller.getEventMarker);
    app.get("/delivery-truck-marker", markers_controller.getDeliveryTruckMarker);
    app.get("/depot-marker", markers_controller.getDepotMarker);

    // // Pallet
    app.get("/api/pallets", pallet_controller.getAll);
    app.get("/api/pallets/:id", pallet_controller.get);
    app.post("/api/pallets", pallet_controller.create);
    app.put("/api/pallets/:id", pallet_controller.edit);

    // // Transport Type
    app.get("/api/ttypes", transporttypes.getAll);
    app.get("/api/ttypes/:id", transporttypes.get);
    app.post("/api/ttypes", transporttypes.create);
    app.put("/api/ttypes/:id", transporttypes.edit);

    
    // // Special Needs
    app.get("/api/specials", specialneeds.getAll);
    app.get("/api/specials/:id", specialneeds.get);
    app.post("/api/specials", specialneeds.create);
    app.put("/api/specials/:id", specialneeds.edit);

    // // Schedule
    app.get("/api/schedule/:id", schedules.get);
    app.post("/api/LoadTemps", load_temps_controller.getLoadsBy);
    app.get("/api/LoadWithDuration/:id", loads_controller.loadWithDur);

    // // Consignees
    app.get("/api/consignees/:id", consignees_controller.get);
    app.get("/api/consignees", consignees_controller.getAll);
    app.post("/api/consignees", consignees_controller.create);
    app.put("/api/consignees/:id", consignees_controller.edit);
    app.put("/api/consignee/driver", consignees_controller.editDriver);
    app.put("/api/consignee/zones", consignees_controller.editZones);
    app.put("/api/consignee/depos", consignees_controller.editDepos);
    app.delete("/api/consignees", consignees_controller.delete);

    // // Vendor
    app.get("/api/vendors/:id", vendors_controller.get);
    app.get("/api/vendors", vendors_controller.getAll);
    app.post("/api/vendors", vendors_controller.create);
    app.put("/api/vendors/:id", vendors_controller.edit);
    app.delete("/api/vendors", vendors_controller.delete);

    // global data
    
    app.get('/api/general', general_controller.getGeneralData);

    // // Settings
    app.get("/api/settings/userId", settings_controller.get);
    app.get("/api/settings", settings_controller.getAll);
    app.post("/api/settings", settings_controller.create);
    app.put("/api/settings", settings_controller.edit);
    app.delete("/api/settings", settings_controller.delete);

    // // Products
    app.get("/api/sql/products", product_controller.getAll);
    app.get("/api/sql/products/:productId", product_controller.getOne);
    app.post("/api/sql/products", product_controller.create);
    app.put("/api/sql/products/:id", product_controller.edit);
    app.delete("/api/sql/products", product_controller.delete);

    // // Uploads
    app.get("/api/uploads", upload_controller.getAll);
    app.get("/api/upload/:id", upload_controller.getOne);
    app.get("/api/upload/uuid/:UUID", upload_controller.getOne);
    app.post("/api/uploads", upload_controller.create);
    app.put("/api/uploads", upload_controller.edit);
    app.delete("/api/uploads", upload_controller.delete);

    // // CZones
    app.get("/api/czones", czones_controller.getAll);
    app.get("/api/czones/:czoneId", czones_controller.getOne);
    app.post("/api/czones", czones_controller.create);
    app.put("/api/czone/:id", czones_controller.edit);
    app.delete("/api/czone", czones_controller.delete);

    // Dashboard
    app.get("/api/dashboard", dashboard_controller.getAll);

    // SOLO
    app.post("/solo/sequence", loads_controller.mobileSequence);
    app.post("/solo/calculation", loads_controller.mobileCalc);

    // Contact us

    app.post("/api/sendContactUsRequest", contact_controller.sendContactUsEmail);

    app.put("/api/notification/seen", notification_controller.seen);
    app.post("/api/notification/delete", notification_controller.delete);
    app.get("/api/notification/getList", notification_controller.getList);
    app.get("/api/notification/setAllNotificationSeen", notification_controller.setAllNotificationSeen);
    app.get("/api/notification/:id", notification_controller.getById);


    app.get("/api/notificationTemplate", notification_template_controller.getList);
    app.get("/api/notificationTemplate/getById/:id", notification_template_controller.getById);
    app.post("/api/notificationTemplate", notification_template_controller.create);
    app.put("/api/notificationTemplate/:id", notification_template_controller.update);

    app.get('/api/notificationSettings', notification_settings_controller.getById);
    app.put('/api/notificationSettings', notification_settings_controller.update);

    app.post('/permissions/create', permissions_controller.create);
    app.post('/permissions/createGroup', permissions_controller.createGroup);
    app.get('/permissions/getGroupsList', permissions_controller.getGroupsList);
    app.get('/permissions/getList', permissions_controller.getList);


    const updateGlobalSettings = async (req, res) => {
        const AppSettings = require('../classes/appSettings');
        const inst = new AppSettings();
        const { exchangeRate, defaultServiceTime, pieceTime, apiConfig, timezone, metricSystem, proofDefault, Currency, defaultCurrency } = body;
        const body = {
            exchangeRate: 'vfeve',
            defaultServiceTime: 420,
            pieceTime: 30,
            apiConfig: {leafletRouteUrl: "http://map.lessplatform.com/route/v1"},
            timezone: null,
            metricSystem: null,
            proofDefault: {photos: 1, signature: 1},
            Currency: {b: 98},
            defaultCurrency: 'fefefe'
        };
        const result = await inst.update(body);
        res.send(result);
    }
    app.put('/api/global/settings', [Permissions.checkPermission],  app_settongs_controller.update);

    // script for edit stopLocations in Load
    // app.post("/readFile", consignees_controller.readFile);
    // app.get("/editLoads", loads_controller.editscript);
    // app.get("/logoutUsers", auth_controller.logOutScript);
    // app.get("/addStops", loads_controller.addStopsScript);
    // app.get("/vendorlatlons", vendors_controller.script);
    // app.get("/consigneelatlons", consignees_controller.script);

    // app.get("/order/script", orders_controller.scriptLatLon);
    // app.get("/order/script/cube", orders_controller.scriptEditCube);
    // app.get("/order/script/address", orders_controller.scriptAddress);
    // app.get("/product/custom", product_custom_controller.getProducts);

    // app.get("/driverCreate/script", drivers_controller.registrationScript);
    // app.get("/updateOrderTimeWindow/script", orders_controller.scriptUpdateTimeWindows);
    // app.get("/script/create/cloneOrder", orders_controller.scriptCreateOrder);
    // app.get("/script/updateOrder", orders_controller.scriptUpdateOrderAddr);
    app.get("/consignee/pointsUpdate", consignees_controller.scriptUpdatePoints);
};
