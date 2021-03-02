/**
 * 
 */
'use strict';

var RestConnection = class {
	constructor(session, rest_server_url, rest_server_api_path) {
		this.session = session;
		
		this.rest_server_url = rest_server_url;
		this.rest_server_api_path = rest_server_api_path;
		
		this.header = Object.create(null);
	}
	
	getRestCallUrl() {
		var rest_server_url = this.rest_server_url;
		var rest_server_api_path = this.rest_server_api_path;
		
		return rest_server_url + (rest_server_api_path ? rest_server_api_path : '');
	}
	
	__isValidURL(url) {
		var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
					'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
					'((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
					'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
					'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
					'(\\#[-a-z\\d_]*)?$','i'); // fragment locator
				
		return !!pattern.test(url);
	}
	
	_isReady() {
		var resturl = this.getRestCallUrl();
		
		return this.__isValidURL(resturl);
	}
	
	addToHeader(keyvalue) {
		this.header[keyvalue.key] = keyvalue.value;
	}
	
	_setRequestHeader(xhttp) {
		xhttp.setRequestHeader("Content-Type", "application/json"); // note: XMLHttpRequest in nodejs requires exact case
		xhttp.setRequestHeader("sessiontoken", this.session.getSessionUUID());
		
		for (var key in this.header) {
			xhttp.setRequestHeader(key, this.header[key]);
		}
	}

	_getXMLHttpRequestClass() {
		if (typeof XMLHttpRequest !== 'undefined' && XMLHttpRequest ) {
			return XMLHttpRequest;
		}
		else if (typeof window !== 'undefined' && window ) {
			// normally (browser or react native), XMLHttpRequest should be directly accessible
			if (typeof window.XMLHttpRequest !== 'undefined')
				return window.XMLHttpRequest;
			else if ( (typeof window.simplestore !== 'undefined')
					&& (typeof window.simplestore.XMLHttpRequest !== 'undefined'))
					return window.simplestore.XMLHttpRequest;
		}
		else if ((typeof global !== 'undefined') && (typeof global.simplestore !== 'undefined')
				&& (typeof global.simplestore.XMLHttpRequest !== 'undefined')) {
			return global.simplestore.XMLHttpRequest;
		}
		else {
			throw 'can not find XMLHttpRequest class!!!';
		}
	}
	
	_createXMLHttpRequest(method, resource) {
		var _XMLHttpRequest = this._getXMLHttpRequestClass()
		var xhttp = new _XMLHttpRequest();
		
		var rest_call_url = this.getRestCallUrl();
		var resource_url = rest_call_url + resource;
		
		// allow Set-Cookie for CORS calls
		//xhttp.withCredentials = true;
		
		xhttp.open(method, resource_url, true);

		this._setRequestHeader(xhttp);
		
		return xhttp;
	}

	_processResponseText(xhttp, callback) {
    	if (callback) {
			var jsonresponse;
			
			try {
				jsonresponse = JSON.parse(xhttp.responseText);
			}
			catch(e) {
				console.log('rest answer is not json compliant: ' + xhttp.responseText);
			}
			
			if (jsonresponse) {
				if (jsonresponse['status']) {
					// primus compliant
					if (jsonresponse['status'] == '1') {
						//console.log('RestConnection.rest_post response is ' + JSON.stringify(jsonresponse));
						callback(null, jsonresponse);
					}
					else  {
						callback((jsonresponse['error'] ? jsonresponse['error'] : 'unknown error'), null);
					}
				}
				else {
					callback(null, jsonresponse);
				}
			}
			else {
				// copy plain text
				jsonresponse = xhttp.responseText;
				
				callback(null, jsonresponse);
			}
    	}
	}
	
	rest_get(resource, callback) {
		console.log("RestConnection.rest_get called for resource " + resource);
		
		var session = this.session;
		var self = this;
		
		var xhttp = this._createXMLHttpRequest("GET", resource);
		
		xhttp.send();
		
		xhttp.onload = function(e) {
			if (xhttp.status == 200) {
		    	self._processResponseText(xhttp, callback);
			}
			else {
				if (callback)
					callback(xhttp.statusText, null);	
			}
			
		};
		
		xhttp.onerror = function (e) {
			console.log('rest error is ' + xhttp.statusText);
			
			if (callback)
				callback(xhttp.statusText, null);	
		};
		
	}
	
	rest_post(resource, postdata, callback) {
		console.log("RestConnection.rest_post called for resource " + resource);
		
		var session = this.session;
		var self = this;
		
		var xhttp = this._createXMLHttpRequest("POST", resource);
		
		xhttp.send(JSON.stringify(postdata));
		
		xhttp.onload = function(e) {
			if ((xhttp.status == 200) ||  (xhttp.status == 201)) {
		    	self._processResponseText(xhttp, callback);
			}
			else {
				if (callback)
					callback(xhttp.statusText, null);	
			}
			
		};
		
		xhttp.onerror = function (e) {
			console.log('rest error is ' + xhttp.statusText);
			
			if (callback)
				callback(xhttp.statusText, null);	
		};
		
	}
	
	rest_put(resource, postdata, callback) {
		console.log("RestConnection.rest_put called for resource " + resource);
		
		var session = this.session;
		var self = this;
		
		var xhttp = this._createXMLHttpRequest("PUT", resource);
		
		xhttp.send(JSON.stringify(postdata));
		
		xhttp.onload = function(e) {
			if ((xhttp.status == 200) ||  (xhttp.status == 201)){
		    	self._processResponseText(xhttp, callback);
			}
			else {
				if (callback)
					callback(xhttp.statusText, null);	
			}
			
		};
		
		xhttp.onerror = function (e) {
			console.log('rest error is ' + xhttp.statusText);
			
			if (callback)
				callback(xhttp.statusText, null);	
		};
		
	}
	
	rest_delete(resource, callback) {
		console.log("RestConnection.rest_delete called for resource " + resource);
		
		var session = this.session;
		var self = this;
		
		var xhttp = this._createXMLHttpRequest("DELETE", resource);
		
		xhttp.send();
		
		xhttp.onload = function(e) {
			if (xhttp.status == 200) {
		    	self._processResponseText(xhttp, callback);
			}
			else {
				if (callback)
					callback(xhttp.statusText, null);	
			}
			
		};
		
		xhttp.onerror = function (e) {
			console.log('rest error is ' + xhttp.statusText);
			
			if (callback)
				callback(xhttp.statusText, null);	
		};
		
	}
}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
	GlobalClass.registerModuleClass('common', 'RestConnection', RestConnection);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('common', 'RestConnection', RestConnection);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('common', 'RestConnection', RestConnection);
}