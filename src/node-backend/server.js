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
		corsHeaders = require('./util/cors').corsHeaders;

	/**
	Event and listener manager for efficiently handling Server-Sent Events stream.
	With the help of this manager, subscribing connections to the event stream becomes
	the matter of calling a single function on the request and response objects.

	Any events emitted on the manager are broadcast to all listeners and stored in
	event history - it is from that history that older entries will be served to clients
	that attempt reconnection to the server.

	Manager additionally controls the number of listeners, automatically closing the oldest
	connections when the new ones cause the total to go above the limit. With SSE's reconnection
	behaviour, it essentially converts the traffic from streaming into slow polling until the
	number of concurrent connections drops.

	@class SSEManager

	@static
	@public
	**/
	var SSEManager = (function () {

		var events = [],
			event_limit = 100,
			event_counter = 1,

			emit,
			getFromId,
			pushToStream,

			listeners = [],
			listeners_limit = 2000,

			addListener,
			removeListener;

		/**
		Method used to broadcast the event to all listeners of the stream.
		Given event name and its payload, it is converted into entry in SSE stream format
		(payload is stringified into JSON representation) and written to all open connections,
		as well as added to the history for further reference.

		@method emit
		@param {string}  event    Event name.
		@param {any}     payload  Arbitrary data related to the event.

		@static
		@public
		**/
		emit = function emit (event, payload) {

			// Update the ID counter and generate the event
			var id = event_counter++,
				content = 'id: ' + id + '\ndata: ' + JSON.stringify({'event': event, 'payload': payload}) + '\n\n';

			console.log('Emitting event\n\n' + content);

			// Add event to the history, trim the history and, finally, push the event to stream
			events.push(content);
			console.log('Event log length: ', events.length + '(' + Math.max(0, events.length - event_limit) + ' over limit)');
			while (events.length > event_limit) { events.shift(); }
			pushToStream(content);

		};

		/**
		Shortcut method for getting the events between given ID and thelast emitted one.
		Used when adding reconnected listeners to the stream.

		@param  {integer}  id  Last observed event's ID.
		@return {string[]}     All entries in event history from given ID.

		@static
		@private
		**/
		getFromId = function getFromId (id) {
			return _.last(events, event_counter - id);
		};

		/**
		Given the fragment of the SSE stream, method writes it to all open connections.
		Should any connections turn out to be closed or faulty, they are automatically
		removed from listeners' list.

		@param {string}  content  Latest event in SSE stream format.

		@static
		@private
		**/
		pushToStream = function pushToStream (content) {
			var i, list = listeners.slice();
			console.log('Event streamed to ', list.length, ' listeners.');
			for (i = 0; i < list.length; i++) {
				try { list[i].res.write(content); }
				catch (e) {
					console.exception('Error encountered while streaming:');
					removeListener(list[i]);
				}
			}
		};

		/**
		Given request and response objects, method adds the connection to listeners' list,
		keeping the connection alive and thus, sending any events to that client.

		Event catchup is taken care of automatically, provided the request comes with appropriate headers.
		Should connection be closed on client's side, the listener will be automatically removed from listeners' list.

		@method add
		@param  {object}  request   Request object, obtained from HTTP server's callback.
		@param  {object}  response  Response object, obtained from HTTP server's callback.
		@return {object}            Identification object, used to remove the listener later on.

		@static
		@public
		**/
		addListener = function addListener (request, response) {

			// Object containing these created early,
			// will be used as identifier for === comparison
			var ident = {'req': request, 'res': response};

			console.log('Adding new listener...');

			// Presence of Last-Event-ID header indicates this client is reconnecting -
			// if there are any events left in the history, they should be provided as catchup.
			if ('last-event-id' in request.headers) {
				response.write(getFromId(parseInt(request.headers['last-event-id'], 10)).join(''));
			} else if ('x-last-event-id' in request.headers) {
				response.write(getFromId(parseInt(request.headers['x-last-event-id'], 10)).join(''));
			}

			// Add the listener to the listeners' list and ensure it will
			// be removed in the event on connection closing client-side
			request.on('close', removeListener.bind(this, ident));
			listeners.push(ident);

			// Too many listeners? Trim the numbers by closing oldest connections
			console.log('Listeners count: ', listeners.length + '(' + Math.max(0, listeners.length - listeners_limit) + ' over limit)');
			while (listeners.length > listeners_limit) {
				removeListener(listeners.shift());
			}

		};

		/**
		Given the identification object, removes the connection from the listeners' list,
		removes any bound events and closes the connection. Used either when request is closed
		client-side or when the number of listeners goes over the limit.

		@method removeListener
		@param  {object}  ident  Identification object received from `add`.

		@static
		@private
		**/
		removeListener = function removeListener (ident) {

			console.log('Removing listener...');

			var inx = listeners.indexOf(ident);
			if (inx !== -1) { listeners.splice(inx, 1); }

			ident.req.removeAllListeners();
			ident.res.removeAllListeners();
			try { ident.res.end(); } catch (e) {}

		};

		return {
			'emit': emit,
			'add': addListener
		};

	}());

	// Product feed collection is established here, along with bindings to pass
	// all change events to SSE manager for inclusion in event stream.
	var productFeed = observed.observeCollection();
	productFeed.addListener('add', SSEManager.emit.bind(SSEManager, 'productFeed:add'));
	productFeed.addListener('remove', SSEManager.emit.bind(SSEManager, 'productFeed:remove'));

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

		// SSE STREAM
		// ===============================
		// Requests for SSE stream are handled by the SSE manager.
		// The code below serves to register newly created connection as
		// new listener.
		if (request.method === 'GET' && path === '/stream') {

			response.writeHead(200, _.extend(corsHeaders(request), {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive'
			}));

			response.write('retry: 10000\n\n');
			return SSEManager.add(request, response);

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
					'Content-Type': 'application/json'
				}));
				return response.end(temp, 'utf-8');

			}

			// ADDITION
			// This handler takes the JSON object provided in the request and
			// adds it to the product feed collection. That, in turn, triggers
			// appropriate stream events.
			if (request.method === 'POST' && path === '/product-feed') {

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
					request.removeAllListeners();
				});

				return;

			}

			// REMOVAL
			// This handler extracts the ID of the product from the URL and,
			// if the product with such ID is within the collection, it will be removed.
			// The rest is a matter of automated entry addition to SSE.
			if (request.method === 'DELETE' && (temp = path.match(/^\/product-feed\/([0-9]+)$/))) {

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

				return;

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
									.replace("/* PRODUCT FEED */null", productFeed.toJSON())
							);
						}
					});
				} else {
					response.writeHead(400, corsHeaders(request));
					response.end();
				}
			});

		});

	// DEBUG
	productFeed.on('add', function (item) { console.log('New product added: ', item); });
	productFeed.on('remove', function (item) { console.log('Product removed: ', item); });
	server.on('request', function (request) { console.log(request.method + ' to ' + request.url); });
	
	server.listen(8888);
	console.log('HTTP Server has been started.');

}());