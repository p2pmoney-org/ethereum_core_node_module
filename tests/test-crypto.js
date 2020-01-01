var Tests = class {
	
	static run(describe, expect, assert) {
		
		try {
			var CoreControllers = require('../js/control/controllers.js');
			var corecontrollers = CoreControllers.getObject();
			
			try {
				var session = corecontrollers.getCurrentSessionObject();

				// generate private key
				var senderprivatekey = corecontrollers.generatePrivateKey(session);
				var senderpublickeys = corecontrollers.getPublicKeys(session, senderprivatekey);
				
				var recipientprivatekey = corecontrollers.generatePrivateKey(session);
				var recipientpublickeys = corecontrollers.getPublicKeys(session, recipientprivatekey);
				
				// store and retrieve private key
				var passphrase = 'password';
				var storestring = corecontrollers.getPrivateKeyStoreString(session, senderprivatekey, passphrase);
				
				var retrievedsenderprivatekey = corecontrollers.readPrivateKeyFromStoreString(session, storestring, passphrase);
		}
			catch(e) {
				console.log('exception: ' + e);
			}
			
			describe('private key:', function() {
			    it('sender key generation', function() {
					assert(senderprivatekey !== null);
			    });
			    
			    it('recipient key generation', function() {
					assert(recipientprivatekey !== null);
			    });
			    
			    it('sender key keystore', function() {
					assert(senderprivatekey == retrievedsenderprivatekey);
			    });
			});
			
			
			// symmetric encryption
			
			// aes encrypt text
			var plaintext = 'the fox jumps over the lazy dog';
			var cyphertext;
			
			try {
				cyphertext = corecontrollers.aesEncryptString(session, senderprivatekey, plaintext);
				
				// aes decrypt text
				var aes_resulttext = corecontrollers.aesDecryptString(session, senderprivatekey, cyphertext);
				
			}
			catch(e) {
				console.log('exception: ' + e);
			}
			
			describe('aes symetric encryption:', function() {
			    it('cyphertext matches plaintext', function() {
					assert(aes_resulttext == plaintext);
			    });
			});
			
			
			// asymmetric encryption
			
			try {
				// rsa encrypt text
				var senderaccount;
				var recipientaccount;
				
				senderaccount = session.createBlankAccountObject();
				recipientaccount = session.createBlankAccountObject();

				senderaccount.setPrivateKey(senderprivatekey);
				recipientaccount.setRsaPublicKey(recipientpublickeys['rsa_public_key']);
				
				cyphertext = corecontrollers.rsaEncryptString(session, senderaccount, recipientaccount, plaintext);

				// rsa decrypt text
				senderaccount = session.createBlankAccountObject();
				recipientaccount = session.createBlankAccountObject();

				senderaccount.setRsaPublicKey(senderpublickeys['rsa_public_key']);
				recipientaccount.setPrivateKey(recipientprivatekey);
				
				var rsa_resulttext = corecontrollers.rsaDecryptString(session, recipientaccount, senderaccount, cyphertext);
			}
			catch(e) {
				console.log('exception: ' + e);
			}
			
			describe('rsa asymetric encryption:', function() {
			    it('cyphertext matches plaintext', function() {
					assert(rsa_resulttext == plaintext);
			    });
			});
			
			// hashing
			try {
				// sha256
				var hashforce = 'sha256';
				var hash256 = corecontrollers.hash_hmac(session, hashforce, plaintext, passphrase);
				
			}
			catch(e) {
				console.log('exception: ' + e);
			}
			
			describe('crypto hash_hmac:', function() {
			    it('sha256 hash', function() {
					assert(hash256.length === 32);
			    });
			});
			
			
			// vault
			describe('vault:', function() {
				var vaultname = 'vault' + Date.now();
				var passphrase = 'password';
				var vaulttype = 0;

				it('creation', function() {
			    	return new Promise(function (resolve, reject) {
			    		corecontrollers.createVault(session, vaultname, passphrase, vaulttype, function(err, vault)  {
					    	assert(vault);
					    	
						    resolve(true);
						});
					});
			    });
				
		    	it('opening', function() {
		    		return new Promise(function (resolve, reject) {
			    		corecontrollers.openVault(session, vaultname, passphrase, vaulttype, function(err, vault)  {
					    	assert(vault && vault.cryptokey);
							
					    	resolve(true);
			    		});
			    	});
		    	});
					
		    	it('storing', function() {
		    		return new Promise(function (resolve, reject) {
		    			var key = 'fox-key';
		    			var value = {text: 'the fox jumps over the lazy dog'};
			    		corecontrollers.putInVault(session, vaultname, vaulttype, key, value, (err, res) =>  {
					    	assert(!err);
							
					    	resolve(true);
			    		});
			    	});
		    	});
					
		    	it('retrieving', function() {
		    		return new Promise(function (resolve, reject) {
		    			var key = 'fox-key';
			    		var value = corecontrollers.getFromVault(session, vaultname, vaulttype, key);
				    	assert(value && (value.text == 'the fox jumps over the lazy dog'));
						
				    	resolve(true);
			    	});
		    	});
					
				
			});
			
		}
		catch(e) {
			console.log('exception in test-crypto: ' + e);
			console.log(e.stack);
		}

		
	}
}

module.exports = Tests;
