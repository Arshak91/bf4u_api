module.exports = (sequelize, Sequelize) => {
    const LoadRoute = sequelize.define('load_routes', {
        loadId: { type: Sequelize.INTEGER },
        
        route: { type: Sequelize.STRING },

        pendingDistance: { type: Sequelize.DOUBLE },
        distance: { type: Sequelize.DOUBLE },
        pendingDuration: { type: Sequelize.DOUBLE },
        duration: { type: Sequelize.DOUBLE },
        
        distribution: { type: Sequelize.INTEGER }
    });

    return LoadRoute;
};