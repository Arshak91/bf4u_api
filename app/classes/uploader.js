const db = require('../config/db.config.js');
const fs = require('fs');
const mime = require('mime');
const Helpers = require('../classes/helpers');
const Op = db.Sequelize.Op;
const pieceType = db.piecetypes;
const HandlingUnit = db.handlingUnit;
const Images = db.image;
const allowedExtensions = [
    'image/apng',
    'image/bmp',
    'image/gif',
    'image/x-icon',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/svg+xml',
    'image/webp'
];
// const op = db.Sequelize.Op;
// const seq = db.sequelize;

module.exports = class Uploader {


    constructor(params) {
        if (params) {
            this.units = params.units;
            this.orderId = params.orderId;
            this.req = params.req;
        }
    }

    async saveHandlingUnits(){
        const handlingUnit = [];
        const Images = [];
        if (!this.units.length) return 0;
        for (const unit of this.units) {
            const unitSaved = await this.saveHandlingUnit(unit, this.orderId);
            handlingUnit.push(unitSaved);
            let saveImages;
            if (unit.images && unit.images.length) {
                saveImages = await this.saveHandlingUnitsImages(unit.images, unitSaved.id, this.req);
                Images.push(saveImages);
            }
            if (unit.id) {
                if (unit.removedImages && unit.removedImages.length) {
                    await this.removeHandlingUnitImages(unit.removedImages, unit.id);
                }
            }
        }
        return {
            'handlingUnit': handlingUnit,
            Images
        };
    }

    async saveHandlingUnit(data, orderId){
        let handling, volume, piece, where;
        if (data.volume) {
            volume = data.volume;
        } else {
            if (!data.sku) {
                if (data.piecetype_id || (data.piecetype_id && data.freightclasses_id)) {
                    if (data.freightclasses_id) {
                        where = {
                            id: data.piecetype_id,
                            freightclasses_id: data.freightclasses_id
                        };
                    } else {
                        where = {
                            id: data.piecetype_id,
                        };
                    }
                    piece = await pieceType.findOne({
                        where
                    });
                    volume = data.Weight/piece.density;
                } else if (data.Length && data.Width && data.Height) {
                    volume = data.Length * data.Width * data.Height;
                } else {
                    volume = null;
                }
            } else {
                if (data.piecetype_id) {
                    piece = await pieceType.findOne({
                        where: {
                            id: data.piecetype_id
                        }
                    });
                    volume = data.Weight/piece.density;
                } else {
                    volume = null;
                }
            }
        }
        // console.log('here', orderId);
        
        if (data.id) {
            await HandlingUnit.update({
                HandlingType_id: data.HandlingType_id,
                Quantity: data.Quantity ? data.Quantity : 1,
                piecetype_id: data.piecetype_id ? data.piecetype_id : 0,
                sku: data.sku ? data.sku : 0,
                brand: data.brand ? data.brand : 0,
                specialneeds: data.specialneeds ? data.specialneeds : 0,
                productdescription: data.productdescription,
                freightclasses_id: data.freightclasses_id ? data.freightclasses_id : null, // ?
                nmfcnumber: data.nmfcnumber, // ?
                nmfcsubcode: data.nmfcsubcode, // ?
                Weight: data.Weight ? data.Weight : 0,
                Length: data.Length ? data.Length : 0,
                Width: data.Width ? data.Width : 0,
                Height: data.Height ? data.Height : 0,
                mintemperature: data.mintemperature ? data.mintemperature : 0,
                maxtemperature: data.maxtemperature ? data.maxtemperature : 0,
                stackable: data.stackable,
                turnable: data.turnable,
                density: piece ? piece.density : null,
                volume: volume,
                orders_id: orderId
            }, { where: { id: data.id}});
            handling = await HandlingUnit.findOne({ where: {id: data.id}});
        } else {
            handling = await HandlingUnit.create({
                HandlingType_id: data.HandlingType_id,
                Quantity: data.Quantity,
                piecetype_id: data.piecetype_id ? data.piecetype_id : 0,
                sku: data.sku ? data.sku : 0,
                brand: data.brand ? data.brand : 0,
                specialneeds: data.specialneeds ? data.specialneeds : 0,
                productdescription: data.productdescription,
                freightclasses_id: data.freightclasses_id, // ?
                nmfcnumber: data.nmfcnumber, // ?
                nmfcsubcode: data.nmfcsubcode, // ?
                Weight: data.Weight ? data.Weight : 0,
                Length: data.Length ? data.Length : 0,
                Width: data.Width ? data.Width : 0,
                Height: data.Height ? data.Height : 0,
                mintemperature: data.mintemperature ? data.mintemperature : 0,
                maxtemperature: data.maxtemperature ? data.maxtemperature : 0,
                stackable: data.stackable,
                turnable: data.turnable,
                density: piece ? piece.density : null,
                volume: volume,
                orders_id: orderId
            }).catch(err => {
                console.log('handling Err', err);
            });
        }
        return handling.dataValues;
    }

    async saveHandlingUnitsImages(images, unitId, req){
        let error, msg;
        for (const [i, image] of images.entries()) {
            let matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
            response = {};
            
            if (matches.length !== 3) {
                return {
                    msg: "file is invalid",
                    status: 0
                };
            }
            response.type = matches[1];
            response.data = Buffer.from(matches[2], 'base64');
            let decodedImg = response;
            let imageBuffer = decodedImg.data;
            let type = decodedImg.type;
            let extension = mime.getExtension(type);
            let fileName = `image${i}_${Date.now()}.` + extension;
            let path = "./resources/0/images/";
            if (!fs.existsSync(path)){
                fs.mkdirSync(path, { recursive: true });
            }
            if (allowedExtensions.includes(type)) {
                try {
                    console.log(`Action: Save Image -> File Path: ${path}${fileName} , File Name: ${fileName}`);
                    let getInfo = await Helpers.getRemoteInfo(req);
                    let { urls } = await Helpers.getOrderImagePath('images', fileName, getInfo.host);
                    console.log(urls.Path);
                    
                    fs.writeFileSync(`${path}${fileName}`, imageBuffer, 'utf8');
                    await Images.create({
                        image_url: urls.Path,
                        HandlingUnits_id: unitId,
                        filename: fileName
                    });
                    error = false;
                    msg = "image uploaded";
                } catch (e) {
                    error = true;
                    msg = e;
                }
            } else {
                error = true;
                msg = "image mimeType is invalid";
            }
            
        }
        if (!error) {
            return {
                msg,
                status: 1
            };
        } else {
            return {
                msg,
                status: 0
            };
        }
    }

    async removeHandlingUnitImages(imageIds, unitId) {
        const images = await Images.findAll({
            where: {
                HandlingUnits_id: unitId
            }
        });
        if (images) {
            for (const image of images) {
                if (imageIds.includes(image.id)) {
                    let filePath = `./resources/0/images/${image.filename}`;
                    await Images.destroy({
                        where: {
                            id: image.id
                        }
                    });
                    console.log(`Action: Remove ->  Image Path: ${filePath}`);
                    fs.unlinkSync(filePath);
                }
            }
            return {
                status: 1,
                msg: "Image successfully deleted"
            };
        } else {
            return {
                status: 0,
                msg: "such images doesn't exist"
            };
        }
        
    
    }
};
