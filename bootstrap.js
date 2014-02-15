const {interfaces: Ci,	utils: Cu} = Components;
Cu.import('resource://gre/modules/Services.jsm');
const pathChrome = 'chrome://ghforkable/content/';
const pathContentaccessible = 'chrome://ghforkable_contentaccessible/content/';
const ignoreFrames = true;

function addDiv(theDoc) {
	
	if (!theDoc) {  return; } //document not provided, it is undefined likely
	if (!theDoc instanceof Ci.nsIDOMHTMLDocument) {  return; } //not html document, so its likely an xul document
	if(!(theDoc.location && theDoc.location.host.indexOf('github.com') > -1)) {  return; }
	
	removeDiv(theDoc, true);
	var script = theDoc.createElement('script');
	script.setAttribute('src', pathContentaccessible + 'inject.js');
	script.setAttribute('id', 'ghForkable_inject');
	theDoc.documentElement.appendChild(script);
	
	
}

function removeDiv(theDoc, skipChecks) {
	//
	if (!skipChecks) {
		if (!theDoc) {  return; } //document not provided, it is undefined likely
		if (!theDoc instanceof Ci.nsIDOMHTMLDocument) {  return; } //not html document, so its likely an xul document
		if(!(theDoc.location && theDoc.location.host.indexOf('github.com') > -1)) {  return; }
	}
	
	var alreadyThere = theDoc.querySelector('#ghForkable_inject');
	if (alreadyThere) {
		
		var removePjaxListener = theDoc.defaultView.wrappedJSObject.removePjaxListener;
		if (removePjaxListener) {
			removePjaxListener();
		}
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
	
	if (win.frameElement) {
		//its a frame
		
		if (ignoreFrames) {
			return;//dont want to watch frames
		}
	}
	addDiv(doc);
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
	
	for (var j = 0; j < winArr.length; j++) {
		if (j == 0) {
			
		} else {
			
		}
		var doc = winArr[j].document;
		//START - edit below here
		addDiv(doc);
		if (ignoreFrames) {
			break;
		}
		//END - edit above here
	}
}

function unloadFromContentWindowAndItsFrames(theWin) {
	var frames = theWin.frames;
	var winArr = [theWin];
	for (var j = 0; j < frames.length; j++) {
		winArr.push(frames[j].window);
	}
	
	for (var j = 0; j < winArr.length; j++) {
		if (j == 0) {
			
		} else {
			
		}
		var doc = winArr[j].document;
		//START - edit below here
		removeDiv(doc);
		if (ignoreFrames) {
			break;
		}
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