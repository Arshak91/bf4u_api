module.exports = (sequelize, Sequelize) => {
    const ItemType = sequelize.define('item-type', {
        Type: {type: Sequelize.STRING }
    });
    return ItemType;
}