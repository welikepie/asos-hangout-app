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

		$('#general .live-message textarea').on('keypress keyup keydown', _.debounce(function () {
			$.ajax({
				'url': nodeUrl + 'app-options',
				'type': 'POST',
				'dataType': 'text',
				'cache': false,
				'data': {'liveMessage': this.value || ''},
				'headers': { 'Authorization': window.authToken }
			});
		}, 1000));

		$('.categoryLink button').on('click', function () {

			// Take and strip the value, append protocol if link, but without one
			var val = $('.categoryLink input[name="categoryLink"]').val()
				.replace(/^\s+|\s+$/g, '')
				.replace(/\s{2,}/g, ' ');
			if ((val.length > 0) && (!val.match(/^https?:\/\//))) { val = 'http://' + val; }

			$.ajax({
				'url': nodeUrl + 'app-options',
				'type': 'POST',
				'dataType': 'text',
				'cache': false,
				'data': {'categoryLink': val},
				'headers': { 'Authorization': window.authToken }
			});

		});

		// APP RESET
		$('.menu button.reset').on('click', _.debounce(function (ev) {

			ev.preventDefault();
			ev.stopPropagation();

			if (window.confirm(
				'WARNING!\n\nThis action will reset the state of the app - twitter feed and product feed will be emptied, ' +
				'users will be removed from the queue and all hangouts disconnected.\nDo NOT reset app while the session is in progress.'
			)) {

				$.ajax({
					'url': nodeUrl + 'reset',
					'type': 'DELETE',
					'dataType': 'text',
					'cache': false,
					'headers': { 'Authorization': window.authToken },
					'complete': _.bind(window.location.reload, window.location, false)
				});

			}
		}, 5000, true));

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
					console.log("dis");
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
				parameters = {},
				spinner = document.getElementsByClassName("spinner")[0];
				spinner.style.display = "block";
				productSearchView.filter.collection = [];
				productSearchView.render();

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
				if (temp.length) { parameters['name'] = temp.toLowerCase(); }

				temp = $this.find('input[name="gender"]').filter(':checked').val();
				if (temp && temp.length) { parameters['gender'] = temp; }

				// Check if search results are already in hash
				var hash = JSON.stringify(parameters);
				if (_.has(productSearchCache, hash)) {

					productSearchView.filter.collection = productSearchCache[hash];
					spinner.style.display = "none";
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
								).join('|'),"i");

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
							spinner.style.display = "none";
							productSearchView.render();

						},
						'error': function () {
							spinner.style.display = "none";
							window.alert('There was an issue with retrieving the products. Please try again in a moment.');
						},
						'complete': function () {
							spinner.style.display = "none";
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
			$.ajax({
							'url': nodeUrl + 'twitter-feed',
							'type': 'GET',
							'headers': { 'Authorization': window.authToken },
							'success': function(response){
								console.log(response);
								if(response.length>0){
									for(var i = response.length-1; i >= 0; i--){
										console.log(i);
										approvedTweets.add(response[i]);
									}
								}
							}
						});
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
					console.log("Sending off for a toy car.");
					if (!approvedTweets.get(model.get('id'))) {
						approvedTweets.add(model, {at:0});
						//Pages.add({ foo: bar }, { at: Pages.length - 2 })
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
					approvedTweets.remove(model);
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
		approvedTweetsView.listenTo(approvedTweets, 'add remove sort change sync reset', _.debounce(approvedTweetsView.render, 250));

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