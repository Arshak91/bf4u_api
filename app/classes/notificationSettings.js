const db = require('../config/db.config.js');
const Helpers = require('../classes/helpers');
const NotificationSettings = db.notificationSettings;
const Settings = db.Settings;
const Op = db.Sequelize.Op;

module.exports = class NotificationSettingsService {
    getByUserId = async(userId) => {
        const userNotificationSettings = await NotificationSettings.findOne({ where: userId });
        if (!userNotificationSettings) return Helpers.getResponse(0, 'wrong id');

        return Helpers.getResponse(1, 'user notification settings', userNotificationSettings);
    };

    update = async (userId, model) => {

        const isValidBody = await this.isValidModel(model, []);

        if (isValidBody && isValidBody.length) {
            return Helpers.getResponse(0, `${isValidBody[0]}`);
        }

        let updatedNotification;
        try {
            updatedNotification = await NotificationSettings.update(model, { where: { userId } });
        } catch (error) {
            return Helpers.getResponse(0, error.message)
        }

        return Helpers.getResponse(1, 'ok', updatedNotification.dataValues);
    };

    isValidModel = async (model, errors) => {
        const { settings, emailNotifications } = model;
        
        const settingsType = typeof(settings);
        const emailNotificationsType = typeof(emailNotifications);
        if (settingsType !== 'object') {
            errors.push('settings must be an array');
        }        

        if (emailNotificationsType !== 'number') {
            errors.push('emailNotifications must be a number (1 or 0)');
        }

        return errors;
    }
};