/**
 * 
 */
'use strict';

var LocalVault = class {
	static get CLIENT_VAULT() { return 0;}
	static get LOCAL_VAULT() { return 1;}

	constructor(session, vaultname, type) {
		this.session = session;
		this.vaultname = vaultname;
		
		this.type = type;
		
		this.cryptokey = null;
		
		this.valuemap = Object.create(null);
		
	}
	
	getName() {
		return this.vaultname;
	}
	
	getType() {
		return this.type;
	}
	
	_getVaultKey() {
		return this.vaultname + '-type' + this.type;
	}
	
	getCryptoKeyObject() {
		return this.cryptokey;
	}
	
	_isEmpty(obj) {
		if (!obj)
			return true;
		
	    for(var key in obj) {
	        if(obj.hasOwnProperty(key))
	            return false;
	    }
	    return true;
	}
	
	_read(keys, callback) {
		var session = this.session;
		
		switch (this.type) {
			case LocalVault.CLIENT_VAULT:
				var _keys = ['shared'].concat(keys); // look in 'shared' branch
				var clientAccess = session.getClientStorageAccessInstance();
				clientAccess.readUserJson(_keys, callback);
				break;
			case LocalVault.LOCAL_VAULT:
				var localStorage = session.getLocalStorageObject();
				localStorage.readLocalJson(keys, true, (err, res) => {
					// we must check if calls does not return an empty object
					// (which can be the case when localStorage is overloaded)
					if (!err) {
						if (callback) {
							if (this._isEmpty(res))
								callback('empty object', null);
							else 
								callback(null, res);
						}
					}
					else {
						if (callback)
							callback(err, null);
					}
				});
				break;
			default:
				if (callback)
					callback('wrong vault type', null);
				break;
		}
		
	}
	
	_save(keys, json, callback) {
		var session =this.session;
		
		switch (this.type) {
			case LocalVault.CLIENT_VAULT:
				var _keys = ['shared'].concat(keys); // save in 'shared' branch
				var clientAccess = session.getClientStorageAccessInstance();
				clientAccess.saveUserJson(_keys, json, callback);
				break;
			case LocalVault.LOCAL_VAULT:
				var localStorage = session.getLocalStorageObject();
				localStorage.saveLocalJson(keys, json, callback);
				break;
			default:
				if (callback)
					callback('wrong vault type', null);
				break;
		}
	}
	
	unlock(passphrase, callback) {
		var session = this.session;
		var vaultname = this.vaultname;

		// read crypto key
		var cryptokey = session.createBlankCryptoKeyObject();
		var cryptokeyencryptioninstance = session.getCryptoKeyEncryptionInstance(cryptokey);
		
		// set crypto key origin
		cryptokey.setOrigin({storage: 'vault', vaultname: vaultname});
		
		var keys = ['common', 'vaults', vaultname, 'keystore'];

		this._read(keys, (err, res) => {
			var key_uuid = (res ? res.key_uuid : null);
			var keystorestring = (res ? res.content : null);
			
			// decrypt crypto key
			try {
				cryptokeyencryptioninstance.readPrivateKeyFromStoreString(keystorestring, passphrase, (err, privatekey) => {
					if (privatekey) {
						cryptokey.setKeyUUID(key_uuid);
						cryptokey.setDescription(vaultname);
						cryptokey.setPrivateKey(privatekey);
						
						this.cryptokey = cryptokey;
						
						// then read value
						this.readValues((err, res) =>  {
							if (callback)
								callback(null, this);
						});
						
					}
					else {
						if (callback)
							callback('no key found', null);
					}
				});
			}
			catch(e) {
				if (callback)
					callback('could not unlock key store', null);
				
				return;
			}
			
			
		});
		
	}
	
	lock() {
		this.cryptokey = null;
		this.valuemap = Object.create(null);
	}
	
	isLocked() {
		return (this.cryptokey ? false : true);
	}
	
	changePassphrase(oldpassphrase, newpassphrase, callback) {
		var vaultname = this.vaultname;
		var keys = ['common', 'vaults', vaultname, 'keystore'];
		
		this.unlock(oldpassphrase, (err, res) => {
			if (res) {
				// get keystore string
				var keystorestring =  cryptokeyencryptioninstance.getPrivateKeyStoreString(newpassphrase);

				// save keystore string
				if (keystorestring) {
					var filename = cryptokeyencryptioninstance.getPrivateKeyStoreFileName();
					var key_uuid = cryptokey.getKeyUUID();
					
					var json = {key_uuid: key_uuid, filename: filename, content: keystorestring};
					
					this._save(keys, json, (err, res) => {
						if (callback)
							callback(err, (err ? null : vault));
					});
					
				}
				else {
					if (callback)
						callback('can not create vault', null);
				}
			}
		});
		
	}
	
	readValues(callback) {
		if (this.isLocked()) {
			if (callback)
				callback('vault is locked', null);

			return;
		}
		
		var session = this.session;
		var vaultname = this.vaultname;
		
		var cryptokey = this.cryptokey;
		
		// read encrypted value
		var keys = ['common', 'vaults', vaultname, 'values'];

		this._read(keys, (err, res) => {
			var encryptedvaluestring = (res ? res.encryptedvalues : null);
			var plainvaluestring;
			var json;
			
			if (encryptedvaluestring) {
				var cryptokeyencryptioninstance = session.getCryptoKeyEncryptionInstance(cryptokey);
				
				plainvaluestring =  cryptokeyencryptioninstance.aesDecryptString(encryptedvaluestring);
			
				json = (plainvaluestring ? JSON.parse(plainvaluestring) : null);
				
				this.valuemap = Object.create(null);
				
				for (var key in json) {
					if (json.hasOwnProperty(key)) {
						this.valuemap[key] = json[key];
					}
				}
				
			}
			
			if (callback)
				callback(null, this.valuemap);
		});

	}
	
	getValue(key) {
		if (this.valuemap)
			return this.valuemap[key];
	}
	
	saveValues(callback) {
		var session = this.session;
		var vaultname = this.vaultname;

		// stringify, encrypt and save
		var keys = ['common', 'vaults', vaultname, 'values'];
		
		var cryptokey = this.cryptokey;
		var key_uuid = cryptokey.getKeyUUID();
		
		var cryptokeyencryptioninstance = session.getCryptoKeyEncryptionInstance(cryptokey);

		var plainvaluestring = JSON.stringify(this.valuemap);
		var encryptedvaluestring = cryptokeyencryptioninstance.aesEncryptString(plainvaluestring);
		
		var json = {key_uuid: key_uuid, encryptedvalues: encryptedvaluestring};
		
		this._save(keys, json, (err, res) => {
			if (callback)
				callback(err, res);
		});
		
	}
	
	putValue(key, value, callback) {
		if (this.isLocked()) {
			if (callback)
				callback('vault is locked', null);

			return;
		}
		
		if ((!key) || (!value))
			return;
		
		this.valuemap[key] = value;
		
		this.saveValues((err, res) => {
			if (callback)
				callback(err, (err ? null : value));
		});
		
	}
	
	// static
	
	static _getSafeVaultName(session, vaultname, type) {
		var safename = vaultname;
		
		var localStorage = session.getLocalStorageObject();

		if (!localStorage.isValidKey(vaultname)) {
			return;
		}
		
		return safename;
	}
	
	static getVaultList(session, type, callback) {
		
		var _keys = ['shared', 'common', 'vaults', 'list'];
		
		switch (type) {
			case LocalVault.CLIENT_VAULT:
				var clientAccess = session.getClientStorageAccessInstance();
				clientAccess.readUserJson(_keys, callback);
				break;
			case LocalVault.LOCAL_VAULT:
				var localStorage = session.getLocalStorageObject();
				localStorage.readLocalJson(_keys, true, (err, res) => {
					// we must check if calls does not return an empty object
					// (which can be the case when localStorage is overloaded)
					if (!err) {
						if (callback) {
							if (this._isEmpty(res))
								callback('empty object', null);
							else 
								callback(null, res);
						}
					}
					else {
						if (callback)
							callback(err, null);
					}
				});
				break;
			default:
				if (callback)
					callback('wrong vault type', null);
				break;
		}
	}

	static saveVaultList(session, type, json, callback) {
		var _keys = ['shared', 'common', 'vaults', 'list'];

		switch (type) {
			case LocalVault.CLIENT_VAULT:
				var clientAccess = session.getClientStorageAccessInstance();
				clientAccess.saveUserJson(_keys, json, callback);
				break;
			case LocalVault.LOCAL_VAULT:
				var localStorage = session.getLocalStorageObject();
				localStorage.saveLocalJson(_keys, json, callback);
				break;
			default:
				if (callback)
					callback('wrong vault type', null);
				break;
		}
	}
	
	static checkVaultExists(session, vaultname, type, callback) {
		var vault = new LocalVault(session, vaultname, type);
		
		var keys = ['common', 'vaults', vaultname, 'keystore'];

		vault._read(keys, (err, res) => {
			if (callback)
				callback(null, (err ? false : true));
		});
	}
	
	static checkVaultInList(session, vault, callback) {
		if (!vault)
			return;
		
		var vaultname = vault.getName();
		var vaulttype = vault.getType();
		
		// get list
		const list = LocalVault.getVaultList(session, vaulttype, (err, res) => {
			var array = (err ? [] : (res ? res : []));
				
			var addToList = true;
			
			for (var i = 0; i < array.length; i++) {
				if (vaultname == array[i].name) {
					addToList = false;
				}
			}
			
			if (addToList) {
				console.log('adding vault ' + vaultname + ' to saved list');
				var keyuuid = vault.getCryptoKeyObject().getKeyUUID();
				var entry = {name: vaultname, type: vaulttype, keyuuid: keyuuid};
				
				array.push(entry);
				
				LocalVault.saveVaultList(session, vaulttype, array, (err, res) => {
					if (callback)
						callback(err, res);
				});
			}
		});
	}
	
	static openVault(session, vaultname, passphrase, type, callback) {
		var safevaultname = LocalVault._getSafeVaultName(session, vaultname, type);

		if (!safevaultname) {
			if (callback)
				callback('vault name can only contain safe characters: ' + vaultname, null);
			
			return;
		}
		
		var vault = new LocalVault(session, safevaultname, type);
		
		// put in map
		var vaultmap = session.vaultmap;
		
		vaultmap[vaultname + '-type' + type] = vault;
		
		vault.unlock(passphrase, function(err, res) {
			if (!err)
				LocalVault.checkVaultInList(session, vault);
			
			if (callback)
				callback(err, (err ? null : vault));
		});
	}
	
	static createVault(session, vaultname, passphrase, type, callback) {
		var safevaultname = LocalVault._getSafeVaultName(session, vaultname, type);

		if (!safevaultname) {
			if (callback)
				callback('vault name can only contain safe characters: ' + vaultname, null);
			
			return;
		}
		
		// check vault with this name does not exist
		var vault = new LocalVault(session, vaultname, type);

		var keys = ['common', 'vaults', safevaultname, 'keystore'];
		
		vault._read(keys, (err, res) => {
			if(res) {
				if (callback)
					callback('vault with this name already exists: ' + vaultname, null);
			}
			else {
				// put in map
				var vaultmap = session.vaultmap;
				
				vaultmap[vaultname + '-type' + type] = vault;
				
				// create a crypto key
				var cryptokey = session.createBlankCryptoKeyObject();
				cryptokey.setKeyUUID(session.guid());
				
				var cryptokeyencryptioninstance = session.getCryptoKeyEncryptionInstance(cryptokey);

				try {
					var privkey = cryptokeyencryptioninstance.generatePrivateKey();
					cryptokey.setPrivateKey(privkey);
				}
				catch(e) {
					var error = 'exception while generating private key: ' + e;
					console.log(error);
					
					if (callback)
						callback(error, null);
					
					return;
				}
				
				// set crypto key origin
				cryptokey.setOrigin({storage: 'memory'});
				
				// set cryptokey in vault
				vault.cryptokey = cryptokey;
				
				try {
					// get keystore string
					//var keystorestring = cryptokeyencryptioninstance.getPrivateKeyStoreString(passphrase);
					cryptokeyencryptioninstance.getPrivateKeyStoreString(passphrase, (err, keystorestring) => {
						// save keystore string
						if (keystorestring) {
							var filename = cryptokeyencryptioninstance.getPrivateKeyStoreFileName();
							var key_uuid = cryptokey.getKeyUUID();
							var creatoruuid = session.getSessionUserUUID();
							
							var json = {key_uuid: key_uuid, creatoruuid: creatoruuid, filename: filename, content: keystorestring};
							
							vault._save(keys, json, function(err, res) {
								if (!err)
									LocalVault.checkVaultInList(session, vault);
								
								if (callback)
									callback(err, (err ? null : vault));
							});
							
						}
						else {
							if (callback)
								callback('can not create vault', null);
						}
					});
				}
				catch(e) {
					var error = 'exception while generating keystore string: ' + e;
					console.log(error);
					
					if (callback)
						callback(error, null);
					
					return;
				}

			}
		});
		
	}
	
	static getVaultObject(session, vaultname, type) {
		var vaultmap = session.vaultmap;
		
		return vaultmap[vaultname + '-type' + type];
	}
	
	static getVaultObjects(session) {
		return session.getVaultObjects();
	}
}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
	GlobalClass.registerModuleClass('common', 'LocalVault', LocalVault);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('common', 'LocalVault', LocalVault);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('common', 'LocalVault', LocalVault);
}