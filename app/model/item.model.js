module.exports = (sequelize, Sequelize) => {
    const Item = sequelize.define('Item', {

        Handling_Unit_id: { type: Sequelize.INTEGER },
        HandlingTypes_id: { type: Sequelize.INTEGER },
        piecetype_id: { type: Sequelize.INTEGER },
        Quantity: { type: Sequelize.FLOAT },
        Weight: { type: Sequelize.FLOAT },
        Length: { type: Sequelize.FLOAT },
        Width: { type: Sequelize.FLOAT },
        Height: { type: Sequelize.FLOAT },
        NMFC_number: { type:Sequelize.STRING },
        NMFC_Sub_code: { type:Sequelize.STRING },
        freightclasses_id: { type:Sequelize.INTEGER },
        Product_Description: { type: Sequelize.DECIMAL },
        density: { type: Sequelize.FLOAT },
        volume: { type: Sequelize.FLOAT },

    });
    return Item;
};
