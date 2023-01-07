module.exports = (sequelize, Sequelize) => {
    const Settings = sequelize.define("settings", {

        userId: { type: Sequelize.INTEGER },
        userType: { type: Sequelize.STRING },
        exchangeRate: { type: Sequelize.STRING },
        units: { type: Sequelize.JSON },
        Currency: { type: Sequelize.JSON },
        defaultCurrency: { type: Sequelize.STRING },
        defaultServiceTime: { type: Sequelize.DOUBLE },
        pieceTime: { type: Sequelize.DOUBLE },
        orders: { type: Sequelize.JSON },
        loads: { type: Sequelize.JSON },
        loadTemps: { type: Sequelize.JSON },
        drivers: { type: Sequelize.JSON },
        apiConfigs: { type: Sequelize.JSON },
        autoplan: { type: Sequelize.JSON },
        country: { type: Sequelize.STRING },
        countryCode: { type: Sequelize.STRING },
        durationMultiplier: { type: Sequelize.DOUBLE },
        fileHeaders: { type: Sequelize.JSON },
        IterationMultiplier: { type: Sequelize.DOUBLE },
        timezone: { type: Sequelize.STRING },
        metricsSystem: { type: Sequelize.INTEGER },
        enableNotifications: { type: Sequelize.INTEGER },
        proofDefault: { type: Sequelize.JSON }
    });

return Settings;
};