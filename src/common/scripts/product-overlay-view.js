define(['jquery', 'underscore'], function ($, _) {
	"use strict";

	return function bindProductView (overlaySelector, productViewSelector) {

		var overlay = $(overlaySelector),
			productView = overlay.find('.product-view'),
			showProduct = function showProduct (model) {

				overlay
					.queue('fx', function (next) {
						productView
							.find('img').attr('src', model.photo).end()
							.find('.title').html(model.title).end()
							.find('.price').html(model.price).end()
							.find('.description').empty().html(model.description).end()
							.find('.shop').attr('href', model.link);
						overlay.css({'display': 'block', 'opacity': 0});
						next();
					})
					.animate({'opacity': 1}, {'duration': 300});

			};

		overlay.on('click', function () {
			overlay
				.animate({'opacity': 0}, {'duration': 300})
				.queue(function (next) { overlay.css({'display': 'none'}); next(); });
		});

		return showProduct;

	};

});