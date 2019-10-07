'use strict';

console.log('react-native-load.js');


class NodeLoad {
	constructor() {
		this.name = 'nodeload';
	}
	
	init(callback) {
		console.log('NodeLoad.init called');
		
		var _globalscope = global; // nodejs global
		var _noderequire = require; // to avoid problems when react-native processes files

		var self = this;
		
		require('../imports/includes/bootstrap.js');
		

		var Bootstrap = _globalscope.simplestore.Bootstrap;
		var ScriptLoader = _globalscope.simplestore.ScriptLoader;

		var Constants;

		var GlobalClass;

		var path = _noderequire('path');
		var filteredfiles = ['ethereumjs-all-2017-10-31.min.js', 'web3.min-1.0.0-beta36.js']
		ScriptLoader.setDappdir(path.join(__dirname, '../imports'));

		ScriptLoader._performScriptLoad = function(source, posttreatment) {
			console.log('ScriptLoader._performScriptLoad: ' + source);
			
			var basename = path.basename(source);
			
			if (filteredfiles.indexOf(basename) != -1) {
				console.log('not loading file because marked as filtered: ' + source);
				return;
			}
			
			var filepath = source;
			
			if (source.startsWith('./'))
				filepath = path.join(ScriptLoader.getDappdir(), source);
			
			try {
				
				_noderequire(filepath);
				
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

		// prevent default load of angular
		bootstrapobject.setMvcUI('no-mvc');

		//
		// boot-load
		//

		var bootstraploader = rootscriptloader.getChildLoader('bootstrap');

		bootstraploader.push_script('./includes/constants.js');
		bootstraploader.push_script('./includes/config.js');
		bootstraploader.push_script('./includes/modules/common/global.js');

		bootstraploader.load_scripts(function() {
			rootscriptloader.signalEvent('on_bootstrap_load_end');
			
			Constants = _globalscope.simplestore.Constants;
			GlobalClass = _globalscope.simplestore.Global;
			
			// initialize in _globalscope
			
			// libraries loading without exception, but replaced by node modules
			var keythereum = _noderequire('keythereum');
			
			_globalscope.simplestore.keythereum = keythereum;
			
			var bitcore = _noderequire('bitcore');
			var bitcore_ecies = _noderequire('bitcore-ecies');
			
			_globalscope.simplestore.bitcore = bitcore;
			_globalscope.simplestore.bitcore_ecies = bitcore_ecies;

			
			// filtered libraries (throwing exceptions in nodejs)
			var ethereumjs;
			
			ethereumjs = _noderequire('ethereum.js');
			ethereumjs.Util = _noderequire('ethereumjs-util');
			ethereumjs.Wallet = _noderequire('ethereumjs-wallet');
			ethereumjs.Tx = _noderequire('ethereumjs-tx');

			ethereumjs.Buffer = {};
			ethereumjs.Buffer.Buffer = Buffer.from;
			ethereumjs.Buffer.Buffer.from = Buffer.from;
			
			_globalscope.simplestore.ethereumjs = ethereumjs;
			
			var Web3;
			
			Web3 = _noderequire('web3');
			
			_globalscope.simplestore.Web3 = Web3;
			
			// set low-level local storage
			var ClientStorage = require('./localstorage/node-client-storage.js')

			_globalscope.simplestore.localStorage = new ClientStorage();

		});

		//
		// global-load
		//

		var globalscriptloader = bootstraploader.getChildLoader('globalloader');

		globalscriptloader.push_script('./js/src/config.js');
		globalscriptloader.push_script('./js/src/constants.js', function() {
			if (Constants)
			Constants.push('lifecycle', {eventname: 'app start', time: Date.now()});
			else
			console.log('WARNING: load of ./js/src/constants.js returns before bootstraploader completed!');
		});


		globalscriptloader.push_script('./js/src/xtra/xtra-config.js');

		globalscriptloader.push_script('./includes/load.js');


		// perform load
		globalscriptloader.load_scripts();



		//
		// libs-load
		//
		var libscriptloader = globalscriptloader.getChildLoader('libloader');

		// interfaces to abstract access to standard libs
		libscriptloader.push_script('./js/src/xtra/interface/ethereum-node-access.js');


		//perform load
		libscriptloader.load_scripts();

		//
		// module-load
		//
		let modulescriptloader = libscriptloader.getChildLoader('moduleloader');

		//ethereum node
		modulescriptloader.push_script('./js/src/xtra/modules/ethnode/module.js');
		//ethereum chain reader
		modulescriptloader.push_script('./js/src/xtra/modules/ethchainreader/module.js');


		//perform includes module load
		modulescriptloader.load_scripts(function () {
			var _nodeobject = GlobalClass.getGlobalObject();
			
			// load common module now
			_nodeobject.loadModule('common', modulescriptloader, function() {
				rootscriptloader.signalEvent('on_common_module_load_end');
				
			});

			
			
		});

		// end of modules load
		rootscriptloader.registerEventListener('on_common_module_load_end', function(eventname) {
			var _nodeobject = GlobalClass.getGlobalObject();
			
			//  finalize initialization
			_nodeobject.finalizeGlobalScopeInit(function(res) {
				console.log("node-load finished initialization of GlobalScope");
				
				if (callback)
					callback(null, self);
			});
		});

	}
		
}


module.exports = NodeLoad;




