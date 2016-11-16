describe('TripsummaryCtrl', function() {

	beforeEach(module('unionvmsWeb'));

	var scope,ctrl,loadingStatus,$anchorScroll,locale,actRestServSpy,tripSumSpy;
	
	beforeEach(function(){
			actRestServSpy = jasmine.createSpyObj('activityRestService', ['getTripVessel','getTripReports']);
			tripSumSpy = jasmine.createSpy('tripSummaryService');
			
			module(function($provide){
					$provide.value('activityRestService', actRestServSpy);
					$provide.value('tripSummaryService', tripSumSpy);
			});
    });
	
	beforeEach(inject(function($httpBackend) {
		//Mock
		$httpBackend.whenGET(/usm/).respond();
		$httpBackend.whenGET(/i18n/).respond();
		$httpBackend.whenGET(/globals/).respond({data : []});
	}));

	beforeEach(inject(function(_loadingStatus_, _$anchorScroll_, _locale_) {
		loadingStatus = _loadingStatus_;
	  $anchorScroll = _$anchorScroll_;
	  locale = _locale_;
	}));

	beforeEach(inject(function($rootScope, $controller, Trip) {
		buildMocks();
		scope = $rootScope.$new();
		scope.trip = new Trip('1');
		ctrl = $controller('TripsummaryCtrl', {$scope: scope, loadingStatus: loadingStatus, $anchorScroll: $anchorScroll});
	}));

	function getTripVessel(){
			return {
				"data":{
						"name":"vesselGroup1",
						"nameEnriched":false,
						"exMark":"EXT_MARK123",
						"exMarkEnriched":false,
						"flagState":"COUNTRYID",
						"flagStateEnriched":false,
						"ircs":"IRCS123",
						"ircsEnriched":false,
						"cfr":"CFR123",
						"cfrEnriched":false,
						"uvi":null,
						"uviEnriched":false,
						"iccat":null,
						"iccatEnriched":false,
						"gfcm":null,
						"gfcmEnriched":false,
						"contactPersons":[
							{
									"isCaptain":false,
									"roles":[
										"SOMEROLE"
									],
									"title":"Mr",
									"givenName":"TOM",
									"middleName":"DAVID",
									"familyName":"BOSE",
									"familyNamePrefix":"ARR",
									"nameSuffix":"PI",
									"gender":"MALE",
									"alias":null,
									"adresses":[
										{
												"blockName":"SDS",
												"buildingName":"SDS",
												"cityName":"CXV",
												"citySubdivisionName":"VCVB",
												"country":"CVCV",
												"countryName":"GHH",
												"countrySubdivisionName":"YUU",
												"addressId":"JHJ",
												"plotId":"JGH",
												"postOfficeBox":"CVGH",
												"postcode":"GHJ",
												"streetname":"TYT"
										}
									]
							},
							{
									"isCaptain":true,
									"roles":[
										"MASTER"
									],
									"title":"Mr",
									"givenName":"JOHN",
									"middleName":"DAVID",
									"familyName":"BOSE",
									"familyNamePrefix":"ARR",
									"nameSuffix":"PI",
									"gender":"MALE",
									"alias":null,
									"adresses":[
										{
												"blockName":"SDS",
												"buildingName":"SDS",
												"cityName":"CXV",
												"citySubdivisionName":"VCVB",
												"country":"CVCV",
												"countryName":"GHH",
												"countrySubdivisionName":"YUU",
												"addressId":"JHJ",
												"plotId":"JGH",
												"postOfficeBox":"CVGH",
												"postcode":"GHJ",
												"streetname":"TYT"
										}
									]
							},
							{
									"isCaptain":true,
									"roles":[
										"MASTER"
									],
									"title":"Mr",
									"givenName":"MARK",
									"middleName":"DAVID",
									"familyName":"BOSE",
									"familyNamePrefix":"ARR",
									"nameSuffix":"PI",
									"gender":"MALE",
									"alias":null,
									"adresses":[
										{
												"blockName":"SDS",
												"buildingName":"SDS",
												"cityName":"CXV",
												"citySubdivisionName":"VCVB",
												"country":"CVCV",
												"countryName":"GHH",
												"countrySubdivisionName":"YUU",
												"addressId":"JHJ",
												"plotId":"JGH",
												"postOfficeBox":"CVGH",
												"postcode":"GHJ",
												"streetname":"TYT"
										}
									]
							}
						]
				},
				"code":200
			};
	}

	function getTripReports() {
		return {
			"data":{
					"fishingTripId":"NOR-TRP-20160517234053706",
					"summary":{
						"DEPARTURE":{
								"date":"2014-05-27T07:47:31",
								"locations":null
						}
					},
					"activityReports":[
						{
								"faReportID":0,
								"activityType":"DEPARTURE",
								"occurence":"2014-05-27T07:47:31",
								"reason":"FISHING",
								"fishingGears":[
									{
											"gearTypeCode":"GEAR_TYPE"
									}
								],
								"delimitedPeriod":[
									{
											"startDate":"2007-02-27T07:47:31",
											"endDate":"2016-06-27T07:47:31",
											"duration":3.0
									},
									{
											"startDate":"2012-02-27T07:47:31",
											"endDate":"2016-06-27T07:47:31",
											"duration":3.0
									},
									{
											"startDate":"2009-04-27T07:47:31",
											"endDate":"2016-06-27T07:47:31",
											"duration":2.0
									},
									{
											"startDate":"2010-05-27T07:47:31",
											"endDate":"2016-06-27T07:47:31",
											"duration":1.0
									},
									{
											"startDate":"2008-02-27T07:47:31",
											"endDate":"2016-06-27T07:47:31",
											"duration":3.0
									},
									{
											"startDate":"2011-02-27T07:47:31",
											"endDate":"2016-06-27T07:47:31",
											"duration":3.0
									},
									{
											"startDate":"2013-02-27T07:47:31",
											"endDate":"2016-06-27T07:47:31",
											"duration":3.0
									},
									{
											"startDate":"2010-06-27T07:47:31",
											"endDate":"2016-06-27T07:47:31",
											"duration":1.0
									}
								],
								"faReportAcceptedDateTime":"2016-06-27T07:47:31",
								"faReportDocumentType":"DECLARATION",
								"correction":false
						},
						{
								"faReportID":0,
								"activityType":"DEPARTURE",
								"occurence":"2016-06-27T07:47:31",
								"reason":"FISHING",
								"faReportAcceptedDateTime":"2016-06-27T07:47:31",
								"faReportDocumentType":"DECLARATION",
								"correction":false
						},
						{
								"faReportID":0,
								"activityType":"FISHING_OPERATION",
								"occurence":"2013-05-27T07:47:31",
								"reason":"FISHING",
								"fishingGears":[
									{
											"gearTypeCode":"GEAR_TYPE"
									}
								],
								"delimitedPeriod":[
									{
											"startDate":"2010-05-27T07:47:31",
											"endDate":"2016-06-27T07:47:31",
											"duration":1.0
									}
								],
								"faReportAcceptedDateTime":"2016-06-27T07:47:31",
								"faReportDocumentType":"DECLARATION",
								"correction":false
						}
					]
			},
			"code":200
		};
	}

	function buildMocks() {
		actRestServSpy.getTripVessel.andCallFake(function(){
			return {
					then: function(callback){
							return callback(getTripVessel());
					}
			};
		});

		actRestServSpy.getTripReports.andCallFake(function(){
			return {
					then: function(callback){
							return callback(getTripReports());
					}
			};
		});
	}

	it('should ...', inject(function() {
		scope.$digest();

		scope.tripSummServ.isLoadingTrip = true;

		scope.$digest();

		expect(1).toEqual(1);
		
	}));

});