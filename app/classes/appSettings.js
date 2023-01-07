const db = require('../config/db.config.js');
const Helper = require('../classes/helpers');
const Op = db.Sequelize.Op;
const seq = db.sequelize;
const appSettings = db.appSettings;
const errorHandler = require('../classes/errors');
const Validation = require('./validation');
const OrderController = require('../controller/orderscontroller');


module.exports = class AppSettings extends Validation {

    constructor() {
        super();
    }

    exchangeRate;
    defaultServiceTime;
    pieceTime;
    apiConfigs;
    timezone;
    metricSystem;
    proofDefault;
    Currency;
    defaultCurrency;
    fileHeaders;
    IterationMultiplier;
    durationMultiplier;

    getSettings = async () => {
        const response = await appSettings.findAll({});
        const result = response[0];
        if (result) {
            this.exchangeRate = result.dataValues.exchangeRate;
            this.defaultServiceTime = result.dataValues.defaultServiceTime;
            this.pieceTime = result.dataValues.pieceTime;
            this.apiConfigs = result.dataValues.apiConfigs;
            this.timezone = result.dataValues.timezone;
            this.metricSystem = result.dataValues.metricSystem;
            this.proofDefault = result.dataValues.proofDefault;
            this.Currency = result.dataValues.Currency;
            this.defaultCurrency = result.dataValues.defaultCurrency;
            this.fileHeaders = result.dataValues.fileHeaders;
            this.durationMultiplier = result.dataValues.durationMultiplier,
            this.IterationMultiplier = result.dataValues.IterationMultiplier
        };      
    };

    update = async (body) => {
        const result = await this.validate(this.model, body);
        if (result && result.errors.length) {
            return Helper.getResponse(0, result.errors[0]);
        };
        await Promise.all([
            await appSettings.update(body, { where: { id: 1 } }),
            !!body.updateAll && await OrderController.editAll({
                    serviceTime: body.defaultServiceTime,
                    pieceTime: body.pieceTime
                })
        ]);
        return Helper.getResponse(1, 'Settings updated');
    };

    get model () {
        return {
            exchangeRate: [this.is.string(), this.is.minLength(3)],
            defaultServiceTime: [this.is.number()],
            pieceTime: [this.is.number()],
            apiConfigs: [this.is.object()],
            timezone: [this.is.string(), this.is.minLength(3), this.is.allow(['null'])],
            // metricSystem: [this.is.number(), this.is.allow(['null'])],
            // proofDefault: [this.is.object()],
            Currency: [this.is.object()],
            defaultCurrency: [this.is.string(), this.is.minLength(3)]
        };
    };

    get settings () {
        return {
            exchangeRate: this.exchangeRate,
            defaultServiceTime: this.defaultServiceTime,
            pieceTime: this.pieceTime,
            apiConfigs: this.apiConfigs,
            timezone: this.timezone,
            metricSystem: this.metricSystem,
            proofDefault: this.proofDefault,
            Currency: this.Currency,
            defaultCurrency: this.defaultCurrency,
            fileHeaders: this.fileHeaders,
            durationMultiplier: this.durationMultiplier,
            IterationMultiplier: this.IterationMultiplier
        }
    }
};