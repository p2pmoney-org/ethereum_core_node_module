var Tests = class {
	
	static run(describe, expect, assert) {
		try {
			var CoreControllers = require('../js/control/controllers.js');
			var corecontrollers = CoreControllers.getObject();

			var session = corecontrollers.getCurrentSessionObject();
			

			describe('Controller:', function() {
			    it('core controller object not null', function() {
			    	assert(corecontrollers !== null);
			    });
			});
			
			
		}
		catch(e) {
			console.log('exception in test-init: ' + e);
			console.log(e.stack);
		}
		

	}
	
}

module.exports = Tests;
