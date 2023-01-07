module.exports = (sequelize, Sequelize) => {
    const Vendors = sequelize.define('vendors', {

        name: { type: Sequelize.STRING }, 
        companyLegalName: { type: Sequelize.STRING}, 
        email: { type: Sequelize.STRING },
        address: { type: Sequelize.STRING },
        address2: { type: Sequelize.STRING },
        phone1: { type: Sequelize.STRING},
        phone2: { type: Sequelize.STRING },
        contactPerson: { type: Sequelize.STRING },
        points: { type: Sequelize.JSON },
        notes:{ type: Sequelize.TEXT },
        serviceTime: { type: Sequelize.DOUBLE },
        createdAt: { type: Sequelize.DATE },
        updatedAt: { type: Sequelize.DATE }
    });

    return Vendors;
};