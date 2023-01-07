module.exports = (sequelize, Sequelize) => {
    const Upload = sequelize.define('uploads', {
        status: { type: Sequelize.INTEGER },
        failed: { type: Sequelize.JSON },
        userId: { type: Sequelize.INTEGER },
        UUID: { type: Sequelize.STRING},
        FileName: { type: Sequelize.STRING},
        orderCount: { type: Sequelize.INTEGER }
    });

    return Upload;
};