(function (undefined) {
	"use strict";

	// TEST FOR HARMONY FUNCTIONS
	if (typeof Proxy === 'undefined') {
		console.error("\u001b[31m" + 'Node.js needs to be started with --harmony argument.' + "\u001b[0m");
		process.exit(1);
	}

	var fs             = require('fs'),
		http           = require('http'),
		path           = require('path'),
		qs             = require('querystring'),
		url            = require('url'),

		_              = require('./vendor/lodash'),

		observed       = require('./util/observed-objects'),
		corsHeaders    = require('./util/cors').corsHeaders,
		SSEManager     = require('./util/sse-manager').SSEManager,
		TwitterMonitor = require('./util/twitter-monitor').TwitterMonitor,

		// Generic options and settings are collected here.
		appOptions = observed.observeModel({
			'twitterSearch': '',
			'hangoutEmbed': '',
			'liveMessage': '',
			'categoryLink': ''
		}),

		// Product feed collection is established here, along with bindings to pass
		// all change events to SSE manager for inclusion in event stream.
		productFeed = observed.observeCollection(),

		// Public Twitter feed, collection containing all tweets accepted by the
		// admins of the app, over the course of the app operating.
		twitterFeed = observed.observeCollection(),

		// SSE managers, one for public feed, one for admin twitter feed
		publicSSE,
		twitterSSE,
		auth,

		// Twitter Monitor object, used to retrieve new tweets in realtime
		// from Twitter's own Streaming API and pass it into the admin stream.
		monitor;

	// INITIALISE SSE AND AUTH MANAGERS
	publicSSE = new SSEManager(100, 100000, 0);
	twitterSSE = new SSEManager(50, 10, 10);
	auth = require('./vendor/http-auth')({
		'authRealm': 'Admin Area',
		'authFile': path.join(__dirname, '../admin/.htpasswd')
	});
	monitor = new TwitterMonitor({
		'consumer_key': 'GaqSf4bbmRP5zO3OqRVGw',
		'consumer_secret': 'NjP1tuOspWi7LpmJduF1x5bOkA1ELdJ8tNGzmrEufU',
		'access_token_key': '69574586-wxQitYCQ0PWOIjYkRTq8yszSd4UR3zBBR9XnmXuqq',
		'access_token_secret': 'ujjFWl0kVrGkv1d88SaxVT5kygovHinutuiVhFONCg'
	});

	// Bind modifications of the product feed collection to public SSE manager
	// (all changes will be automatically sent down the stream)
	productFeed.addListener('add', publicSSE.emit.bind(publicSSE, 'productFeed:add'));
	productFeed.addListener('remove', publicSSE.emit.bind(publicSSE, 'productFeed:remove'));

	// Bind modification of twitter feed to public SSE manager as well.
	twitterFeed.addListener('add', publicSSE.emit.bind(publicSSE, 'twitterFeed:add'));
	twitterFeed.addListener('remove', publicSSE.emit.bind(publicSSE, 'twitterFeed:remove'));

	// Bind any changes applied to application options to appear in public SSE stream as well
	// (debouncing + change collection to have only one event in stream in case of several simultaneous changes)
	appOptions.addListener('change', (function () {

		var pendingChanges = {},
			streamChanges = _.debounce(function () {
				var localPending = pendingChanges;
				pendingChanges = {};
				publicSSE.emit('appOptions:change', localPending);
			}, 100);

		return function (name, value) {
			pendingChanges[name] = value;
			streamChanges();
		};

	}()));

	// Bind the modification of Twitter search terms to
	// restart the monitoring with the new term.
	appOptions.addListener('change', function (name, value) {
		if (name === 'twitterSearch') {
			if (typeof value === 'string' && value.length) {
				monitor.monitor(
					value,
					// Callback to automatically send new tweets down the line
					function (tweet) { twitterSSE.emit('tweet', tweet); }
				);
			} else {
				monitor.close();
			}
		}
	});

	var server = http.createServer(function (request, response) {

		var temp, index, path = url.parse(request.url).pathname;

		// HTTP Method Override (older browsers)
		if ('x-http-method-override' in request.headers) {
			request.method = request.headers['x-http-method-override'];
		}

		// CORS COMPATIBILITY
		// Handling of OPTIONS HTTP method ensures the preflight requests
		// for cross-domain requests are handled in appropriate way.
		if (request.method === 'OPTIONS') {
			response.writeHead(200, corsHeaders(request));
			return response.end();
		}

		// SSE STREAMS
		// ===============================
		// Requests for event streams (along with their XDM pass-throughs)
		// will be listed here.
		if (request.method === 'GET' && path === '/stream') {

			// Treat request as SSE subscription if SSE MIME type
			// is explicitly listed in allowed response types
			if ('accept' in request.headers && request.headers.accept.indexOf('text/event-stream') !== -1) {

				response.writeHead(200, _.extend(corsHeaders(request), {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive',
					'Transfer-Encoding': 'chunked'
				}));
				return publicSSE.addListener(request, response);

			// In other cases, consider the request a standard browser call for pass-through;
			// set the path to one leading to appropriate HTML file in static directory
			} else { path = '/passthrough.html'; }

		} else if (request.method === 'GET' && path === '/twitter-stream') {

			// Treat request as SSE subscription if SSE MIME type
			// is explicitly listed in allowed response types
			if ('accept' in request.headers && request.headers.accept.indexOf('text/event-stream') !== -1) {

				response.writeHead(200, _.extend(corsHeaders(request), {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive',
					'Transfer-Encoding': 'chunked'
				}));
				return twitterSSE.addListener(request, response);

			// In other cases, consider the request a standard browser call for pass-through;
			// set the path to one leading to appropriate HTML file in static directory
			} else { path = '/passthrough.html'; }

		}

		// PRODUCT FEED CONTROLS
		// ===============================
		// Handlers for various actions related to realtime product feed.

			// RETRIEVAL
			// This handler serves the JSON representation of product feed in
			// its current state. Should any client require the base object
			// before subscribing to its update feed, GET request to /product-feed
			// will yield appropriate JSON.
			if (request.method === 'GET' && path === '/product-feed') {

				temp = productFeed.toJSON();

				response.writeHead(200, _.extend(corsHeaders(request), {
					'Content-Type': 'application/json'
				}));
				return response.end(temp);

			}

			// ADDITION
			// This handler takes the JSON object provided in the request and
			// adds it to the product feed collection. That, in turn, triggers
			// appropriate stream events.
			if (request.method === 'POST' && path === '/product-feed') {

				return auth.apply(request, response, function () {

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
							if (!_.where(productFeed, {'id': json.id}).length) {
								productFeed.push(json);
							}
							response.writeHead(200, corsHeaders(request));
							response.end();
						} catch (e) {
							try {
								response.writeHead(400, corsHeaders(request));
								response.end();
							} catch (e2) {}
						}
						request.removeAllListeners();

					});

				});

			}

			// REMOVAL
			// This handler extracts the ID of the product from the URL and,
			// if the product with such ID is within the collection, it will be removed.
			// The rest is a matter of automated entry addition to SSE.
			if (request.method === 'DELETE' && (temp = path.match(/^\/product-feed\/([0-9]+)$/))) {

				return auth.apply(request, response, function () {

					temp = parseInt(temp[1], 10);
					_.each(productFeed, function (item, inx) {
						if (item.id === temp) {
							index = inx;
							return false;
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

			} else if (request.method === 'DELETE' && path === '/product-feed') {

				return auth.apply(request, response, function () {

					productFeed.length = 0;
					publicSSE.emit('productFeed:reset', []);
					response.writeHead(200, corsHeaders(request));
					response.end();

				});

			}

		// TWITTER FEED CONTROLS
		// ===============================
		// Handlers for various actions related to approved tweet feed.

			// RETRIEVAL
			// This handler serves the JSON representation of twitter feed in
			// its current state. Should any client require the base object
			// before subscribing to its update feed, GET request to /twitter-feed
			// will yield appropriate JSON.
			if (request.method === 'GET' && path === '/twitter-feed') {

				temp = twitterFeed.toJSON();

				response.writeHead(200, _.extend(corsHeaders(request), {
					'Content-Type': 'application/json'
				}));
				return response.end(temp);

			}

			// ADDITION
			// This handler takes the JSON object provided in the request and
			// adds it to the twitter feed collection. That, in turn, triggers
			// appropriate stream events.
			if (request.method === 'POST' && path === '/twitter-feed') {

				return auth.apply(request, response, function () {

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
							} catch (e2) {}
						}
						request.removeAllListeners();

					});

				});

			}

			// REMOVAL
			// This handler extracts the ID of the product from the URL and,
			// if the tweet with such ID is within the collection, it will be removed.
			// The rest is a matter of automated entry addition to SSE.
			if (request.method === 'DELETE' && (temp = path.match(/^\/twitter-feed\/([0-9]+)$/))) {

				return auth.apply(request, response, function () {

					temp = temp[1];
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

			}

		// GENERAL OPTIONS CONTROL
		// ===============================
		// These options deal with making changes to general app options, such
		// as global embed ID or search terms for Twitter feed.

			// RETRIEVAL
			// Simply recover the app options data as JSON representation.
			if (request.method === 'GET' && path === '/app-options') {

				temp = appOptions.toJSON();

				response.writeHead(200, _.extend(corsHeaders(request), {
					'Content-Type': 'application/json'
				}));
				return response.end(temp);

			}

			// MODIFICATION
			// POST request in standard form data format.
			// Values will be processed out of the request data and modified.
			// Those modifications will trigger any other changes as needed.
			if (request.method === 'POST' && path === '/app-options') {

				return auth.apply(request, response, function () {

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
							} catch (e) {}
						}

					});

				});

			}

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
						response.writeHead(200, _.extend(corsHeaders(request), {
							'Content-Type': 'text/html'
						}));
						response.end(
							content.toString()
								.replace("/* APP OPTIONS */null", appOptions.toJSON())
								.replace("/* PRODUCT FEED */null", productFeed.toJSON())
								.replace("/* TWITTER FEED */null", twitterFeed.toJSON())
						);
					}
				});
			} else {
				response.writeHead(404, corsHeaders(request));
				response.end();
			}
		});

	});

	// DEBUG
	productFeed.on('add', function (item) { console.log('New product added.'); });
	productFeed.on('remove', function (item) { console.log('Product removed.'); });
	server.on('request', function (request) { console.log(request.method + ' to ' + request.url); });
	
	server.listen(8888);
	console.log('HTTP Server has been started.');

}());