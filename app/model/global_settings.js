module.exports = (sequelize, Sequelize) => {
    const GlobalSettings = sequelize.define("globalSettings", {

        exchangeRate: { type: Sequelize.STRING },
        Currency: { type: Sequelize.JSON },
        defaultCurrency: { type: Sequelize.STRING },
        defaultServiceTime: { type: Sequelize.DOUBLE },
        pieceTime: { type: Sequelize.DOUBLE },
        apiConfigs: { type: Sequelize.JSON },
        timezone: { type: Sequelize.STRING },
        metricsSystem: { type: Sequelize.INTEGER },
        proofDefault: { type: Sequelize.JSON },
        fileHeaders: { type: Sequelize.JSON },
        IterationMultiplier: { type: Sequelize.INTEGER },
        durationMultiplier: { type: Sequelize.INTEGER }
    });

    return GlobalSettings;
};