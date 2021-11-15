import axios from "axios";
import { Response } from "express";
import { APP_CONFIGURATION } from "../config";
import { query } from "../connector";
import { verifyContractArguments } from "../contract-compiler/argumentEncoder";
import { verifyContract } from "../contract-compiler/compiler";
import { checkIfContractIsERC20, extractERC20ContractData } from "../contract-compiler/erc-checkers";
import { AppRequest, AutomaticContractVerificationReq, Bytecode, ContractVerificationID, ContracVerificationInsert, ERC20Data, ManualContractVerificationReq, Status, UpdateContract } from "../types";
import { ensureObjectKeys, errorStatus, ensure } from "../utils";


const FIND_CONTRACT_BYTECODE = `SELECT deployment_bytecode
FROM contract
WHERE contract_id = $1`;

const UPDATE_CONTRACT_STATUS = `UPDATE contract
SET verified = TRUE, name = $2, compiler_data = $3, source = $4, compiler_version = $5, optimization = $6, target = $7
WHERE contract_id = $1`;

const INSERT_CONTRACT_VERIFICATION = `INSERT INTO contract_verification_request
(contract_id, source, name, filename, compiler_version, arguments, optimization, runs, target, status, timestamp)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`;

const INSERT_ERC20_TOKEN = `
INSERT INTO erc20 
  (contract_id, name, symbol, decimals)
VALUES
  ($1, $2, $3, $4);`;

const CONTRACT_VERIFICATION_STATUS = `SELECT status FROM contract_verification_request WHERE id = $1`;

// Queries 
const contractVerificationInsert = async (contract: ContracVerificationInsert): Promise<void> => {
  const timestamp = Date.now();
  await query(
    INSERT_CONTRACT_VERIFICATION,
    [
      contract.address,
      contract.source,
      contract.name,
      contract.filename,
      contract.compilerVersion,
      contract.arguments,
      contract.optimization,
      contract.runs,
      contract.target,
      contract.status,
      timestamp,
    ]
  );
};

const updateContractStatus = async ({address, name, abi, source, compilerVersion, optimization, target}: UpdateContract): Promise<void> => {
  await query(
    UPDATE_CONTRACT_STATUS,
    [address, name, JSON.stringify(abi), source, compilerVersion, optimization, target]
  );
};

const insertErc20Token = async (address: string, {name, symbol, decimals}: ERC20Data): Promise<void> => {
  await query(INSERT_ERC20_TOKEN, [address, name, symbol, decimals]);
}

const findContractBytecode = async (address: string): Promise<string> => {
  const bytecodes = await query<Bytecode>(FIND_CONTRACT_BYTECODE, [address]);
  ensure(bytecodes.length > 0, "Contract does not exist", 404);
  return bytecodes[0].deployment_bytecode;
}

const verify = async (verification: AutomaticContractVerificationReq): Promise<void> => {
  const deployedBytecode = await findContractBytecode(verification.address);
  const {abi, fullAbi} = await verifyContract(deployedBytecode, verification);
  verifyContractArguments(deployedBytecode, abi, verification.arguments);
  
  if (checkIfContractIsERC20(abi)) {
    const data = await extractERC20ContractData(verification.address, abi);
    await insertErc20Token(verification.address, data);
  }

  await updateContractStatus({...verification, abi: fullAbi, optimization: verification.optimization === "true"});
  await contractVerificationInsert({...verification, status: "VERIFIED", optimization: verification.optimization === "true"})
}

const contractVerificationStatus = async (id: string): Promise<string> => {
  const result = await query<Status>(CONTRACT_VERIFICATION_STATUS, [id]);
  ensure(result.length > 0, "Contract does not exist...", 404);
  return result[0].status;
};


const authenticationToken = async (token: string): Promise<boolean> => await axios
  .get(`https://www.google.com/recaptcha/api/siteverify?secret=${APP_CONFIGURATION.recaptchaSecret}&response=${token}`)
  .then((res) => res.data.success)
  .catch((err) => {
    console.log(err);
    throw new Error("Can not extract recaptcha token...")
  });


export const submitVerification = async (req: AppRequest<AutomaticContractVerificationReq>, res: Response) => {
  try {
    ensureObjectKeys(req.body, ["address", "name", "runs", "filename", "source", "compilerVersion", "optimization", "arguments", "address", "target"]);
    await verify(req.body);
    res.send("Verified");
  } catch (err) {
    console.log(err);
    if (err.status === 404) {
      await contractVerificationInsert({...req.body, status: "NOT VERIFIED", optimization: req.body.optimization === "true"})
    }
    res.status(errorStatus(err)).send({message: err.message});
  }
};

export const formVerification = async (req: AppRequest<ManualContractVerificationReq>, res: Response) => {
  try {
    ensureObjectKeys(req.body, ["address", "name", "runs", "filename", "source", "compilerVersion", "optimization", 'token', "arguments", "address", "target"]);
    
    const isAuthenticated = await authenticationToken(req.body.token);
    ensure(isAuthenticated, "Google Token Authentication failed!", 404);
    
    await verify(req.body);
    res.send("Verified");
  } catch (err) {
    if (err.status === 404) {
      await contractVerificationInsert({...req.body, status: "NOT VERIFIED", optimization: req.body.optimization === "true"})
    }
    res.status(errorStatus(err)).send(err.message);
  }
};

export const verificationStatus = async (req: AppRequest<ContractVerificationID>, res: Response) => {
  try {
    ensure(!!req.body.id, "Parameter id is missing");
    const status = await contractVerificationStatus(req.body.id);
    res.send(status);
  } catch (err) {
    res.status(errorStatus(err)).send(err.message);
  }
};