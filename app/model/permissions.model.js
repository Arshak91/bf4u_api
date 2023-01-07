module.exports = (sequelize, Sequelize) => {

    const Permissions = sequelize.define('permissions', {
        enum: { type: Sequelize.INTEGER },
        requestUrl: { type: Sequelize.STRING },
        requestMethod: { type: Sequelize.STRING },
        isDefault: { type: Sequelize.INTEGER }
    });

    return Permissions;
};