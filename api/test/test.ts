import erc20contract from "./contracts/ERC20Contract/abi";
import swve from "./contracts/SWVE/abi";
import flipper from "./contracts/Flipper/abi";
import greete from "./contracts/Greete/abi";
import storage from "./contracts/Storage/abi";

import swveBytecode from "./contracts/SWVE/bytecode";
import erc20bytecode from "./contracts/ERC20Contract/bytecode";
import flipperBytecode from "./contracts/Flipper/bytecode";
import greeteBytecode from "./contracts/Greete/bytecode";
import storageBytecode from "./contracts/Storage/bytecode";

import swveSource from "./contracts/SWVE/source";
import flipperSource from "./contracts/Flipper/source";
import greeteSource from "./contracts/Greete/source";
import storageSource from "./contracts/Storage/source";
import erc20Source from "./contracts/ERC20Contract/source";

import {verifyContractArguments} from "../src/compiler/argumentEncoder";

import {verifyContract} from "../src/compiler/compiler";
import {describe, it} from "mocha";
import {expect} from "chai";
import { ABI } from "../src/types";

const argumentTester = (bytecode: string, abi: ABI, args: string): boolean => {
  try {
    verifyContractArguments(
      bytecode,
      abi,
      JSON.stringify(args.split(",").map((param) => param.trim()))
    )
    return true;
  } catch (err) {
    // console.log(err)
    return false;
  }
}

const argumentErrorTester = (bytecode: string, abi: ABI, args: string): string => {
  try {
    verifyContractArguments(bytecode, abi, `[\"${args}\"]`)
    return "";
  } catch (err) {
    console.log(err);
    return err.message
  }
}

const sourceTester = async (bytecode: string, source: string, filename: string, name: string): Promise<boolean> => {
  try {
    await verifyContract(bytecode, {
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
    });
    return true;
  } catch (err) {
    // console.log(err);
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
    expect(argumentTester(erc20bytecode, erc20contract, "987624216598465165189198984984321861981")).to.true
  )
  it('should verify SWVEERC20 arguments', () => 
    expect(argumentTester(swveBytecode, swve, "9876546, hello world")).to.true
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
  it('should not verify SWVEERC20 arguments - first argument changed', () => 
    expect(argumentTester(swveBytecode, swve, "986546, hello world")).to.false
  )
  it('should not verify SWVEERC20 arguments - second argument changed', () => 
    expect(argumentTester(swveBytecode, swve, "986546, hello worl")).to.false
  )
});

// describe('Testing argument error handler', () => {
//   it('')
// });

describe('Testing valid contract sources', () => {
  it('should verify Flipper contract source', async () => 
    expect(await sourceTester(flipperBytecode, flipperSource, "Flipper.sol", "Flipper")).to.true
  )
  it('should verify Greete contract source', async () => 
    expect(await sourceTester(greeteBytecode, greeteSource, "Greete.sol", "Greeter")).to.true
  )
  it('should verify Storage contract source', async () => 
    expect(await sourceTester(storageBytecode, storageSource, "Storage.sol", "Storage")).to.true
  )
  it('should verify ERC20 contract source', async () => 
    expect(await sourceTester(erc20bytecode, erc20Source, "contracts/4_ERC20Contract.sol", "ERC20Contract")).to.true
  )
  it('should verify SWVEERC20 contract source', async () => 
    expect(await sourceTester(swveBytecode, swveSource, "contracts/SWVEERC20.sol", "StarWarsVoterErc20")).to.true
  )
})

// describe('Testing invalid contract sources', () => {
//   it('should verify Flipper contract source', async () => 
//     expect(await sourceTester(flipperBytecode, greeteSource, "Greete.sol", "Greete")).to.false
//   )
//   it('should verify Greete contract source', async () => 
//     expect(await sourceTester(greeteBytecode, flipperSource, "Flipper.sol", "Flipper")).to.false
//   )
//   it('should verify Storage contract source', async () => 
//     expect(await sourceTester(storageBytecode, erc20Source, "contracts/4_ERC20Contract.sol", "ERC20Contract")).to.false
//   )
//   it('should verify ERC20 contract source', async () => 
//     expect(await sourceTester(erc20bytecode, storageSource, "Storage.sol", "Storega")).to.false
//   )
// })