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
    }
  },
  computed: {
    functionInputs() {
      return this.contractAbi.find(
        (method) => method.name === this.functionName
      ).inputs
    },
  },
  methods: {
    getInputs(functionName) {
      return this.contractAbi.find((method) => method.name === functionName)
        .inputs
    },
    async onSubmit(event) {
      event.preventDefault()
      //
      // Call contract read only function
      //
      const contract = new ethers.Contract(
        this.contractId,
        this.contractAbi,
        this.provider
      )
      this.result = await contract[this.functionName](...this.arguments)
    },
    onReset() {
      // reset form
    },
    setValue(index, event) {
      this.arguments[index] = event
    },
  },
}
</script>
