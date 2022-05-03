import { utils } from 'ethers';
import { ConstructorFragment } from '@ethersproject/abi';
import { ABI, Argument, Arguments } from '../../utils/types';
import { ensure } from '../../utils/utils';

interface ParamererInput {
  type: string;
  value: Argument;
  name?: string;
}

interface Parameters {
  type: string;
  funcName: string;
  inputs: ParamererInput[];
}

const abiCoder = new utils.AbiCoder();

/* eslint "no-unused-vars": "off" */
type Validator = (value: Argument) => void;
/* eslint "no-unused-vars": "off" */
const defaultValidator: Validator = (_) => {};

const addressValidator: Validator = (value) => ensure(utils.isAddress(value as string), 'Input element is not address');

const arrayValidator = (validator: Validator): Validator => (value) => {
  ensure(Array.isArray(value), 'Input element is not array');
  (value as any[]).forEach((inp) => validator(inp));
};

const validateParameter = (type: string): Validator => {
  switch (type) {
    // case "bool": return boolValidator;
    // case "bool[]": return arrayValidator(boolValidator);
    case 'address': return addressValidator;
    case 'address[]': return arrayValidator(addressValidator);
    default: return defaultValidator;
  }
};

const parseParameter = ({ type, value }: ParamererInput): any => {
  switch (type) {
    case 'bool': return value;
    default: return value;
  }
};

const encodeParameters = ({ inputs }: Parameters): string => {
  inputs.forEach(({ type, value }) => validateParameter(type)(value));

  const types = inputs.map((param) => param.type);
  const preparedInputs = inputs.map(parseParameter);

  const encodedParams = abiCoder
    .encode(types, preparedInputs)
    .slice(2);

  return encodedParams;
};

const prepareForEncode = (args: Arguments, constructor: ConstructorFragment): Parameters => {
  ensure(constructor.inputs.length === args.length, 'Constructor input does not match the length of given arguments');
  return {
    funcName: constructor.name,
    type: constructor.type,
    inputs: constructor.inputs.map((inp, index) => ({
      type: inp.type,
      value: args[index],
      name: inp.name,
    })),
  };
};

export default (deployedBytecode: string, abi: ABI, args: Arguments): void => {
  const filteredAbi = abi.filter((fun) => fun.type === 'constructor');
  if (filteredAbi.length === 0) {
    ensure(args.length === 0, 'Contract does not have any arguments');
    return;
  }

  const constructor = filteredAbi[0];
  const encoderData = prepareForEncode(args, constructor as ConstructorFragment);
  const encoded = encodeParameters(encoderData);

  ensure(deployedBytecode.endsWith(encoded), 'Contract arguments are not the same');
};
