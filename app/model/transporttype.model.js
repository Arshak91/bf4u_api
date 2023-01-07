module.exports = (sequelize, Sequelize) => {
    const TransportType = sequelize.define('transporttypes', {
        name: { type: Sequelize.STRING },
        description: { type: Sequelize.TEXT },
        status: { type: Sequelize.INTEGER }
    });

    return TransportType;
};
