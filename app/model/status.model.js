module.exports = (sequelize, Sequelize) => {
	const Status = sequelize.define('statuses', {
		type: { type: Sequelize.ENUM, values: [ 'Load', 'Order', 'Both' ] },
		statustype: { type: Sequelize.ENUM, values: [ '*', '**' ] },
		name: { type: Sequelize.STRING },
		color: { type: Sequelize.STRING }
	});
	
	return Status;
};