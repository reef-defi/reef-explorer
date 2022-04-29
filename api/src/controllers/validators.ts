import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import { Arguments, AutomaticContractVerificationReq, ManualContractVerificationReq, Source, TokenBalanceParam } from '../utils/types';
import { ensure } from '../utils/utils';

const ajv = new Ajv();

interface ID { id: string; }
interface Status { status: string; }
interface Address { address: string; }

// basic ajv schemas
const nativeAddressSchema: JSONSchemaType<string> = {
  type: "string",
  // Matchin reef native address with '5' and 47 other chars 
  pattern: '5[0-9a-zA-Z]{47}',
  minLength: 48,
  maxLength: 48,
}
const evmAddressSchema: JSONSchemaType<string> = {
  type: "string",
  // Matchin evm address with '0x' and 40 other chars 
  pattern: '0x[0-9a-fA-F]{40}',
  minLength: 42,
  maxLength: 42,
}
const argumentValidatorSchema: JSONSchemaType<Arguments> = {
  type: "array",
  items: {}
}
const sourceValidatorSchema: JSONSchemaType<Source> = {
  type: 'object',
  required: [],
  // Source filename must finish with .sol
  propertyNames: {
    type: "string",
    // pattern: /.sol/g,
  },
  properties: {
    
  }
  // Each value in source must be of type string
  // unevaluatedProperties: {
  //   type: "string"
  // }
}

// Object validator schemas
const verificationStatusSchema: JSONSchemaType<Status> = {
  type: 'object',
  properties: {
    status: { type: 'string' },
  },
  required: ['status'],
};

const idSchema: JSONSchemaType<ID> = {
  type: 'object',
  properties: {
    id: { type: 'string' },
  },
  required: ['id'],
};

// combined ajv schemas
const accountTokenBalanceSchema: JSONSchemaType<TokenBalanceParam> = {
  type: 'object',
  properties: {
    accountAddress: nativeAddressSchema,
    contractAddress: evmAddressSchema,
  },
  required: ['accountAddress', 'contractAddress'],
  additionalProperties: false,
};

const submitVerificationSchema: JSONSchemaType<AutomaticContractVerificationReq> = {
  type: 'object',
  properties: {
    address: evmAddressSchema,
    arguments: argumentValidatorSchema,
    name: { type: 'string' },
    runs: { type: 'number' },
    compilerVersion: { type: 'string' },
    filename: { type: 'string' },
    license: { type: 'string' },
    optimization: { type: 'boolean' },
    source: sourceValidatorSchema,
    target: { type: 'string' },
  },
  required: ['address', 'arguments', 'compilerVersion', 'filename', 'license', 'name', 'optimization', 'runs', 'source', 'target'],
  additionalProperties: false,
};
const formVerificationSchema: JSONSchemaType<ManualContractVerificationReq> = {
  type: 'object',
  properties: {
    ...submitVerificationSchema.properties!,
    token: { type: 'string' },
  },
  required: [...submitVerificationSchema.required, 'token'],
};

// available validators
export const idValidator = ajv.compile(idSchema);
export const evmAddressValidator = ajv.compile(evmAddressSchema);
export const nativeAddressValidator = ajv.compile(nativeAddressSchema);
export const verificationStatusValidator = ajv.compile(verificationStatusSchema);
export const formVerificationValidator = ajv.compile(formVerificationSchema);
export const accountTokenBodyValidator = ajv.compile(accountTokenBalanceSchema);
export const automaticVerificationValidator = ajv.compile(submitVerificationSchema);

export const validateData = <T, >(data: T, fun: ValidateFunction<T>): void => {
  const isValid = fun(data);
  const message = (fun.errors || [])
    .map((error) => error.message || '')
    .filter((msg) => msg)
    .join(', ');
  ensure(isValid, message, 400);
};
