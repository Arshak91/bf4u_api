module.exports = (sequelize, Sequelize) => {
    const Tractor = sequelize.define('tractors', {
        
        name: { type: Sequelize.STRING },

        power: { type: Sequelize.INTEGER },

        powerUnit: { type: Sequelize.STRING },
    });

    return Tractor;
}