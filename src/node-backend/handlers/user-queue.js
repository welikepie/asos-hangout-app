/*global define:true, require:true, exports: true */
(function (define) {
	"use strict";

	var _           = require('../vendor/lodash'),
		observed    = require('../util/observed-objects'),
		corsHeaders = require('../util/cors').corsHeaders;

	define(function () {

		return {'factory': function (queueName, sseManager) {

			var userQueue = observed.observeCollection();
			userQueue.addListener('add', sseManager.emit.bind(sseManager, queueName + ':add'));
			userQueue.addListener('remove', sseManager.emit.bind(sseManager, queueName + ':remove'));

			var userQueueGet,
				userQueueAdd,
				userQueueChange,
				userQueueRemove,
				userQueuePresent,
				setChangeListener = function (item) {

					var pendingChanges = {'id': item.id},
						streamChanges = _.debounce(function () {
							var localPending = pendingChanges;
							pendingChanges = {'id': item.id};
							sseManager.emit(queueName + ':change', localPending);
						}, 100);

					item.addListener('change', function (name, value) {
						pendingChanges[name] = value;
						streamChanges();
					});

				};

			userQueueGet = function (request, response) {

				response.writeHead(200, _.extend(corsHeaders(request), { 'Content-Type': 'application/json' }));
				response.end(JSON.stringify(_.map(userQueue, function (item) { return JSON.parse(item.toJSON()); })));

			};

			userQueueAdd = function (request, response, path, done) {

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

					var temp;

					try {
						json = JSON.parse(json);
						json.joined = (new Date()).getTime();

						if (!_.where(userQueue, {'id': json.id}).length) {

							temp = observed.observeModel();
							_.extend(temp, json);
							setChangeListener(temp);

							userQueue.push(temp);
							response.writeHead(200, corsHeaders(request));
							response.end();

						} else {
							response.writeHead(403, corsHeaders(request));
							response.end();
						}
					} catch (e) {
						try {
							response.writeHead(400, corsHeaders(request));
							response.end();
						} catch (e2) { done(); }
					}
					request.removeAllListeners();

				});

			};

			userQueueChange = function (request, response, path, done) {

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

					var index, temp;
					try {

						json = JSON.parse(json);
						_.each(userQueue, function (item, inx) {
							if (item.id === json.id) {
								index = inx;
								return false;
							}
						});

						if (typeof index === 'number') {
							temp = userQueue[index];
							_.extend(temp, _.omit(json, 'id'));
							response.writeHead(200, corsHeaders(request));
							response.end();
						} else {
							response.writeHead(404, corsHeaders(request));
							response.end();
						}

					} catch (e) {
						try {
							response.writeHead(400, corsHeaders(request));
							response.end();
						} catch (e2) { done(); }
					}

				});

			};

			userQueueRemove = function (request, response, path) {

				var index, temp = path[1];
				_.each(userQueue, function (item, inx) {
					if (item.id === temp) {
						index = inx;
						return false;
					}
				});

				if (typeof index === 'number') {
					userQueue[index].removeAllListeners();
					userQueue.splice(index, 1);
					response.writeHead(200, corsHeaders(request));
					response.end();
				} else {
					response.writeHead(404, corsHeaders(request));
					response.end();
				}

			};

			userQueuePresent = function (request, response, path) {

				var index, temp = path[1];
				_.each(userQueue, function (item, inx) {
					if (item.id === temp) {
						index = inx;
						return false;
					}
				});

				response.writeHead(200, _.extend(corsHeaders(request), { 'Content-Type': 'application/json' }));
				response.end(JSON.stringify(index !== -1));

			};

			return {
				'collection': userQueue,
				'handlers': {
					'get': userQueueGet,
					'add': userQueueAdd,
					'change': userQueueChange,
					'remove': userQueueRemove,
					'present': userQueuePresent
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