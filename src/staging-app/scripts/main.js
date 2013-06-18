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
	'common/scripts/data/member', 'common/scripts/ui/collection-view'
], function ($, _, Backbone, easyXDM, Members, CollectionView) {
	"use strict";

	var stagingQueue = new Members.MemberCollection(),
		audienceQueue = new Members.MemberCollection();

	var init = _.after(2, function () { try {

		var baseUrl = $('base').eq(0).attr('data-base-url'),
			nodeUrl = $('base').eq(0).attr('data-node-url'),
			localID = gapi.hangout.getLocalParticipant().person.id;

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
							audienceQueue.reset(data.payload);
						} else if (ev[1] === 'add') {
							if (!audienceQueue.get(data.payload.id)) { audienceQueue.add(data.payload); }
						} else if (ev[1] === 'remove') {
							model = audienceQueue.get(data.payload.id);
							if (model) { audienceQueue.remove(model); }
						} else if (ev[1] === 'change') {
							audienceQueue.set([data.payload], {'add': false, 'remove': false, 'merge': true});
						}

					}

					else if (ev[0] === 'stagingQueue') {

						if (ev[1] === 'reset') {
							stagingQueue.reset(data.payload);
						} else if (ev[1] === 'add') {
							if (!stagingQueue.get(data.payload.id)) { stagingQueue.add(data.payload); }
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

		// Send Hangout URL to server for for invitations
		$.ajax({
			'url': nodeUrl + 'app-options',
			'type': 'POST',
			'dataType': 'text',
			'cache': false,
			'data': {'checkHangoutLink': gapi.hangout.getHangoutUrl()},
			'headers': { 'Authorization': window.authToken }
		});

		var kickTimeout = null,
			updateState = function () {

				var temp, state = 'rejected';
				temp = audienceQueue.get(localID);
				if (temp && (temp.get('state') !== 0)) {
					state = 'check';
				} else {
					temp = stagingQueue.get(localID);
					if (temp) {
						state = (temp.get('state') === 0) ?
							'accepted' :
							'invited';
					}
				}

				console.log('Current state is: ', state);

				if (kickTimeout) { window.clearTimeout(kickTimeout); }
				switch (state) {
					case 'check':
						$('.accepted, .rejected, .invite').hide();
						$('.check').show();
						break;
					case 'accepted':
						$('.check, .rejected, .invite').hide();
						$('.accepted').show();
						break;
					case 'invited':
						$('.check, .rejected').hide();
						$('.accepted, .invite').show();
						break;
					case 'rejected':
						$('.check, .accepted, .invite').hide();
						$('.rejected').show();
						kickTimeout = window.setTimeout(function () {

							window.top.close();
							window.top.location.href = (baseUrl + '/landing-page').replace('//', '/');

						}, 5000);
						break;
				}

			};

		audienceQueue.on('all', updateState);
		stagingQueue.on('all', updateState);

	} catch (e) { console.log('Error: ', e); } });

	$(function () {
		console.log('Running from jQuery.');
		init();
	});
	gapi.hangout.onApiReady.add(function () {
		console.log('Running from GAPI.');
		init();
	});

});