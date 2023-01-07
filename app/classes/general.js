const AppSettings = require('./appSettings');
const UserSettingsService = require('./userSettings');
const Permissions = require('../constants');
const Helper = require('./helpers');

module.exports = class GeneralService {

    appSettingsService = new AppSettings();
    userSettingsService = new UserSettingsService();
    permissions = new Permissions();;

    createGeneralModel = async (user) => {
        await this.appSettingsService.getSettings();
        const response = {
            appSettings: this.appSettingsService.settings,
            userSettings: await (await this.userSettingsService.getByUserId(user)).data,
            permissionType: this.permissions.permission,
            userName: user.username
        };
        return Helper.getResponse(1, "ok", response);
    };
};