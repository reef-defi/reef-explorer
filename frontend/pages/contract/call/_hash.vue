<template>
  <div>
    <section>
      <b-container class="contract-call main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!extrinsic">
          <h1 class="text-center">Contract call not found!</h1>
        </template>
        <template v-else>
          <div class="card mt-4 mb-3">
            <div class="card-body">
              <h4 class="text-center mb-4">
                Contract call {{ shortHash(extrinsic.hash) }}
              </h4>
              <contract-call-view :contract="contract" :extrinsic="extrinsic" />
            </div>
          </div>
          <extrinsic-events
            :block-number="parseInt(extrinsic.block_number)"
            :extrinsic-index="parseInt(extrinsic.extrinsic_index)"
          />
        </template>
      </b-container>
    </section>
  </div>
</template>
<script>
import { toChecksumAddress } from 'web3-utils'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import gql from 'graphql-tag'
import ContractCallView from '@/components/ContractCallView.vue'

export default {
  components: {
    Loading,
    ContractCallView,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      extrinsicHash: this.$route.params.hash,
      extrinsic: undefined,
      contractId: undefined,
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
            block_number
            extrinsic_index
            is_signed
            signer
            section
            method
            args
            hash
            doc
            fee_info
            fee_details
            success
            timestamp
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
        this.contractId = toChecksumAddress(JSON.parse(this.extrinsic.args)[0])
      },
    },
    contract: {
      query: gql`
        query contract($contractId: String!) {
          contract(where: { contract_id: { _eq: $contractId } }) {
            contract_id
            verified
            abi
            is_erc20
            token_name
            token_symbol
            token_decimals
          }
        }
      `,
      skip() {
        return !this.contractId
      },
      variables() {
        return {
          contractId: this.contractId,
        }
      },
      result({ data }) {
        this.contract = data.contract[0]
        this.loading = false
      },
    },
  },
}
</script>
