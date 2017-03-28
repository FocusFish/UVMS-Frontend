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
 * @ngdoc directive
 * @name gearShotRetrievalTile
 * @param locale {Service} - The angular locale service
 * @param $styate {Service} - The state provider service
 * @attr {String} tileTitle - The title of the tile
 * @attr {Array} srcData - An array containing the data to be displayed on the tile
 * @desc
 *  A reusable tile to display gear shot and retrieval sub-activities
 */
angular.module('unionvmsWeb').directive('gearShotRetrievalTile', function(locale, $state) {
	return {
		restrict: 'E',
		replace: false,
		scope: {
		    tileTitle: '@',
            srcData: '='
		},
		templateUrl: 'directive/activity/gearShotRetrievalTile/gearShotRetrievalTile.html',
		link: function(scope, element, attrs, fn) {
		    scope.selected = {};
		    
		    scope.tableAttrs = [{
                title: locale.getString('activity.type'),
                srcProp: 'type',
                isVisible: true,
                useComboFilter: true,
                translation: 'abbreviations.gear_type_'
            }, {
                title: locale.getString('activity.occurrence'),
                srcProp: 'occurrence',
                isVisible: true,
                useComboFilter: false,
                isDate: true
            }, {
                title: locale.getString('activity.fa_details_item_duration'),
                srcProp: 'duration',
                isVisible: true,
                useComboFilter: false,
                isDuration: true
            }];
		    
		    /**
		     * Check if a location tile should be clickable taking into consideration the route and the report configuration
		     * 
		     * @memberof gearShotRetrievalTile
		     * @public
		     * @alias isLocationClickable
		     * @returns {Boolean} Whether the location tile should be clickable or not
		     */
		    scope.isLocationClickable = function(){
		        var clickable = false;
		        if (($state.current.name === 'app.reporting-id' || $state.current.name === 'app.reporting') && tripSummaryService.withMap){
		            clickable = true;
		        }
		        
		        return clickable;
		    };
		    
		    //TODO - check if we need a click callback on the locations tile
		}
	};
});
