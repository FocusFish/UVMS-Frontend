describe('infoModalCtrl', function() {

	beforeEach(module('unionvmsWeb'));

	var scope,ctrl;

    beforeEach(inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      ctrl = $controller('infoModalCtrl', {$scope: scope, $modalInstance: {}, options: {} });
    }));	

	it('should ...', inject(function() {

		expect(1).toEqual(1);
		
	}));

});