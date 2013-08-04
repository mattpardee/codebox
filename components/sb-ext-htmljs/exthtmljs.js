var SandboxController = require('sandboxcontroller').SandboxController
	, vBox = require('fbox').VBox
	, Cell = require('fboxcell').Cell;

(function() {
	var name = "HTML/JavaScript"
		, enabled = false
		, viewer = new vBox()
		, iFrameSandbox = new Cell('<iframe id="sandbox-iframe"></iframe>');

	var htmljs = {
		getName : function() {
			return name;
		},

		getViewer : function() {
			return viewer;
		},

		init : function() {
			var that = this;

			viewer.add(iFrameSandbox, -1);

			// "run" a eumphemism for anytime there's a change in the editor
			// or if the user hits a "run" button (possibly in the future)
			SandboxController.on("run", function(e) {
				if (enabled === false)
					return;

				that.run(e.editorContents);
			});
		},

		run : function(editorContents) {
			iFrameSandbox.el.contentDocument.getElementsByTagName("body")[0].innerHTML = "";

			iFrameSandbox.el.contentDocument.open();
			iFrameSandbox.el.contentDocument.write(editorContents);
			iFrameSandbox.el.contentDocument.close();
		},

		enable : function(editorContents) {
			enabled = true;
			SandboxController.getEditor().getSession().setMode("ace/mode/html");
			this.run(editorContents);
		},

		disable : function() {
			enabled = false;
		}
	};

	htmljs.init();
	SandboxController.registerRenderer(htmljs);
})();