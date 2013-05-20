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
	'common/scripts/data/tweet', 'common/scripts/ui/collection-view'
], function (
	$, _, Backbone, easyXDM,
	Tweets, CollectionView
) {
	"use strict";

	var incomingTweets = new Tweets.TweetCollection(),
		approvedTweets = new Tweets.TweetCollection(),

		// Base URL for communication with Node SSE server;
		// needed for both SSE bindings and feed modification.
		nodeUrlBase = window.location.protocol + '//' + window.location.hostname + ':8888',

		incomingDisplayCount = 50,
		approvedDisplayCount = 20;

	$(function () {

		// Initialise the view for displaying all tweets obtained via streaming API
		var incomingTweetsView = new CollectionView({

			'collection': incomingTweets,
			'el': $('#fullList').get(0),
			'template': $('#fullList > li.template').remove().removeClass('template'),

			'advancedFilter': function (collection) { return collection.first(incomingDisplayCount); },

			'populate': function (model, element) {
				$(element)
					.find('.name .avatar').text(model.get('author').name).end()
					.find('.avatar img').attr('src', model.get('author').avatar).end()
					.find('a.avatar').attr('href', model.get('author').url).end()
					.find('.content').html(model.get('text')).end()
					.find('time').text(model.get('timestamp').toString()).end();
			},

			'itemEvents': {
				'click button': function (model) {
					if (!approvedTweets.get(model.get('id'))) {

						$.ajax({
							'url': nodeUrlBase + '/twitter-feed',
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
		incomingTweetsView.render();

		// Initialise the view for displaying approved tweets
		var approvedTweetsView = new CollectionView({

			'collection': approvedTweets,
			'el': $('#partialList').get(0),
			'template': $('#partialList > li.template').remove().removeClass('template'),

			'advancedFilter': function (collection) { return collection.first(approvedDisplayCount); },

			'populate': function (model, element) {
				$(element)
					.find('.name .avatar').text(model.get('author').name).end()
					.find('.avatar img').attr('src', model.get('author').avatar).end()
					.find('a.avatar').attr('href', model.get('author').url).end()
					.find('.content').html(model.get('text')).end()
					.find('time').text(model.get('timestamp').toString()).end();
			},

			'itemEvents': {
				'click button': function (model) {

					$.ajax({
						'url': nodeUrlBase + '/twitter-feed/' + model.id,
						'type': 'DELETE',
						'dataType': 'text',
						'cache': false,
						'headers': { 'Authorization': window.authToken }
					});

				}
			}

		});
		approvedTweetsView.render();

		// Bind the AJAX call for changing the filter for streaming tweets
		$('#filter + button').on('click', function () {
			$.ajax({
				'url': nodeUrlBase + '/app-options',
				'type': 'POST',
				'dataType': 'text',
				'cache': false,
				'data': {'twitterSearch': $('#filter').val().replace(/^\s+|\s+$/g, "")},
				'headers': { 'Authorization': window.authToken }
			});
		});

		// SSE BINDINGS
		// =======================
		var streamSocket = new easyXDM.Socket({

			'interval': 1000,
			'local': '../../common/scripts/vendor/easyXDM/name.html',
			'swf': '../../common/scripts/vendor/easyXDM.swf',
			'swfNoThrottle': true,
			'remote': nodeUrlBase + '/twitter-stream?' + (new Date()).getTime(),
			'onMessage': function (message) {
				try {
					var data = JSON.parse(message);
					if (data.event === 'tweet') { incomingTweets.add(data.payload, {'parse': true, 'validate': true}); }
				} catch (e) {}
			}

		});
		var publicSocket = new easyXDM.Socket({

			'interval': 1000,
			'local': '../../common/scripts/vendor/easyXDM/name.html',
			'swf': '../../common/scripts/vendor/easyXDM.swf',
			'swfNoThrottle': true,
			'remote': nodeUrlBase + '/stream?' + (new Date()).getTime(),
			'onMessage': function (message) {
				try {

					var data = JSON.parse(message),
						ev = data.event.split(':', 2);

					if (ev[0] === 'twitterFeed') {

						if (ev[1] === 'reset') {
							approvedTweets.reset(data.payload, {'parse': true, 'validate': true});
						} else if (ev[1] === 'add') {
							if (!approvedTweets.get(data.payload.id)) { approvedTweets.add(data.payload, {'parse': true, 'validate': true}); }
						} else if (ev[1] === 'remove') {
							var model = approvedTweets.get(data.payload.id);
							if (model) { approvedTweets.remove(model); }
						}

					}

				} catch (e) {}
			}

		});

	});

});