/*jshint devel:true */
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

	var stagingQueue = new Members.MemberCollection(),
		audienceQueue = new Members.MemberCollection();

	audienceQueue.comparator = stagingQueue.comparator = function (a, b) {
		return (a.get('joined') || (new Date()).getTime()) - (b.get('joined') || (new Date()).getTime());
	};

	var init = _.after(2, function () {

		var baseUrl = $('base').eq(0).attr('data-base-url'),
			nodeUrl = $('base').eq(0).attr('data-node-url'),

			stagingQueueView = new CollectionView({

				'collection': stagingQueue,
				'el': $('#staging-queue ul').get(0),
				'template': $('#staging-queue ul > li.template').remove().removeClass('template'),

				'populate': function (model, element) {
					$(element)
						.find('a').attr('href', model.get('url')).end()
						.find('img').attr('src', model.get('avatar')).end()
						.find('h2').html(model.get('name')).end();
				}

			}),

			audienceQueueView = new CollectionView({

				'collection': audienceQueue,
				'el': $('#audience-queue ul').get(0),
				'template': $('#audience-queue ul > li.template').remove().removeClass('template'),

				'populate': function (model, element) {

					var state = model.get('state'),
						el = $(element)
							.find('a').attr('href', model.get('url')).end()
							.find('img').attr('src', model.get('avatar')).end()
							.find('h2').html(model.get('name')).end();

					switch (state) {
						case 0:
							el.find('button.accept, button.reject').hide();
							break;
						case 1:
							el.find('button.accept, button.reject').hide();
							el.find('button.invite').attr('disabled', 'disabled');
							break;
						case 2:
							el.find('button.invite').hide();
							break;
					}

				},

				'itemEvents': {
					'click button.invite': function (model/*, ev, element*/) {

						$.ajax({
							'url': nodeUrl + 'audience-queue',
							'type': 'PATCH',
							'dataType': 'text',
							'cache': false,
							'headers': { 'Authorization': window.authToken },
							'data': JSON.stringify({'id': model.id, 'state': 1})
						});

					},
					'click button.accept': function (model/*, ev, element*/) {

						var temp = model.toJSON();
						delete temp.addedAt;
						delete temp.joined;
						temp.state = 0;

						$.ajax({
							'url': nodeUrl + 'staging-queue',
							'type': 'POST',
							'dataType': 'text',
							'cache': false,
							'data': JSON.stringify(temp),
							'header': { 'Authorization': window.authToken },
							'success': function () {

								console.log('Finished adding person to staging queue.');
								$.ajax({
									'url': nodeUrl + 'audience-queue/' + model.id,
									'type': 'DELETE',
									'dataType': 'text',
									'cache': false,
									'headers': { 'Authorization': window.authToken },
									'success': function () {
										console.log('Finished removing the person from audience queue.');
									}
								});

							}
						});


					},
					'click button.reject': function (model/*, ev, element*/) {
						$.ajax({
							'url': nodeUrl + 'audience-queue/' + model.id,
							'type': 'DELETE',
							'dataType': 'text',
							'cache': false,
							'headers': { 'Authorization': window.authToken }
						});
					}
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

					if (ev[0] === 'audienceQueue') {

						if (ev[1] === 'reset') {
							audienceQueue.reset(data.payload, {'parse': true, 'validate': true});
						} else if (ev[1] === 'add') {
							if (!audienceQueue.get(data.payload.id)) { audienceQueue.add(data.payload, {'parse': true, 'validate': true}); }
						} else if (ev[1] === 'remove') {
							model = audienceQueue.get(data.payload.id);
							if (model) { audienceQueue.remove(model); }
						} else if (ev[1] === 'change') {
							audienceQueue.set([data.payload], {'add': false, 'remove': false, 'merge': true});
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

					}

				} catch (e) { console.log('Error: ', e); }
			}

		});

		// Send Hangout of the staging URL to the server to allow for easy
		// display of invitation links for all the invited audience members.
		// The link is retrieved from Hangouts API then modified to include
		// the staging application ID (for autolaunch).
		var link_parser = document.createElement('a');
		link_parser.href = gapi.hangout.getHangoutUrl();
		link_parser.search = (function () {
			var temp = link_parser.search.replace(/^\?/, '');
			if (temp.length) {
				temp = temp.split('&');
				temp.push('gid=' + window.stagingAppId);
				temp = temp.join('&');
			} else {
				temp = 'gid=' + window.stagingAppId;
			}
			return '?' + temp;
		}());

		// Send Hangout URL to server for for invitations
		$.ajax({
			'url': nodeUrl + 'app-options',
			'type': 'POST',
			'dataType': 'text',
			'cache': false,
			'data': {'checkHangoutLink': link_parser.href},
			'headers': { 'Authorization': window.authToken }
		}); link_parser = null;

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

			toAdd = audienceQueue.filter(function (model) { return (model.get('state') === 1) && _.contains(present, model.id); });
			toRemove = audienceQueue.filter(function (model) { return (model.get('state') === 2) && !_.contains(present, model.id); });

			_.each(toAdd, function (model) {
				$.ajax({
					'url': nodeUrl + 'audience-queue',
					'type': 'PATCH',
					'dataType': 'text',
					'cache': false,
					'headers': { 'Authorization': window.authToken },
					'data': JSON.stringify({'id': model.id, 'state': 2})
				});
			});
			_.each(toRemove, function (model) {
				$.ajax({
					'url': nodeUrl + 'audience-queue',
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