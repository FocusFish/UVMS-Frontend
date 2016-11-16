angular.module('unionvmsWeb').factory('reportRestFactory', function($resource) {
    
	return {
	    getReportsList: function(){
	        return $resource('/reporting/rest/report/list', {}, {
	            'get': {
	                method: 'GET'
	             }
	        });
	    },
	    getReport: function(){
	        return $resource('/reporting/rest/report/:id', {}, {
	            'get': {
	                method: 'GET'
	            }
	        });
	    },
	    deleteReport: function(){
	        return $resource('/reporting/rest/report/:id', {}, {
	            'delete': {
	                method: 'DELETE'
	             }
	        });
	    },
	    updateReport: function(){
	        return $resource('/reporting/rest/report/:id', {}, {
                'update': {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            });
	    },
	    createReport: function(){
	        return $resource('/reporting/rest/report', {}, {
                'create': {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            });
	    },
	    executeReport: function(){
	        return $resource('/reporting/rest/report/execute/:id', {}, {
	           'get': {
	               method: 'POST',
	               headers: {
	                   'Content-Type': 'application/json'
	               }
	           } 
	        });
	    },
        shareReport: function(){
            return $resource('/reporting/rest/report/share/:id/:visibility', {}, {
               'put': {
                   method: 'PUT',
                   headers: {
                        'Content-Type': 'application/json'
                    }
               } 
            });
        },
		executeWithoutSaving: function(){
	        return $resource('/reporting/rest/report/execute/', {}, {
	           'get': {
	               method: 'POST',
	               headers: {
	                   'Content-Type': 'application/json'
	               }
	           } 
	        });
	    },
	    setDefaultReport: function(){
	        return $resource('/reporting/rest/report/default/:id', {}, {
	            'set': {
	                method: 'POST',
	                headers: {
	                    'Content-Type': 'application/json'
	                }
	            }
	        });
	    },
        getLastExecuted: function(){
            return $resource('/reporting/rest/report/list/lastexecuted/:nrReports', {}, {
	            'get': {
	                method: 'GET',
	                headers: {
	                    'Content-Type': 'application/json'
	                }
	            }
	        });
        }
	};
})
.service('reportRestService', function($q, reportRestFactory){

    var reportRestService = {
        getReportsList: function(){
            var deferred = $q.defer();
            reportRestFactory.getReportsList().get(function(response){
                deferred.resolve(response);
            }, function(error){
                console.error('Error getting list of reports');
                deferred.reject(error);
            });
            return deferred.promise;
        },
        getReport: function(reportId){
            var deferred = $q.defer();
            reportRestFactory.getReport().get({id: reportId}, function(response){

                response.data.filterExpression.fa = {
                    reportType: 'NOTIFICATION',
                    activityType: 'DEPARTURE',
                    master: 'rep_power',
                    port: {
                        departure: 'PORT1',
                        arrival: 'PORT3',
                        landing: 'PORT2'
                    },
                    gear: {
                        onboard: 'GNS'
                    },
                    species: ['SOL','COD'],
                    weight: {
                        min: 2
                    }
                };

                deferred.resolve(response.data);
            }, function(error){
                deferred.reject(error);
            });
            return deferred.promise;
        },
        deleteReport: function(reportId, reportIdx){
            var deferred = $q.defer();
            reportRestFactory.deleteReport().delete({id: reportId}, function(response){
                response.index = reportIdx;
                deferred.resolve(response);
            }, function(error){
                deferred.reject(error.data);
            });
            return deferred.promise;
        },
        updateReport: function(report){
            var deferred = $q.defer();
            reportRestFactory.updateReport().update({id: report.id}, report.toJson(), function(response){
                deferred.resolve(response);
            }, function(error){
                deferred.reject(error);
            });
            return deferred.promise;
        },
        createReport: function(report){
            var deferred = $q.defer();
            var args;
            if(report.copy){
            	args = report.toJsonCopy();
            }else{
            	args = report.toJson();
            }
            reportRestFactory.createReport().create(args, function(response){
                deferred.resolve(response);
            }, function(error){
                deferred.reject(error);
            });
            return deferred.promise;
        },
        executeReport: function(id, config){
            var deferred = $q.defer();
            reportRestFactory.executeReport().get({id: id}, angular.toJson(config), function(response){
                deferred.resolve(response.data);
            }, function(error){
                deferred.reject(error);
            });
            
            return deferred.promise;
        },
        shareReport: function(id, visibility, reportIdx){
            var deferred = $q.defer();
            reportRestFactory.shareReport().put({id: id, visibility: visibility}, {}, function(response){
                response.reportIdx = reportIdx;
                response.visibility = visibility;
                deferred.resolve(response);
            }, function(error){
                deferred.reject(error);
            });
            return deferred.promise;
        },
        executeWithoutSaving: function(config){
            var deferred = $q.defer();
            reportRestFactory.executeWithoutSaving().get(config.toJsonCopy(), function(response){
                deferred.resolve(response.data);
            }, function(error){
                deferred.reject(error);
            });
            
            return deferred.promise;
        },
        setDefaultReport: function(id, override){
            var deferred = $q.defer();
            var payload = {
                override: override
            };
            reportRestFactory.setDefaultReport().set({id: id}, angular.toJson(payload), function(response){
                response.defaultId = id;
                deferred.resolve(response);
            }, function(error){
                deferred.reject(error);
            });
            return deferred.promise;
        },
        getLastExecuted: function(nrReports){
            var deferred = $q.defer();
            reportRestFactory.getLastExecuted().get({nrReports: nrReports}, {}, function(response){
                deferred.resolve(response);
            }, function(error){
                deferred.reject(error);
            });
            return deferred.promise;
        }
    };
    return reportRestService;
});