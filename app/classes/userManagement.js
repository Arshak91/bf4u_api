const db = require("../config/db.config.js");
const User = db.user;
const Op = db.Sequelize.Op;
const permissionGroup = db.permissionGroup;
const settings = db.settings;
const bcrypt = require("bcryptjs");
const Helper = require('../classes/helpers');
const Search = require('../lib/search');

module.exports = class UserManagemet {
    async create(body) {
        const pGroup = await permissionGroup.findOne({ where: { id: body.permissionId } });

        if (!pGroup) return await Helper.getResponse(0, 'wrong permission id');

        if (body.username.length < 6) return await Helper.getResponse(0, 'minimum length of username must be 6');
        if (body.password.length < 8) return await Helper.getResponse(0, 'minimum length of password must be 8');

        const encriptedPassword = bcrypt.hashSync(body.password, 8)
        let user;
        try {
            user = await User.create({
                name: body.name,
                username: body.username,
                email: body.email,
                password: encriptedPassword,
                permissionId: body.permissionId
            });
            const newSettingsMode = {
                    userId: user.dataValues.id,
                    exchangeRate: 'vfeve',
                    units: {a: 8},
                    Currency: {b: 98},
                    defaultCurrency: 'fefefe',
                    defaultServiceTime: 420,
                    pieceTime: 30,
                    orders: null,
                    loads: null,
                    loadTemps: null,
                    drivers: null,
                    apiConfigs: {leafletRouteUrl: "http://map.lessplatform.com/route/v1"},
                    autoplan: {maxStop: "30", maxCount: "1000"}
                };

                await settings.create(newSettingsMode);
        } catch (error) {
            console.log(error);
            return Helper.getResponse(0, error);
        }
        return Helper.getResponse(1, 'User created successfuly', user);
    };

    async update(body) {
        const user = await User.findOne({ where: { id: body.id } });
        if (!user ) return Helper.getResponse(0, 'User not found');
        if (body.username.length < 6) return await Helper.getResponse(0, 'minimum length of username must be 6');

        try {
            const updateBody = {
                name: body.name,
                username: body.username,
                email: body.email,
                permissionId: body.permissionId
            };

            await User.update(updateBody, { where: { id: body.id } });
        } catch (error) {
            return Helper.getResponse(0, error);
        }

        return Helper.getResponse(1, 'User updated', user);
    }

    async getList(req, text, filter) {
         const search = text ? await Search.depos(text) : {};
         let sortAndPagination = await Helper.sortAndPagination(req);
         const where = await Helper.filters(filter, Op, 'userManagement');


         let list;

         try {
            list = await User.findAndCountAll({
                where: { 
                    ...where.where,
                    ...search
                },
                include: [{ all: true, nested: false }],
                ...sortAndPagination
            });
         } catch (error) {
             return Helper.getResponse(0, error);
         }
         console.log(where);
         let data = { users: [], total: 0 };
         list.rows.map(item => {
            if (item.dataValues.roleName !== 'superadmin') {
                data.users.push(item.dataValues);
            }
         });
         data.total = list.count - 2;
         return Helper.getResponse(1, 'Users list', data);
    }

    async delete (idList) {
        
        try {
            await User.destroy({
                where: {
                    id: { [Op.in]: idList }
                }
            })
        } catch (error) {
            return Helper.getResponse(0, error);
        }

        return Helper.getResponse(1, 'users successfuly deleted');
    }

    async validationModel(isValidateId) {
        const idValidation = {
                name: 'id',
                type: 'number',
                nulable: false,
                minLength: null
            };

        const validModele = [
                    {
                name: 'name',
                type: 'string',
                nulable: false,
                minLength: null
            },
            {
                name: 'username',
                type: 'string',
                nulable: false,
                minLength: null
            },
            {
                name: 'email',
                type: 'string',
                nulable: false,
                minLength: null
            },
            {
                name: 'password',
                type: 'number',
                nulable: false,
                minLength: 8
            },
            {
                name: 'permissionId',
                type: 'number',
                nulable: false,
                minLength: 1
            },
        ];

        if (isValidateId) {
            validModele.push(idValidation)
        }

        return validModele;
    }

    async validate(data, validateId) {
        const errors = [], model = await this.validationModel(validateId);
        Object.keys(data).map(async i => {
            const index = model.findIndex(x => x.name === i);
            if (index === -1) {
                return errors.push(`${i} is required!`);
            }

            const item = model[index];

            const isValid = {
                type: (typeof (data[i]) === item.type) ? item.type : null,
                nullable: item.nulable && (typeof (data[i]) === 'null'),
                minLength: item.minLength && (data[i].length >= item.minLength)
            };
            let errorStr;
            switch (data[i]) {
                case !isValid.nullable && !isValid.type:
                    errorStr = `type of ${i} must be a ${item.type}`;
                    break;
                case !isValid.minLength:
                    errorStr = `min length of ${i} must be over ${item.minLength}`;
                    break;
                case !isValid.nullable:
                    errorStr = `${i} can not be null`;
                    break;
                default:
                    break;
            }
            if (errorStr && errorStr.length) return errors.push(errorStr);
        });
        return errors
    }

    async filterConfig() {
        return ['superadmin', 'admin'];
    }
};