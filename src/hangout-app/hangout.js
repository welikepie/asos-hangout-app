// Shim for Hangouts API for local usage
(function () {
	"use strict";
	window.gapi = {
		'hangout': {
			'onApiReady': {
				'add': function (func) {
					func();
				}
			}
		}
	};
}());