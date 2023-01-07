const Helper = require('../classes/helpers');
const fs = require('fs');
const db = require('../config/db.config.js');
const Order = db.order;
//const Op = db.Sequelize.Op;


exports.get = (req, res) => {
    var id = req.params.loadId;
	Order.findOne({
		where: {
			id: id
		}
	})
	.then(order => {

        var fileName = `settlement_${id}.pdf`;
        var settlement = [
            `http://localhost:8080/api/settlements/pdf/${fileName}`,
            `http://app.bestfleet4u.com/api/settlements/pdf/${fileName}`,
        ];

        const PDFDocument = require('pdfkit');

        // Create a document
        const doc = new PDFDocument();

        // // Pipe its output somewhere, like to a file or HTTP response
        // // See below for browser usage
        
        doc.pipe(fs.createWriteStream(`resources/${fileName}`));

        // Embed a font, set the font size, and render some text
        doc.font('app/assets/fonts/PalatinoBold.ttf')
        .fontSize(25)
        .text('Best Fleet For U!', 100, 100);

        // Add an image, constrain it to a given size, and center it vertically and horizontally
        doc.image('resources/logo.png', {
            fit: [250, 300],
            align: 'center',
            valign: 'center'
        });

        // // Add another page
        // doc.addPage()
        // .fontSize(25)
        // .text('Here is some vector graphics...', 100, 100);
        // // Draw a triangle
        // doc.save()
        // .moveTo(100, 150)
        // .lineTo(100, 250)
        // .lineTo(200, 250)
        // .fill("#FF3300");

        // // Apply some transforms and render an SVG path with the 'even-odd' fill rule
        // doc.scale(0.6)
        // .translate(470, -380)
        // .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
        // .fill('red', 'even-odd')
        // .restore();

        // Add some text with annotations
        doc.addPage()
        .fillColor("blue")
        .text('Here is a link!', 100, 100)
        .underline(100, 100, 160, 27, {color: "#0000FF"})
        .link(100, 100, 160, 27, 'http://app.bestfleet4u.com/');

        // Finalize PDF file
        doc.end();

		res.status(200).send({
			status: 1,
			msg: 'Ok',
			data: settlement
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access orders table',
			'error': err.msg
		});
	});
};

exports.getDriverSettlement = (req, res) => {

    var id = req.params.id;
    var from = req.query.from;
    var to = req.query.to;

    console.log(id, from, to);

    generateDriverSettlement(res, id, from, to, [{}], req.userId);
};

