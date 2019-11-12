/**
 * 
 */
'use strict';

var LocalVault = class {
	constructor(session, vaultname) {
		this.session = session;
		this.vaultname = vaultname;
		
		this.cryptokey = null;
		
		this.valuemap = Object.create(null);
	}
	
	getCryptoKey() {
		return this.cryptokey;
	}
	
	unlock(passphrase, callback) {
		var session = this.session;
		var vaultname = this.vaultname;

		// read crypto key
		var localStorage = session.getLocalStorageObject();
		var keys = ['common', 'vaults', vaultname, 'keystore'];
		var bForceRefresh = true;
		
		var cryptokey = session.createBlankCryptoKeyObject();
		this.cryptokey = cryptokey;
		var cryptokeyencryptioninstance = session.getCryptoKeyEncryptionInstance(this.cryptokey);
		
		localStorage.readLocalJson(keys, bForceRefresh, (err, res) => {
			var key_uuid = (res ? res.key_uuid : null);
			var keystorestring = (res ? res.content : null);
			
			// decrypt crypto key
			var privatekey =  cryptokeyencryptioninstance.readPrivateKeyFromStoreString(keystorestring, passphrase);
			
			if (privatekey) {
				cryptokey.setKeyUUID(key_uuid);
				cryptokey.setPrivateKey(privatekey);
			}
			
			// then read value
			this.readValues((err, res) =>  {
				if (callback)
					callback((privatekey ? null : 'no key found'), this);
				
			});
			
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
					
					localStorage.saveLocalJson(keys, json, function(err, res) {
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

		// read encrypted value
		var localStorage = session.getLocalStorageObject();
		var keys = ['common', 'vaults', vaultname, 'values'];
		var bForceRefresh = true;
		
		var cryptokey = this.cryptokey;
		
		localStorage.readLocalJson(keys, bForceRefresh, (err, res) => {
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
				        this.valuemap.key = json.key;
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
		var localStorage = session.getLocalStorageObject();
		var keys = ['common', 'vaults', vaultname, 'values'];
		
		var cryptokey = this.cryptokey;
		var key_uuid = cryptokey.getKeyUUID();
		
		var cryptokeyencryptioninstance = session.getCryptoKeyEncryptionInstance(cryptokey);

		var plainvaluestring = JSON.stringify(this.valuemap);
		var encryptedvaluestring = cryptokeyencryptioninstance.aesEncryptString(plainvaluestring);
		
		var json = {key_uuid: key_uuid, encryptedvalues: encryptedvaluestring};
		
		localStorage.saveLocalJson(keys, json, function(err, res) {
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
	static openVault(session, vaultname, passphrase, callback) {
		if (!vaultname.match("^[A-Za-z0-9]+$")) {
			if (callback)
				callback('vault name can only contain alphanumeric characters: ' + vaulname, null);
			
			return;
		}
		
		var vault = new LocalVault(session, vaultname);
		
		// put in map
		var vaultmap = session.getSessionVariable('vaultmap');
		
		if (!vaultmap) {
			vaultmap = Object.create(null);
			session.setSessionVariable('vaultmap', vaultmap);
		}
		
		vaultmap[vaultname] = vault;
		
		vault.unlock(passphrase, function(err, res) {
			if (callback)
				callback(err, (err ? null : vault));
		});
	}
	
	static createVault(session, vaultname, passphrase, callback) {
		if (!vaultname.match("^[A-Za-z0-9]+$")) {
			if (callback)
				callback('vault name can only contain alphanumeric characters: ' + vaulname, null);
			
			return;
		}
		
		// check vault with this name does not exist
		var localStorage = session.getLocalStorageObject();
		var keys = ['common', 'vaults', vaultname, 'keystore'];
		var bForceRefresh = true;
		
		localStorage.readLocalJson(keys, bForceRefresh, function(err, res) {
			if(res) {
				if (callback)
					callback('vault with this name already exists: ' + vaultname, null);
			}
			else {
				var vault = new LocalVault(session, vaultname);

				// put in map
				var vaultmap = session.getSessionVariable('vaultmap');
				
				if (!vaultmap) {
					vaultmap = Object.create(null);
					session.setSessionVariable('vaultmap', vaultmap);
				}
				
				vaultmap[vaultname] = vault;
				
				// create a crypto key
				var cryptokey = session.createBlankCryptoKeyObject();
				cryptokey.setKeyUUID(session.guid());
				
				var cryptokeyencryptioninstance = session.getCryptoKeyEncryptionInstance(cryptokey);

				var privkey = cryptokeyencryptioninstance.generatePrivateKey();
				cryptokey.setPrivateKey(privkey);
				
				// get keystore string
				var keystorestring =  cryptokeyencryptioninstance.getPrivateKeyStoreString(passphrase);

				// save keystore string
				if (keystorestring) {
					var filename = cryptokeyencryptioninstance.getPrivateKeyStoreFileName();
					var key_uuid = cryptokey.getKeyUUID();
					
					var json = {key_uuid: key_uuid, filename: filename, content: keystorestring};
					
					localStorage.saveLocalJson(keys, json, function(err, res) {
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
	
	static getVault(session, vaultname) {
		var vaultmap = session.getSessionVariable('vaultmap');
		
		if (!vaultmap) {
			vaultmap = Object.create(null);
			session.setSessionVariable('vaultmap', vaultmap);
		}
		
		return vaultmap[vaultname];
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