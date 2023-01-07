module.exports = (sequelize, Sequelize) => {
    const Schedule = sequelize.define('schedules', {

        driverid: { type: Sequelize.INTEGER },
        monday: { type: Sequelize.JSON },
        tuesday: { type: Sequelize.JSON },
        wednesday: { type: Sequelize.JSON },
        thursday: { type: Sequelize.JSON },
        friday: { type: Sequelize.JSON },
        saturday: { type: Sequelize.JSON },
        sunday: { type: Sequelize.JSON }
    });

return Schedule;
};