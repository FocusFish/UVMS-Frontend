angular.module('unionvmsWeb').controller('ExchangeCtrl',function($scope, $filter, locale, searchService, exchangeRestService, ManualPositionReportModal, ManualPosition, alertService, csvService){

    $scope.sendingQueueSearchResults = {
        page: 0,
        pageCount: 0,
        messages: [],
        sortBy: "dateReceived",
        sortReverse: true,
        errorMessage: ""
    };

    $scope.searchResults = {
        page: 0,
        pageCount: 0,
        messages: [],
        sortBy: "dateReceived",
        sortReverse: true,
        errorMessage: "",
        loading : false,
        incomingOutgoing: "all"
    };

    var init = function(){
        $scope.searchExchange();
        $scope.searchSendingQueue();
    };

    $scope.filterIncomingOutgoing = function(message) {
        if ($scope.searchResults.incomingOutgoing === "all") {
            return true;
        }

        return message.outgoing ? $scope.searchResults.incomingOutgoing === "outgoing" : $scope.searchResults.incomingOutgoing === "incoming";
    };

    $scope.searchExchange = function() {
        $scope.searchResults.loading = true;
        $scope.searchResults.messages = [];
        $scope.searchResults.errorMessage = "";
        searchService.searchExchange("MESSAGES").then(function(page) {
            $scope.searchResults.messages = page.exchangeMessages;
            $scope.searchResults.page = page.currentPage;
            $scope.searchResults.pageCount = page.totalNumberOfPages;            
            $scope.searchResults.loading = false;
            if(page.totalNumberOfPages === 0 ){
              $scope.searchResults.errorMessage = locale.getString('exchange.search_zero_results_error');            
            }
        },
        function(error) {
            $scope.searchResults.errorMessage = error;
            $scope.searchResults.loading = false;
        });
    };

     $scope.searchSendingQueue = function(){
        searchService.searchExchange("SENDINGQUEUE").then(function(page) {
            $scope.sendingQueueSearchResults.messages = page.exchangeMessages;
            $scope.sendingQueueSearchResults.page = page.currentPage;
            $scope.sendingQueueSearchResults.pageCount = page.totalNumberOfPages;
            $scope.sendingQueueSearchResults.errorMessage = "";
        },
        function(error) {
            $scope.sendingQueueSearchResults.errorMessage = error;
        });
     };

    $scope.showMessageDetails = function(message) {
        console.log(message);

        //Create dummy report for now
        //TODO: Use real message values
        var report = new ManualPosition();
        report.id = message.id;
        report.speed = 23.3;
        report.course = 134;
        report.time = message.dateRecieved;
        report.updatedTime = message.dateForward;
        report.status = "010";
        report.archived = false;
        report.position.longitude = 54.56;
        report.position.latitude = 77.35434;
        report.carrier.cfr ="SWE0001234";
        report.carrier.name ="Nordvåg";
        report.carrier.externalMarking ="VG40";
        report.carrier.ircs ="SKRM";
        report.carrier.flagState ="SWE";
        report.message = message;

        //open modal
        var modalOptions = {
            sentReport : true
        };        
        ManualPositionReportModal.show(report, modalOptions).then(function(result) {
            //Nothing
        });
    };

    $scope.getStatusLabel = function(status){
        var label;
        switch(status){
            case 'SUCCESSFUL':
                label = locale.getString('exchange.status_successful'); 
                break;
            case 'PENDING':
                label = locale.getString('exchange.status_pending'); 
                break;
            case 'ERROR':
                label = locale.getString('exchange.status_failed'); 
                break;
            default:
                label = "";
        }
        return label;
    };


    $scope.print = function(){
        alertService.showInfoMessageWithTimeout(locale.getString('common.not_implemented'));
    };

    //Edit selection
    $scope.editSelectionDropdownItems =[
        {'text':locale.getString('common.export_selection'),'code':'EXPORT'}
    ];

    //Export data as CSV file
    $scope.exportLogsAsCSVFile = function(onlySelectedItems){
        var filename = 'exchangeLogs.csv';

        //Set the header columns
        var header = [
            locale.getString('exchange.table_header_date_received'),
            locale.getString('exchange.table_header_sent_by'),
            locale.getString('exchange.table_header_fwd_rule'),
            locale.getString('exchange.table_header_recipient'),
            locale.getString('exchange.table_header_date_fwd'),
            locale.getString('exchange.table_header_status')
        ];

        //Set the data columns
        var getData = function() {            
            var exportItems;
            //Export only selected items
            if(onlySelectedItems){
                exportItems = $scope.selectedItems;
            }
            //Export all logs in the table
            else{
                exportItems = $scope.searchResults.messages;
            }
            return exportItems.reduce(
                function(csvObject, item){ 
                    if($scope.filterIncomingOutgoing(item)){
                        var csvRow = [
                            $filter('date')(item.dateRecieved, "medium"),
                            item.sentBy, 
                            item.recipient,
                            item.forwardRule,
                            $filter('date')(item.dateForward, "medium"),
                            $scope.getStatusLabel(item.status)
                        ];
                        csvObject.push(csvRow);
                    }
                    return csvObject;
                },[]
            );
        };

        //Create and download the file
        csvService.downloadCSVFile(getData(), header, filename);        
    };

    //Callback function for the "edit selection" dropdown
    $scope.editSelectionCallback = function(selectedItem){
        if(selectedItem.code === 'EXPORT'){
            $scope.exportLogsAsCSVFile(true);
        }
        $scope.editSelection = "";
    };

    //Selected by checkboxes
    $scope.selectedItems = [];

    //Handle click on the top "check all" checkbox
    $scope.checkAll = function(){ 
        if($scope.isAllChecked()){
            //Remove all
            $scope.clearSelection();
        }else{
            //Add all
            $scope.clearSelection();
            $.each($scope.searchResults.messages, function(index, item) {
                $scope.addToSelection(item);
            });
        }
    };

    $scope.check = function(item){
        console.log(item);
        if($scope.isChecked(item)){
            //Remove
            $scope.removeFromSelection(item);
        }else{
            $scope.addToSelection(item);
        }      
    };

    $scope.isAllChecked = function(){
        if(angular.isUndefined($scope.searchResults.messages) || $scope.selectedItems.length === 0){
            return false;
        }

        var allChecked = true;
        $.each($scope.searchResults.messages, function(index, item) {
            if(!$scope.isChecked(item)){
                allChecked = false;
                return false;
            }
        });
        return allChecked;
    };

    $scope.isChecked = function(item){
        var checked = false;
        $.each($scope.selectedItems, function(index, exchangeMessage){
            if(exchangeMessage.isEqualExchange(item)){
                checked = true;
                return false;
            }
        });
        return checked;
    };

    //Clear the selection
    $scope.clearSelection = function(){
        $scope.selectedItems = [];
    };

    //Add an item to the selection
    $scope.addToSelection = function(item){
        $scope.selectedItems.push(item);
    };

    //Remove an item from the selection
    $scope.removeFromSelection = function(item){
        $.each($scope.selectedItems, function(index, exchangeMessage){
            if(exchangeMessage.isEqualExchange(item)){
                $scope.selectedItems.splice(index, 1);
                return false;
            }
        });
    };

    init();
});
