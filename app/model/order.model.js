module.exports = (sequelize, Sequelize) => {

    const Order = sequelize.define("orders", {
        //id: { type: Sequelize.INTEGER, primaryKey: true },

        //// References
        orderNumber: { type: Sequelize.STRING },
        bol: { type: Sequelize.STRING },
        pro: { type: Sequelize.STRING },
        po: { type: Sequelize.STRING },

        ////  Forign References
        companyId: { type: Sequelize.INTEGER },   // client ID , Delivery point ?
        carrierid: { type: Sequelize.INTEGER },
        customerid: { type: Sequelize.INTEGER },  // Customer ID , shipper broker ?
        loadnumber: { type: Sequelize.INTEGER },
        load_id: { type: Sequelize.INTEGER, defaultValue: 0 },

        //// Statuses
        isPlanned: { type: Sequelize.INTEGER },
        confirmed: { type: Sequelize.INTEGER },
        status: { type: Sequelize.INTEGER },
        statusInternal: { type: Sequelize.INTEGER },
        isFreezed: { type: Sequelize.INTEGER },
        depoid: { type: Sequelize.INTEGER },

        /// Dimantions
        feet: { type: Sequelize.DOUBLE },    // total feet must be counted
        weight: { type: Sequelize.DOUBLE },  // total weight must be counted
        pallet: { type: Sequelize.DOUBLE },  // ?  will be changed
        cube: { type: Sequelize.DOUBLE },    // total must be counted
        //type: { type: Sequelize.ENUM, values: ["Unplaned Orders", "Planned Orders", "Demo morning", "Demo Afternoon"] }

        // Finance
        currency: { type: Sequelize.STRING },
        rate: { type: Sequelize.DOUBLE },
        rateType: { type: Sequelize.ENUM, values: ["flat", "per_mile"] },
        flatRate: { type: Sequelize.DOUBLE },
        permileRate: { type: Sequelize.DOUBLE },
        fuelRate: { type: Sequelize.DOUBLE },
        fuelSurcharges: { type: Sequelize.INTEGER },
        otherRate: { type: Sequelize.DOUBLE },

        //// Types
        eqType: { type: Sequelize.INTEGER },
        flowType: { type: Sequelize.INTEGER },
        loadtype: { type: Sequelize.INTEGER },

        //// Dates
        pickupdateFrom: { type: Sequelize.DATE },
        pickupdateTo: { type: Sequelize.DATE },

        // deliverydate: { type: Sequelize.DATE },
        deliverydateFrom: { type: Sequelize.DATE },
        deliverydateTo: { type: Sequelize.DATE },

        // Delivery Pickup Points
        delivery: { type: Sequelize.STRING },
        pickup: { type: Sequelize.STRING },

        deliveryCompanyName:  { type: Sequelize.STRING },   // Delivery(end Point) clinet Company name
        deliveryStreetAddress: { type: Sequelize.STRING },
        deliveryCity: { type: Sequelize.STRING },
        deliveryState: { type: Sequelize.STRING },
        deliveryZip: { type: Sequelize.STRING },
        deliveryCountry: { type: Sequelize.STRING },
        deliveryCountryCode: { type: Sequelize.STRING },
        deliveryLon: { type: Sequelize.STRING },
        deliveryLat: { type: Sequelize.STRING },
        deliveryLocationtypeid: { type: Sequelize.INTEGER },
        deliveryAccessorials: { type: Sequelize.INTEGER },

        eta: { type: Sequelize.DATE },
        leaveTime: { type: Sequelize.DATE },
        ata: { type: Sequelize.DATE },

        pickupCompanyName: { type: Sequelize.STRING },      // Shipper/Broker Company/Person Name
        pickupStreetAddress: { type: Sequelize.STRING },
        pickupCity: { type: Sequelize.STRING },
        pickupState: { type: Sequelize.STRING },
        pickupZip: { type: Sequelize.STRING },
        pickupCountry: { type: Sequelize.STRING },
        pickupCountryCode: { type: Sequelize.STRING },
        pickupLon: { type: Sequelize.STRING },
        pickupLat: { type: Sequelize.STRING },
        pickupLocationtypeid: { type: Sequelize.INTEGER },
        pickupAccessorials: { type: Sequelize.INTEGER },

        //// Other
        dispatchDate: { type: Sequelize.STRING }, // ?
        servicetime: { type: Sequelize.DOUBLE },
        notes: { type: Sequelize.STRING },
        productDescription: { type: Sequelize.STRING }, // ?
        custDistance: { type: Sequelize.DOUBLE },
        custDuration: { type: Sequelize.DOUBLE },
        specialneeds: { type: Sequelize.JSON },
        bh: {type: Sequelize.INTEGER },
        orderTypes: { type: Sequelize.JSON },
        consigneeid: { type: Sequelize.INTEGER },
        vendorid: { type: Sequelize.INTEGER },
        timeInfo: { type: Sequelize.JSON },
        pieceCount: { type: Sequelize.DOUBLE },
        loadTempIds: { type: Sequelize.JSON },
        loadIds: { type: Sequelize.JSON },
        pieceTime: { type: Sequelize.DOUBLE },
        flowTypes: { type: Sequelize.JSON },
        timeWindows: { type: Sequelize.JSON },
        mustbefirst: { type: Sequelize.INTEGER, defaultValue: 0 },
        crossDock: { type: Sequelize.INTEGER, defaultValue: 0 },
        orderType: { type: Sequelize.INTEGER },
        proof: { type: Sequelize.JSON },
    });

    return Order;
};
