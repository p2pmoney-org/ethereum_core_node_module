var Ethereum_core = require('../../ethereum_core');
var ethereum_core = Ethereum_core.getObject();


const {describe} = require('mocha');

const {expect} = require('chai');

const assert = require('assert');

describe('Running tests:', function() {
	it('initialization', function(done) {
    	// initialize framework
        ethereum_core.init(function(res) {
        	
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
        		var Tests = require('./test-chainreader.js');
        		
        		Tests.run(describe, expect, assert);
        	});
        	
			done()
		});
     });

});

