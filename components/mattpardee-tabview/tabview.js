var vBox = require('fbox').VBox
	, Cell = require('fboxcell').Cell
	, domify = require('domify')
	, Emitter = require('emitter');

exports.TabView = TabView;

function TabView() {
	var panelvBox = new vBox()
		, iconButtonBar
		, panels = []
		, activePanelNum;

	var tabView = {
		setIconButtonBar : function(bar) {
			iconButtonBar = bar;

			bar.on("buttonactivate", function(e) {
				tabView.changePanel(e.num);
				tabView.emit("baractivate")
			}).on("buttonchange", function(e) {
				tabView.changePanel(e.num);
			}).on("buttondeactivate", function(e) {
				tabView.emit("bardeactivate");
			});
		},

		getPanelContainer : function() {
			return panelvBox;
		},

		resize : function(width, height) {
			panelvBox.resize(width, height);
		},

		closePanelContainer : function() {
			iconButtonBar.deactivateCurrentButton();
			tabView.emit("panelclose", {});
		},

		addPanel : function(panel) {
			panels.push(panel);

			if (panelvBox.children.length === 0)
				this.changePanel(0);
		},

		changePanel : function(num) {
			if (!panels[num])
				return;

			if (typeof activePanelNum !== "undefined")
				panelvBox.remove(activePanelNum);

			panelvBox.add(panels[num].el, -1);
			activePanelNum = num;

			tabView.emit("panelchange", {});
		}
	};

	Emitter(tabView);
	return tabView;
}