var Tests = class {
	
	static run(describe, expect, assert) {
		
		var CoreControllers = require('../js/control/controllers.js');
		var corecontrollers = CoreControllers.getObject();

		var session = corecontrollers.getCurrentSessionObject();

		describe('Controller:', function() {
		    it('core controller object not null', function() {
		    	assert(corecontrollers !== null);
		    });
		});
		

	}
}

module.exports = Tests;
