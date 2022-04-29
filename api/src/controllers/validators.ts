import Ajv, { JSONSchemaType, ValidateFunction } from "ajv";
import { AutomaticContractVerificationReq, ManualContractVerificationReq, TokenBalanceParam } from "../utils/types";
import { ensure } from "../utils/utils";

const ajv = new Ajv();

interface ID { id: string; }
interface Status { status: string; }
interface Address { address: string; }

// ajv rules
const evmAddressProps = {minLength: 42, maxLength: 42};
const nativeAddressProps = {minLength: 48, maxLength: 48};

// ajv schemas 
const accountTokenBalanceSchema: JSONSchemaType<TokenBalanceParam> = {
  type: "object",
  properties: {
    accountAddress: {type: "string", ...nativeAddressProps},
    contractAddress: {type: "string", ...evmAddressProps},
  },
  required: ["accountAddress", "contractAddress"],
  additionalProperties: false,
}

const submitVerificationSchema: JSONSchemaType<AutomaticContractVerificationReq> = {
  type: "object",
  properties: {
    address: { type: "string", ...nativeAddressProps},
    arguments: {type: "string"},
    bytecode: {type: "string", minLength: 2},
    compilerVersion: {type: "string"},
    filename: {type: "string"},
    license: {type: "string"},
    name: {type: "string"},
    optimization: {type: "string"},
    runs: {type: "number"},
    source: {type: "string"},
    target: {type: "string"},
  },
  required: ["address", "arguments", "bytecode", "compilerVersion", "filename", "license", "name", "optimization", "runs", "source", "target"],
  additionalProperties: false,
}

const formVerificationSchema: JSONSchemaType<ManualContractVerificationReq> = {
  type: "object",
  properties: {...submitVerificationSchema.properties!,
    token: { type: "string" },
  },
  required: [...submitVerificationSchema.required, "token"],
}

const verificationStatusSchema: JSONSchemaType<Status> = {
  type: "object",
  properties: {
    status: { type: "string" },
  },
  required: ["status"],
};

const idSchema: JSONSchemaType<ID> = {
  type: "object",
  properties: {
    id: { type: "string" },
  },
  required: ["id"],
};

const evmAddressSchema: JSONSchemaType<Address> = {
  type: "object",
  properties: {
    address: { type: "string", ...evmAddressProps},
  },
  required: ["address"],
};

const nativeAddressSchema: JSONSchemaType<Address> = {
  type: "object",
  properties: {
    address: { type: "string", ...nativeAddressProps},
  },
  required: ["address"],
};

// available validators
export const idValidator = ajv.compile(idSchema);
export const evmAddressValidator = ajv.compile(evmAddressSchema);
export const nativeAddressValidator = ajv.compile(nativeAddressSchema);
export const verificationStatusValidator = ajv.compile(verificationStatusSchema);
export const formVerificationValidator = ajv.compile(formVerificationSchema);
export const accountTokenBodyValidator = ajv.compile(accountTokenBalanceSchema);
export const automaticVerificationValidator = ajv.compile(submitVerificationSchema);


export const validateData = <T,>(data: T, fun: ValidateFunction<T>): void => {
  const isValid = fun(data);
  const message = (fun.errors || [])
    .map((error) => error.message || "")
    .filter((message) => message)
    .join(", ");
  ensure(isValid, message, 400);
}