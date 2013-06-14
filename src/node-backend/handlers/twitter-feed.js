/*global define:true, require:true, exports: true */
(function (define) {
	"use strict";

	define(function (require) {

		var _           = require('../vendor/lodash'),
			observed    = require('../util/observed-objects'),
			corsHeaders = require('../util/cors').corsHeaders;

		return {'factory': function (sseManager, authManager) {

			var twitterFeed = observed.observeCollection();
			twitterFeed.addListener('add', sseManager.emit.bind(sseManager, 'twitterFeed:add'));
			twitterFeed.addListener('remove', sseManager.emit.bind(sseManager, 'twitterFeed:remove'));

			var twitterFeedGet,
				twitterFeedAdd,
				twitterFeedRemove;

			twitterFeedGet = function (request, response) {

				response.writeHead(200, _.extend(corsHeaders(request), { 'Content-Type': 'application/json' }));
				response.end(JSON.stringify(twitterFeed));

			};

			twitterFeedAdd = function (request, response, path, done) {

				return authManager.apply(request, response, function () {

					var json = '';
					request.on('data', function (chunk) {

						json += chunk.toString();

						// Break if the request size becomes too big
						if (json.length > 16384) {
							response.writeHead(413, corsHeaders(request));
							response.end();
						}

					});
					request.on('end', function () {

						try {
							json = JSON.parse(json);
							if (!_.where(twitterFeed, {'id': json.id}).length) {
								twitterFeed.push(json);
							}
							response.writeHead(200, corsHeaders(request));
							response.end();
						} catch (e) {
							try {
								response.writeHead(400, corsHeaders(request));
								response.end();
							} catch (e2) { done(); }
						}
						request.removeAllListeners();

					});

				});

			};

			twitterFeedRemove = function (request, response, path) {

				return authManager.apply(request, response, function () {

					var index, temp = path[1];
					_.each(twitterFeed, function (item, inx) {
						if (item.id === temp) {
							index = inx;
							return false;
						}
					});

					if (typeof index === 'number') {
						twitterFeed.splice(index, 1);
						response.writeHead(200, corsHeaders(request));
						response.end();
					} else {
						response.writeHead(404, corsHeaders(request));
						response.end();
					}

				});

			};

			return {
				'collection': twitterFeed,
				'handlers': {
					'get': twitterFeedGet,
					'add': twitterFeedAdd,
					'remove': twitterFeedRemove
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