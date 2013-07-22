/*jshint devel:true, immed:false, newcap:false, boss:true */
/*global require:true */
require.config({
	"baseUrl" : "..",
	"paths" : {
		"jquery" : "common/scripts/vendor/jquery-1.9.1.min",
		"backbone" : "common/scripts/vendor/backbone",
		"underscore" : "common/scripts/vendor/underscore",
		"easyXDM" : "common/scripts/vendor/easyXDM/easyXDM.min",
		"moment" : "common/scripts/vendor/moment"
	},
	"shim" : {
		"underscore" : {
			"exports" : "_"
		},
		"backbone" : {
			"deps" : ["underscore", "jquery"],
			"exports" : "Backbone"
		},
		"easyXDM" : {
			"exports" : "easyXDM"
		}
	},
	"waitSeconds" : 10
});
require(['jquery', 'underscore', 'backbone', 'easyXDM', "moment", 'common/scripts/data/product', 'common/scripts/data/tweet', 'common/scripts/data/member', 'common/scripts/ui/collection-view', 'common/scripts/ui/slider'], function($, _, Backbone, easyXDM, moment, Products, Tweets, Members, CollectionView, Slider) {"use strict";

	// DATA STRUCTURES
	// Establish collections for product and Twitter feeds,
	// as well as URL base for the node SSE server.
	var appOptions = {}, productFeed = new Products.ProductCollection({
		'comparator' : function(a, b) {
			return a.get('addedAt') - b.get('addedAt');
		}
	}), twitterFeed = new Tweets.TweetCollection(), audienceQueue = new Members.MemberCollection(), stagingQueue = new Members.MemberCollection();

	productFeed.comparator = function(a, b) {
		return (b.get('addedAt') || (new Date()).getTime()) - (a.get('addedAt') || (new Date()).getTime());
	};

	// DOM-dependent scripts go here
	$(function() {

		var baseUrl = $('base').eq(0).attr('data-base-url'), nodeUrl = $('base').eq(0).attr('data-node-url');

		// Create DOM and Backbone controls for realtime data
		var liveMessage = $('#live-message'), categoryLink = $('#product-feed a.shop'), streamEmbed = $('#stream-embed iframe'), invitation = $('#audience-queue .invitation'), queueJoinLink = $('#audience-queue .join-queue'), productFeedView = new CollectionView({

			'collection' : productFeed,
			'el' : $('#product-feed ul').get(0),
			'template' : $('#product-feed ul > li.template').remove().removeClass('template'),

			'populate' : function(model, element) {
				$(element).find('.title').html(model.get('name')).end().find('.price').html(model.get('price')).end().find('a').attr('href', model.get('url')).end().find('img').attr('src', model.get('photo_small')).end();
			}
		}), twitterFeedView = new CollectionView({

			'collection' : twitterFeed,
			'el' : $('#twitter-feed ul').get(0),
			'template' : $('#twitter-feed ul > li.template').remove().removeClass('template'),

			'advancedFilter' : function(collection) {
				return collection.first(10);
			},

			'populate' : function(model, element) {
				$(element).find('h2').text(model.get('author').name).end().find('img').attr('src', model.get('author').avatar).end().find('a').attr('href', model.get('author').url).end().find('.time').html(moment(model.get('timestamp')).fromNow()).end().find('.tweet').html(model.get('text')).end();
			}
		}), audienceQueueView = new CollectionView({

			'collection' : audienceQueue,
			'el' : $('#audience-queue ul').get(0),
			'template' : $('#audience-queue ul > li.template').remove().removeClass('template'),

			'populate' : function(model, element) {
				$(element).find('h2').text(model.get('name')).end().find('img').attr('src', model.get('avatar')).end().find('a').attr('href', model.get('url')).end();
			}
		});

		// Init rendering of the collection views
		productFeedView.render();
		twitterFeedView.render();
		audienceQueueView.render();

		var productSlider = new Slider(productFeedView.$el, 'li');
		productSlider.changeTo = function() {
			console.log(arguments);
			return Slider.prototype.changeTo.apply(this, arguments);
		};
		productSlider.animate = function(oldIndex, newIndex, oldEl, newEl) {
			var result = Slider.prototype.animate.apply(this, arguments);
			$('#product-feed .desc').attr('href', newEl.find('a').attr('href'));
			$('#product-feed .desc .title').fadeOut(150).queue('fx', function(next) {
				this.innerHTML = newEl.find('.title').html() || '';
				next();
			}).fadeIn(150);
			$('#product-feed .desc .price').fadeOut(150).queue('fx', function(next) {
				this.innerHTML = newEl.find('.price').html() || '';
				next();
			}).fadeIn(150);
			return result;
		};
		$('#product-feed a.prev').on('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			console.log(productSlider);
			productSlider.changeTo(productSlider.currentIndex - 1);
		});
		$('#product-feed a.next').on('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			console.log(productSlider);

			productSlider.changeTo(productSlider.currentIndex + 1);
		}); ( function() {
				var oldRender = productFeedView.immediateRender;
				productFeedView.immediateRender = function() {
					var result = oldRender.apply(this, arguments);
					_.delay(function() {
						productSlider.changeTo(productSlider.currentIndex);
					}, 100);
					return result;
				};
			}());
		$(window).on('resize', _.debounce(function() {
			productSlider.changeTo(productSlider.currentIndex);
		}, 250));

		var twitterSlider = new Slider(twitterFeedView.$el, 'li');
		$('#twitter-feed a.prev').on('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			twitterSlider.changeTo(twitterSlider.currentIndex - 1);
		});
		$('#twitter-feed a.next').on('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			twitterSlider.changeTo(twitterSlider.currentIndex + 1);
		}); ( function() {
				var oldRender = twitterFeedView.immediateRender;
				twitterFeedView.immediateRender = function() {
					var result = oldRender.apply(this, arguments);
					_.delay(function() {
						twitterSlider.changeTo(twitterSlider.currentIndex);
					}, 100);
					return result;
				};
			}());

		var queueSlider = new Slider(audienceQueueView.$el, 'li');
		$('#audience-queue a.prev').on('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			queueSlider.changeTo(queueSlider.currentIndex - 1);
		});
		$('#audience-queue a.next').on('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			queueSlider.changeTo(queueSlider.currentIndex + 1);
		}); ( function() {
				var oldRender = audienceQueueView.immediateRender;
				audienceQueueView.immediateRender = function() {
					var result = oldRender.apply(this, arguments);
					_.delay(function() {
						queueSlider.changeTo(queueSlider.currentIndex);
					}, 100);
					return result;
				};
			}());

		// Blinking cursor on live message
		window.setInterval(_.bind(liveMessage.toggleClass, liveMessage, 'blink'), 800);
		$('footer .misc-mobile').one('click', function() {
			$(this).removeClass('closed');
		});

		// Connect to the SSE server and set up appropriate modifications to local collections
		new easyXDM.Socket({
			'interval' : 1000,
			'local' : baseUrl + 'common/scripts/vendor/easyXDM/name.html',
			'swf' : baseUrl + 'common/scripts/vendor/easyXDM.swf',
			'swfNoThrottle' : true,
			'remote' : nodeUrl + 'stream?' + (new Date()).getTime(),
			'onMessage' : function(message) {
				try {

					var data = JSON.parse(message), ev = data.event.split(':', 2), model;

					if (ev[0] === 'productFeed') {
						if (ev[1] === 'reset') {
							productFeed.reset(data.payload);
							//productSlider.changeTo(0);
						} else if (ev[1] === 'add') {
							if (!productFeed.get(data.payload.id)) {
								if (!productFeed.contains(data.payload)) {
									productFeed.add(data.payload);
									console.log(productSlider.currentIndex);
									productSlider.changeTo(0);
									//						if(productSlider.currentIndex > 0){
									//							 productSlider.changeTo(productSlider.currentIndex-1);
									//						}
								}

							}

						} else if (ev[1] === 'remove') {
							console.log(data.payload);
							model = productFeed.get(data.payload.id);
							if (model) {
								//								console.log(productFeed.indexOf(model)+"<"+productSlider.currentSlide);
								//THERE IS A BUG IN THIS CODE. RENDERING BEHAVES AS NORMAL THEN GOES IFFY
								//								if((productFeed.indexOf(model)<productSlider.currentIndex )){
								//								productSlider.currentIndex = productSlider.currentIndex-1;
								//								}
								productFeed.remove(model);
							}
						}

					} else if (ev[0] === 'twitterFeed') {

						if (ev[1] === 'reset') {
							twitterFeed.reset(data.payload, {
								'parse' : true,
								'validate' : true
							});
						} else if (ev[1] === 'add') {
							if (!twitterFeed.get(data.payload.id)) {
								twitterFeed.add(data.payload, {
									'parse' : true,
									'validate' : true
								});
							}
						} else if (ev[1] === 'remove') {
							model = twitterFeed.get(data.payload.id);
							if (model) {
								twitterFeed.remove(model);
							}
						}

					} else if (ev[0] === 'audienceQueue') {

						if (ev[1] === 'reset') {
							audienceQueue.reset(data.payload, {
								'parse' : true,
								'validate' : true
							});
						} else if (ev[1] === 'add') {
							if (!audienceQueue.get(data.payload.id)) {
								audienceQueue.add(data.payload, {
									'parse' : true,
									'validate' : true
								});
							}
						} else if (ev[1] === 'remove') {
							model = audienceQueue.get(data.payload.id);
							if (model) {
								audienceQueue.remove(model);
							}
						} else if (ev[1] === 'change') {
							audienceQueue.set([data.payload], {
								'add' : false,
								'remove' : false,
								'merge' : true
							});
						}

					} else if (ev[0] === 'stagingQueue') {

						if (ev[1] === 'reset') {
							stagingQueue.reset(data.payload, {
								'parse' : true,
								'validate' : true
							});
						} else if (ev[1] === 'add') {
							if (!stagingQueue.get(data.payload.id)) {
								stagingQueue.add(data.payload, {
									'parse' : true,
									'validate' : true
								});
							}
						} else if (ev[1] === 'remove') {
							model = stagingQueue.get(data.payload.id);
							if (model) {
								stagingQueue.remove(model);
							}
						} else if (ev[1] === 'change') {
							stagingQueue.set([data.payload], {
								'add' : false,
								'remove' : false,
								'merge' : true
							});
						}

					} else if (ev[0] === 'appOptions') {
						if (_.has(data.payload, 'liveMessage')) {
							liveMessage.html(data.payload.liveMessage.replace(/\n/g, " "));
						}
						if (_.has(data.payload, 'hangoutEmbed')) {
							console.log(data.payload);
							if (data.payload.hangoutEmbed && data.payload.hangoutEmbed.length) {
								console.log(data.payload.hangoutEmbed);
								streamEmbed.attr('src', '//www.youtube-nocookie.com/embed/' + data.payload.hangoutEmbed + '?autoplay=1');
							} else {
								streamEmbed.removeAttr('src');
							}
						}
						if (_.has(data.payload, 'categoryLink')) {
							categoryLink.attr('href', data.payload.categoryLink);
						}
						if (_.has(data.payload, 'checkHangoutLink')) {
							appOptions.checkHangoutLink = data.payload.checkHangoutLink;
						}
						if (_.has(data.payload, 'mainHangoutLink')) {
							appOptions.mainHangoutLink = data.payload.mainHangoutLink;
						}
					}

				} catch (e) {
				}
			}
		});

		var statusFunc = function() {
			var model, temp;
			if (window.localID) {
				if ( model = audienceQueue.get(window.localID)) {
					if (model.get('state') !== 0) {
						temp = 2;
					} else {
						temp = 1;
					}
				} else if ( model = stagingQueue.get(window.localID)) {
					if (model.get('state') === 0) {
						temp = 2;
					} else {
						temp = 3;
					}
				} else {
					temp = 0;
				}
			} else {
				temp = 0;
			}

			switch (temp) {
				case 0:
					queueJoinLink.addClass('visible');
					invitation.removeClass('open');
					break;
				case 1:
					queueJoinLink.removeClass('visible');
					invitation.removeClass('open');
					break;
				case 2:
					queueJoinLink.removeClass('visible');
					invitation.addClass('open').find('a').attr('href', appOptions.checkHangoutLink).html(appOptions.checkHangoutLink);
					break;
				case 3:
					queueJoinLink.removeClass('visible');
					invitation.addClass('open').find('a').attr('href', appOptions.mainHangoutLink).html(appOptions.mainHangoutLink);
					break;
			}
		};
		audienceQueue.on('add remove reset change sort', statusFunc);
		stagingQueue.on('add remove reset change sort', statusFunc);

	});

}); 