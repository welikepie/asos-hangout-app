// CORS COMPATIBILITY
// Following bits of code ensure the event stream is CORS-enabled.
// Appropriate CORS headers are generated, based on where the request
// is coming from, via the helper method. This method is used for
// all requests, including one with OPTIONS method - CORS preflight.

(function (define) {
	"use strict";

	define(function (require, exports, module) {

		var _ = require('../vendor/lodash'),
			corsMethods = ['GET', 'POST', 'OPTIONS'],
			corsHeaders = function corsHeaders (request) {

				request = request || {'headers': {}, 'method': 'GET'};

				var temp,
					headers = {
						'Access-Control-Allow-Origin': ('origin' in request.headers ? request.headers.origin : '*'),
						'Access-Control-Allow-Credentials': 'true'
					};

				temp = corsMethods.slice();
				if (!_.contains(temp, request.method)) { temp.push(request.method); }
				if (
					('access-control-request-method' in request.headers) &&
					(temp.indexOf(request.headers['access-control-request-method']) === -1)
				) { temp.push(request.headers['access-control-request-method']); }
				headers['Access-Control-Allow-Methods'] = temp.join(', ');

				if ('access-control-request-headers' in request.headers) {
					headers['Access-Control-Allow-Headers'] = request.headers['access-control-request-headers'];
				}

				return headers;

			};

		return corsHeaders;

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