function generateDriverSettlement(res, id, from, to, orders, userId){
    var settlement = generateSettlementObject(orders);

    // var fileName = `settlement_driver_${id}_${from}_${to}.pdf`
    // var settlementPath = [
    //     `http://localhost:8080/api/settlements/pdf/${fileName}`,
    //     `http://app.bestfleet4u.com/api/settlements/pdf/${fileName}`
    // ]

    // get paths
    var paths = Helper.getPaths('settlements', `settlement_driver_${userId}_${id}_${from}_${to}.pdf`, userId);

    /* #region DOC */
    
    var page = 1;
    var pages = 1;

    // ###################### //
    // START DOC //

    const PDFDocument = require('pdfkit');

    // Create a document
    const doc = new PDFDocument({
        margin: 20
    });

    // // Pipe its output somewhere, like to a file or HTTP response
    // // See below for browser usage
    
    doc.pipe(fs.createWriteStream(paths.filePath));

    //
    var left = 20; // 50
    var top = 30; // 40
    var lineHeight = 15;
    var line = 0;
    
    left = 50;

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
    doc.text('Payment Statement', 495, top + (lineHeight * line++));
    
    var lineTop = top + (lineHeight * line);
    doc.lineCap('butt')
        .moveTo(left, lineTop)
        .lineTo(585, lineTop)
        .stroke();


    //
    // section 2
    top = top + (lineHeight * line) + 20;
    line = 0;

    doc.fontSize(12);
    doc.text('Pay To:', left, top + 20);
    
    doc.font('app/assets/fonts/DejaVuSans.ttf').fontSize(10);

    doc.text(settlement.billToName, left + 50, top + 20);
    doc.text(settlement.billToAddress, left + 50, top + 33, { width: 150, align: 'left' });
    // doc.moveDown();
    // doc.moveDown();
    doc.font('app/assets/fonts/PalatinoBold.ttf').fontSize(12);
    doc.text('Tel:', left + 50, top + 72);
    doc.text(settlement.billToTell, left + 50 + 15, top + 72);
    doc.text('Fax:', left + 50, top + 85);
    doc.text(settlement.billToFax, left + 50 + 15, top + 85);


    left = 350;
    doc.font('app/assets/fonts/DejaVuSans.ttf').fontSize(10);

    doc.text('Invoice #:', left, top + 10, { width: 85, align: 'right' });
    doc.text(settlement.statementNumber, left + 90, top + 10, { width: 115, align: 'left' });
    //doc.moveDown();
    doc.text('Reference #:', left, top + 23, { width: 85, align: 'right' });
    doc.text(settlement.referenceNumber, left + 90, top + 23, { width: 115, align: 'left' });
    //doc.moveDown();
    doc.text('Checue #:', left, top + 36, { width: 85, align: 'right' });
    doc.text(settlement.chequeNumber, left + 90, top + 36, { width: 115, align: 'left' });
    //doc.moveDown();
    doc.text('Date:', left, top + 49, { width: 85, align: 'right' });
    doc.text(settlement.date, left + 90, top + 49, { width: 115, align: 'left' });
    //doc.moveDown();
    doc.text('Pay Period:', left, top + 62, { width: 85, align: 'right' });
    doc.text(settlement.payPeriod, left + 90, top + 62, { width: 115, align: 'left' });
    //doc.moveDown();
    doc.text('Amount:', left, top + 75, { width: 85, align: 'right' });
    doc.text(settlement.amount, left + 90, top + 75, { width: 115, align: 'left' });
    //doc.moveDown();
    
    doc.rect(left, top, 220, 95).stroke();

    left = 20;
    top = top + 95 + 25;

    doc.text('Note:', left + 30, top, { width: 40 });
    doc.lineCap('butt')
        .moveTo(left + 30 + 40, top + 11)
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

    left = 20;
    top = top + 15 + 30;

    // loads: [
    //     {
    //         tripId: 22236,
    //         TL: 1,
    //         Weight: 30000,
    //         Type: '%',
    //         OrgFreight: '1,100.00',
    //         Percent: '75.0%',
    //         Freight: '825.00',
    //         Add: '0.00',
    //         Ded: '0.00',
    //         FedAdd: '0.00',
    //         ProvAdd: '0.00',
    //         Total: '825.00',
    //         AddInfo: []
    //     },

    var rows = [];
    
    settlement.loads.forEach(l => {
        rows.push([
            l.tripId.toString(),
            l.TL.toString(),
            l.Weight.toString(),
            l.Type.toString(),
            l.OrgFreight,
            l.Percent,
            l.Freight,
            l.Add,
            l.Ded,
            l.FedAdd,
            l.ProvAdd,
            l.Total
        ]);
    });

    const table0 = {
        headers: [ 'Trip#', 'T/L', 'Wgt.', 'Type', 'Org. Freight', 'Per.', 'Freight', 'Add', 'Ded', 'Fed. Add', 'Prov. Add', 'Total' ],
        rows: rows 
    };
    
    doc.table(table0, {
        // prepareHeader: () => doc.font('Helvetica-Bold'),
        // prepareRow: (row, i) => doc.font('Helvetica').fontSize(12)
    });





    // doc.font('app/assets/fonts/PalatinoBold.ttf').fontSize(11);
    // doc.text('Shipper', left, top)
    // doc.lineCap('butt')
    //     .moveTo(left, top + 15)
    //     .lineTo(295, top + 15)
    //     .stroke();

    // doc.text('Consignee', left + 250, top)
    // doc.lineCap('butt')
    //     .moveTo(left + 250, top + 15)
    //     .lineTo(545, top + 15)
    //     .stroke();  

    // top = top + 25
    // line = 0
    // doc.font('app/assets/fonts/DejaVuSans.ttf').fontSize(9);

    // settlement.shippers.forEach(shipper => {
    //     doc.text(shipper, left, top + (line++ * 13), { width: 245 })
    // });
    // line = 0
    // settlement.consingees.forEach(consingee => {
    //     doc.text(consingee, left + 250, top + (line++ * 13), { width: 245 })
    // });
    
    // line = settlement.shippers.length >= settlement.consingees.length ? settlement.shippers.length : settlement.consingees.length
    // top = top + line * 13 + 10
    // doc.lineCap('butt')
    //     .moveTo(left, top)
    //     .lineTo(545, top)
    //     .stroke(); 
    // doc.font('app/assets/fonts/PalatinoBold.ttf').fontSize(11);
    // doc.text('Freight Charge', left, top + 5, { width: 295 })
    // doc.text(settlement.balance, left, top + 5, { width: 495, align: 'right' })
    
    // doc.lineCap('butt')
    //     .moveTo(left + 320, top + 38) // 5 + 13 + 20)
    //     .lineTo(545, top + 38)
    //     .stroke();




    //
    // section 4
    top = top + 68; // 5 + 13 + 20 + 30
    doc.fontSize(10);

    doc.text(`Invoice Total (${settlement.currency}):`, left + 320, top, { width: 115, align: 'right' });
    doc.text(settlement.total, left + 425, top, { width: 70, align: 'right' });

    top = top + 25;

    doc.text(`This Invoice has been sold and assigned to: ${settlement.assignTo}`, left, top + 1, { width: 265, align: 'left' });
    doc.lineCap('butt').moveTo(left + 320, top).lineTo(545, top).stroke();
    doc.lineCap('butt').moveTo(left + 320, top + 4).lineTo(545, top + 4).stroke();
    doc.text(`Balance Due:`, left + 320, top + 10, { width: 115, align: 'right' });
    doc.text(settlement.balanceDue, left + 425, top + 10, { width: 70, align: 'right' });


    top = top + 38; // 23 + 15

    doc.text(`Send Payment to:`, left, top);
    doc.text(settlement.sendToName, left, top + 12);
    doc.text(settlement.sendToAddress, left, top + 24, { width: 150, align: 'left' });
    doc.text(`TEL: ${settlement.sendToTel} FAX: ${settlement.sendToFax}`, left, top + 48);
    doc.text(`email: ${settlement.sendToEmail}`, left, top + 60);


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


function generateSettlementObject(id, from, to, orders){

    var settlement = {
        name: 'Arcatrans Inc.',
        address: '101 Doney Cres Concord ON L4K 1P6',
        phone: '905-673-2002',
        fax: '888-789-1504',
        email: 'info@arcatrans.com',

        billToName: '2135806 Ontario Ltd., Attn: Evgenii Kasparian',
        billToAddress: '114 Southdown Ave Vaughan ON L6A4N3',
        billToTell: '19292139995',
        billToFax: '',

        statementNumber: '1524',
        referenceNumber: '',
        chequeNumber: '1327',
        date: '11/04/19',
        payPeriod: '11/04/19 to 11/04/19',
        amount: '887.45 CAD',

        note: 'One order in USD 1275-25%=956.25-25(for logbook)=931.25 USD',


        loads: [
            {
                tripId: 22236,
                TL: 1,
                Weight: 30000,
                Type: '%',
                OrgFreight: '1,100.00',
                Percent: '75.0%',
                Freight: '825.00',
                Add: '0.00',
                Ded: '0.00',
                FedAdd: '0.00',
                ProvAdd: '0.00',
                Total: '825.00',
                AddInfo: []
            },
            {
                tripId: 22138,
                TL: 0,
                Weight: 0,
                Type: '%',
                OrgFreight: '4,033.00',
                Percent: '75.0%',
                Freight: '3,024.75',
                Add: '0.00',
                Ded: '400.00',
                FedAdd: '0.00',
                ProvAdd: '0.00',
                Total: '2624.75',
                AddInfo: [
                    ['For 2 pick up zone 3', '-200.00'],
                    ['For pick up zone 2', '-75.00'],
                    ['For pick up zone 4', '-125.00']
                ]
            },

            {
                tripId: 22236,
                TL: 1,
                Weight: 30000,
                Type: '%',
                OrgFreight: '1,100.00',
                Percent: '75.0%',
                Freight: '825.00',
                Add: '0.00',
                Ded: '0.00',
                FedAdd: '0.00',
                ProvAdd: '0.00',
                Total: '825.00',
                AddInfo: []
            },
            {
                tripId: 22138,
                TL: 0,
                Weight: 0,
                Type: '%',
                OrgFreight: '4,033.00',
                Percent: '75.0%',
                Freight: '3,024.75',
                Add: '0.00',
                Ded: '400.00',
                FedAdd: '0.00',
                ProvAdd: '0.00',
                Total: '2624.75',
                AddInfo: [
                    ['For 2 pick up zone 3', '-200.00'],
                    ['For pick up zone 2', '-75.00'],
                    ['For pick up zone 4', '-125.00']
                ]
            }
        ],


        shippers: ['CANEX GLOBAL LOGISTICS Mississauga ON L5N 2M2'],
        consingees: ['Bunzl York York PA 17406'],
        balance: '600.00',

        currency: 'CAD',
        total: '600.00',
        assignTo: 'Baron Finance',
        balanceDue: '600.00',

        sendToName: 'Baron Finance',
        sendToAddress: '27 Roytec Road, Unit 11 Woodbridge, ON CA L4L 8E3',
        sendToTel: '905-761-1180',
        sendToFax: '',
        sendToEmail: 'TYamchshikova@baronfinance.com'
    };

    return settlement;
}


exports.file = (req, res, next) => {
    req.urlBasedDirectory = 'settlements';
    next();
};