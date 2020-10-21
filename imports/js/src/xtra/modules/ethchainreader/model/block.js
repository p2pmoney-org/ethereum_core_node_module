'use strict';


var Block = class {
	constructor(session, blocknumber) {
		this.session = session;
		this.blocknumber = blocknumber;
		
		this.difficulty = null;
		this.extraData = null;
		this.gasLimit = null;
		this.gasUsed = null;
		this.hash = null;
		this.logsBloom =  null;
		this.miner = null;
		this.mixHash = null;
		this.nonce = null;
		this.number = null;
		this.parentHash = null;
		this.receiptsRoot = null;
		this.sha3Uncles = null;
		this.size = null;
		this.stateRoot = null;
		this.timestamp = null;
		this.totalDifficulty = null;
		this.transactions = null;
		this.transactionsRoot = null;
		this.uncles = null;	
		
		this.getClass = function() { return this.constructor.getClass()};
	}
	
	getNumber() {
		return this.blocknumber;
	}
	
	// sync
	_setData(data) {
		this.data = data;
		
		if (data == null)
			return
		
		// we set members
		
		this.difficulty = parseInt(data.difficulty);
		this.extraData = data.extraData;
		this.gasLimit = data.gasLimit;
		this.gasUsed = data.gasUsed;
		this.hash = data.hash;
		this.logsBloom =  data.logsBloom;
		this.miner = data.miner;
		this.mixHash = data.mixHash;
		this.nonce = data.nonce;
		this.number = data.number;
		this.parentHash = data.parentHash;
		this.receiptsRoot = data.receiptsRoot;
		this.sha3Uncles = data.sha3Uncles;
		this.size = data.size;
		this.stateRoot = data.stateRoot;
		this.timestamp = data.timestamp;
		this.totalDifficulty = data.totalDifficulty;
		this.transactions = data.transactions;
		this.transactionsRoot = data.transactionsRoot;
		this.uncles = data.uncles;	
		
	}

	getData() {
		return this.data;
	}
	
	// sync

	// async
	_readBlock(bWithTransactions, callback) {
		var Block = this.getClass();
		
	    var global = Block.getGlobalObject();
	    var chainreadermodule = global.getModuleObject('ethchainreader');
	    
	    var self = this;
	    
	    var EthereumNodeAccess = chainreadermodule.getEthereumNodeAccess(this.session);
	    
	    return EthereumNodeAccess.web3_getBlock(self.blocknumber, bWithTransactions, function (err, res) {
			if (err) {
				if (callback)
					callback(err, null);
				
				return null;
			}
			
			self._setData(res);
			
			if (callback)
				callback(null, self);
			
			return self;
		});
	}
	
	getTransactions(callback) {
		var Block = this.getClass();
		
	    var global = Block.getGlobalObject();
	    var chainreadermodule = global.getModuleObject('ethchainreader');

	    var Transaction = chainreadermodule.getTransactionClass();
	    
	    var self = this;
	    
	    var promise = this._readBlock(true, function (err, res) {
			if (err) {
				if (callback)
					callback(err, null);
				
				return null;
			}
			
			return res;
		})
		.then( function(res) {
			if (self.transactions) {
				return Transaction.getTransactionsFromJsonArray(self.session, self.transactions, function (err, res) {
					if (err) {
						if (callback)
							callback(err, null);
						
						return null;
					}
					var transactionarray = res;
					
					if (callback)
						callback(null, transactionarray);
					
					return transactionarray;
				});
			}
			else {
				var transactionarray = [];
				
				if (callback)
					callback(null, transactionarray);
				
				return transactionarray;
				
			}
			
		});
	    
	    return promise;
	}
	
	// static
	static getBlock(session, blocknumber, callback) {
		var Block = this.getClass();

		var block = new Block(session, blocknumber);
		
		var promise = block._readBlock(false, function (err, res) {
			if (err) {
				if (callback)
					callback(err, null);
				
				return null;
			}
			
			if (callback)
				callback(null, block);

			return block;
		});
		
		return promise;
		
	}
	
	static getCurrentBlockNumber(session, callback) {
		var Block = this.getClass();

	    var global = Block.getGlobalObject();
	    var chainreadermodule = global.getModuleObject('ethchainreader');
		
		var ethnode = chainreadermodule.getEthereumNodeObject(session);
		var promise = ethnode.getHighestBlockNumber(function (err, res) {
			if (err) {
				if (callback)
					callback(err, -1);
				
				return -1;
			}
			
			var blocknumber = res;
			
			if (callback)
				callback(null, blocknumber);
			
			return blocknumber;
		});
		
		return promise;
	}
	
	static getLastBlockNumber(session, callback) {
		var Block = this.getClass();

		return Block.getCurrentBlockNumber(session, callback);
	}
	
	static getLatestBlock(session, callback) {
		var Block = this.getClass();

		var promise = this.getLastBlockNumber(session)
		.then( function (res) {
			return Block.getBlock(session, res, callback);
		})
		.catch( function (err) {
			if (callback)
			callback(err, null);
		
			return null;		
		});
			
		return promise;
	}

}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
GlobalClass.registerModuleClass('ethchainreader', 'Block', Block);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('ethchainreader', 'Block', Block);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('ethchainreader', 'Block', Block);
}