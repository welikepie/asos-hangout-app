(function (undefined) {
	"use strict";

	// TEST FOR HARMONY FUNCTIONS
	if (typeof Proxy === 'undefined') {
		console.error("\u001b[31m" + 'Node.js needs to be started with --harmony argument.' + "\u001b[0m");
		process.exit(1);
	}

	var http = require('http'),
		url = require('url'),

		observed = require('./util/observed-objects');

	var productFeed = observed.observeCollection(),
		server = http.createServer(function (request, response) {

			var temp,
				path = url.parse(request.url).pathname;

			// CORS compatibility
			if (request.method === 'OPTIONS') {
				response.writeHead(200, {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
				});
				response.end();
			}

			// GET STATE OF PRODUCT FEED
			else if (request.method === 'GET' && path === '/product-feed') {
				temp = productFeed.toJSON();
				response.writeHead(200, {
					'Content-Type': 'application/json',
					'Content-Length': temp.length,
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
				});
				response.end(temp);
			}

			// ADD NEW PRODUCT TO PRODUCT FEED
			else if (request.method === 'PUT' && path === '/product-feed') {

				var json = '';
				request.on('data', function (chunk) { json += chunk.toString(); });
				request.on('end', function () {
					try {
						json = JSON.parse(json);
						productFeed.push(json);
						response.writeHead(200, {
							'Access-Control-Allow-Origin': '*',
							'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
						});
						response.end();
					} catch (e) {
						response.writeHead(400, {
							'Access-Control-Allow-Origin': '*',
							'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
						});
						response.end();
					}
				});

			}

		});

	productFeed.on('add', function (item) { console.log('New product added: ', item); });

	server.listen(8888);
	console.log('HTTP Server has been started.');

}());