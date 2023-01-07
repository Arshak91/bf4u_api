const db = require('../config/db.config');
const Op = db.Sequelize.Op;
const permissionGroup = db.permissionGroup;
const user = db.user;
var bcrypt = require('bcryptjs');

module.exports = class UsersSeed {
    async init() {
        await this.createSeedUsers();
    };

    async createSeedUsers() {
        const permission = await permissionGroup.findOne({
            where: { name: 'admin' }
        });
        const existUser = await user.findOne({ where: { email: 'pm7@pm.com', username: 'lessUser' } });
        if (!existUser) {
            const usersData = {
                name: 'LessPlatform',
                username: 'lessUser',
                email: 'pm7@pm.com',
                // permissionId: permission ? permission.dataValues.id : null,
                password: bcrypt.hashSync('password1/', 8)
            };
            const res = await user.create(usersData);
            if (res) {
                console.log('Created 1 user from seed!');
            }
        }
    };
};