angular.module('unionvmsWeb').factory('Rule', function(RuleDefinition, RuleTimeInterval, RuleAction) {

        function Rule(){
            this.id = undefined;
            this.name = undefined;
            this.description = undefined;
            this.type = "GLOBAL";
            this.availability = "PUBLIC";
            this.active = true;
            this.definitions = [];
            this.actions = [];
            this.timeIntervals = [];
            this.lastTriggered = "2015-02-05 08:00";
            this.createdBy = "antkar";
            this.dateCreated = "2015-08-31 09:00";


            this.notifyByEMail = undefined;
            this.subscription = undefined;
        }

        Rule.prototype.addDefinition = function(def){
            this.definitions.push(def);
        };

        Rule.prototype.addAction = function(action){
            this.actions.push(action);
        };

        Rule.prototype.addTimeInterval = function(inter){
            this.timeIntervals.push(inter);
        };

        Rule.prototype.getNumberOfDefinitions = function(){
            return this.definitions.length;
        };

        Rule.prototype.getNumberOfActions = function(){
            return this.actions.length;
        };

        Rule.prototype.getNumberOfTimeIntervals = function(){
            return this.timeIntervals.length;
        };

        Rule.prototype.isSubscriptionPossible = function(){
            return this.type !== 'GLOBAL';
        };


        Rule.fromDTO = function(dto){
            var rule = new Rule();

            rule.id = dto.id;
            rule.name = dto.name;
            rule.type = dto.type;
            rule.availability = dto.availability;
            rule.active = dto.active;
            rule.description = dto.description;
            rule.lastTriggered = dto.lastTriggered;
            rule.createdBy = dto.createdBy;
            rule.dateCreated = dto.dateCreated;

            rule.definitions = [];
            $.each(dto.definitions, function(index, definition){
                rule.definitions.push(RuleDefinition.fromDTO(definition));
            });

            rule.timeIntervals = [];
            $.each(dto.timeIntervals, function(index, timeInterval){
                rule.timeIntervals.push(RuleTimeInterval.fromDTO(timeInterval));
            });


            rule.actions = [];
            $.each(dto.actions, function(index, action){
                rule.actions.push(RuleAction.fromDTO(action));
            });

            return rule;
        };

        Rule.prototype.DTO = function(){
            return {
                id : this.id,
                name : this.name,
                type : this.type,
                availability : this.availability,
                active : this.active,
                description : this.description,
                lastTriggered : this.lastTriggered,
                createdBy : this.createdBy,
                dateCreated : this.dateCreated,
                timeIntervals : this.timeIntervals.reduce(function(intervals, timeInterval){
                    intervals.push(timeInterval.DTO());
                    return intervals;
                },[]),
                definitions : this.definitions.reduce(function(defs, def){
                    defs.push(def.DTO());
                    return defs;
                },[]),
                actions : this.actions.reduce(function(acts, action){
                    acts.push(action.DTO());
                    return acts;
                },[]),
            };
        };

        Rule.prototype.copy = function() {
            return Rule.fromDTO(this.DTO());
        };

        //Check if the Rule is equal another Rule
        //Equal means same guid
        Rule.prototype.equals = function(item) {
            return this.id === item.id;
        };

        return Rule;
    });



angular.module('unionvmsWeb').factory('RuleDefinition', function() {

        function RuleDefinition(){
            this.startOperator = '';
            this.criteria = undefined;
            this.subCriteria = undefined;
            this.condition = "EQ";
            this.value = '';
            this.endOperator = '';
            this.logicBoolOperator = 'NONE';
            this.order = undefined; //First one has order 0
        }

        RuleDefinition.prototype.copy = function() {
            return RuleDefinition.fromDTO(this.DTO());
        };

        RuleDefinition.prototype.DTO = function(){
            return {
                startOperator : this.startOperator,
                criteria : this.criteria,
                subCriteria : this.subCriteria,
                condition : this.condition,
                value : this.value,
                endOperator : this.endOperator,
                logicBoolOperator : this.logicBoolOperator,
                order : this.order,
            };
        };

        RuleDefinition.fromDTO = function(dto){
            var ruleDefinition = new RuleDefinition();
            ruleDefinition.startOperator = dto.startOperator;
            ruleDefinition.criteria = dto.criteria;
            ruleDefinition.subCriteria = dto.subCriteria;
            ruleDefinition.condition = dto.condition;
            ruleDefinition.value = dto.value;
            ruleDefinition.endOperator = dto.endOperator;
            ruleDefinition.logicBoolOperator = dto.logicBoolOperator;
            ruleDefinition.order = dto.order;

            return ruleDefinition;
        };

        return RuleDefinition;
    });

angular.module('unionvmsWeb').factory('RuleAction', function() {

        function RuleAction(){
            this.action = undefined;
            this.value = undefined;
            this.order = undefined; //First one has order 0
        }

        RuleAction.prototype.copy = function() {
            return RuleAction.fromDTO(this.DTO());
        };

        RuleAction.prototype.DTO = function(){
            return {
                action : this.action,
                value : this.value,
                order : this.order,
            };
        };

        RuleAction.fromDTO = function(dto){
            var ruleAction = new RuleAction();
            ruleAction.action = dto.action;
            ruleAction.value = dto.value;
            ruleAction.order = dto.order;

            return ruleAction;
        };

        return RuleAction;
    });


angular.module('unionvmsWeb').factory('RuleTimeInterval', function() {


        function RuleTimeInterval(){
            this.start = undefined;
            this.end = undefined;
        }

        RuleTimeInterval.prototype.DTO = function(){
            return {
                start : this.start,
                end : this.end,
            };
        };

        RuleTimeInterval.fromDTO = function(dto){
            var ruleTimeInterval = new RuleTimeInterval();
            ruleTimeInterval.start = dto.start;
            ruleTimeInterval.end = dto.end;

            return ruleTimeInterval;
        };

        RuleTimeInterval.prototype.copy = function() {
            return RuleTimeInterval.fromDTO(this.DTO());
        };

        return RuleTimeInterval;
    });