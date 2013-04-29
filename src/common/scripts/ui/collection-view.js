/*jshint immed:false */
define(['jquery', 'underscore', 'backbone'], function ($, _, Backbone) {
	"use strict";

	var CollectionView = Backbone.View.extend({

		'el': null,
		'template': null,
		'collection': null,

		'filter': _.identity,
		'advancedFilter': null,
		'itemEvents': {},

		'initialize': function (opts) {

			var result = Backbone.View.prototype.initialize.apply(this, arguments);
			_.extend(this, _.pick(opts || {}, ['template', 'populate', 'filter', 'advancedFilter', 'itemEvents']));

			this.render = _.debounce(_.bind(function () { this.immediateRender(); }, this), 250);
			this.listenTo(this.collection, 'add', this.render);
			this.listenTo(this.collection, 'remove', this.render);
			this.listenTo(this.collection, 'reset', this.render);
			this.listenTo(this.collection, 'sort', this.render);

			this._eventSelectors = [];

			return result;

		},
		'populate': function (model, element) {},
		'immediateRender': function () {

			var that = this;

			// We be cleaning up any events and DOM in view's container...
			_.each(this._eventSelectors, function (selector) { that.$el.find(selector).off(); });
			this.$el.off().empty(); this._eventSelectors = [];

			// ...then going over each model in collection to render it.
			_.each(
				(typeof this.advancedFilter === 'function' ? this.advancedFilter(this.collection) : this.collection.filter(this.filter)),
				function (model) {

					// Perform basic model rendering
					var element = that.template.clone();
					that.populate(model, element.get(0));

					// Apply any defined item events to the item render
					_.each(that.itemEvents, function (callback, key) {

						// Format is "[eventtype] [selector]", where type is always
						// a basic letter string, whereas selector is the rest.
						var event = key.split(/\s+/, 1)[0],
							selector = key.split(/\s+/).slice(1).join(' ');

						if (selector.length) {
							// If callback is a string, try to use view method with such name.
							if (typeof callback === 'string') { callback = that[callback]; }
							if (typeof callback === 'function') {
								// Add to selector list for easier cleanup later on
								that._eventSelectors.push(selector);
								element.find(selector).on(event, function (ev) {
									callback.apply(that, [model, ev, this]);
								});
							}
						}

					});

					that.$el.append(element);
				}
			);

			return this;

		}

	});

	return CollectionView;

});