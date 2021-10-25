const solc = require('solc');

export interface Contracts {
  [contractFilename: string]: string
}

interface CompilerContracts {
  [filename: string]: {
    content: string;
  }
}

interface SolcContracts {
  language: 'Solidity';
  sources: CompilerContracts;
  settings: {
    optimizer?: {
      enabled: true;
      runs: number;
    };
    outputSelection: {
      "*": {
        '*': string[];
      };
    };
  };
}

const toCompilerContracts = (contracts: Contracts): CompilerContracts => 
  Object.keys(contracts)
  .reduce(
    (prev, key) => ({...prev, [key]: {content: contracts[key]}}),
    {} as CompilerContracts
  );

const prepareSolcContracts = (contracts: Contracts): SolcContracts => ({
  language: 'Solidity',
  sources: toCompilerContracts(contracts),
  settings: {
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
});

const prepareOptimizedSolcContracts = (contracts: Contracts, runs: number): SolcContracts => ({
  language: 'Solidity',
  sources: toCompilerContracts(contracts),
  settings: {
    optimizer: {
      enabled: true,
      runs: runs
    },
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
});

const preprocessBytecode = (bytecode: string): string => {
  // TODO preprocess bytecode
  return bytecode;
}
  
const loadCompiler = async (version: string): Promise<any> => (
  new Promise((resolve, reject) => {
    solc.loadRemoteVersion(version, (err, solcSnapshot) => {
      err ? reject(err) : resolve(solcSnapshot);
    });
  })
)

type Bytecode = string;
// interface CompilerResult {
//   abi: string;
//   bytecode: string;
// }
export const compileContracts = async (contractName: string, contractFilename: string, source: string, version: string, optimizer?: boolean, runs=200): Promise<Bytecode> => {
  const compiler = await loadCompiler(version);
  const contracts = JSON.parse(source);
  const solcData = optimizer 
    ? prepareOptimizedSolcContracts(contracts, runs)
    : prepareSolcContracts(contracts);

  const compilerResult = JSON.parse(compiler.compile(JSON.stringify(solcData)))
  const result = compilerResult.contracts[contractFilename][contractName];
  return preprocessBytecode(result.evm.bytecode.object);
  // return {
  //   abi: JSON.stringify(result.abi),
  //   bytecode: preprocessBytecode(result.evm.bytecode.object)
  // }
}