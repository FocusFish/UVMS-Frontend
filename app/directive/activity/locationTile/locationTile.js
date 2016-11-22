/**
 * @memberof unionvmsWeb
 * @ngdoc directive
 * @name locationTile
 * @attr {String} fieldTitle - The title of the fieldset tile
 * @attr {Object} locationDetails - An object containing the data to be used witin the tile (e.g. location name and geometry)
 * @attr {Boolean} isClickable - Whether the tile should be clickable or not so that we can zoom to the location in the main map controlled by the mapService ({@link unionvmsWeb.mapService})
 * @attr {Function} [clickCallback] - An optional click callback function
 * @attr {String | Number} [bufferDist] - An optional buffer distance that will be applied to the location geometry for the purpose of calculating the extent into which the map should be zoomed to
 * @description
 *  A reusable tile that will display location details (as a single location or a list of locations) and, optionally, allow to zoom the main map (controlled by the mapService) to the specified location
 */
angular.module('unionvmsWeb').directive('locationTile', function() {
	return {
		restrict: 'E',
		replace: false,
		controller: 'LocationTileCtrl',
		scope: {
		    fieldTitle: '@',
		    locationDetails: '=',
		    isClickable: "=",
		    clickCallback: "&",
		    bufferDist: '@?',
		    multiple: "=?"
		},
		templateUrl: 'directive/activity/locationTile/locationTile.html',
		link: function(scope, element, attrs, fn) {
            if (!angular.isDefined(scope.multiple) && !angular.isDefined(attrs.multiple)){
                scope.multiple = false;
            }
        }
	};
})
/**
 * @memberof unionvmsWeb
 * @ngdoc controller
 * @name LocationTileCtrl
 * @param $scope {Service} The controller scope
 * @param mapService {Service} The map service for the liveview map <p>{@link unionvmsWeb.mapService}</p>
 * @description
 *  The controller for the locationTile directive ({@link unionvmsWeb.locationTile})
 */
.controller('LocationTileCtrl', function($scope, mapService){
    /**
     * Zoom to the location in the liveview map and execute callback if defined
     * 
     * @memberof LocationTileCtrl
     * @public
     * @alias zoomToLocation
     * @param {Object} [item=$scope.locationDetails] - The object containing a geometry property to use for the zooming extent. If not defined, locationDetails object is the default.
     */
    $scope.zoomToLocation = function(item){
        if (!angular.isDefined(item)){
            item = $scope.locationDetails;
        }
        //TODO test this function when we have it running with reports
        if ($scope.isItemClickable(item)){
            var wkt = new ol.format.WKT();
            var geom = wkt.readGeometry(item.geometry);
            
            var finalGeom = geom;
            if (angular.isDefined($scope.bufferDist) && geom instanceof ol.geom.Point){
                var extent = ol.extent.buffer(geom.getExtent(), parseFloat($scope.bufferDist));
                finalGeom = ol.geom.Polygon.fromExtent(extent);
            }
            
            //mapService.zoomTo(finalGeom);
            if (angular.isDefined($scope.clickCallback)){
                $scope.clickCallback();
            }
        }
    };
    
    /**
     * Check if the tile or item (when having multiple locations in a list) should be clickable
     * 
     * @memberof LocationTileCtrl
     * @public
     * @alias isItemClickable
     * @param {Object} [item] - An object that should contain a geometry property
     * @returns {Boolean} Whether the location tile or location item is clickable or not
     */
    $scope.isItemClickable = function(item){
        var clickableStatus = false;
        if ($scope.isClickable){
            if ($scope.multiple && angular.isDefined(item.geometry) && item.geometry !== '' && item.geometry !== null){
                clickableStatus = true;
            } else if (!$scope.multiple && angular.isDefined($scope.locationDetails.geometry) && $scope.locationDetails.geometry !== '' && $scope.locationDetails.geometry !== null){
                clickableStatus = true;
            }
        }
        
        return clickableStatus;
    };
    
    /**
     * Check if there is data to be displayed on the tile, used for the html template
     * 
     * @memberof LocationTileCtrl
     * @public
     * @alias hasData
     * @returns {Boolean} Whether there is data to be displayed to not
     */
    $scope.hasData = function(){
        var status = true;
        if (!$scope.multiple && _.isEqual($scope.locationDetails, {})){
            status = false;
        } else if ($scope.multiple && $scope.locationDetails.length === 0){
            status = false;
        }
        
        return status;
    };
});
