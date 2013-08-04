var vBox = require('fbox').VBox
	, Cell = require('fboxcell').Cell
	, domify = require('domify')
	, Emitter = require('emitter');

exports.ListView = ListView;

function ListView() {
	var el = new vBox()
		, listItems = {}
		, counter = 0
		, activeListElement;

	el.el.classList.add("listview");

	var listView = {
		el : el,

		// defunct?
		getEl : function() {
			return el;
		},

		// defunct?
		resize : function(width, height) {
			el.resize(width, height);
		},

		setActiveListItem : function(el) {
			if (typeof el === "number") {
				listItems[el].select();
				el = listItems[el].el.el;
			}
			if (activeListElement === el)
				return;

			if (activeListElement)
				activeListElement.classList.remove("selected");
			el.classList.add("selected");
			activeListElement = el;
		},

		addListItem : function(innerHTML, data) {
			var listItem = new ListItem(innerHTML, data);
			var that = this;
			listItem.on("selected", function(e) {
				that.setActiveListItem(e.el);
			});
			listItems[counter++] = listItem;
			el.add(listItem.el, 50);
			return listItem;
		}
	};

	Emitter(listView);
	return listView;
}

function ListItem(innerHTML, data) {
	var elCell = new Cell('<div class="listitem"></div>');

	elCell.el.addEventListener("mouseover", function(evt) {
		listItem.emit("mouseover", {
			  el   : elCell.el
			, data : data
		});
	});

	elCell.el.addEventListener("mouseout", function(evt) {
		listItem.emit("mouseout", {
			  el   : elCell.el
			, data : data
		});
	});

	elCell.el.addEventListener("click", function(evt) {
		listItem.emit("selected", {
			  el   : elCell.el
			, data : data
		});
	});

	elCell.el.appendChild(domify(innerHTML));

	var listItem = {
		el : elCell,

		select : function() {
			this.emit("selected", {
				  el   : elCell.el
				, data : data
			});
		}
	};

	Emitter(listItem);
	return listItem;
}