const Helper = require('../classes/helpers');
const db = require('../config/db.config.js');
const fs = require('fs');

const Order = db.order;

exports.get = (req, res) => {
    var id = req.params.orderId;

	Order.findOne({
        attributes: ['po'],
		where: {
			id: id
        },
        include: [{ all: true, nested: false }],
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
                }
            })
            .then(orders => { generateBOL(orders, res) })
            .catch(err => {
                res.status(500).send({
                    'description': 'Can not access orders table',
                    'error': err.msg
                });
            });
        }else{
            generateBOL([order], res);
        }
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access orders table',
			'error': err.msg
		});
	});
};


function generateBOL(orders, res){
    var bol = generateBOLObject(orders)

    if(bol == null){
        res.status(500).send({
            'description': 'Not orders',
            'error': err.msg
        });
    }


    // get paths
    var paths = Helper.getPaths('bols', `bol_${orders[0].id}.pdf`, userId)

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
    
    var lineTop = top + (lineHeight * line)
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

    doc.text(bol.billToName, left + 50, top + 20)
    doc.text(bol.billToAddress, left + 50, top + 33, { width: 150, align: 'left' });
    // doc.moveDown();
    // doc.moveDown();
    doc.font('app/assets/fonts/PalatinoBold.ttf').fontSize(12);
    doc.text('Tel:', left + 50, top + 72);
    doc.text(bol.billToTell, left + 50 + 15, top + 72);
    doc.text('Fax:', left + 50, top + 85);
    doc.text(bol.billToFax, left + 50 + 15, top + 85);

    
    left = 370;
    doc.font('app/assets/fonts/DejaVuSans.ttf').fontSize(10);

    doc.text('Invoice #:', left, top + 10, { width: 85, align: 'right' })
    doc.text(bol.InvoiceNumber, left + 90, top + 10, { width: 75, align: 'left' })
    //doc.moveDown();
    doc.text('Invoice Date:', left, top + 23, { width: 85, align: 'right' })
    doc.text(bol.InvoiceDate, left + 90, top + 23, { width: 75, align: 'left' })
    //doc.moveDown();
    doc.text('Ship Date:', left, top + 36, { width: 85, align: 'right' })
    doc.text(bol.ShipDate, left + 90, top + 36, { width: 75, align: 'left' })
    //doc.moveDown();
    doc.text('Delivery Date:', left, top + 49, { width: 85, align: 'right' })
    doc.text(bol.DeliveryDate, left + 90, top + 49, { width: 75, align: 'left' })
    //doc.moveDown();
    doc.text('Cust. Order #:', left, top + 62, { width: 85, align: 'right' })
    doc.text(bol.CustomerOrderNumber, left + 90, top + 62, { width: 75, align: 'left' })
    //doc.moveDown();
    doc.text('Terms:', left, top + 75, { width: 85, align: 'right' })
    doc.text(bol.Terms, left + 90, top + 75, { width: 75, align: 'left' })
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

    bol.shippers.forEach(shipper => {
        doc.text(shipper, left, top + (line++ * 13), { width: 245 });
    });
    line = 0;
    bol.consingees.forEach(consingee => {
        doc.text(consingee, left + 250, top + (line++ * 13), { width: 245 });
    });
    
    line = bol.shippers.length >= bol.consingees.length ? bol.shippers.length : bol.consingees.length;
    top = top + line * 13 + 10;
    doc.lineCap('butt')
        .moveTo(left, top)
        .lineTo(545, top)
        .stroke(); 
    doc.font('app/assets/fonts/PalatinoBold.ttf').fontSize(11);
    doc.text('Freight Charge', left, top + 5, { width: 295 })
    doc.text(bol.balance, left, top + 5, { width: 495, align: 'right' })
    
    doc.lineCap('butt')
        .moveTo(left + 320, top + 38) // 5 + 13 + 20)
        .lineTo(545, top + 38)
        .stroke();

    //
    // section 4
    top = top + 68 // 5 + 13 + 20 + 30
    doc.fontSize(10)

    doc.text(`Invoice Total (${bol.currency}):`, left + 320, top, { width: 115, align: 'right' })
    doc.text(bol.total, left + 425, top, { width: 70, align: 'right' })

    top = top + 25

    doc.text(`This Invoice has been sold and assigned to: ${bol.assignTo}`, left, top + 1, { width: 265, align: 'left' })
    doc.lineCap('butt').moveTo(left + 320, top).lineTo(545, top).stroke();
    doc.lineCap('butt').moveTo(left + 320, top + 4).lineTo(545, top + 4).stroke();
    doc.text(`Balance Due:`, left + 320, top + 10, { width: 115, align: 'right' })
    doc.text(bol.balanceDue, left + 425, top + 10, { width: 70, align: 'right' })


    top = top + 38 // 23 + 15

    doc.text(`Send Payment to:`, left, top)
    doc.text(bol.sendToName, left, top + 12)
    doc.text(bol.sendToAddress, left, top + 24, { width: 150, align: 'left' })
    doc.text(`TEL: ${bol.sendToTel} FAX: ${bol.sendToFax}`, left, top + 48)
    doc.text(`email: ${bol.sendToEmail}`, left, top + 60)


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

// generate gol object
function generateBOLObject(orders){
    if(orders.length == 0){
        return null;
    }

    var order = orders[0]
    
    var bol = {
        date: Helper.getDateFormated(),
        bolNumber: '000000', // authogenerated, // '8787',
        shipFromName: order.customer.companyName,
        shipFromAddress: order.customer.Address_p,
        shipFromCityStateZip: `${order.customer.city} ${order.customer.state}`,
        shipFromSID: '',
        shipFromFOB: false,

        shipToName: order.customer.companyName,
        shipToAddress: order.customer.Address_p,
        shipToCityStateZip: `${order.customer.city} ${order.customer.state}`,
        shipToSID: '',
        shipToFOB: false,
        shipToLocaionNumber: '',


        thirdPartyName: '',
        thirdPartyAddress: '',
        thirdPartyCityStateZip: '',

        specialInstructions: '',

        carrierName: '',
        trailerNumber: '560',
        sealNumber: '',

        scac: '',
        proNumber: '',

        customerOrders: [],
        carrierInformation: {
            weight: 0
        },

        amountCurrency: '$',
        amount: '',
        feeTermsCollect: false,
        feeTermsPrepaid: false
    }

    orders.forEach(order => {
        var pkgs = 0;
        if (order.HandlingUnits.length > 0 
                && order.HandlingUnits[0].Items != undefined 
                && order.HandlingUnits[0].Items.length != undefined){
            order.HandlingUnits.forEach(hu => {
                pkgs += hu.Items.length
            })
        } else {
            pkgs += order.HandlingUnits.length
        }

        bol.customerOrders.push({
            number: order.orderNumber,
            pkgs: pkgs,
            weight: order.weight,
            pallet: true,
            slip: false
        })
    });
    
    bol.customerOrders.forEach(bco => {
        bco.carrierInformation += bco.weight
    })
    
    return bol
}


exports.file = (req, res, next) => {
    req.urlBasedDirectory = 'bols';
    next();
};