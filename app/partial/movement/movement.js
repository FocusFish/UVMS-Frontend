angular.module('unionvmsWeb').controller('MovementCtrl',function($scope, $timeout, $filter, alertService, movementRestService, searchService, locale, $stateParams, ManualPositionReportModal, csvService, SearchResults, $resource, longPolling){

    //Current filter and sorting for the results table
    $scope.sortFilter = '';
    $scope.editSelectionDropdownItems = [{'text':locale.getString('movement.editselection_see_on_map'),'code':'MAP'}, {'text':locale.getString('movement.editselection_export_selection'),'code':'EXPORT'}, {'text':locale.getString('movement.editselection_inactivate'),'code':'INACTIVE'}];
    $scope.newMovementsCount = 0;

    //Search objects and results
    $scope.currentSearchResults = new SearchResults('vessel.name', false, locale.getString('movement.movement_search_error_result_zero_pages'));

    //Selected by checkboxes
    $scope.selectedMovements = [];

    var movement2ManualPosition = function(movement) {
        return {
            id: movement.id,
            guid: undefined,
            speed: movement.movement.measuredSpeed,
            course: movement.movement.course,
            time: movement.time,
            updatedTime: undefined,
            status: movement.movement.status,
            archived: undefined,
            carrier: {
                cfr: undefined,
                name: movement.vessel.name,
                externalMarking: movement.vessel.externalMarking,
                ircs: movement.vessel.ircs,
                flagState: movement.vessel.state
            },
            position: {
                longitude: movement.movement.longitude,
                latitude: movement.movement.latitude
            }
        };
    };

    var updateSearchWithGuid = function(guid) {
        searchService.searchMovements().then(function(page) {
            if (page.hasItemWithGuid(guid)) {
                $scope.clearSelection();
                retriveMovementsSuccess(page);
            }
            else {
                $scope.newMovementsCount++;
            }
        });
    };

    $scope.resetSearch = function() {
        $scope.$broadcast("searchMovements");
    };

    var init = function(){
         if ($stateParams.id) {
            movementRestService.getMovement($stateParams.id).then(function(movement) {
                ManualPositionReportModal.show(movement2ManualPosition(movement), {readOnly: true});
            });
         }

         longPolling.poll("/movement/activity/movement", function(response) {
            response.ids.length > 0 && updateSearchWithGuid(response.ids[0]);
         }, function(error) {
            console.log("movement long-polling was interrupted with error: " + error);
         });
    };

    $scope.searchMovements = function(){
        $scope.newMovementsCount = 0;
        $scope.clearSelection();
        $scope.currentSearchResults.clearErrorMessage();
        $scope.currentSearchResults.setLoading(true);
        searchService.searchMovements()
            .then(retriveMovementsSuccess, retriveMovementsError);
    };

    var retriveMovementsSuccess = function(searchResultListPage){
        console.info("Success in retrieveing movements..");
        $scope.currentSearchResults.updateWithNewResults(searchResultListPage);
    };

    var retriveMovementsError = function(error){
        $scope.currentSearchResults.removeAllItems();
        $scope.currentSearchResults.setLoading(false);
        $scope.currentSearchResults.setErrorMessage(locale.getString('common.search_failed_error'));
    };

    //Goto page in the search results
    $scope.gotoPage = function(page){
        if(angular.isDefined(page)){
            searchService.setPage(page);
            $scope.searchMovements();
        }
    };

   //Clear the selection
    $scope.clearSelection = function(){
        $scope.selectedMovements = [];
    };

    //Add a mobile terminal to the selection
    $scope.addToSelection = function(item){
        $scope.selectedMovements.push(item);
    };

    //Remove a mobile terminal from the selection
    $scope.removeFromSelection = function(item){
        $.each($scope.selectedMovements, function(index, movement){
            if(movement.isEqualMovement(item)){
                $scope.selectedMovements.splice(index, 1);
                return false;
            }
        });
    };

    //Callback function for the "Edit selection" dropdown
    $scope.editSelectionCallback = function(selectedItem){
        if($scope.selectedMovements.length){
            //SEE ON MAP
            if(selectedItem.code === 'MAP'){
               alertService.showInfoMessageWithTimeout("See on map is not implemented yet. " +$scope.selectedMovements.length +" movements were selected");
            }
            //EXPORT SELECTION
            else if(selectedItem.code === 'EXPORT'){
                $scope.exportAsCSVFile(true);
            }
            //INACTIVATE
            else if(selectedItem.code === 'INACTIVATE'){
                alertService.showInfoMessageWithTimeout(locale.getString('common.not_implemented'));
            }
        }else{
            alertService.showInfoMessageWithTimeout(locale.getString('common.no_items_selected'));
        }
    };

    $scope.print = function(){
        console.log("Print...");
        window.print();
    };

    //Export data as CSV file
    $scope.exportAsCSVFile = function(onlySelectedItems){
        var filename = 'positionReports.csv';

        //Set the header columns
        var header = [
            locale.getString('movement.table_header_flag_state'),
            locale.getString('movement.table_header_external_marking'),
            locale.getString('movement.table_header_ircs'),
            locale.getString('movement.table_header_name'),
            locale.getString('movement.table_header_time'),
            locale.getString('movement.table_header_latitude'),
            locale.getString('movement.table_header_longitude'),
            locale.getString('movement.table_header_status'),
            locale.getString('movement.table_header_ms'),
            locale.getString('movement.table_header_cs'),
            locale.getString('movement.table_header_course'),
            locale.getString('movement.table_header_movement_type'),
            locale.getString('movement.table_header_source')
        ];

        //Set the data columns
        var getData = function() {
            var exportItems;
            //Export only selected items
            if(onlySelectedItems){
                exportItems = $scope.selectedMovements;
            }
            //Export all logs in the table
            else{
                exportItems = $scope.currentSearchResults.items;
            }
            return exportItems.reduce(
                function(csvObject, item){
                    var csvRow = [
                        item.vessel.state,
                        item.vessel.externalMarking,
                        item.vessel.ircs,
                        item.vessel.name,
                        $filter('confDateFormat')(item.time),
                        $filter('confCoordinateFormat')(item.movement.latitude),
                        $filter('confCoordinateFormat')(item.movement.longitude),
                        item.movement.status,
                        item.movement.reportedSpeed +' ' +locale.getString('movement.movement_speed_unit'),
                        item.movement.calculatedSpeed +' ' +locale.getString('movement.movement_speed_unit'),
                        item.movement.reportedSpeedCourse,
                        item.movement.movementType,
                        $filter('transponderName')(item.movement.source)
                    ];
                    csvObject.push(csvRow);
                    return csvObject;
                },[]
            );
        };

        //Create and download the file
        csvService.downloadCSVFile(getData(), header, filename);
    };


    $scope.$on("$destroy", function() {
        alertService.hideMessage();
        searchService.reset();
    });


    init();

});