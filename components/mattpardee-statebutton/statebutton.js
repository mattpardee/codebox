module.exports = StateButton;

function StateButton(icon, title, onClick) {
    var el = document.createElement("a")
        , icon
        , iconEl
        , disabled;

    var stateButton = {
        el : el,

        init : function() {
            el.className = "statebutton";
            el.setAttribute("title", title);

            el.addEventListener("click", function(evt) {
                if (disabled) return;
                if (this.classList.contains("active"))
                    this.classList.remove("active");
                else
                    this.classList.add("active");
                return onClick.call(this, evt);
            }, false);

            iconEl = icon = document.createElement("i");
            iconEl.className = icon;
            el.appendChild(iconEl);
        },

        resize : function(width, height) {
            el.style.width = width + "px";
            el.style.height = height + "px";
            el.style.lineHeight = height + "px";
        },

        enableIf : function(condition) {
            disabled = !condition;
            if (condition)
                el.classList.remove("disabled");
            else
                el.classList.add("disabled");
        }
    };

    stateButton.init();
    return stateButton;
}