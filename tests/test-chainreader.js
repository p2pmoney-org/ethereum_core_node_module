var Tests = class {
	
	static run(describe, expect, assert) {
		try {
			var CoreControllers = require('../js/control/controllers.js');
			var corecontrollers = CoreControllers.getObject();
			
			var session = corecontrollers.getCurrentSessionObject();

			
			// ethchainreader
			var txhash = '0xc23bbf67438f508c15fa423e6c53fbc9ae0d4418479a864558cd174f722117c3';

			describe('ethchainreader:', function() {
				this.timeout(5000);
			    it('transaction data', function() {
			    	return new Promise(function (resolve, reject) {
			    		corecontrollers.readTransaction(session, txhash, function(err, tx)  {
			    			if (tx) {
			    				tx.getTransactionReceiptData(function(err, data)  {
			    					assert(data !== null);
			    			    	
			    					resolve(true);
			    				});
			    			}
			    		});
					});
			    });
			});	

		}
		catch(e) {
			console.log('exception in test-chainreader: ' + e);
			console.log(e.stack);
		}
		
		
	}
}

module.exports = Tests;
