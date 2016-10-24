angular.module('unionvmsWeb').factory('visibilityService',function() {

	var visibilityService = {
        positions: {
            fs: true,
            extMark: true,
            ircs: true,
            cfr: true,
            name: true,
            posTime: true,
            lon: true,
            lat: true,
            stat: true,
            m_spd: true,
            c_spd: true,
            crs: true,
            msg_tp: true,
            act_tp: true,
            source: true
        },
        segments: {
            fs: true,
            extMark: true,
            ircs: true,
            cfr: true,
            name: true,
            dist: true,
            dur: true,
            spd: true,
            crs: true,
            cat: true
        },
        tracks: {
            fs: true,
            extMark: true,
            ircs: true,
            cfr: true,
            name: true,
            dist: true,
            dur: true,
            timeSea: true
        },
        alarms: {
            fs: true,
            extMark: true,
            ircs: true,
            cfr: true,
            name: true,
            ruleName: true,
            ruleDesc: true,
            ticketOpenDate: true,
            ticketStatus: true,
            ticketUpdateDate: true,
            ticketUpdatedBy: true,
            ruleDefinitions: true
        },
        trips: {
            name: true
        },
        fishingActivities : {
            FAReportType: true,
            activityType: true,
            occurrence: true,
            purposeCode: true,
            dataSource: true,
            fromName: true,
            startDate: true,
            endDate: true,
            cfr: true,
            ircs: true,
            extMark: true,
            uvi: true,
            iccat: true,
            gfcm: true,
            areas: true,
            port: true,
            fishingGear: true,
            speciesCode: true,
            quantity: true
        },
        positionsColumns: ['fs','extMark','ircs','cfr','name','posTime','lat','lon','stat','m_spd','c_spd','crs','msg_tp','act_tp','source'],
        segmentsColumns: ['fs','extMark','ircs','cfr','name','dist','dur','spd','crs','cat'],
        tracksColumns: ['fs','extMark','ircs','cfr','name','dist','dur','timeSea'],
        alarmsColumns: ['fs', 'extMark', 'ircs', 'cfr', 'name', 'ruleName', 'ruleDesc', 'ticketOpenDate', 'ticketStatus', 'ticketUpdateDate', 'ticketUpdatedBy', 'ruleDefinitions'],
        tripsColumns: ['name'],
        fishingActivitiesColumns: ['FAReportType','activityType','occurrence','purposeCode','dataSource','fromName','startDate','endDate','cfr','ircs','extMark','uvi','iccat','gfcm','areas','port','fishingGear','speciesCode','quantity'],
        setVisibility: function(data){
             for (var key in data){
                 this[key] = setItems(this[key], data[key].table.values);
                 this[key + 'Columns'] = data[key].table.order;
             }
        }
	};
	
	var setItems = function(obj, srcData){
	    var newObj = {};
	    for (var key in obj){
	        newObj[key] = false;
	        if (_.indexOf(srcData, key) !== -1){
	            newObj[key] = true;
	        }
	    }
	    
	    return newObj;
	};

	return visibilityService;
});