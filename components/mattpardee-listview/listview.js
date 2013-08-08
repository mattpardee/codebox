var vBox = require('fbox').VBox
	, hBox = require('fbox').HBox
	, Cell = require('fboxcell').Cell
	, domify = require('domify')
	, IconButton = require('iconbutton').IconButton
	, Emitter = require('emitter');

exports.ListView = ListView;

function ListView() {
	var el = new vBox()
		, listContainer = new vBox()
		, listItems = {}
		, counter = 0
		, headerBar = new hBox()
		, editButton
		, activeListElement;

	var listView = {
		el : el,

		init : function() {
			var that = this;
			editButton = new IconButton("icon icon-edit", "Edit List", function(e) {
				that.toggleEditMode();
			});

			editButton.el.innerText = "Edit";

			el.el.classList.add("listview");
			headerBar.el.classList.add("listheader");
			headerBar.add(new hBox(), -1);
			headerBar.add(editButton, 60);
			el.add(headerBar, 33);

			listContainer.el.classList.add("listitemcontainer");
			el.add(listContainer, -1);
		},

		toggleEditMode : function() {
			if (el.el.classList.contains("editmode"))
				el.el.classList.remove("editmode")
			else
				el.el.classList.add("editmode");
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

			listItem.on("delete", function(e) {
				var index = that.removeListItem(e.item.el);
				if (index !== -1) {
					e.item.destroy();
					delete listItems[index];
				}
			});

			listItems[counter++] = listItem;
			listContainer.add(listItem.el, 50);
			return listItem;
		},

		removeListItem : function(el) {
			for (var i = 0, len = listContainer.children.length; i < len; i++) {
				if (el === listContainer.children[i]) {
					el.el.classList.add("removing");
					setTimeout(function() {
						listContainer.remove(i);
					}, 150);
					return i;
				}
			}

			return -1;
		}
	};

	listView.init();

	return listView;
}

function ListItem(innerHTML, data) {
	var elCell = new hBox()
		, selector = new Cell('<div><div class="selector"></div></div>')
		, deleteIcon = domify('<i class="delete-item"><span></span></i>');

	var listItem = {
		el : elCell,

		init : function() {
			elCell.el.classList.add("listitem");

			selector.el.childNodes[0].appendChild(deleteIcon);
			elCell.add(selector, 40);

			this.deleteClickListener = function(e) {
				e.stopPropagation();
				listItem.emit("delete", {
					  event : e
					, data  : data
					, item  : listItem
				})
			};

			this.elMouseoverListener = function(evt) {
				listItem.emit("mouseover", {
					  el   : elCell.el
					, data : data
				});
			};

			this.elMouseoutListener = function(evt) {
				listItem.emit("mouseout", {
					  el   : elCell.el
					, data : data
				});
			};

			this.elMouseclickListener = function(evt) {
				listItem.emit("selected", {
					  el   : elCell.el
					, data : data
				});
			};

			deleteIcon.addEventListener("click", this.deleteClickListener);
			elCell.el.addEventListener("mouseover", this.elMouseoverListener);
			elCell.el.addEventListener("mouseout", this.elMouseoutListener);
			elCell.el.addEventListener("click", this.elMouseclickListener);

			elCell.add(new Cell(innerHTML), -1);
		},

		select : function() {
			this.emit("selected", {
				  el   : elCell.el
				, data : data
			});
		},

		destroy : function() {
			deleteIcon.removeEventListener("click", this.deleteClickListener);
			elCell.el.removeEventListener("mouseover", this.elMouseoverListener);
			elCell.el.removeEventListener("mouseout", this.elMouseoutListener);
			elCell.el.removeEventListener("click", this.elMouseclickListener);
		}
	};

	listItem.init();

	Emitter(listItem);
	return listItem;
}