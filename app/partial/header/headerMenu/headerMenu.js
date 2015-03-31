angular.module('unionvmsWeb').controller('HeaderMenuCtrl',function($scope, $location, locale){

    var setMenu = function(){
        return [
            {
                'title': locale.getString('header.menu_today'),
                'url':'/today'
            },
            {
                'title':locale.getString('header.menu_reporting'),
                'url':'/reporting'
            },
            {
                'title':locale.getString('header.menu_user'),
                'url':'/user'
            },
            {
                'title':locale.getString('header.menu_vessel'),
                'url':'/vessel'
            },
            {
                'title':locale.getString('header.menu_alarmconditions'),
                'url':'/alarmconditions'
            },
            {
                'title':locale.getString('header.menu_communication'),
                'url':'/communication'
            },
            {
                'title':locale.getString('header.menu_configuration'),
                'url':'/configuration'
            },
            {
                'title':locale.getString('header.menu_gis'),
                'url':'/gis'
            }
        ];
    };
    
    
    locale.ready('header').then(function () {
        $scope.menu = setMenu();
    });    

    $scope.isActive = function(viewLocation){
        var active = (viewLocation === $location.path());
        return active;
    };

});