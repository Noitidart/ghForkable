const {interfaces: Ci,	utils: Cu} = Components;
Cu.import('resource://gre/modules/Services.jsm');
const chromePath = 'chrome://ghforkable/content/';
const locationToMatch = /http.?:\/\/(.*?.)?github\./;

function addDiv(theDoc) {
	Cu.reportError('addDiv');
	if (!theDoc) {
		Cu.reportError('no theDoc!')
		//document not provided, it is undefined likely
		return;
	}
	var location = (theDoc.location + '');
	if (!locationToMatch.test(location)) {
		Cu.reportError('location doesnt match = "' + location + '"');
		return;
	}
	Cu.reportError('theDoc location matches locationToMatch:' + theDoc.location)
	if (!theDoc instanceof Ci.nsIDOMHTMLDocument) {
		//not html document, so its likely an xul document
		Cu.reportError('theDoc is not an HTML document, it is probably XUL, since i chose to add HTML element, i dont want to add to xul elements, so exit');
		return;
	}
	removeDiv(theDoc);
	var script = theDoc.createElement('script');
	script.setAttribute('src', chromePath + 'inject.js');
	script.setAttribute('id', 'ghForkable_inject');
	theDoc.documentElement.appendChild(script);
}

function removeDiv(theDoc) {
	//Cu.reportError('removeDiv');
	if (!theDoc) {
		Cu.reportError('no theDoc!')
		//document not provided, it is undefined likely
		return;
	}
	var location = (theDoc.location + '');
	if (!locationToMatch.test(location)) {
		return;
	}
	//Cu.reportError('theDoc location matches locationToMatch:' + theDoc.location)
	if (!theDoc instanceof Ci.nsIDOMHTMLDocument) {
		//not html document, so its likely an xul document
		Cu.reportError('theDoc is not an HTML document, it is probably XUL, since i chose to add HTML element, i dont want to add to xul elements, so exit');
		return;
	}
	var alreadyThere = theDoc.querySelector('#ghForkable_inject');
	if (alreadyThere) {
		alreadyThere.parentNode.removeChild(alreadyThere);
	}
	
	var forkBtn = theDoc.querySelector('.ghForkable_fork');
	if (forkBtn) {
		forkBtn.parentNode.removeChild(forkBtn);
	}
}

function listenPageLoad(event) {
	var win = event.originalTarget.defaultView;
	var doc = win.document;
	Cu.reportError('page loaded loc = ' + doc.location);
	if (win.frameElement) {
		//its a frame
		Cu.reportError('its a frame');
		return;//dont want to watch frames
	}
	addDiv(doc);
}

function listenPageShow(event) {
	var win = event.originalTarget.defaultView;
	var doc = win.document;
	Cu.reportError('pageshowed ' + win.frameElement.location)
	if (win.frameElement) {
		//its a frame
		Cu.reportError('its a frame');
		return;//dont want to watch frames
	}
}

