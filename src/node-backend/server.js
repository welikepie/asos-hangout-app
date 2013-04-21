/*jshint plusplus:false */
(function (undefined) {
	"use strict";

	// TEST FOR HARMONY FUNCTIONS
	if (typeof Proxy === 'undefined') {
		console.error("\u001b[31m" + 'Node.js needs to be started with --harmony argument.' + "\u001b[0m");
		process.exit(1);
	}

	var fs = require('fs'),
		http = require('http'),
		url = require('url'),
		_ = require('./vendor/lodash'),
		observed = require('./util/observed-objects'),
		corsHeaders = require('./util/cors');

	var productFeed = observed.observeCollection(),
		productFeedEventHandler = (function () {

			var listeners = [];

			productFeed.addListener('add', function (item) {
				var ev = productFeedEventCache.add('add', JSON.stringify(item)),
					list = listeners.slice(),
					i;

				 console.log('Updating stream for ' + list.length + ' listeners:');
				 console.log(ev);

				for (i = 0; i < list.length; i++) {
					list[i].write(ev);
				}
			});

			return {
				'add': listeners.push.bind(listeners),
				'remove': function (resp) {
					var inx = listeners.indexOf(resp);
					if (inx !== -1) { listeners.splice(inx, 1); }
				}
			};

		}()),
		productFeedEventCache = (function () {

			var container = [],
				counter = 0;

			return {
				'add': function (event, message) {

					var id = counter++,
						content = ['id: ' + id];

					if (event) { content.push('event: ' + event); }
					if (typeof message !== 'string') { message = message.toString(); }
					content.push('data: ' + message);
					content = content.join('\n') + '\n\n';

					container.push(content);
					while (container.length > 30) { container.shift(); }
					return content;

				},
				'getFrom': function (id) {
					return _.last(container, counter - 1 - id);
				}
			};

		}()),
	
		server = http.createServer(function (request, response) {

			var temp, path = url.parse(request.url).pathname;

			// CORS COMPATIBILITY
			// Handling of OPTIONS HTTP method ensures the preflight requests
			// for cross-domain requests are handled in appropriate way.
			if (request.method === 'OPTIONS') {
				response.writeHead(200, corsHeaders(request));
				return response.end();
			}

			// PRODUCT FEED
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
						'Content-Type': 'application/json',
						'Content-Length': temp.length
					}));
					return response.end(temp, 'utf-8');

				}

				// SSE STREAM
				// This handler serves the Server-Sent Events stream to subscribed
				// clients, detailing changes applied to the product feed over time.
				// Maintains connection and sends new content as it comes through.
				// Should the request be a reconnection attempt, it serves the missing
				// events first.
				if (request.method === 'GET' && path === '/product-feed/stream') {

					response.writeHead(200, _.extend(corsHeaders(request), {
						'Content-Type': 'text/event-stream',
						'Cache-Control': 'no-cache',
						'Connection': 'keep-alive'
					}));

					response.write('retry: 10000\n\n');

					if ('last-event-id' in request.headers) {
						response.write(productFeedEventCache.getFrom(parseInt(request.headers['last-event-id'], 10)).join(''));
					} else if ('x-last-event-id' in request.headers) {
						response.write(productFeedEventCache.getFrom(parseInt(request.headers['x-last-event-id'], 10)).join(''));
					}

					productFeedEventHandler.add(response);
					request.on('close', function () {
						console.log('Closing stream connection...');
						productFeedEventHandler.remove(response);
						try { response.end(); } catch (e) {}
					});

					return;

				}

				// OBJECT ADDITION
				//
				if (request.method === 'PUT' && path === '/product-feed') {

					var json = '';
					request.on('data', function (chunk) { json += chunk.toString(); });
					request.on('end', function () {
						try {
							json = JSON.parse(json);
							productFeed.push(json);
							response.writeHead(200, corsHeaders(request));
							response.end();
						} catch (e) {
							response.writeHead(400, corsHeaders(request));
							response.end();
						}
					});

					return;

				}

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
							response.end(content);
						}
					});
				} else {
					response.writeHead(400, corsHeaders(request));
					response.end();
				}
			});

		});

	productFeed.on('add', function (item) { console.log('New product added: ', item); });

	server.on('request', function (request) { console.log(request.method + ' to ' + request.url); });
	server.listen(8888);
	console.log('HTTP Server has been started.');

}());