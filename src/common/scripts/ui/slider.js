define(['jquery', 'underscore'], function ($, _) {
	"use strict";

	var Slider = function (baseElement, childSelector) {
		_.extend(this, {
			'currentIndex': 0,
			'maxIndex': 0,
			'baseElement': baseElement,
			'childSelector': childSelector
		});
	};

	_.extend(Slider.prototype, {
		'animate': function (oldIndex, newIndex/*, oldElement, newElement*/) {

			var offsetWidth = 0,
				totalWidth = 0,
				sel = this.baseElement.find(this.childSelector);

			sel.each(function (index) {
				var t = $(this).outerWidth();
				if (index < newIndex) { offsetWidth += t; }
				totalWidth += t;
			});
			sel = sel.end();

			offsetWidth = '-' + Math.min(offsetWidth, totalWidth - sel.width()) + 'px';
			if (offsetWidth !== sel.css('text-indent')) {
				sel.animate({'text-indent': offsetWidth}, {'duration': 300});
				return true;
			} else {
				return false;
			}

		},
		'changeTo': function (newIndex) {
			// First, refresh the max index
			var oldIndex, children = this.baseElement.find(this.childSelector);
			this.maxIndex = children.length - 1;

			if (newIndex < 0) { newIndex = 0; }
			if (newIndex > this.maxIndex) { newIndex = this.maxIndex; }
			this.currentIndex = newIndex;
			this.animate(oldIndex, newIndex, children.eq(oldIndex), children.eq(newIndex));
		}
	});

	return Slider;
});