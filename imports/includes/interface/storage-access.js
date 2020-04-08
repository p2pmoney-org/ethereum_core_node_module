'use strict';

var Module = class {
	
	constructor() {
		this.name = 'storage-access';
		
		this.global = null; // put by global on registration
		this.isready = false;
		this.isloading = false;
		
		this.clientStorage = null;
		//this.localStorage = null;
		
		//this.storage_access_instance = null;
	}
	
	init() {
		console.log('module init called for ' + this.name);

		var global = this.global;
		
		this.isready = true;
	}
	
	// compulsory  module functions
	loadModule(parentscriptloader, callback) {
		console.log('loadModule called for module ' + this.name);

		if (this.isloading)
			return;
			
		this.isloading = true;

		var self = this;
		var global = this.global;
		
		var modulescriptloader = global.getScriptLoader('storageaccessmoduleloader', parentscriptloader);

		var moduleroot = './includes/lib';

		if (global.isInBrowser()) {
			
		}

		modulescriptloader.load_scripts(function() { self.init(); if (callback) callback(null, self); });
		
		return modulescriptloader;
	}
	
	isReady() {
		return this.isready;
	}

	hasLoadStarted() {
		return this.isloading;
	}

	// optional  module functions
	
	// objects
	getClientStorageAccessInstance(session) {
		// instantiate class in this file
		return new StorageAccess(session);
	}
	
	getStorageAccessInstance(session) {
		if (session.storage_access_instance)
			return session.storage_access_instance;
		
		console.log('instantiating StorageAccess');
		
		var global = this.global;

		var result = []; 
		var inputparams = [];
		
		inputparams.push(this);
		inputparams.push(session);
		
		result[0] = new StorageAccess(session);
		
		// call hook to let modify or replace instance
		var ret = global.invokeHooks('getStorageAccessInstance_hook', result, inputparams);
		
		if (ret && result[0]) {
			session.storage_access_instance = result[0];
		}
		else {
			session.storage_access_instance = new StorageAccess(session);
		}

		
		return session.storage_access_instance;
	}
	
	// utilitites
	keystostring(keys) {
		var key = '';
		
		for (var i =0; i < keys.length; i++) {
			key += (i > 0 ? '-' : '') + keys[i]
		}
		
		return key;
	}
	
	_getClientStorage(session) {
		if (session && session.clientStorage)
			return session.clientStorage;
		
		// else return default
		if (this.clientStorage)
			return this.clientStorage;
		
		// if default not initialized yet
		if (typeof localStorage !== 'undefined') {
			// we are in the browser
			this.clientStorage = new BrowserClientStorage();
		}
		else {
			if ((typeof window !== 'undefined') && (typeof window.simplestore.clientStorage !== 'undefined')) {
				// we are in react native
				this.clientStorage = window.simplestore.clientStorage;
			}
			else if ((typeof global !== 'undefined') && (typeof global.simplestore.clientStorage !== 'undefined')) {
				// we are in nodejs
				this.clientStorage = global.simplestore.clientStorage;
			}
		}
		
		return this.clientStorage;
	}
	
	readClientSideJson(session, keys, callback) {
		var keystring = this.keystostring(keys);
		var _clientStorage = this._getClientStorage(session);
		var jsonstring;
		var json;
		
		if (_clientStorage) {
			if (_clientStorage.readClientSideJson) {
				// supports call with callback
				jsonstring = _clientStorage.readClientSideJson(session, keystring, function(err, res) {
					jsonstring = res;
					
					json = (jsonstring ? JSON.parse(jsonstring) : null);
					
					if (callback)
						callback((json ? null : 'no result found'), json);
				});
				
				json = (jsonstring ? JSON.parse(jsonstring) : null);
			}
			else {
				// browser localstorage
				// (synchronous call)
				console.log('WARNING: obsolete, should not appear');
				jsonstring = _clientStorage.getItem(keystring);
				
				json = (jsonstring ? JSON.parse(jsonstring) : null);
				
				if (callback)
					callback((json ? null : 'no result found'), json);
			}
		}
		else {
			if (callback)
				callback('no local storage found', '{}');
			
			return {};
		}
		
		//console.log("client side local storage json for key " + keystring + " is " + jsonstring);
		
		return json;
	}
	
	saveClientSideJson(session, keys, json, callback) {
		var keystring = this.keystostring(keys);
		var jsonstring = JSON.stringify(json);

		//console.log("saving in client side local storage json " + jsonstring + " for key " + keystring());
		
		var _clientStorage = this._getClientStorage(session);
		
		if (_clientStorage) {
			if (_clientStorage.saveClientSideJson) {
				_clientStorage.saveClientSideJson(session, keystring, jsonstring, callback); // nodejs or react-native encapsulation
			}
			else {
				// browser local storage
				console.log('WARNING: obsolete, should not appear');
				
				_clientStorage.setItem(keystring, jsonstring); 
				
				if (callback)
					callback(null, jsonstring);
			}
		}
		else {
			if (callback)
				callback('no local storage found', null);
		}
	}
	
	loadClientSideJsonArtifact(session, jsonfile, callback) {
		var _clientStorage = this._getClientStorage(session);
		var json = (_clientStorage ? (_clientStorage.loadClientSideJsonArtifact ? _clientStorage.loadClientSideJsonArtifact(session, jsonfile, callback) : {}) : {});
		
		if ((_clientStorage) && (_clientStorage.loadClientSideJsonArtifact)) {
			_clientStorage.loadClientSideJsonArtifact(session, jsonfile, callback);
		}
		else {
			if (callback)
				callback('no local storage found', {});
			
			return {};
		}
		
		return json;
	}

	
}

