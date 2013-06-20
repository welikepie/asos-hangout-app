/*jshint plusplus:false */
(function (define) {
	"use strict";

	define(function (require, exports, module) {

		var _ = require('../vendor/lodash'),
			SSEManager;

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
		SSEManager = function (event_limit, listener_limit, guaranteed_backlog) {

			var event_counter = 1;

			this._events = [];
			this.event_limit = event_limit;
			this._listeners = [];
			this.listeners_limit = listener_limit;
			this.guaranteed_backlog = guaranteed_backlog || 0;

			this.getID = function (peek) {
				if (peek) { return event_counter; }
				else { return event_counter++; }
			};

		};

		_.extend(SSEManager.prototype, {

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
			'emit': function emit (event, payload) {

				// Update the ID counter and generate the event
				var id = this.getID(),
					content = 'id: ' + id + '\ndata: ' + JSON.stringify({'event': event, 'payload': payload}) + '\n\n';

				console.log('Emitting event\n\n' + content);

				// Add event to the history, trim the history and, finally, push the event to stream
				this._events.push(content);
				console.log('Event log length: ', this._events.length + '(' + Math.max(0, this._events.length - this.event_limit) + ' over limit)');
				while (this._events.length > this.event_limit) { this._events.shift(); }
				this.pushToStream(content);

			},

			/**
			Given the fragment of the SSE stream, method writes it to all open connections.
			Should any connections turn out to be closed or faulty, they are automatically
			removed from listeners' list.

			@param {string}  content  Latest event in SSE stream format.

			@static
			@private
			**/
			'pushToStream': function pushToStream (content) {
				var i, list = this._listeners.slice();
				console.log('Event streamed to ', list.length, ' listeners.');
				for (i = 0; i < list.length; i++) {
					try {
						list[i].res.write(content);
						if (list[i].xhr) { this.removeListener(list[i]); }
					} catch (e) {
						console.exception('Error encountered while streaming:');
						this.removeListener(list[i]);
					}
				}
			},

			/**
			Shortcut method for getting the events between given ID and thelast emitted one.
			Used when adding reconnected listeners to the stream.

			@param  {integer}  id  Last observed event's ID.
			@return {string[]}     All entries in event history from given ID.

			@static
			@private
			**/
			'getFromID': function getFromID (id) {
				return _.last(this._events, this.getID(true) - 1 - id);
			},

			/**
			Given request and response objects, method adds the connection to listeners' list,
			keeping the connection alive and thus, sending any events to that client.

			Event catchup is taken care of automatically, provided the request comes with appropriate headers.
			Should connection be closed on client's side, the listener will be automatically removed from listeners' list.

			@method addListener
			@param  {object}  request   Request object, obtained from HTTP server's callback.
			@param  {object}  response  Response object, obtained from HTTP server's callback.
			@return {object}            Identification object, used to remove the listener later on.

			@static
			@public
			**/
			'addListener': function addListener (request, response) {

				// Object containing these created early,
				// will be used as identifier for === comparison
				var ident = {'req': request, 'res': response};

				console.log('Adding new listener...');
				response.write('retry: 5000\n\n');

				// Write initial data into the stream. Depending on the settings,
				// it might be a call for event catchup or simply a stream initiation.
				var from_id;
				// Presence of Last-Event-ID header indicates this client is reconnecting -
				// if there are any events left in the history, they should be provided as catchup.
				if ('last-event-id' in request.headers) { from_id = parseInt(request.headers['last-event-id'], 10); }
				else if ('x-last-event-id' in request.headers) { from_id = parseInt(request.headers['x-last-event-id'], 10); }
				else if ((this.guaranteed_backlog) && this.getID(true)) { from_id = this.getID(true) - 1 - this.guaranteed_backlog; }

				if (from_id) { response.write(this.getFromID(from_id).join('')); }
				else { response.write('id: ' + (this.getID(true) - 1) + '\n\n'); }

				if (request.headers['x-requested-with'] === 'XMLHttpRequest') {
					response.end();
				} else {

					// Add the listener to the listeners' list and ensure it will
					// be removed in the event on connection closing client-side
					request.on('close', this.removeListener.bind(this, ident));
					this._listeners.push(ident);

					// Too many listeners? Trim the numbers by closing oldest connections
					console.log('Listeners count: ', this._listeners.length + '(' + Math.max(0, this._listeners.length - this.listeners_limit) + ' over limit)');
					while (this._listeners.length > this.listeners_limit) {
						this.removeListener(this._listeners.shift());
					}

				}

			},

			/**
			Given the identification object, removes the connection from the listeners' list,
			removes any bound events and closes the connection. Used either when request is closed
			client-side or when the number of listeners goes over the limit.

			@method removeListener
			@param  {object}  ident  Identification object received from `add`.

			@static
			@private
			**/
			'removeListener': function removeListener (ident) {

				console.log('Removing listener...');

				var inx = this._listeners.indexOf(ident);
				if (inx !== -1) { this._listeners.splice(inx, 1); }

				ident.req.removeAllListeners();
				ident.res.removeAllListeners();
				try { ident.res.end(); } catch (e) {}

			}

		});

		return {'SSEManager': SSEManager};

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