var TestUtils = class {
	static debugBreak() {
		beforeEach(function () {
			  console.log('before each')
			  console.log(Object.keys(this))
			  debugger
			  // this._runnable.parent._onlyTests
			});
	}
	
	static readJson(jsonFileName) {
		var fs = require('fs');
		var path = require('path');

		var jsonFileName;
		var jsonPath;
		var jsonFile;
		
		var jsoncontent;
		
		try {
			jsonPath = path.join(__dirname, jsonFileName);
	
	
			jsonFile = fs.readFileSync(jsonPath, 'utf8');
			jsoncontent = JSON.parse(jsonFile);
	
		}
		catch(e) {
			this.log('exception reading json file: ' + e.message); 
		}
		
		return jsoncontent;
	}
	
}

module.exports = TestUtils;
