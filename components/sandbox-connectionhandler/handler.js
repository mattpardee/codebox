var Emitter = require('emitter');

function ConnectionHandler(host) {
	this.host = host;
}

ConnectionHandler.prototype.connect = function() {
	this.ws = new WebSocket(this.host);
	var that = this;
	this.ws.onopen = function() {
		that.emit("connected");
	};
	this.ws.onmessage = function (evt) {
		that.emit("message", evt);
	};
	this.ws.onclose = function() {
		that.emit("disconnected");
	};
};

ConnectionHandler.prototype.sendMessage = function(msg) {
	msg = (typeof msg === 'object' ? JSON.stringify(msg) : msg);
	this.ws.send(msg);
	this.emit("sentmessage", msg);
};

// Inherit emitter properties
Emitter(ConnectionHandler.prototype);
module.exports = ConnectionHandler;