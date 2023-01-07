module.exports = (sequelize, Sequelize) => {
    const Consignees = sequelize.define("consignees", {

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
        rating: { type: Sequelize.ENUM, values: ["A", "B", "C"], defaultValue: "A" },
        serviceTime: { type: Sequelize.DOUBLE },
        driverId: {type: Sequelize.INTEGER},
        czone_id: {type: Sequelize.INTEGER},
        depo_id: { type: Sequelize.INTEGER },
        mustbefirst: { type: Sequelize.INTEGER, defaultValue: 0 },
        proofSettings: { type: Sequelize.JSON },
        createdAt: { type: Sequelize.DATE },
        updatedAt: { type: Sequelize.DATE }
    });

    return Consignees;
};