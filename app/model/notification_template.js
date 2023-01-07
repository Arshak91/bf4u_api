module.exports = (sequelize, Sequelize) => {

    const NotificationTemplate = sequelize.define('notification_templates', {
        userId: { type: Sequelize.INTEGER },
        notificationSettingsId: { type: Sequelize.INTEGER },
        emailSubject: { type: Sequelize.STRING },
        emailContent: { type: Sequelize.STRING },
        emailContentFooter:{ type: Sequelize.STRING },
        notificationTitle: { type: Sequelize.STRING },
        notificationContent: { type: Sequelize.STRING },
        notificationContentFooter: { type: Sequelize.STRING },
        updatedAt: { type: Sequelize.DATE },
        type: { type: Sequelize.INTEGER },
        isDefault: { type: Sequelize.INTEGER }
    });

    return NotificationTemplate;
};