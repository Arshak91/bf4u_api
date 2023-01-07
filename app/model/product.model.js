module.exports = (sequelize, Sequelize) => {
    const Product = sequelize.define('products', {
        _id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        ID: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        sku: { type: Sequelize.STRING },
        description: { type: Sequelize.STRING },
        brandname: { type: Sequelize.STRING },
        class: { type: Sequelize.STRING },
        unit: { type: Sequelize.STRING },
        packsize: { type: Sequelize.STRING },
        weight: { type: Sequelize.DOUBLE },
        width: { type: Sequelize.DOUBLE },
        height: { type: Sequelize.DOUBLE },
        length: { type: Sequelize.DOUBLE },
        companyId: { type: Sequelize.INTEGER },
        notes: { type: Sequelize.STRING },
        piecetypeid: { type: Sequelize.INTEGER },
        handlingtype: { type: Sequelize.STRING },
        manufacturernumber: { type: Sequelize.STRING },
        updatedAt: {type: Sequelize.DATE },
        createdAt: {type: Sequelize.DATE }
    });
    return Product;
};
