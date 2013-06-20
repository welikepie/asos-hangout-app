/*jshint devel:true, boss:true */
/*global require:true, gapi:true */
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
	'common/scripts/data/member', 'common/scripts/ui/collection-view'
], function ($, _, Backbone, easyXDM, Members, CollectionView) {
	"use strict";

	var stagingQueue = new Members.MemberCollection();

	stagingQueue.comparator = function (a, b) {
		return (a.get('joined') || (new Date()).getTime()) - (b.get('joined') || (new Date()).getTime());
	};

	var init = _.after(2, function () {

		var baseUrl = $('base').eq(0).attr('data-base-url'),
			nodeUrl = $('base').eq(0).attr('data-node-url'),
			automaticTimer,

			stagingQueueView = new CollectionView({

				'collection': stagingQueue,
				'el': $('#staging-queue ul').get(0),
				'template': $('#staging-queue ul > li.template').remove().removeClass('template'),
				'filter': function (model) { return model.get('state') !== 2; },

				'populate': function (model, element) {

					var el = $(element)
						.find('a').attr('href', model.get('url')).end()
						.find('img').attr('src', model.get('avatar')).end()
						.find('h2').html(model.get('name')).end();

					if (model.get('state') === 0) { el.find('button.invite').removeAttr('disabled'); }
					else { el.find('button.invite').attr('disabled', 'disabled'); }

				},

				'itemEvents': {
					'click button.invite': function (model/*, ev, element*/) {

						$.ajax({
							'url': nodeUrl + 'staging-queue',
							'type': 'PATCH',
							'dataType': 'text',
							'cache': false,
							'headers': { 'Authorization': window.authToken },
							'data': JSON.stringify({'id': model.id, 'state': 1})
						});

					}
				}

			}),

			participantsView = new CollectionView({

				'collection': stagingQueue,
				'el': $('#participant-list ul').get(0),
				'template': $('#participant-list ul > li.template').remove().removeClass('template'),
				'filter': function (model) { return model.get('state') === 2; },

				'populate': function (model, element) {

					var el = $(element)
						.find('a').attr('href', model.get('url')).end()
						.find('img').attr('src', model.get('avatar')).end()
						.find('h2').html(model.get('name')).end();

					if (automaticTimer.enabled && model.get('kickedAt')) {
						el.find('p.timer').html(
							'Will be kicked automatically in:<br><strong>' +
							Math.round((model.get('kickedAt') - (new Date()).getTime()) / 1000) +
							' seconds</strong>'
						);
					}

				},

				'itemEvents': {
					'click button.kick': function (model/*, ev, element*/) {
						$.ajax({
							'url': nodeUrl + 'staging-queue/' + model.id,
							'type': 'DELETE',
							'dataType': 'text',
							'cache': false,
							'headers': { 'Authorization': window.authToken }
						});
					}
				}

			});

		automaticTimer = {

			'enabled': false,
			'interval': 90,
			'timerRender': null,

			'kickFunc': function () {
				var id = this.id;
				window.clearTimeout(this.get('kickTimeout'));
				this.unset('kickTimeout');
				this.unset('kickedAt');

				$.ajax({
					'url': nodeUrl + 'staging-queue/' + id,
					'type': 'DELETE',
					'dataType': 'text',
					'cache': false,
					'headers': { 'Authorization': window.authToken }
				});
			},
			'participantFunc': function (ev) {

				var present = [],
					absent = [],
					model,
					temp = _.chain(ev.participants)
						.pluck('person')
						.pluck('id')
						.value();

				stagingQueue.each(function (model) {

					if (
						automaticTimer.enabled &&
						_.contains(temp, model.id) &&
						!model.has('kickTimeout')
					) {
						console.log('Adding automatic kick to user: ', model.toJSON());
						model.set('kickTimeout', window.setTimeout(_.bind(automaticTimer.kickFunc, model), automaticTimer.interval * 1000));
						model.set('kickedAt', (new Date()).getTime() + (automaticTimer.interval * 1000));
					}

					else if (
						!_.contains(temp, model.id) &&
						model.has('kickTimeout')
					) {
						console.log('Removing automatic kick from user: ', model.toJSON());
						window.clearTimeout(model.get('kickTimeout'));
						model.unset('kickTimeout');
						model.unset('kickedAt');
					}

				});

				if (automaticTimer.enabled && !stagingQueue.some(function (model) { return _.contains(temp, model.id); })) {
					model = stagingQueue.find(function (model) { return model.get('state') !== 2; });
					console.log('No participants in live queue, trying to invite: ', (model ? model.toJSON() : null));
					if (model && (model.get('state') === 0)) {

						$.ajax({
							'url': nodeUrl + 'staging-queue',
							'type': 'PATCH',
							'dataType': 'text',
							'cache': false,
							'headers': { 'Authorization': window.authToken },
							'data': JSON.stringify({'id': model.id, 'state': 1})
						});

					}
				}

			},
			'queueFunc': function () {

				var temp = _.chain(gapi.hangout.getParticipants())
					.pluck('person')
					.pluck('id')
					.value();

				if (automaticTimer.enabled && !stagingQueue.some(function (model) { return _.contains(temp, model.id); })) {
					var model = stagingQueue.find(function (model) { return model.get('state') !== 2; });
					console.log('No participants in live queue, trying to invite: ', (model ? model.toJSON() : null));
					if (model && (model.get('state') === 0)) {

						$.ajax({
							'url': nodeUrl + 'staging-queue',
							'type': 'PATCH',
							'dataType': 'text',
							'cache': false,
							'headers': { 'Authorization': window.authToken },
							'data': JSON.stringify({'id': model.id, 'state': 1})
						});

					}
				}

			},

			'enable': function () {

				var that = this,
					interval = parseInt($('#automatic-cycle input').val(), 10);

				if (!interval) {
					window.alert('Duration for each participant must be a positive number.');
					return false;
				}
				this.enabled = true;
				this.interval = interval;

				// Attach timers to existing participants
				stagingQueue.each(function (model) {
					if (model.get('state') === 2) {
						model.set('kickTimeout', window.setTimeout(_.bind(that.kickFunc, model), interval * 1000));
						model.set('kickedAt', (new Date()).getTime() + (interval * 1000));
					}
				});

				gapi.hangout.onParticipantsChanged.add(this.participantFunc);
				stagingQueue.on('add remove sort reset change sync', this.queueFunc);
				this.queueFunc();

				this.timerRender = window.setInterval(_.bind(participantsView.render, participantsView), 3000);
				participantsView.render();

				return true;

			},
			'disable': function () {

				this.enabled = false;

				window.clearInterval(this.timerRender);
				this.timerRender = null;
				
				gapi.hangout.onParticipantsChanged.remove(this.participantFunc);
				stagingQueue.off('add remove sort reset change sync', this.queueFunc);

				// Remove times from existing participants
				stagingQueue.each(function (model) {
					var timeout;
					if (timeout = model.get('kickTimeout')) {
						window.clearTimeout(timeout);
						model.unset('kickTimeout');
						model.unset('kickedAt');
					}
				});

				participantsView.render();

				return true;

			}
		};

		$('#automatic-cycle button').on('click', function () {

			if (!automaticTimer.enabled) {
				if (automaticTimer.enable()) {
					$('#automatic-cycle input').attr('disabled', 'disabled');
					$(this).html('Disable');
				}
			} else {
				automaticTimer.disable();
				$('#automatic-cycle input').removeAttr('disabled');
				$(this).html('Enable');
			}

		});

		// Connect to the SSE server and set up appropriate modifications to local collections
		new easyXDM.Socket({

			'interval': 1000,
			'local': baseUrl + 'common/scripts/vendor/easyXDM/name.html',
			'swf': baseUrl + 'common/scripts/vendor/easyXDM.swf',
			'swfNoThrottle': true,
			'remote': nodeUrl + 'stream?' + (new Date()).getTime(),
			'onMessage': function (message) {
				try {

					var data = JSON.parse(message),
						ev = data.event.split(':', 2),
						model;

					if (ev[0] === 'stagingQueue') {

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

					}

				} catch (e) { console.log('Error: ', e); }
			}

		});

		// Send Hangout of the staging URL to the server to allow for easy
		// display of invitation links for all the invited audience members.
		// The link is retrieved from Hangouts API then modified to include
		// the staging application ID (for autolaunch).
		var params = {};
		params.mainHangoutLink = (function () {

			var temp, link_parser = document.createElement('a');
			link_parser.href = gapi.hangout.getHangoutUrl();
			temp = link_parser.search.replace(/^\?/, '');
			if (temp.length) {
				temp = temp.split('&');
				temp.push('gid=' + window.hangoutAppId);
				temp = temp.join('&');
			} else {
				temp = 'gid=' + window.hangoutAppId;
			}
			link_parser.search = '?' + temp;
			return link_parser.href;


		}());

		if (!(params.hangoutEmbed = gapi.hangout.onair.getYouTubeLiveId())) {
			delete params.hangoutEmbed;
			gapi.hangout.onair.onYouTubeLiveIdReady.add(function (youTubeLiveId) {
				$.ajax({
					'url': nodeUrl + 'app-options',
					'type': 'POST',
					'dataType': 'text',
					'cache': false,
					'data': {'hangoutEmbed': youTubeLiveId},
					'headers': { 'Authorization': window.authToken }
				});
			});
		}

		// Send Hangout URL to server for for invitations
		$.ajax({
			'url': nodeUrl + 'app-options',
			'type': 'POST',
			'dataType': 'text',
			'cache': false,
			'data': params,
			'headers': { 'Authorization': window.authToken }
		});

		// On people arriving at and leaving from the staging hangout,
		// ensure their status in the audience queue is modified accordingly
		// (change member status index appropriately).
		gapi.hangout.onParticipantsChanged.add(function (ev) {

			var toAdd = [],
				toRemove = [],
				present = _.chain(ev.participants)
					.pluck('person')
					.pluck('id')
					.value();

			toAdd = stagingQueue.filter(function (model) { return (model.get('state') === 1) && _.contains(present, model.id); });
			toRemove = stagingQueue.filter(function (model) { return (model.get('state') === 2) && !_.contains(present, model.id); });

			_.each(toAdd, function (model) {
				$.ajax({
					'url': nodeUrl + 'staging-queue',
					'type': 'PATCH',
					'dataType': 'text',
					'cache': false,
					'headers': { 'Authorization': window.authToken },
					'data': JSON.stringify({'id': model.id, 'state': 2})
				});
			});
			_.each(toRemove, function (model) {
				$.ajax({
					'url': nodeUrl + 'staging-queue',
					'type': 'PATCH',
					'dataType': 'text',
					'cache': false,
					'headers': { 'Authorization': window.authToken },
					'data': JSON.stringify({'id': model.id, 'state': 1})
				});
			});

		});

	});

	$(init); gapi.hangout.onApiReady.add(init);

});