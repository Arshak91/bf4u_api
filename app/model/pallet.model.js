module.exports = (sequelize, Sequelize) => {

    const Pallet = sequelize.define('pallets', {
        size: { type: Sequelize.STRING }
    });

    return Pallet;
};
