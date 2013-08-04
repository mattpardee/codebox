var Emitter = require('emitter');

exports.SplitView = SplitView;

function isNumber(value) {
  return typeof value === "number" && !isNaN(value);
}

function SplitView(options) {
    var orientation = options.orientation || "left"
        , el = options.el || document.createElement("div")
        , size = options.size || 200
        , defaultSize = size
        , savedSize = 0
        , width
        , height
        , horizontal = false
        , sliderEl
        , position = null
        , side
        , main
        , isTouch;

    if (orientation === "left" || orientation === "right") {
        el.classList.add("splitview");
        el.classList.add("horizontal");
        horizontal = true;
    }
    else if (orientation === "top" || orientation === "bottom") {
        el.classList.add("splitview");
        el.classList.add("vertical");
    }
    else {
      throw new Error("options.orientation must be one of 'left', 'right', 'top', or 'bottom'");
    }

    sliderEl = document.createElement("div");
    el.appendChild(sliderEl);

    sliderEl.classList.add("slider");

    var splitView = {
        el : el,

        addSide : function (obj) {
            if (side)
                el.removeChild(side.el);
            side = obj;
            el.appendChild(obj.el);
            this.resize();
        },

        addMain : function (obj) {
            if (main)
                el.removeChild(main.el);
            main = obj;
            el.appendChild(obj.el);
            this.resize();
        },

        toggleSide : function () {
            if (size)
                this.hideSide();
            else
                this.showSide();
        },

        hideSide : function () {
            savedSize = size;
            size = 0;
            this.resize();
        },

        showSide : function () {
            if (savedSize) {
                size = savedSize;
                savedSize = 0;
            }
            else {
                size = defaultSize;
            }
            this.resize();
        },

        resize : function(w, h) {
            if (arguments.length === 0) {
                if (!isNumber(width) || !isNumber(height))
                    return;
                w = width;
                h = height;
            }
            else {
                if (!isNumber(w) || !isNumber(h))
                    throw new TypeError("width and height must be numbers");
                width = w;
                height = h;
            }

            el.style.width = width + "px";
            el.style.height = height + "px";

            if (horizontal) {
                if (size > width)
                    size = width;
            }
            else {
                if (size > height)
                    size = height;
            }

            if (size < 0)
                size = 0;

            sliderEl.style[orientation] = size + "px";
            if (side) {
                side.el.style[orientation] = 0;
                if (horizontal)
                    side.resize(size + 5, height);
                else
                    side.resize(width, size + 5);
            }
            if (main) {
                main.el.style[orientation] = (size + 5) + "px";
                if (horizontal)
                    main.resize(width - (size + 5), height);
                else
                    main.resize(width, height - (size + 5));
            }

            splitView.emit("resize", {
                size: size + 5,
                width: width,
                height: height
            });
        },

        onStart : function(evt) {
            if (position !== null)
                return;
            evt.preventDefault();
            evt.stopPropagation();
            if (evt.touches) {
                evt = evt.touches[0];
                isTouch = true;
            }
            else {
                isTouch = false;
            }

            if (horizontal)
                position = evt.clientX;
            else
                position = evt.clientY;

            if (isTouch) {
              window.addEventListener("touchmove", splitView.onMove, true);
              window.addEventListener("touchend", splitView.onEnd, true);
            }
            else {
              window.addEventListener("mousemove", splitView.onMove, true);
              window.addEventListener("mouseup", splitView.onEnd, true);
            }

            splitView.emit("onstart", {});
        },

        onMove : function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            if (evt.touches)
                evt = evt.touches[0];
            var delta;

            if (horizontal) {
                delta = evt.clientX - position;
                position = evt.clientX;
                if (orientation === "left")
                    size += delta;
                else
                    size -= delta;
            }
            else {
                delta = evt.clientY - position;
                position = evt.clientY;
                if (orientation === "top")
                    size += delta;
                else
                    size -= delta;
            }

            if (savedSize)
              savedSize = undefined;

            splitView.resize();
        },

        onEnd : function(evt) {
            if (isTouch) {
                window.removeEventListener("touchmove", splitView.onMove, true);
                window.removeEventListener("touchend", splitView.onEnd, true);
            }
            else {
                window.removeEventListener("mousemove", splitView.onMove, true);
                window.removeEventListener("mouseup", splitView.onEnd, true);
            }

            position = null;
            isTouch = null;

            splitView.emit("onend", {});
        }
    };

    sliderEl.addEventListener("mousedown", splitView.onStart, true);
    sliderEl.addEventListener("touchstart", splitView.onStart, true);

    Emitter(splitView);

    return splitView;
}