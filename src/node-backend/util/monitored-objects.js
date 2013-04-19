(function () {
	"use strict";

	// TEST FOR HARMONY FUNCTIONS
	if (typeof Proxy === 'undefined') {
		console.error("\u001b[31m" + 'Node.js needs to be started with --harmony argument.' + "\u001b[0m");
		process.exit(1);
	}

	var _ = require('./lodash'),
		Reflect = require('./reflect'),
		events = require('events'),

		monitoredModel = function (base) {

			base = base || {};
			var prototype = _.extend(new events.EventEmitter(), {

					'get': function (target, name, receiver) {
						if (name === 'toJSON') { return function () { return JSON.stringify(target); }; }
						else { return Reflect.get(target, name, receiver); }
					},
					'set': function (target, name, value) {
						target[name] = value;
						this.emit('change', name, value, proxyObject);
						return true;
					},
					'deleteProperty': function (target, name) {
						delete target[name];
						this.emit('change', name, undefined, proxyObject);
						return true;
					}

				}),
				proxyObject = Reflect.Proxy(base, prototype);

			_.each(_.keys(events.EventEmitter.prototype), function (prop) {
				Object.defineProperty(proxyObject, prop, {
					'configurable': false,
					'enumerable': false,
					'writable': false,
					'value': prototype[prop].bind(prototype)
				});
			});

			return proxyObject;

		},

		monitoredCollection = function (base) {

			base = base ? _.toArray(base) : [];
			var prototype = _.extend(new events.EventEmitter(), {
					'get': function (target, name, receiver) {
						if (name === 'toJSON') { return function () { return JSON.stringify(target); }; }
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
					'modifiedSplice': function (target, index, howMany) {
						var args = _.rest(arguments, 1),
							result = target.splice.apply(target, args);

						if (result.length) { _.each(result, _.bind(function (item) { this.emit('remove', item, proxyObject); }, this)); }
						args = _.rest(arguments, 3);
						if (args.length) { _.each(args, _.bind(function (item) { this.emit('add', item, proxyObject); }, this)); }
						return result;
					}
				}),
				proxyObject = Reflect.Proxy(base, prototype);

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

	if (typeof exports !== 'undefined') {
		exports.monitoredModel = monitoredModel;
		exports.monitoredCollection = monitoredCollection;
	}

}());