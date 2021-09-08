<template>
  <div class="contract-call-function">
    <b-form :id="`form-${functionName}`" @submit="onSubmit" @reset="onReset">
      <b-form-group
        id="input-group-from"
        label="call from account"
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
      <b-alert v-if="error" variant="danger" class="mt-4 text-center" show>
        <h6>Error!</h6>
        <p>{{ error }}</p>
      </b-alert>
      <b-button type="submit" variant="primary2">SEND</b-button>
      <b-alert
        v-if="result !== null"
        variant="success"
        class="mt-4 text-center"
        show
      >
        <h6>Success!</h6>
        <p>
          Extrinsic hash is
          <nuxt-link target="_blank" :to="`/extrinsic/${result.hash}`">{{
            shortHash(result.hash)
          }}</nuxt-link>
        </p>
      </b-alert>
    </b-form>
  </div>
</template>

<script>
import { ethers } from 'ethers'
import { Provider, Signer } from '@reef-defi/evm-provider'
import { WsProvider } from '@polkadot/api'

import {
  web3Accounts,
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
      selectedEvmAddress: null,
      api: null,
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
  },
  methods: {
    async onSubmit(event) {
      event.preventDefault()
      //
      // Call contract write function
      //
      await web3FromAddress(this.selectedAddress)
        .then(async (injector) => {
          try {
            // connect to provider
            const provider = new Provider({
              provider: new WsProvider(network.nodeWs),
            })
            await provider.api.isReady

            // eslint-disable-next-line no-console
            // console.log('injector:', injector)

            // create signer
            const wallet = new Signer(
              provider,
              this.selectedAddress,
              injector.signer
            )

            // eslint-disable-next-line no-console
            // console.log('wallet:', wallet)

            // claim default account
            if (!(await wallet.isClaimed())) {
              // eslint-disable-next-line no-console
              console.log(
                'No claimed EVM account found -> claimed default EVM account: ',
                await wallet.getAddress()
              )
              await wallet.claimDefaultAccount()
            }

            // eslint-disable-next-line no-console
            // console.log('evm address', await wallet.getAddress())

            // eslint-disable-next-line no-console
            // console.log('contract abi:', this.contractAbi)

            const contract = new ethers.Contract(
              this.contractId,
              this.contractAbi,
              wallet
            )

            this.result = await contract[this.functionName](...this.arguments)
            // eslint-disable-next-line no-console
            // console.log('result:', this.result)

            await provider.api.disconnect()

            // hide success alert after 20s
            setTimeout(() => {
              this.result = null
            }, 20000)
          } catch (error) {
            this.error = error
            // eslint-disable-next-line
            console.log('Error: ', this.error)
            // hide error alert after 20s
            setTimeout(() => {
              this.error = null
            }, 20000)
          }
        })
        .catch((error) => {
          this.error = error
          // eslint-disable-next-line
          console.log('Error: ', this.error)
          // hide error alert after 20s
          setTimeout(() => {
            this.error = null
          }, 20000)
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
