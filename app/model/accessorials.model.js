
module.exports = (sequelize, Sequelize) => {
    const Accessorial = sequelize.define('Accessorials', {
        Type: { type: Sequelize.STRING },
        ServiceOption: { type: Sequelize.STRING },
    });

    return Accessorial;
};
