/*global define:true, require:true, exports: true */
(function (define) {
	"use strict";

	define(function (require) {

		var _           = require('../vendor/lodash'),
			observed    = require('../util/observed-objects'),
			corsHeaders = require('../util/cors').corsHeaders;

		return {'factory': function (sseManager, authManager) {

			var productFeed = observed.observeCollection();
			productFeed.addListener('add', sseManager.emit.bind(sseManager, 'productFeed:add'));
			productFeed.addListener('remove', sseManager.emit.bind(sseManager, 'productFeed:remove'));

			var productFeedGet,
				productFeedAdd,
				productFeedRemove,
				productFeedReset;

			// DEFINE HANDLERS
			productFeedGet = function (request, response) {
				console.log(productFeed);
				response.writeHead(200, _.extend(corsHeaders(request), { 'Content-Type': 'application/json' }));
				response.end(JSON.stringify(productFeed));

			};

			productFeedAdd = function (request, response, path, done) {
				console.log(path);
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
							json.addedAt = (new Date()).getTime();
							//if (!_.where(productFeed, {'id': json.id}).length) {
							productFeed.push(json);
							//}
							console.log("added");
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

			productFeedRemove = function (request, response, path) {
				return authManager.apply(request, response, function () {
					console.log(path);
					var pathSplit = path[1].split("and");
					var index, temp = parseInt(pathSplit[0], 10);
					_.each(productFeed, function (item, inx) {
						if(pathSplit.length == 1){
							if (item.id === temp) {
								index = inx;
								return false;
							}
						}
						else if(pathSplit.length > 1){
							if(item.id === temp && item.addedAt === parseInt(pathSplit[1],10)){
								index = inx;
								return false;
							}
						}
					});

					if (typeof index === 'number') {
						productFeed.splice(index, 1);
						response.writeHead(200, corsHeaders(request));
						response.end();
					} else {
						response.writeHead(404, corsHeaders(request));
						response.end();
					}
					

				});

			};

			productFeedReset = function (request, response) {
				console.log(request);
				return authManager.apply(request, response, function () {

					productFeed.length = 0;
					sseManager.emit('productFeed:reset', []);
					response.writeHead(200, corsHeaders(request));
					response.end();

				});

			};

			return {
				'collection': productFeed,
				'handlers': {
					'get': productFeedGet,
					'add': productFeedAdd,
					'remove': productFeedRemove,
					'reset': productFeedReset
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