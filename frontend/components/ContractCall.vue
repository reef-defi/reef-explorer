<template>
  <div class="contract-call">
    <!-- <h4 class="mt-4 mb-4">Available methods:</h4> -->
    <!-- <pre>{{ JSON.stringify(contractInterface, null, 2) }}</pre> -->
    <b-alert variant="warning">
      Contract function execution not supported yet, right now you can check
      functions arguments, types and values returned
    </b-alert>
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
        <contract-call-function
          :contract-interface="contractInterface"
          :contract-abi="contractAbi"
          :function-name="message.name"
        />
      </b-card>
    </div>
  </div>
</template>

<script>
import { ethers } from 'ethers'
import commonMixin from '@/mixins/commonMixin.js'
import ContractCallFunction from './ContractCallFunction.vue'

export default {
  components: { ContractCallFunction },
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
  computed: {
    contractInterface() {
      const iface = new ethers.utils.Interface(this.contractAbi)
      return iface.functions
    },
  },
  methods: {
    getInterface(contractAbi) {
      const iface = new ethers.utils.Interface(contractAbi)
      return iface.functions
    },
    getInputs(message) {
      const inputs = []
      for (const input of message.inputs) {
        inputs.push(`${input.name}: ${input.type}`)
      }
      return inputs.join(', ')
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
