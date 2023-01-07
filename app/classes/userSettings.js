const db = require("../config/db.config.js");
const Helpers = require("../classes/helpers");
const Op = db.Sequelize.Op;
const sequelize = db.sequelize;
const Settings = db.settings;
const PermissionGroup = db.permissionGroup;
const Permissions = db.permissions;
const OrderController = require('../controller/orderscontroller');
const ErrorMessagesService = require('./errors');
const includeFalse = [{ all: true, nested: false }];


const attributes = [
    "id",
    "userId",
    "userType",
    "exchangeRate",
    "units",
    "Currency",
    "defaultCurrency",
    "defaultServiceTime",
    "orders",
    "loads",
    "loadTemps",
    "drivers",
    "pieceTime",
    "apiConfigs",
    "durationMultiplier",
    "fileHeaders",
    "IterationMultiplier",
    "createdAt",
    "updatedAt",
    "enableNotifications",
    "proofDefault"
];

module.exports = class UserSettingsService {
    Currency;
    IterationMultiplier;
    apiConfigs;
    createdAt;
    defaultCurrency;
    defaultServiceTime;
    drivers;
    durationMultiplier;
    enableNotifications;
    exchangeRate;
    fileHeaders;
    id;
    loadTemps = null;
    loads = null;
    orders = null;
    pieceTime;
    proofDefault;
    units;
    updatedAt;
    userId;
    userPermission;
    userPermissionName;
    userType;

    create = async (user, body) => {
        const { exchangeRate, units, Currency, defaultCurrency, defaultServiceTime, pieceTime, orders, loads, loadTemps, drivers, apiConfigs, autoplan } = body;
        const settings = await Settings.create({
            userId: user.id,
            exchangeRate: exchangeRate,
            units: units,
            Currency: Currency,
            defaultCurrency: defaultCurrency,
            defaultServiceTime: defaultServiceTime,
            pieceTime: pieceTime,
            orders: orders,
            loads: loads,
            loadTemps: loadTemps,
            drivers: drivers,
            apiConfigs: apiConfigs,
            autoplan: autoplan
        });
        return Helpers.getResponse(1, "created", settings);
    };

    getByUserId = async (user) => {
        const userId = user.id;
        const settings = await Settings.findOne({
            attributes,
            where: {
                userId
            }
        });

        if (!settings) return Helpers.getResponse(0, ErrorMessagesService.wrong('user', 'id'));
        const permissionGroup = await PermissionGroup.findOne({ where: { id: user.permissionId } });

        if (permissionGroup) {
            const perms = await Permissions.findAll({ where: { id: { [Op.in]: permissionGroup.dataValues.permissions } } });
            settings.dataValues.userPermission = permissionGroup.dataValues.permissions;
            settings.dataValues.permissions = perms.map(x => x.dataValues.enum);
            settings.dataValues.userPermissionName = permissionGroup.dataValues.name;
        }

        return Helpers.getResponse(1, 'ok', settings.dataValues);
    };

    update = async (user, body) => {
        const { id } = user;
        const { defaultServiceTime, pieceTime, updateAll } = body;
        const settings = await Settings.update(body, {
            where: {
                userId: id
            }
        });
        if (updateAll) {
            await OrderController.editAll({
                serviceTime: defaultServiceTime,
                pieceTime: pieceTime
            });
        };

        return Helpers.getResponse(1, "updated", settings)
    };

    getAll = async (req) => {
        const sortAndPagination = await Helpers.sortAndPagination(req);
        const where = req.query;
        const data = await Helpers.filters(where, Op);
        if (data.bool) {
            const settings = await Settings.findAndCountAll({
                where: data.where,
                include: includeFalse,
                ...sortAndPagination
            });
            return Helpers.getResponse(1, "ok", { settings: settings.rows, total: settings.count });
        };
    };
    
    delete = async (ids) => {
        if (!ids || ids.length == 0 ) {
            return Helpers.getResponse(0, ErrorMessagesService.canNotBeEmpty('ids'));
        } else {
            await Settings.destroy({
                where: {
                    id: {
                        [Op.in]: ids
                    }
                }
            });
            return Helpers.getResponse(1, "deleted", { "Count": ids.length });
        }
    };
};