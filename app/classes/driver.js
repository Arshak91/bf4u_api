const db = require('../config/db.config.js');
const Driver = db.driver;
// const op = db.Sequelize.Op;
// const seq = db.sequelize;

module.exports = class Load {


    constructor(params) {
        this.data = params.data;        
    }

    async create(){        
        let theDriver = await Driver.create({
            carrierId: this.data.carrierId ? this.data.carrierId : 0, 
            equipmentId: this.data.equipmentId ? this.data.equipmentId : 0,
            assetId: this.data.assetId ? this.data.assetId : null,
            shiftId: this.data.shiftId ? this.data.shiftId : 0, 
            scheduleid: 0, 
            depotId: this.data.depotId ? this.data.depotId : 0, 
            
            type: this.data.type ? this.data.type : null,  
            eqType: this.data.eqType ? this.data.eqType : null, 
            status: this.data.status ? this.data.status : null, 
            startTime: this.data.startTime ? this.data.startTime : null, 
            endTime: this.data.endTime ? this.data.endTime : null,  

            fname: this.data.fname ? this.data.fname : null, 
            lname: this.data.lname ? this.data.lname : null, 
            email: this.data.email ? this.data.email : null, 
            address: ` ${this.data.streetaddress || ''} , 
                    ${this.data.city || ''} , 
                    ${this.data.state || ''} , 
                    ${this.data.zip || ''} , 
                    ${this.data.country || ''}`, 
            
            streetaddress: this.data.streetaddress  ? this.data.streetaddress : null,
            city: this.data.city  ? this.data.city : null,
            state: this.data.state  ? this.data.state : null,
            zip: this.data.zip  ? this.data.zip : null,
            country: this.data.country ? this.data.country : null,
            countryCode: this.data.countryCode  ? this.data.countryCode : null,

            phone: this.data.phone  ? this.data.phone : null,

            rate: this.data.rate ? this.data.rate : null,
            hourlyRate: this.data.hourlyRate ? this.data.hourlyRate : null,
            perMileRate: this.data.perMileRate ? this.data.perMileRate : null,
            percentRate: this.data.percentRate ? this.data.percentRate : null,
            bonuses: this.data.bonuses ? this.data.bonuses : null,
            fuelsurcharge: this.data.fuelsurcharge ? this.data.fuelsurcharge : null,
            detention: this.data.detention ? this.data.detention : null,

            dob: this.data.dob ? this.data.dob : null,
            hdate: this.data.dob ? this.data.dob : null,

            easypass: this.data.easypass ? this.data.easypass : 0,
            ex_rev_per_mile: this.data.ex_rev_per_mile ? this.data.ex_rev_per_mile : 0,
            ex_rev_goal_week: this.data.ex_rev_goal_week ? this.data.ex_rev_goal_week :0 ,
            lengthofhaul_min: this.data.lengthofhaul_min ? this.data.lengthofhaul_min : 0, 
            lengthofhaul_max: this.data.lengthofhaul_min ? this.data.lengthofhaul_min : 0,
            use_sleeper_b_p: this.data.use_sleeper_b_p ? this.data.use_sleeper_b_p : 0,
            drivinglicence: this.data.drivinglicence ? this.data.drivinglicence : null,
            throughStates: this.data.throughStates ? this.data.throughStates : 0,
            pickupDeliveryStates: this.data.pickupDeliveryStates ? this.data.pickupDeliveryStates : null,
            prefTruckStops: this.data.prefTruckStops ? this.data.prefTruckStops : null,
            tollRoutes: this.data.tollRoutes ? this.data.tollRoutes : null,
            routeNumber: this.data.routeNumber ? this.data.routeNumber : null

        });
        
        return theDriver;

    }

    async edit() {
        let id = this.data.id, updateDriver, error;
        delete this.data.id;
        updateDriver = await Driver.update({
            carrierId: this.data.carrierId ? this.data.carrierId : null,
            equipmentId: this.data.equipmentId ? this.data.equipmentId : null,
            assetId: this.data.assetId ? this.data.assetId : null,
            shiftId: this.data.shiftId ? this.data.shiftId : 0,
            depotId: this.data.depotId ? this.data.depotId : null,
            scheduleid: this.data.scheduleid ? this.data.scheduleid : 0,
            type: this.data.type ? this.data.type : null,
            status: this.data.status ? this.data.status : null,
            startTime: this.data.startTime ? this.data.startTime : null,
            endTime: this.data.endTime ? this.data.endTime : null,
    
            fname: this.data.fname ? this.data.fname : null,
            lname: this.data.lname ? this.data.lname : null,
            email: this.data.email ? this.data.email : null,
            phone: this.data.phone ? this.data.phone : null,
    
            address: this.data.address ? this.data.address : null,
            streetaddress: this.data.streetaddress ? this.data.streetaddress : null,
            city: this.data.city ? this.data.city : null,
            state: this.data.state ? this.data.state : null,
            zip: this.data.zip ? this.data.zip : null,
            country: this.data.country ? this.data.country : null,
            countryCode: this.data.countryCode ? this.data.countryCode : null,
    
            rate: this.data.rate ? this.data.rate : null,
            hourlyRate: this.data.hourlyRate ? this.data.hourlyRate : null,
            perMileRate: this.data.perMileRate ? this.data.perMileRate : null,
            percentRate: this.data.percentRate ? this.data.percentRate : null,
            bonuses: this.data.bonuses ? this.data.bonuses : null,
            fuelsurcharge: this.data.fuelsurcharge ? this.data.fuelsurcharge : null,
            detention: this.data.detention ? this.data.detention : null,
    
            dob: this.data.dob ? this.data.dob : null,
            hdate: this.data.hdate ? this.data.hdate : null,
    
            easypass: this.data.easypass ? this.data.easypass : null,
            ex_rev_per_mile: this.data.ex_rev_per_mile ? this.data.ex_rev_per_mile : null,
            ex_rev_goal_week: this.data.ex_rev_goal_week ? this.data.ex_rev_goal_week : null,
            lengthofhaul_min: this.data.lengthofhaul_min ? this.data.lengthofhaul_min : null,
            lengthofhaul_max: this.data.lengthofhaul_min ? this.data.lengthofhaul_min : null,
            use_sleeper_b_p: this.data.use_sleeper_b_p ? this.data.use_sleeper_b_p : null,
    
            throughStates: this.data.throughStates ? this.data.throughStates : null, 
            pickupDeliveryStates: this.data.pickupDeliveryStates ? this.data.pickupDeliveryStates : null,
            prefTruckStops: this.data.prefTruckStops ? this.data.prefTruckStops : null,
            drivinglicence: this.data.drivinglicence ? this.data.drivinglicence : null,
            tollRoutes: this.data.tollRoutes ? this.data.tollRoutes : null,
            eqType: this.data.eqType ? this.data.eqType : null,
            mobileActive: this.data.mobileActive ? this.data.mobileActive : null,
        }, {
            where: {
                id: id
            }
        }).catch(err => {
            error = err;
        });
        if (!updateDriver && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!updateDriver && !error) {
            return {
                status: 0,
                msg: "such driver doesn't exist"
            };
        } else {
            return {status: 1, msg: "ok", data: updateDriver};
        }
    }
};
