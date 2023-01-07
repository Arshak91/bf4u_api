const env = process.env.SERVER == 'local' ? require('./env.local.js') : require('./env.js');
// const env = require('./env.js');
const Sequelize = require('sequelize');
const sequelize = new Sequelize(env.database, env.username, env.password, {
  host: env.host,
  // port: 3308,
  connectionLimit : 1000,
  dialect: env.dialect,
  operatorsAliases: 0,

  pool: {
    max: env.pool.max,
    min: env.pool.min,
    acquire: env.pool.acquire,
    idle: env.pool.idle
  },
  define: {
    charset: 'utf8',
    collate: 'utf8_general_ci'
  },
  logging: false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
// users roles
db.user = require('../model/user.model.js')(sequelize, Sequelize);
db.role = require('../model/role.model.js')(sequelize, Sequelize);
db.user_role = require('../model/user_role.model.js')(sequelize, Sequelize);
db.user_types = require('../model/user_types.model.js')(sequelize, Sequelize);
// Orders
db.order = require('../model/order.model.js')(sequelize, Sequelize);
// Loads
db.load = require('../model/load.model.js')(sequelize, Sequelize);
db.loaddriver = require('../model/load.model.js')(sequelize, Sequelize);

db.loadRoute = require('../model/load-route.model.js')(sequelize, Sequelize);
db.loadTemp = require('../model/load_temp.model.js')(sequelize, Sequelize);
// Jobs (Plan)
db.job = require('../model/job.model.js')(sequelize, Sequelize);
// Driver
db.driver = require('../model/driver.model.js')(sequelize, Sequelize);
db.driverLoad = require('../model/driver.model.js')(sequelize, Sequelize);
// Depo
db.depo = require('../model/depo.model.js')(sequelize, Sequelize);
// customer / shipper / broker
db.customer = require('../model/customer.model.js')(sequelize, Sequelize);
// equipment
db.truck = require('../model/truck.model.js')(sequelize, Sequelize);
db.tractor = require('../model/tractor.model.js')(sequelize, Sequelize);
db.equipment = require('../model/equipment.model.js')(sequelize, Sequelize);
db.companyequipment = require('../model/company-equipment.model.js')(sequelize,Sequelize);
db.carrierEquipment = require('../model/carrier-equipment.model.js')(sequelize, Sequelize);
// Shift , HOS
db.shift = require('../model/shift.model.js')(sequelize, Sequelize);
// Carrier
db.carrier = require('../model/carrier.model.js')(sequelize, Sequelize);
db.carrierAddress = require('../model/carrier-address.model.js')(sequelize, Sequelize);
db.carrierService = require('../model/carrier-services.model.js')(sequelize, Sequelize);
// Handling Unit , Product
db.handlingUnit = require('../model/handling_unit.model.js')(sequelize, Sequelize);
db.handlingType = require('../model/handling_type.model.js')(sequelize, Sequelize);
db.item = require('../model/item.model.js')(sequelize, Sequelize);
db.image = require('../model/image.model')(sequelize, Sequelize);
db.piecetypes = require('../model/piecetypes.model')(sequelize, Sequelize);
db.product = require('../model/product.model.js')(sequelize, Sequelize);
db.freightclasses = require('../model/freightclasses.model')(sequelize, Sequelize);
db.classifiers = require('../model/classifiers.model.js')(sequelize, Sequelize);
db.consignee = require('../model/consignee.model.js')(sequelize, Sequelize);
db.vendors = require('../model/vendor.model')(sequelize, Sequelize);
db.czones = require('../model/czones.model')(sequelize, Sequelize);
db.files = require('../model/files.model')(sequelize, Sequelize);
//  // Location Type
db.locationtype = require('../model/locationType.model')(sequelize, Sequelize);
PickupLocatioinType = db.locationtype;
DeliveryLocationType = db.locationtype;
// // Accessorials
db.accessorials = require('../model/accessorials.model')(sequelize, Sequelize);
PickupAccessorials = db.accessorials;
DeliveryAccessorials = db.accessorials;
// Configs
db.config = require('../model/config.model.js')(sequelize, Sequelize);
// statuses
db.status = require('../model/status.model.js')(sequelize, Sequelize);
// Payments and invoces
db.additionalTransfers = require('../model/additional_transfers.model.js')(sequelize, Sequelize);
db.settlements = require('../model/settlements.model.js')(sequelize, Sequelize);
db.currencies = require('../model/currencies.model.js')(sequelize, Sequelize);
// // Events
db.events = require('../model/event.model.js')(sequelize, Sequelize);
// // FlowTypes
db.flowTypes = require('../model/flowtype.model.js')(sequelize,Sequelize);
// // Menu
db.menu  = require('../model/menu.model.js')(sequelize, Sequelize);
// // Pallet
db.pallet = require('../model/pallet.model.js')(sequelize, Sequelize);
// // Permissions
db.permissions = require('../model/permissions.model')(sequelize, Sequelize);
// // Transport Type
db.transporrttype = require('../model/transporttype.model')(sequelize, Sequelize);
// // Special Needs
db.specialneeds = require('../model/specialneed.model')(sequelize,Sequelize);
// //  Schedule
db.schedules = require('../model/schedule.model')(sequelize, Sequelize);
// // Settings
db.settings = require('../model/settings.model')(sequelize, Sequelize);
db.appSettings = require('../model/global_settings')(sequelize, Sequelize);
// // consignees
db.consignee = require('../model/consignee.model')(sequelize, Sequelize);
// // Vendoes
db.vendors = require('../model/vendor.model')(sequelize, Sequelize);
// // Uploads
db.uploads = require('../model/uploads.model')(sequelize, Sequelize);
// Notifications
db.notification = require('../model/notifications.model')(sequelize, Sequelize);
db.notificationSettings = require('../model/notification_settings')(sequelize, Sequelize);
db.notificationTemplates = require('../model/notification_template')(sequelize, Sequelize);
//// ******************************************************************************************************************** ////
db.permissionGroup = require('../model/permission_group.model')(sequelize, Sequelize);

// JOINS //
///
// Users roles
db.role.belongsToMany( db.user, { through: 'user_roles', foreignKey: 'roleId', otherKey: 'userId'});
db.user.belongsToMany( db.role, { through: 'user_roles', foreignKey: 'userId', otherKey: 'roleId'});

// // carrier
db.carrier.hasMany(db.driver, {foreignKey: 'carrierId'});
db.carrier.hasMany(db.depo, {foreignKey: 'carrierId'});
// // customer
db.customer.hasMany(db.depo, {foreignKey: 'customerId'});
// // Order
db.order.hasMany(db.handlingUnit, { foreignKey: 'orders_id' });
db.order.hasOne(db.depo, { foreignKey: 'id', sourceKey: 'depoid', as: 'depo' });
db.order.hasOne(db.consignee, { foreignKey: 'id', sourceKey: 'consigneeid', as: 'consignee' });
db.order.hasOne(db.vendors, { foreignKey: 'id', sourceKey: 'vendorid', as: 'vendor' });
db.order.hasOne(PickupLocatioinType,  { foreignKey: 'id', sourceKey: 'pickupLocationtypeid' , as: "pickupLocationtype" });
db.order.hasOne(DeliveryLocationType, { foreignKey: 'id', sourceKey: 'deliveryLocationtypeid', as: "deliverylocationtype" });
db.order.hasOne(PickupAccessorials,  { foreignKey: 'id', sourceKey: 'pickupAccessorials', as: 'pAccessorials' }); // Accesorials join
db.order.hasOne(DeliveryAccessorials, { foreignKey: 'id', sourceKey: 'deliveryAccessorials', as: 'dAccessorials' }); // Accesorials join
//db.order.hasOne( db.customer, { foreignKey: 'id', sourceKey: 'customerid', as: 'customer' });
db.order.hasOne(db.status, { foreignKey: 'id', sourceKey: 'status' , as: 'Status' });
db.order.hasOne(db.transporrttype, { foreignKey: 'id', sourceKey: 'loadtype' , as: 'Loadtype' });
db.order.hasOne(db.specialneeds, { foreignKey: 'id', sourceKey: 'specialneeds' , as: 'Specialneeds' });
// // loads
db.load.hasOne(db.carrier, { foreignKey: 'id', sourceKey: 'carrierId' });
db.load.hasOne(db.driver, { foreignKey: 'id', sourceKey: 'driverId' });
db.load.hasOne(db.depo, { foreignKey: 'id', sourceKey: 'depoId' });
db.load.hasOne(db.equipment, { foreignKey: 'id', sourceKey: 'equipmentId'} );
db.load.hasOne(db.companyequipment, { foreignKey: 'id', sourceKey: 'assetsId' });
db.load.hasOne(db.loadRoute, { foreignKey: 'loadId', sourceKey: 'id', as: 'route' });
db.load.hasMany(db.events, { foreignKey:'loads_id' });
db.load.hasOne(db.status, { foreignKey: 'id', sourceKey:'status' , as: 'Status' });
db.load.hasOne(db.shift, { foreignKey: 'id', sourceKey:'shiftId' , as: 'shift' });
// // load temps
db.loadTemp.hasOne(db.carrier, { foreignKey: 'id', sourceKey: 'carrierId' });
db.loadTemp.hasOne(db.driver, { foreignKey: 'id', sourceKey: 'driverId' });
db.loadTemp.hasOne(db.depo, { foreignKey: 'id', sourceKey: 'depoId' });
db.loadTemp.hasOne(db.equipment, { foreignKey: 'id', sourceKey: 'equipmentId' });
db.loadTemp.hasOne(db.companyequipment, { foreignKey: 'id', sourceKey: 'assetsId' });
db.loadTemp.hasOne(db.shift, { foreignKey: 'id', sourceKey: 'shiftId' });
//  // Handling Unit
db.handlingUnit.belongsTo( db.order, { foreignKey: 'orders_id'} );
db.handlingUnit.hasOne( db.handlingType , { foreignKey: 'id'} );
db.handlingUnit.hasMany( db.item , { foreignKey: 'Handling_Unit_id'} );
db.handlingUnit.hasMany(db.image, { foreignKey: 'HandlingUnits_id'});
// // Items
db.item.belongsTo( db.handlingUnit, { foreignKey: 'Handling_Unit_id'} );
db.item.hasOne(  db.handlingType, { foreignKey: 'id'});
// // Images
db.image.belongsTo(db.handlingUnit, { foreignKey: 'HandlingUnits_id'});
// // Piecetype
// db.piecetype.belongsTo(db.handlingUnit, { foreignKey: 'freightclasses_id'});
// // Drivers
db.driver.hasOne(db.carrier, { foreignKey: 'id', sourceKey: 'carrierId' } );
db.driver.hasOne(db.shift, { foreignKey: 'id', sourceKey: 'shiftId' } );
db.driver.hasOne(db.schedules, {foreignKey: 'id', sourceKey: 'scheduleid'});
db.driver.hasOne(db.companyequipment, {foreignKey: 'id', sourceKey: 'assetId'});

db.driverLoad.hasOne(db.carrier, { foreignKey: 'id', sourceKey: 'carrierId' } );
db.driverLoad.hasOne(db.shift, { foreignKey: 'id', sourceKey: 'shiftId' } );
db.driverLoad.hasOne(db.schedules, {foreignKey: 'id', sourceKey: 'scheduleid'});
db.driverLoad.hasMany(db.loaddriver , {foreignKey:'driverId'});
db.driverLoad.hasOne(db.companyequipment , {foreignKey:'id', sourceKey: 'assetId'});

// // Carrier
db.carrier.hasMany(db.companyequipment, { foreignKey: 'companyId' });
db.carrier.hasMany(db.carrierAddress, { foreignKey:'carrierId', sourceKey: 'id' } );
// // Address
// // Company Equipment
db.companyequipment.hasOne(db.equipment, {foreignKey: 'id', sourceKey: 'equipmentId'});
db.companyequipment.hasOne(db.depo, {foreignKey:'id', sourceKey: 'depoid'});
// db.carrierAddress.belongsTo( db.carrier, { foreignKey: 'id' } );
// // Consignee
db.consignee.hasOne(db.driver, {foreignKey: 'id', sourceKey: 'driverId'});
db.consignee.hasOne(db.czones, {foreignKey: 'id', sourceKey: 'czone_id'});
db.consignee.hasOne(db.depo, {foreignKey: 'id', sourceKey: 'depo_id'});
/*************************************************************************************************************** */
module.exports = db;
