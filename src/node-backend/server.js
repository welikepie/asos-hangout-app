(function (undefined) {
	"use strict";

	// TEST FOR HARMONY FUNCTIONS
	if (typeof Proxy === 'undefined') {
		console.error("\u001b[31m" + 'Node.js needs to be started with --harmony argument.' + "\u001b[0m");
		process.exit(1);
	}

	var fs          = require('fs'),
		http        = require('http'),
		path        = require('path'),
		_           = require('./vendor/lodash'),
		corsHeaders = require('./util/cors').corsHeaders,
		SSEManager  = require('./util/sse-manager').SSEManager,

		productFeed,
		twitterFeed,
		appOptions,

		publicSSE = new SSEManager(100, 100000, 0),
		twitterSSE = new SSEManager(50, 10, 10),
		requestManager = new (require('./handlers/manager').Manager)(),
		auth = require('./vendor/http-auth')({
			'authRealm': 'Admin Area',
			'authFile': path.join(__dirname, '../admin/.htpasswd')
		}),
		monitor = new (require('./util/twitter-monitor').TwitterMonitor)({
			'consumer_key': 'GaqSf4bbmRP5zO3OqRVGw',
			'consumer_secret': 'NjP1tuOspWi7LpmJduF1x5bOkA1ELdJ8tNGzmrEufU',
			'access_token_key': '69574586-wxQitYCQ0PWOIjYkRTq8yszSd4UR3zBBR9XnmXuqq',
			'access_token_secret': 'ujjFWl0kVrGkv1d88SaxVT5kygovHinutuiVhFONCg'
		}),

		queueFactory = require('./handlers/user-queue').factory,
		audienceQueue = queueFactory('audienceQueue', publicSSE, auth),
		stagingQueue = queueFactory('stagingQueue', publicSSE, auth);

	productFeed = require('./handlers/product-feed').factory(publicSSE, auth);
	twitterFeed = require('./handlers/twitter-feed').factory(publicSSE, auth);
	appOptions = require('./handlers/app-options').factory(publicSSE, auth);
	appOptions.collection.addListener('change', function (name, value) {
		if (name === 'twitterSearch') {
			if (typeof value === 'string' && value.length) {
				monitor.monitor(
					value,
					// Callback to automatically send new tweets down the line
					function (tweet) { twitterSSE.emit('tweet', tweet); }
				);
			} else { monitor.close(); }
		}
	});

	// Set up SSE stream handlers
	requestManager.addHandler('GET', '/stream', function (request, response, path, done) {

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
		} else { done('/passthrough.html'); }

	});
	requestManager.addHandler('GET', '/twitter-stream', function (request, response, path, done) {

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
		} else { done('/passthrough.html'); }

	});
	// Passthrough Handling
	requestManager.addHandler('ANY', '/passthrough.html', function (request, response, path, done) {
		fs.exists('./static/passthrough.html', function (exists) {
			if (exists) {
				fs.readFile('./static/passthrough.html', function (error, content) {
					if (error) {
						response.writeHead(500, corsHeaders(request));
						response.end();
					} else {
						response.writeHead(200, _.extend(corsHeaders(request), {
							'Content-Type': 'text/html'
						}));
						response.end(
							content.toString()
								.replace("/* APP OPTIONS */null", JSON.stringify(appOptions.collection))
								.replace("/* PRODUCT FEED */null", JSON.stringify(productFeed.collection))
								.replace("/* TWITTER FEED */null", JSON.stringify(twitterFeed.collection))
								.replace("/* AUDIENCE QUEUE */null", JSON.stringify(audienceQueue.collection))
								.replace("/* STAGING QUEUE */null", JSON.stringify(stagingQueue.collection))
						);
					}
				});
			} else { done(); }
		});

	});

	requestManager.addHandler('DELETE', '/reset', function (request, response) {
		return auth.apply(request, response, function () {

			try {

				publicSSE.reset();
				twitterSSE.reset();

				_.extend(appOptions.collection, {
					'twitterSearch': '',
					'hangoutEmbed': '',
					'liveMessage': '',
					'categoryLink': '',

					'checkHangoutLink': '',
					'mainHangoutLink': ''
				});
				productFeed.collection.length = 0;
				twitterFeed.collection.length = 0;
				audienceQueue.collection.length = 0;
				stagingQueue.collection.length = 0;

				response.writeHead(200, corsHeaders(request));
				response.end();
			} catch (e) {
				response.writeHead(500, corsHeaders(request));
				response.end(e.message);
			}

		});
	});

	// Product Feed Controls
	requestManager.addHandler('GET', '/product-feed', productFeed.handlers.get);
	requestManager.addHandler('POST', '/product-feed', productFeed.handlers.add);
	requestManager.addHandler('DELETE', /^\/product-feed\/([0-9]+)$/, productFeed.handlers.remove);
	requestManager.addHandler('DELETE', '/product-feed', productFeed.handlers.reset);

	// Twitter Feed Controls
	requestManager.addHandler('GET', '/twitter-feed', twitterFeed.handlers.get);
	requestManager.addHandler('POST', '/twitter-feed', twitterFeed.handlers.add);
	requestManager.addHandler('DELETE', /^\/twitter-feed\/([0-9]+)$/, twitterFeed.handlers.remove);
	requestManager.addHandler('DELETE', '/twitter-feed', twitterFeed.handlers.reset);

	// App Option Controls
	requestManager.addHandler('GET', '/app-options', appOptions.handlers.get);
	requestManager.addHandler('POST', '/app-options', appOptions.handlers.change);

	// Queue functionality
	requestManager.addHandler('GET', '/audience-queue', audienceQueue.handlers.get);
	requestManager.addHandler('GET', /^\/audience-queue\/([0-9a-zA-Z]+)$/, audienceQueue.handlers.present);
	requestManager.addHandler('POST', '/audience-queue', audienceQueue.handlers.add);
	requestManager.addHandler('PATCH', '/audience-queue', audienceQueue.handlers.change);
	requestManager.addHandler('DELETE', /^\/audience-queue\/([0-9a-zA-Z]+)$/, audienceQueue.handlers.remove);
	requestManager.addHandler('DELETE', '/audience-queue', audienceQueue.handlers.reset);

	// Queue functionality
	requestManager.addHandler('GET', '/staging-queue', stagingQueue.handlers.get);
	requestManager.addHandler('GET', /^\/staging-queue\/([0-9a-zA-Z]+)$/, stagingQueue.handlers.present);
	requestManager.addHandler('POST', '/staging-queue', stagingQueue.handlers.add);
	requestManager.addHandler('PATCH', '/staging-queue', stagingQueue.handlers.change);
	requestManager.addHandler('DELETE', /^\/staging-queue\/([0-9a-zA-Z]+)$/, stagingQueue.handlers.remove);
	requestManager.addHandler('DELETE', '/staging-queue', stagingQueue.handlers.reset);

	var server = http.createServer(requestManager.callback);
	productFeed.collection.on('add', function (item) { console.log('New product added.'); });
	productFeed.collection.on('remove', function (item) { console.log('Product removed.'); });
	server.on('request', function (request) { console.log(request.method + ' to ' + request.url);
	if(request.method.indexOf("OPTIONS") > -1){
		console.log(request);
	}
	
	 });
	
	server.listen(8889);
	console.log('HTTP Server has been started.');

}());