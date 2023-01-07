module.exports = (sequelize, Sequelize) => {
    const AdditionalTransfers = sequelize.define('additional_transfers', {
        driverId: { type: Sequelize.INTEGER },
        
        type: { type: Sequelize.INTEGER },  // income or outcome
        classifierId: { type: Sequelize.INTEGER },
        sum: { type: Sequelize.STRING },
        
        status: { type: Sequelize.ENUM, values: ['Active', 'Inactive'] }
    });

    return AdditionalTransfers;
}