const db = require('../config/db.config.js');
const Order = db.order;
//const Op = db.Sequelize.Op;
const fs = require('fs');

const Helper = require('../classes/helpers');

exports.get = (req, res) => {
    var id = req.params.orderId;

    // generateOrdersInvoice([{}], res);
    // return;

	Order.findOne({
        attributes: ['po'],
		where: {
			id: id
        },
        //include: [{ all: true, nested: false }],
	})
	.then(order => {
        if(order == null){
            res.status(200).send({
                status: 0,
                msg: 'there is no order with given id',
                data: id
            });
            return;
        }

        if(order.po){
            Order.findAll({
                where: {
                    po: order.po
                },
                include: [{ all: true, nested: false }],
            })
            .then(orders => { generateOrdersInvoice(orders, res, req.userId) })
            .catch(err => {
                res.status(500).send({
                    'description': 'Can not access orders table',
                    'error': err.msg
                });
            });
        }else{
            generateOrdersInvoice([order], res, req.userId);
        }
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access orders table',
			'error': err.msg
		});
	});
};


function generateOrdersInvoice(orders, res, userId = 0){
    var invoice = generateInvoiceObject(orders);

    if(invoice == null){
        res.status(500).send({
            'description': 'Not orders',
            'error': err.msg
        });
    }

    // get paths
    var orderId = orders[0].id;
    var paths = Helper.getPaths('invoices', `invoice_${userId}_${orderId}.pdf`, userId);
    /* #region DOC */

    var page = 1;
    var pages = 1;

    // ###################### //
    // START DOC //

    const PDFDocument = require('pdfkit');

    // Create a document
    const doc = new PDFDocument;

    // // Pipe its output somewhere, like to a file or HTTP response
    // // See below for browser usage
    doc.pipe(fs.createWriteStream(paths.filePath));
    
    //
    var left = 50;
    var top = 40;
    var lineHeight = 15;
    var line = 0;
    
    //
    // section 1
    doc.font('app/assets/fonts/PalatinoBold.ttf')
        .fontSize(13);
    doc.text('Arpi Transport Inc. o/a ARCA', left, top + (lineHeight * line++));

    doc.font('app/assets/fonts/DejaVuSans.ttf')
        .fontSize(11);
    doc.text('101 Doney cres', left, top + (lineHeight * line++));
    doc.text('Vaughan ON  L4K 1P6', left, top + (lineHeight * line++));
    doc.text('TEL:905-673-2002  FAX:888-789-1504', left, top + (lineHeight * line++));
    doc.text('dispatch@arcatrans.com', left, top + (lineHeight * line++));

    doc.font('app/assets/fonts/PalatinoBold.ttf')
        .fontSize(13);
    doc.text('Invoice', 495, top + (lineHeight * line++));
    
    var lineTop = top + (lineHeight * line);
    doc.lineCap('butt')
        .moveTo(left, lineTop)
        .lineTo(545, lineTop)
        .stroke();

    //
    // section 2
    top = top + (lineHeight * line) + 20;
    line = 0;

    doc.fontSize(12);
    doc.text('Bill To:', left, top + 20);
    
    doc.font('app/assets/fonts/DejaVuSans.ttf').fontSize(10);

    doc.text(invoice.billToName, left + 50, top + 20);
    doc.text(invoice.billToAddress, left + 50, top + 33, { width: 150, align: 'left' });
    // doc.moveDown();
    // doc.moveDown();
    doc.font('app/assets/fonts/PalatinoBold.ttf').fontSize(12);
    doc.text('Tel:', left + 50, top + 72);
    doc.text(invoice.billToTell, left + 50 + 15, top + 72);
    doc.text('Fax:', left + 50, top + 85);
    doc.text(invoice.billToFax, left + 50 + 15, top + 85);
    
    left = 370;
    doc.font('app/assets/fonts/DejaVuSans.ttf').fontSize(10);

    doc.text('Invoice #:', left, top + 10, { width: 85, align: 'right' });
    doc.text(invoice.InvoiceNumber, left + 90, top + 10, { width: 75, align: 'left' });
    //doc.moveDown();
    doc.text('Invoice Date:', left, top + 23, { width: 85, align: 'right' });
    doc.text(invoice.InvoiceDate, left + 90, top + 23, { width: 75, align: 'left' });
    //doc.moveDown();
    doc.text('Ship Date:', left, top + 36, { width: 85, align: 'right' });
    doc.text(invoice.ShipDate, left + 90, top + 36, { width: 75, align: 'left' });
    //doc.moveDown();
    doc.text('Delivery Date:', left, top + 49, { width: 85, align: 'right' });
    doc.text(invoice.DeliveryDate, left + 90, top + 49, { width: 75, align: 'left' });
    //doc.moveDown();
    doc.text('Cust. Order #:', left, top + 62, { width: 85, align: 'right' });
    doc.text(invoice.CustomerOrderNumber, left + 90, top + 62, { width: 75, align: 'left' });
    //doc.moveDown();
    doc.text('Terms:', left, top + 75, { width: 85, align: 'right' });
    doc.text(invoice.Terms, left + 90, top + 75, { width: 75, align: 'left' });
    //doc.moveDown();
    
    doc.rect(left, top, 180, 95).stroke();

    left = 50;
    top = top + 95 + 25;

    doc.text('Note:', left, top, { width: 40 });
    doc.lineCap('butt')
        .moveTo(left + 40, top + 11)
        .lineTo(545, top + 11)
        .stroke();
    
    doc.lineCap('butt')
        //.dash(5, { space: 3 })
        .moveTo(left, top + 15)
        .lineTo(545, top + 15)
        .dash(6, { space: 4 })
        .stroke()
        .undash();


    //
    // section 3

    left = 50;
    top = top + 15 + 30;

    doc.font('app/assets/fonts/PalatinoBold.ttf').fontSize(11);
    doc.text('Shipper', left, top);
    doc.lineCap('butt')
        .moveTo(left, top + 15)
        .lineTo(295, top + 15)
        .stroke();

    doc.text('Consignee', left + 250, top);
    doc.lineCap('butt')
        .moveTo(left + 250, top + 15)
        .lineTo(545, top + 15)
        .stroke();  

    top = top + 25;
    line = 0;
    doc.font('app/assets/fonts/DejaVuSans.ttf').fontSize(9);

    invoice.shippers.forEach(shipper => {
        doc.text(shipper, left, top + (line++ * 13), { width: 245 });
    });
    line = 0;
    invoice.consingees.forEach(consingee => {
        doc.text(consingee, left + 250, top + (line++ * 13), { width: 245 });
    });
    
    line = invoice.shippers.length >= invoice.consingees.length ? invoice.shippers.length : invoice.consingees.length;
    top = top + line * 13 + 10;
    doc.lineCap('butt')
        .moveTo(left, top)
        .lineTo(545, top)
        .stroke(); 
    doc.font('app/assets/fonts/PalatinoBold.ttf').fontSize(11);
    doc.text('Freight Charge', left, top + 5, { width: 295 });
    doc.text(invoice.balance, left, top + 5, { width: 495, align: 'right' });
    
    doc.lineCap('butt')
        .moveTo(left + 320, top + 38) // 5 + 13 + 20)
        .lineTo(545, top + 38)
        .stroke();

    //
    // section 4
    top = top + 68; // 5 + 13 + 20 + 30
    doc.fontSize(10);

    doc.text(`Invoice Total (${invoice.currency}):`, left + 320, top, { width: 115, align: 'right' });
    doc.text(invoice.total, left + 425, top, { width: 70, align: 'right' });

    top = top + 25;

    doc.text(`This Invoice has been sold and assigned to: ${invoice.assignTo}`, left, top + 1, { width: 265, align: 'left' });
    doc.lineCap('butt').moveTo(left + 320, top).lineTo(545, top).stroke();
    doc.lineCap('butt').moveTo(left + 320, top + 4).lineTo(545, top + 4).stroke();
    doc.text(`Balance Due:`, left + 320, top + 10, { width: 115, align: 'right' });
    doc.text(invoice.balanceDue, left + 425, top + 10, { width: 70, align: 'right' });


    top = top + 38; // 23 + 15

    doc.text(`Send Payment to:`, left, top);
    doc.text(invoice.sendToName, left, top + 12);
    doc.text(invoice.sendToAddress, left, top + 24, { width: 150, align: 'left' });
    doc.text(`TEL: ${invoice.sendToTel} FAX: ${invoice.sendToFax}`, left, top + 48);
    doc.text(`email: ${invoice.sendToEmail}`, left, top + 60);


    // footer
    let bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.lineCap('butt').moveTo(left, doc.page.height - 40).lineTo(545, doc.page.height - 40).stroke();
    doc.text(`Page     ${page}  of  ${pages}`,
        left,
        doc.page.height - 35,
        {
            width: 475,
            align: 'right',
            lineBreak: false,
        });
    // Reset text writer position (?)
    doc.text('', 50, 50);
    doc.page.margins.bottom = bottom;

    
    // var w = doc.widthOfString("Bill To:  ");
    // var h = doc.heightOfString("hello world");
    // console.log(w, h)

    // Finalize PDF file
    doc.end();

    // END DOC //
    // ###################### //
    
    /* #endregion */


    // send result
    res.status(200).send({
        status: 1,
        msg: 'Ok',
        data: paths.urls
    });
}


