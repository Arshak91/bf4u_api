
module.exports = (sequelize, Sequelize) => {
    const HandlingType = sequelize.define('HandlingTypes', {
        name: { type: Sequelize.STRING },
        Type: { type: Sequelize.STRING },
        weight: { type: Sequelize.DOUBLE },

        width: { type: Sequelize.DOUBLE },
        height: { type: Sequelize.DOUBLE },
        length: { type: Sequelize.DOUBLE },

        depth: { type: Sequelize.DOUBLE},
        density: { type: Sequelize.DOUBLE},

        disabled: { type: Sequelize.INTEGER },
        description: { type: Sequelize.STRING }

    });
    return HandlingType;
};
