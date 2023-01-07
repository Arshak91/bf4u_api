module.exports = (sequelize, Sequelize) => {
	const Settlement = sequelize.define('settlements', {

		driverId: { type: Sequelize.INTEGER },
		carrierId: { type: Sequelize.INTEGER },
		shipperId: { type: Sequelize.INTEGER },

		fromDate: { type: Sequelize.DATE },
		toDate: { type: Sequelize.DATE },
		loads: { type: Sequelize.STRING },

		paymentType: { type: Sequelize.INTEGER }, // 1 = Flat , 2 = Mile , 3 = Percentage , 4 = Hour
		currencyId: { type: Sequelize.INTEGER }, // 1 = USD , 2 = CAD
		fuelSurcharge: { type: Sequelize.DOUBLE },
		detention: { type: Sequelize.DOUBLE },

		additionId: { type: Sequelize.INTEGER },	// ?
		deductionId: { type: Sequelize.INTEGER },	// ?
		prepaymentAmount: { type: Sequelize.DOUBLE },

		paymentAmount: { type: Sequelize.DOUBLE },

        status: { type: Sequelize.ENUM, values: ['Pending', 'Paid'] },

		name: { type: Sequelize.STRING }
	});
	
	return Settlement;
}