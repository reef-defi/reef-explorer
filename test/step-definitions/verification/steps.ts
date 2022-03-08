import { When, Then, Given } from '@cucumber/cucumber';

const scanUrl = process.env.SCAN_URL;

const hre = require('hardhat');
const axios = require('axios');

interface Contract {
  data: any;
}

const greeterInitialData = {
  name: 'Greeter',
  filename: 'Greeter.sol',
  arguments: ["How's your day doing?"],
};

Given('I deploy a contract using hardhat', async function (this: Contract) {
  const signer = await hre.reef.getSignerByName('alice');
  await signer.claimDefaultAccount();

  const address = await signer.getAddress();
  console.log('Signer address: ', address);

  const Greeter = await hre.reef.getContractFactory('Greeter', signer);
  const greeter = await Greeter.deploy(...greeterInitialData.arguments);

  await greeter.deployed();

  this.data = greeter;
});

When('I verify a contract using hardhat', async function (this: Contract) {
  const greeter = this.data;
  await hre.reef.verifyContract(greeter.address, 'Greeter', greeterInitialData.arguments);
});

Then(
  'The verification API endpoint should succesfully respond with verified contract data to HTTP request',
  async function (this: Contract) {
    const greeter = this.data;
    const verificationEndpoint = `${scanUrl}/contract/${greeter.address}`;
    const response = await axios.get(verificationEndpoint);
    console.log(`status: ${response.status}`);
    console.log(`data: ${this.data}`);
  },
);
