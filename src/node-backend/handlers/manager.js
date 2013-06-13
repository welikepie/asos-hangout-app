/*jshint plusplus:false */
/*global define:true, require:true, exports: true */
(function (define, undefined) {
	"use strict";

	define(function (require) {

		var fs          = require('fs'),
			url         = require('url'),
			_           = require('../vendor/lodash'),
			Q           = require('../vendor/q'),
			corsHeaders = require('../util/cors').corsHeaders;

		var staticFunc = function (request, response, path, done) {

				// STATIC CONTENT
				// ===============================
				// If no special handlers have been used, path could assume
				// the static content. In such case, serve the file from local drive.
				if (path === '/') { path = '/index.html'; }
				path = './static' + path;

				fs.exists(path, function (exists) {
					if (exists) {
						fs.readFile(path, function (error, content) {
							if (error) {
								response.writeHead(500, corsHeaders(request));
								response.end();
							} else {
								response.writeHead(200, _.extend(corsHeaders(request), { 'Content-Type': 'text/html' }));
								response.end(content.toString());
							}
							done();
						});
					} else {
						response.writeHead(404, corsHeaders(request));
						response.end();
						done();
					}
				});

			};

		var Manager = function () {
			var that = this;
			this._callbacks = {};
			this.callback = function (request, response) {

				// HTTP Method Override (older browsers)
				if ('x-http-method-override' in request.headers) {
					request.method = request.headers['x-http-method-override'].toUpperCase();
				}

				// CORS COMPATIBILITY
				// Handling of OPTIONS HTTP method ensures the preflight requests
				// for cross-domain requests are handled in appropriate way.
				if (request.method === 'OPTIONS') {
					response.writeHead(200, corsHeaders(request));
					return response.end();
				}

				var path = url.parse(request.url).pathname,

					callbacks,
					callbackIndex = -1,
					stopIteration = false,
					doneFunc = function (newpath) {
						if (typeof newpath === 'string') { path = newpath; }
						if (!stopIteration && ++callbackIndex < callbacks.length) {
							process.nextTick(callbacks[callbackIndex]);
						}
					},
					testFunc = function (request, response, prop) {

						var resolvedPath;
						if ((typeof prop.path === 'string') && (prop.path === path)) { resolvedPath = path; }
						else if (_.isRegExp(prop.path)) { resolvedPath = path.match(prop.path); }
						else if (prop.path === null) { resolvedPath = path; }

						if (resolvedPath) {
							prop.callback(request, response, resolvedPath, doneFunc);
						} else {
							doneFunc();
						}

					},
					oldEnd = response.end;

				response.end = function () {
					var result = oldEnd.apply(this, arguments);
					stopIteration = true; doneFunc();
					return result;
				};
				callbacks = _.map((function () {
					var t = _.union(
						_.has(that._callbacks, request.method) ? that._callbacks[request.method] : [],
						_.has(that._callbacks, 'ANY') ? that._callbacks.ANY : []
					);
					t.push({'path': null, 'callback': staticFunc});
					return t;
				}()), function (prop) { return _.bind(testFunc, undefined, request, response, prop); });
				doneFunc();

			};
		};

		_.extend(Manager.prototype, {

			'addHandler': function (method, path, callback) {

				// Parse the request method requirement
				if (typeof method !== 'string') { method = 'ANY'; } else { method = method.toUpperCase(); }
				if ((typeof path !== 'string') && !_.isRegExp(path)) { path = ''; }
				if (typeof callback !== 'function') { throw new Error('Callback needs to be provided'); }

				// Add to list of callbacks
				if (!_.has(this._callbacks, method)) { this._callbacks[method] = []; }
				this._callbacks[method].push({'path': path, 'callback': callback});

			},
			'removeHandler': function (method, path, callback) {

				if (typeof method !== 'string') { method = null; } else { method = method.toUpperCase(); }
				if ((typeof path !== 'string') && !_.isRegExp(path)) { path = null; }
				if (typeof callback !== 'function') { callback = null; }

				var that = this,
					keys = (method === null ? _.keys(this._callbacks) : [method]);

				_.each(keys, function (method) {
					var callbacks = that._callbacks[method],
						toRemove = _.filter(callbacks, function (item) {
							var remove = true;
							if (path !== null) { remove = (item.path.toString() === path.toString()); }
							if (callback !== null) { remove = remove && (callback === path.callback); }
							return remove;
						});
					that._callbacks[method] = _.difference(callbacks, toRemove);
				});

			}

		});

		return {'Manager': Manager};

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