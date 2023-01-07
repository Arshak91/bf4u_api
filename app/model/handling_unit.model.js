module.exports = (sequelize, Sequelize) => {
    const HandlingUnit = sequelize.define('HandlingUnits', {
        orders_id: { type: Sequelize.INTEGER },
        HandlingType_id: { type: Sequelize.INTEGER },
        Quantity: { type: Sequelize.FLOAT },
        piecetype_id: { type: Sequelize.INTEGER, defaultValue: 0 },
        productdescription: { type: Sequelize.STRING },
        freightclasses_id: { type: Sequelize.INTEGER },
        nmfcnumber: { type: Sequelize.STRING },
        nmfcsubcode: { type: Sequelize.STRING },
        Weight: { type: Sequelize.FLOAT },
        Length: { type: Sequelize.FLOAT },
        Width: { type: Sequelize.FLOAT },
        Height: { type: Sequelize.FLOAT },
        mintemperature: { type: Sequelize.FLOAT },
        maxtemperature: { type: Sequelize.FLOAT },
        stackable: { type: Sequelize.BOOLEAN },
        turnable: { type: Sequelize.BOOLEAN },
        hazmat: { type: Sequelize.BOOLEAN },

        density: { type: Sequelize.DECIMAL },
        options: { type: Sequelize.STRING },
        volume: { type: Sequelize.FLOAT },
        sku: { type: Sequelize.STRING },
        brand: { type: Sequelize.STRING },
        specialneeds: { type: Sequelize.INTEGER }
    });
    return HandlingUnit;
};
