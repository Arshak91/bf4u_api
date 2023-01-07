module.exports = (sequelize, Sequelize) => {

    const LocationType = sequelize.define('locationTypes', {
        
        location_type: { type: Sequelize.STRING }

    });

    return LocationType;
}