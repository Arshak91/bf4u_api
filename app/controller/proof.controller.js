const Helper = require("../classes/helpers");
const db = require("../config/db.config.js");
const Order = db.order;
const fs = require('fs');
const FileManager = require('../classes/files_manager');


const allowedExtensions = [
    'image/apng',
    'image/bmp',
    'image/gif',
    'image/x-icon',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/svg+xml',
    'image/webp',
    'jpg',
    'jpeg',
    'png'
];

exports.approve = async (req, res) => {
    const {
        orderId,
        loadId,
        signature,
        proofSettings,
        photos
    } = req.body, errors = [], proofs = [];
    const urls = req.get('host');
    const rull =  urls.slice(0, urls.indexOf('.'));
    const currentOrder = await Order.findOne({ where: { id: orderId } });
    console.log("here---", currentOrder, orderId);
    if (!currentOrder) return res.json(await Helper.getResponse(0, 'wrong order id'));

    if (!proofSettings || (proofSettings.photos === 1 && !photos.length) || (proofSettings.signature === 1 && !signature.length)) {
        return res.send(Helper.getResponse(0, "photo or signature is required"));
    }

    for (let i = 0; i < photos.length; i++) {
        const res = await uploadProofs(photos[i], loadId, orderId, 'photo', rull);
        if (res && !res.status) errors.push(`photos_${[i]}`);
        if (res.data) proofs.push(res.data.id);
    }

    for (let i = 0; i < signature.length; i++) {
        const res = await uploadProofs(signature[i], loadId, orderId, 'signature', rull);
        if (res && !res.status) errors.push(`signature${[i]}`);
        if (res.data) proofs.push(res.data.id);
    }
    currentOrder.proof = proofs;

    if (errors.length) return res.send(Helper.getResponse(0, 'file not uploaded'));
    await Order.update(currentOrder.dataValues, { where: { id: orderId } });
    return res.json(await Helper.getResponse(1, 'ok'));
};

const uploadProofs = async (image, loadId, orderId, prefx, origin) => {
    const fileManager = new FileManager();
    let error, msg, data;
    const uploadedData = Buffer.from(image);
    let extension = 'png';
    let fileName = `${prefx}_${Date.now()}_${loadId}_${orderId}_.` + extension;
    let path = '/resources/0/images/proof/';
    const x = `${origin ? `./${origin.split('.')[0].replace('http://', '')}` : ''}`
    console.log(path, 'path');
    console.log(x, 'x');
    if (!fs.existsSync(`${x}${path}`)) {
        fs.mkdirSync(`${x}${path}`, { recursive: true });
    }
    if (allowedExtensions.includes(extension)) {
        try {
            console.log(`Uploaded image: ${path}${fileName} , image: ${fileName}`);
            fs.writeFileSync(`${`${x}${path}`}${fileName}`, image, { encoding: 'base64' }, function (err) {
                if (err) console.log(err);
                else console.log('File created');
            });
            const result = await fileManager.create({ url: `${path}${fileName}`, source: 'proof', fileType: 'image', label: prefx });
``
            if (result && !!result.status) data = result.data;

            error = false;
            msg = "image uploaded";
        } catch (e) { error = true; msg = e; }
    }
    if (!error) {
        return { msg, status: 1, data };
    } else {
        return { msg, status: 0, data };
    }
};
