/*global define:true, require:true, exports: true */
(function (define) {
	"use strict";

	define(function (require) {

		var qs          = require('querystring'),
			_           = require('../vendor/lodash'),
			observed    = require('../util/observed-objects'),
			corsHeaders = require('../util/cors').corsHeaders;

		return {'factory': function (sseManager, authManager) {

			var appOptions = observed.observeModel({
					'twitterSearch': '',
					'hangoutEmbed': '',
					'liveMessage': '',
					'categoryLink': '',
					'currency':'ENG',
					'checkHangoutLink': '',
					'mainHangoutLink': ''
				}),
				appOptionsGet,
				appOptionsChange;

			appOptions.addListener('change', (function () {

				var pendingChanges = {},
					streamChanges = _.debounce(function () {
						var localPending = pendingChanges;
						pendingChanges = {};
						sseManager.emit('appOptions:change', localPending);
					}, 100);

				return function (name, value) {
					pendingChanges[name] = value;
					streamChanges();
				};

			}()));

			appOptionsGet = function (request, response, path, done) {

				response.writeHead(200, _.extend(corsHeaders(request), {'Content-Type': 'application/json'}));
				return response.end(JSON.stringify(appOptions));

			};

			appOptionsChange = function (request, response, path, done) {

				return authManager.apply(request, response, function () {

					var formdata = '';
					request.on('data', function (chunk) {

						formdata += chunk.toString();

						// Break if the request size becomes too big
						if (formdata.length > 16384) {
							response.writeHead(413, corsHeaders(request));
							response.end();
						}

					});
					request.on('end', function () {

						try {
							formdata = _.pick(qs.parse(formdata), _.keys(appOptions));
							_.extend(appOptions, formdata);
							response.writeHead(200, corsHeaders(request));
							response.end();
						} catch (e) {
							try {
								response.writeHead(500, corsHeaders(request));
								response.end();
							} catch (e) { done(); }
						}

					});

				});

			};

			return {
				'collection': appOptions,
				'handlers': {
					'get': appOptionsGet,
					'change': appOptionsChange
				}
			};

		}};

	});

}(
	typeof define === 'function' ? define :
	typeof exports !== 'undefined' ? function (def, undefined) {
		/*jshint strict:false */
		var key, res = def(require, exports, undefined);
		for (key in res) {
			if (res.hasOwnProperty(key)) {
				exports[key] = res[key];
			}
		}
	} : function (def, undefined) {
		/*jshint strict:false */
		var key, res = def(undefined, this, undefined);
		for (key in res) {
			if (res.hasOwnProperty(key)) {
				this[key] = res[key];
			}
		}
	}
));