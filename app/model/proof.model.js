module.exports = (sequelize, Sequelize) => {
    const Proof = sequelize.define('proof', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        driverId: {
            type: Sequelize.INTEGER
        },
        orderId: {
            type: Sequelize.INTEGER
        },
        signature: {
            type: Sequelize.JSON
        },
        photos: {
            type: Sequelize.JSON
        }
    });

    return Proof;
};