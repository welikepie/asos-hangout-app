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

	// Two product collections - one will hold all the products
	// currently residing in DB, the other one will be used to
	// store the state of global product feed.
	var allProducts = new Products.ProductCollection(),
		productFeed = new Products.ProductCollection();

	// Fetch the complete collection into the page for
	// filtering, searching and addition to general feed.
	allProducts.fetch({'url': '../data/products.json'});

	// Base URL for communication with Node SSE server;
	// needed for both SSE bindings and feed modification.
	var nodeUrlBase = window.location.protocol + '//' + window.location.hostname + ':8888';

	$(function () {

		// Initialise the view for displaying all products currently in the DB
		var allProductsView = new CollectionView({

			'collection': allProducts,
			'el': $('#fullList').get(0),
			'template': $('#fullList > li.template').remove().removeClass('template'),

			'filter': (function () {

				var filter_func = function (model) {
					var sample = filter_func.phrase.replace(/^\s+|\s+$/g, "").toLowerCase();
					return (
						(model.get('name').toLowerCase().indexOf(sample) !== -1) ||
						(model.get('description').toLowerCase().indexOf(sample) !== -1)
					);
				};
				filter_func.phrase = '';

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
		allProductsView.render();

		// Initialise the view for displaying current product feed
		var productFeedView = new CollectionView({

			'collection': productFeed,
			'el': $('#partialList').get(0),
			'template': $('#partialList > li.template').remove().removeClass('template'),

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
		productFeedView.render();

		// Search controls - bindings to pass the contents of search form
		// to filter property on full DB product view and rerender.
		$('#searchBox + button').on('click', function () {
			allProductsView.filter.phrase = $('#searchBox').val().replace(/^\s+|\s+$/g, "");
			allProductsView.render();
		});

		// SSE BINDINGS
		// =======================
		var socket = new easyXDM.Socket({

			'interval': 1000,
			'local': '../../common/scripts/vendor/easyXDM/name.html',
			'swf': '../../common/scripts/vendor/easyXDM.swf',
			'swfNoThrottle': true,
			'remote': nodeUrlBase + '/stream',
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