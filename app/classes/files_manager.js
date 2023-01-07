const osrm = require('../controller/osmap.controller');
const db = require('../config/db.config.js');
const Files = db.files;
const Helper = require('../classes/helpers');
const Op = db.Sequelize.Op;
const seq = db.sequelize;
const fs = require("fs");

module.exports = class FileManager {
    async create(data) {
        const
            { url, source, fileType, label } = data,
            errors = [],
            isValidModel = await this.validateModel(url, source, fileType, errors);

        if (isValidModel.errors.length) return this.response(0, isValidModel.errors[0]);
        let newFile;
        try {
            newFile = await Files.create(data);
            console.log(newFile);
        } catch (error) {
            console.log(error,'error');
        }
        return this.response(1, 'File created successfuly', newFile.dataValues);
    };

    async getById(data) {   
        const response = [];
        const list = await Files.findAll({ where: { id: { [Op.in]: data } } });
        list.map(item => response.push(item.dataValues));
      return response;
    };

    async deleteFroofImages(idList, err) {
        idList.map(async item => {
            const file = await Files.findOne({ where: { id: +item } });
            if (file) {
                try {
                    const url = `${__dirname}/${file.dataValues.url}`
                    fs.unlinkSync(url);
                    console.log(`file from id ${item} successfuly deleted from file manager.`);
                } catch (error) {
                    return err.push(error);
                }
            }
        });
        return err;
    }

    async validateModel(url, source, fileType, errors) {
        if (!url || (typeof (url) !== 'string')) errors.push('url');
        else if (!source || typeof (source) !== 'string' || source.length <= 2) errors.push('source');
        else if (!fileType || typeof (fileType) !== 'string' || fileType.length <= 3) errors.push('fileType');
        return { errors }
    };

    async response(status, msg, data) {
        return { status, msg, data }
    };
};