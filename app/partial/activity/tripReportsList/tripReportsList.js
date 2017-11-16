angular.module('unionvmsWeb').controller('TripreportslistCtrl',function($scope,reportService,visibilityService,locale,csvWKTService,tripSummaryService,reportingNavigatorService){

    $scope.tripsList =[{"tripId":"HUN-TRP-3e5fef5feeee1x000000","schemeId":"EU_TRIP_ID","firstFishingActivity":"FISHING_OPERATION","firstFishingActivityDateTime":"2017-04-22T21:18:00","lastFishingActivity":"DEPARTURE","lastFishingActivityDateTime":"2017-04-18T20:00:00","noOfCorrections":0,"tripDuration":0,"flagState":"HUN","vmsPositionCount":0,"multipointWkt":"MULTIPOINT ((38.94285 75.76921666666667), (35.11366666666667 73.95368333333333), (39.748416666666664 75.92583333333334), (39.89908333333334 75.86008333333334), (39.79590322580645 75.76883870967741), (39.769800000000004 75.99586666666667), (34.78987096774193 74.06396774193549), (39.7172 75.9997), (39.480333333333334 75.908), (40.33365 76.01625), (39.11045901639345 75.81252459016395), (34.993633333333335 73.92216666666667), (34.158500000000004 73.938), (40.779624999999996 76.06016666666666), (40.63495 75.8647), (40.117866666666664 76.02241666666666), (40.7714 76.1038), (39.853 76.038), (40.29553225806452 75.91932258064517), (40.145645161290325 76.00158064516128), (40.7007 76.0004), (39.435483870967744 75.91209677419354), (32.2181 73.6274), (39.64614516129032 75.80670967741936), (38.30435483870968 75.17267741935484))","CFR":"HUN123465789","UVI":"2345678","ICCAT":"ATEU0HUN13245","EXT_MARK":"XR001","IRCS":"IRCS1"},{"tripId":"AUT-TRP-38748a7a888857000000","schemeId":"EU_TRIP_ID","firstFishingActivity":"FISHING_OPERATION","firstFishingActivityDateTime":"2017-03-24T00:40:00","lastFishingActivity":"FISHING_OPERATION","lastFishingActivityDateTime":"2017-04-21T00:00:00","noOfCorrections":0,"tripDuration":0,"flagState":"AUT","vmsPositionCount":0,"multipointWkt":"MULTIPOINT ((-19.96240983606557 56.952278688524586), (-18.350383333333333 56.79058333333333), (-19.782016393442625 57.3584262295082), (-14.752295081967212 59.393196721311476), (-18.076295081967213 57.301852459016395), (-14.767163934426229 59.39572131147541), (-17.244524590163934 58.90385245901639), (-19.76046666666667 57.007), (-17.63676859504132 54.68897520661157), (-17.797800000000002 55.11633333333333), (-17.635033333333332 54.7249), (-16.219590163934424 54.786442622950815), (-13.29516393442623 59.4797868852459), (-17.810868852459016 55.19165573770492), (-13.19572131147541 59.476245901639345), (-16.223550000000003 55.671299999999995), (-16.185846153846153 54.767538461538464), (-13.132416666666668 59.45766666666667), (-19.796426229508196 57.38649180327869), (-8.581 42.739737704918035), (-14.8261 59.398066666666665), (-16.3938 56.130066666666664), (-19.923 57.29633333333333), (-16.25189256198347 54.743462809917354), (-13.302146341463414 58.384243902439025), (-16.28425 55.82775), (-11.800666666666666 45.911), (-16.88149180327869 59.10814754098361), (-19.8792 57.07235), (-15.1295 59.5635), (-16.88883606557377 52.569360655737704), (-16.6722131147541 59.42804918032787), (-16.35765 56.08355), (-16.68226229508197 59.396819672131144), (-17.779672131147542 55.15704918032787), (-14.864666666666666 59.436366666666665), (-16.2516 55.8139), (-18.4044 56.79705), (-19.924066666666665 56.951933333333336), (-16.378800000000002 56.1149), (-19.765866666666668 57.02173333333333), (-16.212918032786884 55.80922950819672), (-16.307033333333333 55.865899999999996), (-17.557 54.747166666666665), (-16.306983333333335 55.886316666666666), (-16.404115702479338 54.84260330578512), (-17.758475409836066 55.05904918032787), (-17.8109 54.6993), (-19.664266666666666 57.164449999999995), (-13.161000000000001 59.471), (-16.291083333333333 55.75758333333333), (-18.484180327868852 56.78152459016393), (-14.806066666666666 49.96086666666666), (-11.481566666666668 46.44036666666667), (-16.356849999999998 56.3474), (-16.2792 56.098166666666664), (-19.940466666666666 56.9641), (-16.443622950819673 56.38972131147541), (-19.800967213114752 57.31014754098361), (-19.963666666666665 56.94688333333333), (-16.392245901639345 56.305295081967216))","CFR":"AUT12346789","EXT_MARK":"XR000","IRCS":"IRCS0"}];
    $scope.isTripFilterVisible = false;
    //$scope.itemsByPage = 25;
    //$scope.itemsByPageModal = 15;
    $scope.startDate = undefined;
    $scope.endDate = undefined;
    $scope.attrVisibility = visibilityService;
    $scope.tripSummServ = tripSummaryService;
    $scope.activityTypes = [];

    $scope.updateTripsList = function(tableState, ctrl){
      $scope.callServer(tableState, ctrl, 'tripsList');
    };

    $scope.openTripSummary = function(tripId){
      $scope.tripSummServ.openNewTrip(tripId);
      $scope.goToView(3);
   };
});