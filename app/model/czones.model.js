module.exports = (sequelize, Sequelize) => {
    const CZones = sequelize.define('czones', {
        name: { type: Sequelize.STRING},
        color: { type: Sequelize.STRING}
    });
    return CZones;
};
