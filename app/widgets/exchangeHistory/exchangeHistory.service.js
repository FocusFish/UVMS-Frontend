(function() {
	'use strict';

	angular
		.module('unionvmsWeb')
		.service('exchangeHistoryService', HistogramService);

	function HistogramService(exchangeRestService, GetListRequest) {
		return {
			getHistory: getHistory
		};

		/* Get history (returns promise). */
		function getHistory() {
			var now = moment().startOf('hour');
			var toDate = now.valueOf();
			var fromDate = now.subtract(24, 'hours').valueOf();
			var step = 3600000;

			return getMessages(fromDate, toDate).then(function(messages) {
				return {
					incoming: createHistogram(incoming(messages), fromDate, toDate, step),
					outgoing: createHistogram(outgoing(messages), fromDate, toDate, step),
					timestamps: getTimestamps(fromDate, toDate, step)
				};
			});
		}

		/* List of incoming messages. */
		function incoming(messages) {
			return messages.filter(function(message) {
				return message.incoming === true;
			});
		}

		/* List of outgoing messages. */
		function outgoing(messages) {
			return messages.filter(function(message) {
				return message.incoming === false;
			});
		}

		/* Get pages from server (async) */
		function getMessages(fromMillis, toMillis, page, pageSize) {
			if (page === undefined) {
				page = 1;
			}
			if (pageSize === undefined) {
				pageSize = 100;
			}

			return exchangeRestService
				.getMessages(getRequest(fromMillis, toMillis, page, pageSize))
				.then(getMoreMessages(fromMillis, toMillis, page + 1));
		}

		/* Either gets more messages and concats, or returns items (if last page). */
		function getMoreMessages(fromMillis, toMillis, nextPage) {
			return function(page) {
				if (page.currentPage < page.totalNumberOfPages) {
					return getMessages(fromMillis, toMillis, nextPage).then(function(moreItems) {
						return page.items.concat(moreItems);
					});
				}
				else {
					return page.items;
				}
			};
		}

		/* Parse string to timestamp */
		function parseDateTimeString(dateTimeString) {
			return moment(dateTimeString, 'YYYY-MM-DD HH:mm:ss Z').valueOf();
		}

		/* Fromat timestamp as string. */
		function getDateTimeString(millis) {
			return moment(millis).format('YYYY-MM-DD HH:mm:ss Z');
		}

		/* Create request with from/to and pagination. */
		function getRequest(fromMillis, toMillis, page, listSize) {
			var request = new GetListRequest(page, listSize);
			request.addSearchCriteria('DATE_RECEIVED_FROM', getDateTimeString(fromMillis));
			request.addSearchCriteria('DATE_RECEIVED_TO', getDateTimeString(toMillis));
			return request;
		}

		/* Create histogram from messages list, returns list of numbers */
		function createHistogram(messages, fromMillis, toMillis, stepMillis) {
			function getIndex(timestamp) {
				return Math.floor((timestamp - fromMillis) / stepMillis);
			}

			var bins = {};
			angular.forEach(messages, function(message) {
				var timestamp = parseDateTimeString(message.dateRecieved); // sic
				var index = getIndex(timestamp);
				bins[index] = (bins[index] || 0) + 1;
			});

			var minIndex = getIndex(fromMillis);
			var maxIndex = getIndex(toMillis);
			var histogram = [];
			for (var i = minIndex; i < maxIndex; i += 1) {
				histogram.push(bins[i] || 0);
			}

			return histogram;
		}

		/* List timestamps between fromDate and toDate, inclusive. */
		function getTimestamps(fromDate, toDate, step) {
			var timestamps = [];
			for (; fromDate < toDate; fromDate += step) {
				timestamps.push(fromDate);
			}

			return timestamps;
		}

	}

})();