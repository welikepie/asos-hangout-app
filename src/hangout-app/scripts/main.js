/*jshint devel:true */
/*global require:true, gapi:true */
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
	'common/scripts/data/product', 'common/scripts/data/tweet',
	'common/scripts/ui/collection-view',
	'common/scripts/product-feed-slider', 'common/scripts/product-overlay-view'
], function (
	$, _, Backbone, easyXDM,
	Products, Tweets,
	CollectionView,
	bindProductFeed, bindProductView
) {
	"use strict";

	gapi.hangout.onApiReady.add(function init () {

		var nodeUrlBase = 'http://ks3310759.kimsufi.com:8888',
			productFeed = new Products.ProductCollection(),
			twitterFeed = new Tweets.TweetCollection();

		$(function () {

			// Apply UI actions
			bindProductFeed('#product-feed');
			var showModel = bindProductView('.overlay', '.overlay .product-view'),
				liveMessage = $('#live-message p.content');

			// Initialise the view for displaying current product feed
			var productFeedView = new CollectionView({

				'collection': productFeed,
				'el': $('#product-feed ul').get(0),
				'template': $('#product-feed ul > li.template').remove().removeClass('template'),

				'populate': function (model, element) {
					$(element)
						.find('.name').html(model.get('name')).end()
						.find('.url').attr('href', model.get('url')).end()
						.find('.photo').attr('src', model.get('photo_small')).end()
						.find('.price').html(model.get('price')).end()
						.find('.description').html(model.get('description')).end();
				},

				'itemEvents': {
					'click a': function (model, ev) {

						ev.preventDefault();
						var temp = model.toJSON();
						temp.photo = typeof temp.photo_big !== 'undefined' ? temp.photo_big : temp.photo_small;
						delete temp.photo_small; delete temp.photo_big;
						showModel(temp);

					}
				}

			});
			productFeedView.render();

			// Initialise the view for displaying twitter feed
			var twitterFeedView = new CollectionView({

				'collection': twitterFeed,
				'el': $('#twitter-feed ul').get(0),
				'template': $('#twitter-feed ul > li.template').remove().removeClass('template'),

				'advancedFilter': function (collection) { return collection.first(10); },

				'populate': function (model, element) {
					$(element)
						.find('a h2').text(model.get('author').name).end()
						.find('a img').attr('src', model.get('author').avatar).end()
						.find('a').attr('href', model.get('author').url).end()
						.find('time').html(model.get('timestamp').toString()).end()
						.find('.content').html(model.get('text')).end();
				}

			});
			twitterFeedView.render();

			var socket = new easyXDM.Socket({

				'interval': 1000,
				'local': 'http://ks3310759.kimsufi.com/common/scripts/vendor/easyXDM/name.html',
				'swf': 'http://ks3310759.kimsufi.com/common/scripts/vendor/easyXDM.swf',
				'swfNoThrottle': true,
				'remote': nodeUrlBase + '/stream',
				'onMessage': function (message) {
					try {

						var data = JSON.parse(message),
							ev = data.event.split(':', 2),
							model;

						if (ev[0] === 'productFeed') {

							if (ev[1] === 'reset') {
								productFeed.reset(data.payload);
							} else if (ev[1] === 'add') {
								if (!productFeed.get(data.payload.id)) { productFeed.add(data.payload); }
							} else if (ev[1] === 'remove') {
								model = productFeed.get(data.payload.id);
								if (model) { productFeed.remove(model); }
							}

						} else if (ev[0] === 'twitterFeed') {

							if (ev[1] === 'reset') {
								twitterFeed.reset(data.payload, {'parse': true, 'validate': true});
							} else if (ev[1] === 'add') {
								if (!twitterFeed.get(data.payload.id)) { twitterFeed.add(data.payload, {'parse': true, 'validate': true}); }
							} else if (ev[1] === 'remove') {
								model = twitterFeed.get(data.payload.id);
								if (model) { twitterFeed.remove(model); }
							}

						} else if (ev[0] === 'appOptions') {
							if (_.has(data.payload, 'liveMessage')) {
								liveMessage.html(data.payload.liveMessage.replace(/\n/g, "<br>"));
							}
						}

					} catch (e) {}
				}

			});

		});

	});

});