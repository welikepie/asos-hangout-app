/*jshint devel:true */
/*global require:true */
require.config({
	"baseUrl": "..",
	"paths": {
		"jquery": "common/scripts/vendor/jquery-1.9.1",
		"backbone": "common/scripts/vendor/backbone",
		"underscore": "common/scripts/vendor/underscore"
	},
	"shim": {
		"underscore": {"exports": "_"},
		"backbone": {
			"deps": ["underscore", "jquery"],
			"exports": "Backbone"
		},
	},
	"waitSeconds": 10
});
console.log('TEST');
require(["jquery"], function ($) {
	"use strict";

	var overlay = $('.overlay').on('click', function () { $(this).removeClass('open'); }),
		shopView = $('.overlay .shop-view'),

		feedIndex = 0,
		changeProductFeedIndex = function (index) {
			feedIndex = index;
			var offset = 0;
			$('#product-feed ul li').slice(0, index).each(function () { offset += $(this).outerWidth(); });
			$('#product-feed ul').css('text-indent', '-' + offset + 'px');
		},
		showShopView = function (model) {
			shopView
				.find('img').attr('src', model.photo).end()
				.find('a').attr('href', model.link).html(model.title);
			overlay.addClass('open');
		};

	$('#product-feed ul a').on('click', function (ev) {
		ev.preventDefault();
		ev.stopPropagation();
		var model = {
			'photo': $('img', this).attr('src'),
			'title': $('h2', this).html(),
			'link': this.getAttribute('href')
		};
		showShopView(model);
	});

	$('#product-feed a.prev').on('click', function (ev) {
		ev.preventDefault();
		ev.stopPropagation();
		if (feedIndex > 0) {
			changeProductFeedIndex(feedIndex - 1);
		}
	});
	$('#product-feed a.next').on('click', function (ev) {
		ev.preventDefault();
		ev.stopPropagation();
		if (feedIndex < $('#product-feed ul li').length - 1) {
			changeProductFeedIndex(feedIndex + 1);
		}
	});

});