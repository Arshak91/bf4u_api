const env = process.env.SERVER == 'local' ? require('../config/env.local') : require('../config/env');
const db = require('../config/db.config');
const defaultAppSettings = require('./constants/appSettings.constants');

class AppSettingsSeed {
    async init(connection) {
        await this.createSettings(connection);
    };

    async createSettings(connection) {
        await Promise.all(defaultAppSettings.map(async item => {
            const date = new Date();
            const STR_TO_DATE = `STR_TO_DATE('${date.getDate()},${date.getMonth()},${date.getFullYear()}', '%d,%m,%Y')`;
            const query = 'INSERT INTO `globalSettings` (`exchangeRate`, `defaultCurrency`, `defaultServiceTime`, `apiConfigs`, `pieceTime`, `fileHeaders`, `timezone`, `metricsSystem`, `Currency`, `proofDefault`, `createdAt`) VALUES ' + `('${item.exchangeRate}', '${item.defaultCurrency}', '${item.defaultServiceTime}', '${JSON.stringify(item.apiConfigs)}', '${item.pieceTime}', '${JSON.stringify(item.fileHeaders)}', '${item.timeZone}', '${item.metricSystem}', '${JSON.stringify(item.Currency)}', ${item.proofDefault},  ${STR_TO_DATE})`;
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


module.exports = new AppSettingsSeed();