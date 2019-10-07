/**
 * 
 */
'use strict';

var NodeClientStorage = class {
	constructor() {
		this.storage_dir = __dirname + '/../../storage'; // default
		
		this.ethereum_core = require('../../ethereum_core.js').getObject();
	}
	
	getStorageDir() {
		return this.storage_dir;
	}
	
	setStorageDir(storage_dir) {
		this.storage_dir = storage_dir;
	}
	
	loadClientSideJsonArtifact(session, jsonfile, callback) {
		console.log('NodeClientStorage.loadClientSideJsonArtifact called for: ' + jsonfile);
		
		var jsoncontent = this.ethereum_core.getArtifact(jsonfile);
		
		if (callback)
			callback(null, jsoncontent);
		
		return jsoncontent;
	}
	
	_getSessionDir(session) {
		var storagedir = this.storage_dir;
		var userdir ='anonymous';
		
		if (session.getSessionUserObject()) {
			var useruuid = session.getSessionUserObject().getUserUUID();
			
			if (useruuid)
				userdir = useruuid;
		}
			
		var _noderequire = require; // to avoid problems when react-native processes files
		var path = _noderequire('path');
		
		storagedir = path.join(this.storage_dir, userdir);

		return storagedir;
	}
	
	readClientSideJson(session, key, callback) {
		console.log('NodeClientStorage.readClientSideJson for key: ' + key);
		
		var _noderequire = require; // to avoid problems when react-native processes files
		var fs = _noderequire('fs');
		var path = _noderequire('path');

		var storagedir = this._getSessionDir(session);
		var jsonFileName = key + ".json";

		var jsonPath;
		var jsonFile;
		
		var jsoncontent;
		var error = null;
		
		try {
			jsonPath = path.join(storagedir, jsonFileName);
	
	
			jsonFile = fs.readFileSync(jsonPath, 'utf8');
			jsoncontent = JSON.parse(jsonFile);
	
		}
		catch(e) {
			error = 'exception in NodeClientStorage.readClientSideJson: ' + e.message;
			console.log(error); 
		}
		
		if (callback)
			callback(error, jsoncontent)
		
		
		return jsoncontent;
	}
	
	saveClientSideJson(session, key, value, callback) {
		console.log('NodeClientStorage.saveClientSideJson called for key: ' + key + ' value ' + value);
		
		if (!value) {
			if (callback)
				callback('value passed for key ' + key + ' is null', false);
		}
		
		var bSuccess = false;
		var error = null;
		
		var _noderequire = require; // to avoid problems when react-native processes files
		var mkdirp = _noderequire('mkdirp');
		var fs = _noderequire('fs');
		var path = _noderequire('path');

		var storagedir = this._getSessionDir(session);
		var jsonFileName = key + ".json";
		
		var jsonPath;
		var jsonFile;
		
		var finished = false;
		
		try {
			jsonPath = path.join(storagedir, jsonFileName);
		
			var jsonstring = JSON.stringify(value);
			
			// create directory if it not exists
			mkdirp(storagedir, function (err) {
			    if (err) {
			    	error = err;
			    	
			    	finished = true;
			    }
			    else {
					// then write file
			    	fs.writeFile(jsonPath, jsonstring, 'utf8', function() {
						bSuccess = true;
					
						finished = true;
					});
			    }

			 });

			
		}
		catch(e) {
			error = 'exception in NodeClientStorage.saveClientSideJson: ' + e.message;
			console.log(error);
			
			finished = true;
		}
		
		// wait to turn into synchronous call
		while(!finished)
		{_noderequire('deasync').runLoopOnce();}
		
		if (callback)
			callback(error, bSuccess);
	}
}

module.exports = NodeClientStorage;