(function (undefined) {
	"use strict";

	// TEST FOR HARMONY FUNCTIONS
	if (typeof Proxy === 'undefined') {
		console.error("\u001b[31m" + 'Node.js needs to be started with --harmony argument.' + "\u001b[0m");
		process.exit(1);
	}

	var fs = require('fs'),
		http = require('http'),
		path = require('path'),
		url = require('url'),

		_ = require('./vendor/lodash'),
		ntwitter = require('./vendor/ntwitter'),

		observed = require('./util/observed-objects'),
		corsHeaders = require('./util/cors').corsHeaders,
		SSEManager = require('./util/sse-manager').SSEManager,

		// Generic options and settings are collected here.
		appOptions = observed.observeModel({
			'twitterSearch': '',
			'youtubeEmbedId': ''
		}),

		// Product feed collection is established here, along with bindings to pass
		// all change events to SSE manager for inclusion in event stream.
		productFeed = observed.observeCollection(),

		// Public Twitter feed, collection containing all tweets accepted by the
		// admins of the app, over the course of the app operating.
		twitterFeed = observed.observeCollection(),

		// Private Twitter feed, contains all latest tweets.
		// Used in conjunction with Twitter's Streaming API to provide all tweets coming through.
		//allTweets = observed.observeCollection(),

		// SSE managers, one for public feed, one for admin twitter feed
		publicSSE,
		twitterSSE,
		auth;

	// INITIALISE SSE AND AUTH MANAGERS
	publicSSE = new SSEManager(100, 1000, 0);
	twitterSSE = new SSEManager(50, 10, 10);
	auth = require('./vendor/http-auth')({
		'authRealm': 'Admin Area',
		'authFile': path.join(__dirname, '../admin/.htpasswd')
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

		return function (change) {
			_.extend(pendingChanges, change);
			streamChanges();
		};

	}()));

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
			console.log('Options sent');
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
					request.on('data', function (chunk) { json += chunk.toString(); });
					request.on('end', function () {

						try {
							json = JSON.parse(json);
							if (!_.where(productFeed, {'id': json.id}).length) {
								productFeed.push(json);
							}
							response.writeHead(200, corsHeaders(request));
							response.end();
						} catch (e) {
							response.writeHead(400, corsHeaders(request));
							response.end();
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
	productFeed.on('add', function (item) { console.log('New product added: ', item); });
	productFeed.on('remove', function (item) { console.log('Product removed: ', item); });
	server.on('request', function (request) { console.log(request.method + ' to ' + request.url); });

	//setInterval(publicSSE.emit.bind(publicSSE, 'message', 'This is a test message.'), 5000);
	
	server.listen(8888);
	console.log('HTTP Server has been started.');

}());