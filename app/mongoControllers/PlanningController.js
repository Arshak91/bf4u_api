const Planning = require('../mongoModels/PlanningModel');

exports.getAll = async (req, res) => {
    
    try {
        let page = req.query.page ? Math.max(0, req.query.page*1) : Math.max(0, 1);
        let perPage = req.query.limit ? req.query.limit*1 : 10;        
        Planning.find().sort( [['_id', -1]] ).limit(perPage).skip(perPage * (page - 1))
            .then(async (plannings) => {
                let ct = await Planning.countDocuments();

                // plannings.forEach(p=>{
                //     p.ordersDatas = []
                //     p.orders = []      
                //     console.log(p)
                // })

                const planns = []
                for(let i = 0; i < ct; i++){
                    if(plannings[i]){
                        plannings[i]['ordersDatas'] = []
                        planns.push(plannings[i])
                    }
                    // console.log(plannings[i])
                }

                //console.log(ct);
                res.json({
                    status: 1,
                    msg: 'ok',
                    data: {
                        loads: planns, // plannings,
                        total: ct
                    }
                });
            });
    } catch (error) {
        res.json({error});
    }
};







// exports.creatTempLoads = async (req, res) => {
//     try {
//         console.log(req.body);
        
//         let uuid = req.body[0].UUID,
//         status = [],
//         eta = [],
//         percentage = [],
//         loadOrderIds = [],
//         drivingminutes = [],
//         totalRunTime = [],
//         totalDistance = [],
//         totalDuration = [],
//         Infeasible = [],
//         loads = [],
//         InfeasibleCount = 0,
//         loadsCount = 0,
//         flag = false,
//         jobUpdate;
        
//         for (const load of req.body) {
//             if (load.Status == 3) {
//                 flag = true;
//                 let { data } = await Algopost.createLoadTemp(load);
//                 status.push(data.status);
//                 eta.push(data.eta);
//                 percentage.push(data.percentage);
//                 loadOrderIds.push(data.loadOrderIds);
//                 drivingminutes.push(data.drivingminutes);
//                 totalRunTime.push(data.totalRunTime);
//                 totalDistance.push(data.totalDistance);
//                 totalDuration.push(data.totalDuration);
//                 Infeasible = Infeasible.concat(data.Infeasible);
//                 loads = loads.concat(data.loads);
//                 InfeasibleCount += data.Infeasible.length;
//                 loadsCount += data.loads.length;
//             } else {
//                 status.push(load.Status);
//                 eta.push(load.ETA);
//                 percentage.push(load.percentage);
//                 InfeasibleCount += load.InfeasibleCount;
//                 Infeasible = Infeasible.concat(load.Infeasibles);
//             }
            
//         }
//         if (flag) {
//             jobUpdate = await Job.update({
//                 status,
//                 eta,
//                 percentage,
//                 loadOrderIds,
//                 drivingminutes,
//                 totalRunTime,
//                 totalDistance,
//                 totalDuration,
//                 Infeasible,
//                 InfeasibleCount,
//                 loads,
//                 loadsCount
//             }, {
//                 where: {
//                     UUID: uuid
//                 }
//             });
//         } else {
//             jobUpdate = await Job.update({
//                 totalRunTime: [0],
//                 status,
//                 eta,
//                 percentage,
//                 Infeasible,
//                 InfeasibleCount
//             }, {
//                 where: {
//                     UUID: uuid
//                 }
//             });
//         }
        
//         res.json({
//             status: true,
//             msg: 'ok',
//             data: jobUpdate
//         });
        
        
//     } catch (error) {
//         res.status(500).json({
//             msg: 'Error!!!',
//             error
//         });
//     }
// };

