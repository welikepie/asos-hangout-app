/*jshint devel:true */
/*global require:true, gapi:true */
require.config({
	"baseUrl": "..",
	"paths": {
		"jquery": "common/scripts/vendor/jquery-1.9.1.min",
		"backbone": "common/scripts/vendor/backbone",
		"underscore": "common/scripts/vendor/underscore"
	},
	"shim": {
		"underscore": {"exports": "_"},
		"backbone": {
			"deps": ["underscore", "jquery"],
			"exports": "Backbone"
		}
	},
	"waitSeconds": 10
});
require(['jquery', 'common/scripts/product-feed-slider', 'common/scripts/product-overlay-view'], function ($, bindProductFeed, bindProductView) {
	"use strict";

	gapi.hangout.onApiReady.add(function init () {

		bindProductFeed('#product-feed');
		var showProduct = bindProductView('.overlay', '.overlay .product-view');

		$('#product-feed ul a').on('click', function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
			var model = {
				'photo': $('img', this).attr('src'),
				'title': $('h2', this).html(),
				'price': $('.price', this).html(),
				'description': $('.description').html(),
				'link': this.getAttribute('href')
			};
			showProduct(model);
		});

	});

});