import { ABI, AutomaticContractVerificationReq, Target } from "../../utils/types";
import { ensure } from "../../utils/utils";

const solc = require('solc');


interface Contracts {
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
    optimizer: {
      runs: number;
      enabled: boolean;
    };
    evmVersion?: Target;
    outputSelection: {
      "*": {
        '*': string[];
      };
    };
  };
}

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

interface Compile {
  abi: ABI;
  fullAbi: ABI;
  fullBytecode: string;
}

interface VerifyContract {
  abi: ABI;
  fullAbi: ABI;
}

const toCompilerContracts = (contracts: Contracts): CompilerContracts => 
  Object.keys(contracts)
  .reduce(
    (prev, key) => ({...prev, [key]: {content: contracts[key]}}),
    {} as CompilerContracts
  );

const evmVersion = (version: Target) => version === "london" ? {} : {evmVersion: version};

const prepareSolcData = (contracts: Contracts, target: Target, enabled: boolean, runs: number): SolcContracts => ({
  language: "Solidity",
  sources: toCompilerContracts(contracts),
  settings: {
    ...evmVersion(target),
    optimizer: {
      runs,
      enabled
    },
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
})

const preprocess = (fullBytecode: string): string => {
  const start = fullBytecode.indexOf('6080604052');
  const end = fullBytecode.indexOf('a265627a7a72315820') !== -1
    ? fullBytecode.indexOf('a265627a7a72315820')
    : fullBytecode.indexOf('a264697066735822')
  return fullBytecode.slice(start, end);;
}

const loadCompiler = async (version: string): Promise<any> => (
  new Promise((resolve, reject) => {
    solc.loadRemoteVersion(version, (err, solcSnapshot) => {
      err ? reject(err) : resolve(solcSnapshot);
    });
  })
)

const compressErrors = ({errors=[]}: CompilerResult): string => errors
  .reduce((prev, error) => (error.type.toLowerCase().includes("error")
    ? `${prev}\n${error.formattedMessage}`
    : prev
  ), "");

const extractAbis = (contracts: any): ABI[] => Object.keys(contracts)
  .map((name) => contracts[name].abi);

const compileContracts = async (name: string, filename: string, source: string, compilerVersion: string, target: Target, optimizer?: boolean, runs=200): Promise<Compile> => {
  const compiler = await loadCompiler(compilerVersion);
  const contracts = JSON.parse(source);
  
  const solcData = prepareSolcData(contracts, target, optimizer, runs);
  const compilerResult = JSON.parse(compiler.compile(JSON.stringify(solcData)));

  const error = compressErrors(compilerResult);
  ensure(error === "", error);
  ensure(filename in compilerResult.contracts, "Filename does not exist in compiled results");
  ensure(name in compilerResult.contracts[filename], "Name does not exist in compiled results");
  
  const fullAbi: ABI = Object.keys(compilerResult.contracts)
    .reduce(
      (prev, filename) => [...prev, ...extractAbis(compilerResult.contracts[filename])],
      []
    );

  return {
    abi: compilerResult.contracts[filename][name].abi,
    fullAbi,
    fullBytecode: compilerResult.contracts[filename][name].evm.bytecode.object
  }
}

export const verifyContract = async (deployedBytecode: string, {name, filename, source, compilerVersion, target, optimization, runs}: AutomaticContractVerificationReq): Promise<VerifyContract> => {
  const {abi, fullAbi, fullBytecode} = await compileContracts(name, filename, source, compilerVersion, target, optimization === "true", runs);
  const parsedBytecode = preprocess(fullBytecode);
  const rpcBytecode = preprocess(deployedBytecode);

  ensure(parsedBytecode === rpcBytecode, "Compiled bytecode is not the same as deployed one");
  return {
    abi,
    fullAbi
  };
}