exports.createPlannings = async (req, res) => {


    console.log(' ----- type:', req.query.type)

    console.log(' - /autoplan/flatbed')
    // console.log(req.body);
    console.log(req.body.length);

    // if(req.body.length>0){
    //     console.log(' --', req.body[0].Infeasibles[0])
    // }

    // console.log(req.user);

    // const owner = {
    //     name: "",
    //     id: 0,
    //     type: 1
    // }

    // if(req.user){
    //     owner.id = req.user.id
    // }

    // const planningData = {
    //     owner: {}, // Owner,

    //     UUID: req.body[0].UUID,

    //     equipment: {}, // Equipment,
    //     carrier: {}, // Carrier,
    //     shiftId: Number, // ete 2 hogi 120, ete 1 urisha   // 

    //     orders: String,
    //     stops: [{}], // stopLocations: String, // { type: Sequelize.JSON },

    //     startTime: Date,
    //     endTime: Date,

    //     feet: Number,
    //     weight: Number,

    //     totalDistance: Number,
    //     totalDuration: Number,

    //     status: Number, // 

    //     loadCost: Number,
    //     loadCostPerMile: Number,

    //     comment: String,
        
    //     feelRates: Number,
    //     permileRates: Number,
    //     permileRatesTotal: Number,

    //     planType: String, // { type: Sequelize.ENUM, values: ['Manual', 'Auto'] },

    //     changed: [{}],

    //     delete: Number
    // }

    if(!Array.isArray(req.body)){
        console.log(' -- body is not array');
        return res.json({
            status: 0,
            msg: 'Incorrect body type',
        });
    }

    const user = req.user || { 
        name: 'Brocker',
        id: 1,
        type: 1, // 1 - Brocker/Shipper, 2 - Carrier 
    }

    for (let i =0; i < req.body.length; i++) {
        console.log('\n --- inst ----- ', req.body[i])
        for(let j = 0; j < req.body[i].Loads.length; j++){
            const data = req.body[i].Loads[j]
        
            console.log('\n --- load --- ', data, '\n')


            const planningData = {
                autoPlanDate: req.body[i].AutoPlanDate,

                owner: {
                    name: user.name,
                    id: user.id,
                    type: user.type,
                },

                UUID: req.body[i].UUID,

                equipment: data.Equipment,

                // carrier: {}, // Carrier,
                // shiftId: 60, // ete 2 hogi 120, ete 1 urisha   // 

                orderIDs: data.orderIDs,
                orders: data.orderSIDs,

                stops: data.GeoLine.coordinates, // [{}], // stopLocations: String, // { type: Sequelize.JSON },

                startTime: data.InitStartTime, 
                // endTime: new Date(),

                feet: 20,
                weight: data.TotalWeight,

                totalDistance: data.TotalDistance,
                totalDuration: data.TotalMinutes,

                status: 1, 

                // loadCost: Number,
                // loadCostPerMile: Number,

                // comment: "",
                
                // feelRates: 0,
                // permileRates: 0,
                // permileRatesTotal: 0,

                planType: 'Auto', // { type: Sequelize.ENUM, values: ['Manual', 'Auto'] },

                changed: [{}],

                delete: 0,

                Load: data
            }

            const planning = new Planning(planningData);
            await planning.save()
        }
    }

    console.log(' -- end')
    return res.json({
        status: 1,
        msg: 'ok',
        // data: planning
    });
    

    // let data = {
    //     UUID: "",
    //     assetsId: undefined,
    //     driverId: undefined,
    //     depoId: undefined,
    //     shiftId: undefined,

    //     flowType: 3,

    //     orders: "",
    //     stops: 0,

    //     start: "",
    //     end: "",

    //     feet: undefined,
    //     weight: undefined,

    //     totalDistance: undefined,
    //     totalDuration: undefined,
        
    //     status: undefined,
    //     freezed: undefined,
        
    //     loadCost: undefined,
    //     loadCostPerMile: undefined,

    //     startTime: undefined,
    //     endTime: undefined,
        
    //     comment: undefined,
    //     totalcases: undefined,
        
    //     feelRates: undefined,
    //     permileRates: undefined,
    //     return: undefined,
    //     planType: undefined,
    //     carTypes: undefined,
    //     stopLocations: undefined,

    //     changed: undefined,
    //     warning: undefined,
    //     warningData: undefined,
    //     disabled: 0
    // }


    // data = {
    //     UUID: "uuid",
    //     assetsId: undefined,
    //     driverId: undefined,
    //     depoId: undefined,
    //     shiftId: undefined,

    //     flowType: 3,

    //     orders: "",
    //     stops: 0,

    //     start: "",
    //     end: "",

    //     feet: 10,
    //     weight: 200,

    //     totalDistance: 500,
    //     totalDuration: 6,
        
    //     status: 0,
    //     freezed: 0,
        
    //     loadCost: 1000,
    //     loadCostPerMile: 20,
    //     loadCostPerMileTotal: 1000,

    //     startTime: undefined,
    //     endTime: undefined,
        
    //     comment: undefined,
    //     totalcases: undefined,
        
    //     feelRates: 2000,
    //     permileRates: 50,
    //     permileRatesTotal: 2500,

    //     return: 0,
    //     planType: 'auto',
    //     carTypes: undefined,
    //     stopLocations: undefined,

    //     changed: undefined,
    //     warning: undefined,
    //     warningData: undefined,
    //     disabled: 0
    // }

    // const planning = new Planning({
    //     //owner: owner,

    //     UUID: data.UUID,
    //     // //carrierId: Number,
    //     // //equipmentId: Number ,
    //     // assetsId: data.assetsId,
    //     // driverId: data.driverId,
    //     // depoId: data.depoId,
    //     // shiftId: data.shiftId,

    //     // nickname: String,
    //     flowType: data.flowType,

    //     orders: data.orders,
    //     stops: data.stops,
        
    //     start: data.start, //lat lon
    //     end: data.stop, //lat lon
        
    //     feet: data.feet,
    //     weight: data.weight,

    //     totalDistance: data.totalDistance,
    //     totalDuration: data.Duration,
        
    //     status: data.status,
    //     freezed: data.freezed,
        
    //     loadCost: data.loadCost,
    //     loadCostPerMile: data.loadCostPerMile,

    //     startTime: data.startTime,
    //     endTime: data.endTime,
        
    //     comment: data.comment,
    //     totalcases: data.totalcases,
        
    //     feelRates: data.feelRates,
    //     permileRates: data.permileRates,
    //     return: data.return,
    //     planType: data.planType, // { type: Sequelize.ENUM, values: ['Manual', 'Auto'] },
    //     carTypes: data.carTypes, // { type: Sequelize.JSON },
    //     stopLocations: data.stopLocations, // { type: Sequelize.JSON },

    //     changed: data.changed, // { type: Sequelize.JSON },
    //     // warning: data.warning,
    //     warningData: data.warningData, // { type: Sequelize.JSON },
    //     disabled: data.disabled,
    // })

    // await planning.save()
}