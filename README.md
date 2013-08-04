#Code Sandbox

_A general purpose coding utility with live rendering and autosaving to a
mongo backend._

**HTML/JS mode**

![](https://dsz91cxz97a03.cloudfront.net/MaG65eAbTT-1200x1200.png)

**Markdown Mode** (also shows the document sidebar)

![](https://dsz91cxz97a03.cloudfront.net/H65ACwMoFX-3000x3000.png)

To use:

```
$ npm install
$ npm install -g uglify-js
$ component build -v && uglifyjs build/build.js -o build/build.min.js
$ Spin up a local, un-auth'd mongod (you can change those settings in server/server.js)
$ node server/server
```

Then open `index.html` in Chrome, Safari, FF (, Opera, IE?)


##About

I first built this because I was doing a lot of interviews and
they wanted to see how I worked with JavaScript. So rather than
do the `Edit->Save->Switch Window->Hard Refresh` workflow, I
simply built a tool to live-inject my javascript into an iFrame.

After I landed a job (yay!) I decided to make it a bit more
advanced by auto-saving every change to MongoDB and providing
a document extension model so more types of live rendererd
documents could be handled. At the time of this writing it
handles HTML/JS and Markdown.


##Architecture

I used TJ's [component](http://github.com/component) for the UI foundation
(and sloppyily found myself using it as the foundation for my controllers,
which eventually I'd like to put into its own folder). At least for the UI
stuff I found it to be quite a brilliant solution. In particular
[Tim Caswell](http://github.com/creationix)'s flexbox and splitbox
implementations were tremendously useful.

Ultimately I needed to modify Tim's components for some functional and
aesthetic reasons and so I'll likely put those changes in my own component
repos. One of the many todos :-)

Editor component is [Ace](http://ace.c9.io).

Node.js runs the websocket server. It's not very robust nor secure
(limited message validation, no reconnection logic, only websocket
support, no alternate protocols).
