/*jshint plusplus:false */
(function (define) {
	"use strict";

	define(function (require, exports, module) {

		var events   = require('events'),
			_        = require('../vendor/lodash'),
			NTwitter = require('../vendor/ntwitter');

		var TwitterMonitor = function (creds) {

			this._streamer = new NTwitter(creds);
			this._idCache = [];

			var emitter = new events.EventEmitter();
			_.each(_.keys(events.EventEmitter.prototype), function (prop) {
				Object.defineProperty(this, prop, {
					'configurable': false,
					'enumerable': false,
					'writable': false,
					'value': emitter[prop].bind(emitter)
				});
			}.bind(this));

		};

		_.extend(TwitterMonitor.prototype, {

			'reconnectInterval': 5000,
			'logLength': 500,

			'processTweet': function (data) {
				if (!_.has(data, 'retweeted_status')) {

					var result = {
						'id': data.id_str,
						'author': {
							'name': data.user.name,
							'url': 'https://twitter.com/' + data.user.screen_name,
							'avatar': data.user.profile_image_url_https
						},
						'text': data.text,
						'timestamp': data.created_at,
						'url': 'https://twitter.com/' + data.user.screen_name + '/status/' + data.id_str
					};

					return result;

				}
			},

			'monitor': function (filter, callback) {

				var that = this,
					start_func = function () {

						console.log('Starting a monitor on filter: ', filter, '\n');
						that.emit('start');

						if (that._monitorTimeout) {
							clearTimeout(that._monitorTimeout);
							that._monitorTimeout = null;
						}

						that._streamer.stream('statuses/filter', {'track': filter}, function (stream) {

							that.ongoing = stream;
							if (typeof callback === 'function') { that.addListener('tweet', callback); }

							stream.on('data', function (data) {
								if (!_.contains(that._idCache, data.id_str)) {
									var result = that.processTweet(data);
									if (result) {
										that.emit('tweet', result);
										that._idCache.push(data.id_str);
										while (that._idCache.length > that.logLength) { that._idCache.shift(); }
									}
								}
							});

							stream.on('end', function () {
								console.log('Closing connection...');
								delete that.ongoing;
								stream.removeAllListeners();
								that.emit('end');
								if (typeof callback === 'function') { that.removeListener('tweet', callback); }
								if (stream.shouldRestart) {
									console.log('Will restart now.');
									that._monitorTimeout = setTimeout(start_func, that.reconnectInterval);
								}
							});

							stream.on('error', function (protocol, code) {
								if (code === 406) { that.emit('error', new Error('Invalid search terms.')); }
								else if (code === 413) { that.emit('error', new Error('Search term too long.')); }
								stream.shouldRestart = false;
								stream.destroy();
							});

						});

					};

				if (this.ongoing) {
					this.ongoing.shouldRestart = false;
					this.ongoing.destroy();
					this._monitorTimeout = setTimeout(start_func, this.reconnectInterval);
				} else if (this._monitorTimeout) {
					clearTimeout(this._monitorTimeout);
					that._monitorTimeout = setTimeout(start_func);
				} else {
					start_func();
				}

			},

			'close': function () {
				if (this.ongoing) {
					this.ongoing.shouldRestart = false;
					this.ongoing.destroy();
				}
			}

		});

		return {'TwitterMonitor': TwitterMonitor};

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