<template>
  <div>
    <section>
      <b-container class="contract-call main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound
          v-else-if="!extrinsic"
          text="Contract transaction not found"
        />
        <Card v-else class="list-view">
          <Headline>Contract Transaction</Headline>
          <contract-transaction :contract="contract" :extrinsic="extrinsic" />
          <extrinsic-events
            :block-number="parseInt(extrinsic.block_id)"
            :extrinsic-index="parseInt(extrinsic.index)"
          />
        </Card>
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import ContractTransaction from '@/components/ContractTransaction.vue'

export default {
  components: {
    Loading,
    ContractTransaction,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      extrinsicHash: this.$route.params.hash,
      extrinsic: undefined,
      contractAddress: undefined,
      contract: undefined,
    }
  },
  head() {
    return {
      title: 'Explorer | Reef Network',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Reef Chain is an EVM compatible chain for DeFi',
        },
      ],
    }
  },
  watch: {
    $route() {
      this.extrinsicHash = this.$route.params.hash
    },
  },
  apollo: {
    extrinsic: {
      query: gql`
        query extrinsic($hash: String!) {
          extrinsic(where: { hash: { _eq: $hash } }) {
            id
            block_id
            index
            type
            signer
            section
            method
            args
            hash
            docs
            timestamp
            error_message
          }
        }
      `,
      skip() {
        return !this.extrinsicHash
      },
      variables() {
        return {
          hash: this.extrinsicHash,
        }
      },
      result({ data }) {
        this.extrinsic = data.extrinsic[0]
        this.contractAddress = this.extrinsic.args[0].toLowerCase()
      },
    },
    contract: {
      query: gql`
        query contract($contractAddress: String!) {
          contract(where: { address: { _eq: $contractAddress } }) {
            address
            verified_contract {
              type
              name
              contract_data
            }
          }
        }
      `,
      skip() {
        return !this.contractAddress
      },
      variables() {
        return {
          contractAddress: this.contractAddress,
        }
      },
      result({ data }) {
        this.contract = data.contract[0]
        this.contract.abi =
          data.contract[0].verified_contract &&
          data.contract[0].verified_contract.compiled_data &&
          data.contract[0].verified_contract.compiled_data.flat
            ? data.contract[0].verified_contract.compiled_data.flat()
            : []
        this.loading = false
      },
    },
  },
}
</script>
