var Tests = class {
	
	static run(describe, expect, assert) {
		
		var CoreControllers = require('../js/control/controllers.js');
		var corecontrollers = CoreControllers.getObject();
		
		var session = corecontrollers.getCurrentSessionObject();

		// generate private key
		var senderprivatekey = erc20controllers.generatePrivateKey(session);
		var senderpublickeys = erc20controllers.getPublicKeys(session, senderprivatekey)
		
		// private key
		var txhash = '0xc23bbf67438f508c15fa423e6c53fbc9ae0d4418479a864558cd174f722117c3';

		describe('private key:', function() {
		    it('generation', function() {
				assert(senderprivatekey !== null);
		    });
		});	
		
	}
}

module.exports = Tests;
