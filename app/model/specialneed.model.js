module.exports = (sequelize, Sequelize) => {
    const SpecialNeed = sequelize.define('specialneeds', {
        
        name: { type: Sequelize.STRING },
        description: { type: Sequelize.TEXT },
        status: { type: Sequelize.INTEGER }

    });

    return SpecialNeed;
};