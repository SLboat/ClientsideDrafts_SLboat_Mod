(function(window, $, undef) {
	"use strict"; //用户构造?
	var document = window.document, //这里的逗号使得后面都是var局部!
		storage = window.localStorage, //保存到本地区
		JSON = window.JSON,
		keyPrefix = 'ClientsideDrafts::drafts',
		mediaWiki = window.mediaWiki,
		textareaSelector = '#wpTextbox1',
		log, showMessage, t,
		troubleLoad = '<a href="javascript:;" class="clientsidedrafts_loaddraft">',
		troubleEnd = '</a>',
		troubleSkip = '<a href="javascript:;" class="clientsidedrafts_skipdraft">',
		AUTOSAVE_INTERVAL = 10 * 1000; // 每10秒保存一次

	log = mediaWiki.log || (window.console ? window.console.log : $.noop);
	showMessage = function(msg) {
		log('Show message: ' + msg);
		if (mediaWiki.util && mediaWiki.util.jsMessage) {
			mediaWiki.util.jsMessage(msg); // MediaWiki 1.18
		} else if (window.jsMsg) {
			window.jsMsg(msg);
		}
	};

	if (mediaWiki === undef || mediaWiki.config.values.wgAction !== 'edit') {
		log('drafts: not edit');
		return; // Not editing
	}
	t = function() {
		var msg = mediaWiki.message.apply(mediaWiki, arguments);
		return msg.toString();
	};
	if (storage === undef || JSON === undef) {
		showMessage(t('clientsidedrafts-required'));
		return; // No HTML5 storage or JSON support, exiting.
	}

	// State saved as pair { original, draft }

	(function(title, userName) {
		var key = [keyPrefix, userName || '', title].join('-'),
			loadKey = function(key) {
				var s = storage.getItem(key);
				if (s !== null) {
					s = JSON.parse(s);
				}
				return s;
			}, saveKey = function(key, data) {
				if (data !== null) {
					data = JSON.stringify(data);
				}
				storage.setItem(key, data);
			}, $textarea = $(textareaSelector),
			autoSaveEnabled = true,
			loadDraft, saveDraft, original;

		original = $textarea.val();

		loadDraft = function() {
			var state = loadKey(key);
			if ($.isPlainObject(state) && state.draft) {
				// check draftee
				if (state.draft === original) {
					// do nothing
					log('drafts: draft is equal to original');
					return;
				}
				if (state.original != original) {
					// can apply our draft immediately, original is not changed
					showMessage("载入了保存的草稿哦!");
					$textarea.val(state.draft);
					log('drafts: loaded');
				} else {
					// original changed. we need thinking hard
					log('drafts: trouble');
					showMessage(t('clientsidedrafts-trouble', troubleLoad, troubleEnd, troubleSkip, troubleEnd));
					autoSaveEnabled = false;
				}
			}
		};

		saveDraft = function() {
			var draft = $textarea.val(),
				state;
			if (!autoSaveEnabled) {
				log('drafts: autosave disabled');
				return;
			}
			state = {
				original: original,
				draft: draft
			};
			saveKey(key, state);
			//      showMessage(t('clientsidedrafts-autosaved', (new Date()).toString()));
		};

		$('<span id="savedraftime" style="color: darkcyan;float: right;">船长!将每' + AUTOSAVE_INTERVAL / 1000 + '秒保存草稿</span>').insertAfter('#mw-editpage-watch');
		setInterval(saveDraft, AUTOSAVE_INTERVAL);
		loadDraft();

		$('body').on('a.clientsidedrafts_loaddraft', 'click', function(e) {
			e.preventDefault();
			$textarea.val(loadKey(key).draft);
			autoSaveEnabled = true;
			saveDraft();
		});

		$('body').on('a.clientsidedrafts_skipdraft', 'click', function(e) {
			e.preventDefault();
			autoSaveEnabled = true;
			saveDraft();
		});

	})(mediaWiki.config.values.wgPageName, mediaWiki.config.values.wgUserName);

})(window, jQuery);