var BrowserClientStorage = class {
	constructor() {
		this.browserClientStorage = window.localStorage;
	}
	
	// standard local storage
	setItem(key, value) {
		return this.browserClientStorage.setItem(key, value);
	}
	
	getItem(key) {
		return this.browserClientStorage.getItem(key);
	}
	
	removeItem(key) {
		return this.browserClientStorage.removeItem(key);
	}
	
	key(index) {
		return this.browserClientStorage.key(index);
	}
	
	clear() {
		return this.browserClientStorage.clear();
	}
	
	// ethereum_core storage access
	loadClientSideJsonArtifact(session, jsonfile, callback) {
		console.log('BrowserClientStorage.loadClientSideJsonArtifact called for: ' + jsonfile);
		
		var loadpromise = $.getJSON(jsonfile, function(data) {
			console.log('contract json file read ');

			if (callback)
				callback(data);

			return data;
		});
		
		return loadpromise;
	}
	
	readClientSideJson(session, keystring, callback) {
		console.log('BrowserClientStorage.readClientSideJson for key: ' + keystring);
		
		if (!keystring)
			return;
		
		var _keystring = keystring;
		
		if (!keystring.startsWith('shared-')) {
			var useruuid = session.getSessionUserUUID();
			
			if (useruuid) {
				_keystring = useruuid + '-' + keystring;
			}
			else {
				_keystring = 'shared-' + keystring;
			}
		}
		
		var jsonstring = this.browserClientStorage.getItem(_keystring);
		
		if (callback)
			callback((jsonstring ? null : 'no result found'), jsonstring);
	}
	
	saveClientSideJson(session, keystring, jsonstring, callback) {
		console.log('BrowserClientStorage.saveClientSideJson called for key: ' + keystring + ' value ' + jsonstring);
		
		if (!keystring)
			return;

		var _keystring = keystring;
		
		if (!keystring.startsWith('shared-')) {
			var useruuid = session.getSessionUserUUID();
			
			if (useruuid) {
				_keystring = useruuid + '-' + keystring;
			}
			else {
				_keystring = 'shared-' + keystring;
			}
		}
		
		this.browserClientStorage.setItem(_keystring, jsonstring); 
		
		if (callback)
			callback(null, jsonstring);
	}
}


class StorageAccess {
	constructor(session) {
		this.session = session;
	}
	
	isReady(callback) {
		var promise = new Promise(function (resolve, reject) {
			
			if (callback)
				callback(null, true);
			
			resolve(true);
		});
		
		return promise
	}
	
	//
	// Storage API
	//
	
	// client side
	readClientSideJson(keys, callback) {
		var session = this.session;
		var global = session.getGlobalObject();
		var storagemodule = global.getModuleObject('storage-access');
		
		var jsonleaf = storagemodule.readClientSideJson(session, keys, callback);
		
		return jsonleaf;
	}
	
	saveClientSideJson(keys, json, callback) {
		var session = this.session;
		var global = session.getGlobalObject();
		var storagemodule = global.getModuleObject('storage-access');
		
		storagemodule.saveClientSideJson(session, keys, json, callback);
	}
	
	// user
	readUserJson(keys, callback) {
		var self = this;
		
		var promise = new Promise(function (resolve, reject) {
			// client side storage only for dapp
			var json = self.readClientSideJson(keys, function(err, res) {
				if (err) {
					console.log('error reading client side json: ' + err);
					
					json = null;
					
					if (callback)
						callback(err, null);
				}
				else {
					json = res;
					
					if (callback)
						callback(null, json);
				}
				
				resolve(json);
			});
			
			
			return json;
		});
		
		return promise;

	}
	
	saveUserJson(keys, json, callback) {
		var self = this;
		var session = this.session;
		
		var promise = new Promise(function (resolve, reject) {
			// client side storage only for dapp
			self.saveClientSideJson(keys, json, function(err, res) {
				if (err) {
					console.log('error saving client side json: ' + err);
					
					// we DO NOT reject promise, callback probably already called
				}
			});
			
			if (callback)
				callback(null, json);
			
			return resolve(json);
		});
		
		return promise;
	}
	
