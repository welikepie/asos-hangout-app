require.config({
	"baseUrl": "..",
	"paths": {
		"jquery": "common/scripts/vendor/jquery-1.9.1.min",
		"backbone": "common/scripts/vendor/backbone",
		"underscore": "common/scripts/vendor/underscore",
		"easyXDM": "common/scripts/vendor/easyXDM/easyXDM.min"
	},
	"shim": {
		"underscore": {"exports": "_"},
		"backbone": {
			"deps": ["underscore", "jquery"],
			"exports": "Backbone"
		},
		"easyXDM": {"exports": "easyXDM"}
	},
	"waitSeconds": 10
});
require([
	'jquery', 'underscore', 'backbone', 'easyXDM',
	'common/scripts/ui/collection-view', 'common/scripts/data/product', 'common/scripts/data/tweet'
], function (
	$, _, Backbone, easyXDM,
	CollectionView, Products, Tweets
) {
	"use strict";

	var loadedProducts = new Products.ProductCollection(),
		productFeed = new Products.ProductCollection(),
		productSearchCache = {},

		incomingTweets = new Tweets.TweetCollection(),
		approvedTweets = new Tweets.TweetCollection(),
		incomingTweetCount = 50,
		approvedTweetCount = 20;

	productFeed.comparator = function (a, b) { return (b.get('addedAt') || (new Date()).getTime()) - (a.get('addedAt') || (new Date()).getTime()); };

	$(function () {

		var baseUrl = $('base').eq(0).attr('data-base-url'),
			nodeUrl = $('base').eq(0).attr('data-node-url'),

			defaultMainLink = $('#general .hangouts .main').attr('href'),
			defaultStagingLink = $('#general .hangouts .staging').attr('href'),

			// Backbone Views for controlling product feed and search dialogue
			productSearchView,
			productFeedView,

			// Backbone Views for controlling Twitter feed
			incomingTweetsView,
			approvedTweetsView;

		$('#general .live-message textarea').on('keypress', _.debounce(function () {
			$.ajax({
				'url': nodeUrl + 'app-options',
				'type': 'POST',
				'dataType': 'text',
				'cache': false,
				'data': {'liveMessage': this.value || ''},
				'headers': { 'Authorization': window.authToken }
			});
		}, 1000));

		// APP RESET
		$('.menu button.reset').on('click', function (ev) {

			ev.preventDefault();
			ev.stopPropagation();

			if (window.confirm(
				'WARNING!\n\nThis action will reset the state of the app - twitter feed and product feed will be emptied, ' +
				'users will be removed from the queue and all hangouts disconnected.\nDo NOT reset app while the session is in progress.'
			)) {

				// Clear the embed, hangout links and
				// live messaging, terminate the Twitter search
				$.ajax({
					'url': nodeUrl + 'app-options',
					'type': 'POST',
					'dataType': 'text',
					'cache': false,
					'data': {
						'twitterSearch': '',
						'hangoutEmbed': '',
						'liveMessage': '',
						'categoryLink': '',
						'checkHangoutLink': '',
						'mainHangoutLink': ''
					},
					'headers': { 'Authorization': window.authToken },
					'success': function () {

						// Clear UI text fields
						$('#general .live-message textarea').val('');
						$('#twitter .filter input').val('');

						// Clear the product list
						$.ajax({
							'url': nodeUrl + 'product-feed',
							'type': 'DELETE',
							'dataType': 'text',
							'cache': false,
							'headers': { 'Authorization': window.authToken },
							'success': function () {

								// Clear the product search results
								productSearchView.filter.collection = [];
								productSearchView.render();

							}
						});

						// Clear the twitter feed
						$.ajax({
							'url': nodeUrl + 'twitter-feed',
							'type': 'DELETE',
							'dataType': 'text',
							'cache': false,
							'headers': { 'Authorization': window.authToken }
						});

						// Clear the audience queue
						$.ajax({
							'url': nodeUrl + 'audience-queue',
							'type': 'DELETE',
							'dataType': 'text',
							'cache': false,
							'headers': { 'Authorization': window.authToken }
						});

						// Clear the staging queue
						$.ajax({
							'url': nodeUrl + 'staging-queue',
							'type': 'DELETE',
							'dataType': 'text',
							'cache': false,
							'headers': { 'Authorization': window.authToken }
						});

					}
				});

			}
		})

		/* PRODUCT FEED
		 ********************************** */

		productSearchView = new CollectionView({

			'collection': loadedProducts,
			'el': $('#products #search-results ul').get(0),
			'template': $('#products #search-results ul > li.template').remove().removeClass('template'),

			'filter': (function () {

				var filter_func = function (model) {
					return _.contains(filter_func.collection, model.id);
				}; filter_func.collection = [];

				return filter_func;

			}()),

			'populate': function (model, element) {
				var excerpt = document.createElement('div');
				excerpt.innerHTML = model.get('description');
				excerpt = $(excerpt).text().substring(0, 140) + "...";
				$(element)
					.find('.name').html(model.get('name')).end()
					.find('.description').html(excerpt).end()
					.find('.url').attr('href', model.get('url')).end()
					.find('.image').attr('src', model.get('photo_small')).end();
			},

			'itemEvents': {
				'click button': function (model) {
					if (!productFeed.get(model.get('id'))) {

						$.ajax({
							'url': nodeUrl + 'product-feed',
							'type': 'POST',
							'dataType': 'text',
							'cache': false,
							'data': JSON.stringify(model.toJSON()),
							'headers': { 'Authorization': window.authToken }
						});

					}
				}
			}

		});

		productFeedView = new CollectionView({

			'collection': productFeed,
			'el': $('#products #product-feed ul').get(0),
			'template': $('#products #product-feed ul > li.template').remove().removeClass('template'),

			'populate': function (model, element) {
				var excerpt = document.createElement('div');
				excerpt.innerHTML = model.get('description');
				excerpt = $(excerpt).text().substring(0, 140) + "...";
				$(element)
					.find('.name').html(model.get('name')).end()
					.find('.description').html(excerpt).end()
					.find('.url').attr('href', model.get('url')).end()
					.find('.image').attr('src', model.get('photo_small')).end();
			},

			'itemEvents': {
				'click button': function (model) {

					$.ajax({
						'url': nodeUrl + 'product-feed/' + model.id,
						'type': 'DELETE',
						'dataType': 'text',
						'cache': false,
						'headers': { 'Authorization': window.authToken }
					});

				}
			}

		});
		productFeedView.listenTo(productFeed, 'add remove sort change sync reset', _.debounce(productFeedView.render, 250));

		productSearchView.render();
		productFeedView.render();

		// PRODUCT SEARCH FORM HANDLING
		$('#products form').on('submit', function (ev) {

			var temp,
				$this = $(this),
				activator = $this.find('button[type="submit"]'),
				parameters = {};

			ev.preventDefault();
			ev.stopPropagation();

			if (!activator.attr('disabled')) {

				// Assemble the search parameters
				var allCategories = $this.find('input[name="category"]'),
					enabledCategories = allCategories.filter(':checked');

				if (enabledCategories.length <= 0) {
					window.alert('You need to keep at least one category selected.');
					return false;
				}

				if (allCategories.length !== enabledCategories.length) {
					parameters['category'] = [];
					enabledCategories.each(function () { parameters['category'].push(this.value); });
					parameters['category'] = parameters['category'].join(',');
				}

				temp = $this.find('input[name="name"]').val().replace(/^\s+|\s+$/g, '');
				if (temp.length) { parameters['name'] = temp; }

				temp = $this.find('input[name="gender"]').filter(':checked').val();
				if (temp && temp.length) { parameters['gender'] = temp; }

				// Check if search results are already in hash
				var hash = JSON.stringify(parameters);
				if (_.has(productSearchCache, hash)) {

					productSearchView.filter.collection = productSearchCache[hash];
					productSearchView.render();

				} else {

					activator
						.attr('disabled', 'disabled')
						.removeClass('btn-success');

					$.ajax({

						'url': 'gateway/products',
						'type': 'GET',
						'dataType': 'json',
						'data': parameters,

						'success': function (data) {

							// Post-process search results
							if (parameters['name']) {

								var matcher = new RegExp(_.map(
									parameters['name'].match(/"[^"]+"|\S+/g),
									function (match) { return '\\b' + match.replace(/^"|"$/g, '') + '\\b'; }
								).join('|'));

								data = _.filter(data, function (item) { return (
									matcher.test(item.name) ||
									matcher.test(item.description)
								); });

							}

							// Add search signature to cache
							var collection = _.pluck(data, 'id');
							collection.sort();
							productSearchCache[hash] = collection;
							productSearchView.filter.collection = collection;

							loadedProducts.set(data, {'add': true, 'remove': false, 'merge': false});
							productSearchView.render();

						},
						'error': function () {
							window.alert('There was an issue with retrieving the products. Please try again in a moment.');
						},
						'complete': function () {
							activator
								.removeAttr('disabled')
								.addClass('btn-success');
						}

					});

				}

			}

			return false;

		});
		$('#products button.clear').on('click', function () {
			productSearchView.filter.collection = [];
			productSearchView.render();
		});
		// Bind clearing product feed
		$('#products button.clear-all').on('click', function () {
			$.ajax({
				'url': nodeUrl + 'product-feed',
				'type': 'DELETE',
				'dataType': 'text',
				'cache': false,
				'headers': { 'Authorization': window.authToken }
			});
		});

		// Category listing bindings
		var selectAll = $('#products form input.all-categories').get(0),
			allCategories = $('#products form input[name="category"]');

		allCategories.on('change', function () {
			var checkCategories = allCategories.filter(':checked');
			selectAll.checked = allCategories.length === checkCategories.length;
		});
		$(selectAll).on('change', function () {
			allCategories.each(
				this.checked ?
				function () { this.checked = true; } :
				function () { this.checked = false; }
			);
		});

		$('#products form input[type="radio"]').on('change', function () {

			// Only fire the search on radio change if
			// 1) there is some string to search for in name OR
			// 2) category selection is not default "all"
			if (
				$('#products form input[name="name"]').val().replace(/^\s+|\sd+$/g, '').length ||
				(allCategories.length !== allCategories.filter(':checked').length)
			) { $('#products form').trigger('submit'); }

		});

		/* TWITTER FEED
		 ********************************** */

		 incomingTweetsView = new CollectionView({

			'collection': incomingTweets,
			'el': $('#twitter .incoming-tweets ul').get(0),
			'template': $('#twitter .incoming-tweets ul > li.template').remove().removeClass('template'),

			'advancedFilter': function (collection) { return collection.first(incomingTweetCount); },

			'populate': function (model, element) {
				$(element)
					.find('.name a').text(model.get('author').name).attr('href', model.get('author').url).end()
					.find('img').attr('src', model.get('author').avatar).end()
					.find('.content').html(model.get('text')).end()
					.find('time').text(model.get('timestamp').toString()).end();
			},

			'itemEvents': {
				'click button': function (model) {
					if (!approvedTweets.get(model.get('id'))) {

						$.ajax({
							'url': nodeUrl + 'twitter-feed',
							'type': 'POST',
							'dataType': 'text',
							'cache': false,
							'data': JSON.stringify(model.toJSON()),
							'headers': { 'Authorization': window.authToken }
						});

					}
				}
			}

		});

		 approvedTweetsView = new CollectionView({

			'collection': approvedTweets,
			'el': $('#twitter .twitter-feed ul').get(0),
			'template': $('#twitter .twitter-feed ul > li.template').remove().removeClass('template'),

			'advancedFilter': function (collection) { return collection.first(approvedTweetCount); },

			'populate': function (model, element) {
				$(element)
					.find('.name a').text(model.get('author').name).attr('href', model.get('author').url).end()
					.find('img').attr('src', model.get('author').avatar).end()
					.find('.content').html(model.get('text')).end()
					.find('time').text(model.get('timestamp').toString()).end();
			},

			'itemEvents': {
				'click button': function (model) {

					$.ajax({
						'url': nodeUrl + 'twitter-feed/' + model.id,
						'type': 'DELETE',
						'dataType': 'text',
						'cache': false,
						'headers': { 'Authorization': window.authToken }
					});

				}
			}

		});

		incomingTweetsView.render();
		approvedTweetsView.render();

		// Bind the AJAX call for changing the filter for streaming tweets
		$('#twitter .filter button').on('click', function () {
			$.ajax({
				'url': nodeUrl + 'app-options',
				'type': 'POST',
				'dataType': 'text',
				'cache': false,
				'data': {'twitterSearch': $('#twitter .filter input').val().replace(/^\s+|\s+$/g, "")},
				'headers': { 'Authorization': window.authToken }
			});
		});

		// Bind clearing twitter feed
		$('#twitter button.clear-all').on('click', function () {
			$.ajax({
				'url': nodeUrl + 'twitter-feed',
				'type': 'DELETE',
				'dataType': 'text',
				'cache': false,
				'headers': { 'Authorization': window.authToken }
			});
		});

		/* DATA STREAM HANDLING
		 ********************************** */

		// General event stream
		new easyXDM.Socket({

			'interval': 1000,
			'local': '../common/scripts/vendor/easyXDM/name.html',
			'swf': '../common/scripts/vendor/easyXDM.swf',
			'swfNoThrottle': true,
			'remote': nodeUrl + 'stream?' + (new Date()).getTime(),
			'onMessage': function (message) {

				try {

					var data = JSON.parse(message),
						ev = data.event.split(':', 2),
						el, temp;

					// Product feed updater
					if (ev[0] === 'productFeed') {

						if (ev[1] === 'reset') {
							productFeed.reset(data.payload);
						} else if (ev[1] === 'add') {
							if (!productFeed.get(data.payload.id)) { productFeed.add(data.payload); }
						} else if (ev[1] === 'remove') {
							var model = productFeed.get(data.payload.id);
							if (model) { productFeed.remove(model); }
						}

					} else if (ev[0] === 'twitterFeed') {

						if (ev[1] === 'reset') {
							approvedTweets.reset(data.payload, {'parse': true, 'validate': true});
						} else if (ev[1] === 'add') {
							if (!approvedTweets.get(data.payload.id)) { approvedTweets.add(data.payload, {'parse': true, 'validate': true}); }
						} else if (ev[1] === 'remove') {
							var model = approvedTweets.get(data.payload.id);
							if (model) { approvedTweets.remove(model); }
						}

					// Generic app options updater
					} else if (ev[0] === 'appOptions') {

						// Hangout links and stream URLS
						if (_.has(data.payload, 'hangoutEmbed')) {
							if (data.payload.hangoutEmbed && data.payload.hangoutEmbed.length) {
								$('#general .hangouts .embed')
									.attr('href', 'http://youtu.be/' + data.payload.hangoutEmbed)
									.html('http://youtu.be/' + data.payload.hangoutEmbed);
							} else {
								$('#general .hangouts .embed')
									.removeAttr('href')
									.html('NOT AVAILABLE, START ON-AIR HANGOUT FIRST');
							}
						}
						if (_.has(data.payload, 'mainHangoutLink')) {
							if (data.payload.mainHangoutLink && data.payload.mainHangoutLink.length) {
								temp = data.payload.mainHangoutLink.replace(/\gid=[0-9]+/, defaultMainLink.match(/\gid=[0-9]+/)[0]);
								$('#general .hangouts .main')
									.attr('href', temp)
									.html(temp);
							} else {
								$('#general .hangouts .main')
									.attr('href', defaultMainLink)
									.html('NO HANGOUT - CLICK HERE TO START ONE');
							}
						}
						if (_.has(data.payload, 'checkHangoutLink')) {
							if (data.payload.checkHangoutLink && data.payload.checkHangoutLink.length) {
								temp = data.payload.checkHangoutLink.replace(/\gid=[0-9]+/, defaultStagingLink.match(/\gid=[0-9]+/)[0]);
								$('#general .hangouts .staging')
									.attr('href', temp)
									.html(temp);
							} else {
								$('#general .hangouts .staging')
									.attr('href', defaultStagingLink)
									.html('NO HANGOUT - CLICK HERE TO START ONE');
							}
						}

						// Live message updates
						el = $('#general .live-message textarea');
						if (_.has(data.payload, 'liveMessage') && (data.payload.liveMessage !== el.val())) {
							el.val(data.payload.liveMessage);
						}

					} else if (ev[0] === 'message') { window.alert(data.payload); }

				} catch (e) {}

			}

		});

		// Incoming tweets stream
		new easyXDM.Socket({

			'interval': 1000,
			'local': '../common/scripts/vendor/easyXDM/name.html',
			'swf': '../common/scripts/vendor/easyXDM.swf',
			'swfNoThrottle': true,
			'remote': nodeUrl + 'twitter-stream?' + (new Date()).getTime(),
			'onMessage': function (message) {
				try {
					var data = JSON.parse(message);
					if (data.event === 'tweet') { incomingTweets.add(data.payload, {'parse': true, 'validate': true}); }
				} catch (e) {}
			}

		});

	});

});