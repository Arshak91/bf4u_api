module.exports = class Permissions {

    constructor() {
        this.orderPermission = {
            view: 1,
            create: 2,
            upload: 3,
            edit: 4,
            delete: 5,
            milageOptimisation: 6,
            timeOptimisation: 7,
            manualPlaning: 8
        };
        this.equipmentsPermissions = {
            view: 79,
            delete: 80,
            update: 81,
            create: 96
        },
        this.deposPermissions = {
            view: 82,
            delete: 83,
            update: 84,
            create: 97
        },
        this.czonesPermissions = {
            view: 92,
            delete: 93,
            update: 94,
            create: 98
        },
        this.handlingTypesPermissions = {
            view: 85,
            delete: 86,
            update: 87,
            create: 95
        },
        this.planingPermission = {
            view: 9,
            unplan: 10,
            confirm: 11,
            export: 12,
            create: 75,
            edit: 13,
            dragdropEdit: 14,
            sequence: 15,
            notTimeWindowSequence: 16
        };
        this.loadPermission = {
            view: 17,
            unplan: 18,
            dispatch: 19,
            edit: 20,
            statusChange: 21
        };
        this.driverPermission = {
            view: 22,
            create: 23,
            edit: 24,
            quickCreate: 25,
            active: 26,
            delete: 27
        };
        this.schedulePermission = {
            view: 28
        };
        this.plansPermission = {
            view: 29,
            delete: 30
        };
        this.assetsPermission = {
            view: 31,
            create: 32,
            edit: 33,
            delete: 34
        };
        this.customersPermission = {
            view: 35,
            create: 36,
            edit: 37,
            delete: 38,
            assignDriver: 39,
            assignZone: 40,
            assignDepot: 41
        };
        this.productPermission = {
            view: 42,
            create: 43,
            edit: 44,
            delete: 45
        };
        this.vendorsPermission = {
            view: 46,
            create: 47,
            edit: 48,
            delete: 49
        };
        this.dashboardPermission = {
            view: 50
        };
        this.defaultPermission = {
            getUserDetail: 51,
            getFolowTypes: 52,
            getTransportTypes: 53,
            getSpecialNeeds: 54,
            getOrderStatuses: 55,
            getDepos: 56,
            getAccessorials: 57,
            getCzones: 58,
            getShifts: 59,
            getDrivers: 60,
            getEquipments: 61,
            getCarriers: 62,
            getConsignees: 63,
            getDashboard: 64,
            getLoadStatuses: 65,
            getLoads: 66,
            getDriverBlocks: 67,
            getCompanyEquipment: 68,
            getHandlingTypes: 69,
            getUploads: 70,
            getJobs: 71,
            getSqlProducts: 72,
            getVendors: 73,
            updateNotificationSettings: 90,
            getNotificationSettings: 91,
            getNotificationTemplates: 99
        }
        this.adminPermission = {
            getUsersListForAdmin: 74,
            updateGlobalSettings: 76,
            uploadedOrdersDelete: 88,
            jobsDelete: 89
        }
    } 

    get permission() {
        return {
            order: this.orderPermission,
            planing: this.planingPermission,
            load: this.loadPermission,
            driver: this.driverPermission,
            schedule: this.schedulePermission,
            plans: this.plansPermission,
            assets: this.assetsPermission,
            customers: this.customersPermission,
            products: this.productPermission,
            vendors: this.vendorsPermission,
            dashboard: this.dashboardPermission,
            default: this.defaultPermission,
            admin: this.adminPermission,
            equipments: this.equipmentsPermissions,
            depos: this.deposPermissions,
            handlingtypes: this.handlingTypesPermissions,
            czones: this.czonesPermissions
        }
    }
};