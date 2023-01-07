module.exports = (sequelize, Sequelize) => {
    const CarrierService = sequelize.define('carrier_services', {
        name: { type: Sequelize.STRING }
    });

    return CarrierService;

    //area_of_services:  { type: Sequelize.ENUM, values: ['TL Dry', 'TL Reefer', 'TL Flatbed', 'LTL', 'LTL Reefer', 'Intermodal', 'Bulk Liquid', 'Air Freight', 'Bulk Dry', 'Drayage', 'Expedite', 'Other'] },
};