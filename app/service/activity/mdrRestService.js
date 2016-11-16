/**
 * @memberof unionvmsWeb
 * @ngdoc service
 * @name mdrRestFactory
 * @param $resource {service} angular resource service
 * @description
 *  REST factory for the Master Data Registry(MDR)
 */
angular.module('unionvmsWeb').factory('mdrRestFactory',function($resource) {
  return {
          getCronJobExpression: function(){
              return $resource('/activity/rest/mdr/scheduler/config', {}, {
                  'get': {
                      method: 'GET'
                  }
              });
          },
          updateCronJobExpression: function(){
              return $resource('/activity/rest/mdr/scheduler/config/update', {}, {
                  'save': {
                      method: 'PUT',
                      headers: {
                          'Content-Type': 'application/json'
                      }
                  }
              });
          },
          getMDRCodeLists: function() {
            return $resource('/activity/rest/mdr/acronyms/details');
          },
           getMDRCodeListByAcronym: function(acronym, offset, size, filter, sortBy, sortReversed) {
            //the URL should be /activity/rest/acronyms/details
              return $resource('service/activity/codeList.json');
          },
          syncNow: function(){
            return $resource('/activity/rest/mdr/sync/list', {}, {
                'update': {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            });
           },
          syncAllNow: function(){
               return $resource('/activity/rest/mdr/sync/all');
          },

          enableDisableScheduledUpdate: function() {
               return $resource('/activity/rest/mdr/status/schedulable/update/:acronymID/:schedulableFlag', {
                     acronymID: '@acronymID',
                     schedulableFlag: '@schedulableFlag'
                }, {
                    'update': {
                        method:'PUT'
                    }
               });
          }
      };
  })
  /**
   * @memberof unionvmsWeb
   * @ngdoc service
   * @name mdrRestService
   * @param $q {service} angular $q service
   * @param mdrRestFactory {service} The REST factory for the Master Data Registry(MDR) <p>{@link unionvmsWeb.mdrRestFactory}</p> 
   * @description
   *  REST services for the Master Data Registry(MDR)
   */
  .service('mdrRestService',function($q, mdrRestFactory) {

  	var mdrRestService = {
        /**
         * Get the current cronJob expression
         * 
         * @memberof mdrRestService
         * @public
         * @returns {Promise} A promise with either the current cronJob expression or reject error
         */
  	    getCronJobExpression: function(){
  	        var deferred = $q.defer();
  	       mdrRestFactory.getCronJobExpression().get(function(response){
  	            deferred.resolve(response.data);
  	        }, function(error){
  	            console.error('Error getting MDR cron job settings.');
  	            deferred.reject(error);
  	        });
  	        return deferred.promise;
  	    },
        /**
         * Save the current cronJob expression
         * 
         * @memberof mdrRestService
         * @public
         * @returns {Promise} A promise with either the success code or reject error
         */
  	    updateCronJobExpression: function(configs){
  	       var deferred = $q.defer();
  	       mdrRestFactory.updateCronJobExpression().save(configs, function(response){
  	           deferred.resolve(response);
  	       }, function(error){
  	           console.error('Error saving MDR cron job settings.');
  	           deferred.reject(error);
  	       });
  	       return deferred.promise;
  	    },
        /**
         * Save the current cronJob expression
         * 
         * @memberof mdrRestService
         * @public
         * @returns {Promise} A promise with either the MDR code list or reject error
         */
  	    getMDRCodeLists: function() {
  	        var deferred = $q.defer();
  	        mdrRestFactory.getMDRCodeLists().get(function(response) {
  	            deferred.resolve(response.data);
  	        }, function(error) {
  	            console.error('Error listing the acronyms table');
  	            deferred.reject(error);
  	        });
  	        return deferred.promise;
  	    },
        /**
         *  Requests all code lists belonging to a given acronym, and updates the smart table state according to the response object.
         *
         * @memberof mdrRestService
         * @public
         * @param {String} acronym - is MDR acronym
         * @param {String} tableState - is an object representing the smart table state
         * @returns {Promise} A promise with either the MDR code list or reject error
         */
  	    getMDRCodeListByAcronym: function(acronym, tableState) {
      	    var pagination = tableState.pagination;
            var offset = pagination.start || 0;     // This is NOT the page number, but the index of item in the list that you want to use to display the table.
            var size = pagination.number || 10;  // Number of entries showed per page.
            var filter = tableState.search.predicateObject;
            var sortBy = tableState.sort.predicate;
            var sortReversed = tableState.sort.reverse;

            var deferred = $q.defer();
            mdrRestFactory.getMDRCodeListByAcronym(acronym, offset, size, filter, sortBy, sortReversed).get(function(response) {
                tableState.pagination.numberOfPages = response.numberOfPages||0;//set the number of pages so the pagination can update
                deferred.resolve(response.data);
            }, function(error) {
                console.error('Error listing code list details');
                deferred.reject(error);
            });
            return deferred.promise;
  	    },
      /**
         *  This method requests an update of selected MDR code lists.
         *
         * @memberof mdrRestService
         * @public
         * @param {Array} acronymsArray - is an array of acronyms (String).
         * @returns {Promise} containing the updated code list
         */
  	    syncNow: function(acronymsArray) {
  	        var deferred = $q.defer();
  	        mdrRestFactory.syncNow().update(acronymsArray, function(response){
                deferred.resolve(response.data);
  	        },
  	        function(error) {
                console.error('Error requesting synchronization of the following acronyms: ' + acronymsArray);
                deferred.reject(error);
  	        });
  	        return deferred.promise;
  	    },
        /**
         *  This method requests an update of all MDR code lists.
         *
         * @memberof mdrRestService
         * @public
         * @returns {Promise} containing the updated code list
         */
        syncAllNow: function() {
            var deferred = $q.defer();
            mdrRestFactory.syncAllNow().get(function(response){
                 deferred.resolve(response.data);
            },
            function(error) {
                 console.error('Error requesting synchronization of all acronyms.');
                 deferred.reject(error);
            });
            return deferred.promise;
        },

        /**
         *  This method enables/disables the automatic update of a given acronym.
         *
         * @memberof mdrRestService
         * @public
         * @param {String} acronym - is the acronym which automatic update will be modified.
         * @param {boolean} schedulable - is a boolean flag. When false - the automatic update will be disabled and vice versa.
         * @returns {Promise} containing either the success code or the reject error
         */
        enableDisableScheduledUpdate: function(acronym, schedulable) {
            var deferred = $q.defer();
            mdrRestFactory.enableDisableScheduledUpdate().update({acronymID: acronym, schedulableFlag: schedulable},
                function(response){
                     deferred.resolve(response.data);
                },
                function(error) {
                     console.error('Error enabling/disabling automatic updates for acronym: ' + acronym);
                     deferred.reject(error);
                });
          return deferred.promise;
        }
  	};

  	return mdrRestService;
});
