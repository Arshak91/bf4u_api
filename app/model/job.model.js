module.exports = (sequelize, Sequelize) => {
    const Job = sequelize.define('jobs', {
        name: { type: Sequelize.STRING },
        UUID: { type: Sequelize.STRING },
        params: { type: Sequelize.JSON },
        filters: { type: Sequelize.JSON },
        status: { type: Sequelize.JSON },
        eta: { type: Sequelize.JSON },
        percentage: { type: Sequelize.JSON },
        loadOrderIds: { type: Sequelize.JSON },
        loads: { type: Sequelize.JSON },
        drivingminutes: { type: Sequelize.JSON },
        totalRunTime: { type: Sequelize.JSON },
        totalDistance: { type: Sequelize.JSON },
        totalDuration: { type: Sequelize.JSON },
        Infeasible: {type: Sequelize.JSON },
        InfeasibleCount: { type: Sequelize.DOUBLE },
        loadsCount: { type: Sequelize.DOUBLE },
        defaultStructure: { type: Sequelize.JSON },
		createdAt: { type: Sequelize.DATE },
        updatedAt: { type: Sequelize.DATE }
    });
    return Job;
};
