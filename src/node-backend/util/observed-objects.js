/*global define:true, exports: true */
/**
Methods for creating model and collection objects (based on standard objects and arrays, respectively)
that emit change events on property changes (for models) or addition/removal of items from collection
(arrays). Based on ES6/Harmony Proxies and Reflect module.

@module observed
**/
(function (define) {
	"use strict";

	define(function (require, exports, module) {

		if (typeof Proxy === 'undefined') {
			throw new Error('Node.js needs to be started with --harmony argument.');
		}

			// Dependencies
		var events = require('events'),
			_ = require('../vendor/lodash'),
			Reflect = require('../vendor/reflect'),

			observeModel,
			observeCollection;

		/**
		Factory function for creating observed Models. The model can act as regular JavaScript object,
		with the note that it has functionality of Node's EventEmitter mixed in - on changes to properties,
		an appropriate event will be emitted and can be listened to in order to react to those changes.

		@class observeModel
		@extends Proxy
		@uses events.EventEmitter

		@constructor
		@public
		**/
		observeModel = function (base) {

			base = base || {};
			/**
			Due to faulty interaction of Harmony's Proxy with JSON.stringify, a JSON string representing
			the observed model can be obtained by executing its `toJSON` method. It will return the
			stringified representation as long as all the properties of a model (apart from ones
			related to EventEmitter) can be represented.

			@method toJSON
			@return {string}  JSON representation of a model.
			@public
			**/
			/**
			Event emitted whenever a property chages on the observed model. Each event carries, as arguments,
			the name of the modified property and reference to the model itself. For new and existing properties,
			the new value is also provided. For properties removed via `delete` keyword, the value is given
			as undefined.

			@event change
			@param {string}  name   Name of the modified property.
			@param {any}     value  New value of modified property (undefined if property deleted).
			@param {Proxy}   proxy  Reference to proxy that emitted the event.
			@public
			**/
			var prototype = _.extend(new events.EventEmitter(), {

					// Overriding property getter to provide JSON.stringify
					// on target object for property name 'toJSON'.
					'get': function (target, name, receiver) {
						if (name === 'toJSON') { return function () { return _.clone(target); }; }
						else { return Reflect.get(target, name, receiver); }
					},
					// Overriding property setter to emit "change" event on new values
					// (no events emitted if assigned value is the same as before).
					'set': function (target, name, value) {
						
						if (target[name] !== value) {
							target[name] = value;
							this.emit('change', name, value, proxyObject);
						}
						return true;
					},
					// Overriding property deleter to emit "change" event on deletions.
					'deleteProperty': function (target, name) {
						delete target[name];
						this.emit('change', name, undefined, proxyObject);
						return true;
					}

				}),
				proxyObject = Reflect.Proxy(base, prototype);

			// Each of public EventEmitter functions is bound to the proxy
			// to allow the usage of EventEmitter API (and with binding it
			// to original prototype object, we avoid namespace pollution).
			_.each(_.keys(events.EventEmitter.prototype), function (prop) {
				Object.defineProperty(proxyObject, prop, {
					'configurable': false,
					'enumerable': false,
					'writable': false,
					'value': prototype[prop].bind(prototype)
				});
			});

			return proxyObject;

		};

		/**
		Factory function for creating observed collections - arrays that emit events when elements are
		added to it or removed from it. The events are handled via mixed in Node's EventEmitter class,
		with its API exposed for adding and removing listeners.

		@class observeCollection
		@extends Proxy
		@uses events.EventEmitter

		@constructor
		@public
		**/
		observeCollection = function (base) {

			base = base ? _.toArray(base) : [];
			/**
			Due to faulty interaction of Harmony's Proxy with JSON.stringify, a JSON string representing
			the observed collection can be obtained by executing its `toJSON` method. It will return the
			stringified representation as long as all items in the collection can be represented as JSON.

			@method toJSON
			@return {string}  JSON representation of a collection.
			@public
			**/
			/**
			Event emitted whenever a new item is added to the collection. If multiple items have been
			added to the collection (multiple arguments for `push` or `splice`), a separate event is
			emitted for each of them.

			@event add
			@param {any}     item   Item added to the collection.
			@param {Proxy}   proxy  Reference to proxy that emitted the event.
			@public
			**/
			/**
			Event emitted whenever a new item is removed from the collection. If multiple items have been
			removed from the collection, a separate event is emitted for each of them.

			@event remove
			@param {any}     item   Item removed from the collection.
			@param {Proxy}   proxy  Reference to proxy that emitted the event.
			@public
			**/
			var prototype = _.extend(new events.EventEmitter(), {
					// Overriding property getter to serve toJSON function and wrap
					// base collection's push, pop, shift, unshift and splice for emitting events.
					'get': function (target, name, receiver) {
						if (name === 'toJSON') { return function () { return target.slice(); }; }
						else if (name === 'pop') { return _.partial(this.modifiedPop, target); }
						else if (name === 'push') { return _.partial(this.modifiedPush, target); }
						else if (name === 'shift') { return _.partial(this.modifiedShift, target); }
						else if (name === 'unshift') { return _.partial(this.modifiedUnshift, target); }
						else if (name === 'splice') { return _.partial(this.modifiedSplice, target); }
						else { return Reflect.get(target, name, receiver); }
					},
					'modifiedPop': function (target) {
						var result = target.pop();
						if (result) { this.emit('remove', result, proxyObject); }
						return result;
					},
					'modifiedPush': function (target) {
						var args = _.rest(arguments),
							result = target.push.apply(target, args);
						if (args.length) { _.each(args, _.bind(function (item) { this.emit('add', item, proxyObject); }, this)); }
						return result;
					},
					'modifiedShift': function (target) {
						var result = target.shift();
						if (result) { this.emit('remove', result, proxyObject); }
						return result;
					},
					'modifiedUnshift': function (target) {
						var args = _.rest(arguments),
							result = target.unshift.apply(target, args);
						if (args.length) { _.each(args, _.bind(function (item) { this.emit('add', item, proxyObject); }, this)); }
						return result;
					},
					'modifiedSplice': function (target) {
						var args = _.rest(arguments, 1),
							result = target.splice.apply(target, args);

						if (result.length) { _.each(result, _.bind(function (item) { this.emit('remove', item, proxyObject); }, this)); }
						args = _.rest(arguments, 3);
						if (args.length) { _.each(args, _.bind(function (item) { this.emit('add', item, proxyObject); }, this)); }
						return result;
					}
				}),
				proxyObject = Reflect.Proxy(base, prototype);

			// Each of public EventEmitter functions is bound to the proxy
			// to allow the usage of EventEmitter API (and with binding it
			// to original prototype object, we avoid namespace pollution).
			_.each(_.keys(events.EventEmitter.prototype), function (prop) {
				Object.defineProperty(proxyObject, prop, {
					'configurable': false,
					'enumerable': false,
					'writable': false,
					'value': prototype[prop].bind(prototype)
				});
			});

			return proxyObject;

		};

		return {
			'observeModel': observeModel,
			'observeCollection': observeCollection
		};

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