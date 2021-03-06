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
angular.module('unionvmsWeb').controller('vesselNotesModalCtrl',function($scope, $modalInstance, vesselNote, vesselName, locale){

    $scope.vesselNote = vesselNote;
    $scope.vesselName  = vesselName;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

});

angular.module('unionvmsWeb').filter('vesselHistoryReplaceEmptyValueWithDash', function(locale) {
    return function(input) {
        if(input == null || angular.isUndefined(input) || (typeof input === 'string' && input.trim().length === 0)){
            return '-';
        }
        return input;
    };
});