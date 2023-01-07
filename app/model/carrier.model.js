module.exports = (sequelize, Sequelize) => {
    const Carrier = sequelize.define('carriers', {
        carrierType: { type: Sequelize.ENUM, values: [ 'carrier', 'ownoperator'] },

        legalcompanyname: { type: Sequelize.STRING },
        dbaname: { type: Sequelize.STRING },
        operation_authority: { type: Sequelize.ENUM, values: ['Common', 'Contract', 'Broker'] },
        
        // physical_address: { type: Sequelize.STRING },
        // physical_city: { type: Sequelize.STRING },
        // physical_state: { type: Sequelize.STRING },
        // physical_zipcode: { type: Sequelize.STRING },

        // mailing_address: { type: Sequelize.STRING },
        // mailing_city: { type: Sequelize.STRING },
        // mailing_state: { type: Sequelize.STRING },
        // mailing_zipcode: { type: Sequelize.STRING },
        
        phone: { type: Sequelize.STRING },
        fax: { type: Sequelize.STRING },
        website: { type: Sequelize.STRING },
        yearestablished: { type: Sequelize.INTEGER },
        
        //identification_number: { type: Sequelize.ENUM, values: ['MC', 'USDOT', 'SCAC', 'NIR', 'WSIB', 'CVOR', 'FAST ID', 'CRA Business', 'US Federal ID', 'Other'] },
        //area_of_services:  { type: Sequelize.ENUM, values: ['TL Dry', 'TL Reefer', 'TL Flatbed', 'LTL', 'LTL Reefer', 'Intermodal', 'Bulk Liquid', 'Air Freight', 'Bulk Dry', 'Drayage', 'Expedite', 'Other'] },

        area_of_services: { type: Sequelize.STRING },
        identification_number: { type: Sequelize.STRING },
        status: { type: Sequelize.ENUM, values: ['Active', 'Inactive'] }
    });

    return Carrier;
}