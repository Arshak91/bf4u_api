module.exports = (sequelize, Sequelize) => {
    const Tractor = sequelize.define('trips', {
        
        number: { type: Sequelize.STRING },

        driverId: { type: Sequelize.INTEGER },

        loadIds: { type: Sequelize.STRING },

        startDate: { type: Sequelize.STRING },
        endDate: { type: Sequelize.STRING },

        // new
        startLocation: { type: Sequelize.STRING },
        endLocation: { type: Sequelize.STRING },

        paymentType: { type: Sequelize.INTEGER }, // 1 - percentage, 2 - fixed, 3 - mileage, 4 - hourly
        orgFreigh: { type: Sequelize.DOUBLE },
        freigh: { type: Sequelize.DOUBLE },

        // addCharges: { },
        // addPayments: { },

        totalPayable:  { type: Sequelize.DOUBLE },
        
        status: { type: Sequelize.INTEGER }, // 0 - disabled (deleted), 1 - closed, 2 - pending, 3 - ended, 4 - paid
    });

    return Tractor;
}


