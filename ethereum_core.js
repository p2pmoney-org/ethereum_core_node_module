'use strict';

var ethereum_core;

class Ethereum_core {
	constructor() {
		this.load = null;
		
		this.initializing = false;
		this.initialized = false;
		
		this.initializationpromise = null;
		
		this.artifactmap = Object.create(null);
	}
	
	init(callback) {
		console.log('ethereum_core init called');
		
		if (typeof window !== 'undefined') {
			// we are in react-native
			console.log('loading for react-native');
			
			var ReactNativeLoad = require( './js/react-native-load.js');

			this.load = new ReactNativeLoad();
		}
		else if (typeof global !== 'undefined') {
			console.log('loading for nodejs');
			
			// we are in nodejs
			var NodeLoad = require( './js/node-load.js');
			
			this.load = new NodeLoad();
		}
		
		var self = this;
		var promise;
		
		if (this.initializing === false) {
			this.initializing = true;
			
			this.initializationpromise = new Promise(function (resolve, reject) {
				self.load.init(function() {
					console.log('ethereum_core init finished');
					self.initialized = true;
					
					if (callback)
						callback(null, true);
					
					resolve(true);
				});
			});
			
		}
		
		return this.initializationpromise;
	}
	
	getGlobalObject() {
		if (typeof window !== 'undefined') {
			// we are in react-native
			return window.simplestore.Global.getGlobalObject();
		}
		else if (typeof global !== 'undefined') {
			// we are in nodejs
			return global.simplestore.Global.getGlobalObject();
		}
		
	}
	
	putArtifact(artifactname, artifact) {
		this.artifactmap[artifactname] = artifact;
	}
	
	getArtifact(artifactname) {
		return this.artifactmap[artifactname];
	}
	

	// static methods
	static getObject() {
		if (ethereum_core)
			return ethereum_core;
		
		ethereum_core = new Ethereum_core();
		
		return ethereum_core;
	}
}

module.exports = Ethereum_core;