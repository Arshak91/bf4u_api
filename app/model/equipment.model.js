module.exports = (sequelize, Sequelize) => {
    const Equipment = sequelize.define('equipments', {
        type: { type: Sequelize.ENUM, values: ['Tractor', 'Trailer', 'Truck'] },
        trailerType: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        horsePower: { type: Sequelize.FLOAT },
        
        value: { type: Sequelize.DOUBLE },
        valueUnit: { type: Sequelize.STRING },

        // trailerSize: { type: Sequelize.STRING },
        externalLength: { type: Sequelize.STRING },
        externalWidth: { type: Sequelize.STRING },
        externalHeight: { type: Sequelize.STRING },

        internalLength: { type: Sequelize.STRING },
        internalWidth: { type: Sequelize.STRING },
        internalHeight: { type: Sequelize.STRING },
        maxweight: { type: Sequelize.DOUBLE },
        maxVolume: { type: Sequelize.DOUBLE },
        eqType: { type: Sequelize.ENUM, values: ['Dry','Reefer','Frozen','Cooler','Multi']},  

    });

    return Equipment;
};