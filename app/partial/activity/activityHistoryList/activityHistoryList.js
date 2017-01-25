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
/**
 * @memberof unionvmsWeb
 * @ngdoc controller
 * @name ActivityhistorylistCtrl
 * @param $scope {Service} controller scope
 * @param activityService {Service} The activity service
 * @param visibilityService {Service} The visibility service <p>{@link unionvmsWeb.visibilityService}</p>
 * @attr {Array} displayedActivitiesHistory - The array of displayed activities used by smart tables
 * @description
 *  The controller for the fisihing activity reports table list
 */
angular.module('unionvmsWeb').controller('ActivityhistorylistCtrl',function($scope, activityService, visibilityService){
    $scope.actServ = activityService;
    $scope.attrVisibility = visibilityService;
    
    $scope.openDetails = function(idx){
        //TODO fetch the data and load the partial
        //$scope.actServ.overview = $scope.actServ.displayedActivities[idx];
        $scope.goToView(3);
    };
});