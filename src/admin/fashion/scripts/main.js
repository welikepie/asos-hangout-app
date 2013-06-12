require.config({
	"baseUrl": "../..",
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
	'common/scripts/data/product', 'common/scripts/ui/collection-view'
], function (
	$, _, Backbone, easyXDM,
	Products, CollectionView
) {
	"use strict";

	var loadedProducts = new Products.ProductCollection(),
		productFeed = new Products.ProductCollection(),
		searchCache = {},
		nodeUrlBase = window.location.protocol + '//' + window.location.hostname + ':8888';

	productFeed.comparator = function (a, b) { return (b.get('addedAt') || (new Date()).getTime()) - (a.get('addedAt') || (new Date()).getTime()); };

	$(function () {

		var productSearchView = new CollectionView({

			'collection': loadedProducts,
			'el': $('#search-results ul').get(0),
			'template': $('#search-results ul > li.template').remove().removeClass('template'),

			'filter': (function () {

				var filter_func = function (model) {
					return _.contains(filter_func.collection, model.id);
				}; filter_func.collection = [];

				return filter_func;

			}()),

			'populate': function (model, element) {
				var excerpt = $(model.get('description')).text().substring(0, 140) + "...";
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
							'url': nodeUrlBase + '/product-feed',
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
		productSearchView.render();

		// Initialise the view for displaying current product feed
		var productFeedView = new CollectionView({

			'collection': productFeed,
			'el': $('#product-feed ul').get(0),
			'template': $('#product-feed ul > li.template').remove().removeClass('template'),

			'populate': function (model, element) {
				var excerpt = $(model.get('description')).text().substring(0, 140) + "...";
				$(element)
					.find('.name').html(model.get('name')).end()
					.find('.description').html(excerpt).end()
					.find('.url').attr('href', model.get('url')).end()
					.find('.image').attr('src', model.get('photo_small')).end();
			},

			'itemEvents': {
				'click button': function (model) {

					$.ajax({
						'url': nodeUrlBase + '/product-feed/' + model.id,
						'type': 'DELETE',
						'dataType': 'text',
						'cache': false,
						'headers': { 'Authorization': window.authToken }
					});

				}
			}

		});
		productFeedView.listenTo(productFeed, 'add remove sort change sync reset', _.debounce(productFeedView.render, 250));
		productFeedView.render();

		$('form').on('submit', function (ev) {

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
				if (_.has(searchCache, hash)) {

					productSearchView.filter.collection = searchCache[hash];
					productSearchView.render();

				} else {

					activator
						.attr('disabled', 'disabled')
						.removeClass('btn-success');

					$.ajax({

						'url': '../gateway/products',
						'type': 'GET',
						'dataType': 'json',
						'data': parameters,

						'success': function (data) {

							// Add search signature to cache
							var collection = _.pluck(data, 'id');
							collection.sort();
							searchCache[hash] = collection;
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

		// Bind clearing product feed
		$('button.clear-all').on('click', function () {
			$.ajax({
				'url': nodeUrlBase + '/product-feed',
				'type': 'DELETE',
				'dataType': 'text',
				'cache': false,
				'headers': { 'Authorization': window.authToken }
			});
		});

		// Category listing bindings
		var selectAll = $('form input.all-categories').get(0),
			allCategories = $('form input[name="category"]');

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

		// SSE BINDINGS
		// =======================
		var socket = new easyXDM.Socket({

			'interval': 1000,
			'local': '../../common/scripts/vendor/easyXDM/name.html',
			'swf': '../../common/scripts/vendor/easyXDM.swf',
			'swfNoThrottle': true,
			'remote': nodeUrlBase + '/stream?' + (new Date()).getTime(),
			'onMessage': function (message) {

				try {

					var data = JSON.parse(message),
						ev = data.event.split(':', 2);

					if (ev[0] === 'productFeed') {

						if (ev[1] === 'reset') {
							productFeed.reset(data.payload);
						} else if (ev[1] === 'add') {
							if (!productFeed.get(data.payload.id)) { productFeed.add(data.payload); }
						} else if (ev[1] === 'remove') {
							var model = productFeed.get(data.payload.id);
							if (model) { productFeed.remove(model); }
						}

					} else if (ev[0] === 'message') {
						window.alert(data.payload);
					}

				} catch (e) {}

			}

		});

	});

});