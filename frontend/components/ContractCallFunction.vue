<template>
  <div class="contract-call-function">
    <b-form :id="`form-${functionName}`" @submit="onSubmit" @reset="onReset">
      <div v-for="input in functionInputs" :key="input.name">
        <b-form-group
          :id="`input-group-${input.name}`"
          :label="`${input.name} (${input.type}):`"
          :label-for="input.name"
        >
          <b-form-input :id="input.name" type="text" required></b-form-input>
        </b-form-group>
      </div>
      <!-- <b-button type="submit" variant="primary2">SEND</b-button> -->
    </b-form>
  </div>
</template>

<script>
// import { ethers } from 'ethers'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  props: {
    contractInterface: {
      type: Object,
      default: () => {},
    },
    functionName: {
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
      // eslint-disable-next-line no-console
      console.log(
        this.contractAbi.find((method) => method.name === functionName).inputs
      )
      return this.contractAbi.find((method) => method.name === functionName)
        .inputs
    },
    onSubmit(event) {
      event.preventDefault()
      // 1. check function arguments
      // 2. encode function call with arguments
      // 3. submit extrinsic
      alert(JSON.stringify(this.arguments))
    },
    onReset() {
      // reset form
    },
  },
}
</script>
