var domify = require('domify');

function Cell(html) {
	this.el = domify(html);
}

Cell.prototype.resize = function (width, height) {
  this.el.style.width = width + "px";
  this.el.style.height = height + "px";
};

exports.Cell = Cell;