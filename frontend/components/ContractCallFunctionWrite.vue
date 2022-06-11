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
import { Signer } from '@reef-defi/evm-provider'
import { gql } from 'graphql-tag'
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
    provider: {
      type: Object,
      default: () => undefined,
    },
  },
  data() {
    return {
      arguments: [],
      result: null,
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
      for (const account of accounts) {
        const encodedAddress = encodeAddress(
          account.address,
          network.ss58Format
        )
        const evmAddress = await this.getEVMAddress(encodedAddress)
        this.extensionAddresses.push({
          value: encodedAddress,
          text: evmAddress
            ? `${account.meta.name}: ${this.shortAddress(
                encodedAddress
              )} (${this.shortHash(evmAddress)})`
            : `${account.meta.name}: ${this.shortAddress(encodedAddress)}`,
        })
      }
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
    numbersToString(arr) {
      return arr.map((val) => {
        if (Array.isArray(val)) {
          return this.numbersToString(val)
        } else if (typeof val === 'number') {
          return val.toLocaleString('fullwide', { useGrouping: false })
        }

        return val
      })
    },
    prepareParameters(parameters) {
      if (parameters === '') {
        return []
      }
      const result = JSON.parse(`[${parameters}]`)
      return this.numbersToString(result)
    },
    async onSubmit(event) {
      event.preventDefault()

      //
      // Call contract write function
      //
      await web3FromAddress(this.selectedAddress)
        .then(async (injector) => {
          try {
            // create signer
            const wallet = new Signer(
              this.provider,
              this.selectedAddress,
              injector.signer
            )

            // claim default account
            if (!(await wallet.isClaimed())) {
              // eslint-disable-next-line no-console
              console.log(
                'No claimed EVM account found -> claimed default EVM account: ',
                await wallet.getAddress()
              )
              await wallet.claimDefaultAccount()
            }

            const contract = new ethers.Contract(
              this.contractId,
              this.contractAbi,
              wallet
            )

            const args = this.prepareParameters(this.arguments.join(', '))
            this.result = await contract[this.functionName](...args)

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
      this.arguments[index] = event
    },
    async getEVMAddress(accountId) {
      const client = this.$apolloProvider.defaultClient
      const query = gql`
        query account {
          account(where: {address: {_eq: "${accountId}"}}) {
            evm_address
          }
        }
      `
      const response = await client.query({ query })
      if (response.data.account.length > 0) {
        const evmAddress = response.data.account[0].evm_address
        if (evmAddress) {
          return evmAddress
        } else {
          return ''
        }
      } else {
        return ''
      }
    },
  },
}
</script>
