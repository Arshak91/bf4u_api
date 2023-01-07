module.exports = (sequelize, Sequelize) => {
    const Menu = sequelize.define('menus', {
        title: { type: Sequelize.STRING },
        isfixed: { type: Sequelize.INTEGER },
        index: { type: Sequelize.INTEGER },
        url: { type: Sequelize.STRING },
    });
    return Menu;
};