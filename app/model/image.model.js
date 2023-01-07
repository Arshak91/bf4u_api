module.exports = (sequelize, Sequelize) => {
    const Image = sequelize.define('images', {
        image_url: { type: Sequelize.STRING },
        HandlingUnits_id: { type: Sequelize.INTEGER },
        filename: { type: Sequelize.STRING }
    });
    return Image;
};
