const GeneralService = require('../classes/general');
const GeneralApiService = new GeneralService();
const Helper = require('../classes/helpers');

exports.getGeneralData = async (req, res) => {
    try {
        const result = await GeneralApiService.createGeneralModel(req.user);
        return res.send(result);
    } catch (error) {
        return res.send(Helper.getResponse(0, error.message));
    }
};

