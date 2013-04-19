define(['jquery', 'underscore'], function ($, _) {
	"use strict";

	return function bindProductFeed (selector) {

		var index = (function () {

			var listSelector = selector.split(/\s+/g).concat('.wrapper > ul').join(' '),
				currentIndex = 0,
				changeIndex = function changeIndex (offset) {

					var sel = $(listSelector).find('> li'),
						newIndex = currentIndex + offset,
						totalWidth = 0,
						offsetWidth = 0;

					if ((newIndex >= 0) && (newIndex < sel.length)) {

						sel.each(function (index) {
							var t = $(this).outerWidth();
							if (index < newIndex) { offsetWidth += t; }
							totalWidth += t;
						});

						sel = sel.end();
						offsetWidth = '-' + Math.min(offsetWidth, totalWidth - sel.width()) + 'px';
						if (offsetWidth !== sel.css('text-indent')) {
							currentIndex = newIndex;
							sel.animate({'text-indent': offsetWidth}, {'duration': 250});
						}

					}

				};

			return {
				'prev': function (ev) {
					ev.preventDefault();
					ev.stopPropagation();
					changeIndex(-1);
				},
				'next': function (ev) {
					ev.preventDefault();
					ev.stopPropagation();
					changeIndex(1);
				}
			};

		}());

		$(selector.split(/\s+/g).concat('.prev').join(' ')).on('click', index.prev);
		$(selector.split(/\s+/g).concat('.next').join(' ')).on('click', index.next);

	};

});