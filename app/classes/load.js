const db = require('../config/db.config.js');
// const op = db.Sequelize.Op;
// const seq = db.sequelize;

module.exports = class Load {


    constructor(params) {
        this.data = params.data;
        this.temp = params.temp;
        
    }

    async create(){
        let load;    
        if(this.temp) {
            load = db.loadTemp;
        } else {
            load = db.load;
        }
        
        let theLoad = await load.create({
            nickname: this.data.nickname,
            equipmentId: this.data.equipmentName,
            carrierId: 27, // this.data.carrierId,
            driverId: this.data.driverId,
            depoId: this.data.depoId,
            shiftId: this.data.driverId ? this.data.driver.dataValues.shiftId : 1,
            orders: this.data.orders,
            stops: this.data.order.length,
            flowType: this.data.flowType,
            startAddress: this.data.startAddress,
            endAddress: this.data.endAddress,
            weight: this.data.weight,
            feet: this.data.feet,
            //cost: data.cost,
            status: 0,
            freezed: 0,
            fuelSurcharge: this.data.fuelSurcharge,
            loadCost: this.data.loadCost,
            loadCostPerMile: this.data.loadCostPerMile,
            startTime: this.data.startTime,
            endTime: this.data.endTime,
            comment: this.data.comment,
            totalcases: this.data.totalcases,
            cube: this.data.cube,
            feelRates: this.data.feelRates,
            permileRates: this.data.permileRates,
            return: this.data.ret,
            planType: this.data.planType,
            disabled: 0,
        });
        
        return theLoad;

    }

    async edit() {
        let load;    
        if(this.temp) {
            load = db.loadTemp;
        } else {
            load = db.load;
        }
        let id = this.data.id, updateLoad, error;
        delete this.data.id;
        updateLoad = await load.update({
            nickname: this.data.nickname,
            driverId: this.data.driverId,
            equipmentId: this.data.equipmentId ? this.data.equipmentId : 0,
            assetsId: this.data.assetsId ? this.data.assetsId : 0,
            loadCost: this.data.loadCost,
            status: this.data.status,
            startTime: this.data.startTime,
            endTime: this.data.endTime,
            warning: this.data.warning,
            warningData: this.data.warningData
        }, {
            where: {
                id: id
            }
        }).catch(err => {
            error = err;
        });
        if (!updateLoad && error) {
            return {
                status: 0,
                msg: error.message
            };
        } else if(!updateLoad && !error) {
            return {
                status: 0,
                msg: "such Product doesn't exist"
            };
        } else {
            return {status: 1, msg: "ok", data: updateLoad};
        }
    }
};
