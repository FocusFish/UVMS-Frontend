/*
Developed with the contribution of the European Commission - Directorate General for Maritime Affairs and Fisheries
© European Union, 2015-2016.

This file is part of the Integrated Fisheries Data Management (IFDM) Suite. The IFDM Suite is free software: you can
redistribute it and/or modify it under the terms of the GNU General Public License as published by the
Free Software Foundation, either version 3 of the License, or any later version. The IFDM Suite is distributed in
the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details. You should have received a
copy of the GNU General Public License along with the IFDM Suite. If not, see <http://www.gnu.org/licenses/>.
 */
angular.module('unionvmsWeb')
    .factory('ruleRestFactory',function($resource) {

        return {
            rule : function(){
                return $resource('movement-rules/rest/customrules/:id', {}, {
                    update: {method: 'PUT'}
                });
            },
            getAllRulesForUser : function(){
                return $resource('movement-rules/rest/customrules/listAll/:userName');
            },
            getRulesByQuery : function(){
                return $resource('movement-rules/rest/customrules/listByQuery',{},{
                    list : { method: 'POST'}
                });
            },
            subscription : function(){
                return $resource('movement-rules/rest/customrules/subscription',{},{
                    update : { method: 'POST'}
                });
            },
            getConfig : function(){
                return $resource('movement-rules/rest/config');
            },
            getAreaTypes: function() {
                return $resource('spatial/rest/area/types');
            }
        };
    })
.factory('ruleRestService', function($q, $log, ruleRestFactory, Rule, SearchResultListPage, userService){

    var getConfigFromResource = function(configResource){
        var deferred = $q.defer();
        configResource.get({}, function(response, header, status) {
            if(status !== 200){
                deferred.reject("Invalid response status");
                return;
            }
            //Return config data
            deferred.resolve(response);
        }, function(error) {
            $log.error("Error getting config for rules", error);
            deferred.reject(error);
        });
        return deferred.promise;
    };

    var getConfig = function(){
        return getConfigFromResource(ruleRestFactory.getConfig());
    };

    var getRuleByGuid = function(guid){
        var deferred = $q.defer();
        ruleRestFactory.rule().get({id: guid}, function(response, header, status){
                if(status !== 200){
                    deferred.reject("Invalid response status");
                    return;
                }

                deferred.resolve(Rule.fromDTO(response));
            },
            function(error) {
                $log.error("Error getting Rule with guid: " +guid, error);
                deferred.reject(error);
            }
        );
        return deferred.promise;
    };

    var getAllRulesForUser = function(){
        var deferred = $q.defer();

        //Get list of all rules
        ruleRestFactory.getAllRulesForUser().query({userName: userService.getUserName()}, function(response, header, status){
                if(status !== 200){
                    deferred.reject("Invalid response status");
                    return;
                }
                var rules = [],
                    searchResultListPage;

                if(angular.isArray(response)) {
                    for (var i = 0; i < response.length; i++) {
                        rules.push(Rule.fromDTO(response[i]));
                    }
                }
                var currentPage = 0,
                    totalNumberOfPages = 0;

                if(rules.length > 0){
                    currentPage = totalNumberOfPages = 1;
                }

                searchResultListPage = new SearchResultListPage(rules, currentPage, totalNumberOfPages);
                deferred.resolve(searchResultListPage);
            },
            function(error) {
                $log.error("Error getting list of rules for user", error);
                deferred.reject(error);
            }
        );
        return deferred.promise;
    };

    var getRulesByQuery = function(getListRequest){
        var deferred = $q.defer();
        ruleRestFactory.getRulesByQuery().list(getListRequest.DTOForRules(), function(response, header , status){
                if(status !== 200){
                    deferred.reject("Invalid response status");
                    return;
                }
                var rules = [],
                    searchResultListPage;

                if(angular.isArray(response.customRules)) {
                    for (var i = 0; i < response.customRules.length; i++) {
                        rules.push(Rule.fromDTO(response.customRules[i]));
                    }
                }
                var currentPage = response.currentPage;
                var totalNumberOfPages = response.totalNumberOfPages;
                searchResultListPage = new SearchResultListPage(rules, currentPage, totalNumberOfPages);
                deferred.resolve(searchResultListPage);
            },
            function(error) {
                $log.error("Error getting list of rules by query", error);
                deferred.reject(error);
            }
        );
        return deferred.promise;
    };

    var updateSubscription = function(ruleSubscriptionUpdate){
        var deferred = $q.defer();
        //Set subscriber name to the current user
        ruleSubscriptionUpdate.setOwner(userService.getUserName());
        ruleRestFactory.subscription().update(ruleSubscriptionUpdate.DTO(), function(response, header , status){
                if(status !== 200){
                    deferred.reject("Invalid response status");
                    return;
                }
                deferred.resolve(Rule.fromDTO(response));
            },
            function(error) {
                $log.error("Error updating subscription for rule", error);
                deferred.reject(error);
            }
        );
        return deferred.promise;
    };

    var createNewRule = function(rule){
        var deferred = $q.defer();
        //Set setUpdatedBy to the current user
        rule.setUpdatedBy(userService.getUserName());
        ruleRestFactory.rule().save(rule.DTO(), function(response, header , status) {
            if(status !== 200){
                deferred.reject("Invalid response status");
                return;
            }
            deferred.resolve(Rule.fromDTO(response));
        }, function(error) {
            $log.error("Error creating rule");
            $log.error(error);
            deferred.reject(error);
        });
        return deferred.promise;
    };

    var updateRule = function(rule){
        $log.debug("About to update rule:");
        $log.debug(rule);
        var deferred = $q.defer();
        //Set setUpdatedBy to the current user
        rule.setUpdatedBy(userService.getUserName());
        ruleRestFactory.rule().update(rule.DTO(), function(response, header , status) {
            if(status !== 200){
                deferred.reject("Invalid response status");
                return;
            }
            deferred.resolve(Rule.fromDTO(response));
        }, function(error) {
            $log.error("Error updating rule");
            $log.error(error);
            deferred.reject(error);
        });
        return deferred.promise;
    };


    var deleteRule = function(rule) {
        $log.debug("About to delete rule:");
        $log.debug(rule);
        var deferred = $q.defer();
        ruleRestFactory.rule().delete({id: rule.guid}, function(response, header , status) {
            if (status !== 200) {
                deferred.reject("Invalid response status");
                return;
            }

            deferred.resolve(Rule.fromDTO(response));
        },
        function(error) {
            $log.error("Error when trying to delete a rule");
            $log.error(error);
            deferred.reject(error);
        });

        return deferred.promise;
    };

    var getAreaTypes = function() {
        return $q(function(resolve) {
            ruleRestFactory.getAreaTypes().get(function(response) {
                if (response.code === 200 && angular.isArray(response.data)) {
                    resolve(response.data);
                }
            });
        });
    };

    return {
        getConfig: getConfig,
        getRuleByGuid: getRuleByGuid,
        getAllRulesForUser: getAllRulesForUser,
        getRulesByQuery: getRulesByQuery,
        updateRule: updateRule,
        createNewRule: createNewRule,
        deleteRule: deleteRule,
        updateSubscription: updateSubscription,
        getAreaTypes: getAreaTypes
    };
});
