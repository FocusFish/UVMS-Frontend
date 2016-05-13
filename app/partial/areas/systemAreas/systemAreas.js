angular.module('unionvmsWeb').controller('SystemareasCtrl',function($scope,projectionService,areaAlertService,areaRestService,spatialRestService,areaMapService,areaHelperService,locale,Area){
    $scope.alert = areaAlertService;
    $scope.map = areaMapService.map;
	$scope.sysAreaType = "";
	$scope.selectedProj = "";
	$scope.isSaving = false;
	$scope.validFile = {isValid: undefined};
	$scope.projections = projectionService;
	$scope.helper = areaHelperService;
	$scope.editingType = 'upload';
	$scope.metadataAvailable = false;
	$scope.sysSelection = "map";
	$scope.clickResults = 0;
	$scope.sysNotes = {};
	$scope.datasetNew = {};
    
	$scope.fileNameChanged = function(elem){
		$scope.SysareasForm.areaFile.$setDirty();
		if(elem.value){
			$scope.filepath = elem.value;
			var filename = $scope.filepath.replace(/^.*[\\\/]/, '');
			$scope.$apply(function($scope) {
				$scope.sysAreafile = filename;
				$scope.validFile.isValid = true;
				$scope.files = elem.files;         
			 });
		}else{
			$scope.$apply(function($scope) {
				$scope.sysAreafile = undefined;
				$scope.validFile.isValid = false;
			});
		}
	};
	
	
	//Uploading new file
    $scope.save = function(){
        $scope.saved = true;
        $scope.isSaving = true;
        if ($scope.SysareasForm.$valid && $scope.validFile.isValid){
            $scope.alert.setLoading(locale.getString('areas.uploading_message'));
            var projCode = $scope.projections.getProjectionEpsgById($scope.selectedProj);
        	if(angular.isDefined(projCode) && $scope.sysAreaType){
        		var objTest = {
        				"uploadedFile": $scope.files[0],
        				"crs": projCode,
        				"areaType": $scope.sysAreaType
        		};
        		spatialRestService.uploadFile(objTest).then(
				    function (data) {
				        $scope.alert.removeLoading();
				    	$scope.alert.setSuccess();
				        $scope.alert.alertMessage = locale.getString('areas.upload_system_area_success');
				    	$scope.isSaving = false;
				    	$scope.saved = false;
				    }, function(error) {
				        $scope.alert.removeLoading();
				    	$scope.alert.setError();
				        $scope.alert.alertMessage = locale.getString('areas.upload_system_area_error') + error.data.msg;
				    	$scope.isSaving = false;
				    	$scope.saved = false;
				    }
			    );
        	}else{
        	    $scope.alert.removeLoading();
        		$scope.alert.setError();
        	    $scope.alert.alertMessage = locale.getString('areas.upload_system_area_invalid_field_error');
        		$scope.isSaving = false;
        	}
        } else {
        	$scope.isSaving = false;
        	$scope.alert.setError();
            $scope.alert.alertMessage = locale.getString('areas.upload_system_area_required_fields_error');
        }
    };
    
    //Updating metadata
    $scope.saveMetadata = function(){
        if ($scope.metadataForm.$valid){
            $scope.alert.setLoading(locale.getString('areas.updating_metadata'));
            areaRestService.updateLayerMetadata($scope.helper.metadata).then(function(response){
                $scope.alert.removeLoading();
                $scope.alert.setSuccess();
                $scope.alert.alertMessage = locale.getString('areas.updating_metadata_success');
            }, function(error){
                $scope.alert.removeLoading();
                $scope.alert.setError();
                $scope.alert.alertMessage = locale.getString('areas.updating_metadata_error');
            });
        }
    };
    
    
    //Get full definition for data types, so that we can add the layer to the map
    $scope.getFullDefForItem = function(type){
        var item;
        for (var i = 0; i < $scope.helper.systemAreaTypes.length; i++){
            if ($scope.helper.systemAreaTypes[i].typeName === type){
                 item = $scope.helper.systemAreaTypes[i];
            }
        }
        return item;
    };
    
    $scope.init = function(){
        $scope.saved = false;
        if ($scope.projections.items.length === 0){
            $scope.projections.getProjections();
        }
    };
    
    $scope.$watch('sysAreaType', function(newVal, oldVal){
        if (!angular.isDefined(newVal)){
            areaMapService.removeLayerByType($scope.helper.displayedLayerType);
            $scope.helper.displayedLayerType = undefined;
            $scope.helper.displayedSystemAreaLayer = undefined;
        }
        
        if (angular.isDefined(newVal) && newVal !== oldVal){
        	changeNotes(newVal);
        	resetDatasetTab();
        	$scope.helper.resetMetadata();
            $scope.helper.displayedSystemAreaLayer = newVal;
            var item = $scope.getFullDefForItem(newVal);
            
            if (angular.isDefined(item)){
                if (angular.isDefined($scope.helper.displayedLayerType)){
                    areaMapService.removeLayerByType($scope.helper.displayedLayerType);
                    $scope.helper.displayedLayerType = undefined;
                    
                }
                areaMapService.addWMS(item);
                $scope.helper.displayedLayerType = item.typeName;
                
                if ($scope.editingType === 'metadata'){
                    $scope.metadataForm.$setPristine();
                    $scope.alert.setLoading(locale.getString('areas.getting_area_metadata'));
                    areaRestService.getLayerMetadata(item.typeName).then(getMetadataSuccess, getMetadataFailure);
                }
            }
        }
    });
    
    //Add system areas by search
    $scope.convertAreasResponse = function(data){
        var areas = [];
        for (var i = 0; i < data.length; i++){
            var area = new Area();
            area = area.fromJson(data[i]);
            areas.push(area);
        }
        
        return areas; 
    };
    
    $scope.searchSysAreas = function(){
        if (angular.isDefined($scope.searchSysString) && $scope.searchSysString !== ''){
            $scope.searchLoading = true;
            $scope.sysAreaSearch = [];
            var requestData = {
                areaType: $scope.sysAreaType,
                filter: $scope.searchSysString
            };
            spatialRestService.getAreasByFilter(requestData).then(function(response){
                $scope.sysAreaSearch = $scope.convertAreasResponse(response.data);
                $scope.searchLoading = false;
            }, function(error){
                $scope.errorMessage = locale.getString('spatial.area_selection_modal_get_selected_area_search_error');
                $scope.hasError = true;
                $scope.hideAlerts();
                $scope.searchLoading = false;
            });
        }
    };
    
    $scope.$watch('editingType', function(newVal, oldVal){
        $scope.helper.resetMetadata();
        if (angular.isDefined(newVal) && newVal !== oldVal && newVal === 'metadata'){
            $scope.alert.setLoading(locale.getString('areas.getting_area_metadata'));
            var item = $scope.getFullDefForItem($scope.sysAreaType);
            areaRestService.getLayerMetadata(item.typeName).then(getMetadataSuccess, getMetadataFailure);
        }
    });
    
    var getMetadataSuccess = function(response){
        $scope.metadataAvailable = true;
        $scope.helper.setMetadata(response);
        $scope.alert.removeLoading();
    };
    
    var getMetadataFailure = function(error){
        $scope.metadataAvailable = false;
        $scope.alert.removeLoading();
        $scope.alert.setError();
        $scope.alert.alertMessage = locale.getString('areas.error_getting_user_area_layer');
    };
    
    locale.ready('areas').then(function(){
        $scope.init();
        if ($scope.selectedTab === 'SYSAREAS'){
            $scope.helper.tabChange('SYSAREAS');
        }
    });
    
    $scope.selectArea = function(index){
    	$scope.datasetNew.areaGid = $scope.displayedRecordsArea[index].gid;
    	$scope.selectedArea = $scope.displayedRecordsArea[index].name + ' | ' + $scope.displayedRecordsArea[index].code;
    };
    
    $scope.createDataset = function() {
    	$scope.submittedDataset = true;
    	if($scope.datasetForm.$valid){
    		$scope.datasetNew.areaType = $scope.sysAreaType;
    		areaRestService.createDataset($scope.datasetNew).then(function(){
    			
    		}, function(error){
    			
    		});
    	}
    };
    
    $scope.showAreaDatasets = function(gid){
    	var modalInstance = $modal.open({
            templateUrl: 'partial/areas/datasetListModal/datasetListModal.html',
            controller: 'datasetListModalCtrl',
            size: 'lg',
            resolve: {
                area: function(){
                    return {
                    	areaGid: gid,
                    	areaType: $scope.sysAreaType
                    };
                }
            }
        });
    };
    
    var resetDatasetTab = function(){
    	$scope.datasetNew = {};
    	$scope.selectedArea = undefined;
    	$scope.sysAreaSearch = [];
    	$scope.searchSysString = undefined;
    	$scope.submittedDataset = false;
    	$scope.sysSelection = 'map';
    	$scope.datasetForm.$setPristine();
    };
    
    $scope.mergeParamsWms = function(index, displayedAreasList, areaList){
    	index = areaList.indexOf(displayedAreasList[index]);
        var area = areaList[index];
        var format = new ol.format.WKT();
        var geom = format.readFeature(area.extent).getGeometry();
        geom.transform('EPSG:4326', 'EPSG:3857');
        $scope.map.getView().fit(geom, $scope.map.getSize(), {nearest: false});
        
        var layers = $scope.map.getLayers();
        if (layers.getLength() > 1){
            var layer = layers.getArray().find(function(layer){
               return layer.get('type') === area.areaType; 
            });
            
            var cql = '';
            var src = layer.getSource();
            if (area.areaType === 'USERAREA'){
                var currentParams = src.getParams();
                var cqlComps = currentParams.cql_filter.split(' and');
                cql = cqlComps[0] + ' and ';
            }
            cql += "gid = " + parseInt(area.gid);
            
            src.updateParams({
                time_: (new Date()).getTime(),
                'cql_filter': cql
            });
        }
    };
    
    var changeNotes = function(type){
    	switch(type){
    	case 'PORT':
    		$scope.sysNotes.msg = 'areas.upload_area_port_notes';
    		break;
    	case 'EEZ':
    		$scope.sysNotes.msg = 'areas.upload_area_eez_notes';
    		break;
    	case 'RFMO':
    		$scope.sysNotes.msg = 'areas.upload_area_rfmo_notes';
    		break;
	    case 'PORTAREA':
			$scope.sysNotes.msg = 'areas.upload_area_portarea_notes';
			break;
		default:
			$scope.sysNotes.msg = undefined;
		}
    };
    
});