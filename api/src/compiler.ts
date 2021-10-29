import { Target } from "./types";
import { ensure } from "./utils";

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
    evmVersion: Target;
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

const prepareSolcContracts = (contracts: Contracts, evmVersion: Target): SolcContracts => ({
  language: 'Solidity',
  sources: toCompilerContracts(contracts),
  settings: {
    evmVersion: evmVersion,
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
});

const prepareOptimizedSolcContracts = (contracts: Contracts, runs: number, evmVersion: Target): SolcContracts => ({
  language: 'Solidity',
  sources: toCompilerContracts(contracts),
  settings: {
    evmVersion: evmVersion,
    optimizer: {
      runs: runs,
      enabled: true,
    },
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
});

const preprocessBytecode = (bytecode: string): string => {
  let filteredBytecode = "";
  const start = bytecode.indexOf('6080604052');
  //
  // metadata separator (solc >= v0.6.0)
  //
  const ipfsMetadataEnd = bytecode.indexOf('a264697066735822');
  filteredBytecode = bytecode.slice(start, ipfsMetadataEnd);

  //
  // metadata separator for 0.5.16
  //
  const bzzr1MetadataEnd = filteredBytecode.indexOf('a265627a7a72315820');
  filteredBytecode = filteredBytecode.slice(0, bzzr1MetadataEnd);

  // debug
  // logger.info(loggerOptions, `processed bytecode: ${bytecode}`);

  return filteredBytecode;
}
  
const loadCompiler = async (version: string): Promise<any> => (
  new Promise((resolve, reject) => {
    solc.loadRemoteVersion(version, (err, solcSnapshot) => {
      err ? reject(err) : resolve(solcSnapshot);
    });
  })
)

interface CompilerResult {
  errors?: {
    type: string;
    formattedMessage: string;
  }[];
  contracts?: {
    [filename: string]: {
      [name: string]: any;
    };
  };
  sources: {
    [filename: string]: {
      id: number;
    };
  };
}

const compressErrors = ({errors=[]}: CompilerResult): string => errors
  .reduce((prev, error) => (error.type.toLowerCase().includes("error")
    ? `${prev}\n${error.formattedMessage}`
    : prev
  ), "");

// type Bytecode = string;
interface Compile {
  abi: any;
  bytecode: string;
}
export const compileContracts = async (contractName: string, contractFilename: string, source: string, version: string, target: Target, optimizer?: boolean, runs=200): Promise<Compile> => {
  const compiler = await loadCompiler(version);
  const contracts = JSON.parse(source);
  
  const solcData = optimizer 
    ? prepareOptimizedSolcContracts(contracts, runs, target)
    : prepareSolcContracts(contracts, target);

  const compilerResult = JSON.parse(compiler.compile(JSON.stringify(solcData)));
  const error = compressErrors(compilerResult);
  ensure(error === "", error);
  ensure(contractFilename in compilerResult.contracts, "Filename does not exist in compiled results");
  ensure(contractName in compilerResult.contracts[contractFilename], "Name does not exist in compiled results");
  const result = compilerResult.contracts[contractFilename][contractName];
  // return preprocessBytecode(result.evm.bytecode.object);
  return {
    abi: result.abi,
    bytecode: preprocessBytecode(result.evm.bytecode.object)
  }
}