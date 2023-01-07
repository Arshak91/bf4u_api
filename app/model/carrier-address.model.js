module.exports = (sequelize, Sequelize) => {
    const CarrierAddress = sequelize.define('carrier_addresses', {
        carrierId: { type: Sequelize.INTEGER },
        addressType: { type: Sequelize.ENUM, values: ['Physical', 'Mailing'] },
        street: { type: Sequelize.STRING },
        primery: { type: Sequelize.TINYINT},
        city: { type: Sequelize.STRING },
        stateProvince: { type: Sequelize.STRING },
        zipPostal: { type: Sequelize.STRING },
        country: {type: Sequelize.STRING}
    });

    return CarrierAddress;
};
