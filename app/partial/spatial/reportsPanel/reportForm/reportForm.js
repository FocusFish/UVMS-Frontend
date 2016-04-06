angular.module('unionvmsWeb').controller('ReportformCtrl',function($scope, $modal, $anchorScroll, reportMsgService, locale, Report, reportRestService, spatialRestService, configurationService, movementRestService, reportService, SpatialConfig, spatialConfigRestService, userService){
    //Report form mode
    $scope.formMode = 'CREATE';

    $scope.getFormMode = function(mode){
        return mode === $scope.formMode;
    };

    //set visibility types in dropdown option
    $scope.visibilities = [
                           {"text": locale.getString('spatial.reports_table_share_label_private'), "code": "private"},
                           {"text": locale.getString('spatial.reports_table_share_label_scope'), "code": "scope"},
                           {"text": locale.getString('spatial.reports_table_share_label_public'), "code": "public"}
                           ];
    
    //Set positions selector dropdown options
    $scope.positionItems = [];
    $scope.positionItems.push({"text": locale.getString('spatial.reports_form_positions_selector_option_all'), "code": "all"});
    $scope.positionItems.push({"text": locale.getString('spatial.reports_form_positions_selector_option_last'), "code": "last"});

    //Set positions selector dropdown options
    $scope.positionTypeItems = [];
    $scope.positionTypeItems.push({"text": locale.getString('spatial.reports_form_positions_selector_type_option_positions'), "code": "positions"});
    $scope.positionTypeItems.push({"text": locale.getString('spatial.reports_form_positions_selector_type_option_hours'), "code": "hours"});

    //Set vessel search type dropdown options
    $scope.vesselSearchItems = [];
    $scope.vesselSearchItems.push({"text": locale.getString('spatial.reports_form_vessels_search_by_vessel'), "code": "asset"});
    $scope.vesselSearchItems.push({"text": locale.getString('spatial.reports_form_vessels_search_by_group'), "code": "vgroup"});

    //Set movement type dropdown options
    $scope.movementTypes = configurationService.setTextAndCodeForDropDown(configurationService.getValue('MOVEMENT', 'MESSAGE_TYPE'),'MESSAGE_TYPE','MOVEMENT');

    //Set movemment activity type dropdown options
    $scope.activityTypes = configurationService.setTextAndCodeForDropDown(configurationService.getValue('MOVEMENT', 'ACTIVITY_TYPE'), 'ACTIVITY_TYPE', 'MOVEMENT');

    //Set movemment activity type dropdown options
    $scope.categoryTypes = configurationService.setTextAndCodeForDropDown(configurationService.getValue('MOVEMENT', 'CATEGORY_TYPE'), 'CATEGORY_TYPE', 'MOVEMENT');

    $scope.submitingReport = false;

    $scope.showSaveBtn = function(){
        var result = false;
        if ($scope.getFormMode('CREATE')){
            result = true;
        } else {
            if ((angular.isDefined($scope.reportOwner) && $scope.reportOwner === userService.getUserName()) || $scope.isAllowed('Reporting', 'MANAGA_ALL_REPORTS')){
                result = true;
            }
        }
        return result;
    };
    
    $scope.init = function(){
        $scope.report = new Report();
        $scope.formAlert = {
            visible: false,
            msg: ''
        };
        $scope.reportOwner = undefined;
        $scope.submitingReport = false;
        $scope.vesselsSelectionIsValid = true;
        $scope.report.vesselsSelection = [];

        $scope.shared = {
            vesselSearchBy: 'asset',
            searchVesselString: '',
            selectAll: false,
            selectedVessels: 0,
            vessels: [],
            areas: []
        };
    };

    $scope.resetForm = function(){
        $scope.init();
        $scope.reportForm.$setPristine();
        $scope.clearVmsErrors();
    };

    $scope.clearVmsErrors = function(){
        for (var attr in $scope.reportForm.$error){
            $scope.reportForm.$setValidity(attr, true);
        }
    };

    $scope.validateRanges = function(){
        var min, max, minD, maxD;
        var status = true;

        //Validate positions speed range
        if ($scope.report.hasVmsFilter === true && $scope.report.hasPositionsFilter === true && angular.isDefined($scope.report.vmsFilters.positions)){
            min = $scope.report.vmsFilters.positions.movMinSpeed;
            max = $scope.report.vmsFilters.positions.movMaxSpeed;
            
            validateRangeFieldGroup(min,max,'movMinSpeed','movMaxSpeed','positionSecForm');
        }

        //Validate segments speed and duration ranges
        if ($scope.report.hasVmsFilter === true && $scope.report.hasSegmentsFilter === true && angular.isDefined($scope.report.vmsFilters.segments)){
            min = $scope.report.vmsFilters.segments.segMinSpeed;
            max = $scope.report.vmsFilters.segments.segMaxSpeed;
            
            validateRangeFieldGroup(min,max,'segMinSpeed','segMaxSpeed','segmentSecForm');

            minD = $scope.report.vmsFilters.segments.segMinDuration;
            maxD = $scope.report.vmsFilters.segments.segMaxDuration;

            validateRangeFieldGroup(minD,maxD,'segMinDuration','segMaxDuration','segmentSecForm');
        }

        //Validate tracks time at sea and duration ranges
        if ($scope.report.hasVmsFilter === true && $scope.report.hasTracksFilter === true && angular.isDefined($scope.report.vmsFilters.tracks)){
            min = $scope.report.vmsFilters.tracks.trkMinTime;
            max = $scope.report.vmsFilters.tracks.trkMaxTime;
            
            validateRangeFieldGroup(min,max,'trkMinTime','trkMaxTime','trackSecForm');

            minD = $scope.report.vmsFilters.tracks.trkMinDuration;
            maxD = $scope.report.vmsFilters.tracks.trkMaxDuration;
            
            validateRangeFieldGroup(minD,maxD,'trkMinDuration','trkMaxDuration','trackSecForm');
        }
    };
    
    var validateRangeFieldGroup = function(min,max,fieldMin,fieldMax,subForm){
    	if(angular.isDefined(min) && min<0){
    		$scope.reportForm.reportBodyForm[subForm][fieldMin].$setValidity('minError', false);
        }else{
            $scope.reportForm.reportBodyForm[subForm][fieldMin].$setValidity('minError', true);
    	}
    	if(angular.isDefined(max) && max<0){
    		$scope.reportForm.reportBodyForm[subForm][fieldMax].$setValidity('minError', false);
        }else{
            $scope.reportForm.reportBodyForm[subForm][fieldMax].$setValidity('minError', true);
    	}
        if(angular.isDefined(min) && angular.isDefined(max) && min !== null && max != null && min > max){
            $scope.reportForm.reportBodyForm[subForm][fieldMax].$setValidity('maxError', false);
        }else{
            $scope.reportForm.reportBodyForm[subForm][fieldMax].$setValidity('maxError', true);
        }
    };

    $scope.saveReport = function(){
        $scope.submitingReport = true;
        $scope.validateRanges();
        if ($scope.reportForm.$valid && $scope.vesselsSelectionIsValid){
        	$scope.configModel = new SpatialConfig();
            if ($scope.formMode === 'CREATE'){
            	$scope.report.currentConfig.mapConfiguration.layerSettings = checkLayerSettings($scope.report.currentConfig.mapConfiguration.layerSettings);
            	$scope.report = checkMapConfigDifferences($scope.report);
                reportRestService.createReport($scope.report).then(createReportSuccess, createReportError);
            } else if ($scope.formMode === 'EDIT' || $scope.formMode === 'EDIT-FROM-LIVEVIEW'){
            	$scope.report.currentConfig.mapConfiguration.layerSettings = checkLayerSettings($scope.report.currentConfig.mapConfiguration.layerSettings);
            	$scope.report = checkMapConfigDifferences($scope.report);
                reportRestService.updateReport($scope.report).then(updateReportSuccess, updateReportError);
            }
        } else {
            var invalidElm = angular.element('#reportForm')[0].querySelector('.ng-invalid');
            var errorElm = angular.element('#reportForm')[0].querySelector('.has-error');
            if (invalidElm){
                invalidElm.scrollIntoView();
            } else if (invalidElm === null && errorElm){
                errorElm.scrollIntoView();
            }
        }
    };

    $scope.validateDates = function(sDate, eDate){
        var sMomDate = moment(sDate, 'YYYY-MM-DD');
        var eMomDate = moment(eDate, 'YYYY-MM-DD');

        if (sMomDate.isAfter(eMomDate)){
            return false;
        } else {
            return true;
        }
    };

    $scope.openAreaSelectionModal = function(){
        var modalInstance = $modal.open({
            templateUrl: 'partial/spatial/reportsPanel/reportForm/areasSelectionModal/areasSelectionModal.html',
            controller: 'AreasselectionmodalCtrl',
            size: 'lg',
            resolve: {
                selectedAreas: function(){
                    return $scope.report.areas;
                }
            }
        });

        modalInstance.result.then(function(data){
            $scope.report.areas = data;
        });
    };
    
    $scope.openMapConfigurationModal = function(){
        var modalInstance = $modal.open({
            templateUrl: 'partial/spatial/reportsPanel/reportForm/mapConfigurationModal/mapConfigurationModal.html',
            controller: 'MapconfigurationmodalCtrl',
            size: 'lg',
            resolve: {
                reportConfigs: function(){
                    return $scope.report.currentConfig;
                }
            }
        });

        modalInstance.result.then(function(data){
            $scope.report.currentConfig.mapConfiguration = data.mapSettings;
        });
    };
    
    $scope.runReport = function() {
    	$scope.submitingReport = true;
    	$scope.mergedReport = undefined;
    	$scope.validateRanges();
    	if($scope.reportForm.reportBodyForm.$valid && $scope.vesselsSelectionIsValid){
	    	reportService.outOfDate = true;
	    	spatialConfigRestService.getUserConfigs().then(getUserConfigsSuccess, getUserConfigsFailure);
    	}else{
    		var invalidElm = angular.element('#reportForm')[0].querySelector('.ng-invalid');
            var errorElm = angular.element('#reportForm')[0].querySelector('.has-error');
            if (invalidElm){
                invalidElm.scrollIntoView();
            } else if (invalidElm === null && errorElm){
                errorElm.scrollIntoView();
            }
    	}
    };
    
    $scope.saveAsReport = function() {
    	$scope.submitingReport = true;
        $scope.validateRanges();
        if ($scope.reportForm.reportBodyForm.$valid && $scope.vesselsSelectionIsValid){
        	var modalInstance = $modal.open({
                templateUrl: 'partial/spatial/reportsPanel/reportForm/saveAsModal/saveAsModal.html',
                controller: 'SaveasmodalCtrl',
                size: 'md',
                resolve: {
                    reportData: function(){
                        return $scope.report;
                    }
                }
            });

            modalInstance.result.then(function(data){
            	data.currentConfig.mapConfiguration.layerSettings = checkLayerSettings(data.currentConfig.mapConfiguration.layerSettings);
            	data = checkMapConfigDifferences(data);
            	reportRestService.createReport(data).then(createReportSuccess, createReportError);
            });
        } else {
            var invalidElm = angular.element('#reportForm')[0].querySelector('.ng-invalid');
            var errorElm = angular.element('#reportForm')[0].querySelector('.has-error');
            if (invalidElm){
                invalidElm.scrollIntoView();
            } else if (invalidElm === null && errorElm){
                errorElm.scrollIntoView();
            }
        }
    	
    };
    
    $scope.$on('openReportForm', function(e, args){
        $scope.init();
        
        if (angular.isDefined(args)){
            $scope.reportOwner = args.report.createdBy;
        }
        
        $scope.formMode = 'CREATE';
        $scope.reportForm.$setPristine();
        if (args){
        	if(args.report.isFromLiveView){
        		$scope.formMode = 'EDIT-FROM-LIVEVIEW';
        	}else{
        		$scope.formMode = 'EDIT';
        	}
            $scope.report = $scope.report.fromJson(args.report);
        }
        $scope.report.currentConfig = {mapConfiguration: {}};
        angular.copy($scope.report.mapConfiguration,$scope.report.currentConfig.mapConfiguration);
    });

    $scope.$watch('report.positionSelector', function(newVal, oldVal){
        if ($scope.report && newVal === 'all'){
            //Reset X Value field
            $scope.report.xValue = undefined;
        }
    });

    $scope.$watch('report.positionTypeSelector', function(newVal, oldVal){
        if ($scope.report && newVal === 'hours'){
            $scope.report.startDateTime = undefined;
            $scope.report.endDateTime = undefined;
        }
    });

    var createReportSuccess = function(response){
        $scope.toggleReportForm();
        reportMsgService.show(locale.getString('spatial.success_create_report'), 'success');
        $scope.$emit('reloadReportsList');
    };

    var createReportError = function(error){
        reportError(error,'spatial.error_create_report');
    };

    var updateReportSuccess = function(response){
        $scope.toggleReportForm();
        reportMsgService.show(locale.getString('spatial.success_update_report'), 'success');
        $scope.$emit('reloadReportsList');
    };

    var updateReportError = function(error){
        reportError(error,'spatial.error_update_report');
    };

    var reportError = function(error, defaultMsg) {
        $scope.formAlert.visible = true;
        //var errorMsgCode = error.data.msg?'spatial.' + error.data.msg:'spatial.error_create_report';
        var errorMsg = defaultMsg;

        if (angular.isDefined(error.data.msg)) {
            errorMsg = locale.getString('spatial.'+ error.data.msg);
        } else {
            errorMsg = locale.getString('spatial.'+ defaultMsg);
        }
        
        $scope.formAlert.msg = errorMsg;
    };
    
    var checkMapConfigDifferences = function(report){
		if(!angular.equals(report.mapConfiguration, report.currentConfig.mapConfiguration)){
			
        	if(!angular.equals(report.mapConfiguration.coordinatesFormat, report.currentConfig.mapConfiguration.coordinatesFormat)){
        		report.mapConfiguration.coordinatesFormat = report.currentConfig.mapConfiguration.coordinatesFormat;
        	}
			if(!angular.equals(report.mapConfiguration.displayProjectionId, report.currentConfig.mapConfiguration.displayProjectionId)){
	    		report.mapConfiguration.displayProjectionId = report.currentConfig.mapConfiguration.displayProjectionId;
	    	}
			if(!angular.equals(report.mapConfiguration.mapProjectionId, report.currentConfig.mapConfiguration.mapProjectionId)){
	    		report.mapConfiguration.mapProjectionId = report.currentConfig.mapConfiguration.mapProjectionId;
	    	}
			if(!angular.equals(report.mapConfiguration.scaleBarUnits, report.currentConfig.mapConfiguration.scaleBarUnits)){
	    		report.mapConfiguration.scaleBarUnits = report.currentConfig.mapConfiguration.scaleBarUnits;
	    	}
			
			if(!angular.equals(report.mapConfiguration.stylesSettings, report.currentConfig.mapConfiguration.stylesSettings)){
				report.mapConfiguration.stylesSettings = report.currentConfig.mapConfiguration.stylesSettings;
	    	}
			if(!angular.equals(report.mapConfiguration.visibilitySettings, report.currentConfig.mapConfiguration.visibilitySettings)){
				report.mapConfiguration.visibilitySettings = report.currentConfig.mapConfiguration.visibilitySettings;
	    	}
			if(!angular.equals(report.mapConfiguration.layerSettings, report.currentConfig.mapConfiguration.layerSettings)){
				report.mapConfiguration.layerSettings = report.currentConfig.mapConfiguration.layerSettings;
	    	}
    	}
		return report;
    };
    
    var checkLayerSettings = function(layerSettings) {
        
	    if(angular.isDefined(layerSettings)){
	        var layerData = {};
			if(angular.isDefined(layerSettings.portLayers) && !_.isEmpty(layerSettings.portLayers)){
	    		var ports = [];
	    		angular.forEach(layerSettings.portLayers, function(value,key) {
	    			var port = {'serviceLayerId': value.serviceLayerId, 'order': key};
		    		ports.push(port);
		    	});
	    		layerSettings.portLayers = [];
	    		angular.copy(ports,layerSettings.portLayers);
	    	}else if(!angular.isDefined(layerSettings.portLayers)){
	    		layerSettings.portLayers = undefined;
	    	}
		
	    	if(angular.isDefined(layerSettings.areaLayers && !_.isEmpty(layerSettings.areaLayers))){
	    		var areas = [];
	    		angular.forEach(layerSettings.areaLayers, function(value,key) {
	    			var area;
	    			switch (value.areaType) {
		    			case 'sysarea':
		    				area = {'serviceLayerId': value.serviceLayerId, 'areaType': value.areaType, 'order': key};
		    				break;
		    			case 'userarea':
		    				area = {'serviceLayerId': value.serviceLayerId, 'areaType': value.areaType, 'gid': value.gid, 'order': key};
		    				break;
		    			case 'areagroup':
		    				area = {'serviceLayerId': value.serviceLayerId, 'areaType': value.areaType, 'areaGroupName': value.name, 'order': key};
		    				break;
		    		}
	    			areas.push(area);
		    	});
	    		layerSettings.areaLayers = [];
	    		angular.copy(areas,layerSettings.areaLayers);
			}else{
				layerSettings.areaLayers = undefined;
			}
	    	
	    	if(angular.isDefined(layerSettings.additionalLayers) && !_.isEmpty(layerSettings.additionalLayers)){
	    		var additionals = [];
	    		angular.forEach(layerSettings.additionalLayers, function(value,key) {
	    			var additional = {'serviceLayerId': value.serviceLayerId, 'order': key};
	    			additionals.push(additional);
		    	});
	    		layerSettings.additionalLayers = [];
	    		angular.copy(additionals,layerSettings.additionalLayers);
	    	}else{
				layerSettings.additionalLayers = undefined;
			}
	    	
	    	if(angular.isDefined(layerSettings.baseLayers) && !_.isEmpty(layerSettings.baseLayers)){
	    		var bases = [];
	    		angular.forEach(layerSettings.baseLayers, function(value,key) {
	    			var base = {'serviceLayerId': value.serviceLayerId, 'order': key};
	    			bases.push(base);
		    	});
	    		layerSettings.baseLayers = [];
	    		angular.copy(bases,layerSettings.baseLayers);
	    	}else{
				layerSettings.baseLayers = undefined;
			}
		}
	    return layerSettings;
    };
    
    var mergeSettings = function(){
    	var mergedReport = new Report();
    	angular.copy($scope.report, mergedReport);
    	
    	if(!angular.isDefined(mergedReport.currentConfig.mapConfiguration.mapProjectionId) && 
    			!angular.isDefined(mergedReport.currentConfig.mapConfiguration.displayProjectionId) && !angular.isDefined(mergedReport.currentConfig.mapConfiguration.coordinatesFormat) && 
    			!angular.isDefined(mergedReport.currentConfig.mapConfiguration.scaleBarUnits)){
    		
    		mergedReport.currentConfig.mapConfiguration.spatialConnectId = $scope.userConfig.mapSettings.spatialConnectId;
    		mergedReport.currentConfig.mapConfiguration.mapProjectionId = $scope.userConfig.mapSettings.mapProjectionId;
    		mergedReport.currentConfig.mapConfiguration.displayProjectionId = $scope.userConfig.mapSettings.displayProjectionId;
    		mergedReport.currentConfig.mapConfiguration.coordinatesFormat = $scope.userConfig.mapSettings.coordinatesFormat;
    		mergedReport.currentConfig.mapConfiguration.scaleBarUnits = $scope.userConfig.mapSettings.scaleBarUnits;
    	}
//    	mergedReport.mapConfiguration.refreshRate = $scope.userConfig.mapSettings.refreshRate;
//    	mergedReport.mapConfiguration.refreshStatus = $scope.userConfig.mapSettings.refreshStatus
    	
    	if(!angular.isDefined(mergedReport.currentConfig.mapConfiguration.stylesSettings)){
    		mergedReport.currentConfig.mapConfiguration.stylesSettings = $scope.userConfig.stylesSettings;
    	}
    	
    	if(!angular.isDefined(mergedReport.currentConfig.mapConfiguration.layerSettings)){
    		mergedReport.currentConfig.mapConfiguration.layerSettings = $scope.userConfig.layerSettings;
    	}
    	mergedReport.currentConfig.mapConfiguration.layerSettings = checkLayerSettings(mergedReport.currentConfig.mapConfiguration.layerSettings);
    	
    	if(!angular.isDefined(mergedReport.currentConfig.mapConfiguration.visibilitySettings)){
    		mergedReport.currentConfig.mapConfiguration.visibilitySettings = $scope.userConfig.visibilitySettings;
    	}
    	
    	return mergedReport;
    };
    
    var getUserConfigsSuccess = function(response){
	    $scope.srcConfigObj = response;
	    var model = new SpatialConfig();
        $scope.userConfig = model.forUserPrefFromJson(response);
        $scope.mergedReport = mergeSettings();
        
        spatialConfigRestService.getMapConfigsFromReport(getMapConfigs()).then(getMapConfigsFromReportSuccess, getMapConfigsFromReportFailure);
	};
	
	var getUserConfigsFailure = function(error){
	    $anchorScroll();
	    $scope.formAlert.visible = true;
//	    $scope.alert.hasError = true;
	    $scope.formAlert.msg = locale.getString('spatial.user_preferences_error_getting_configs');
	    $scope.formAlert.visible = false;
	};
	
	var getMapConfigsFromReportSuccess = function(data){
		angular.copy($scope.mergedReport.currentConfig.mapConfiguration,$scope.mergedReport.mapConfiguration);
		delete $scope.mergedReport.currentConfig;
		reportService.runReportWithoutSaving($scope.mergedReport,data);
    	$scope.$emit('goToLiveView');
    	$scope.toggleReportForm();
	};
	
	var getMapConfigsFromReportFailure = function(error){
	    $anchorScroll();
	    $scope.formAlert.visible = true;
//	    $scope.alert.hasError = true;
	    $scope.formAlert.msg = locale.getString('spatial.user_preferences_error_getting_configs');
	    $scope.formAlert.visible = false;
	};
    
	var getMapConfigs = function(){
		return {
			toolSettings: {
			       "control": [
			                   {
			                       "type": "zoom"
			                   },
			                   {
			                       "type": "drag"
			                   },
			                   {
			                       "type": "scale"
			                   },
			                   {
			                       "type": "mousecoords"
			                   },
			                   {
			                       "type": "history"
			                   }
			               ],
			               "tbControl": [
			                   {
			                       "type": "measure"
			                   },
			                   {
			                       "type": "fullscreen"
			                   }
			               ]
			           },
			mapSettings: {
				mapProjectionId: $scope.mergedReport.currentConfig.mapConfiguration.mapProjectionId,
				displayProjectionId: $scope.mergedReport.currentConfig.mapConfiguration.displayProjectionId,
				coordinatesFormat: $scope.mergedReport.currentConfig.mapConfiguration.coordinatesFormat,
				scaleBarUnits: $scope.mergedReport.currentConfig.mapConfiguration.scaleBarUnits
			},
			stylesSettings: $scope.mergedReport.currentConfig.mapConfiguration.stylesSettings,
			layerSettings: $scope.mergedReport.currentConfig.mapConfiguration.layerSettings,
			visibilitySettings: $scope.mergedReport.currentConfig.mapConfiguration.visibilitySettings,
			reportProperties: {
		        startDate : $scope.mergedReport.startDateTime,
		        endDate : $scope.mergedReport.endDateTime
			}
		};
	};
	
});
