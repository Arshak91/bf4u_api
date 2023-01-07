const Helpers = require('../classes/helpers');
const AppSettings = require('../classes/appSettings');
const AppSettingsService = new AppSettings();

exports.update = async (req, res) => {
    try {
        const result = await AppSettingsService.update(req.body);
        return res.send(result);
    } catch (error) {
        return res.send(Helpers.getResponse(0, error.message));
    }
};