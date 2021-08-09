<template>
  <div class="contract-call">
    <h4 class="mt-4 mb-4">Available methods</h4>
    <!-- <pre>{{ contractAbi }}</pre> -->
    <div
      v-for="(message, index) in contractAbi.filter(
        (item) =>
          item.type === 'function' && item.stateMutability === 'nonpayable'
      )"
      :key="`message-${index}`"
    >
      <p>
        <strong>{{ message.name }}</strong> (<span
          v-for="(input, inputIndex) in message.inputs"
          :key="`input-${index}-${inputIndex}`"
        >
          <span>{{ input.name }}: {{ input.type }}, </span>
        </span>
        )
      </p>
    </div>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
// import VueJsonPretty from 'vue-json-pretty'

export default {
  // components: {
  //   VueJsonPretty,
  // },
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
}
</script>
