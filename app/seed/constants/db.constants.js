const id = 'id INT AUTO_INCREMENT NOT NULL';
const primaryId = 'primary key (id)';
const createdAt = 'createdAt DATETIME NOT NULL';
const updatedAt = 'createdAt DATETIME DEFAULT NULL';
const index = 'index';
const date = new Date();
module.exports = schemasModel = [
    {
        tableName: 'permissions',
        query: `${id}, requestUrl VARCHAR(255) DEFAULT NULL, requestMethod VARCHAR(255) DEFAULT NULL, enum INT DEFAULT NULL, isDefault INT DEFAULT NULL, ${primaryId}`
    },
    {
        tableName: 'Accessorials',
        query: `${id}, createdAt DATE, serviceOption VARCHAR(255), Type VARCHAR(255), updatedAt DATE, ${primaryId}`
    },
    {
        tableName: 'additional_transfers',
        query: `${id}, diverId INT DEFAULT NULL, type INT DEFAULT NULL, classifierId INT DEFAULT NULL, sum VARCHAR(255) DEFAULT NULL, status ENUM('Active','Inactive'), ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'address_coord',
        query: 'Address VARCHAR(50) NOT NULL, Coordinates VARCHAR(50) NOT NULL'
    },
    {
        tableName: 'addresses',
        query: `${id}, carrierId INT DEFAULT NULL, equipmentType ENUM('Tractor', 'Trailer'), tractorId INT DEFAULT NULL, trailerId INT DEFAULT NULL, ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'carrier_addresses',
        query: `${id}, carrierId INT DEFAULT NULL, addressType ENUM('Physical', 'Mailing'), street VARCHAR(255) DEFAULT NULL, city VARCHAR(255) DEFAULT NULL, stateProvince VARCHAR(255) DEFAULT NULL, zipPostal VARCHAR(255) DEFAULT NULL, country VARCHAR(255) DEFAULT NULL, primery INT DEFAULT NULL, ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'carrier_equipments',
        query: `${id}, carrierId INT DEFAULT NULL, equipmentType ENUM('Tractor', 'Trailer'), tractorId INT DEFAULT NULL, trailerId INT DEFAULT NULL, equipmentId INT DEFAULT NULL, ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'carrier_services',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'carriers',
        query: `${id},
        legalcompanyname VARCHAR(255) DEFAULT NULL, dbaname VARCHAR(255) DEFAULT NULL, phone VARCHAR(255) DEFAULT NULL, fax VARCHAR(255) DEFAULT NULL, website VARCHAR(255) DEFAULT NULL,
        operation_authority ENUM('Common','Contract','Broker') DEFAULT NULL, identification_number  VARCHAR(255) DEFAULT NULL, area_of_services  VARCHAR(255) DEFAULT NULL,
        status ENUM('Active', 'Inactive') DEFAULT NULL, yearestablished INT DEFAULT NULL, carrierType ENUM('carrier','ownoperator'), ${updatedAt},
        dot_number VARCHAR(255) DEFAULT NULL, hm_flag VARCHAR(255) DEFAULT NULL, pc_flag VARCHAR(255) DEFAULT NULL, email_address VARCHAR(255) DEFAULT NULL, mcs150_date DATETIME DEFAULT NULL,
        mcs150_mileage INT DEFAULT NULL, mcs150_mileage_year YEAR DEFAULT NULL, add_date DATETIME DEFAULT NULL, oic_state VARCHAR(255) DEFAULT NULL, nbr_power_unit INT DEFAULT NULL,
        driver_total INT DEFAULT NULL, ${primaryId}`
    },
    {
        tableName: 'cars',
        query: `${id}, driverid INT DEFAULT NULL, truckid INT DEFAULT NULL, tractorid INT DEFAULT NULL, trailerid INT DEFAULT NULL, ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'classifiers',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, carrierId INT DEFAULT NULL, shipperId INT DEFAULT NULL, status ENUM('Active', 'Inactive'), ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'companyEquipments',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, companyId INT NOT NULL, companyType ENUM('shipper', 'carrier', 'broker') NOT NULL, equipmentId INT NOT NULL, 
        VIN VARCHAR(255) DEFAULT NULL, platNumber VARCHAR(255) DEFAULT NULL, attachment VARCHAR(255) DEFAULT NULL, licenses VARCHAR(255) DEFAULT NULL,
        yom DATE DEFAULT NULL, brand VARCHAR(255) DEFAULT NULL, model VARCHAR(255) DEFAULT NULL, exploitation VARCHAR(255) DEFAULT NULL, info LONGTEXT,
        cabinType ENUM('sleeper', 'non_sleeper') DEFAULT NULL, depoid INT DEFAULT NULL, ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'configs',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, value VARCHAR(255) DEFAULT NULL, status INT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'consignees',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, companyLegalName VARCHAR(255) DEFAULT NULL, email VARCHAR(255) DEFAULT NULL, address VARCHAR(255) DEFAULT NULL,
        address2 VARCHAR(255) DEFAULT NULL, phone1 VARCHAR(255) DEFAULT NULL, phone2 VARCHAR(255) DEFAULT NULL, contactPerson VARCHAR(255) DEFAULT NULL, points JSON DEFAULT NULL,
        rating VARCHAR(255) DEFAULT NULL, serviceTime DOUBLE(15, 0) DEFAULT NULL, notes TEXT, mustbefirst INT DEFAULT NULL,
        driverId INT DEFAULT NULL, czone_id INT DEFAULT NULL, depo_id INT DEFAULT NULL, ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'currencies',
        query: `${id}, alias VARCHAR(255) DEFAULT NULL, fullAlias VARCHAR(255) DEFAULT NULL, name VARCHAR(255) DEFAULT NULL, symbol VARCHAR(255) DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'Customers',
        query: `${id}, Type VARCHAR(255) DEFAULT NULL, industrytype VARCHAR(255) DEFAULT NULL, companyName VARCHAR(255) DEFAULT NULL, customerName VARCHAR(255) DEFAULT NULL,
        email VARCHAR(255) DEFAULT NULL, Address_p VARCHAR(255) DEFAULT NULL, Address1 VARCHAR(255) DEFAULT NULL, country VARCHAR(255) DEFAULT NULL, phone1 VARCHAR(255) DEFAULT NULL,
        phone2 VARCHAR(255) DEFAULT NULL, state VARCHAR(255) DEFAULT NULL, city VARCHAR(255) DEFAULT NULL, contactperson VARCHAR(255) DEFAULT NULL, contactpersonposition VARCHAR(255) DEFAULT NULL,
        lastcontactedday VARCHAR(255) DEFAULT NULL, workinghours VARCHAR(255) DEFAULT NULL, deliveryhours VARCHAR(255) DEFAULT NULL, note VARCHAR(255) DEFAULT NULL,
        rate DOUBLE(11, 0) DEFAULT NULL, driverId INT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'customers',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, companyLegalName VARCHAR(255) DEFAULT NULL, email VARCHAR(255) DEFAULT NULL, address VARCHAR(255) DEFAULT NULL,
        address2 VARCHAR(255) DEFAULT NULL, phone1 VARCHAR(255) DEFAULT NULL, phone2 VARCHAR(255) DEFAULT NULL, contactPerson VARCHAR(255) DEFAULT NULL,
        deliveryPoints JSON DEFAULT NULL, notes VARCHAR(255) DEFAULT NULL,    ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'czones',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, color VARCHAR(255) DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'depos',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, carrierId INT DEFAULT NULL, customerId INT DEFAULT NULL, address VARCHAR(255) DEFAULT NULL,
        streetaddress VARCHAR(255) DEFAULT NULL, city VARCHAR(255) DEFAULT NULL, state VARCHAR(255) DEFAULT NULL, zip VARCHAR(255) DEFAULT NULL, country VARCHAR(255) DEFAULT NULL,
        countryCode VARCHAR(255) DEFAULT NULL, lat VARCHAR(255) DEFAULT NULL, lon VARCHAR(255) DEFAULT NULL, status INT DEFAULT NULL, workinghours JSON DEFAULT NULL,
        crossDock INT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'equipments',
        query: `${id}, type ENUM('Tractor', 'Trailer', 'Truck') DEFAULT NULL, trailerType VARCHAR(255) DEFAULT NULL, name VARCHAR(255) DEFAULT NULL, 
        eqType ENUM('Dry', 'Reefer', 'Frozen', 'Cooler', 'Multi') DEFAULT NULL, value DOUBLE DEFAULT NULL, valueUnit VARCHAR(255) DEFAULT NULL,
        externalLength VARCHAR(255) DEFAULT NULL, externalWidth VARCHAR(255) DEFAULT NULL, externalHeight VARCHAR(255) DEFAULT NULL, internalLength VARCHAR(255) DEFAULT NULL,
        internalWidth VARCHAR(255) DEFAULT NULL, internalHeight VARCHAR(255) DEFAULT NULL, maxweight DOUBLE(6,0) DEFAULT NULL, truckclassid INT DEFAULT NULL, maxVolume DOUBLE(7,0) DEFAULT NULL,
        horsepower FLOAT(255, 0) DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'events',
        query: `${id}, lat VARCHAR(255) DEFAULT NULL, lon VARCHAR(255) DEFAULT NULL, event_description VARCHAR(255) DEFAULT NULL, event_start_time DATETIME DEFAULT NULL,
        event_end_time DATETIME DEFAULT NULL, duration FLOAT DEFAULT NULL, loads_id INT NOT NULL, streetaddress VARCHAR(255) DEFAULT NULL, city VARCHAR(255) DEFAULT NULL,
        state VARCHAR(255) DEFAULT NULL, zip VARCHAR(255) DEFAULT NULL, country VARCHAR(255) DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'freightclasses',
        query: `${id}, freightclass FLOAT DEFAULT NULL, minpcf FLOAT DEFAULT NULL, maxpcf FLOAT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'HandlingTypes',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, description VARCHAR(255) DEFAULT NULL, Type VARCHAR(255) DEFAULT NULL, length DOUBLE DEFAULT NULL, width DOUBLE DEFAULT NULL,
        height DOUBLE DEFAULT NULL, depth DOUBLE DEFAULT NULL, density DOUBLE DEFAULT NULL, weight DOUBLE DEFAULT NULL, disabled INT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'HandlingUnits',
        query: `${id}, HandlingType_id INT DEFAULT NULL, orders_id INT NOT NULL, Quantitiy INT DEFAULT NULL, Weight FLOAT DEFAULT NULL, Length FLOAT DEFAULT NULL, Width FLOAT DEFAULT NULL,
        Height FLOAT DEFAULT NULL, piecetype_id INT DEFAULT NULL, productdescription TEXT, mintemperature FLOAT DEFAULT NULL,
        maxtemperature FLOAT DEFAULT NULL, density FLOAT DEFAULT NULL, freightclasses_id INT DEFAULT NULL, nmfcnumber VARCHAR(255) DEFAULT NULL, nmfcsubcode VARCHAR(255) DEFAULT NULL,
        options VARCHAR(255) DEFAULT NULL, sku VARCHAR(255) DEFAULT NULL, brand VARCHAR(255) DEFAULT NULL, specialneeds INT DEFAULT NULL, volume FLOAT DEFAULT NULL,
        stackable INT DEFAULT '0', TURNABLE INT DEFAULT '0', hazmat INT DEFAULT '0',   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'HandlingUnits_copy1',
        query: `${id}, HandlingType_id INT NOT NULL, orders_id INT NOT NULL, Quantity INT DEFAULT NULL, Weight FLOAT DEFAULT NULL, Length FLOAT DEFAULT NULL,
        Width FLOAT DEFAULT NULL, Height FLOAT DEFAULT NULL, piecetype INT DEFAULT NULL, productdescription TEXT, mintemperature FLOAT DEFAULT NULL, maxtemperature FLOAT DEFAULT NULL,
        Density FLOAT DEFAULT NULL, freightclasses_id INT NOT NULL, nmfcnumber VARCHAR(255) DEFAULT NULL, nmfcsubcode VARCHAR(255) DEFAULT NULL, options VARCHAR(255) DEFAULT NULL,
        volume FLOAT DEFAULT NULL, stackable INT NOT NULL DEFAULT '0', turnable INT NOT NULL DEFAULT '0', hazmat INT NOT NULL DEFAULT '0', HandlingUnit_id INT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'iddel_TruckNumber',
        query: `iddel VARCHAR(255) DEFAULT NULL, TruckNumber VARCHAR(255) DEFAULT NULL`
    },
    {
        tableName: 'images',
        query: `${id}, image_url VARCHAR(255) DEFAULT NULL, HandlingUnits_id INT NOT NULL, filename VARCHAR(255) NOT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'Items',
        query: `${id}, HandlingUnits_id INT NOT NULL, sku VARCHAR(255) DEFAULT NULL, HandlingTypes_id INT NOT NULL, Quantity INT DEFAULT NULL, Weight FLOAT DEFAULT NULL,
        Length FLOAT DEFAULT NULL, Width FLOAT DEFAULT NULL, Height FLOAT DEFAULT NULL, freightclasses_id INT NOT NULL, NMFC_number VARCHAR(255) DEFAULT NULL,
        NMFC_Sub_code VARCHAR(255) DEFAULT NULL, picetype_id INT NOT NULL, Product_Description TEXT, density DECIMAL(10,0) DEFAULT NULL, volume FLOAT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'jobs',
        query: `${id}, UUID VARCHAR(255) DEFAULT NULL, params JSON DEFAULT NULL, filters JSON DEFAULT NULL, status JSON DEFAULT NULL, eta JSON DEFAULT NULL,
        percentage JSON DEFAULT NULL, loadOrderIds JSON DEFAULT NULL, loads JSON DEFAULT NULL, loadsCount DOUBLE DEFAULT NULL, drivingminutes JSON DEFAULT NULL,
        totalRunTime JSON DEFAULT NULL, Infeasible JSON DEFAULT NULL, InfeasibleCount DOUBLE DEFAULT NULL, name VARCHAR(255) DEFAULT NULL, totalDistance JSON DEFAULT NULL,
        totalDuration JSON DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'load_routes',
        query: `${id}, loadId INT DEFAULT NULL, distribution INT DEFAULT NULL, pendingDistance DOUBLE DEFAULT NULL, duration DOUBLE DEFAULT NULL, route VARCHAR(255) DEFAULT NULL, ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'locationTypes',
        query: `${id}, location_type VARCHAR(55) DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'notification',
        query: `${id}, userId INT DEFAULT NULL, seen INT DEFAULT NULL, type INT DEFAULT NULL, title VARCHAR(255) DEFAULT NULL, content VARCHAR(255) DEFAULT NULL, seenAt DATETIME DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'pallets',
        query: `${id}, size VARCHAR(255) DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'piecetypes',
        query: `${id}, piecetype VARCHAR(255) DEFAULT NULL, density FLOAT DEFAULT NULL, freightclasses_id INT NOT NULL, disabled INT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'products',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, sku VARCHAR(255) DEFAULT NULL,
        class VARCHAR(255) DEFAULT NULL, description VARCHAR(255) DEFAULT NULL, unit VARCHAR(255) DEFAULT NULL, brandname VARCHAR(255) DEFAULT NULL,
        piecetypeid INT DEFAULT NULL, manufacturernumber VARCHAR(255) DEFAULT NULL, handlingtype VARCHAR(255) DEFAULT NULL, packsize VARCHAR(255) DEFAULT NULL,
        weight DOUBLE DEFAULT NULL, length DOUBLE DEFAULT NULL, width DOUBLE DEFAULT NULL, height DOUBLE DEFAULT NULL, companyId INT DEFAULT NULL,
        notes VARCHAR(255) DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'roles',
        query: `${id}, name VARCHAR(255) DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'schedules',
        query: `${id}, driverid INT NOT NULL, monday JSON DEFAULT NULL, tuesday JSON DEFAULT NULL, wednesday JSON DEFAULT NULL, thursday JSON DEFAULT NULL,
        friday JSON DEFAULT NULL, saturday JSON DEFAULT NULL, sunday JSON DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'settings',
        query: `${id}, userId INT DEFAULT NULL, userType VARCHAR(255) DEFAULT NULL, exchangeRate VARCHAR(255) DEFAULT NULL,
        defaultCurrency VARCHAR(255) DEFAULT NULL, units JSON DEFAULT NULL, Currency JSON DEFAULT NULL,
        defaultServiceTime DOUBLE(4,0) DEFAULT NULL, orders JSON DEFAULT NULL, loads JSON DEFAULT NULL, loadTemps JSON DEFAULT NULL, drivers JSON DEFAULT NULL,
        apiConfigs JSON DEFAULT NULL, autoplan JSON DEFAULT NULL, pieceTime DOUBLE DEFAULT NULL, country VARCHAR(255) DEFAULT NULL, countryCode VARCHAR(255) DEFAULT NULL,
        durationMultiplier DOUBLE DEFAULT NULL, fileHeaders JSON DEFAULT NULL, IterationMultiplier DOUBLE DEFAULT NULL, timezone VARCHAR(255) DEFAULT NULL, metricsSystem INT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'globalSettings',
        query: `${id}, exchangeRate VARCHAR(255) DEFAULT NULL,
        defaultCurrency VARCHAR(255) DEFAULT NULL, Currency JSON DEFAULT NULL, 
        defaultServiceTime DOUBLE(4,0) DEFAULT NULL, apiConfigs JSON DEFAULT NULL, pieceTime DOUBLE DEFAULT NULL, 
        fileHeaders JSON DEFAULT NULL, timezone VARCHAR(255) DEFAULT NULL, metricsSystem INT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'settlements',
        query: `${id}, driverId INT DEFAULT NULL, carrierId INT DEFAULT NULL, shipperId INT DEFAULT NULL, fromDate DATETIME DEFAULT NULL, toDate DATETIME DEFAULT NULL,
        loads VARCHAR(255) DEFAULT NULL, paymentType INT DEFAULT NULL, currencyId INT DEFAULT NULL, fuelSurcharge DOUBLE DEFAULT NULL, detention DOUBLE DEFAULT NULL, additionId INT DEFAULT NULL,
        deductionId INT DEFAULT NULL, prepaymentAmount DOUBLE DEFAULT NULL, paymentAmount DOUBLE DEFAULT NULL, status ENUM('Pending', 'Paid'),
        name VARCHAR(255) DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'shifts',
        query: `${id}, shiftName VARCHAR(255) DEFAULT NULL, shift FLOAT DEFAULT NULL, break_time FLOAT DEFAULT NULL, drivingtime FLOAT DEFAULT NULL, max_shift FLOAT DEFAULT NULL,
        rest FLOAT DEFAULT NULL, recharge FLOAT DEFAULT NULL, status INT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'specialneeds',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, description TEXT, status INT DEFAULT NULL, ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'states',
        query: `COUNTRYID VARCHAR(2) NOT NULL, STATEID VARCHAR(2) NOT NULL, FULLNAME VARCHAR(30) NOT NULL`
    },
    {
        tableName: 'statuses',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, type ENUM('Load', 'Order', 'Both'),
        statustype ENUM('*', '**'), color VARCHAR(45) DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'tractors',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, power INT DEFAULT NULL, powerUnit VARCHAR(255) DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'transporttypes',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, description TEXT, status INT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'truckclassification',
        query: `${id}, class VARCHAR(255) DEFAULT NULL, minweight INT DEFAULT NULL, maxweight INT DEFAULT NULL, ${primaryId}`
    },
    {
        tableName: 'trucks',
        query: `${id}, capacity DOUBLE DEFAULT NULL, type ENUM('Dry Van','Reefer','Flat Bed','Step Deck','Lowboy','Roll Tite Trailer','Double Drop','Chassis'),
        externalSize VARCHAR(255) DEFAULT NULL, internalSize VARCHAR(255) DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'Types',
        query: `${id}, type VARCHAR(45) DEFAULT NULL, ${primaryId}`
    },
    {
        tableName: 'uploads',
        query: `${id}, UUID VARCHAR(255) DEFAULT NULL, FileName VARCHAR(255) DEFAULT NULL, status INT DEFAULT NULL, failed JSON DEFAULT NULL, userId INT DEFAULT NULL,
        orderCount INT DEFAULT NULL,   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'user_roles',
        query: `${id}, roleId INT NOT NULL DEFAULT '0', userId INT NOT NULL DEFAULT '0',   ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'users',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, username VARCHAR(255) DEFAULT NULL, email VARCHAR(255) DEFAULT NULL, password VARCHAR(255) DEFAULT NULL,
        changePasswordAt DATETIME DEFAULT NULL, logoutAt DATETIME DEFAULT NULL, permissionId INT DEFAULT NULL, ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'userTypes',
        query: `${id}, userId INT NOT NULL, types ENUM('driver','shipper','courier') NOT NULL, ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'vendors',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, companyLegalName VARCHAR(255) DEFAULT NULL, email VARCHAR(255) DEFAULT NULL,
        address VARCHAR(255) DEFAULT NULL, address2 VARCHAR(255) DEFAULT NULL, phone1 VARCHAR(255) DEFAULT NULL, phone2 VARCHAR(255) DEFAULT NULL,
        contactPerson VARCHAR(255) DEFAULT NULL, points JSON DEFAULT NULL, serviceTime DOUBLE(4,0) DEFAULT NULL, notes VARCHAR(255) DEFAULT NULL,    ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'permissionGroups',
        query: `${id}, name VARCHAR(255) DEFAULT NULL, permissions JSON DEFAULT NULL, ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'drivers',
        query: `${id}, shiftId INT DEFAULT NULL,
         equipmentId INT DEFAULT NULL,
          carrierId INT DEFAULT NULL,
           sheduleid INT DEFAULT NULL,
            type ENUM("Own Operator","Company"), 
            status INT DEFAULT NULL, 
            fname VARCHAR(255) DEFAULT NULL, 
            lname VARCHAR(255) DEFAULT NULL, 
            email VARCHAR(255) DEFAULT NULL, 
            address VARCHAR(255) DEFAULT NULL, 
            streetaddress VARCHAR(255) DEFAULT NULL, 
            city VARCHAR(255) DEFAULT NULL, 
            state VARCHAR(255) DEFAULT NULL, 
            zip VARCHAR(255) DEFAULT NULL, 
            country VARCHAR(255) DEFAULT NULL, 
            countryCode VARCHAR(255) DEFAULT NULL, 
            phone VARCHAR(255) DEFAULT NULL,
        rate DECIMAL(11,0) DEFAULT NULL, 
        hourlyRate DECIMAL(11,0) DEFAULT NULL, 
        perMileRate DECIMAL(11,0) DEFAULT NULL, 
        percentRate INT DEFAULT NULL, 
        bonuses DECIMAL(11,0) DEFAULT NULL,
        detention DECIMAL(11,0) DEFAULT NULL, 
        bob DATE DEFAULT NULL, hdate DATETIME DEFAULT NULL, 
        startTime DATETIME DEFAULT NULL, 
        endTime DATETIME DEFAULT NULL, 
        easypass INT DEFAULT NULL, 
        fuelsurcharge DECIMAL(11,0) DEFAULT NULL, 
        ex_rev_goal_week DECIMAL(11,0) DEFAULT NULL, 
        ex_rev_per_mile DECIMAL(11,0) DEFAULT NULL, 
        use_sleeper_b_p INT DEFAULT NULL, 
        lengthofhaul_min DECIMAL(11,0) DEFAULT NULL, 
        lengthofhaul_max DECIMAL(11,0) DEFAULT NULL, 
        assetId INT DEFAULT NULL, 
        drivinglicence JSON DEFAULT NULL, 
        throughStates VARCHAR(255) DEFAULT NULL, 
        pickupDeliveryStates VARCHAR(255) DEFAULT NULL, 
        prefTruckStops VARCHAR(255) DEFAULT NULL, 
        depotId INT DEFAULT NULL, tollRoutes VARCHAR(255) DEFAULT NULL, 
        eqType JSON DEFAULT NULL, mobileActive INT DEFAULT NULL, 
        routeNumber VARCHAR(255) DEFAULT NULL, 
        ${updatedAt}, ${primaryId}`
    },

    {
        tableName: 'flowtypes',
        query: `${id}
        ,name VARCHAR(255) DEFAULT NULL 
        ,modeltype ENUM('VRP', 'VRP-PDP', 'PDP') 
        ,description TEXT DEFAULT NULL 
        ,status INT DEFAULT NULL 
        ,${updatedAt}
        ,${primaryId}`
    },


    {
        tableName: 'orders',
        query: `${id}, 
        ${`bol`} varchar(255) DEFAULT NULL, 
        ${`pro`} varchar(255) DEFAULT NULL, 
        ${`po`} varchar(255) DEFAULT NULL, 
        ${`orderNumber`} varchar(255) DEFAULT NULL, 
        ${`load_id`} int DEFAULT NULL, 
        ${`customerid`} int DEFAULT NULL, 
        ${`consigneeid`} int DEFAULT NULL, 
        ${`vendorid`} int DEFAULT NULL, 
        ${`carrierid`} int DEFAULT NULL, 
        ${`companyId`} int DEFAULT NULL, 
        ${`depoid`} int DEFAULT NULL, 
        ${`pickupDepoId`} int DEFAULT NULL, 
        ${`deliveryDepoId`} int DEFAULT NULL, 
        ${`loadnumber`} int DEFAULT NULL, 
        ${`eqType`} int DEFAULT NULL, 
        ${`flowType`} int DEFAULT NULL, 
        ${`orderType`} int DEFAULT NULL, 
        ${`isPlanned`} int DEFAULT NULL, 
        ${`isFreezed`} int DEFAULT NULL, 
        ${`status`} int DEFAULT NULL, 
        ${`statusInternal`} int DEFAULT NULL, 
        ${`pickupdate`} datetime DEFAULT NULL, 
        ${`deliverydate`} datetime DEFAULT NULL, 
        ${`delivery`} varchar(255) DEFAULT NULL, 
        ${`deliveryLocationtypeid`} int DEFAULT NULL, 
        ${`pickup`} varchar(255) DEFAULT NULL, 
        ${`pickupLocationtypeid`} int DEFAULT NULL, 
        ${`loadtype`} varchar(255) DEFAULT NULL, 
        ${`pallet`} double DEFAULT NULL, 
        ${`feet`} double(11,0) DEFAULT NULL, 
        ${`weight`} float DEFAULT NULL, 
        ${`rate`} double DEFAULT NULL, 
        ${`flatRate`} double DEFAULT NULL, 
        ${`permileRate`} double DEFAULT NULL, 
        ${`fuelRate`} double DEFAULT NULL, 
        ${`otherRate`} double DEFAULT NULL, 
        ${`currency`} varchar(255) DEFAULT NULL, 
        ${`pickupdateFrom`} datetime DEFAULT NULL, 
        ${`pickupdateTo`} datetime DEFAULT NULL, 
        ${`deliverydateFrom`} datetime DEFAULT NULL, 
        ${`deliverydateTo`} datetime DEFAULT NULL, 
        ${`dispatchDate`} varchar(255) DEFAULT NULL, 
        ${`deliveryCompanyName`} varchar(255) DEFAULT NULL, 
        ${`deliveryStreetAddress`} varchar(255) DEFAULT NULL, 
        ${`deliveryCity`} varchar(255) DEFAULT NULL, 
        ${`deliveryState`} varchar(255) DEFAULT NULL, 
        ${`deliveryZip`} varchar(255) DEFAULT NULL, 
        ${`deliveryLat`} varchar(255) DEFAULT NULL, 
        ${`deliveryLon`} varchar(255) DEFAULT NULL, 
        ${`deliveryCountry`} varchar(255) DEFAULT NULL, 
        ${`deliveryCountryCode`} varchar(4) DEFAULT NULL, 
        ${`deliveryAccessorials`} int DEFAULT NULL, 
        ${`productDescription`} varchar(255) DEFAULT NULL, 
        ${`pickupCompanyName`} varchar(255) DEFAULT NULL, 
        ${`pickupStreetAddress`} varchar(255) DEFAULT NULL, 
        ${`pickupCity`} varchar(255) DEFAULT NULL, 
        ${`pickupState`} varchar(255) DEFAULT NULL, 
        ${`pickupZip`} varchar(255) DEFAULT NULL, 
        ${`pickupLat`} varchar(255) DEFAULT NULL, 
        ${`pickupLon`} varchar(255) DEFAULT NULL, 
        ${`pickupCountry`} varchar(255) DEFAULT NULL, 
        ${`pickupCountryCode`} varchar(4) DEFAULT NULL, 
        ${`pickupAccessorials`} int DEFAULT NULL, 
        ${`eta`} datetime DEFAULT NULL, 
        ${`leaveTime`} datetime DEFAULT NULL, 
        ${`ata`} datetime DEFAULT NULL, 
        ${`servicetime`} double DEFAULT NULL, 
        ${`notes`} varchar(255) DEFAULT NULL, 
        ${`specialneeds`} json DEFAULT NULL, 
        ${`fuelSurcharges`} int NOT NULL DEFAULT "0", 
        ${`rateType`} enum("flat", "per_mile") NOT NULL, 
        ${`custDistance`} double DEFAULT NULL, 
        ${`custDuration`} double DEFAULT NULL, 
        ${`bh`} int DEFAULT NULL, 
        ${`createdAt`} datetime NOT NULL, 
        ${`updatedAt`} datetime NOT NULL, 
        ${`confirmed`} int DEFAULT NULL, 
        ${`orderTypes`} json DEFAULT NULL, 
        ${`timeInfo`} json DEFAULT NULL, 
        ${`pieceCount`} double DEFAULT NULL, 
        ${`pieceTime`} double DEFAULT NULL, 
        ${`disabled`} int DEFAULT NULL, 
        ${`loadTempIds`} json DEFAULT NULL, 
        ${`loadIds`} json DEFAULT NULL, 
        ${`flowTypes`} json DEFAULT NULL, 
        ${`timeWindows`} json DEFAULT NULL, 
        ${`mustbefirst`} int DEFAULT NULL, 
        ${`crossDock`} int DEFAULT NULL, 
        ${`serviceType`} enum('5052-Spare Internal Replenishment', '5051-Spare Freight Customer', '5053-Repair freight', '5043-Tools on Demand', 'unknown', '5531-Freight to Customer', '5532-Internal Replenishment') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL, 
        ${primaryId}`
    },
    {
        tableName: 'load_temps',
        query: `${id}, UUID VARCHAR(255) DEFAULT NULL, 
        equipmentId INT DEFAULT NULL, 
        assetsId INT DEFAULT NULL, 
        carrierId INT DEFAULT NULL, 
        driverId INT DEFAULT NULL,
        depoId INT DEFAULT NULL, 
        shiftId INT DEFAULT NULL, 
        nickname VARCHAR(255) DEFAULT NULL, 
        orders TEXT DEFAULT NULL, 
        flowType INT DEFAULT NULL, 
        stops INT DEFAULT NULL, 
        start VARCHAR(255) DEFAULT NULL, 
        startAddress VARCHAR(255) DEFAULT NULL, 
        end VARCHAR(255) DEFAULT NULL, 
        endAddress VARCHAR(255) DEFAULT NULL,
        feet DOUBLE DEFAULT NULL, 
        weight DOUBLE DEFAULT NULL, 
        pallet DOUBLE DEFAULT NULL, 
        emptymile DOUBLE DEFAULT NULL, 
        fuelSurcharge DOUBLE DEFAULT NULL,
        loadCost VARCHAR(255) DEFAULT NULL, 
        loadCostPerMile VARCHAR(255) DEFAULT NULL, 
        status INT DEFAULT NULL, 
        freezed INT DEFAULT NULL, 
        comment TEXT DEFAULT NULL, 
        totalcases VARCHAR(255) DEFAULT NULL,
        totalDistance DOUBLE(11,0) DEFAULT NULL, 
        totalDuration DOUBLE(11,0) DEFAULT NULL, 
        startTime DATETIME DEFAULT NULL, 
        endTime DATETIME DEFAULT NULL,
        distributionModel INT DEFAULT NULL, 
        permileRates DOUBLE DEFAULT NULL, 
        feelRates DOUBLE DEFAULT NULL, 
        planType ENUM("Manual", "Auto") DEFAULT NULL,
        carTypes JSON DEFAULT NULL, 
        stopLocations JSON DEFAULT NULL, 
        busy INT DEFAULT NULL, 
        changed JSON DEFAULT NULL, 
        route JSON DEFAULT NULL, 
        warning INT DEFAULT NULL, 
        warningData JSON DEFAULT NULL,
        disabled INT DEFAULT NULL, 
        confirmed INT DEFAULT NULL, 
        ${updatedAt}, ${primaryId}`
    },
    {
        tableName: 'loads',
        query: `${id},uuid VARCHAR(255) DEFAULT NULL,  
        equipmentId INT DEFAULT NULL,  
        assetsId INT DEFAULT NULL,  
        changed JSON DEFAULT NULL,  
        route JSON DEFAULT NULL,  
        warning INT DEFAULT NULL, 
        warningData JSON DEFAULT NULL,  
        disabled INT DEFAULT NULL,  
        loadTempId INT DEFAULT NULL,  
        carrierId INT DEFAULT NULL,  
        driverId INT DEFAULT NULL,  
        depoId INT DEFAULT NULL, 
        isPublic INT DEFAULT NULL,  
        flowType INT DEFAULT NULL,  
        nickname VARCHAR(255) DEFAULT NULL,  
        orders TEXT DEFAULT NULL, 
        stops INT DEFAULT NULL,  
        start VARCHAR(255) DEFAULT NULL,  
        startAddress VARCHAR(255) DEFAULT NULL,  
        end VARCHAR(255) DEFAULT NULL,  
        endAddress VARCHAR(255) DEFAULT NULL, 
        startTime DATETIME DEFAULT NULL,  
        endTime DATETIME DEFAULT NULL,  
        feet DOUBLE DEFAULT NULL,  
        weight DOUBLE DEFAULT NULL,  
        pallet DOUBLE DEFAULT NULL, 
        emptymile DOUBLE DEFAULT NULL,  
        totalDistance DOUBLE DEFAULT NULL,  
        totalDuration DOUBLE DEFAULT NULL,  
        fuelSurcharge DOUBLE DEFAULT NULL,  
        loadCost VARCHAR(255) DEFAULT NULL, 
        loadCostPerMile VARCHAR(255) DEFAULT NULL,  
        freezed INT DEFAULT NULL,  
        status INT DEFAULT NULL,  
        comment TEXT DEFAULT NULL,  
        totalcases VARCHAR(255) DEFAULT NULL,  
        dispatchDate DATETIME DEFAULT NULL, 
        deliveryDate DATETIME DEFAULT NULL,  
        lastlocations JSON DEFAULT NULL,  
        planType ENUM('Manual','Auto') DEFAULT NULL,
        carTypes JSON DEFAULT NULL, 
        shiftId INT DEFAULT NULL,  
        stopLocations JSON DEFAULT NULL,  
        files JSON DEFAULT NULL,  
        dispatchUrl VARCHAR(255) DEFAULT NULL,  
        finishRequest INT DEFAULT NULL,  
        finishTime DATETIME DEFAULT NULL, 
        startedTime DATETIME DEFAULT NULL,  
        ${updatedAt}, ${primaryId}`
    },


];


// hear removed returnes and cube from loads and loadtemps


