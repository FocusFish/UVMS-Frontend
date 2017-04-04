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
angular.module('unionvmsWeb').controller('FishingoperationpanelCtrl',function($scope,fishingActivityService,loadingStatus,$state,tripSummaryService,activityRestService,FishingActivity){

    $scope.faServ = fishingActivityService;
    
    var init = function(){
        $scope.faServ.getFishingActivity(new FishingActivity('fishing_operation'));
        loadingStatus.isLoading('FishingActivity', true);
        activityRestService.getTripCatchDetail($scope.faServ.id).then(function(response){
            $scope.fishingTripDetails = response;  
            loadingStatus.isLoading('FishingActivity', false);
        }, function(error){
            //TODO deal with error from service
            loadingStatus.isLoading('FishingActivity', false);
        });
    };

    /**
     * Check if a location tile should be clickable taking into consideration the route and the report configuration
     * 
     * @memberof FishingoperationpanelCtrl
     * @public
     * @alias isLocationClickable
     * @returns {Boolean} Whether the location tile should be clickable or not
     */
    $scope.isLocationClickable = function(){
        var clickable = false;
        if (($state.current.name === 'app.reporting-id' || $state.current.name === 'app.reporting') && tripSummaryService.withMap){
            clickable = true;
        }
        
        return clickable;
    };

    /**
     * The click location callback function
     * 
     * @memberof FishingoperationpanelCtrl
     * @public
     * @alias locationClickCallback
     */
    $scope.locationClickCallback = function(){
        //TODO when we have it running with reports - mainly for hiding/showing stuff
        console.log('This is the click callback');
    };

    init();
});