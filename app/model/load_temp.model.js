module.exports = (sequelize, Sequelize) => {
    const Load = sequelize.define('load_temps', {

        UUID: { type: Sequelize.STRING },
        carrierId: { type: Sequelize.INTEGER },
        equipmentId: { type: Sequelize.INTEGER },
        assetsId: { type: Sequelize.INTEGER },
        driverId: { type: Sequelize.INTEGER },
        depoId: { type: Sequelize.INTEGER },
        shiftId: { type: Sequelize.INTEGER },

        nickname: { type: Sequelize.STRING },
        flowType: { type: Sequelize.INTEGER },

        orders: { type: Sequelize.STRING },
        stops: { type: Sequelize.INTEGER },
        
        start: { type: Sequelize.STRING }, //lat lon
		end: { type: Sequelize.STRING }, //lat lon
        
        feet: { type: Sequelize.DOUBLE },
        weight: { type: Sequelize.DOUBLE },
        cube: { type: Sequelize.DOUBLE },
        pallet: { type: Sequelize.DOUBLE },
        emptymile: { type: Sequelize.DOUBLE }, 

        totalDistance: { type: Sequelize.DOUBLE },
        totalDuration: { type: Sequelize.DOUBLE },
        
        status: { type: Sequelize.INTEGER },
        freezed: { type: Sequelize.INTEGER },
        
        loadCost: { type: Sequelize.STRING },
        loadCostPerMile:  { type: Sequelize.STRING },
        fuelSurcharge: { type: Sequelize.DOUBLE },

        startAddress: { type: Sequelize.STRING },
        endAddress: { type: Sequelize.STRING },
        
        startTime:  { type: Sequelize.DATE },
        endTime: { type: Sequelize.DATE },
        
        comment: { type: Sequelize.STRING },
        totalcases:  { type: Sequelize.STRING },
        
        feelRates: { type: Sequelize.DOUBLE },
        permileRates: { type: Sequelize.DOUBLE },
        return: { type: Sequelize.INTEGER },
        planType: { type: Sequelize.ENUM, values: ['Manual', 'Auto'] },
        carTypes: { type: Sequelize.JSON },
        stopLocations: { type: Sequelize.JSON },
        busy: { type: Sequelize.INTEGER, defaultValue: 0 },
        changed: { type: Sequelize.JSON },
        warning: { type: Sequelize.INTEGER },
        warningData: { type: Sequelize.JSON },
        disabled: { type: Sequelize.INTEGER },
        confirmed: { type: Sequelize.INTEGER, defaultValue: 0 },

    });

    return Load;
};