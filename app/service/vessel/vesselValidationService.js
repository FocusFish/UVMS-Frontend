angular.module('unionvmsWeb').factory('vesselValidationService',function() {

	var vesselValidationService = {
        getCFRPattern : function(){
            //3 letters followed by 9 digits an/or letters (including swedish åäö)
            return new RegExp(/^[a-zA-ZåäöÅÄÖ]{3}[0-9a-zA-ZåäöÅÄÖ]{9}$/);
        },
        getMMSIPattern : function(){
            //9 digits
            return new RegExp(/^[0-9]{9}$/);
        },
        getMaxTwoDecimalsPattern : function(){
            return new RegExp(/^[0-9]+([,.][0-9]{0,2}?)?$/);
        }
    };

	return vesselValidationService;
});