/*jshint devel:true, immed:false, newcap:false */
/*global require:true */
require.config({
	"baseUrl": "..",
	"paths": {
		"jquery": "common/scripts/vendor/jquery-1.9.1.min",
		"backbone": "common/scripts/vendor/backbone",
		"underscore": "common/scripts/vendor/underscore",
		"easyXDM": "common/scripts/vendor/easyXDM/easyXDM.min",
		"json3": "common/scripts/vendor/easyXDM/json3.min"
	},
	"shim": {
		"underscore": {"exports": "_"},
		"backbone": {
			"deps": ["underscore", "jquery"],
			"exports": "Backbone"
		},
		"easyXDM": {"exports": "easyXDM"},
		"json3": {"exports": "JSON"}
	},
	"waitSeconds": 10
});
require([
	'json3', 'jquery', 'underscore', 'backbone', 'easyXDM',
	'common/scripts/data/Product', 'common/scripts/product-feed-slider', 'common/scripts/product-overlay-view'
], function (
	JSON, $, _, Backbone, easyXDM,
	Products, bindProductFeed, bindProductView
) {
	"use strict";

	$(function () {

		// Apply UI actions
		bindProductFeed('#product-feed');
		var showModel = bindProductView('.overlay', '.overlay .product-view');

		// Establish the Backbone collection, along with the managing view
		var productFeed = new Products.ProductCollection();
		var productsList = Backbone.View.extend(function () {

			var props = {
				'collection': productFeed,
				// In one swoop, we setup container element and DOM template for creating new product entries
				'el': $('#product-feed .wrapper > ul').get(0),
				'template': $('#product-feed .wrapper > ul > li.template').remove().removeClass('template'),

				'initialize': function () {
					// These four simple bindings make it so that the view
					// automatically rerenders after any change to the collection
					this.listenTo(this.collection, 'add', this.render);
					this.listenTo(this.collection, 'remove', this.render);
					this.listenTo(this.collection, 'reset', this.render);
					this.listenTo(this.collection, 'sort', this.render);
				}
			};

			// The actual render function, defined as property in name different than "render"
			// due to the fact that the "render" will be debounced.
			props.immediateRender = function () {

				var that = this;

				// We be cleaning up any events and DOM in view's container...
				this.$el
					.find('a').off().end()
					.off()
					.empty();

				// ...then going over each model in collection to render it.
				this.collection.each(function (model) {

					// Cloning template and populating it.
					var element = that.template.clone()
						.find('.name').html(model.get('name')).end()
						.find('.url').attr('href', model.get('url')).end()
						.find('.photo').attr('src', model.get('photo_small')).end()
						.find('.price').html(model.get('price')).end()
						.find('.description').html(model.get('description')).end();

					// Modal overlay bound here
					element.find('a').on('click', function (ev) {
						ev.preventDefault();
						var temp = model.toJSON();
						temp.photo = typeof temp.photo_big !== 'undefined' ? temp.photo_big : temp.photo_small;
						delete temp.photo_small; delete temp.photo_big;
						showModel(temp);
					});

					// New product added to the list for ye eye feastin'
					that.$el.append(element);

				});

				return this;

			};
			// And the debounced version of render, used as an official one.
			// This way, the rendering doesn't go haywire on multiple
			// consecutive changes.
			props.render = _.debounce(props.immediateRender, 250);

			return props;

		}());
		productsList = new productsList();

		var socket = new easyXDM.Socket({

			'interval': 1000,
			'local': '../common/scripts/vendor/easyXDM/name.html',
			'swf': '../common/scripts/vendor/easyXDM.swf',
			'swfNoThrottle': true,
			'remote': 'http://localhost:8888/',
			'onMessage': function (message) {

				try {

					var data = JSON.parse(message),
						ev = data.event.split(':', 2);

					if (ev[0] === 'productFeed') {

						if (ev[1] === 'reset') {
							productFeed.reset(data.payload);
						} else if (ev[1] === 'add') {
							if (!productFeed.get(data.payload.id)) { productFeed.add(data.payload); }
						} else if (ev[1] === 'remove') {
							var model = productFeed.get(data.payload.id);
							if (model) { productFeed.remove(model); }
						}

					} else if (ev[0] === 'message') {
						window.alert(data.payload);
					}

				} catch (e) {}

			}

		});

	});

});