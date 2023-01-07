const env = process.env.SERVER == 'local' ? require('../config/env.local') : require('../config/env');
const mysql = require('mysql2');
const schemasModel = require('./constants/db.constants');
const db = require('../config/db.config');
const seq = db.sequelize2;

module.exports = class DbSeed {

    static db = {
        host: env.host,
        user: env.username,
        port: 3308,
        password: env.password,
    };
    static connection;
    static async createDb() {
        const connection = mysql.createConnection(DbSeed.db);
        connection.connect(function (err) {
            if (err) {
                console.log(err);
            } else console.log("MySql Connected!");
        });
        // const newDb = await seq.query("CREATE DATABASE IF NOT EXISTS mydb")
        // await DbSeed.createTables();
        connection.query(`CREATE DATABASE IF NOT EXISTS ${env.database}`, async function (err, result) {
            if (err) { console.log(err) }
            else {
                await DbSeed.createTables();
            }
        });
        return { data: 'ok', status: 1 }
    };

    static async checkExistsTables() {
        const connectionEnv = {
            ...DbSeed.db,
            database: env.database
        };
        const connection = mysql.createConnection(connectionEnv);
        connection.connect(async function (err) {
            if (err) {
                console.log(err);
            } else {
                await DbSeed.createTables();
            }
        });
    };

    static async createTables() {
        const body = DbSeed.db;
        body.database = env.database;
        const dbConnection = mysql.createConnection(body);
        schemasModel.map(async (item, index) => {
            await DbSeed.createTableByModel(item, dbConnection);
        });
    };

    static async createTableByModel(data, dbConnection) {
        if (data.tableName === 'permissionGroups') {
            console.log('1111111');
        }
        const sql = `CREATE TABLE IF NOT EXISTS ${data.tableName} (${data.query})`;
        dbConnection.query(sql, async function (err, result) {
            if (err) { throw err; }
            if (result && result.warningStatus === 1) {
                if (data.tableName === 'permissions') {
                    await DbSeed.creteDefaultPermissions(dbConnection);
                }
                if (data.tableName === 'permissionGroups') {
                    await DbSeed.creteDefaultPermissionsGroups(dbConnection);
                }
            };
            if (result.warningStatus === 1 && data.tableName === 'globalSettings') {
                await DbSeed.creteDefaultAppSettings(dbConnection);
            }
            // await DbSeed.checkDefaultRows(dbConnection, data.tableName);
        });
    };

    static async creteDefaultPermissions(dbConnection) {
        const PermissionsSeed = require('./permissions.seed');
        const PermissionGroupSeed = require('./permissionGroup.seed');
        const UsersSeed = require('./user.seed');
        await PermissionsSeed.init(dbConnection);
    };
    static async creteDefaultAppSettings(dbConnection) {
        const AppSettingsSeed = require('./appSettings.seed');
        await AppSettingsSeed.init(dbConnection);
    };
    static async creteDefaultPermissionsGroups(dbConnection) {
        const PermissionGroupSeed = require('./permissionGroup.seed');
        const UsersSeed = require('./user.seed');
        await PermissionGroupSeed.init(dbConnection);
    };

    // static async checkDefaultRows(dbConnection, tableName) {
    //     dbConnection.query(`SELECT * FROM ${env.database}.${tableName}`, function (error, result) {
    //         if (error) throw error;
    //         else 
    //     })
    // };

};