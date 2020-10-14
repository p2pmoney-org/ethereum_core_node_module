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
	
	async init(callback) {
		console.log('@p2pmoney-org/ethereum_core init called');
		
		if (this.initialized) {
			console.log('module @p2pmoney-org/ethereum_core is already initialized.');
			return true;
		}
		
		if (this.initializing) {
			console.log('module @p2pmoney-org/ethereum_core is already initializing. Wait till it\'s ready.');
			return this.initializationpromise;
		}

		if (typeof window !== 'undefined') {
			if (typeof document !== 'undefined' && document ) {
				// we are in a browser
				console.log('loading for browser');
				
				var BrowserLoad = require( './js/browser-load.js');

				this.load = new BrowserLoad(this);
			}
			else {
				// we are in react-native
				console.log('loading for react-native');
				
				var ReactNativeLoad = require( './js/react-native-load.js');

				this.load = new ReactNativeLoad(this);
			}
		}
		else if (typeof global !== 'undefined') {
			console.log('loading for nodejs');
			
			// we are in nodejs
			var NodeLoad = require( './js/node-load.js');
			
			this.load = new NodeLoad(this);
		}
		
		var self = this;
		var promise;
		
		if (this.initializing === false) {
			
			this.initializationpromise = new Promise(function (resolve, reject) {
				self.load.init(function() {
					console.log('@p2pmoney-org/ethereum_core init ended');
					self.initialized = true;
					
					if (callback)
						callback(null, true);
					
					resolve(true);
				});
			});
			
			this.initializing = true;
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
	
	getControllersObject() {
		return require('./js/control/controllers.js').getObject();
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