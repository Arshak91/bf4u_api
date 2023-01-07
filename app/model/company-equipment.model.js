module.exports = (sequelize, Sequelize) => {
    const CompanyEquipment = sequelize.define('companyEquipment', {

        companyId: {type: Sequelize.INTEGER}, 
        name: { type: Sequelize.STRING },
        companyType: { type: Sequelize.ENUM, values: ['shipper', 'broker', 'carrier'] },
        
        equipmentId: {type: Sequelize.INTEGER},
        platNumber: {type: Sequelize.STRING },
        attachment: { type: Sequelize.STRING },
        licenses: {type: Sequelize.STRING },
        VIN: {type: Sequelize.STRING },
        brand: {type: Sequelize.STRING },
        cabinType: { type: Sequelize.ENUM, values: ['sleeper', 'non_sleeper'] },
        inspaction: { type: Sequelize.NUMBER },            //  yes / no 
        yom: {type: Sequelize.STRING },                      //  year of manufacture 
        model: {type: Sequelize.STRING },
        exploitation: {type: Sequelize.STRING },
        info: { type: Sequelize.STRING },
        depoid: { type: Sequelize.INTEGER },

        createdAt: { type: Sequelize.DATE },
        updatedAt: { type: Sequelize.DATE }
    });

    return CompanyEquipment;
};