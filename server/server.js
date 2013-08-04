var WebSocketServer = require('ws').Server
	, mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, wss = new WebSocketServer({port: 1515});

/*
 * Mongoose code
 */
var CodeBlobSchema = new Schema({
      "guid"    : { type: String }
    , "title"   : { type: String, default: "Untitled" }
    , "doctype" : { type: String, default: "htmljavascript" }
    , "code"    : { type: String }
    , "updated" : { type: Date, default: Date.now }
});

var CodeBlob = mongoose.model("codeblobs", CodeBlobSchema);

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function() {
    console.log('MongoDB connection opened');
});

var m = mongoose.connect("mongodb://localhost:27017/js-sandbox");
/*
 * End mongoose code
 */

/*
 * GUID code
 */
function s4() {
	return Math.floor((1 + Math.random()) * 0x10000)
           .toString(16)
           .substring(1);
}

function generateGuid() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
       	s4() + '-' + s4() + s4() + s4();
}

wss.on('connection', function(ws) {
	function helper (ws) {
		var session = new Session(ws);
		ws.on('close', function() {
			delete session;
		})
	}

	helper(ws);
});

function Session(ws) {
	var guid = generateGuid()
	    , codeBlob = new CodeBlob({
			  "guid" : guid
		    , "code" : ""
		  })
	    , alreadySaved = false;

	var query = CodeBlob.find();
	query.select("guid title doctype code updated -_id");
	query.sort({updated: -1});
	query.exec(function(err, codes) {
		ws.send(JSON.stringify({
			  'cmd'     : 'handshake'
			, 'guid'    : guid
			, 'history' : codes
		}));
	});

	function saveUnsavedBlob() {
		codeBlob.save(function(err) {
			if (err)
				console.log("error saving codeblob", err);
		});
		alreadySaved = true;
	}

	function updateBlob(update_attrs) {
		if (alreadySaved === false) {
			saveUnsavedBlob();
			return;
		}

		update_attrs.updated = Date.now();

		CodeBlob.findOneAndUpdate({
				guid : codeBlob.guid
			},
			update_attrs,
			function(err, cblob) {
				if (err)
					console.log("error finding & saving codeblob", err);
				if (!cblob) {
					codeBlob.save(function(err) {
						if (err)
							console.log("error saving codeblob", err);
					});
				}
			}
		);
	}

    ws.on('message', function(message) {
    	try {
    		message = JSON.parse(message);
    	}
    	catch (e) {

    	}

        switch (message.cmd) {
        	case "save":
    			codeBlob.code = message.code;
	    		updateBlob({ code : codeBlob.code });
        		break;

        	case "updatetitle":
        		codeBlob.title = message.title;
	    		updateBlob({ title : codeBlob.title });
        		break;

        	case "changesession":
        		codeBlob.guid = message.guid;
        		alreadySaved = true;
        		break;

        	default:
        		break;
        }
    });
}