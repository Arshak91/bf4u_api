const db = require('../config/db.config.js');
const Schedule = db.schedules;
// const op = db.Sequelize.Op;
// const seq = db.sequelize;

module.exports = class Load {


    constructor(params) {
        this.data = params.data;        
    }

    async create(){        
        let theSchedule = await Schedule.create({
            driverid: this.data.driverId ? this.data.driverId : null,
            monday: this.data.monday ? this.data.monday : null,
            tuesday: this.data.tuesday ? this.data.tuesday : null,
            wednesday: this.data.wednesday ? this.data.wednesday : null,
            thursday: this.data.thursday ? this.data.thursday : null,
            friday: this.data.friday ? this.data.friday : null,
            saturday: this.data.saturday ? this.data.saturday : null,
            sunday: this.data.sunday ? this.data.sunday : null
        });
        
        return theSchedule;

    }

    async edit() {
        let id = this.data.id, updateSchedule, error;
        delete this.data.id;
        updateSchedule = await Schedule.update({
            driverid: this.data.driverId ? this.data.driverId : null,
            monday: this.data.monday ? this.data.monday : null,
            tuesday: this.data.tuesday ? this.data.tuesday : null,
            wednesday: this.data.wednesday ? this.data.wednesday : null,
            thursday: this.data.thursday ? this.data.thursday : null,
            friday: this.data.friday ? this.data.friday : null,
            saturday: this.data.saturday ? this.data.saturday : null,
            sunday: this.data.sunday ? this.data.sunday : null
        }, {
            where: {
                id: id
            }
        }).catch(err => {
            error = err;
        });
        if (!updateSchedule && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!updateSchedule && !error) {
            return {
                status: 0,
                msg: "such Schedule doesn't exist"
            };
        } else {
            return {status: 1, msg: "ok", data: updateSchedule};
        }
    }
};
