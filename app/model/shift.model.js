module.exports = (sequelize, Sequelize) => {
    const Shift = sequelize.define('shifts', {
        
        shiftName: { type: Sequelize.STRING },
        shift: { type: Sequelize.FLOAT },
        break_time: { type: Sequelize.FLOAT },
        drivingtime: { type: Sequelize.FLOAT },
        max_shift: { type: Sequelize.FLOAT },
        rest: { type: Sequelize.FLOAT },
        recharge: { type: Sequelize.FLOAT },
        status: { type: Sequelize.INTEGER }

    });

    return Shift;
};
