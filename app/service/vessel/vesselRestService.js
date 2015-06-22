angular.module('unionvmsWeb')
    .factory('vesselRestFactory',function($resource, $q, restConstants) {

        var baseUrl = restConstants.baseUrl;
        return {
            getSearchableFields : function(){
                return $resource(baseUrl +'/vessel/rest/vessel/config/searchfields/');
            },
            vessel : function(){
                return $resource(baseUrl +'/vessel/rest/vessel/', {}, {
                    update: {method: 'PUT'}                    
                });
            },            
            getVesselList : function(){  
                return $resource(baseUrl +'/vessel/rest/vessel/list/',{},{
                    list : { method: 'POST'}
                });
            },
            vesselGroup : function(){
                return $resource(baseUrl +'/vessel/rest/group/', {}, {
                    update: {method: 'PUT'}                    
                });
            },
            deleteVesselGroup : function(){
                return $resource(baseUrl +'/vessel/rest/group/delete', {}, {
                    delete: {method: 'PUT'}                    
                });
            },
            getVesselGroupsForUser : function(){
                return $resource(baseUrl +'/vessel/rest/group/list');
            },
            vesselHistory : function(){
                return $resource(baseUrl +'/vessel/rest/history/vessel');
            },  
        };
    })
.factory('vesselRestService', function($q, $http, vesselRestFactory, restConstants, VesselListPage, Vessel, SavedSearchGroup){

    var baseUrl = restConstants.baseUrl;
    var userName = "FRONTEND_USER";

    var getVesselList = function(getListRequest){
        var deferred = $q.defer();

        vesselRestFactory.getVesselList().list(getListRequest.DTOForVessel(), 
            function(response) {

                if(response.code !== "200"){
                    deferred.reject("Invalid response status");
                    return;
                }

                var vessels = [];
                if(angular.isArray(response.data.vessel)){
                    for (var i = 0; i < response.data.vessel.length; i ++) {
                        vessels.push(Vessel.fromJson(response.data.vessel[i]));
                    }
                }
                var currentPage = response.data.currentPage;
                var totalNumberOfPages = response.data.totalNumberOfPages;
                var vesselListPage = new VesselListPage(vessels, currentPage, totalNumberOfPages);
                deferred.resolve(vesselListPage);
            },
            function(err){
                deferred.reject(err);
            }
        );

        return deferred.promise;        
    };

    //Get all vessels matching the search criterias in the list request
    var getAllMatchingVessels = function(getListRequest){

        //chunkSize: same as listSize in getListRequest
        //maxItems: max number of items to get
        var chunkSize = 1000,
            maxItems = 10000;

        var deferred = $q.defer();
        var vessels = [];
        var onSuccess = function(vesselListPage){
            vessels = vessels.concat(vesselListPage.vessels);
            
            //Last page, then return
            if(vesselListPage.isLastPage() || vesselListPage.vessels.length === 0 || vesselListPage.vessels.length < getListRequest.listSize){
                console.log("Found " +vessels.length +" vessels");
                return deferred.resolve(vessels);
            }
            //If more than maxItems, then return as well
            else if(vessels.length >= maxItems){
                console.log("Max number of items (" +maxItems +") have been found. Returning.");
                return deferred.resolve(vessels);
            }

            //Get next page
            getListRequest.page += 1;
            getVesselList(getListRequest).then(onSuccess, onError);                
        };
        var onError = function(error){
            console.error("Error getting vessels.");
            return deferred.reject(error);            
        };

        //Get vessels
        getListRequest.listSize = chunkSize;
        getVesselList(getListRequest).then(onSuccess, onError);

        return deferred.promise;
    };

    var createNewVessel = function(vessel){
        var deferred = $q.defer();
        vesselRestFactory.vessel().save(vessel.DTO(), function(response) {
            if(response.code !== "200"){
                deferred.reject("Invalid response status");
                return;
            }
            deferred.resolve(Vessel.fromJson(response.data));
        }, function(error) {
            console.error("Error creating vessel");
            console.error(error);
            deferred.reject(error);
        });
        return deferred.promise;        
    };

    var updateVessel = function(vessel){
        console.log("ABout to update vessel:");
        console.log(vessel);
        var deferred = $q.defer();
        vesselRestFactory.vessel().update(vessel.DTO(), function(response) {
            if(response.code !== "200"){
                deferred.reject("Invalid response status");
                return;
            }
            deferred.resolve(Vessel.fromJson(response.data));
        }, function(error) {
            console.error("Error updating vessel");
            console.error(error);
            deferred.reject(error);
        });
        return deferred.promise;  
    };

    var getSearchableFields = function (){
        var deferred = $q.defer();
        vesselRestFactory.getSearchableFields().get({
        }, function(response) {
            if(response.code !== "200"){
                deferred.reject("Invalid response status");
                return;
            }
            //TODO: parse and convert response.data to an object
            deferred.resolve(response.data);
        }, function(error) {
            console.error("Error getting searchable fields for vessel");
            deferred.reject(error);
        });
        return deferred.promise;
    };

    var getVesselHistoryListByVesselId = function (vesselId, maxNbr){
        var deferred = $q.defer();
        //Query object
        var queryObject = {
            vesselId : vesselId
        };
        if(maxNbr){
            queryObject['maxNbr'] = maxNbr;
        }

        vesselRestFactory.vesselHistory().get(queryObject, 
            function(response) {

                if(response.code !== "200"){
                    deferred.reject("Invalid response status");
                    return;
                }

                var vessels = [];
                if(angular.isArray(response.data)){
                    for (var i = 0; i < response.data.length; i ++) {
                        vessels.push(Vessel.fromJson(response.data[i]));
                    }
                }
                deferred.resolve(vessels);
            },
            function(err){
                deferred.reject(err);
            }
        );
        return deferred.promise;           
    };

    var getVesselGroupsForUser = function (){
        var deferred = $q.defer();
        vesselRestFactory.getVesselGroupsForUser().get({'user' : userName}, 
            function(response) {

                if(response.code !== "200"){
                    deferred.reject("Invalid response status");
                    return;
                }

                var groups = [];
                if(angular.isArray(response.data)){
                    for (var i = 0; i < response.data.length; i ++) {
                        groups.push(SavedSearchGroup.fromJson(response.data[i]));
                    }
                }
                deferred.resolve(groups);
            },
            function(err){
                deferred.reject(err);
            }
        );
        return deferred.promise;           
    };

    var createNewVesselGroup = function(savedSearchGroup){
        var deferred = $q.defer();
        vesselRestFactory.vesselGroup().save(savedSearchGroup.toJson(), function(response) {
            if(response.code !== "200"){
                deferred.reject("Invalid response status");
                return;
            }
            deferred.resolve(SavedSearchGroup.fromJson(response.data));
        }, function(error) {
            console.error("Error creating vessel group");
            console.error(error);
            deferred.reject(error);
        });
        return deferred.promise;        
    };

    var updateVesselGroup = function(savedSearchGroup){
        var deferred = $q.defer();
        vesselRestFactory.vesselGroup().update(savedSearchGroup.toJson(), function(response) {
            if(response.code !== "200"){
                deferred.reject("Invalid response status");
                return;
            }
            deferred.resolve(SavedSearchGroup.fromJson(response.data));
        }, function(error) {
            console.error("Error updating vessel group");
            console.error(error);
            deferred.reject(error);
        });
        return deferred.promise;  
    };     

     var deleteVesselGroup = function(savedSearchGroup){
        var deferred = $q.defer();
        vesselRestFactory.deleteVesselGroup().delete(savedSearchGroup.toJson(), function(response) {
            if(response.code !== "200"){
                deferred.reject("Invalid response status");
                return;
            }
            deferred.resolve(SavedSearchGroup.fromJson(response.data));
        }, function(error) {
            console.error("Error when trying to delete a vessel group");
            console.error(error);
            deferred.reject(error);
        });
        return deferred.promise;  
    };     


    return {
        getVesselList: getVesselList,
        getAllMatchingVessels: getAllMatchingVessels,
        updateVessel: updateVessel,
        createNewVessel: createNewVessel,
        getSearchableFields : getSearchableFields,
        getVesselHistoryListByVesselId : getVesselHistoryListByVesselId,
        getVesselGroupsForUser : getVesselGroupsForUser,
        createNewVesselGroup : createNewVesselGroup,
        updateVesselGroup : updateVesselGroup,
        deleteVesselGroup : deleteVesselGroup        
    };
});





