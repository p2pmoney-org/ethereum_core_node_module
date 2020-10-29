/**
 * 
 */
'use strict';

var CacheStorage = class {
	constructor() {
		this.map = Object.create(null); // use a simple object to implement the map
	}
	
	getKeyJson(key) {
		if (key in this.map) {
			return this.map[key];
		} 
	}
	
	updateJson(key, json) {
		this.map[key] = json;
	}
	
	count() {
		return Object.keys(this.map).length;
	}
	
	empty() {
		this.map = Object.create(null);
	}
}


var NodeClientStorage = class {
	constructor() {
		this.storage_dir = __dirname + '/../../storage'; // default
		
		this.ethereum_core = require('../../ethereum_core.js').getObject();
		
		this.storagemap = new CacheStorage(); // use cache to answer synchronously to readClientJson
	}
	
	getStorageDir() {
		return this.storage_dir;
	}
	
	setStorageDir(storage_dir) {
		this.storage_dir = storage_dir;
	}
	
	// standard local storage
	setItem(key, value) {
		throw 'not implemented yet!';
	}
	
	getItem(key) {
		throw 'not implemented yet!';
	}
	
	removeItem(key) {
		throw 'not implemented yet!';
	}
	
	key(index) {
		throw 'not implemented yet!';
	}
	
	clear() {
		throw 'not implemented yet!';
	}
	
	// ethereum_core storage access
	loadClientSideJsonArtifact(session, jsonfile, callback) {
		console.log('NodeClientStorage.loadClientSideJsonArtifact called for: ' + jsonfile);
		
		var jsoncontent = this.ethereum_core.getArtifact(jsonfile);
		
		if (callback)
			callback(null, jsoncontent);
		
		return jsoncontent;
	}
	
	_getFullDirPath(subdir) {
		var storagedir = this.storage_dir;

		if (subdir) {
			var _noderequire = require; // to avoid problems when react-native processes files
			var path = _noderequire('path');
			
			storagedir = path.join(this.storage_dir, subdir);

		}

		return storagedir;
	}
	
	_getSessionDir(session) {
		var storagedir = this.storage_dir;
		var userdir ='shared';
		
		if (session.getSessionUserObject()) {
			var useruuid = session.getSessionUserObject().getUserUUID();
			
			if (useruuid)
				userdir = useruuid;
		}
		
		storagedir = this._getFullDirPath(userdir);
			
		return storagedir;
	}
	
	readClientSideJson(session, keystring, callback) {
		console.log('NodeClientStorage.readClientSideJson for key: ' + keystring);
		
		var _noderequire = require; // to avoid problems when react-native processes files
		var fs = _noderequire('fs');
		var path = _noderequire('path');


		if (keystring.startsWith('shared-')) {
			var storagedir = this._getFullDirPath('shared');
			var jsonFileName = keystring.substring(7) + ".json";
		}
		else {
			var storagedir = this._getSessionDir(session);
			var jsonFileName = keystring + ".json";
		}

		var jsonPath;
		var jsonstring;
		
		var jsoncontent;
		var error = null;
		
		try {
			jsonPath = path.join(storagedir, jsonFileName);

			jsonstring = fs.readFileSync(jsonPath, 'utf8');
			jsoncontent = JSON.parse(jsonstring);

			// put in cache
			if (jsonstring)
			this.storagemap.updateJson(keystring, jsonstring);

			if (callback)
				callback(null, jsoncontent);

			return;
	
		}
		catch(e) {
			error = 'exception in NodeClientStorage.readClientSideJson: ' + e.message;
			console.log(error);
		}
		
		// look in the cache
		var entrystring = this.storagemap.getKeyJson(keystring);

		if (entrystring) {
			// answer from cache if file is being saved
			// but not on the disk yet
			var entryjson = (entrystring ? JSON.parse(entrystring) : null);

			if (callback)
				callback(null, entryjson);
		
			return entryjson;
		}
		else {
			if (callback)
				callback(error, null);
		}
		
	}
	
	saveClientSideJson(session, keystring, value, callback) {
		console.log('NodeClientStorage.saveClientSideJson called for key: ' + keystring + ' value ' + value);
		
		if (!value) {
			if (callback)
				callback('value passed for key ' + keystring + ' is null', false);
		}
		
		var bSuccess = false;
		var error = null;
		
		var _noderequire = require; // to avoid problems when react-native processes files
		var mkdirp = _noderequire('mkdirp');
		var fs = _noderequire('fs');
		var path = _noderequire('path');

		if (keystring.startsWith('shared-')) {
			var storagedir = this._getFullDirPath('shared');
			var jsonFileName = keystring.substring(7) + ".json";
		}
		else {
			var storagedir = this._getSessionDir(session);
			var jsonFileName = keystring + ".json";
		}

		
		var jsonPath;
		var jsonFile;
		
		try {
			jsonPath = path.join(storagedir, jsonFileName);
		
			var jsonstring = JSON.stringify(value);

			// nota: we put in cache early to let
			// readClientSideJson answer with this value
			// even before it is confirmed that the item
			// is in FileSystem
			this.storagemap.updateJson(keystring, jsonstring);

			
			// create directory if it not exists

			// note: mkdirp version =< 0.5.1 works with callbak
			// version >= 1.0.0 only works returning a promise
			/*mkdirp(storagedir, function (err) {
			    if (err) {
			    	error = err;
			    	
					if (callback)
						callback(error, false);
			    }
			    else {
					// then write file
			    	fs.writeFile(jsonPath, jsonstring, 'utf8', function() {
						bSuccess = true;
					
						if (callback)
							callback(null, bSuccess);
					});
			    }

			 });*/

			 var savepromise = mkdirp(storagedir)
			 .then(function (res) {
					// then write file

					return new Promise((resolve, reject) => {
						fs.writeFile(jsonPath, jsonstring, 'utf8', function(err) {
							if (err) reject(err); else resolve(true);
						});

						resolve(true);
					});
			 });

			 
			 savepromise.then(function (res) {
				bSuccess = res;
					
				if (callback)
					callback(null, bSuccess);

			 })
			 .catch(function (err) {
				if (callback)
					callback(err, false);

				return;
			 });

			
		}
		catch(e) {
			error = 'exception in NodeClientStorage.saveClientSideJson: ' + e.message;
			console.log(error);
			
			if (callback)
				callback(error, false);
		}
		
	}
}

module.exports = NodeClientStorage;