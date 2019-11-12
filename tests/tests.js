var Ethereum_core = require('../../ethereum_core');
var ethereum_core = Ethereum_core.getObject();


const {describe} = require('mocha');

const {expect} = require('chai');

const assert = require('assert');

describe('Running tests:', function() {
	var TestUtils = require('./test-utils.js');
	var debug = true;

	// DEBUG
	if (debug) {
		this.timeout(60000);
		TestUtils.debugBreak();
	}
	
	it('initialization', function(done) {
    	// initialize framework
        ethereum_core.init(function(res) {
        	
			var CoreControllers = require('../js/control/controllers.js');
			var corecontrollers = CoreControllers.getObject();

			// read config json and overload Config
			var _clientglobal = corecontrollers.getGlobalObject();
			var _globalscope = _clientglobal.getExecutionGlobalScope();
			var Config = _globalscope.simplestore.Config;
			
			// show logs
			if (debug)
			_clientglobal.setExecutionEnvironment('dev');
			
			// initialize web3 endpoint
			var core_test_config = TestUtils.readJson('core-test-config.json');
			
			console.log('JSON is ' + JSON.stringify(core_test_config));
			
			if (core_test_config.web3_provider_url) {
				var ethnodemodule = _clientglobal.getModuleObject('ethnode');
				
				ethnodemodule.setWeb3ProviderUrl(core_test_config.web3_provider_url);
			}
			
			// start tests
			describe('Core', function() {
        		var Tests = require('./test-init.js');
        		
        		Tests.run(describe, expect, assert);
        	});
        	
        	describe('Web3', function() {
        		var Tests = require('./test-web3.js');
        		
        		Tests.run(describe, expect, assert);
        	});
        	
        	describe('ChainReader', function() {
        		var Tests = require('./test-chainreader.js');
        		
        		Tests.run(describe, expect, assert);
        	});
        	
        	describe('Crypto', function() {
        		var Tests = require('./test-crypto.js');
        		
        		Tests.run(describe, expect, assert);
        	});
        	
			done()
		});
     });

});

