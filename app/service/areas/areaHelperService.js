/**
 * @memberof unionvmsWeb
 * @ngdoc service
 * @name areaHelperService
 * @param locale {service} angular locale service
 * @param areaMapService {service} area map service<p>{@link unionvmsWeb.areaMapService}</p>
 * @param spatialRestService {service} Spatial REST API service
 * @param areaAlertService {service} alert service for the area management tab
 * @param areaRestService {service} Area REST API service
 * @param areaClickerService {service} area map click service
 * @description
 *  Service to control the map on the liveview of the reporting tab
 */
angular.module('unionvmsWeb').factory('areaHelperService',function(locale, $interval, areaMapService, spatialRestService, areaAlertService, areaRestService, areaClickerService) {

	var areaHelperService = {
	    isEditing: false,
	    displayedLayerType: undefined,
	    displayedSystemAreaLayer: undefined,
	    displayedUserAreaGroup: undefined,
	    systemAreaTypes: undefined,
	    sysAreasEditingType: 'upload', //Possible values are: upload, metadata, dataset
	    systemAreaItems: [],
	    userAreasGroups: [],
	    isLoadingSysAreaTypes: false,
	    isLoadingAreaTypes: false,
	    metadata: {
	        id: undefined,
	        areaName: undefined,
	        areaDesc: undefined,
	        shortCopy: undefined,
	        longCopy: undefined
	    },
	    setMetadata: function(data){
	        this.metadata.id = data.id;
	        this.metadata.areaName = data.name;
	        this.metadata.areaDesc = data.layerDesc;
	        this.metadata.shortCopy = data.shortCopyright;
	        this.metadata.longCopy = data.longCopyright;
	    },
	    resetMetadata: function(){
	        var keys = _.keys(this.metadata);
	        for (var i = 0; i < keys.length; i++){
	            this.metadata[keys[i]] = undefined;
	        }
	    },
	    clearHelperService: function(){
	        this.isEditing = false;
	        this.displayedLayerType = undefined;
	        this.displayedSystemAreaLayer = undefined;
	        this.displayedUserAreaGroup = undefined;
	        this.resetMetadata();
	    },
	    tabChange: function(destTab){
	        areaClickerService.deactivate();
	        if (angular.isDefined(this.displayedLayerType)){
	            areaMapService.removeLayerByType(this.displayedLayerType);
	            this.displayedLayerType = undefined;
	        }
	        
	        if (angular.isDefined(destTab)){
	            if (destTab === 'USERAREAS'){
	                getUserAreaLayer(this);
	            } else if (destTab ===  'SYSAREAS'){
	                getAreaLocationLayers(this);
	                if (angular.isDefined(this.displayedSystemAreaLayer)){
	                    this.displayedLayerType = this.displayedSystemAreaLayer;
	                    var item = getAreaLocationLayerDef(this);
	                    areaMapService.addWMS(item);
	                }
	                if (this.sysAreasEditingType === 'dataset'){
	                    areaClickerService.active = true;
	                }
	            }else if(destTab ===  'AREAGROUPS'){
	            	getUserAreasGroupsList(this);
	            	if (angular.isDefined(this.displayedUserAreaGroup)){
	            	    this.displayedLayerType = 'AREAGROUPS';
	            	    this.getUserAreaGroupLayer(this.displayedUserAreaGroup);
	            	}
	            }
	        }
	    },
	    getUserAreaGroupLayer: function(type){
	        getUserAreaGroupLayer(this, type);
	    }
	};
	
	//Get AreaLocationLayer by type
	var getAreaLocationLayerDef = function(obj){
	    for (var i = 0; i < obj.systemAreaTypes.length; i++){
	        if (obj.systemAreaTypes[i].typeName === obj.displayedSystemAreaLayer){
	            return obj.systemAreaTypes[i];
	        }
	    }
	};
	
	//USER AREA GROUP LAYER
	var getUserAreaGroupLayer = function(obj, type){
	    var layer = areaMapService.getLayerByType('AREAGROUPS');
	    if (angular.isDefined(layer)){
	        var layerSrc = layer.getSource();
	        var groupCql = " and type = '" + type + "'";
	        var cql = layer.get('baseCql') + groupCql;
	        layerSrc.updateParams({
                time_: (new Date()).getTime(),
                'cql_filter': cql
            });
	        layer.set('groupCql', groupCql);
	    } else {
	        spatialRestService.getUserAreaLayer().then(function(response){
	            if (!angular.isDefined(areaMapService.getLayerByType('AREAGROUPS'))){
	                //override typename for area groups instead
	                response.data.typeName = 'AREAGROUPS';
	                response.data.groupCql = " and type = '" + type + "'";
	                areaMapService.addUserAreasWMS(response.data);
	                obj.displayedLayerType = response.data.typeName;
	            }
	        }, function(error){
	            areaAlertService.setError();
	            areaAlertService.alertMessage = locale.getString('areas.error_getting_user_area_layer');
	            areaAlertService.hideAlert();
	        });
	    }
	    
	};
	
	//USER AREA LAYER
	var stopLayerInterval = function(obj){
        $interval.cancel(obj.layerInterval);
        obj.layerInterval = undefined;
    }; 
    
    var getUserAreaLayer = function(obj){
        obj.layerInterval = $interval(function(){
            if (angular.isDefined(areaMapService.map)){
                getUserAreaLayerFromRest(obj);
                stopLayerInterval(obj);
            }
        }, 10);
    };
    
    var getUserAreaLayerFromRest = function(obj){
        spatialRestService.getUserAreaLayer().then(function(response){
            if (!angular.isDefined(areaMapService.getLayerByType('USERAREA'))){
                areaMapService.addUserAreasWMS(response.data);
                obj.displayedLayerType = response.data.typeName;
                areaAlertService.removeLoading();
            }
        }, function(error){
            areaAlertService.setError();
            areaAlertService.alertMessage = locale.getString('areas.error_getting_user_area_layer');
            areaAlertService.hideAlert();
        });
    }
    
    //area location layers for combo in sysareas    
    var getAreaLocationLayers = function(obj){
        if (!angular.isDefined(obj.systemAreaTypes)){
        	obj.isLoadingSysAreaTypes = true;
            spatialRestService.getAreaLocationLayers().then(function(response){
                obj.systemAreaTypes = response.data;
                for (var i = 0; i < obj.systemAreaTypes.length; i++){
                    obj.systemAreaItems.push({"text": obj.systemAreaTypes[i].typeName, "code": obj.systemAreaTypes[i].typeName});
                }
                obj.isLoadingSysAreaTypes = false;
            }, function(error){
            	areaAlertService.setError();
                areaAlertService.errorMessage = locale.getString('spatial.area_selection_modal_get_sys_layers_error');
                areaAlertService.hideAlert();
                obj.isLoadingSysAreaTypes = false;
            });
        }
    };
    
    //USER AREAS GROUPS LIST
    var getUserAreasGroupsList = function(obj){
    	obj.isLoadingAreaTypes = true;
        areaRestService.getUserAreaTypes().then(function(response){
        	if (angular.isDefined(response)) {
        		var areaGroups = [];
        		for(var i=0;i<response.length;i++){
        			areaGroups.push({code: response[i],text: response[i]});
        		}
        		obj.userAreasGroups = areaGroups;
        	}
        	obj.isLoadingAreaTypes = false;
        }, function(error){
        	areaAlertService.setError();
        	areaAlertService.alertMessage = locale.getString('areas.error_getting_userarea_types');
        	areaAlertService.hideAlert();
        	obj.isLoadingAreaTypes = false;
        });
    };

	return areaHelperService;
});