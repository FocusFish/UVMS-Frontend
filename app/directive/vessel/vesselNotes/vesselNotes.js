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
    .directive('vesselNotes', function() {
	return {
		restrict: 'E',
		replace: false,
        controller: 'vesselNotesCtrl',
        scope: {
            vesselNote : '=',
            vesselForm : '=',
            submitAttempted : '=',
            disableForm : '=',
            spin: '=',
            status: '=', 
            dirtyStatus: '='
        },
		templateUrl: 'directive/vessel/vesselNotes/vesselNotes.html',
		link: function(scope, element, attrs, fn) {

            scope.required = false;

            // Only display fields as required if input has been modified
            scope.$watch('vesselNote', function(value) {
                for (var key in value) {
                    if (value[key]) {
                        scope.required = true;
                        return false;
                    } else if (value[key] === undefined || value[key] === '') {
                        if (!value[key]) {
                            scope.required = false;
                        }
                    } 
                }
            }, true);

            // Make sure required status isn't set when list view is displayed
            scope.$watch('status', function(value) {
                if (value) {
                    scope.required = false;
                }
            }, true); 

		}
	};
});

angular.module('unionvmsWeb')
    .controller('vesselNotesCtrl', function($scope, locale, configurationService, vesselRestService){

        // Check if notes has been modified and set form dirty 
        $scope.$watch('vesselNote', function(newValue, oldValue){
            if ($scope.vesselNote.date && $scope.vesselNote.activityCode) {
                $scope.dirtyStatus(true);
            }
        }, true);

        // Get list of activity numbers 
        vesselRestService.getNoteActivityList().then(function(data) {
            $scope.noteActivityList = data;
            $scope.vesselNotesActivity = configurationService.setTextAndCodeForDropDown(data.code, true);
        }, function(error) {
            console.error(error);
        });
        
    }
);
