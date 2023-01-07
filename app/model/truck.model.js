module.exports = (sequelize, Sequelize) => {
    const Truck = sequelize.define('trucks', {
        
        type: { type: Sequelize.ENUM, values: ['Dry Van', 'Reefer', 'Flat Bed', 'Step Deck', 'Lowboy', 'Roll Tite Trailer', 'Double Drop', 'Chassis'] },

        capacity: { type: Sequelize.DOUBLE },

        externalSize: { type: Sequelize.STRING },

        internalSize: { type: Sequelize.STRING }
    });

    return Truck;
};