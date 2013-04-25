define(['underscore', 'backbone'], function (_, Backbone) {
	"use strict";

	var test = function test (assert, message) { if (!assert) { throw new Error(message); } },
		Tweet = Backbone.Model.extend({
			'validate': function (attrs) {

				// Check for required parameters
				_.each(['id', 'text', 'url'], function (prop) {
					test(typeof attrs[prop] === 'string', "Property '" + prop + "' needs to be present and a string.");
				});

				// Check for timestamp
				test(typeof attrs.timestamp === 'object' && attrs.timestamp instanceof Date, 'Timestamp needs to be specified as JavaScript Date object.');

				// Check for author
				test(
					(typeof attrs.author === 'object') &&
					(typeof attrs.author.name === 'string') &&
					(typeof attrs.author.avatar === 'string') &&
					(typeof attrs.author.url === 'string'),
					'Author needs to be specified with every tweet.'
				);

			},
			'parse': function (resp) {
				if (typeof resp.timestamp === 'string') { resp.timestamp = new Date(resp.timestamp); }
				return resp;
			},
			'toJSON': function () {
				var res = Backbone.Model.prototype.toJSON.apply(this);
				res.timestamp = this.get('timestamp').toString();
				return res;
			}
		}),
		TweetCollection = Backbone.Collection.extend({
			"model": Tweet,
			// From newest to oldest
			"comparator": function (a, b) { return b.get('timestamp') - a.get('timestamp'); }
		});

	return {
		'Tweet': Tweet,
		'TweetCollection': TweetCollection
	};

});