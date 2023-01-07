const env = process.env.SERVER == 'local' ? require('../config/env.local') : require('../config/env');
const db = require('../config/db.config');
const defaultPermissionGroups = require('./constants/permissionGroup.constants');

class PermissionGroupSeed {
    async init(connection) {
        await this.createSArole(connection);
    };

    async createSArole(connection) {
        await Promise.all(defaultPermissionGroups.map(async item => {
            const date = new Date();
            const STR_TO_DATE = `STR_TO_DATE('${date.getDate()},${date.getMonth()},${date.getFullYear()}', '%d,%m,%Y')`;
            const query = 'INSERT INTO `permissionGroups` (`name`,`permissions`, `createdAt`) VALUES ' + `(${this.stringSlicer(item.name)}, '${JSON.stringify(item.permissions)}', ${STR_TO_DATE})`;
            console.log(query);
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


module.exports = new PermissionGroupSeed();