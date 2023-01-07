const env = process.env.SERVER == 'local' ? require('../config/env.local') : require('../config/env');
const defaultPermissionsModel = require('./constants/permission.constants');

class PermissionsSeed {
    async init(connection) {
        await this.createDefaultPermissions(connection);
    };

    async createDefaultPermissions(connection) {
        await Promise.all(defaultPermissionsModel.map(async item => {
            const date = new Date();
            const STR_TO_DATE = `STR_TO_DATE('${date.getDate()},${date.getMonth()},${date.getFullYear()}', '%d,%m,%Y')`;
            const query = 'INSERT INTO `permissions` (`requestUrl`,`requestMethod`,`enum`,`isDefault`) VALUES ' + `(${this.stringSlicer(item.requestUrl)}, ${this.stringSlicer(item.requestMethod)}, ${item.enum}, ${item.isDefault})`;
            connection.query(query, function (err, result) {
                if (err) console.log(err, 'error');
            });
        }));
    }
    stringSlicer(str) {
        let x = "'"
        return x + str + x
    }
};

module.exports = new PermissionsSeed();