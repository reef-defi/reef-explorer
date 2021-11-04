import erc20contract from "./contracts/ERC20Contract/abi";
import flipper from "./contracts/Flipper/abi";
import greete from "./contracts/Greete/abi";
import storage from "./contracts/Storage/abi";

import erc20bytecode from "./contracts/ERC20Contract/bytecode";
import flipperBytecode from "./contracts/Flipper/bytecode";
import greeteBytecode from "./contracts/Greete/bytecode";
import storageBytecode from "./contracts/Storage/bytecode";

import flipperSource from "./contracts/Flipper/source";
import greeteSource from "./contracts/Greete/source";
import storageSource from "./contracts/Storage/source";
import erc20Source from "./contracts/ERC20Contract/source";

import {verifyContractArguments} from "../src/compiler/argumentEncoder";

import {verifyContract} from "../src/compiler/compiler";
import {describe, it} from "mocha";
import {expect} from "chai";
import { ABI } from "../src/types";

const argumentTester = (bytecode: string, abi: ABI, args: string) => {
  try {
    verifyContractArguments(bytecode, abi, `[\"${args}\"]`)
    return true;
  } catch (err) {
    // console.log(err)
    return false;
  }
}

const sourceTester = (bytecode: string, source: string, filename: string, name: string) => {
  try {
    verifyContract(bytecode, {
      name,
      filename,
      source,
      compilerVersion: "v0.8.4+commit.c7e474f2",
      target: "london",
      optimization: "true",
      runs: 200,

      address: "",
      arguments: "",
      bytecode: "",
      license: "unlicense"
    })
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

describe('Testing valid argument verification', () => {
  it('should verify Storage arguments', () => 
    expect(argumentTester(storageBytecode, storage, "9879461")).to.true
  );
  it('should verify Greete arguments', () => 
    expect(argumentTester(greeteBytecode, greete, "hello world")).to.true
  )
  it('should verify Flipper arguments', () => 
    expect(argumentTester(flipperBytecode, flipper, "true")).to.true
  )
  it('should verify ERC20Contract arguments', () => 
    expect(argumentTester(erc20bytecode, erc20contract, "98498461321894986543498498461")).to.true
  )
});

describe('Testing invalid argument verification', () => {
  it('should not verify Storage arguments', () => 
    expect(argumentTester(storageBytecode, storage, "9")).to.false
  );
  it('should not verify Greete arguments', () => 
    expect(argumentTester(greeteBytecode, greete, "hello")).to.false
  )
  it('should not verify Flipper arguments', () => 
    expect(argumentTester(flipperBytecode, flipper, "false")).to.false
  )
  it('should not verify ERC20Contract arguments', () => 
    expect(argumentTester(erc20bytecode, erc20contract, "984984613218461")).to.false
  )
});

describe('Testing valid contract sources', () => {
  it('should verify Flipper contract source', () => 
    expect(sourceTester(flipperBytecode, flipperSource, "Flipper.sol", "Flipper")).to.true
  )
  it('should verify Greete contract source', () => 
    expect(sourceTester(greeteBytecode, greeteSource, "Greete.sol", "Greete")).to.true
  )
  it('should verify Storage contract source', () => 
    expect(sourceTester(storageBytecode, storageSource, "Storage.sol", "Storega")).to.true
  )
  it('should verify ERC20 contract source', () => 
    expect(sourceTester(erc20bytecode, erc20Source, "contracts/4_ERC20Contract.sol", "ERC20Contract")).to.true
  )
})

describe('Testing invalid contract sources', () => {
  it('should verify Flipper contract source', () => 
    expect(sourceTester(flipperBytecode, greeteSource, "Greete.sol", "Greete")).to.true
  )
  it('should verify Greete contract source', () => 
    expect(sourceTester(greeteBytecode, flipperSource, "Flipper.sol", "Flipper")).to.true
  )
  it('should verify Storage contract source', () => 
    expect(sourceTester(storageBytecode, erc20Source, "contracts/4_ERC20Contract.sol", "ERC20Contract")).to.true
  )
  it('should verify ERC20 contract source', () => 
    expect(sourceTester(erc20bytecode, storageSource, "Storage.sol", "Storega")).to.true
  )
})