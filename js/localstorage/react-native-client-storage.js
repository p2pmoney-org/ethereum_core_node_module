/**
 * 
 */
'use strict';

var CacheStorage = class {
	constructor() {
		this.map = Object.create(null); // use a simple object to implement the map
	}
	
	getKeyJson(key) {
		if (key in this.map) {
			return this.map[key];
		} 
	}
	
	updateJson(key, json) {
		this.map[key] = json;
	}
	
	count() {
		return Object.keys(this.map).length;
	}
	
	empty() {
		this.map = Object.create(null);
	}
}


var ReactNativeClientStorage = class {
	constructor() {
		this.AsyncStorage = require('@react-native-community/async-storage').default;
		
		this.ethereum_core = require('../../ethereum_core.js').getObject();
		
		this.storagemap = new CacheStorage(); // use cache to answer synchronously to readClientJson
	}
	
	// standard local storage
	setItem(key, value) {
		return this.AsyncStorage.setItem(key, value);
	}
	
	getItem(key) {
		return this.AsyncStorage.getItem(key);
	}
	
	removeItem(key) {
		return this.AsyncStorage.removeItem(key);
	}
	
	key(index) {
		return this.AsyncStorage.key(index);
	}
	
	clear() {
		return this.AsyncStorage.clear();
	}
	
	// ethereum_core storage access
	loadClientSideJsonArtifact(session, jsonfile, callback) {
		console.log('ReactNativeClientStorage.loadClientSideJsonArtifact called for: ' + jsonfile);
		
		var jsoncontent = this.ethereum_core.getArtifact(jsonfile);
		
		if (callback)
			callback(null, jsoncontent);
		
		return jsoncontent;
	}
	
	readClientSideJson(session, keystring, callback) {
		console.log('ReactNativeClientStorage.readClientSideJson for key: ' + keystring);
		
		if (!keystring)
			return;

		var _keystring = keystring;
		
		if (!keystring.startsWith('shared-')) {
			var useruuid = session.getSessionUserUUID();
			
			if (useruuid) {
				_keystring = useruuid + '-' + keystring;
			}
			else {
				_keystring = 'shared-' + keystring;
			}
		}
		
		var jsonstringpromise = this.AsyncStorage.getItem(_keystring);
		
		jsonstringpromise.then((res) => {
			var jsonstring = res;
			
			console.log('ReactNativeClientStorage.readClientSideJson value for key: ' + _keystring + ' is ' + jsonstring);
			
			// put in cache
			if (jsonstring)
			this.storagemap.updateJson(_keystring, jsonstring);

			// answer to callback
			if (callback) {
				if (jsonstring) {
					callback(null, jsonstring);
				}
				else
					callback('no value', null);
				
			}
		});
		
		// synchronous answer from cache
		var entry = this.storagemap.getKeyJson(_keystring);
		
		return entry;
	}
	
	saveClientSideJson(session, keystring, value, callback) {
		console.log('ReactNativeClientStorage.saveClientSideJson called for key: ' + keystring + ' value ' + value);
		
		if (!keystring)
			return;

		var _keystring = keystring;
		
		if (!keystring.startsWith('shared-')) {
			var useruuid = session.getSessionUserUUID();
			
			if (useruuid) {
				_keystring = useruuid + '-' + keystring;
			}
			else {
				_keystring = 'shared-' + keystring;
			}
		}
		
		// nota: we put in cache early to let
		// readClientSideJson answer with this value
		// even before it is confirmed that the item
		// is in AsyncStorage
		this.storagemap.updateJson(_keystring, value);

		
		var savepromise = this.AsyncStorage.setItem(_keystring, value);
		
		savepromise.then((res) => {
			console.log('ReactNativeClientStorage.saveClientSideJson saved value ' + value + ' for key: ' + _keystring );
			
			// put in cache
			this.storagemap.updateJson(_keystring, value);

			
			if (callback)
				callback(null, value);
		});
	}
}

module.exports = ReactNativeClientStorage;