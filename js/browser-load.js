'use strict';

console.log('browser-load.js');


class BrowserLoad {
	constructor(node_module) {
		this.name = 'browserload';
		
		var glob = global;
		
		this.node_module = node_module;
		
		console.log('BrowserLoad constructor');
	}
	
	init(callback) {
		console.log('BrowserLoad.init called');
		
		try {
			var _globalscope = window; // browser window
			var self = this;

			console.log('we are in a browser');

			if (_globalscope.$ === undefined) {
				// jquery has not been loaded (e.g. by index.html)
				// we load it through its node module
				var _window = _globalscope;
				var _document = _globalscope.document;

				var jQuery = require('jquery');
				_globalscope.simplestore.jQuery = jQuery;
				// TODO: we could avoid loading jquery module
				// and just implement a jQuery.getJSON function
				// using XMLHttpRequest
			}

						
			// bootstrap of framework
			
			// prevent automatic load before we return from import
			_globalscope.global_scope_no_load = true;
			_globalscope.dapp_browser_no_load = true;

			require('../imports/includes/bootstrap.js');
			
			// put in bootstrap window.simplestore now it exists
			_globalscope.simplestore.BrowserLoad = this;


			// load sequence
			var Bootstrap = _globalscope.simplestore.Bootstrap;
			var ScriptLoader = _globalscope.simplestore.ScriptLoader;
			
			// overloading ScriptLoader
			ScriptLoader.no_dynamic_load = true; // preventing script loader to use its own loading mechanism like for nodejs

			ScriptLoader._performScriptLoad = function(source, posttreatment) {
				console.log('ScriptLoader._performScriptLoad: ' + source);
				
				try {
					
					if (posttreatment)
						posttreatment();
				}
				catch(e) {
					console.log('exception in ScriptLoader._performScriptLoad, while loading ' + source +': ' + e);
					console.log(e.stack);
				}
			}

			
			var bootstrapobject = Bootstrap.getBootstrapObject();
			var rootscriptloader = ScriptLoader.getRootScriptLoader();
			
			// specific import
			rootscriptloader.imported_script_files = [];
			
			rootscriptloader.push_import = function(scriptloader, scriptfile) {
				
				if (scriptloader) 
					scriptloader.push_script(scriptfile);
				
				rootscriptloader.imported_script_files.push(scriptfile);
			}


			//include global object here
			require('./loaders/boot-load.js');
			
			var globalscriptloader = rootscriptloader.getChildLoader('globalloader');
			
			var modulescriptloader = globalscriptloader.getChildLoader('moduleloader');
			modulescriptloader.load_scripts();

			// listen to events
			rootscriptloader.registerEventListener('on_bootstrap_load_end', function(eventname) {
				console.log('BrowserLoad: bootstrap files loaded');
				
				// set low-level local storage
				/*var ClientStorage = require('./localstorage/react-native-client-storage.js')

				_globalscope.simplestore.clientStorage = new ClientStorage();
				_globalscope.simplestore.localStorage = new ClientStorage(); // obsolete*/
			});
				
			rootscriptloader.registerEventListener('on_core_load_end', function(eventname) {
				console.log('BrowserLoad: core modules files loaded');
			});
				
			rootscriptloader.registerEventListener('on_global_object_initializing', function(eventname) {
				console.log('BrowserLoad: global object is initializing');
			});
				
			rootscriptloader.registerEventListener('on_global_object_ready', function(eventname) {
				console.log('BrowserLoad: global object is now ready');
			});
			
			rootscriptloader.registerEventListener('on_dapps_module_load_end', function(eventname) {
				console.log('BrowserLoad: dapps module has been loaded');
			});
			

			// xtra config
			require('./loaders/xtra-load.js');
			

			// include all common js files here 
			require('./loaders/core-load.js');

			globalscriptloader.load_scripts();


			// then load libs and modules
			var global = _globalscope.simplestore.Global.getGlobalObject();

			// libs
			require('./loaders/libs-load.js');
			
			// ethereum
			require('./loaders/ethnode-load.js');
			require('./loaders/ethchainreader-load.js');
			
			
			//  finalize intialization
			global.finalizeGlobalScopeInit(function(res) {
				console.log("BrowserLoad finished initialization of GlobalScope");
				if (callback) callback(null, self);
			});
			
		}
		catch(e) {
			console.log('exception in BrowserLoad.init: ' + e);
			console.log(e.stack);
		}
		
		this._checkLoad();
		
	}
	
	_checkLoad() {
		var _globalscope = window; // browser window

		var Bootstrap = _globalscope.simplestore.Bootstrap;
		var ScriptLoader = _globalscope.simplestore.ScriptLoader;
		
		var bootstrapobject = Bootstrap.getBootstrapObject();
		var rootscriptloader = ScriptLoader.getRootScriptLoader();
		
		var imported_script_files = rootscriptloader.imported_script_files;

		for (var i = 0; i < imported_script_files.length; i++) {
			console.log('script file has been imported: ' + imported_script_files[i]);
		}
		
		// get list of scripts that have been pushed
		var fillPushed = function(scriptfilearray, scriptloader) {
			var scripts = scriptloader.scripts;
			
			for (var k = 0; k < scripts.length; k++) {
				var scriptfile = scripts[k].file;
				
				if (scriptfilearray.indexOf(scriptfile) === -1)
					scriptfilearray.push(scriptfile);
			}
		};
		
		var pushed_script_files = [];
		
		var scriptloaders = ScriptLoader.getScriptLoaders();
		
		
		for (var j = 0; j < scriptloaders.length; j++) {
			var scriptloader = scriptloaders[j];
			fillPushed(pushed_script_files, scriptloader);
		}
		
		// check if we have imported all of them
		var missing_script_files = [];
		
		for (var i = 0; i < pushed_script_files.length; i++) {
			var scriptfile = pushed_script_files[i];
			
			if (imported_script_files.indexOf(scriptfile) === -1) {
				missing_script_files.push(scriptfile);
			}
		}
		
		for (var i = 0; i < missing_script_files.length; i++) {
			var scriptfile = missing_script_files[i];
			
			console.log('script file has NOT been imported: ' + scriptfile);
		}
	}

	

}

module.exports = BrowserLoad;