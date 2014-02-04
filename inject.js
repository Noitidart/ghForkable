function makeForkable() {
	alert('making forkable 3');
	var fork, present, star, button, form, forks, count;
	$('.pagehead-actions li').each(function () {
		var action = $(this).find('form').attr('action');
		if (action) {
			switch (action.split('/').pop()) {
			case 'fork':
				fork = $(this);
				present = true;
				break;
			case 'star':
				star = this;
				break;
			case 'unstar':
				star = this;
				break;
			}
		}
	});
	if (!fork) {
		if (!star) {
			//no star on this page so exit. this is not a page that can be starred so likely not forked
			return;
		}
		fork = $(star).clone();
		fork.addClass('ghForkable_fork')
	}
	button = fork.find('.minibutton');
	if (present) {
		button.focus();
		return;
	}
	form = fork.find('form');
	form.attr('action', form.attr('action').split('/').map(function (a) {
		return a == 'star' || a == 'unstar' ? 'fork' : a;
	}).join('/'));
	button.html('<span class="octicon octicon-git-branch"></span>Fork');
	forks = $('.counter').filter(function () {
		var href = $(this).parent().attr('href');
		return href ? href.split('/').some(function (a) {
			return a === 'forks';
		}) : false;
	});
	count = fork.find('.social-count');
	count.html(forks.text() || 0);
	count.attr('href', forks.parent().attr('href'));
	if (count[0].tagName == 'SPAN') {
		count.addClass('js-social-count'); //if its a span it doesnt have this class
		count.replaceWith(function () {
			var attrs = {};
			$.each(this.attributes, function (index, attr) {
				attrs[attr.name] = attr.value;
			});
			return $('<a>', attrs).append(count.contents().clone(true, true));
		});
	}
	$('.pagehead-actions li:last').parent().append(fork);
}

makeForkable();