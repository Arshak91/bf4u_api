
module.exports = (sequelize, Sequelize) => {
    const Classifiers = sequelize.define('classifiers', {
        type: { type: Sequelize.INTEGER },
        name: { type: Sequelize.STRING },
        
        carrierId: { type: Sequelize.INTEGER },
        shipperId: { type: Sequelize.INTEGER },

        status: { type: Sequelize.ENUM, values: ['Active', 'Inactive'] }
    });

    return Classifiers;
}