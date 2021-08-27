<template>
  <div class="contract-call">
    <b-alert variant="warning" show dismissible>
      <p class="text-center mt-4">
        Support for write contract calls (marked with
        <font-awesome-icon icon="database" /> icon) is experimental, please keep
        in mind and use at your own risk!
      </p>
    </b-alert>
    <!-- <pre>{{ JSON.stringify(contractInterface, null, 2) }}</pre> -->
    <div
      v-for="(message, index) in contractAbi.filter(
        (item) => item.type === 'function'
      )"
      :key="`message-${index}`"
    >
      <b-card class="mb-4">
        <b-card-title>
          <strong>{{ message.name }}</strong> ({{ getInputs(message) }})
          <font-awesome-icon
            v-if="message.stateMutability !== 'view'"
            icon="database"
          />
          <span v-if="message.outputs.length > 0">
            : {{ getOutputs(message) }}
          </span>
        </b-card-title>
        <template v-if="message.stateMutability === 'view'">
          <contract-call-function
            :contract-id="contractId"
            :contract-interface="contractInterface"
            :contract-abi="contractAbi"
            :function-name="message.name"
            :function-name-with-args="getFunctionNameWithArgs(message)"
          />
        </template>
        <template v-else>
          <contract-call-function-write
            :contract-id="contractId"
            :contract-interface="contractInterface"
            :contract-abi="contractAbi"
            :function-name="message.name"
            :function-name-with-args="getFunctionNameWithArgs(message)"
          />
        </template>
        <!-- <pre>{{ JSON.stringify(message, null, 2) }}</pre> -->
      </b-card>
    </div>
  </div>
</template>

<script>
import { ethers } from 'ethers'
import commonMixin from '@/mixins/commonMixin.js'
import ContractCallFunction from './ContractCallFunction.vue'
import ContractCallFunctionWrite from './ContractCallFunctionWrite.vue'

export default {
  components: { ContractCallFunction, ContractCallFunctionWrite },
  mixins: [commonMixin],
  props: {
    contractId: {
      type: String,
      default: () => '',
    },
    contractName: {
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
      provider: null,
    }
  },
  computed: {
    contractInterface() {
      const iface = new ethers.utils.Interface(this.contractAbi)
      return iface.functions
    },
  },
  methods: {
    // getInterface(contractAbi) {
    //   const iface = new ethers.utils.Interface(contractAbi)
    //   return iface.functions
    // },
    getInputs(message) {
      const inputs = []
      for (const input of message.inputs) {
        inputs.push(`${input.name}: ${input.type}`)
      }
      return inputs.join(', ')
    },
    getFunctionNameWithArgs(message) {
      const inputs = []
      for (const input of message.inputs) {
        inputs.push(input.type)
      }
      return `${message.name}(${inputs.join(',')})`
    },
    getOutputs(message) {
      const outputs = []
      for (const output of message.outputs) {
        outputs.push(output.type)
      }
      return outputs.join(', ')
    },
  },
}
</script>

<style>
.contract-call .card-title {
  font-size: 1.2rem;
  margin-bottom: 2rem;
}
</style>
