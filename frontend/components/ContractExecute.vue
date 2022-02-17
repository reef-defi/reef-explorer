<template>
  <div class="contract-execute">
    <b-alert variant="warning" show dismissible>
      <p class="text-center mt-4">
        Support for write contract calls (marked with
        <font-awesome-icon icon="database" /> icon) is experimental, please keep
        in mind and use at your own risk!
      </p>
    </b-alert>
    <div
      v-for="(message, index) in contractAbi.filter(
        (item) => item.type === 'function'
      )"
      :key="`message-${index}`"
      class="contract-execute__section"
    >
      <div class="contract-execute__section-head">
        <div class="contract-execute__section-title">
          {{ message.name }}
        </div>
        <div
          v-if="message.stateMutability !== 'view'"
          class="contract-execute__section-experimental"
        >
          <font-awesome-icon icon="database" />
        </div>
        <div
          v-if="message.outputs.length > 0"
          class="contract-execute__section-output"
        >
          {{ getOutputs(message) }}
        </div>
      </div>

      <template v-if="message.stateMutability === 'view'">
        <contract-call-function
          :provider="provider"
          :contract-id="contractId"
          :contract-interface="contractInterface"
          :contract-abi="contractAbi"
          :function-name="message.name"
          :function-name-with-args="getFunctionNameWithArgs(message)"
        />
      </template>
      <template v-else>
        <contract-call-function-write
          :provider="provider"
          :contract-id="contractId"
          :contract-interface="contractInterface"
          :contract-abi="contractAbi"
          :function-name="message.name"
          :function-name-with-args="getFunctionNameWithArgs(message)"
        />
      </template>
    </div>
  </div>
</template>

<script>
import { ethers } from 'ethers'
import { Provider } from '@reef-defi/evm-provider'
import { WsProvider } from '@polkadot/api'
import ContractCallFunction from './ContractCallFunction.vue'
import ContractCallFunctionWrite from './ContractCallFunctionWrite.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'

export default {
  components: {
    ContractCallFunction,
    ContractCallFunctionWrite,
  },
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
      provider: undefined,
    }
  },
  computed: {
    contractInterface() {
      const iface = new ethers.utils.Interface(this.contractAbi)
      return iface.functions
    },
  },
  async created() {
    // connect to provider
    const provider = new Provider({
      provider: new WsProvider(network.nodeWs),
    })
    await provider.api.isReady
    this.provider = provider
  },
  async beforeDestroy() {
    if (this.provider) {
      await this.provider.api.disconnect()
      this.provider = undefined
    }
  },
  methods: {
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

<style lang="scss">
.contract-execute {
  .alert {
    margin-bottom: 5px;

    p {
      margin: 0 !important;
    }
  }

  .contract-execute__section {
    padding: 25px 0;

    .contract-execute__section-head {
      width: 100%;
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      margin-bottom: 18px;

      .contract-execute__section-title {
        font-size: 18px;
        font-weight: 600;
        color: #3e3f42;
      }

      .contract-execute__section-output {
        margin-left: 15px;
        background: rgba(#eaedf3, 0.65);
        display: flex;
        flex-flow: row nowrap;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 4px 9px;
        border-radius: 5px;
        font-size: 14px;
        font-weight: 500;
      }

      .contract-execute__section-experimental {
        margin-left: 10px;
        color: #3e3f42;
        font-size: 16px;
      }
    }

    .btn {
      margin-top: 5px;
      border: none;
      padding: 7px 21px;
      font-size: 15px;
      border-radius: 99px;
      background: linear-gradient(90deg, #a93185, #5531a9);
      transition: filter 0.15s;

      &:hover {
        filter: brightness(1.2);
      }

      &:active {
        filter: brightness(1.4);
      }
    }

    & + .contract-execute__section {
      border-top: solid 1px #eaedf3;
    }

    .alert {
      margin-bottom: 0;
    }

    &:last-child {
      padding-bottom: 10px;
    }
  }
}
</style>
