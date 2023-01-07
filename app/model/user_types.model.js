module.exports = (sequelize, Sequelize) => {
	const UserTypes = sequelize.define('userTypes', {
		userId: {
			type: Sequelize.STRING
		},
		types: {
			type: Sequelize.ENUM, values: ['driver', 'shipper', 'carrier']
		},
		createdAt: { type: Sequelize.DATE },
        updatedAt: { type: Sequelize.DATE }
	});
	
	return UserTypes;
};