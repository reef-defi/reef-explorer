<template>
  <div class="contract-call-function">
    <b-form :id="`form-${functionName}`" @submit="onSubmit" @reset="onReset">
      <b-form-group
        id="input-group-from"
        label="From"
        label-for="input-from"
        class="w-100"
      >
        <b-form-select
          id="input-from"
          v-model="selectedAddress"
          :options="extensionAddresses"
          class="w-100"
        ></b-form-select>
      </b-form-group>

      <div v-for="(input, index) in functionInputs" :key="input.name">
        <b-form-group
          :id="`input-group-${input.name}`"
          :label="`${input.name} (${input.type}):`"
          :label-for="input.name"
        >
          <b-form-input
            :id="`${input.name}-${index}`"
            type="text"
            required
            @input="setValue(index, $event)"
          ></b-form-input>
        </b-form-group>
      </div>
      <b-button type="submit" variant="primary2">SEND</b-button>
      <b-alert
        v-if="extrinsicStatus === 'Finalized'"
        variant="success"
        class="text-center my-4"
        fade
        show
      >
        <p>
          <strong>Finalized transaction!</strong>
        </p>
        <p>Contract call execution was included in a finalized block</p>
      </b-alert>
      <b-alert
        v-if="extrinsicStatus === 'Ready'"
        variant="info"
        class="text-center my-4"
        fade
        show
      >
        <p>
          <strong>Transaction ready!</strong>
        </p>
        <p>Contract call execution is ready to be broadcasted</p>
      </b-alert>
      <b-alert
        v-else-if="extrinsicStatus === 'Broadcast'"
        variant="info"
        class="text-center my-4"
        fade
        show
      >
        <p>
          <strong>Broadcasted transaction!</strong>
        </p>
        <p>Contract call execution was broadcasted</p>
      </b-alert>
      <b-alert
        v-else-if="extrinsicStatus === 'InBlock'"
        variant="success"
        class="text-center my-4"
        fade
        show
      >
        <p>
          <strong>Transaction success!</strong>
        </p>
        <p>Contract call execution was included in a block</p>
      </b-alert>
    </b-form>
  </div>
</template>

<script>
import { ethers } from 'ethers'
import { ApiPromise } from '@polkadot/api'
import { WsProvider } from '@polkadot/rpc-provider'
import { options } from '@reef-defi/api'
import {
  web3Accounts,
  // isWeb3Injected,
  web3Enable,
  web3FromAddress,
} from '@polkadot/extension-dapp'
import { encodeAddress } from '@polkadot/keyring'
import { network } from '@/frontend.config.js'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  props: {
    contractId: {
      type: String,
      default: () => '',
    },
    contractInterface: {
      type: Object,
      default: () => {},
    },
    functionName: {
      type: String,
      default: () => '',
    },
    functionNameWithArgs: {
      type: String,
      default: () => '',
    },
    contractAbi: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      arguments: [],
      result: null,
      provider: null,
      noAccountsFound: true,
      extensionAddresses: [],
      selectedAddress: null,
      api: null,
      // IMPORTANT: check https://polkadot.js.org/docs/api-contract/start/contract.tx
      value: 0,
      gasLimit: 98721,
      storageLimit: 70,
      error: null,
      extrinsicHash: null,
      extrinsicStatus: null,
      blockHash: null,
      success: null,
    }
  },
  computed: {
    functionInputs() {
      return this.contractAbi.find(
        (method) => method.name === this.functionName
      ).inputs
    },
  },
  async created() {
    await web3Enable('Reefscan')
    const accounts = await web3Accounts()
    if (accounts.length > 0) {
      this.extensionAccounts = accounts
      accounts.forEach((account) =>
        this.extensionAddresses.push(
          encodeAddress(account.address, network.ss58Format)
        )
      )
      if (
        this.extensionAccounts.length > 0 &&
        this.extensionAddresses.length > 0
      ) {
        this.selectedAccount = this.extensionAccounts[0]
        this.selectedAddress = this.extensionAddresses[0]
      } else {
        this.noAccountsFound = true
      }
    }
    const provider = new WsProvider(network.nodeWs)
    this.api = new ApiPromise(options({ provider }))
    await this.api.isReady
  },
  methods: {
    async onSubmit(event) {
      event.preventDefault()
      //
      // Encode arguments
      //
      const iface = new ethers.utils.Interface(this.contractAbi)
      const encodedArguments = iface.encodeFunctionData(
        this.functionName,
        this.arguments
      )

      //
      // Call contract write function
      //
      const encodedAddress = encodeAddress(this.selectedAddress, 42)
      const vm = this
      await web3FromAddress(this.selectedAddress)
        .then(async (injector) => {
          this.api.setSigner(injector.signer)
          const { nonce } = await this.api.query.system.account(
            this.selectedAddress
          )
          await this.api.tx.evm
            .call(
              this.contractId,
              encodedArguments,
              this.value,
              this.gasLimit,
              this.storageLimit
            )
            .signAndSend(
              encodedAddress,
              { nonce },
              ({ events = [], status }) => {
                vm.extrinsicStatus = status.type
                if (status.isInBlock) {
                  vm.blockHash = status.asInBlock.toHex()
                } else if (status.isFinalized) {
                  vm.blockHash = status.asFinalized.toHex()
                }
              }
            )
        })
        .catch((error) => {
          // eslint-disable-next-line
          console.log('Error: ', error)
        })
    },
    onReset() {
      // reset form
    },
    setValue(index, event) {
      // eslint-disable-next-line no-console
      // console.log(index, event)
      this.arguments[index] = event
    },
  },
}
</script>
