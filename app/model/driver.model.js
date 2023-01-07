
module.exports = (sequelize, Sequelize) => {
    const Driver = sequelize.define('drivers', {
       
            carrierId: { type: Sequelize.INTEGER }, // Company
            equipmentId: { type: Sequelize.INTEGER },
            assetId: { type: Sequelize.INTEGER },
            shiftId: { type: Sequelize.INTEGER },
            scheduleid: {type: Sequelize.INTEGER },
            depotId: {type: Sequelize.INTEGER },

            type: { type: Sequelize.ENUM, values: ['Own Operator', 'Company'] },
            eqType: { type: Sequelize.JSON },
            status: { type: Sequelize.INTEGER },
            startTime: { type: Sequelize.TIME}, // may remove
            endTime: { type:Sequelize.TIME }, // may remove

            fname: { type: Sequelize.STRING },
            lname: { type: Sequelize.STRING },
            email: { type: Sequelize.STRING },
            phone: { type: Sequelize.STRING },
            address: { type: Sequelize.STRING },

            streetaddress: { type: Sequelize.STRING },
            city: { type: Sequelize.STRING },
            state: { type: Sequelize.STRING },
            zip: { type: Sequelize.STRING },
            country: { type: Sequelize.STRING },
            countryCode: { type: Sequelize.STRING },
            
            rate: { type: Sequelize.DECIMAL },
            hourlyRate: { type: Sequelize.DECIMAL },
            perMileRate: { type: Sequelize.DECIMAL },
            percentRate: { type: Sequelize.DECIMAL },
            fuelsurcharge: { type: Sequelize.DECIMAL },
            detention: { type: Sequelize.DECIMAL },
            bonuses: { type: Sequelize.DECIMAL },

            dob: { type: Sequelize.DATE }, // Date of Birthday
            hdate: { type: Sequelize.DATE }, // Hire date

            easypass: { type: Sequelize.INTEGER }, // true false
            ex_rev_per_mile: { type: Sequelize.DECIMAL }, // Expected revenue per mile
            ex_rev_goal_week: { type: Sequelize.DECIMAL }, // Expected revenue goal of week 
            lengthofhaul_min: { type: Sequelize.DECIMAL }, 
            lengthofhaul_max: { type: Sequelize.DECIMAL },
            drivinglicence: { type: Sequelize.JSON },
            use_sleeper_b_p: { type: Sequelize.INTEGER }, // true/false  // Use Sleeper Birth Provision
            throughStates: { type: Sequelize.STRING },
            pickupDeliveryStates: { type: Sequelize.STRING },
            prefTruckStops: { type: Sequelize.STRING },
            tollRoutes: { type: Sequelize.STRING },
            mobileActive: { type: Sequelize.INTEGER},
            routeNumber: { type: Sequelize.STRING}
           
            /*
                state of avoid going through
                state of avoid pickup on delivery
                prefferd truck stops
                Avoid Toll Routes
                
            */

    });

    return Driver;
};