function generateInvoiceObject(orders){
    
    if(orders.length == 0){
        return null;
    }

    var order = orders[0];

    var invoice = {
        billToName: order.customer.companyName,
        billToAddress: order.customer.Address_p,
        billToTell: order.customer.phone1,
        billToFax: order.customer.phone2,

        InvoiceNumber: 'xxxxxxxxxxxxxxxxxxxxxxxxx', // authogenerated, // '8604',
        InvoiceDate: Helper.getDateFormated(), // '07/19/19',
        ShipDate: Helper.getDateFormated(), // '07/05/19',
        DeliveryDate: Helper.getDateFormated(order.deliverydateFrom), // '07/17/19',
        CustomerOrderNumber: order.orderNumber, // 'C002401',
        Terms: '',

        // shippers: [order.pickupCompanyName],
        // consingees: [order.deliveryCompanyName],
        shippers: [],
        consingees: [],
        // shippers: [order.pickupCompanyName + ' ' + order.pickupStreetAddress],
        // consingees: [order.deliveryCompanyName + ' ' + order.deliveryStreetAddress],
        balance: 0, // order.rate.toString(),

        currency: order.currency,
        total: 0, // order.rate.toString(), // total rate for many orders
        assignTo: order.customer.companyName, // 'Baron Finance',
        balanceDue: 0, // order.rate.toString(), // total rate for many orders

        sendToName: order.customer.companyName,
        sendToAddress: order.customer.Address_p,
        sendToTel: order.customer.phone1, 
        sendToFax: order.customer.phone2,
        sendToEmail: order.customer.email
    };
    
    orders.forEach(o => {
        invoice.total += Number(o.rate);
        invoice.balanceDue += Number(o.rate);
        invoice.rate += o.rate | o.flatRate;

        var sh = o.pickupCompanyName + ' ' + o.pickupStreetAddress;
        var exist = false;
        invoice.shippers.forEach(sh0 => {
            if(sh0 == sh){
                exist = true;
            }
        });
        if(!exist){
            invoice.shippers.push(sh);
        }

        var c = o.deliveryCompanyName + ' ' + o.deliveryStreetAddress;
        exist = false;
        invoice.consingees.forEach(c0 => {
            if(c0 == c){
                exist = true;
            }
        });
        if(!exist){
            invoice.consingees.push(c);
        }
    });


    return invoice;
}



exports.file = (req, res, next) => {
    req.urlBasedDirectory = 'invoices';
    next();
};