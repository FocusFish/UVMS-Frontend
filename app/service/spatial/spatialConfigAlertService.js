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
angular.module('unionvmsWeb').factory('spatialConfigAlertService',function($timeout,comboboxService) {

	var spatialConfigAlertService = {
	    hasAlert: false,
	    hasError: false,
	    hasSuccess: false,
	    hasWarning: false,
	    alertMessage: undefined,
	    hideAlert: function(timeoutInMilliSeconds){
	        var alertObj = this;
	        if (angular.isUndefined(timeoutInMilliSeconds)) {
	        	timeoutInMilliSeconds = 3000;
	        }
	        $timeout(function(){
	        	comboboxService.closeCurrentCombo();
	            alertObj.hasAlert = false;
	            alertObj.hasError = false;
	            alertObj.hasSuccess = false;
	            alertObj.hasWarning = false;
	            alertObj.alertMessage = undefined;
	        }, timeoutInMilliSeconds, true, alertObj);
	    }
	};
	
	return spatialConfigAlertService;
});
