/**
 * 
 */
'use strict';

//import {AsyncStorage} from '@react-native-community/async-storage';

var ReactNativeClientStorage = class {
	constructor() {
		this.AsyncStorage = require('@react-native-community/async-storage').default;
		
		this.ethereum_core = require('../../ethereum_core.js').getObject();
	}
	
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
		
		jsonstringpromise.then(function(res) {
			console.log('ReactNativeClientStorage.readClientSideJson value for key: ' + _keystring + ' is ' + res);
			
			if (callback) {
				if (res)
					callback(null, res);
				else
					callback('no value', null);
				
			}
		});
		
		return null;
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
		
		var savepromise = this.AsyncStorage.setItem(_keystring, value);
		
		savepromise.then(function(res) {
			console.log('ReactNativeClientStorage.saveClientSideJson saved value ' + value + ' for key: ' + _keystring );
			
			if (callback)
				callback(null, value);
		});
	}
}

module.exports = ReactNativeClientStorage;