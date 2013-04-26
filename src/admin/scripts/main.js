require.config({
	"baseUrl": "..",
	"paths": {
		"jquery": "common/scripts/vendor/jquery-1.9.1.min",
		"underscore": "common/scripts/vendor/underscore"
	},
	"shim": { "underscore": {"exports": "_"} },
	"waitSeconds": 10
});
require(['jquery', 'underscore'], function ($, _) {
	"use strict";

	var nodeUrlBase = window.location.protocol + '//' + window.location.hostname + ':8888';

	$(function () {

		var embedField = $('#hangoutEmbed input'),
			embedButton = $('#hangoutEmbed  button'),

			liveMessage = $('#liveMessage textarea');

		$.ajax({
			'url': nodeUrlBase + '/app-options',
			'type': 'GET',
			'dataType': 'json',
			'success': function (data) {

				try { embedField.val('http://youtu.be/' + data.hangoutEmbed.match(/^https?:\/\/(?:www\.)?youtube\.com\/embed\/(.+)$/i)[1]); } catch (e) {}
				try { liveMessage.val(data.liveMessage); } catch (e) {}

				embedButton.on('click', function () {
					var match = embedField.val().match(/^https?:\/\/youtu\.be\/(.+)$/i);
					if (match) {
						match = 'http://youtube.com/embed/' + match[1];
						$.ajax({
							'url': nodeUrlBase + '/app-options',
							'type': 'POST',
							'dataType': 'text',
							'cache': false,
							'data': {'hangoutEmbed': match},
							'headers': { 'Authorization': window.authToken }
						});
					} else {
						window.alert('Invalid URL');
					}
				});

				liveMessage.on('keypress', _.debounce(function () {
					var props = {
						'url': nodeUrlBase + '/app-options',
						'type': 'POST',
						'dataType': 'text',
						'cache': false,
						'data': {'liveMessage': liveMessage.val()},
						'headers': { 'Authorization': window.authToken }
					};
					console.log('Will send: ', props);
					$.ajax(props);
				}, 2000));

			}
		})

	});

});