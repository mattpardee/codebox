var vBox = require('fbox').VBox
	, hBox = require('fbox').HBox
	, splitView = require('splitview').SplitView
	, IconButtonBar = require('iconbuttonbar').IconButtonBar
	, model = require('model')
	, Collection = require('collection')
	, domify = require('domify')
	, Emitter = require('emitter')
	, Cell = require('fboxcell').Cell
	, TabView = require('tabview').TabView
	, ListView = require('listview').ListView;

var SandboxController = exports.SandboxController = (function() {
	var connHandler
		, DocumentModel = model('Document')
		, documentCollection = new Collection()
		, currentDocModel
		, parentContainer
		, renderers = {}
		, activeRenderer
		, renderersDropdownList = []
		, runnerEnabled = true
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
		, codeDocListview = new ListView()
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
				catch (e) {}

				console.log(data);
				switch (data.cmd) {
					case "handshake":
						sessionGuid = data.guid;

						// Construct our document model based on the schema
						// the server has sent us
						for (var sprop in data.schema) {
							DocumentModel.attr(sprop, {
								type : data.schema[sprop].type
							});
						}

						// Set our new empty document
						docModelHelper({
							  title   : "Untitled"
							, code    : editor.getValue()
							, doctype : "htmljavascript"
							, guid    : sessionGuid
						});

						codeDocListview.setActiveListItem(0);

						function docModelHelper(data) {
							var documentModel = new DocumentModel(data);
							documentCollection.push(documentModel);

							that.addCodeDocument(
								  data.title
								, data.code
								, data.doctype
								, data.guid
								, data.updated ? new Date(data.updated).toLocaleString() : null
							);

							documentModel.on("change", function(name, val, prev) {
								//console.log("updated model", this.get("guid"), name, val, prev);
								connHandler && connHandler.sendMessage({
									  cmd       : "updateattr"
									, attribute : name
									, attribute_value : val
									, guid      : this.get("guid")
								});
							});
						}

						for (var i = 0, len = data.history.length; i < len; i++) {
							docModelHelper(data.history[i]);
						}

						currentDocModel = documentCollection.models[0];
						break;

					default:
						break;
				}
			});
		},

		addCodeDocument : function(title, code, doctype, guid, updated) {
			var that = this;

			codeDocListview.addListItem(

				  ['<div><div class="litext">',
						, title
						, '<br />'
						, updated || new Date(Date.now()).toLocaleString()
						, '</div></div>'
				  ].join('')

			).on("mouseover", function(e) {

				enableSave = false;
				runnerEnabled = false;
				var listViewIndex = codeDocListview.getItemIndex(e.listItem.el);
				documentName.innerText = documentCollection.models[listViewIndex].get('title');
				editor.setValue(documentCollection.models[listViewIndex].get('code'));
				editor.gotoLine(1);

			}).on("mouseout", function() {

				if (enableSave)
					return;

				editor.setValue(stashedEditorSession.contents);
				documentName.innerText = stashedEditorSession.title;
				editor.gotoLine(1);
				enableSave = true;
				runnerEnabled = true;

			}).on("selected", function(e) {

				runnerEnabled = true;

				navTabView.closePanelContainer();

				var listViewIndex = codeDocListview.getItemIndex(e.listItem.el);
				currentDocModel = documentCollection.models[listViewIndex];

				if (currentDocModel.get('title') === "Untitled")
					documentName.classList.remove("modified");
				else
					documentName.classList.add("modified");

				connHandler.sendMessage({
					  cmd  : "changesession"
					, guid : currentDocModel.get('guid')
				});

				modeSelector.selectedIndex = renderersDropdownList.indexOf(currentDocModel.get('doctype'));
				that.changeRenderer(currentDocModel.get('doctype'), false);

				documentName.innerText = currentDocModel.get('title');
				editor.setValue(currentDocModel.get('code'));
				editor.gotoLine(1);

				stashedEditorSession = {
					  contents : currentDocModel.get('code')
					, title : currentDocModel.get('title')
				}

				enableSave = true;

			}).on("delete", function(e) {

				// TODO: Do we need to do anything else besides this?
				var listViewIndex = codeDocListview.getItemIndex(e.listItem.el);

				connHandler.sendMessage({
					  cmd  : "delete"
					, guid : documentCollection.models[listViewIndex].get('guid')
				});

				documentCollection.models.splice(listViewIndex, 1);
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
			documentName.addEventListener("keydown", function(e) {
				if (e.keyCode === 13) {
					e.preventDefault();
					return false;
				}
			});
			documentName.addEventListener("keyup", function(e) {
				this.classList.add("modified");
				if (e.keyCode === 13)
					this.blur();
			});
			documentName.addEventListener("blur", function() {
				if (this.classList.contains("modified")) {
					currentDocModel.set({ "title" : this.innerText });
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
			navTabView.addPanel(codeDocListview);
		},

		/*
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
			renderersDropdownList.push(dropdown_value);

			if (outputContainer.children.length === 0)
				this.changeRenderer(dropdown_value);
		},

		changeRenderer : function(dropdown_value, save) {
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

			if (save === true || typeof save === "undefined") {
				currentDocModel && currentDocModel.set({ "doctype" : dropdown_value });
			}
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

				if (runnerEnabled)
					that.emit("run", { editorContents : editorContents });

				if (enableSave === true) {
					stashedEditorSession = {
						  contents : editorContents
						, title : documentName.innerText
					}

					clearTimeout(timeout);
					timeout = setTimeout(function() {
						currentDocModel.set({ "code" : editorContents });
					}, 1000);
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
					, title    : documentName.innerText
				}
				enableSave = true;
			}, 350);

			activeRenderer.enable(editor.getValue());
		}
	};

	Emitter(sandboxController);
	return sandboxController;
})();
