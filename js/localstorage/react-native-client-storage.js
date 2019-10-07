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
	
	readClientSideJson(session, key, callback) {
		console.log('ReactNativeClientStorage.readClientSideJson for key: ' + key);
		
		var jsonstringpromise = this.AsyncStorage.getItem(key);
		
		jsonstringpromise.then(function(res) {
			console.log('ReactNativeClientStorage.readClientSideJson value for key: ' + key + ' is ' + res);
			
			if (callback) {
				if (res)
					callback(null, res);
				else
					callback('no value', null);
				
			}
		});
		
		return null;
	}
	
	saveClientSideJson(session, key, value, callback) {
		console.log('ReactNativeClientStorage.saveClientSideJson called for key: ' + key + ' value ' + value);
		
		var savepromise = this.AsyncStorage.setItem(key, value);
		
		savepromise.then(function(res) {
			console.log('ReactNativeClientStorage.saveClientSideJson saved value ' + value + ' for key: ' + key );
			
			if (callback)
				callback(null, value);
		});
	}
}

module.exports = ReactNativeClientStorage;