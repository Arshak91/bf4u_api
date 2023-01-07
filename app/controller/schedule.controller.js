const db = require('../config/db.config.js');
const Schedule = db.schedules;


exports.get = async (req, res) => {
    console.log(req.params.id);
    const id = req.params.id;

    Schedule.findOne({
        where: {
            id: id
        }
    })
    .then(schedule => {
        res.status(200).send({
            status: 1,
            msg: 'ok',
            data: schedule
        });
    }).catch(err => {
        res.status(500).send({
            'description': 'Can not access Schedule table',
            'error': err.msg
        });
    });
};

