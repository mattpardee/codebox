var SandboxController = require('sandboxcontroller').SandboxController
	, vBox = require('fbox').VBox
	, Cell = require('fboxcell').Cell
	, marked = require('marked');

(function() {
	var name = "Markdown"
		, enabled = false
		, viewer = new vBox()
		, outputCell = new Cell('<div id="markdown_output" class="markdown-body"></div>');

	var markdown = {
		getName : function() {
			return name;
		},

		getViewer : function() {
			return viewer;
		},

		init : function() {
			var that = this;

			viewer.add(outputCell, -1);

			// "run" a eumphemism for anytime there's a change in the editor
			// or if the user hits a "run" button (possibly in the future)
			SandboxController.on("run", function(e) {
				if (enabled === false)
					return;

				that.run(e.editorContents);
			});
		},

		run : function(editorContents) {
			outputCell.el.innerHTML = marked(editorContents);
		},

		enable : function(editorContents) {
			enabled = true;
			SandboxController.getEditor().getSession().setMode("ace/mode/markdown");
			this.run(editorContents);
		},

		disable : function() {
			enabled = false;
		}
	};

	markdown.init();
	SandboxController.registerRenderer(markdown);
})();