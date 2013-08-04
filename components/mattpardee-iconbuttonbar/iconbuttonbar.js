var VBox = require('fbox').VBox
	, HBox = require('fbox').HBox
	, IconButton = require('iconbutton').IconButton
	, Emitter = require('emitter');

exports.IconButtonBar = IconButtonBar;

function IconButtonBar(orientation) {
	var el
		, activeIconButtonEl
		, buttonCounter = 0
		, buttons = [];

	if (orientation === "horizontal")
		el = new HBox();
	else
		el = new VBox();

	var iconButtonBar = {
		el : el,

		addIconButton : function(classname, title, dimension, click_cb) {
			var that = this;
			function helper(c, cn, t, d, cb) {
				var iconButton = new IconButton(classname, title, function(e) {
					var eventName = "buttonchange";
					var state = that.setActiveButton(this);
					if (state.state === "deactivate")
						eventName = "buttondeactivate";

					else if (state.state === "activate" && state.prev === false)
						eventName = "buttonactivate";

					iconButtonBar.emit(eventName, {
						  btn : this
						, evt : e
						, num : c
					});

					click_cb && click_cb(e);
				});
				el.add(iconButton, dimension);

				// May not need the counter thing.
				buttons.push({
					  btn : iconButton
					, num : c
				});
			}

			helper(buttonCounter, classname, title, dimension, click_cb);
			buttonCounter++;
		},

		setActiveButton : function(iconButtonEl) {
			var returnState = {
				  prev  : false
				, state : "activate"
			};

			if (iconButtonEl.classList.contains("active")) {
				iconButtonEl.classList.remove("active");
				returnState.state = "deactivate";
				returnState.prev = true;
				activeIconButtonEl = null;
				return returnState;
			}
			if (activeIconButtonEl) {
				activeIconButtonEl.classList.remove("active");
				returnState.prev = true;
			}

			iconButtonEl.classList.add("active");
			activeIconButtonEl = iconButtonEl;
			return returnState;
		},

		deactivateCurrentButton : function() {
			if (!activeIconButtonEl)
				return;
			activeIconButtonEl.classList.remove("active");
			activeIconButtonEl = null;
		}
	};

	Emitter(iconButtonBar);
	return iconButtonBar;
}