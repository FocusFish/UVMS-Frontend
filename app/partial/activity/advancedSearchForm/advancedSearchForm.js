/**
 * @memberof unionvmsWeb
 * @ngdoc controller
 * @name AdvancedsearchformCtrl
 * @param $scope {Service} controller scope
 * @param activityService {Service} The activity service <p>{@link unionvmsWeb.activityService}</p>
 * @description
 *  The controller for the advanced search form of the activity tab table  
 */
angular.module('unionvmsWeb').controller('AdvancedsearchformCtrl',function($scope, activityService){
    $scope.actServ = activityService;
    $scope.isFormValid = true;
    
    $scope.codeLists = {
        comChannels: null,
        purposeCodes: null,
        reportTypes: null,
        gearTypes: null,
        activityTypes: null,
        weightUnits: [{code: 'kg', text: 'Kg'}, {code: 't', text: 'Ton'}]
    };

    $scope.advancedSearchObject = {
        weightUnit: "kg", //by default is kg
        comChannel: undefined,
        fromId: undefined,
        fromName: undefined,
        startDateTime: undefined,
        endDateTime: undefined,
        vesselId: undefined,
        vesselName: undefined,
        purposeCode: undefined,
        reportType: undefined,
        activityType: undefined,
        area: undefined,
        port: undefined,
        gearType: undefined,
        species: undefined,
        master: undefined,
        minWeight: undefined,
        maxWeight: undefined
    };
    
    /**
     * Get all available communication channels from Activity module
     * 
     * @memberof AdvancedsearchformCtrl
     * @public
     * @alias getComChannels
     * @returns {Array} An array with all communication channels
     */
    $scope.getComChannels = function(){
        //FIXME replace with proper service
        return [{code: 'FLUX', text: 'FLUX'}];
    };
    
    /**
     * Get all purpose codes and their human readable text from MDR
     * 
     * @memberof AdvancedsearchformCtrl
     * @public
     * @alias getPurposeCodes
     * @returns {Array} An array with all purpose codes
     */
    $scope.getPurposeCodes = function(){
        //FIXME replace with proper service
        return [{
            code: '1', text: 'Cancellation'
        },{
            code: '3', text: 'Delete'
        },{
            code: '5', text: 'Replacement (correction)'
        },{
            code: '9', text: 'Original report'
        }];
    };
    
    /**
     * Get all report types from MDR
     * 
     * @memberof AdvancedsearchformCtrl
     * @public
     * @alias getReportTypes
     * @returns {Array} An array with all report types
     */
    $scope.getReportTypes = function(){
        //FIXME replace with proper service
        return [{
            code: 'NOTIFICATION', text: 'Notification'
        },{
            code: 'DECLARATION', text: 'Declaration'
        }];
    };
    
    /**
     * Get all gear types from MDR
     * 
     * @memberof AdvancedsearchformCtrl
     * @public
     * @alias getGearTypes
     * @returns {Array} An array with all gear types
     */
    $scope.getGearTypes = function(){
        //FIXME replace with proper service
        return [{
            code: 'GNS', text: 'Set gillnets (anchored)'
        },{
            code: 'GND', text: 'Driftnets'
        },{
            code: 'GNC', text: 'Encircling gillnets'
        },{
            code: 'GTR', text: 'Combined gillnets-trammel nets'
        }];
    };
    
    /**
     * Get all activity types from MDR
     * 
     * @memberof AdvancedsearchformCtrl
     * @public
     * @alias getActivityTypes
     * @returns {Array} An array with all activity types
     */
    $scope.getActivityTypes = function(){
        //FIXME replace with proper service
        return [{
            code: 'DEPARTURE', text: 'Departure'
        },{
            code: 'ARRIVAL', text: 'ARRIVAL'
        },{
            code: 'AREA_ENTRY', text: 'AREA_ENTRY'
        },{
            code: 'AREA_EXIT', text: 'AREA_ENTRY'
        }];
    };
    
    /**
     * Reset search form and clear table results
     * 
     * @memberof AdvancedsearchformCtrl
     * @public
     * @alias resetSearch
     */
    $scope.resetSearch = function(){
        var keys = _.keys($scope.advancedSearchObject);
        angular.forEach(keys, function(key) {
        	if (key !== 'weightUnit'){
        	    $scope.advancedSearchObject[key] = undefined;
        	} else {
        	    $scope.advancedSearchObject.weightUnit = 'kg';
        	}
        });
        $scope.actServ.resetReportsListTableState();
        $scope.actServ.clearAttributeByType('activities');
    };
    
    /**
     * Search for FA reports using user search criteria defined in the search form
     * 
     * @memberof AdvancedsearchformCtrl
     * @public
     * @alias searchFAReports
     */
    $scope.searchFAReports = function(){
        $scope.isFormValid = false;
        if ($scope.activityAdvancedSearchForm.$valid){
            $scope.isFormValid = true;
            $scope.actServ.reportsList.isLoading = true;
            $scope.actServ.resetReportsListTableState();
            
            var keyMapper = {
                reportType: 'REPORT_TYPE',
                fromId: 'FROM_ID',
                fromName: 'FROM_NAME',
                startDateTime: 'PERIOD_START',
                endDateTime: 'PERIOD_END',
                vesselName: 'VESSEL_NAME',
                vesselId: 'VESSEL_IDENTIFIRE',
                purposeCode: 'PURPOSE',
                gearType: 'GEAR',
                species: 'SPECIES',
                master: 'MASTER',
                area: 'AREAS',
                port: 'PORT',
                minWeight: 'QUNTITY_MIN',
                maxWeight: 'QUNTITY_MAX',
                comChannel: 'SOURCE',
                activityType: 'ACTIVITY_TYPE'
            };
            
            var formatedSearch = {};
            angular.forEach($scope.advancedSearchObject, function(value, key) {
                if (key !== 'weightUnit' && (!angular.isDefined(value) || (value !== null && value !== ''))){
                    this[keyMapper[key]] = value;
                }
            }, formatedSearch);
            
            if (angular.isDefined(formatedSearch.QUNTITY_MIN) || angular.isDefined(formatedSearch.QUNTITY_MAX)){
                formatedSearch.WEIGHT_MEASURE = $scope.advancedSearchObject.weightUnit;
            }
            
            if (angular.isDefined(formatedSearch.QUNTITY_MAX) && !angular.isDefined(formatedSearch.QUNTITY_MIN)){
                formatedSearch.QUNTITY_MIN = 0;
            }
            
            $scope.actServ.reportsList.searchObject = formatedSearch;
            
            $scope.actServ.getActivityList();
        }
    };
    
    /**
     * Get the data for all comboboxes used in the the advanced search form
     * 
     * @memberof AdvancedsearchformCtrl
     * @private
     */
    function getComboboxData(){
        var lists = ['comChannels', 'purposeCodes', 'reportTypes', 'gearTypes', 'activityTypes'];
        angular.forEach(lists, function(list) {
        	var fnName = 'get' + list.substring(0,1).toUpperCase() + list.substring(1);
        	$scope.codeLists[list] = $scope[fnName]();
        });
    }
    
    /**
     * Initialization function
     * 
     * @memberof ActivityCtrl
     * @private
     */
    function init(){
        getComboboxData();
    }

    init();
});
