const PDFDocument = require("pdfkit");
const moment = require("moment");
const db = require("../config/db.config.js");
const fs = require("fs");
const Op = db.Sequelize.Op;
const Order = db.order;
const Load = db.load;
const Status = db.status;
const HandlingTypes = db.handlingType;
const Helper = require("../classes/helpers.js");

module.exports = class PDFDocs {
    
    static async generateDispatchObject(data) {
        
        const orderIds = await Helper.splitToIntArray(data.orders, ",");
        const orders = await Order.findAll({
            where: {
                id: {
                    [Op.in]: orderIds
                }
            },
            include: [{ all: true, nested: false }],
        });
        let ordersData = [];
        for (const order of orders) {
            let pkgs = 0, orderLength = 0, handlingTypes = [];
            for (const handling of order.HandlingUnits) {
                let handlingType = await HandlingTypes.findOne({
                    where: {
                        id: handling.HandlingType_id
                    }
                });
                handlingTypes.push({
                    type: handlingType.Type,
                    quantity: handling.Quantity
                });
                pkgs += (handling.Quantity*1);
                orderLength += (handling.Length*1);
            }
            
            ordersData.push({
                id: order.id,
                length: orderLength,
                pkg: order.HandlingUnits.length,
                weight: order.weight,
                handlingTypes,
                eta: order.eta,
                data: data.flowType == 1 ? order.dataValues : data.flowType == 2 ? order.dataValues : ""
            });
        }
        let totalPKG = 0;
        for (const data of ordersData) {
            totalPKG += (data.pkg*1);
        }
        if (!data.driver) {
            return {
                status: false,
                msg: `You must assign a driver to the load ${data.id}.`
            };
        }
        const dispatch = {
            orders: data.orders,
            trip: "xxxxxx",
            note: data.comment,
            driverName: `${data.driver.fname} ${data.driver.lname}`,
            car: data.carTypes,
            totalWeight: data.weight,
            totalPKG,
            totalMiles: data.totalDistance/1609,
            ordersData
        };
        return {status: true, dispatch};
        
    }
    static async dispatchHeader(doc, left, lineHeight, line, top, object, load) {
        let fontpath = (__dirname+"/../assets/fonts/");
        doc.font(`${fontpath}PalatinoBold.ttf`).fontSize(13);
        doc.text(`${load.flowType == 1 ? object.ordersData[0].data.pickupCompanyName : object.ordersData[0].data.deliveryCompanyName}`, left, top + (lineHeight * line++));
        doc.font(`${fontpath}DejaVuSans.ttf`)
        .fontSize(11);
        doc.text(`${load.flowType == 1 ? object.ordersData[0].data.pickupStreetAddress : object.ordersData[0].data.deliveryStreetAddress}`, left, top + (lineHeight * line++));
        if (load.flowType == 1) {
            doc.text(`${object.ordersData[0].data.pickupCity} ${object.ordersData[0].data.pickupState} ${object.ordersData[0].data.pickupZip}`, left, top + (lineHeight * line++));
        } else if(load.flowType == 2) {
            doc.text(`${object.ordersData[0].data.deliveryCity} ${object.ordersData[0].data.deliveryState} ${object.ordersData[0].data.deliveryZip}`, left, top + (lineHeight * line++));
        }
        doc.text("TEL:  FAX:", left, top + (lineHeight * line++));
        // doc.text("info@arcatrans.com", left, top + (lineHeight * line++));

        doc.font(`${fontpath}PalatinoBold.ttf`).fontSize(13);
        doc.text("Driver Dispatch Sheet", 400, top + (lineHeight * line++));
        let lineTop = top + (lineHeight * line);
        doc.lineCap("butt")
            .moveTo(left, lineTop)
            .lineTo(545, lineTop)
            .stroke();
        
        //
        doc.font(`${fontpath}PalatinoBold.ttf`).fontSize(7);
        
        return doc;
    }
    static async dispatchLoad(data, userId = 0) {
        try {
            const { load, location } = data;
            let fontpath = (__dirname+"/../assets/fonts/");
            await Load.update({
                status: 9
            }, {
                where: {
                    id: load.id
                }
            });
            let object = await this.generateDispatchObject(load);
            if (!object.status) {
                return {
                    msg: object.msg,
                    status: object.status
                };
            } else {
                object = object.dispatch;
            }
            if (!load.carTypes.length) {
                return {
                    msg: `You must assign a carTypes to the load ${load.id}.`,
                    status: 0
                };
            }
            if (!load.carTypes[0].equipment) {
                return {
                    msg: `You must assign a Equipment Type to the load ${load.id}.`,
                    status: 0
                };
            }
            if (!load.carTypes[0].platNumber) {
                return {
                    msg: `You must assign a platNumber to the load ${load.id}.`,
                    status: 0
                };
            }
            
            let paths = await Helper.getPaths("dispatches", `dispatch_${userId}_${load.id}.pdf`, userId, location);

            const doc = new PDFDocument();

            let path = "./resources/0/dispatches/";
            if (!fs.existsSync(path)){
                fs.mkdirSync(path, { recursive: true });
            }
            doc.pipe(fs.createWriteStream(paths.filePath));
            let left = 50;
            let top = 60;
            let lineHeight = 15;
            let line = 0;

            // section 1
            
            await this.dispatchHeader(doc, left, lineHeight, line, top, object, load);
            top += 90;
            // section 2
            top = top + (lineHeight * line) + 20;
            line = 0;

            doc.fontSize(12);
            doc.text("Order #: ", left+5, top);
            
            doc.font(`${fontpath}DejaVuSans.ttf`).fontSize(17);

            doc.text(object.orders, left + 55, top);
            top += 5;
            doc.font(`${fontpath}DejaVuSans.ttf`).fontSize(8);
            doc.text("Note: ", left, top + 58);
            doc.text(object.note, left + 50, top + 30, { width: 150, align: "left" });
            doc.text("Trip #: ", 300, top + 58);
            doc.text(load.id, 330, top + 58);
            doc.lineCap("butt")
                .moveTo(left, top + 70)
                .lineTo(545, top + 70)
                .stroke();
            doc.font(`${fontpath}PalatinoBold.ttf`);
            doc.text("Driver: ", left, top + 75);
            doc.text(object.driverName, left + 50, top + 75, { width: 150, align: "left" });
            if(load.carTypes.length && load.carTypes.length > 1){
                doc.text(`${load.carTypes[0].equipment.type}: `, left, top + 85);
                doc.text(load.carTypes[0].platNumber, left + 50, top + 85, { width: 150, align: "left" });
                doc.text(`${load.carTypes[1].equipment.type}: `, left, top + 95);
                doc.text(load.carTypes[1].platNumber, left + 50, top + 95, { width: 150, align: "left" });
                doc.text("License #: ", 220, top + 85);
                doc.text(load.carTypes[0].licenses, 220 + 50, top + 85, { width: 150, align: "left" });
                doc.text("License #: ", 220, top + 95);
                doc.text(load.carTypes[1].licenses, 220 + 50, top + 95, { width: 150, align: "left" });
            } else if (load.carTypes.length && load.carTypes.length == 1) {
                doc.text(`${load.carTypes[0].equipment.type}: `, left, top + 85);
                doc.text(load.carTypes[0].platNumber, left + 50, top + 85, { width: 150, align: "left" });
                doc.text("License #: ", 220, top + 85);
                doc.text(load.carTypes[0].licenses, 220 + 50, top + 85, { width: 150, align: "left" });
            }
            doc.text("Total Weight: ", 400, top + 85);
            doc.text(object.totalWeight, 400 + 55, top + 85, { width: 150, align: "left" });
            doc.text("Total PKG: ", 409, top + 95);
            doc.text(object.totalPKG, 409 + 46, top + 95, { width: 150, align: "left" });
            doc.text("Total Miles: ", 406, top + 105);
            doc.text(object.totalMiles, 406 + 49, top + 105, { width: 150, align: "left" });
            doc.lineCap("butt")
                .moveTo(left, top + 115)
                .lineTo(545, top + 115)
                .stroke();
            if (load.flowType == 2) {
                for (const [o, order] of object.ordersData.entries()) {
                    doc.text("Delivery: ", left, top + 120);
                    doc.text(`${order.data.deliveryCompanyName}`, left + 50, top + 120);
                    doc.font(`${fontpath}DejaVuSans.ttf`)
                        .fontSize(7);
                    doc.text(`${order.data.deliveryStreetAddress}`, left + 50, top + 130);
                    doc.text(`${order.data.id}`, left + 50, top + 140);
                    doc.font(`${fontpath}PalatinoBold.ttf`);
                    doc.text("Tel: ", left + 50, top + 150);
                    doc.text("Fax: ", left + 50, top + 160);
                    doc.text("Contact: ", left + 50, top + 170);
                    doc.text("Operating Hours: ", left + 50, top + 180);
                    doc.text("Date: ", left + 50, top + 220);
                    doc.text(`${moment(order.data.deliverydateFrom).format("MMM DD, YYYY")}`, left + 100, top + 220);
                    doc.text("Note: ", left + 50, top + 230);
                    doc.text("App. Time: ", 413, top + 120);
                    doc.text(`${moment(order.data.timeInfo.loads[load.dataValues.id].eta).format("LT")}`, 413 + 40, top + 120);
                    doc.text("Delivery#: ", 413, top + 130);
                    doc.text(`${order.data.delivery}`, 413 + 40, top + 130);
                    doc.text("Goods: ", 413, top + 152);
                    top += 160;
                    let arr = [], obj = {};
                    for (const handlingTypes of order.handlingTypes) {
                        if (obj[handlingTypes.type]) {
                            obj[handlingTypes.type] += (handlingTypes.quantity*1);
                        } else {
                            obj[handlingTypes.type] = (handlingTypes.quantity*1);
                        }
                    }
                    for (const item in obj) {
                        doc.text(`${item == "Package" ? "PKG": item}: `, 413, top);
                        doc.text(`${obj[item]}`, 413 + 40, top);
                        top += 10;
                    }
                    doc.text("Weight: ", 413, top);
                    doc.text(`${order.weight}(LB)`, 413 + 40, top);
                    doc.text("Length: ", 413, top + 10);
                    doc.text(`${order.length}`, 413 + 40, top + 10);
                    doc.lineCap("butt")
                        .moveTo(left, top + 80)
                        .lineTo(545, top + 80)
                        .stroke();
                    top -= 35;
                    if (o == 2 || (o > 3 && (o - 2)%3 == 0)) {
                        top = 60;
                        doc.addPage();
                        doc.font(`${fontpath}PalatinoBold.ttf`);
                        await this.dispatchHeader(doc, left, lineHeight, line, top, object, load);
                    }
                }
            } else if (load.flowType == 1) {
                for (const [o, order] of object.ordersData.entries()) {
                    doc.text("Pickup: ", left, top + 120);
                    doc.text(`${order.data.pickupCompanyName}`, left + 50, top + 120);
                    doc.font(`${fontpath}DejaVuSans.ttf`)
                        .fontSize(7);
                    doc.text(`${order.data.pickupStreetAddress}`, left + 50, top + 130);
                    doc.text(`${order.data.pickupCompanyName}`, left + 50, top + 140);
                    doc.font(`${fontpath}PalatinoBold.ttf`);
                    doc.text("Tel: ", left + 50, top + 150);
                    doc.text("Fax: ", left + 50, top + 160);
                    doc.text("Contact: ", left + 50, top + 170);
                    doc.text("Operating Hours: ", left + 50, top + 180);
                    doc.text("Date: ", left + 50, top + 220);
                    doc.text(`${moment(order.data.pickupdateFrom).format("MMM DD, YYYY")}`, left + 100, top + 220);
                    doc.text("Note: ", left + 50, top + 230);
                    doc.text("App. Time: ", 413, top + 120);
                    doc.text(`${moment(order.data.timeInfo.loads[load.dataValues.id].eta).format("LT")}`, 413 + 40, top + 120);
                    doc.text("Pickup#: ", 413, top + 130);
                    doc.text(`${order.data.pickup}`, 413 + 40, top + 130);
                    doc.text("Goods: ", 413, top + 152);
                    top += 160;
                    for (const handlingTypes of order.handlingTypes) {
                        doc.text(`${handlingTypes.type == "Package" ? "PKG": handlingTypes.type}: `, 413, top);
                        doc.text(`${handlingTypes.quantity}`, 413 + 40, top);
                        top += 10;
                    }
                    doc.text("Weight: ", 413, top);
                    doc.text(`${order.weight}(LB)`, 413 + 40, top);
                    doc.text("Length: ", 413, top + 10);
                    doc.text(`${order.length}`, 413 + 40, top + 10);
                    // top -= 160;
                    doc.lineCap("butt")
                        .moveTo(left, top + 90)
                        .lineTo(545, top + 90)
                        .stroke();
                    top -= 20;
                    if (o == 2 || (o > 3 && (o - 2)%3 == 0)) {
                        top = 60;
                        doc.addPage();
                        doc.font(`${fontpath}PalatinoBold.ttf`);
                        await this.dispatchHeader(doc, left, lineHeight, line, top, object, load);
                    }
                }
            }
            top += 115;
            doc.text("Broker Name ", left, top);
            doc.text("Phone", left + 120, top);
            doc.text("Fax", left + 220, top);
            doc.text("Entry Port", left + 300, top);
            doc.text("Order #", left + 400, top);
            top += 60;
            doc.text("Arrange By (Dispatcher)", left, top);
            doc.text("Phone", left + 120, top);
            doc.text("Email", left + 220, top);
            doc.text("Order #", left + 400, top);
            top += 60;
            doc.text("Driver Authorized Signature:", left + 50, top);
            doc.lineCap("butt")
                .moveTo(left + 150, top+10)
                .lineTo(300, top + 10)
                .stroke();
            doc.text("Date:", left + 270, top);
            doc.lineCap("butt")
                .moveTo(left + 300, top+10)
                .lineTo(500, top+10)
                .stroke();
                        
            
            doc.end();
            return {
                url: paths.urls.Path,
                status: 1
            };
        } catch (error) {
            return {
                msg: error,
                status: 0
            };
        }
        
    }
};
