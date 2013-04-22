define(['underscore', 'backbone'], function (_, Backbone) {
	"use strict";

	var test = function test (assert, message) { if (!assert) { throw new Error(message); } },
		Product = Backbone.Model.extend({
			"validate": function (attrs) {

				// Ensure the ID is present and a positive integer
				test((typeof attrs.id === 'number') && (attrs.id >= 0), "Product ID must be a positive integer.");

				// Ensure presence and strigification of other properties
				_.each(['name', 'url', 'photo_small', 'price'], function (prop) {
					test(typeof attrs[prop] === 'string', "Property '" + prop + "' needs to be present and a string.");
				});

				// Ensure proper format for optional properties
				_.each(['photo_big', 'description'], function (prop) {
					test((typeof attrs[prop] === 'undefined') || (typeof attrs[prop] === 'string'), "Property '" + prop + "' should, if present, be a string.");
				});

			}
		}),
		ProductCollection = Backbone.Collection.extend({
			"model": Product,
			"comparator": "id"
		});

	return {
		'Product': Product,
		'ProductCollection': ProductCollection
	};

});