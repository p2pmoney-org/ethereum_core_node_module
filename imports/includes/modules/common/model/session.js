/**
 * 
 */
'use strict';

var Session = class {
	constructor(global) {
		
		this.global = global;
		
		this.sessionuuid = null;
		
		this.xtraconfig = {};
		
		this.sessionvar = {};
		
		//this.contracts = null;


		var commonmodule = global.getModuleObject('common');

		// local storage
		this.localstorageobject = new commonmodule.LocalStorage(this);
		
		// instantiation mechanism
		this.classmap = Object.create(null); 
		
		this.cryptokeymap = new commonmodule.CryptoKeyMap();
		this.accountmap = new commonmodule.AccountMap();
		
		// impersonation
		this.user = null;
		this.identifyingaccountaddress = null; // obsolete
		
		this.vaultmap = Object.create(null);
		
		// utility
		this.getClass = function() { return this.constructor.getClass()};
	}
	
	getSessionUUID() {
		if (this.sessionuuid)
			return this.sessionuuid;
		
		this.sessionuuid = this.guid();
		
		return this.sessionuuid;
	}
	
	setSessionUUID(sessionuuid) {
		console.log('changing sessionuuid from ' + this.sessionuuid + ' to ' + sessionuuid);
		this.sessionuuid = sessionuuid;
	}
	
	// class map
	getGlobalClass() {
		return Session;
	}
	
	getSessionClass() {
		return Session;
	}
	
	getClass(classname) {
		if (classname == 'Global')
			return this.getGlobalClass();
		
		if (classname in this.classmap) {
			return this.classmap[classname];
		}
	}
	
	addClass(classname, theclass) {
		this.classmap[classname] = theclass;
	}
	
	// config
	getXtraConfigValue(key) {
		// if value has been overloaded
		// at session's level
		if (this.xtraconfig[key])
			return this.xtraconfig[key];
		
		// or return global xtraconfigvalue
		var global = this.global;
		return global.getXtraConfigValue(key);
		//var Session = this.getClass();
		//return Session.Config.getXtraValue(key);
	}
	
	// session variable
	setSessionVariable(key, value) {
		var global = this.global;
		
		this.sessionvar[key] = value;
	}
	
	getSessionVariable(key) {
		if (key in this.sessionvar) {
			return this.sessionvar[key];
		}
	}
	
	getSessionVariables() {
		var array = [];
		
		for (var key in this.sessionvar) {
		    if (!this.sessionvar[key]) continue;
		    
		    var entry = {};
		    entry.key = key;
		    entry.value = this.sessionvar[key];
		    array.push(entry);
		}
		
		return array;
	}

	// instance of objects
	getGlobalObject() {
		return this.global;
	}
	
	
	// instances of interfaces
	getCryptoKeyEncryptionInstance(cryptokey) {
		var global = this.getGlobalObject();
		var cryptokeytencryptionmodule = global.getModuleObject('cryptokey-encryption');
		return cryptokeytencryptionmodule.getCryptoKeyEncryptionInstance(this, cryptokey);
	}
	
	getAccountEncryptionInstance(account) {
		var global = this.getGlobalObject();
		var accountencryptionmodule = global.getModuleObject('account-encryption');
		
		return accountencryptionmodule.getAccountEncryptionInstance(this, account);
	}
	
	getStorageAccessInstance() {
		var global = this.getGlobalObject();
		var storageaccessmodule = global.getModuleObject('storage-access');
		
		return storageaccessmodule.getStorageAccessInstance(this);
	}
	
	
	// storage
	getLocalStorageObject() {
		return this.localstorageobject;
	}

	getLocalStorageAccessInstance() {
		var global = this.global;
		var storagemodule = global.getModuleObject('storage-access');
		var storageaccess = storagemodule.getStorageAccessInstance(this);

		return storageaccess;
	}

	getClientStorageAccessInstance() {
		var global = this.global;
		var storagemodule = global.getModuleObject('storage-access');
		var storageaccess = storagemodule.getClientStorageAccessInstance(this);

		return storageaccess;
	}

	// rest connection
	createRestConnection(rest_server_url, rest_server_api_path) {
		var global = this.global;
		var commonmodule = global.getModuleObject('common');

		return new commonmodule.RestConnection(this, rest_server_url, rest_server_api_path);
	}
	
	// addresses and keys (personal or third party, as strings)
	isValidAddress(address) {
		var blankaccount = this.createBlankAccountObject()
		var accountencryption = this.getAccountEncryptionInstance(blankaccount);

		return accountencryption.isValidAddress(address);		
	}

	isValidPublicKey(pubkey) {
		var blankaccount = this.createBlankAccountObject()
		var accountencryption = this.getAccountEncryptionInstance(blankaccount);

		return accountencryption.isValidPublicKey(pubkey);		
	}
	
	isValidPrivateKey(privkey) {
		var blankaccount = this.createBlankAccountObject()
		var accountencryption = this.getAccountEncryptionInstance(blankaccount);

		return accountencryption.isValidPrivateKey(privkey);		
	}
	
	generatePrivateKey() {
		var blankaccount = this.createBlankAccountObject()
		var accountencryption = this.getAccountEncryptionInstance(blankaccount);

		return accountencryption.generatePrivateKey();		
	}

	areAddressesEqual(address1, address2) {
		if ((!address1) || (!address2))
			return false;
		
		return (address1.trim().toLowerCase() == address2.trim().toLowerCase());
	}
	
	// crypto keys (encryption operations)
	addCryptoKeyObject(cryptokey) {
		this.cryptokeymap.pushCryptoKey(cryptokey);
	}
	
	removeCryptoKeyObject(cryptokey) {
		this.cryptokeymap.removeCryptoKey(cryptokey);
	}
	
	createBlankCryptoKeyObject() {
		var Session = this.getClass();
		
		return new Session.CryptoKey(this, null);
	}
	
	_readSessionIdentitiesCryptoKeyObjects(callback) {
		var global = this.getGlobalObject();
		var commonmodule = global.getModuleObject('common');
		
		var cryptokeys = [];

		// user crypto-keys
		var sessionuser = this.getSessionUserObject();
		var crkeys = (sessionuser ? sessionuser.getCryptoKeyObjects() : []);

		for (var i = 0; i < crkeys.length; i++) {
			var cryptokey = crkeys[i];
			
			this.addCryptoKeyObject(cryptokey);
			cryptokeys.push(cryptokey);
		}
		
		// vaults
		var vaults = this.getVaultObjects();
		
		for (var i = 0; i < (vaults ? vaults.length : 0); i++) {
			var vault = vaults[i];
			var cryptokey = vault.getCryptoKeyObject();
			
			this.addCryptoKeyObject(cryptokey);
			cryptokeys.push(cryptokey);
		}
		
		if (callback)
			callback(null, cryptokeys);
	}
	
	getSessionCryptoKeyObjects(bForceRefresh, callback) {
		var cryptokeys = this.cryptokeymap.getCryptoKeyArray();
		
		if ((!bForceRefresh) && (bForceRefresh != true)) {
			
			if (callback)
				callback(null, cryptokeys);
			
			return cryptokeys;
		}
		
		var global = this.getGlobalObject();
		var self = this;
		
		// invoke hook to build processing chain
		var result = [];
		
		var params = [];
		
		params.push(this);
		
		result.get = function(err, keyarray) {
			
			// read vaults' keys
			self.cryptokeymap.empty();
			self._readSessionIdentitiesCryptoKeyObjects();

			if (!err) {
				if (keyarray && keyarray.length) {
					//self.cryptokeymap.empty();
					
					for (var i = 0; i < keyarray.length; i++) {
						var key = keyarray[i];
						
						self.cryptokeymap.pushCryptoKey(key);
					}
				}
				
				if (callback)
					callback(null, self.cryptokeymap.getCryptoKeyArray());
			}
			else {
				if (callback)
					callback(err, self.cryptokeymap.getCryptoKeyArray());
			}
		};

		var ret = global.invokeHooks('getSessionCryptoKeyObjects_hook', result, params);
		
		if (ret && result && result.length) {
			global.log('getSessionCryptoKeyObjects_hook result is ' + JSON.stringify(result));
		}
		
		
		// process after hooks chained the get functions
		var keyarray = [];
		
		result.get(null, keyarray);

		
		return this.cryptokeymap.getCryptoKeyArray();
	}
	
	
	
	// account objects
	// (all accounts, personal or third party, referenced by the session)
	areAccountsEqual(account1, account2) {
		if ((!account1) || (!account2))
			return false;
		
		return this.areAddressesEqual(account1.getAddress(), account2.getAddress());
	}
	
	getAccountObject(address) {
		if (!address)
			return;
		
		var key = address.toString();
		var mapvalue = this.accountmap.getAccount(key);
		
		var account;
		
		if (mapvalue !== undefined) {
			// is already in map
			account = mapvalue;
		}
		else {
			var Session = this.getClass();
			account = new Session.Account(this, address);
			
			account.setOrigin({storage: 'api'});
			
			// put in map
			this.accountmap.pushAccount(account);
		}
		
		return account;
	}
	
	getAccountObjectFromPrivateKey(privkey) {
		var account = this.createBlankAccountObject();
		
		account.setPrivateKey(privkey);
		
		this.addAccountObject(account);
		
		return account;
	}
	
	addAccountObject(account) {
		this.accountmap.pushAccount(account);
		
		var owner = account.getOwner();
		
		if (owner) {
			var sessionuser = this.getSessionUserObject();
			
			if (sessionuser.isEqual(owner))
				sessionuser.addAccountObject(account);
		}
	}
	
	removeAccountObject(account) {
		this.accountmap.removeAccount(account);
	}
	
	createBlankAccountObject() {
		var Session = this.getClass();
		return new Session.Account(this, null);
	}
	
	_readSessionIdentitiesAccountObjects(callback) {
		var session = this;
		var global = this.getGlobalObject();
		var commonmodule = global.getModuleObject('common');
		
		var accounts = [];

		// user accounts
		var sessionuser = this.getSessionUserObject();
		var accnts = (sessionuser ? sessionuser.getAccountObjects() : []);

		for (var i = 0; i < accnts.length; i++) {
			var account = accnts[i];
			
			session.addAccountObject(account);
			accounts.push(account);
		}
		
		// local accounts corresponding to vaults or user crypto keys
		var storagemodule = global.getModuleObject('storage-access');
		var storageaccess = storagemodule.getStorageAccessInstance(session);
		
		storageaccess.account_session_keys( (err, res) => {
			
			if (res && res['keys']) {
				var keys = res['keys'];
				
				session.readSessionAccountFromKeys(keys);
			}
	
			if (callback)
				callback(null, session.accountmap.getAccountArray());
		});
	}
	

	
	getAccountObjects(bForceRefresh, callback) {
		var accounts = this.accountmap.getAccountArray();
		
		if ((!bForceRefresh) && (bForceRefresh != true)) {
			
			if (callback)
				callback(null, accounts);
			
			return accounts;
		}
		
		var global = this.getGlobalObject();
		var self = this;
		
		// invoke hook to build processing chain
		var result = [];
		
		var params = [];
		
		params.push(this);
		
		result.get = function(err, accountarray) {
			self.accountmap.empty();
			self._readSessionIdentitiesAccountObjects(function() {
				if (!err) {
					if (accountarray && accountarray.length) {
						//self.accountmap.empty();
						
						for (var i = 0; i < accountarray.length; i++) {
							var account = accountarray[i];
							
							self.accountmap.pushAccount(account);
						}
					}
					
					if (callback)
						callback(null, self.accountmap.getAccountArray());
				}
				else {
					if (callback)
						callback(err, self.accountmap.getAccountArray());
				}
			});
			
		};

		var ret = global.invokeHooks('getAccountObjects_hook', result, params);
		
		if (ret && result && result.length) {
			global.log('getAccountObjects_hook result is ' + JSON.stringify(result));
		}
		
		
		// process after hooks chained the get functions
		var accountarray = [];
		
		result.get(null, accountarray);
		
		return this.accountmap.getAccountArray();
	}
	
	findAccountObjectFromUUID(bForceRefresh, accountuuid, callback) {
		this.getAccountObjects(bForceRefresh, (err, res) => {
			if (callback) {
				if (!err) {
					var account = this.accountmap.getAccountFromUUID(accountuuid);
					
					callback((account ? null : 'could not find account with uuid ' + accountuuid), account);
				}
				else {
					callback(err, null);
				}
			}
		});
		
		return this.accountmap.getAccountFromUUID(accountuuid);
	}
	
	findAccountsObjectsFromAddress(bForceRefresh, address, callback) {
		this.getAccountObjects(bForceRefresh, (err, res) => {
			if (callback) {
				var accounts = this.accountmap.getAccountObjects(address);
				
				callback((accounts || (accounts.length == 0) ? null : 'could not find account with address ' + address), accounts);
			}
		});
		
		return this.accountmap.getAccountObjects(address);
	}
	

	// user (impersonation)
	impersonateUser(user) {
		//if (this.user && user)
		this.disconnectUser();
		
		this.user = user;

		// TODO: we should add user's crypto-keys to the session
		// instead of asking caller to do the job
	}
	
	disconnectUser() {
		var global = this.global;

		// invoke hook to let module clean their session objects
		var result = []; 
		var inputparams = [];
		
		inputparams.push(this);
		
		var ret = global.invokeHooks('cleanSessionContext_hook', result, inputparams);
		
		if (ret && result && result.length) {
			console.log('Session.cleanSessionContext_hook handled by a module');			
		}

		this.user = null;
		
		// clean vaults
		this.vaultmap = Object.create(null);
		
		// we clean the cryptokey map
		this.cryptokeymap.empty();
		
		// we clean the account map
		this.accountmap.empty();
		
		// we clean the local storage
		this.localstorageobject.empty();
	}
	
	getSessionUserObject() {
		return this.user;
	}
	
	getSessionUserUUID() {
		if (this.user)
		return this.user.getUserUUID();
	}
	
	getSessionUserIdentifier() {
		if (this.user)
			return this.user.getUserName();
	}
	
	// vaults
	getVaultObjects() {
		var vaultmap = this.vaultmap;
		
		var array = [];
		
		for (var key in vaultmap) {
		    if (!vaultmap[key]) continue;
		    
		    array.push(vaultmap[key]);
		}
		
		return array;
	}
	
	getVault(vaultname) {
		var vaultmap = this.vaultmap;
		
		var array = [];
		
		for (var key in vaultmap) {
		    if (!vaultmap[key]) continue;
		    
		    if (vaultmap[key].getName() == vaultname)
		    	return vaultmap[key];
		}
	}
	
	putVault(vault) {
		var global = this.global;
		var LocalVaultClass = (typeof LocalVault !== 'undefined' ? LocalVault : global.getModuleObject('common').LocalVault);

		if (!vault || !(vault instanceof LocalVaultClass))
			return;
		
		var vaultmap = this.vaultmap;
		var key = vault._getVaultKey();
		
		vaultmap[key] = vault;
	}
	
	// session identification
	isAnonymous() {
		var oldisanonymous = (this.user == null);
		
		// we call isSessionAnonymous hook in case
		// we should not longer be identified
		var global = this.global;

		var result = []; 
		var inputparams = [];
		
		inputparams.push(this);
		
		var ret = global.invokeHooks('isSessionAnonymous_hook', result, inputparams);
		
		if (ret && result && result.length) {
			console.log('Session.isAnonymous handled by a module');			
		}

		var newisanonymous = (this.user == null);
		
		if (newisanonymous != oldisanonymous)
		console.log('a isSessionAnonymous_hook has changed the isanonymous flag');
		
		return (this.user == null);
	}
	
	disconnectAccount() {
		// obsolete, use disconnectUser
		console.log('WARNING: disconnectAccount is obsolete, use disconnectUser');
		this.disconnectUser();
	}
	
	impersonateAccount(account) {
		if (!account) {
			//this.identifyingaccountaddress = null;
			this.user = null;
			return;
		}
		
		var address = account.getAddress();
		
		console.log("impersonating session with account " + address);
		
		
		if (account.isValid()) {
			// make sure we don't have have another copy of the account in our map
			var oldaccount = this.getAccountObject(address);
			
			if (oldaccount) {
				this.removeAccountObject(oldaccount);
			}
			
			//this.identifyingaccountaddress = address;
			var global = this.getGlobalObject();
			var commonmodule = global.getModuleObject('common');

			this.user = commonmodule.createBlankUserObject(this);
			
			this.user.setUserName(address);
			this.user.setUserUUID(address);

			this.user.addAccountObject(account);
			
			// adding to our map
			this.addAccountObject(account);
			
		}
	}
	
	// session accounts
	// (all personal accounts of the user impersonated in the session)
	getFirstSessionAccountObject() {
		var sessionaccounts = this.getSessionAccountObjects();
		
		if (sessionaccounts && sessionaccounts[0])
			return sessionaccounts[0];
	}

	getMainSessionAccountObject() {
		// return first for the moment
		return this.getFirstSessionAccountObject();
	}

	getSessionAccountObject(accountaddress) {
		if (!accountaddress)
			return;
		
		var sessionaccounts = this.getSessionAccountObjects();
		
		if (!sessionaccounts)
			return;
		
		for (var i = 0; i < sessionaccounts.length; i++) {
			var account = sessionaccounts[i];
			var address = account.getAddress();
			
			if (this.areAddressesEqual(accountaddress, address))
				return account;
		}
	}
	
	getSessionAccountObjects(bForceRefresh, callback) {
		var accounts;
		
		if ((!bForceRefresh) && (bForceRefresh != true)) {
			
			if (this.user != null)
				accounts = this.user.getAccountObjects();
			else
				accounts = null;
			
			if (callback)
				callback(null, accounts);
			
			return accounts;
		}
		
		// we refresh the list of all accounts
		var self = this;
		
		this.getAccountObjects(bForceRefresh, function(err, ress) {
			var accnts;
			if (!err) {
				
				if (self.user != null)
					accnts = self.user.getAccountObjects();
				else
					accnts = null;
				
				if (callback)
					callback(null, accnts);
				
				return accnts;
			}
			else {
				if (callback)
					callback(err, accnts);
				
				return accnts;
			}
		});
		
		if (this.user != null)
			return this.user.getAccountObjects();
		else
			return null;
	}
	
	readSessionAccountFromKeys(keys) {
		var session = this;
		var global = this.getGlobalObject();
		var commonmodule = global.getModuleObject('common');
		var user = session.getSessionUserObject();
		
		var accountarray = [];
		
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			
			var keyuuid = key['key_uuid'];
			var privatekey = key['private_key'];
			var publickey = key['public_key'];
			var address = key['address'];
			var rsapublickey = key['rsa_public_key'];
			var description = key['description'];
			
			var origin = (key['origin'] ? key['origin'] : {storage: 'unknown'});
			var isactivated = (key['activated'] !== null ? key['activated'] : true);

			
			var account = commonmodule.createBlankAccountObject(this);
			
			account.setAccountUUID(keyuuid);
			account.setDescription(description);

			account.setOrigin(origin);
			account.setActivated(isactivated);

			
			if (privatekey) {
				try {
					account.setPrivateKey(privatekey);
					
					//user.addAccountObject(account);
					account.setOwner(user);
					session.addAccountObject(account);
					
					accountarray.push(account);
				}
				catch(e) {
					console.log('exception while adding internal accounts: ' + e);
				}
			}
			else {
				// simple account, not a session account
				try {
					account.setAddress(address);
					account.setPublicKey(publickey);
					account.setRsaPublicKey(rsapublickey);
				
					session.addAccountObject(account);
					
					accountarray.push(account);
				}
				catch(e) {
					console.log('exception while adding external accounts: ' + e);
				}
			}
		
		}
		
		return accountarray;
	}
	
	getSessionAccountAddresses() {
		var array = [];

		if (this.user) {
			var accountarray = this.getSessionAccountObjects();
			
			for (var i = 0; i < accountarray.length; i++) {
				var account = accountarray[i];
				array.push(account.getAddress());
			}
		}
		
		return array;
		//return this.identifyingaccountaddress;
	}
	
	isSessionAccount(account) {
		if (this.isAnonymous())
			return false;
		
		if (!account)
			return false;
		
		if (this.isSessionAccountAddress(account.getAddress()))
			return true;
		else
			return false;
	}
	
	isSessionAccountAddress(accountaddress) {
		if (this.isAnonymous())
			return false;
		
		if (!accountaddress)
			return false;
		
		var addresses = this.getSessionAccountAddresses();
		
		for (var i = 0; i < addresses.length; i++) {
			var address = addresses[i];
			
			if (this.areAddressesEqual(accountaddress, address))
				return true;
		}
		
		return false;
	}
	
	
	
	
	// signatures
	validateStringSignature(accountaddress, plaintext, signature) {
		var account = this.getAccountObject(accountaddress);
		
		if (!account)
			return false;
		
		return account.validateStringSignature(plaintext, signature)
	}
	
	
	
	guid() {
		var StorageAccess = this.getStorageAccessInstance();
		
		return StorageAccess.guid();
	}
	
	getTransactionUUID() {
		return 'id_' + this.guid();
	}
	
	getUUID() {
		// we use loosely the terms guid and uuid for the moment
		return this.guid();
	}
	
	signString(plaintext) {
		var sessionaccount = this.getFirstSessionAccountObject();
		
		if (!sessionaccount)
			throw 'Session must be signed-in to sign a string';
			
		var AccountEncryption = this.getAccountEncryptionInstance(sessionaccount);
		
		return AccountEncryption.signString(plaintext);
	}
}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
GlobalClass.registerModuleClass('common', 'Session', Session);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('common', 'Session', Session);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('common', 'Session', Session);
}