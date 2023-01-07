const db = require('../config/db.config.js');
const Uploads = db.uploads;
const Op = db.Sequelize.Op;
// const op = db.Sequelize.Op;
// const seq = db.sequelize;

module.exports = class Upload {


    constructor(params) {
        this.data = params.data;
    }

    async create(){
        let status = 1;
        let theUpload = await Uploads.create({
            status: status,
            UUID: this.data.UUID ? this.data.UUID : null,
            FileName: this.data.FileName ? this.data.FileName : null,
            failed: this.data.failed ? this.data.failed : null,
            userId: this.data.userId ? this.data.userId : null,
        });

        return {
            status: 1,
            msg: "upload created",
            data: theUpload.dataValues
        };

    }

    async edit() {
        let updateUpload, error;
        let status = this.data.status;
        if (this.data.failed && this.data.failed.length > 0) {
            status = 0;
        }
        delete this.data.id;
        updateUpload = await Uploads.update({
            status: status,
            failed: this.data.failed ? this.data.failed : null,
            FileName: this.data.FileName ? this.data.FileName : null,
            userId: this.data.userId ? this.data.userId : null,
            orderCount: this.data.orderCount ? this.data.orderCount : 0
        }, {
            where: {
                UUID: this.data.UUID
            }
        }).catch(err => {
            error = err;
        });
        if (!updateUpload && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!updateUpload && !error) {
            return {
                status: 0,
                msg: "such Upload doesn't exist"
            };
        } else {
            return {status: 1, msg: "ok", data: updateUpload};
        }
    }

    async getAll() {
        let uploads, { sortAndPagination, where } = this.data;
        uploads = await Uploads.findAndCountAll({
            where: where,
            include: [{ all: true, nested: false }],
            ...sortAndPagination
        });
        if (uploads) {
            return {
                status: 1,
                msg: 'ok',
                data: {
                    uploads: uploads.rows,
                    total: uploads.count
                }
            };
        } else {
            return {
                status: 1,
                msg: 'ok',
                data: {
                    uploads: [],
                    total: 0
                }
            };
        }
    }
    async getOne() {
        let upload;
        upload = await Uploads.findOne({
            where: this.data,
            include: [{ all: true, nested: false }],
        });
        if (upload) {
            return {
                status: 1,
                msg: 'ok',
                data: {
                    ...upload.dataValues,
                }
            };
        } else {
            return {
                status: 1,
                msg: 'ok',
                data: {}
            };
        }
    }
    async delete() {
        let upload, { ids } = this.data;
        upload = await Uploads.destroy({
            where: {
                id: {
                    [Op.in]: ids
                }
            }
        });
        if (upload) {
            return {
                status: 1,
                msg: 'uploads deleted',
                data: {
                    ...upload,
                }
            };
        } else {
            return {
                status: 1,
                msg: 'upload doesn\'t exist',
                data: {}
            };
        }
        
    }
};
