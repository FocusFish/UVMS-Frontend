angular.module('applications', [
     'ui.route',
     'auth'
     ]);

angular.module('applications').config(['$urlRouterProvider', '$stateProvider', 'ACCESS',                                       
 function ($urlRouterProvider, $stateProvider, ACCESS) {
    $stateProvider
        .state('app.usm.applications', {
            url: '/applications?{page:int}&{sortColumn}&{sortDirection}&{name}&{parent}',
			data: {
				access: ACCESS.AUTH
			},
            params:{
                page:1,
                sortColumn:'name',
                sortDirection:'asc'
            },
            views: {
                "page@app.usm": {
                    templateUrl: 'usm/applications/applicationsList.html',
                    controller: 'applicationsListCtrl'
                }
            },
            ncyBreadcrumb: {
                label: 'Applications'
            },
            resolve: {
                applicationNames: function (applicationsService) {
                    return applicationsService.getParentApplicationNames().then(
                        function (response) {
                            return response.parents;
                        },
                        function (error) {
                            return [error];
                        }
                    );
                }
            }
        })
        .state('app.usm.applications.application', {
            url: '/{applicationName}',
            views: {
                "page@app.usm": {
                    templateUrl: 'usm/applications/partial/applicationDetails.html',
                    controller: "applicationDetailsCtrl"
                }
            },
            ncyBreadcrumb: {
                label: 'Application Details'
            }
        });

}]);

