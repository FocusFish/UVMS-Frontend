angular.module('unionvmsWeb').directive('advancedSearch', function() {
	return {
		restrict: 'E',
		replace: true,
		controller: 'AdvancedSearchCtrl',
		templateUrl: 'directive/advancedSearch/advancedSearch.html',
		link: function(scope, element, attrs, fn) {
		}
	};
});

angular.module('unionvmsWeb')
	.controller('AdvancedSearchCtrl', function($scope, $modal){

		$scope.openSaveGroupModal = function(){
			var modalInstance = $modal.open({
			  templateUrl: 'directive/advancedSearch/saveVesselGroupModal/saveVesselGroupModal.html',
			  controller: 'SaveVesselGroupModalInstanceCtrl',
			  windowClass : "saveVesselGroupModal",
			  size: "small",
			  resolve: {
				advancedSearch: function () {
				  return $scope.searchObj;
				},
				vesselGroups: function(){
					return $scope.vesselGroups;
				}
			  }
			});

			modalInstance.result.then(function () {
			  //Get updated list of vessel groups
			  $scope.getVesselGroupsForUser();
			}, function () {
			  //Nothing on cancel
			});
		};


});
