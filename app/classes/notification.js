const db = require('../config/db.config.js');
const Helpers = require('../classes/helpers');
const Notification = db.notification;
const Op = db.Sequelize.Op;
const includeFalse = [{ all: true, nested: false }];

module.exports = class Notifications {
    create = async (data, userId) => {
        try {
            const notification = await Notification.create({
                userId,
                seen: 0,
                title: data.title,
                content: data.content,
                seenAt: null,
                type: data.type
            });
            return { status: 1, msg: 'ok', data: notification };
        } catch (error) {
            console.log(error);
        }
    }

    seen = async(id, user) => {
        const notification = await Notification.update({
            seen: 1,
            seenAt: new Date(),
            updatedAt: new Date()
        }, {
            where: { id, userId: user.id }
        });
        return { status: 1, msg: 'ok', data: notification };
    }

    setAllNotificationSeen = async (userId) => {
        try {
            await Notification.update({
                seen: 1,
                seenAt: new Date(),
                updatedAt: new Date()
            }, {
                where: {
                    userId,
                    seen: 0
                }
            });
        } catch (error) {
            console.log(error);
        }
        return { status: 1, msg: 'Notifications updated' }
    }

    delete = async (idList) => {
        await Notification.destroy({
            where: {
                id: { [Op.in]: idList }
            }
        });
        return { status: 1, msg: 'Notifications deleted' }
    }
    
    getById = async (id) => {
        const list = await Notification.findOne({
            where: { id: id }
        }).catch(err => {
            console.log(err.message);
        });
        return { status: 1, msg: 'Notification', data: list.dataValues };
    }

    getList = async (where, sortAndPagiantion) => {
        const list = await Notification.findAndCountAll({
            where,
            distinct: true,
            ...sortAndPagiantion
        }).catch(err => {
            console.log(err.message);
        });
        let data = {};
        data.notifications = list.rows.map(item => item.dataValues);
        data.total = list.count;
        return { status: 1, msg: 'Notification list', data };
    };

    
};