import { utils } from 'ethers';
import {ABI, ABIFragment, Parameters} from "../types"
import { ensure } from '../utils';


export const isArrayType = (type: string) => {
  return type.includes("[]");
}

enum VALIDATE_ERROS {
  NOT_ARRAY = "Invalid input: Value is not an array.",
  NOT_BOOLEAN = "Invalid input: bool must be true or false",
  NOT_ADDRESS = "Ivalid input: value is not an address",
}

type Validator = (value: string) => string | null;

const validateArray = (value: string, itemValidator: Validator) => {
  try {
    const parsedValue = JSON.parse(value);
    if(!Array.isArray(parsedValue)) return VALIDATE_ERROS.NOT_ARRAY;
    let message: string | null = null;
    parsedValue.forEach((item) => {
      if(message) return;
      if(typeof item !== "string") item = item.toString();
      message = itemValidator(item);
    })

    return message;
  } catch(e: any) {
    return e.message;
  }
}

const validators: {[x: string]: Validator} = {
  "address": (value: string) => utils.isAddress(value) ? null : VALIDATE_ERROS.NOT_ADDRESS,
  "address[]": (value: string) => validateArray(value, validators.address),
  "bool": (value: string) => {
    if(!["true", "false"].includes(value)) {
      return VALIDATE_ERROS.NOT_BOOLEAN;
    }
    return null;
  },
  "bool[]": (value: string) => validateArray(value, validators.bool)
}

const parsers: {[x: string]: (value: string) => any} = {
  "bool": (value: string): boolean => value === 'true',
} 

const abiCoder = new utils.AbiCoder();

interface EncoderOutput {
  encoded: string;
  errors: string[];
}
const encode = (parameters: Parameters): EncoderOutput => {
  const inputsLength = parameters.inputs.length;
  let types: string[] = [];
  let inputs: any[] = [];
  let errors: string[] = [];
  let valid = true;
  let encoded = "";
  let emptyLines = parameters.inputs.filter((input) => !input.value).length;
  
  if (emptyLines === inputsLength) {
    valid = false;
    return {
        errors,
        encoded,
      }
    }
    
    parameters.inputs.forEach((item, index) => {
      const { type, value } = item;
      types.push(item.type);
      const validator: Validator = validators[type] || (() => "");
      const isArray = isArrayType(type);
      const parser: any = parsers[type] || ((v: any) => v);
      let errorMessage = validator(value);
      if(!errorMessage && isArray) {
        errorMessage = validateArray(value, () => "");
      }
      if(errorMessage){
        valid = false;
        errors[index] = errorMessage;
        return;
      }else{
        if (isArray && value){
          inputs.push(JSON.parse(value));
        } else {
          inputs.push(parser(value));
        }  
      }
      try {
        abiCoder.encode(types, inputs);
        errors[index] = "";
      } catch (err: any) {
        valid = false;
        errors[index] = `Invalid input: ${err.message}`;
      }
    })
  
  if (valid) {
    if (parameters.type !== 'constructor') {
      const sig = parameters.funcName + "(" + types.join(",") + ")";
      encoded += utils.hexDataSlice(utils.id(sig), 0, 4).slice(2);
    }
    encoded += abiCoder.encode(types, inputs).slice(2);
  }
  return {
    errors,
    encoded
  }
}

const encodeParameters = (parameters: Parameters) => {
  
}

const prepareForEncode = (args: string[], constructor: ABIFragment): Parameters => ({
  funcName: constructor.name,
  type: constructor.type,
  inputs: constructor.inputs.map((inp, index) => ({
    type: inp.type,
    value: args[index],
    name: inp.name
  }))
})

export const verifyContractArguments = (deployedBytecode: string, abi: ABI, stringArgs: string): void => {
  const args = JSON.parse(stringArgs);
  const filteredAbi = abi.filter((module) => module.type === "constructor")
  if (filteredAbi.length === 0) { return; }
  const constructor = filteredAbi[0];
  ensure(constructor.inputs.length === args.length, "Constructor input does not match with given arguments");
  const encoderData = prepareForEncode(args, constructor);
  const {errors, encoded} = encode(encoderData);
  const filteredErrors = errors.filter((err) => err !== "");
  ensure(filteredErrors.length === 0, `Error when encoding arguments: ${filteredErrors[0]}`)
  ensure(deployedBytecode.endsWith(encoded), "Contract arguments are not the same");
}