
angular.module('unionvmsWeb')
    .factory('ruleRestFactory',function($resource, $q, restConstants) {

        var baseUrl = restConstants.baseUrl;
        return {
            rule : function(){
                return $resource(baseUrl +'/rules/rest/rules/:id', {}, {
                    update: {method: 'PUT'}
                });
            }
        };
    })
.factory('ruleRestService', function($q, $http, ruleRestFactory, restConstants, Rule){

    var baseUrl = restConstants.baseUrl;
    var userName = "FRONTEND_USER";

    var createNewRule = function(rule){
        var deferred = $q.defer();
        ruleRestFactory.rule().save(rule.DTO(), function(response) {
            if(response.code !== 200){
                deferred.reject("Invalid response status");
                return;
            }
            deferred.resolve(Rule.fromJson(response.data));
        }, function(error) {
            console.error("Error creating rule");
            console.error(error);
            deferred.reject(error);
        });
        return deferred.promise;
    };

    var updateRule = function(rule){
        console.log("About to update rule:");
        console.log(rule);
        var deferred = $q.defer();
        ruleRestFactory.rule().update(rule.DTO(), function(response) {
            if(response.code !== 200){
                deferred.reject("Invalid response status");
                return;
            }
            deferred.resolve(Rule.fromJson(response.data));
        }, function(error) {
            console.error("Error updating rule");
            console.error(error);
            deferred.reject(error);
        });
        return deferred.promise;
    };   

    return {
        updateRule: updateRule,
        createNewRule: createNewRule,
    };
});
