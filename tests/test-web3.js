var Tests = class {
	
	static run(describe, expect, assert) {
		
		var CoreControllers = require('../js/control/controllers.js');
		var corecontrollers = CoreControllers.getObject();

		var session = corecontrollers.getCurrentSessionObject();

		describe('Network:', function() {
		    it('web3 node info', function() {
		    	return new Promise(function (resolve, reject) {
		    		corecontrollers.getNodeInfo(session, function(err, nodeinfo)  {
				    	assert(nodeinfo && nodeinfo.islistening);
						
				    	resolve(true);
		    		});
				});
		    });
		    
		    it('current block number', function() {
		    	return new Promise(function (resolve, reject) {
		    		corecontrollers.readCurrentBlockNumber(session, function(err, blocknumber)  {
				    	assert(blocknumber && (blocknumber != -1));
						
				    	resolve(true);
		    		});
				});
		    });
		});
		

	}
}

module.exports = Tests;
