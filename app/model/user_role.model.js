module.exports = (sequelize, Sequelize) => {
	const UserRole = sequelize.define('user_roles', {
        roleId: {
            type: Sequelize.INTEGER
        },
        userId: {
            type: Sequelize.INTEGER
        },
        createdAt: { type: Sequelize.DATE },
        updatedAt: { type: Sequelize.DATE },
	});
	
	return UserRole;
};