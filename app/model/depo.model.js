
module.exports = (sequelize, Sequelize) => {
    const Deop = sequelize.define('depos', {

        name: { type: Sequelize.STRING },
        address: { type: Sequelize.STRING },
        carrierId: { type: Sequelize.INTEGER },
        customerId: { type: Sequelize.INTEGER },

        streetaddress: { type: Sequelize.STRING },
        city:{ type: Sequelize.STRING },
        state:{ type: Sequelize.STRING },
        zip:{ type: Sequelize.STRING },
        country: { type: Sequelize.STRING },
        countryCode: {type: Sequelize.STRING},
        lat: { type: Sequelize.STRING },
        lon: { type: Sequelize.STRING },
        
        status: { type: Sequelize.INTEGER },
        workinghours: { type: Sequelize.JSON }
    });

    return Deop;
};
