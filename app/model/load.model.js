module.exports = (sequelize, Sequelize) => {
    const Load = sequelize.define('loads', {
        uuid: { type: Sequelize.STRING },
        nickname: { type: Sequelize.STRING },

        carrierId: { type: Sequelize.INTEGER },
        equipmentId: { type: Sequelize.INTEGER },
        assetsId: { type: Sequelize.INTEGER },
        driverId: { type: Sequelize.INTEGER },
        depoId: { type: Sequelize.INTEGER },

        flowType: { type: Sequelize.INTEGER },

        orders: { type: Sequelize.STRING },
        stops: { type: Sequelize.INTEGER },

        start: { type: Sequelize.STRING },
        startAddress: { type: Sequelize.STRING },
		endAddress: { type: Sequelize.STRING },
        end: { type: Sequelize.STRING },
        startTime: {type: Sequelize.DATE},
        endTime: {type: Sequelize.DATE},

        dispatchDate: { type: Sequelize.DATE },
        deliveryDate: { type: Sequelize.DATE },

        feet: { type: Sequelize.DOUBLE },
        weight: { type: Sequelize.DOUBLE },
        cube: { type: Sequelize.DOUBLE },
        pallet: { type: Sequelize.DOUBLE },
        emptymile: { type: Sequelize.DOUBLE },

        totalDistance: { type: Sequelize.DOUBLE },
        totalDuration: { type: Sequelize.DOUBLE },

        loadCost: { type: Sequelize.STRING },
        loadCostPerMile:  { type: Sequelize.STRING },
        fuelSurcharge: { type: Sequelize.DOUBLE },

        status: { type: Sequelize.INTEGER },
        freezed: { type: Sequelize.INTEGER },
        return: { type: Sequelize.INTEGER },
        planType: { type: Sequelize.ENUM, values: ['Manual', 'Auto'] },
        comment: { type: Sequelize.STRING },
        totalcases:  { type: Sequelize.STRING },
        lastlocatoins: { type: Sequelize.JSON },
        shiftId: { type: Sequelize.INTEGER },
        carTypes: { type: Sequelize.JSON },
        stopLocations: { type: Sequelize.JSON },
        dispatchUrl: { type: Sequelize.STRING },

        isPublic: { type: Sequelize.INTEGER },
        finishRequest: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        changed: { type: Sequelize.JSON },
        warning: { type: Sequelize.INTEGER },
        warningData: { type: Sequelize.JSON },
        loadTempId: { type: Sequelize.INTEGER },
        startedTime: { type: Sequelize.DATE },
        finishedTime: { type: Sequelize.DATE },
    });

    return Load;
};