define(['underscore', 'backbone'], function (_, Backbone) {
	"use strict";

	var test = function test (assert, message) { if (!assert) { throw new Error(message); } },
		Member = Backbone.Model.extend({
			'validate': function (attrs) {

				// Check for required parameters
				_.each(['id', 'name'], function (prop) {
					test(typeof attrs[prop] === 'string', "Property '" + prop + "' needs to be present and a string.");
				});

				// Check for timestamp
				test(typeof attrs.joined === 'object' && attrs.joined instanceof Date, 'Join time needs to be specified as JavaScript Date object.');

				// Check for author
				_.each(['avatar', 'url'], function (prop) {
					if ((typeof attrs[prop] !== 'undefined') && (attrs[prop] !== null)) {
						test(typeof attrs[prop] === 'string', "Property '" + prop + "' needs to be a string.");
					}
				});

			},
			'parse': function (resp) {
				if (typeof resp.joined === 'number') { resp.joined = new Date(resp.joined * 1000); }
				return resp;
			},
			'toJSON': function () {
				var res = Backbone.Model.prototype.toJSON.apply(this);
				res.joined = Math.floor(this.get('joined').getTime() / 1000);
				return res;
			}
		}),
		MemberCollection = Backbone.Collection.extend({
			"model": Member,
			// From newest to oldest
			"comparator": function (a, b) { return b.get('joined') - a.get('joined'); }
		});

	return {
		'Member': Member,
		'MemberCollection': MemberCollection
	};

});