import SWVE from "./contracts/SWVE";
import Flipper from "./contracts/Flipper";
import Greeter from "./contracts/Greeter";
import Storage from "./contracts/Storage";
import ERC20Contract from "./contracts/ERC20Contract";
import BasicNFT from "./contracts/BasicNFT";
import BiDirectionalPayment from "./contracts/BiDirectionalPayment";
import EnglishAuction from "./contracts/EnglishAuction";
import Factory from "./contracts/Factory";
import MinimalProxy from "./contracts/MinimalProxy";
import MultiSigWallet from "./contracts/MultiSigWallet";
import MerkleTree from "./contracts/MerkleTree";
import UniDirectionalPaymentChannel from "./contracts/UniDirectionalPaymentChannel";
import {describe, it} from "mocha";
import {expect} from "chai";
import { argumentCustomTester, argumentTester, ContractStorage, sourceTester } from "./utils";

const contractCollection: ContractStorage[] = [
  Flipper,
  Storage,
  Greeter,
  ERC20Contract,
  SWVE,
  BasicNFT,
  BiDirectionalPayment,
  EnglishAuction,
  Factory,
  MinimalProxy,
  MultiSigWallet,
  MerkleTree,
  UniDirectionalPaymentChannel
];

const sourceCustomTester = async (contract: ContractStorage, sources: string): Promise<boolean> =>
  sourceTester({...contract, sources});


describe('Testing contracts argument verification', () => {
  contractCollection
    .forEach((contract) => 
      it(`should verify ${contract.name} arguments`, () => 
        expect(argumentTester(contract)).to.true
      )
    );
});

describe('Testing invalid arguments', () => {
  it('should not verify Storage arguments', () => 
    expect(argumentCustomTester(Storage, ["987946"])).to.false
  );
  it('should not verify Greeter arguments', () => 
    expect(argumentCustomTester(Greeter, ["ello world"])).to.false
  )
  it('should not verify Flipper arguments', () => 
    expect(argumentCustomTester(Flipper, ["false"])).to.false
  )
  it('should not verify ERC20Contract arguments', () => 
  expect(argumentCustomTester(ERC20Contract, ["98762421659845165189198984984321861981"])).to.false
  )
  it('should not verify SWVEERC20 arguments - first argument changed', () => 
    expect(argumentCustomTester(SWVE, ["987656", "hello world"])).to.false
  )
  it('should not verify SWVEERC20 arguments - second argument changed', () => 
    expect(argumentCustomTester(SWVE, ["9876546", "hell world"])).to.false
  )
});

describe('Testing valid contract sources', () => {
  contractCollection
    .forEach((contract) => 
      it(`should verify ${contract.name} contract source`, async () => 
        expect(await sourceTester(contract)).to.true
      )
    )
})

describe('Testing contracts with invalid source', () => {
  it('should not verify Greete contract with Flipper source', async () => 
    expect(await sourceCustomTester(Greeter, Flipper.sources)).to.false
  )
  it('should not verify Flipper contract with Greeter source', async () => 
    expect(await sourceCustomTester(Flipper, Greeter.sources)).to.false
  )
  it('should not verify Storage contract with Greeter source', async () => 
    expect(await sourceCustomTester(Storage, Greeter.sources)).to.false
  )
  it('should not verify ERC20 contract with Storage source', async () => 
    expect(await sourceCustomTester(ERC20Contract, Storage.sources)).to.false
  )
  it('should not verify Storage contract with ERC20 source', async () => 
    expect(await sourceCustomTester(Storage, ERC20Contract.sources)).to.false
  )
  it('should not verify ERC20 contract source with SWVE source', async () => 
     expect(await sourceCustomTester(ERC20Contract, SWVE.sources)).to.false
  )
  it('should not verify SWVEERC20 contract source with ERC20-bytecode', async () => 
     expect(await sourceCustomTester(SWVE, ERC20Contract.sources)).to.false
  )
})