module.exports = (sequelize, Sequelize) => {
    const Currency = sequelize.define('currencies', {

        alias: { type: Sequelize.STRING },
        fullAlias: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        symbol: { type: Sequelize.STRING },

        createdAt: { type: Sequelize.DATE },
        updatedAt: { type: Sequelize.DATE }
    });

    return Currency;
};