	// user storage
	account_session_keys(callback) {
		console.log("StorageAccess.account_session_keys called");
		
		var self = this;
		var session = this.session;
		var global = session.getGlobalObject();
		
		var cryptoencryptionmodule = global.getModuleObject('cryptokey-encryption');

		var promise = new Promise(function (resolve, reject) {
			try {
				var keys = ['common', 'accounts'];
				
				self.readUserJson(keys, function(err, res) {
					
					var jsonarray = res;
					
					var keysjson = cryptoencryptionmodule.decryptJsonArray(session, jsonarray);
					
					// add the origin of the keys
					var origin = {storage: 'client'};
					for (var i = 0; i < keysjson.length; i++) {
						var key = keysjson[i];
						
						if (!key.origin) {
							key.origin = origin;
						}
						else {
							Object.assign(key.origin, origin);
						}
					}
					
					var json = {keys: keysjson};
					
					if (callback)
						callback(null, json);
					
					return resolve(json);
				}).catch(err => {
				    console.log('error in StorageAccess.account_session_keys: ', err);
				    
				    if (callback)
					    callback(err, null);
				});;
			
			}
			catch(e) {
			    if (callback)
				    callback('exception: ' + e, null);
			    
				reject('exception in StorageAccess.account_session_keys: ' + e);
			}
		});
		
		return promise;


	}
	
	user_add_account(user, account, callback) {
		console.log("StorageAccess.user_add_account called");
		
		var self = this;
		var session = this.session;
		var global = session.getGlobalObject();
		var cryptoencryptionmodule = global.getModuleObject('cryptokey-encryption');
		
		var promise = new Promise(function (resolve, reject) {
			var keys = ['accounts'];
			
			var uuid = account.getAccountUUID();
			
			if (!uuid) {
				uuid = account.getAddress();
				account.setAccountUUID(uuid);
			}
			

			var description = account.getDescription();

			var privatekey = account.getPrivateKey();
			var cryptokey = cryptoencryptionmodule.pickCryptoKeyEncryptionInstance(session);
			var encryptedprivatekey = cryptoencryptionmodule.encryptPrivateKey(privatekey, cryptokey);
				
			
			var json = {uuid: uuid, owner_uuid: user.getUserUUID(), address: account.getAddress(), private_key: encryptedprivatekey, description: description};
			
			
			// local storage
			// TODO: we should not call commonmodule here, but use directly clientstorage
			var commonmodule = global.getModuleObject('common');
			
			var jsonleaf = commonmodule.getLocalJsonLeaf(session, keys, uuid);
			
			if (jsonleaf) {
				commonmodule.updateLocalJsonLeaf(session, keys, uuid, json);
			}
			else {
				commonmodule.insertLocalJsonLeaf(session, keys, null, null, json);
			}
			
			/*if (callback)
				callback(null, json);*/
			
			// save
			var useraccountjson = commonmodule.readLocalJson(session, keys); // from cache, since no refresh
			commonmodule.saveLocalJson(session, keys, useraccountjson, callback);
			
			return resolve(json);
		});
		
		return promise;
	}
	
	user_update_account(user, account, callback) {
		console.log("StorageAccess.user_update_account called");
		
		var self = this;
		var session = this.session;
		var global = session.getGlobalObject();
		var cryptoencryptionmodule = global.getModuleObject('cryptokey-encryption');
		
		var promise = new Promise(function (resolve, reject) {
			var keys = ['accounts'];
			
			var uuid = account.getAccountUUID();
			
			if (!uuid) {
				throw 'account has no uuid, can not update it';
			}
			

			var description = account.getDescription();

			var privatekey = account.getPrivateKey();
			var cryptokey = cryptoencryptionmodule.pickCryptoKeyEncryptionInstance(session);
			var encryptedprivatekey = cryptoencryptionmodule.encryptPrivateKey(privatekey, cryptokey);
				
			
			// local storage
			// TODO: we should not call commonmodule here, but use directly clientstorage
			var commonmodule = global.getModuleObject('common');
			
			var jsonleaf = commonmodule.getLocalJsonLeaf(session, keys, uuid);
			
			if (jsonleaf) {
				var json = {uuid: uuid, 
							owner_uuid: jsonleaf.owner_uuid, 
							address: jsonleaf.address, 
							private_key: jsonleaf.private_key, 
							description: description
						}; // can only update description
				
				
				commonmodule.updateLocalJsonLeaf(session, keys, uuid, json);
			}
			else {
				throw 'could not find account with uuid ' + uuid;
			}
			
			/*if (callback)
				callback(null, jsonleaf);*/
			
			// save
			var useraccountjson = commonmodule.readLocalJson(session, keys); // from cache, since no refresh
			commonmodule.saveLocalJson(session, keys, useraccountjson, callback);
			
			return resolve(jsonleaf);
		});
		
		return promise;
	}
	
