const db = require('../config/db.config.js');
const Helpers = require('../classes/helpers');
const NotificationTemplate = db.notificationTemplates;
const NotificationSettings = db.notificationSettings;
const Settings = db.Settings;
const Op = db.Sequelize.Op;
const errorMessages = require('../classes/errors');
const notificationConstants = require('../constants/notification_template');
module.exports = class NotificationTemplatesService {
    constructor() {
        this.validationModel = this.getValidateModel();
    };

    create = async (userId, model) => {
        const errors = await this.validate({ ...model, userId }, []);

        if (errors && errors.length) return Helpers.getResponse(0, errors[0]);
    
        const existNotificationTemplate = await NotificationTemplate.findOne({ where: { userId, type: model.type  } });

        if (existNotificationTemplate) return Helpers.getResponse(1, errorMessages.existItem('notification template', 'type'));

        const notificationSettings = await NotificationSettings.findOne({ where: userId });
        model.notificationSettingsId = notificationSettings.dataValues.id;
        model.isDefault = model.isDefault ? model.isDefault : 0;
        let newTemplate;
        try {
            newTemplate = await NotificationTemplate.create({
                ...model,
                userId
            });
        } catch (err) {
            console.log(err);
        }

        return Helpers.getResponse(1, 'notification tempate created successfuly');
    };

    update = async (id, model, userId) => {
        const errors = await this.validate({ ...model, userId }, []);

        if (errors && errors.length) return Helpers.getResponse(0, errors[0]);
        // const existNotificationTemplate = await NotificationTemplate.findOne({ where: { userId, type: model.type  } });
        // if (existNotificationTemplate) return Helpers.getResponse(1, errorMessages.existItem('notification template', 'type'));
        
        const notificationSettings = await NotificationSettings.findOne({ where: userId });
        model.notificationSettingsId = notificationSettings.dataValues.id;

        try {
        const isEditRequest = await this.isEditRequest(id);

        if (isEditRequest && !!isEditRequest.data.isCreate) {
            model.isDefault = 0;
            await NotificationTemplate.create({
                ...model,
                userId
            });
        } else {
            await NotificationTemplate.update(model, { where: { id } });
        }

        } catch (err) {
            console.log(err);
        }

        return Helpers.getResponse(1, 'notification tempate updated successfuly');
    };

    getList = async (userId) => {
        let list;
        try {
            list = await NotificationTemplate.findAndCountAll({ where: { userId } });
        } catch (error) {
            console.log(error);
        }
        const responseData = await this.removeDefaultsList(list.rows.map(item => item.dataValues))
        return Helpers.getResponse(1, 'list', { total: list.count, data: responseData });
    };

    getById = async (userId, id) => {
        let item;
        try {
            item = await NotificationTemplate.findOne({ where: { userId, id } });
        } catch (error) {
            console.log(error);
        }
        return Helpers.getResponse(1, 'list', item.dataValues);
    };
    
    removeDefaultsList = async (list) => {
        Object.keys(notificationConstants.notificationTemplateType).forEach(x => {
            let index = list.findIndex(i => i.isDefault === 0 && i.type === notificationConstants.notificationTemplateType[x]);
            let indexOfDefault = list.findIndex(i => i.isDefault === 1 && i.type === notificationConstants.notificationTemplateType[x]);
            if (index > -1) {
                list.splice(indexOfDefault, 1);
            };
        });

        return list;
    };

    isEditRequest = async (id) => {
        const template = await NotificationTemplate.findOne({ where: { id } });
        if (!template) return Helpers.getResponse(0, errorMessages.wrong('template', 'id'));

        if (!!template.dataValues.isDefault) {
            return Helpers.getResponse(1, 'ok', { isCreate: true });
        } 
        return Helpers.getResponse(1, 'ok', { isCreate: false });
    };
    
    validate = async (model, errors) => {
        this.validationModel.map(item => {
            const itemType = typeof(model[item.name]);

            if (!model[item.name]) { errors.push(errorMessages.requiredField(item.name)) };

            if (itemType !== item.type && (item.type === null || !item.nullable)) {
                errors.push(errorMessages.wrongFieldType(item.name, item.type));
            }
        });
        return errors;
    };

    getValidateModel = () => {
        return [
            {
                name: 'userId',
                type: 'number',
                nullable: false
            },
            {
                name: 'emailSubject',
                type: 'string',
                nullable: true
            },
            {
                name: 'emailContent',
                type: 'string',
                nullable: true
            },
            {
                name: 'emailContentFooter',
                type: 'string',
                nullable: true
            },
            {
                name: 'notificationTitle',
                type: 'string',
                nullable: true
            },
            {
                name: 'notificationContent',
                type: 'string',
                nullable: true
            },
            {
                name: 'notificationContentFooter',
                type: 'string',
                nullable: true
            },
            {
                name: 'type',
                type: 'number',
                nullable: false
            },
        ];
    };
};