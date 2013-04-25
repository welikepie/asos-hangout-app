require.config({
	"baseUrl": "..",
	"paths": {
		"jquery": "common/scripts/vendor/jquery-1.9.1.min"
	},
	"waitSeconds": 10
});
require(['jquery'], function ($) {
	"use strict";

	var nodeUrlBase = window.location.protocol + '//' + window.location.hostname + ':8888';

	$(function () {

		var embedField = $('#hangoutEmbed input'),
			embedButton = $('#hangoutEmbed  button');

		$.ajax({
			'url': nodeUrlBase + '/app-options',
			'type': 'GET',
			'dataType': 'json',
			'success': function (data) {

				try { embedField.val('http://youtu.be/' + data.hangoutEmbed.match(/^https?:\/\/(?:www\.)?youtube\.com\/embed\/(.+)$/i)[1]); } catch (e) {}
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

			}
		})

	});

});