	user_reactivate_account(user, account, callback) {
		console.log("StorageAccess.user_reactivate_account called");
		
		var self = this;
		var session = this.session;
		var global = session.getGlobalObject();
		var cryptoencryptionmodule = global.getModuleObject('cryptokey-encryption');
		
		var promise = new Promise(function (resolve, reject) {
			var keys = ['accounts'];
			
			var uuid = account.getAccountUUID();
			
			if (!uuid) {
				throw 'account has no uuid, can not update it';
			}
			

			// local storage
			// TODO: we should not call commonmodule here, but use directly clientstorage
			var commonmodule = global.getModuleObject('common');
			
			var jsonleaf = commonmodule.getLocalJsonLeaf(session, keys, uuid);
			
			if (jsonleaf) {
				var json = {uuid: uuid, 
							owner_uuid: jsonleaf.owner_uuid, 
							address: jsonleaf.address, 
							private_key: jsonleaf.private_key, 
							description: jsonleaf.description,
							activated: true
						}; // can only update activated field
				
				
				commonmodule.updateLocalJsonLeaf(session, keys, uuid, json);
			}
			else {
				throw 'could not find account with uuid ' + uuid;
			}
			
			// save
			var useraccountjson = commonmodule.readLocalJson(session, keys); // from cache, since no refresh
			commonmodule.saveLocalJson(session, keys, useraccountjson, callback);
			
			return resolve(jsonleaf);
		});
		
		return promise;
	}
	
	user_deactivate_account(user, account, callback) {
		console.log("StorageAccess.user_deactivate_account called");
		
		var self = this;
		var session = this.session;
		var global = session.getGlobalObject();
		var cryptoencryptionmodule = global.getModuleObject('cryptokey-encryption');
		
		var promise = new Promise(function (resolve, reject) {
			var keys = ['accounts'];
			
			var uuid = account.getAccountUUID();
			
			if (!uuid) {
				throw 'account has no uuid, can not update it';
			}
			

			// local storage
			// TODO: we should not call commonmodule here, but use directly clientstorage
			var commonmodule = global.getModuleObject('common');
			
			var jsonleaf = commonmodule.getLocalJsonLeaf(session, keys, uuid);
			
			if (jsonleaf) {
				var json = {uuid: uuid, 
							owner_uuid: jsonleaf.owner_uuid, 
							address: jsonleaf.address, 
							private_key: jsonleaf.private_key, 
							description: jsonleaf.description,
							activated: false
						}; // can only update activated field
				
				
				commonmodule.updateLocalJsonLeaf(session, keys, uuid, json);
			}
			else {
				throw 'could not find account with uuid ' + uuid;
			}
			
			// save
			var useraccountjson = commonmodule.readLocalJson(session, keys); // from cache, since no refresh
			commonmodule.saveLocalJson(session, keys, useraccountjson, callback);
			
			return resolve(jsonleaf);
		});
		
		return promise;
	}
	
	user_remove_account(user, account, callback) {
		console.log("StorageAccess.user_remove_account called");
		
		var self = this;
		var session = this.session;
		var global = session.getGlobalObject();
		var cryptoencryptionmodule = global.getModuleObject('cryptokey-encryption');
		
		var promise = new Promise(function (resolve, reject) {
			var keys = ['accounts'];
			
			var uuid = account.getAccountUUID();
			
			if (!uuid) {
				throw 'account has no uuid, can not update it';
			}
			

			// local storage
			// TODO: we should not call commonmodule here, but use directly clientstorage
			var commonmodule = global.getModuleObject('common');
			
			var jsonleaf = commonmodule.getLocalJsonLeaf(session, keys, uuid);
			
			if (jsonleaf) {
				commonmodule.removeLocalJsonLeaf(session, keys, uuid);
			}
			else {
				throw 'could not find account with uuid ' + uuid;
			}
			
			// save
			var useraccountjson = commonmodule.readLocalJson(session, keys); // from cache, since no refresh
			commonmodule.saveLocalJson(session, keys, useraccountjson, callback);
			
			return resolve(jsonleaf);
		});
		
		return promise;
	}
	
	// uuid
	guid() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			s4() + '-' + s4() + s4() + s4();
	}

}


if ( typeof window !== 'undefined' && window ) // if we are in browser and not node js (e.g. truffle)
window.simplestore.StorageAccess = StorageAccess;
else if (typeof global !== 'undefined')
global.simplestore.StorageAccess = StorageAccess; // we are in node js

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
GlobalClass.getGlobalObject().registerModuleObject(new Module());
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new Module());
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new Module());
}
	
