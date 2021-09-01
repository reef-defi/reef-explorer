<template>
  <div class="contract-call-function">
    <b-form :id="`form-${functionName}`" @submit="onSubmit" @reset="onReset">
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
      <b-alert v-if="result !== null" variant="info" class="mt-4" show>
        {{ result }}
      </b-alert>
    </b-form>
  </div>
</template>

<script>
import { ethers } from 'ethers'
import { options } from '@reef-defi/api'
import { Provider } from '@reef-defi/evm-provider'
import { WsProvider } from '@polkadot/api'
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
    }
  },
  computed: {
    functionInputs() {
      return this.contractAbi.find(
        (method) => method.name === this.functionName
      ).inputs
    },
  },
  // created() {
  //   this.provider = new Provider(
  //     options({
  //       provider: new WsProvider(network.nodeWs),
  //     })
  //   )
  // },
  // beforeDestroy() {
  //   this.provider.api.disconnect()
  // },
  methods: {
    getInputs(functionName) {
      // eslint-disable-next-line no-console
      console.log(
        this.contractAbi.find((method) => method.name === functionName).inputs
      )
      return this.contractAbi.find((method) => method.name === functionName)
        .inputs
    },
    async onSubmit(event) {
      event.preventDefault()
      //
      // TODO:
      //
      // 1. validate function arguments
      // 2. encode function call with arguments
      // 3. submit extrinsic
      //

      //
      // connect to provider
      //
      const provider = new Provider(
        options({
          provider: new WsProvider(network.nodeWs),
        })
      )
      await provider.api.isReady

      //
      // Get contract interface
      //
      // const iface = new ethers.utils.Interface(this.contractAbi)
      // // eslint-disable-next-line no-console
      // console.log('interface:', iface)

      //
      // Encode arguments
      //
      // const encodedArguments = iface.encodeFunctionData(
      //   this.functionName,
      //   this.arguments
      // )
      // // eslint-disable-next-line no-console
      // console.log('arguments:', this.arguments)
      // // eslint-disable-next-line no-console
      // console.log('encoded arguments:', encodedArguments)

      //
      // Call contract read only function
      //
      const contract = new ethers.Contract(
        this.contractId,
        this.contractAbi,
        provider
      )
      this.result = await contract[this.functionName](...this.arguments)

      // eslint-disable-next-line no-console
      console.log('result:', this.result)

      //
      // disconnect provider
      //
      provider.api.disconnect()
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
