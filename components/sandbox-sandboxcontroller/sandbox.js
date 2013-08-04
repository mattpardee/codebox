var vBox = require('fbox').VBox
	, hBox = require('fbox').HBox
	, splitView = require('splitview').SplitView
	, IconButtonBar = require('iconbuttonbar').IconButtonBar
	, domify = require('domify')
	, Emitter = require('emitter')
	, Cell = require('fboxcell').Cell
	, TabView = require('tabview').TabView
	, ListView = require('listview').ListView;

var SandboxController = exports.SandboxController = (function() {
	var connHandler
		, parentContainer
		, renderers = {}
		, activeRenderer
		, editor
		, editorContents
		, stashedEditorSession
		, userListSplitView
		, hbox = new hBox()
		, navTabView = new TabView()
		, navbar = new IconButtonBar("vertical")
		, editorSide = new vBox()
		, editorHeader = new hBox()
		, documentName = domify('<h1 id="document-name" contenteditable="true">Untitled</h1>')
		, modeSelector = domify('<select id="mode-selector"></select>')
		, sidebar = new Cell('<div id="editor" class="chatrooms sidebar"></div>')
		, historyContainer = new ListView()
		, outputContainer = new vBox()
		, iFrameCover = new Cell('<div id="iframe-cover"></div>')
		, sessionGuid
		, enableSave = true;

	var sandboxController = {
		setConnectionHandler : function(ch) {
			var that = this;
			connHandler = ch;
			connHandler.on("message", function(m) {
				var data;
				try {
					data = JSON.parse(m.data);
				}
				catch (e) {

				}

				console.log(data);
				switch (data.cmd) {
					case "handshake":
						sessionGuid = data.guid;
						that.addHistoryItem("Untitled", editor.getValue(), sessionGuid);
						historyContainer.setActiveListItem(0);
						for (var i = 0, len = data.history.length; i < len; i++) {
							that.addHistoryItem(
								  data.history[i].title
								, data.history[i].code
								, data.history[i].guid
								, new Date(data.history[i].updated).toLocaleString()
							);
						}
						break;

					default:
						break;
				}
			});
		},

		addHistoryItem : function(title, code, guid, updated) {
			historyContainer.addListItem(
				  ['<div><div class="selector"></div><div class="litext">',
						, title
						, '<br />'
						, updated || new Date(Date.now()).toLocaleString()
						, '</div></div>'
				  ].join('')
				  , {
				  		  title : title
						, code  : code
						, guid  : guid
				  }
			).on("mouseover", function(e) {
				enableSave = false;
				documentName.innerText = e.data.title;
				editor.setValue(e.data.code);
				editor.gotoLine(1);
			}).on("mouseout", function() {
				if (enableSave === false) {
					editor.setValue(stashedEditorSession.contents);
					documentName.innerText = stashedEditorSession.title;
					editor.gotoLine(1);
					enableSave = true;
				}
			}).on("selected", function(e) {
				navTabView.closePanelContainer();

				connHandler.sendMessage({
					  cmd  : "changesession"
					, guid : e.data.guid
				});

				documentName.innerText = e.data.title;
				if (e.data.title === "Untitled")
					documentName.classList.remove("modified");
				else
					documentName.classList.add("modified");

				editor.setValue(e.data.code);
				editor.gotoLine(1);

				enableSave = true;
			});
		},

		init : function(ui_container) {
			var that = this;

			parentContainer = ui_container;

			hbox.el.setAttribute("id", "body_container");
			hbox.add(navbar.el, 50);

			parentContainer.add(hbox, -1);

			this.setupNavTabView();

			userListSplitView = new splitView({
				orientation: "left",
				size: window.innerWidth / 2
			});

			userListSplitView.el.setAttribute("id", "editor_splitview");

			modeSelector.addEventListener("change", function(e) {
				that.changeRenderer(this.value);
			});
			editorHeader.el.setAttribute("id", "editor-header");

			documentName.addEventListener("focus", function() {
				if (this.classList.contains("modified") === false) {
					var that = this;
					// Select all the text inside the element
					setTimeout(function() {
						var range = document.createRange();
					    range.selectNodeContents(that);
					    var sel = window.getSelection();
					    sel.removeAllRanges();
					    sel.addRange(range);
					});
				}
			});
			documentName.addEventListener("keyup", function() {
				this.classList.add("modified");
			});
			documentName.addEventListener("blur", function() {
				if (this.classList.contains("modified")) {
					connHandler.sendMessage({
						  cmd   : "updatetitle"
						, guid  : sessionGuid
						, title : this.innerText
					});
				}
			});
			editorHeader.el.appendChild(documentName);
			editorHeader.el.appendChild(modeSelector, 160);

			editorSide.add(editorHeader, 35);
			editorSide.add(sidebar, -1);

			userListSplitView.addSide(editorSide);
			userListSplitView.addMain(outputContainer);

			hbox.add(userListSplitView, -1);

			this.setupEditor();

			userListSplitView.on("onstart", function() {
				iFrameCover.el.classList.add("moving");
			}).on("onend", function() {
				iFrameCover.el.classList.remove("moving");
			}).on("resize", function(e) {
				iFrameCover.resize(e.width - e.size, e.height);
				editor.resize();
			});
		},

		setupNavTabView : function() {
			function openHistoryPanel() {
				hbox.el.classList.add("expand");
			}
			function closeHistoryPanel() {
				hbox.el.classList.remove("expand");
			}

			navbar.el.el.setAttribute("id", "navbar");

			navbar.addIconButton("icon icon-stackexchange", "History", 45);
			navbar.addIconButton("icon icon-cog", "Settings", 45);

			// Make the tabview panel container independent so we can hide it underneath the main splitview
			hbox.el.appendChild(navTabView.getPanelContainer().el);

			hbox.on("resize", function(e) {
				navTabView.resize(240, e.height);
			});

			navTabView.setIconButtonBar(navbar);

			navTabView.on("baractivate", function() {
				openHistoryPanel();
			}).on("panelclose", function() {
				closeHistoryPanel();
			}).on("bardeactivate", function() {
				closeHistoryPanel();
			});

			navTabView.getPanelContainer().el.setAttribute("id", "history-container");
			navTabView.addPanel(historyContainer);
		},

		/*
		 * 
		 * 
		 * @param name String The name of the extension
		 * @param viewer Object fBox or Cell element to show rendered content
		 */
		registerRenderer : function(renderer) {
			var name = renderer.getName();
			if (renderers[name])
				return false;

			var dropdown_value = name.replace(/[^0-9a-zA-Z]+/, "").toLowerCase();
			modeSelector.appendChild(domify('<option value="' + dropdown_value + '">' + name + '</option>'));

			renderers[dropdown_value] = renderer;

			if (outputContainer.children.length === 0)
				this.changeRenderer(dropdown_value);
		},

		changeRenderer : function(dropdown_value) {
			var renderer = renderers[dropdown_value];

			if (outputContainer.children.length) {
				outputContainer.remove(0);
				outputContainer.el.removeChild(iFrameCover.el);
			}

			outputContainer.add(renderer.getViewer(), -1);
			outputContainer.el.appendChild(iFrameCover.el);

			activeRenderer && activeRenderer.disable();

			activeRenderer = renderers[dropdown_value];
			editor && activeRenderer.enable(editor.getValue());
		},

		getEditor : function() {
			return editor;
		},

		setupEditor : function() {
			var that = this, timeout;

			editor = ace.edit("editor");
			editor.setTheme("ace/theme/xcode");

			editor.on("change", function(e) {
				editorContents = editor.getValue();
				if (enableSave === true) {
					stashedEditorSession = {
						  contents : editorContents
						, title : documentName.innerText
					}
				}

				that.emit("run", {
					editorContents : editorContents
				});

				if (enableSave === true) {
					clearTimeout(timeout);
					timeout = setTimeout(function() {
						// Save changes to the server
						connHandler.sendMessage({
							  cmd: "save"
							, guid : sessionGuid
							, code : editorContents
						});
					}, 300);
				}
			});

			enableSave = false;
			editor.setValue(
				['<html>\n<head>\n<style type="text/css">\n\n</style>\n</head>',
					'\n<body>\n\n<script type="text/javascript">\n\t\n\t\n</script>\n</body>',
					'\n</html>'].join(''));
			editor.gotoLine(11);
			setTimeout(function() {
				stashedEditorSession = {
					  contents : editor.getValue()
					, title : documentName.innerText
				}
				enableSave = true;
			}, 350);

			activeRenderer.enable(editor.getValue());
		}
	};

	Emitter(sandboxController);
	return sandboxController;
})();
