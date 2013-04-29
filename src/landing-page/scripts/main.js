/*jshint devel:true, immed:false, newcap:false */
/*global require:true */
require.config({
	"baseUrl": "..",
	"paths": {
		"jquery": "common/scripts/vendor/jquery-1.9.1.min",
		"backbone": "common/scripts/vendor/backbone",
		"underscore": "common/scripts/vendor/underscore",
		"easyXDM": "common/scripts/vendor/easyXDM/easyXDM.min",
		"json3": "common/scripts/vendor/easyXDM/json3.min"
	},
	"shim": {
		"underscore": {"exports": "_"},
		"backbone": {
			"deps": ["underscore", "jquery"],
			"exports": "Backbone"
		},
		"easyXDM": {"exports": "easyXDM"},
		"json3": {"exports": "JSON"}
	},
	"waitSeconds": 10
});
require([
	'json3', 'jquery', 'underscore', 'backbone', 'easyXDM',
	'common/scripts/data/product', 'common/scripts/data/tweet',
	'common/scripts/ui/collection-view',
	'common/scripts/product-feed-slider', 'common/scripts/product-overlay-view'
], function (
	JSON, $, _, Backbone, easyXDM,
	Products, Tweets,
	CollectionView,
	bindProductFeed, bindProductView
) {
	"use strict";

	var nodeUrlBase = window.location.protocol + '//' + window.location.hostname + ':8888',
		productFeed = new Products.ProductCollection(),
		twitterFeed = new Tweets.TweetCollection();

	$(function () {

		// Apply UI actions
		var hangoutEmbed = $('#stream-embed iframe'),
			liveMessage = $('#live-message');

		// Initialise the view for displaying current product feed
		var productFeedView = new CollectionView({

			'collection': productFeed,
			'el': $('#product-feed ul').get(0),
			'template': $('#product-feed ul > li.template').remove().removeClass('template'),

			'populate': function (model, element) {
				$(element)
					.find('a').attr('href', model.get('url')).end()
					.find('h2').html(model.get('name')).end()
					.find('h3').html(model.get('price')).end()
					.find('img').attr('src', model.get('photo_small')).end();
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
					.find('h2').text(model.get('author').name).end()
					.find('img').attr('src', model.get('author').avatar).end()
					.find('a').attr('href', model.get('author').url).end()
					.find('time').html(model.get('timestamp').toString()).end()
					.find('.tweet').html(model.get('text')).end();
			}

		});
		twitterFeedView.render();

		var socket = new easyXDM.Socket({

			'interval': 1000,
			'local': '../common/scripts/vendor/easyXDM/name.html',
			'swf': '../common/scripts/vendor/easyXDM.swf',
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
						if (_.has(data.payload, 'hangoutEmbed')) { hangoutEmbed.attr('src', data.payload.hangoutEmbed); }
						if (_.has(data.payload, 'liveMessage')) {
							liveMessage.html(data.payload.liveMessage.replace(/\n/g, " "));
						}
					}

				} catch (e) {}
			}

		});

		// Misc UI bits
		window.setInterval(_.bind(liveMessage.toggleClass, liveMessage, 'blink'), 600);
		$('footer .misc').one('click', function () { $(this).addClass('open'); });

	});

});