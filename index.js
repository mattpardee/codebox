var hBox = require('fbox').HBox;
var vBox = require('fbox').VBox;
var splitView = require('splitview').SplitView;
var Cell = require('fboxcell').Cell;
var ConnectionHandler = require('connectionhandler');
var SandboxController = require('sandboxcontroller').SandboxController;
var extHtmlJs = require('exthtmljs');
var extMarkdown = require('extmarkdown');

var JSSandbox = (function() {
	var appbox
		, header
		, connectionStatus
		, ch = new ConnectionHandler('ws://localhost:1515');

	return {
		init : function() {
			this.scaffoldUI();
			SandboxController.setConnectionHandler(ch);
			SandboxController.init(appbox);

			this.setupWindowListeners();
			this.resizeApp();

			ch.connect();

			// Some global status indicators?
			ch.on("connected", function() {
				document.getElementById("connection_status").classList.remove("disconnected");
			});
			ch.on("disconnected", function() {
				document.getElementById("connection_status").classList.add("disconnected");
			});
		},

		setupWindowListeners : function() {
			var that = this;
			window.addEventListener("resize", function() {
				that.resizeApp();
			});
		},

		resizeApp : function() {
			appbox.resize(window.innerWidth, window.innerHeight);
		},

		scaffoldUI : function() {
			appbox = new vBox();
			var header = new hBox();
			header.el.setAttribute("id", "app-header");
			var logoCell = new Cell(
				['<div id="header-logo">',
					'<img src="assets/images/logo_icon.png" width="22" /> <span>Code Sandbox</span>',
				'</div>'].join(''));
			header.add(logoCell, -1);

			connectionStatus = new Cell('<div id="connection_status" class="disconnected"><i class="icon icon-circle-blank"></i></div>')
			header.add(connectionStatus, 55);

			appbox.add(header, 50);

			document.body.appendChild(appbox.el);
		}
	}
})();

JSSandbox.init();