module.exports = (sequelize, Sequelize) => {

    const NotificationSettings = sequelize.define('notificationSettings', {
        userId: { type: Sequelize.INTEGER },
        settingsId: { type: Sequelize.INTEGER },
        settings: { type: Sequelize.JSON },
        sendEmailAs: { type: Sequelize.STRING },
        emailNotifications: { type: Sequelize.INTEGER },
        updatedAt: { type: Sequelize.DATE }
    });

    return NotificationSettings;
};