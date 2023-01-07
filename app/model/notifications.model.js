module.exports = (sequelize, Sequelize) => {

    const Notification = sequelize.define('notifications', {

        userId: { type: Sequelize.INTEGER },
        seen: { type: Sequelize.INTEGER },
        type: { type: Sequelize.INTEGER },
        title: { type: Sequelize.STRING },
        content: { type: Sequelize.STRING },
        seenAt: { type: Sequelize.DATE }
    });

    return Notification;
};