/*start - windowlistener*/
var windowListener = {
	//DO NOT EDIT HERE
	onOpenWindow: function (aXULWindow) {
		// Wait for the window to finish loading
		let aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
		aDOMWindow.addEventListener("load", function () {
			aDOMWindow.removeEventListener("load", arguments.callee, false);
			windowListener.loadIntoWindow(aDOMWindow, aXULWindow);
		}, false);
	},
	onCloseWindow: function (aXULWindow) {},
	onWindowTitleChange: function (aXULWindow, aNewTitle) {},
	register: function () {
		// Load into any existing windows
		let XULWindows = Services.wm.getXULWindowEnumerator(null);
		while (XULWindows.hasMoreElements()) {
			let aXULWindow = XULWindows.getNext();
			let aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
			windowListener.loadIntoWindow(aDOMWindow, aXULWindow);
		}
		// Listen to new windows
		Services.wm.addListener(windowListener);
	},
	unregister: function () {
		// Unload from any existing windows
		let XULWindows = Services.wm.getXULWindowEnumerator(null);
		while (XULWindows.hasMoreElements()) {
			let aXULWindow = XULWindows.getNext();
			let aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
			windowListener.unloadFromWindow(aDOMWindow, aXULWindow);
		}
		//Stop listening so future added windows dont get this attached
		Services.wm.removeListener(windowListener);
	},
	//END - DO NOT EDIT HERE
	loadIntoWindow: function (aDOMWindow, aXULWindow) {
		if (!aDOMWindow) {
			return;
		}
		if (aDOMWindow.gBrowser) {
			aDOMWindow.gBrowser.addEventListener('DOMContentLoaded', listenPageLoad, false);
			if (aDOMWindow.gBrowser.tabContainer) {
				//has tabContainer
				//start - go through all tabs in this window we just added to
				var tabs = aDOMWindow.gBrowser.tabContainer.childNodes;
				for (var i = 0; i < tabs.length; i++) {
					Cu.reportError('DOING tab: ' + i);
					var tabBrowser = tabs[i].linkedBrowser;
					var win = tabBrowser.contentWindow;
					loadIntoContentWindowAndItsFrames(win);
				}
				//end - go through all tabs in this window we just added to
			} else {
				//does not have tabContainer
				var win = aDOMWindow.gBrowser.contentWindow;
				loadIntoContentWindowAndItsFrames(win);
			}
		} else {
			//window does not have gBrowser
		}
	},
	unloadFromWindow: function (aDOMWindow, aXULWindow) {
		if (!aDOMWindow) {
			return;
		}
		if (aDOMWindow.gBrowser) {
			aDOMWindow.gBrowser.removeEventListener('DOMContentLoaded', listenPageLoad, false);
			if (aDOMWindow.gBrowser.tabContainer) {
				//has tabContainer
				//start - go through all tabs in this window we just added to
				var tabs = aDOMWindow.gBrowser.tabContainer.childNodes;
				for (var i = 0; i < tabs.length; i++) {
					Cu.reportError('DOING tab: ' + i);
					var tabBrowser = tabs[i].linkedBrowser;
					var win = tabBrowser.contentWindow;
					unloadFromContentWindowAndItsFrames(win);
				}
				//end - go through all tabs in this window we just added to
			} else {
				//does not have tabContainer
				var win = aDOMWindow.gBrowser.contentWindow;
				unloadFromContentWindowAndItsFrames(win);
			}
		} else {
			//window does not have gBrowser
		}
	}
};
/*end - windowlistener*/

function loadIntoContentWindowAndItsFrames(theWin) {
	var frames = theWin.frames;
	var winArr = [theWin];
	for (var j = 0; j < frames.length; j++) {
		winArr.push(frames[j].window);
	}
	Cu.reportError('# of frames in tab: ' + frames.length);
	for (var j = 0; j < winArr.length; j++) {
		if (j == 0) {
			Cu.reportError('**checking win: ' + j + ' location = ' + winArr[j].document.location);
		} else {
			Cu.reportError('**checking frame win: ' + j + ' location = ' + winArr[j].document.location);
		}
		var doc = winArr[j].document;
		//START - edit below here
		addDiv(doc);
		break; //uncomment this line if you don't want to add to frames
		//END - edit above here
	}
}

function unloadFromContentWindowAndItsFrames(theWin) {
	var frames = theWin.frames;
	var winArr = [theWin];
	for (var j = 0; j < frames.length; j++) {
		winArr.push(frames[j].window);
	}
	Cu.reportError('# of frames in tab: ' + frames.length);
	for (var j = 0; j < winArr.length; j++) {
		if (j == 0) {
			Cu.reportError('**checking win: ' + j + ' location = ' + winArr[j].document.location);
		} else {
			Cu.reportError('**checking frame win: ' + j + ' location = ' + winArr[j].document.location);
		}
		var doc = winArr[j].document;
		//START - edit below here
		removeDiv(doc);
		break; //uncomment this line if you don't want to remove from frames
		//END - edit above here
	}
}

function startup(aData, aReason) {
	windowListener.register();
}

function shutdown(aData, aReason) {
	if (aReason == APP_SHUTDOWN) return;
	windowListener.unregister();
}

function install() {}

function uninstall() {}