describe('mobileTerminalFormCtrl', function() {

    beforeEach(module('unionvmsWeb'));

    var scope,ctrl, createResponseTerminal;

    beforeEach(inject(function($rootScope, $httpBackend, $controller, MobileTerminal) {
        scope = $rootScope.$new();
        ctrl = $controller('mobileTerminalFormCtrl', {$scope: scope});
        scope.currentMobileTerminal = new MobileTerminal();
        scope.getModelValueForTransponderSystemBySystemTypeAndPlugin = function(){};

         //Mock translation files for usm
         $httpBackend.whenGET(/^usm\//).respond({});
         //Mock locale file
         $httpBackend.whenGET(/^i18n\//).respond({});

        //Dummy response for create
        createResponseTerminal = new MobileTerminal();
        createResponseTerminal.guid = "260";
    }));

    it('should unassign mobile terminal', inject(function($q, mobileTerminalRestService) {
        var deferred = $q.defer();
        spyOn(mobileTerminalRestService, "unassignMobileTerminal").andReturn(deferred.promise);
        scope.unassignVesselWithComment();
        deferred.resolve();
        expect(mobileTerminalRestService.unassignMobileTerminal).toHaveBeenCalled();
    }));

    it('should update currentMobileTerminal with created terminal', inject(function(MobileTerminal, $compile, $q, mobileTerminalRestService, alertService) {
        scope.currentMobileTerminal = new MobileTerminal();

        //Available in parent scope
        scope.setCreateMode = function(bool){
            scope.createNewMode = bool;
        };
        scope.isCreateNewMode = function(){
            return scope.createNewMode;
        };
        scope.getCurrentMobileTerminal = function(){
            return scope.currentMobileTerminal;
        };

        // A form to be valid
        var element = angular.element('<form name="mobileTerminalForm"></form>');
        $compile(element)(scope);

        // Return a mock response for createNewMobileTerminal
        var deferred = $q.defer();
        spyOn(mobileTerminalRestService, "createNewMobileTerminal").andReturn(deferred.promise);
        deferred.resolve(createResponseTerminal);

        // Create new terminal and check INTERNAL_ID set on scope
        scope.createNewMobileTerminal();
        scope.$digest();
        expect(scope.currentMobileTerminal.guid).toBe("260");

    }));

    it('onTerminalSystemSelect should set system type and plugin labelName', inject(function($q, SystemTypeAndPlugin, MobileTerminal, TranspondersConfig, TerminalConfig) {
        scope.getCurrentMobileTerminal = function(){
            return scope.currentMobileTerminal;
        };
        scope.isCreateNewMode = function(){
            return false;
        };
        //Mock function
        scope.getTerminalConfig = function(){
            return {
                channelFields: {LES_DESCRIPTION : true}
            }
        };

        expect(scope.currentMobileTerminal.type).toBeUndefined();
        var selectItem = {
            text : "Inmarsat-C - Burum",
            typeAndPlugin : new SystemTypeAndPlugin("INMARSAT-C", "BURUM", "eu.europa.plugin.inmarsat.burum")
        };

        //Select item
        scope.onTerminalSystemSelect(selectItem);
        scope.$digest();

        //Type and plugin labelName should be updated
        expect(scope.currentMobileTerminal.plugin.labelName).toEqual("BURUM");
        expect(scope.currentMobileTerminal.type).toEqual("INMARSAT-C");
    }));


    it('onTerminalSystemSelect should set only system type when LES is missing', inject(function($q, SystemTypeAndPlugin, MobileTerminal) {
        scope.getCurrentMobileTerminal = function(){
            return scope.currentMobileTerminal;
        };
        scope.isCreateNewMode = function(){
            return false;
        };

        expect(scope.currentMobileTerminal.type).toBeUndefined();
        var selectItem = {
            text : "Iridium",
            typeAndPlugin : new SystemTypeAndPlugin("IRIDIUM", undefined, undefined)
        };

        //Select item
        scope.onTerminalSystemSelect(selectItem);
        scope.$digest();

        //Type and plugin labelName should be updated
        expect(scope.currentMobileTerminal.plugin.labelName).toBeUndefined();
        expect(scope.currentMobileTerminal.type).toEqual("IRIDIUM");
    }));
});
