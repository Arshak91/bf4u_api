module.exports = (sequelize, Sequelize) => {
    const Customer = sequelize.define('Customers', {
 
        Type: { type: Sequelize.ENUM, values: ['shipper', 'broker'] },
        industrytype: { type: Sequelize.STRING },

        companyName: { type: Sequelize.STRING },
        customerName: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },

        Address_p: { type: Sequelize.STRING },
        Address1: { type: Sequelize.STRING },
        
        country: { type: Sequelize.STRING },
        state: { type: Sequelize.STRING },
        city: { type: Sequelize.STRING },
        
        phone1: { type: Sequelize.STRING },
        phone2: { type: Sequelize.STRING },
        
        contactperson: { type: Sequelize.STRING },
        contactpersonposition: { type: Sequelize.STRING },

        lastcontactedday: { type: Sequelize.STRING },
        workinghours:  { type: Sequelize.STRING },
        deliveryhours:  { type: Sequelize.STRING },

        rate: { type: Sequelize.DOUBLE },
        
        note: { type: Sequelize.STRING },
        createdAt: { type: Sequelize.DATE },
        updatedAt: { type: Sequelize.DATE }
    });

    return Customer;
};