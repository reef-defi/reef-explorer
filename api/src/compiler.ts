import { ensure } from "./utils";
import { License, Target } from './types';
import { checkIfContractIsVerified, contractVerificationInsert, findContractBytecode } from './queries';

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

type Bytecode = string;
export const compileContracts = async (contractName: string, contractFilename: string, source: string, version: string, optimizer?: boolean, runs=200): Promise<Bytecode> => {
  const compiler = await loadCompiler(version);
  const contracts = JSON.parse(source);
  const solcData = optimizer 
    ? prepareOptimizedSolcContracts(contracts, runs)
    : prepareSolcContracts(contracts);

  const compilerResult = JSON.parse(compiler.compile(JSON.stringify(solcData)));
  ensure(contractFilename in compilerResult.contracts, "Filename does not exist in compiled results");
  ensure(contractName in compilerResult.contracts[contractFilename], "Name does not exist in compiled results");
  const result = compilerResult.contracts[contractFilename][contractName];
  const preprocessedBytecode = preprocessBytecode(result.evm.bytecode.object);
  console.log('compiled bytecode:', result.evm.bytecode.object);
  console.log('preprocessed compiled bytecode:', preprocessedBytecode);
  return preprocessedBytecode;
}


export const verifyContracts = async (address: string, contractName: string, filename: string, constructorArguments: string, source: string, compilerVersion: string, target: Target, optimization: boolean, runs: number, license: License): Promise<Boolean> => {
  console.log('verifyContract:',)
  const bytecode = await compileContracts(
    contractName,
    filename,
    source,
    compilerVersion,
    optimization,
    runs
  );
  ensure(bytecode.length > 0, "Compiler produced wrong output. Please contact reef team!", 404);
  const deployedBytecode = await findContractBytecode(address);
  const verified = deployedBytecode.includes(bytecode);
  const status = verified ? "VERIFIED" : "NOT VERIFIED";
  await contractVerificationInsert({
    runs,
    source,
    status,
    target,
    address,
    filename,
    license,
    constructorArguments,
    optimization,
    compilerVersion
  });
  return verified;
}