var Emitter = require('emitter');

function FBox(el) {
  el = el || document.createElement("div");
  el.classList.add("fbox");
  this.el = el;
  this.children = [];
  this.sizes = [];
  this.width = null;
  this.height = null;
}

// Child is an object with an .el element and .resize(w, h) method.
FBox.prototype.add = function (child, size) {
  this.children.push(child);
  if (child) {
    this.el.appendChild(child.el);
  }
  if (arguments.length < 2) {
    size = -1;
  }
  this.sizes.push(size);
  this.resize();
};

// Removes a child by index
FBox.prototype.remove = function (index) {
  var child = this.children.splice(index, 1)[0];
  this.sizes.splice(index, 1);
  if (child) {
    this.el.removeChild(child.el);
  }
  this.resize();
};

FBox.prototype.fit = function (size) {
  // Calculate the sizes
  var i, l = this.sizes.length;
  // Sum up the fixed and flex sizes
  var flexCount = 0, weight, part;
  for (i = 0; i < l; i++) {
    part = this.sizes[i];
    // Negative size means flex space
    if (part < 0) {
      weight = -part;
      flexCount += weight;
    }
    // Positive size is fixed pixel count
    else {
      size -= part;
    }
  }

  var sizes = new Array(l);
  for (i = 0; i < l; i++) {
    part = this.sizes[i];
    if (part < 0) {
      weight = -part;
      var flex = Math.floor(size / flexCount * weight);
      sizes[i] = flex;
      size -= flex;
      flexCount -= weight;
    }
    else {
      sizes[i] = part;
    }
  }

  return sizes;
};

Emitter(FBox.prototype);

exports.HBox = HBox;
function HBox(el) {
  FBox.apply(this, arguments);
}

HBox.prototype = Object.create(FBox.prototype, {constructor: {value: HBox}});


function isNumber(value) {
  return typeof value === "number" && !isNaN(value);
}

// Call resize with the size you want it to fit into
HBox.prototype.resize = function (width, height) {

  if (arguments.length === 0) {
    if (!isNumber(this.width) || !isNumber(this.height)) {
      return;
    }
    width = this.width;
    height = this.height;
  }
  else {
    if (!isNumber(width) || !isNumber(height)) {
      throw new TypeError("width and height must be numbers");
    }
    this.width = width;
    this.height = height;
  }

  this.el.style.width = width + "px";
  this.el.style.height = height + "px";


  var widths = this.fit(width);
  var left = 0;
  this.children.forEach(function (child, i) {
    if (child) {
      child.el.style.left = left + "px";
      child.resize(widths[i], height);
    }
    left += widths[i];
  });

  this.emit("resize", {
      width : width
    , height : height
  });
};

exports.VBox = VBox;
function VBox(el) {
  FBox.apply(this, arguments);
}

VBox.prototype = Object.create(FBox.prototype, {constructor: {value: VBox}});

// Call resize with the size you want it to fit into
VBox.prototype.resize = function (width, height) {
  // Can't resize if there is no size to fit into
  if (!arguments.length) {
    if (this.height === null) return;
    width = this.width;
    height = this.height;
  }

  this.width = width;
  this.height = height;

  this.el.style.width = width + "px";
  this.el.style.height = height + "px";

  var heights = this.fit(height);
  var top = 0;
  this.children.forEach(function (child, i) {
    if (child) {
      child.el.style.top = top + "px";
      child.resize(width, heights[i]);
    }
    top += heights[i];
  });

  this.emit("resize", {
      width : width
    , height : height
  });
};