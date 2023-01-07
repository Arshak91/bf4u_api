const env = process.env.SERVER == 'local' ? require('../config/env.local') : require('../config/env');
const DbSeed = require('./db.seed');

module.exports = class MainSeed {
    constructor() {
        this.x = new DbSeed();
    }

    async init() {
        // await DbSeed.createDb();
        // await DbSeed.checkExistsTables();
    };
};