module.exports = (sequelize, Sequelize) => {
    const Files = sequelize.define('files', {
        url: {
            type: Sequelize.STRING
        },
        source: {
            type: Sequelize.STRING
        },
        fileType: {
            type: Sequelize.INTEGER
        },
        label: {
            type: Sequelize.STRING,
            default: null
        }
    });
    return Files;
};