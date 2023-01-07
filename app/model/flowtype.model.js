module.exports = (sequelize, Sequelize) => {
    const FlowType = sequelize.define('flowtypes', {

        index: { type: Sequelize.INTEGER },
        name: { type: Sequelize.STRING },
        description: { type: Sequelize.TEXT },
        modeltype: {type: Sequelize.ENUM, values: ['VRP', 'VRP-PDP', 'PDP'] },
        status: { type: Sequelize.INTEGER }

    });
    return FlowType;
};