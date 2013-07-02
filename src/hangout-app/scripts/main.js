/*jshint devel:true */
/*global require:true, gapi:true */
require.config({
	"baseUrl": "..",
	"paths": {
		"jquery": "common/scripts/vendor/jquery-1.9.1.min",
		"backbone": "common/scripts/vendor/backbone",
		"underscore": "common/scripts/vendor/underscore",
		"easyXDM": "common/scripts/vendor/easyXDM/easyXDM.min",
		"moment": "common/scripts/vendor/moment"
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
	'jquery', 'underscore', 'backbone', 'easyXDM', 'moment',
	'common/scripts/data/product', 'common/scripts/data/tweet', 'common/scripts/data/member',
	'common/scripts/ui/collection-view', 'common/scripts/ui/slider'
], function (
	$, _, Backbone, easyXDM, moment,
	Products, Tweets, Members,
	CollectionView, Slider
) {
	"use strict";

	// DATA STRUCTURES
	// Establish collections for product and Twitter feeds,
	// as well as URL base for the node SSE server.
	var productFeed = new Products.ProductCollection(),
		twitterFeed = new Tweets.TweetCollection(),
		stagingQueue = new Members.MemberCollection();
	productFeed.comparator = function (a, b) { return (b.get('addedAt') || (new Date()).getTime()) - (a.get('addedAt') || (new Date()).getTime()); };
	stagingQueue.comparator = function (a, b) { return (a.get('joined') || (new Date()).getTime()) - (b.get('joined') || (new Date()).getTime()); };
	//productFeed.on('all', function (name, ev) { console.log('Event "' + name + '" ran with: ', ev); });

	// DOM-dependent scripts go here
	var init = _.after(2, function () {

		var baseUrl = $('base').eq(0).attr('data-base-url'),
			nodeUrl = $('base').eq(0).attr('data-node-url'),
			localID = gapi.hangout.getLocalParticipant().person.id;

		// Create DOM and Backbone controls for realtime data
		var liveMessage = $('#live-message'),
			productFeedView = new CollectionView({

				'collection': productFeed,
				'el': $('#product-feed ul').get(0),
				'template': $('#product-feed ul > li.template').remove().removeClass('template'),

				'populate': function (model, element) {
					$(element)
						.find('.title').html(model.get('name')).end()
						.find('.price').html(model.get('price')).end()
						.find('a').attr('href', model.get('url')).end()
						.find('img').attr('src', model.get('photo_small')).end();
				}

			}),
			twitterFeedView = new CollectionView({

				'collection': twitterFeed,
				'el': $('#twitter-feed ul').get(0),
				'template': $('#twitter-feed ul > li.template').remove().removeClass('template'),

				'advancedFilter': function (collection) { return collection.first(10); },

				'populate': function (model, element) {
					$(element)
						.find('h2').text(model.get('author').name).end()
						.find('img').attr('src', model.get('author').avatar).end()
						.find('a').attr('href', model.get('author').url).end()
						.find('.time').html(moment(model.get('timestamp')).fromNow()).end()
						.find('.tweet').html(model.get('text')).end();
				}

			});

		// Init rendering of the collection views
		productFeedView.render();
		twitterFeedView.render();

		var productSlider = new Slider(productFeedView.$el, 'li');
		productSlider.animate = function (oldIndex, newIndex, oldEl, newEl) {
			var result = Slider.prototype.animate.apply(this, arguments);
			$('#product-feed .desc').attr('href', newEl.find('a').attr('href'));
			$('#product-feed .desc .title')
				.fadeOut(150)
				.queue('fx', function (next) { this.innerHTML = newEl.find('.title').html() || ''; next(); })
				.fadeIn(150);
			$('#product-feed .desc .price')
				.fadeOut(150)
				.queue('fx', function (next) { this.innerHTML = newEl.find('.price').html() || ''; next(); })
				.fadeIn(150);
			return result;
		};
		$('#product-feed a.prev').on('click', function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
			productSlider.changeTo(productSlider.currentIndex - 1);
		});
		$('#product-feed a.next').on('click', function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
			productSlider.changeTo(productSlider.currentIndex + 1);
		});
		(function () {
			var oldRender = productFeedView.immediateRender;
			productFeedView.immediateRender = function () {
				var result = oldRender.apply(this, arguments);
				_.delay(function () { productSlider.changeTo(productSlider.currentIndex); }, 100);
				return result;
			};
		}());

		var twitterSlider = new Slider(twitterFeedView.$el, 'li');
		$('#twitter-feed a.prev').on('click', function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
			twitterSlider.changeTo(twitterSlider.currentIndex - 1);
		});
		$('#twitter-feed a.next').on('click', function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
			twitterSlider.changeTo(twitterSlider.currentIndex + 1);
		});
		(function () {
			var oldRender = twitterFeedView.immediateRender;
			twitterFeedView.immediateRender = function () {
				var result = oldRender.apply(this, arguments);
				_.delay(function () { twitterSlider.changeTo(twitterSlider.currentIndex); }, 100);
				return result;
			};
		}());

		// Blinking cursor on live message
		window.setInterval(_.bind(liveMessage.toggleClass, liveMessage, 'blink'), 800);

		// Connect to the SSE server and set up appropriate modifications to local collections
		//console.log('Will try to connect script to: ', nodeUrl + 'stream?' + (new Date()).getTime());
		new easyXDM.Socket({

			'interval': 1000,
			'local': baseUrl + 'common/scripts/vendor/easyXDM/name.html',
			'swf': baseUrl + 'common/scripts/vendor/easyXDM.swf',
			'swfNoThrottle': true,
			'remote': nodeUrl + 'stream?' + (new Date()).getTime(),
			'onMessage': function (message) {
				try {

					//console.log('Message arrived: ', message);
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

					} else if (ev[0] === 'stagingQueue') {

						if (ev[1] === 'reset') {
							stagingQueue.reset(data.payload, {'parse': true, 'validate': true});
						} else if (ev[1] === 'add') {
							if (!stagingQueue.get(data.payload.id)) { stagingQueue.add(data.payload, {'parse': true, 'validate': true}); }
						} else if (ev[1] === 'remove') {
							model = stagingQueue.get(data.payload.id);
							if (model) { stagingQueue.remove(model); }
						} else if (ev[1] === 'change') {
							stagingQueue.set([data.payload], {'add': false, 'remove': false, 'merge': true});
						}

					} else if (ev[0] === 'appOptions') {
						if (_.has(data.payload, 'liveMessage')) {
							liveMessage.html(data.payload.liveMessage.replace(/\n/g, " "));
						}
					}

				} catch (e) {}
			}

		});

		// Bind the change events on staging queue to know when to run kick procedures.
		var kickTimeout = null;
		stagingQueue.on('add remove sort change reset', function () {
			if (stagingQueue.get(localID)) {
				if (kickTimeout) {
					window.clearTimeout(kickTimeout);
					kickTimeout = null;
					$('.modal').removeClass('visible');
				}
			} else {
				if (!kickTimeout) {
					$('.modal').addClass('visible');
					kickTimeout = window.setTimeout(function () {

						window.top.close();
						window.top.location.href = (baseUrl + 'landing-page').replace('//', '/');

					}, 5000);
				}
			}
		});

	});

	$(init);
	gapi.hangout.onApiReady.add(init);

});