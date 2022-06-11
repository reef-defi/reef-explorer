import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import {
  AutomaticContractVerificationReq,
  compilerTargets,
  License,
  ManualContractVerificationReq,
  Target,
  TokenBalanceParam,
} from '../utils/types';
import { ensure } from '../utils/utils';

const ajv = new Ajv();

interface ID {
  id: string;
}
interface Status {
  status: string;
}
// interface Address { address: string; }

// basic ajv schemas
const nativeAddressSchema: JSONSchemaType<string> = {
  type: 'string',
  // Matchin reef native address with '5' and 47 other chars
  pattern: '5[0-9a-zA-Z]{47}',
};
const evmAddressSchema: JSONSchemaType<string> = {
  type: 'string',
  // Matchin evm address with '0x' and 40 other chars
  pattern: '0x[0-9a-fA-F]{40}',
};
const filenameSchema: JSONSchemaType<string> = {
  type: 'string',
  pattern: '.+.sol',
};

const optimizationSchema: JSONSchemaType<string> = {
  type: 'string',
  pattern: 'true|false',
};
const licencesSchema: JSONSchemaType<License> = {
  type: 'string',
  // pattern: compilerLicenses.join('|'),
};
const targetSchema: JSONSchemaType<Target> = {
  type: 'string',
  pattern: compilerTargets.join('|'),
};
const compilerVersionSchema: JSONSchemaType<string> = {
  type: 'string',
  pattern: 'v[0-9]+.[0-9]+.[0-9]+.*',
};

// Constructing optional type of string, boolean and number
// const optionalSchema: JSONSchemaType<string|boolean|number> = {
//   type: ["boolean", "string", "integer"],
// };

// TODO currently we accept agruments as a string, which is not good.
// Arguments should have a type of Argument[]!
// Couldn't found a way in the Ajv lib to self-referencing declared array
// const argumentSchema: JSONSchemaType<Arguments> = {
//   type: "array",
//   items: [
//     {type: "string"},
//     {type: "boolean"},
//     {type: "number"}
//     {type: "array", items: this} // the array should link back to
//   ]
// }

// TODO the same for the source content.
// For the time being we are accepting source as a strinyfied JSON
// But this must change to an object with {[filename: string]: [content: string]}!
// Current schema ensures that string is an object
// const sourceSchema: JSONSchemaType<Source> = {
//   type: 'object',
//   required: [],
//   // Source filename must finish with .sol
//   propertyNames: {
//     type: "string",
//     // pattern: /.sol/g,
//   },
//   properties: {

//   }
//   // Each value in source must be of type string
//   // unevaluatedProperties: {
//   //   type: "string"
//   // }
// }

// This are only temporary aruments and source validators!
const argumentSchema: JSONSchemaType<string> = {
  type: 'string',
  // Arguments string must start and end with [ ], content is optional
  pattern: '\\[.*\\]',
};
const sourceSchema: JSONSchemaType<string> = {
  type: 'string',
  // Source string must start and end with { }, content is necessary
  pattern: '[{].+[}]',
};

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
    arguments: argumentSchema,
    name: { type: 'string' },
    runs: { type: 'number' },
    compilerVersion: compilerVersionSchema,
    filename: filenameSchema,
    license: licencesSchema,
    optimization: optimizationSchema,
    source: sourceSchema,
    target: targetSchema,
  },
  required: [
    'address',
    'arguments',
    'compilerVersion',
    'filename',
    'license',
    'name',
    'optimization',
    'runs',
    'source',
    'target',
  ],
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
export const verificationStatusValidator = ajv.compile(
  verificationStatusSchema,
);
export const formVerificationValidator = ajv.compile(formVerificationSchema);
export const accountTokenBodyValidator = ajv.compile(accountTokenBalanceSchema);
export const automaticVerificationValidator = ajv.compile(
  submitVerificationSchema,
);

export const validateData = <T>(data: T, fun: ValidateFunction<T>): void => {
  const isValid = fun(data);
  const message = (fun.errors || [])
    .map((error) => error.message || '')
    .filter((msg) => msg)
    .join(', ');
  ensure(isValid, message, 400);
};
