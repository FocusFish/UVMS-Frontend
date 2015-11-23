angular.module('unionvmsWeb').controller('RulesformCtrl',function($scope, $timeout, $log, locale, alertService, ruleRestService, Rule, RuleDefinition, RuleTimeInterval, RuleAction, ruleService, confirmationModal, configurationService, rulesOptionsService, rulesSuggestionsService, savedSearchService){

    $scope.submitAttempted = false;

    $scope.ruleTest = {
        success : false,
        message : undefined,
        outdated : false
    };

    //List of actions thare are disabled (already selected in another dropdown)
    $scope.disabledActions = [];

    //Watch changes to the getCurrentRule model (set in the parent scope)
    $scope.$watch('getCurrentRule()', function(newValue) {
        $scope.currentRule = $scope.getCurrentRule();
        if(angular.isDefined(newValue)){
            $scope.updateFormToMatchTheCurrentRule();
        }
    });

    //Watch for changes to the saved asset groups
    $scope.$watch(function () { return savedSearchService.getVesselGroupsForUser();}, function (newVal, oldVal) {
        //Update dropdown values for ruleDefinitions
        rulesOptionsService.setupRuleDefinitionValueDropdowns();
    });

    //Init the page
    var init = function(){
        $scope.DROPDOWNS = rulesOptionsService.getDropdownValues();
    };

    //Update form to match the current rule
    $scope.updateFormToMatchTheCurrentRule = function(){
        //Add a new definition row to new rules
        if($scope.currentRule.getNumberOfDefinitions() === 0){
            $scope.addDefinitionRow();
        }

        //Add a new action row to new rules
        if($scope.currentRule.getNumberOfActions() === 0){
            $scope.addActionRow();
        }

        //Reset form validation
        if(angular.isDefined($scope.ruleForm)){
            $scope.ruleForm.$setPristine();
            $scope.submitAttempted = false;
        }
        //Reset test message
        $scope.ruleTest.message = undefined;
        $scope.ruleTest.outdated = false;

        //Enable/disable type dropdown
        $scope.updateDisableTypeDropdown();

        //Enable/disable availability dropdown
        $scope.updateAvailabilityDropdown();

        //Update list of disabled (already used) actions
        $scope.updateDisabledActions();

        //Reload dropdown values
        rulesOptionsService.setupRuleDefinitionValueDropdowns();
        rulesOptionsService.setupActionDropdowns();
    };


    //Should form be disabled?
    $scope.disableForm = function(){
        //Create new rule
        if($scope.isCreateNewMode()){
            if($scope.allowedToManageRules()){
                return false;
            }
        }
        //Edit
        else{
            //User has access to edit the rule?
            if(angular.isDefined($scope.currentRule)){
                if($scope.allowedToDeleteOrUpdateRule($scope.currentRule)){
                    return false;
                }
            }
        }
        return true;
    };

    //Should rule type dropwdown be disabled?
    $scope.disableTypeDropdown = false;
    $scope.updateDisableTypeDropdown = function(){
        if($scope.allowedToManageGlobalRules()){
            $scope.disableTypeDropdown = false;
        }else{
            $scope.disableTypeDropdown = true;
            //Edit mode? then set type to EVENT
            if(!$scope.disableForm()){
                $scope.currentRule.type = 'EVENT';
            }
        }
    };

    //Add a definition row
    $scope.addDefinitionRow = function(){
        var ruleDef = new RuleDefinition();
        if($scope.DROPDOWNS.CRITERIAS.length > 0){
            ruleDef.criteria = $scope.DROPDOWNS.CRITERIAS[0].code;
        }
        if(Object.keys($scope.DROPDOWNS.SUBCRITERIAS).length > 0 && ruleDef.criteria in $scope.DROPDOWNS.SUBCRITERIAS){
            ruleDef.subCriteria = $scope.DROPDOWNS.SUBCRITERIAS[ruleDef.criteria][0].code;
        }
        if(Object.keys($scope.DROPDOWNS.CONDITIONS).length > 0 && ruleDef.criteria in $scope.DROPDOWNS.CONDITIONS){
            ruleDef.condition = $scope.DROPDOWNS.CONDITIONS[ruleDef.criteria][ruleDef.subCriteria][0].code;
        }
        ruleDef.order = $scope.currentRule.getNumberOfDefinitions();
        $scope.currentRule.addDefinition(ruleDef);
    };

    //Add a time interval row
    $scope.addTimeIntervalItem = function(){
        $scope.currentRule.addTimeInterval(new RuleTimeInterval());
    };

    //Disable availability dropdown when type is GLOBAL
    $scope.disableAvailability = false;
    $scope.updateAvailabilityDropdown = function(selection){
        var selectedType = angular.isDefined(selection) ? selection.code : $scope.currentRule.type;
        if(selectedType === 'GLOBAL'){
            $scope.currentRule.availability = 'PUBLIC';
            $scope.disableAvailability = true;
        }else{
            $scope.disableAvailability = false;
            if(angular.isUndefined($scope.currentRule.availability)){
                $scope.currentRule.availability = $scope.DROPDOWNS.AVAILABILITY_TYPES[0].code;
            }
        }
    };

    //Callback when selecting criteria in dropdown
    $scope.onCriteriaSelection = function(selection, ruleDef){
        var selectedVal = selection.code;
        //Set value of critera explicit to make sure the value is updated before calling resetRuleDefinitionValue
        ruleDef.criteria = selectedVal;
        ruleDef.subCriteria = $scope.DROPDOWNS.SUBCRITERIAS[ruleDef.criteria][0].code;
        ruleDef.condition = $scope.DROPDOWNS.CONDITIONS[ruleDef.criteria][ruleDef.subCriteria][0].code;
        //Reset value field
        $scope.resetRuleDefinitionValue(ruleDef);
    };

    //Callback when selecting subcriteria in dropdown
    $scope.onSubCriteriaSelection = function(selection, ruleDef){
        //Set value of subCriteria explicit to make sure the value is updated before calling resetRuleDefinitionValue
        ruleDef.subCriteria = selection.code;
        ruleDef.condition = $scope.DROPDOWNS.CONDITIONS[ruleDef.criteria][ruleDef.subCriteria][0].code;
        $scope.resetRuleDefinitionValue(ruleDef);
    };


    //Reset value field, either to undefined or to first dropdown value
    $scope.resetRuleDefinitionValue = function(ruleDef){
        ruleDef.value = undefined;
        //Value type is dropdown? Then select first value in it.
        var valueType = $scope.getRuleDefinitionValueInputType(ruleDef);
        if(valueType === 'DROPDOWN'){
            var valueDropdownOptions = rulesOptionsService.getDropdownValuesForRuleDefinition(ruleDef);
            if(valueDropdownOptions && valueDropdownOptions.length > 0){
                ruleDef.value = valueDropdownOptions[0].code;
            }
        }
    };

    //Check if an action requires a value
    $scope.actionShouldHaveValue = function(action){
        return rulesOptionsService.actionShouldHaveValue(action);
    };

    //Get first action in action dropdown that isn't disabled (already used if only single value is allowed)
    $scope.getFirstActionThatIsEnabled = function(){
        var actionVal;
        $.each($scope.DROPDOWNS.ACTIONS, function(index, dropdownItem){
            if($scope.disabledActions.indexOf(dropdownItem.code) < 0){
                actionVal = dropdownItem.code;
                return false;
            }
        });
        return actionVal;
    };

    //Add an action row
    $scope.addActionRow = function(){
        var ruleAction = new RuleAction();
        ruleAction.action = $scope.getFirstActionThatIsEnabled();
        ruleAction.order = $scope.currentRule.getNumberOfActions();
        $scope.currentRule.addAction(ruleAction);
        //Update list of disabled actions
        $scope.updateDisabledActions();
    };

    //Update list of disabled actions
    $scope.updateDisabledActions = function(){
        $scope.disabledActions.length = 0;
        $.each($scope.currentRule.actions, function(index, ruleAction){
            if(!$scope.actionShouldHaveValue(ruleAction.action)){
                $scope.disabledActions.push(ruleAction.action);
            }
        });
    };

    //Callback when selecting action in dropdown
    $scope.actionSelected = function(selection, ruleAction){
        var selectedVal = selection.code;
        if(!$scope.actionShouldHaveValue(selectedVal.action)){
            ruleAction.value = undefined;
        }
        $timeout($scope.updateDisabledActions, 10);
    };

    //Remove a rule definition row
    $scope.removeRuleDefinition = function(definitionToBeRemoved){
        var indexToRemove = $scope.currentRule.definitions.indexOf(definitionToBeRemoved);
        if(indexToRemove >= 0){
            $scope.currentRule.definitions.splice(indexToRemove, 1);
        }

        //Set new order for definitions
        $.each($scope.currentRule.definitions, function(i, def){
            def.order = i;
        });
    };

    //Remove a rule action row
    $scope.removeRuleAction = function(actionToBeRemoved){
        var indexToRemove = $scope.currentRule.actions.indexOf(actionToBeRemoved);
        if(indexToRemove >= 0){
            $scope.currentRule.actions.splice(indexToRemove, 1);
        }

        //Set new order for actions
        $.each($scope.currentRule.actions, function(i, def){
            def.order = i;
        });

        //Update list of disabled actions
        $scope.updateDisabledActions();
    };

    //Remove a time interval row
    $scope.removeTimeIntervalItem = function(intervalToBeRemoved){
        var indexToRemove = -1;
        $.each($scope.currentRule.timeIntervals, function(i, interval){
            if(intervalToBeRemoved === interval){
                indexToRemove = i;
                return false;
            }

        });
        if(indexToRemove >= 0){
            $scope.currentRule.timeIntervals.splice(indexToRemove, 1);
        }
    };

    //Check if form is valid and show error message if not
    var isValidForm = function(){
        if(!$scope.ruleForm.$valid){
            alertService.showErrorMessage(locale.getString('common.form_validation_error_message'));
            return false;
        }

        //Test syntax of rule and actions
        if(!$scope.testRule()){
            alertService.showErrorMessage(locale.getString('alarms.rules_add_new_alert_message_on_form_rule_validation_error'));
            return false;
        }

        return true;
    };

    //Create the rule
    $scope.createNewRule = function(){
        $scope.submitAttempted = true;
        alertService.hideMessage();

        //Validate form
        if(!isValidForm()){
            return;
        }

        //Create
        var options = {
            textLabel : locale.getString("alarms.rule_create_confirm_text")
        };
        confirmationModal.open(function(){
            $scope.waitingForCreateResponse = true;
            ruleRestService.createNewRule($scope.currentRule)
                .then(createNewRuleSuccess, createNewRuleError);
        }, options);
    };

    //Update the rule
    $scope.updateRule = function(){
        $scope.submitAttempted = true;
        alertService.hideMessage();

        //Validate form
        if(!isValidForm()){
            return;
        }

        //Update
        var options = {
            textLabel : locale.getString("alarms.rule_update_confirm_text")
        };
        confirmationModal.open(function(){
            $scope.waitingForCreateResponse = true;
            ruleRestService.updateRule($scope.currentRule)
                .then(updateRuleSuccess, updateRuleError);
        }, options);
    };

    //Success creating the rule
    var createNewRuleSuccess = function(rule) {
        $scope.waitingForCreateResponse = false;
        alertService.showSuccessMessageWithTimeout(locale.getString('alarms.rules_add_new_alert_message_on_success'));
        $scope.currentRule = rule;
        $scope.setCreateMode(false);
        $scope.createdNewRuleCallback(rule);
    };

    //Error creating the rule
    var createNewRuleError = function(){
        $scope.waitingForCreateResponse = false;
        alertService.showErrorMessage(locale.getString('alarms.rules_add_new_alert_message_on_error'));
    };

    //Success updating the rule
    var updateRuleSuccess = function(updatedRule) {
        $scope.waitingForCreateResponse = false;
        alertService.showSuccessMessageWithTimeout(locale.getString('alarms.rules_update_alert_message_on_success'));
        $scope.updateRuleCallback();
    };

    //Error updating the rule
    var updateRuleError = function(){
        $scope.waitingForCreateResponse = false;
        alertService.showErrorMessage(locale.getString('alarms.rules_update_alert_message_on_error'));
    };

    //Test rule
    $scope.testRule = function(){
        $scope.ruleTest.outdated = false;

        //TODO: Get matches for the rule
        var testResult = ruleService.areRuleDefinitionsAndActionsValid($scope.currentRule);
        $scope.ruleTest.success = testResult.success;
        $scope.ruleTest.problems = testResult.problems;

        if(testResult.success){
            $scope.ruleTest.message = locale.getString('alarms.rules_test_success');
        }else{
            $scope.ruleTest.message = locale.getString('alarms.rules_test_fail');
        }

        return testResult.success;
    };

    //Update the rule as text text
    var updateRuleAsText = function(){
        var text = ruleService.getRuleAsText($scope.currentRule);
        $scope.ruleAsText = text;
        $scope.ruleTest.outdated = true;
    };

    //Watch changes to the definitions and actions of the rule
    $scope.$watch('currentRule.definitions', function (newVal, oldVal){
        updateRuleAsText();
    }, true);
    $scope.$watch('currentRule.actions', function (newVal, oldVal){
        updateRuleAsText();
    }, true);

    //Get the type of input for the ruleDefinition value
    $scope.getRuleDefinitionValueInputType = function(ruleDefinition){
        //Dropdown?
        var dropdownValues = rulesOptionsService.getDropdownValuesForRuleDefinition(ruleDefinition);
        if(Array.isArray(dropdownValues)){
            if(dropdownValues.length === 0){
                return "DROPDOWN_EMPTY";
            }
            return "DROPDOWN";

        }

        //Text input with auto suggestion?
        if(rulesSuggestionsService.isSuggestionsAvailable(ruleDefinition)){
            return "TEXT_WITH_SUGGESTIONS";
        }

        //Speed input?
        if(rulesOptionsService.isRuleDefinitionValueASpeed(ruleDefinition)){
            return "SPEED";
        }

        //Course input?
        if(rulesOptionsService.isRuleDefinitionValueACourse(ruleDefinition)){
            return "COURSE";
        }

        //Longitude input
        if(rulesOptionsService.isRuleDefinitionValueLongitudeCoordinate(ruleDefinition)){
            return "LONGITUDE";
        }
        //Latitude input
        if(rulesOptionsService.isRuleDefinitionValueLatitudeCoordinate(ruleDefinition)){
            return "LATITUDE";
        }

        //DateTime input?
        if(rulesOptionsService.isRuleDefinitionValueADateTime(ruleDefinition)){
            return "DATETIME";
        }
        
        //Default text input
        return "TEXT";
    };

    //Get the type of input for the action value
    $scope.getActionValueInputType = function(action){
        //Dropdown?
        var dropdownValues = rulesOptionsService.getDropdownValuesForAction(action);
        if(Array.isArray(dropdownValues)){
            if(dropdownValues.length === 0){
                return "DROPDOWN_EMPTY";
            }
            return "DROPDOWN";

        }
        //Autosuggestion?
        //Text input
        return "TEXT";
    };

    //Get dropdown values for the ruleDefinition value
    $scope.getDropdownValuesForRuleDefinition = function(ruleDefinition){
        return rulesOptionsService.getDropdownValuesForRuleDefinition(ruleDefinition);
    };

    //Get dropdown values for the action  value
    $scope.getDropdownValuesForAction = function(action){
        return rulesOptionsService.getDropdownValuesForAction(action);
    };
    //AUTO SUGGESTIONS
    var lastAutoSuggestionRequestTimestamp;
    //Handle auto suggest error
    var autoSuggestError = function(error){
        alertService.showErrorMessage(locale.getString('alarms.rules_form_definition_auto_suggest_error'));
        return [];
    };

    //Handle auto suggest success
    var autoSuggestSuccess = function(suggestions){
       return suggestions;
    };

    //Function for getting auto suggestions
    $scope.getAutoSuggestValues = function(value, ruleDefinition){
        lastAutoSuggestionRequestTimestamp = new Date().getTime();
        return rulesSuggestionsService.getSuggestions(value, ruleDefinition).then(autoSuggestSuccess, autoSuggestError);
    };

    //On select in value auto suggestion input field
    $scope.onValueSuggestionSelect = function(selectedItem, selectedLabel, ruleDefinition){
        //Update value based on selection
        ruleDefinition.value = selectedLabel;
    };

    //Clear the form
    $scope.clearForm = function(){
        $log.debug("Clear form!");
        $scope.currentRule = new Rule();
        $scope.updateFormToMatchTheCurrentRule();
    };

    init();


});