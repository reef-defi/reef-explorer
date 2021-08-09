<template>
  <div class="contract-call">
    <h4 class="mt-4 mb-4">Available methods:</h4>
    <div
      v-for="(message, index) in contractAbi.filter(
        (item) => item.type === 'function'
      )"
      :key="`message-${index}`"
    >
      <p>
        <strong>{{ message.name }}</strong> ({{ getInputs(message) }})
        <font-awesome-icon
          v-if="message.stateMutability !== 'view'"
          icon="database"
        />
        <span v-if="message.outputs.length > 0">
          : {{ getOutputs(message) }}
        </span>
      </p>
    </div>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'

export default {
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
  methods: {
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
