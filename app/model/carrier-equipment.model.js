module.exports = (sequelize, Sequelize) => {
    const Addresses = sequelize.define('carrier_equipments', {
        carrierId: { type: Sequelize.INTEGER },
        equipmentType: { type: Sequelize.ENUM, values: ['Tractor', 'Trailer', 'Truck'] },
        tractorId: { type: Sequelize.INTEGER },
        trailerId: { type: Sequelize.INTEGER },

        equipmentId: { type: Sequelize.INTEGER },
    });

    return Addresses;
};