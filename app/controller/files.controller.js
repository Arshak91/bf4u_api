const fs = require('fs');
const mime = require('mime');


exports.get = async (req, res) => {
    let fn = req.params.file;
    
    // get user id based directory for carriers, shippers
    const userIdBasedDir = req.userId | 0;
    const path = `resources/${userIdBasedDir}/${req.urlBasedDirectory}/${fn}`;

    //var path = `resources/${fn}`;
    fs.readFile(path, (err, data) => {
        res.contentType(mime.getType(fn));
        res.send(data);
    });
};

exports.download = (req, res) => {
    var fn = req.params.file;

    // get user id based directory for carriers, shippers
    var userIdBasedDir = userId
    var path = `resources/${userIdBasedDir}/${req.urlBasedDirectory}/${fn}`;

    //var path = `resources/${fn}`;
    var file = fs.createReadStream(path);
    var stat = fs.statSync(path);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fn}`);
    file.pipe(res);
};

//
// temp function yet -> maybe need transfer to orders controller

exports.upload = (req, res) => {
    const file = req.files.file;
    
    // get correct path for file upload
    const path = 'resources/' + file.name;

    file.mv(path, (error) => {
        if (error) {
            console.error(error);
            res.status(500).send({ status: 'error', message: error });
            return;
        }

        res.status(200).send({ 
            status: 'success', 
            path: {
                show: `http://localhost:8080/api/files/${file.name}`,
                download: `http://localhost:8080/api/files/download/${file.name}`
            }
        });
    });
};