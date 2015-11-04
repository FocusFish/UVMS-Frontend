angular.module('unionvmsWeb').controller('HeaderCtrl',function($scope, $log, $state, $rootScope, $location, $localStorage, userService, renewloginpanel, infoModal, configurationService, selectContextPanel){
    $scope.randomNumber = 5;
    $scope.user = {};

    var init = function(){
        $scope.userName = userService.getUserName();
        $scope.isAuthenticated = userService.isLoggedIn();
        $scope.contexts = userService.getContexts();
        $scope.currentContext = userService.getCurrentContext();
    };
    init();
    $rootScope.$on('AuthenticationSuccess', function () {
        init();
    });
    $rootScope.$on('needsAuthentication', function () {
        init();
    });
    $rootScope.$on('ContextSwitch', function () {
        init();
    });

    $scope.getUser = function(){
        $scope.user.name = "Antonia";
        $scope.user.name = userService.getUserName();

        $scope.user.email = "antonia@havsochvattenmyndigheten.se";

    };

    $scope.getUser();

    $scope.signOut = function(){
        init();
        $state.go('uvmsLogout');
    };

    $scope.signIn = function(){
        $state.go('uvmsLogin');
    };

    $scope.switchContext = function(){
        selectContextPanel.show().then(
            function(selectedContext){
                userService.setCurrentContext(selectedContext);
                init();
            },
            function(error){

                init();
                $log.error(error);
            });
    };

    //TODO: REMOVE THIS, ITS JUST USED FOR SHOWING FEATURES DURING DEVELOPMENT
    $scope.showFeatures = function(){
        var features = $scope.contexts.reduce(function(features, context){
            return features.concat(context.role.features);
        }, []);

        features = $scope.currentContext.role.features.slice(0);

        //Sort the features
        features = _.sortBy(features, function(aFeature) {
          return [aFeature.applicationName, aFeature.featureName].join("_");
        });

        //Create html to show in modal
        features = features.reduce(function(message, aFeature){
            message += aFeature.applicationName +" - " + aFeature.featureName +'<br>';
            return message;
        }, '');

        var options = {
            titleLabel: "Features",
            textLabel: features
        };

        infoModal.open(options);
    };

    $scope.viewNotifications = function(){
        $state.go('app.openTickets');
    };
});
