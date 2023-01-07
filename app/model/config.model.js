module.exports = (sequelize, Sequelize) => {
    const Config = sequelize.define('configs', {
        name: { type: Sequelize.STRING },

        value: { type: Sequelize.STRING },
        
        status: { type: Sequelize.INTEGER },
    });

    return Config;
};