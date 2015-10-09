angular.module('unionvmsWeb').controller('NewpollwizardpollingoptionsCtrl',function($scope, $state, locale, alertService, pollingService) {

    //Has form submit been atempted?
    $scope.submitAttempted = false;

    //Currently waiting for response?
    $scope.loadingResult = false;

    //The polling options
    $scope.pollingOptions = pollingService.getPollingOptions();

    var resetPollingOptions = function(resetComment){
        pollingService.resetPollingOptions(resetComment);
    };

    var init = function(){
        resetPollingOptions(true);
    };

    //DUMMY DATA FOR DROPDOWNS
    $scope.requestChannels = [];
    $scope.reponseChannels = [];

    $scope.setPollType = function(type){
        if (!$scope.isSingleMobileTerminalSelected() && type === "SAMPLING") {
            return;
        }
        resetPollingOptions(false);
        $scope.submitAttempted = false;
        $scope.pollingOptions.type = type;
    };

    //Is configuration poll selected?
    $scope.isConfigurationPoll = function(){
        return $scope.pollingOptions.type === 'CONFIGURATION';
    };

    //Is program poll selected?
    $scope.isProgramPoll = function(){
        return $scope.pollingOptions.type === 'PROGRAM';
    };

    //Is manual poll selected?
    $scope.isManualPoll = function(){
        return $scope.pollingOptions.type === 'MANUAL';
    };

    //Is sampling poll selected?
    $scope.isSamplingPoll = function(){
        return $scope.pollingOptions.type === 'SAMPLING';
    };

    //Get number of selected terminals
    $scope.getNumberOfSelectedTerminals = function(){
        return pollingService.getNumberOfSelectedTerminals();
    };

    //Is a single mobile terminal selected?
    $scope.isSingleMobileTerminalSelected = function() {
        return pollingService.isSingleSelection();
    };

    //Run the poll
    $scope.runPoll = function(){
        $scope.submitAttempted = true;
        alertService.hideMessage();
        if($scope.pollingOptionsForm.$valid){
            $scope.loadingResult = true;
            pollingService.createPolls().then(
                function() {
                    $scope.loadingResult = false;
                    pollingService.clearSelection();
                    //Set alert message
                    var successMessage = locale.getString('polling.wizard_second_step_success_single');
                    var pollResult = pollingService.getResult();
                    if(!pollResult.programPoll && pollResult.polls.length > 1){
                        successMessage = locale.getString('polling.wizard_second_step_success_multiple');
                    }else if(pollResult.programPoll && pollResult.polls.length === 1){
                        successMessage = locale.getString('polling.wizard_second_step_success_program_single');
                    }else if(pollResult.programPoll && pollResult.polls.length > 1){
                        successMessage = locale.getString('polling.wizard_second_step_success_program_multiple');
                    }

                    //Show success alert and redirect to polling logs page
                    $scope.setHideAlertOnScopeDestroy(false);
                    alertService.showSuccessMessageWithTimeout(successMessage);
                    $state.go('app.pollingLogs');
                },
                function(){
                    //Error
                    alertService.showErrorMessage(locale.getString('polling.wizard_second_step_creating_polls_error'));
                    $scope.loadingResult = false;
                });
        }else{
            alertService.showErrorMessage(locale.getString('common.alert_message_on_form_validation_error'));
        }
    };

    //Watch when entering optins step in the wizard
    $scope.$watch("wizardStep", function(newValue) {
        if (newValue === 2) {
            //Reset form and submitAttempted
            $scope.submitAttempted = false;
            $scope.pollingOptionsForm.$setPristine();

            // Change polling type if incompatible with current selection
             if(!$scope.isSingleMobileTerminalSelected() && $scope.isSamplingPoll()){
                $scope.pollingOptions.type = 'MANUAL';
            }
        }
    });

    //Watch number of selected mobile terminals and go back to step 1 when all terminals are removed
    $scope.$watch(function(){return pollingService.getNumberOfSelectedTerminals();}, function(newValue) {
        if ($scope.wizardStep === 2 && newValue === 0) {
           $scope.previousStep();
        }
    });


    init();
});
