module.exports = (sequelize, Sequelize) => {
    const PermissionGroup = sequelize.define('permissionGroup', {
        name: { type: Sequelize.STRING },
        permissions: { type: Sequelize.JSON }
    });

    return PermissionGroup;
};
