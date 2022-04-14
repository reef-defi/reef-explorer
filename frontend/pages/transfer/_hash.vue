<template>
  <div>
    <section>
      <b-container class="transfer-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!transfer" text="Transfer not found" />
        <Transfer v-else :transfer="transfer" />
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      hash: this.$route.params.hash,
      transfer: undefined,
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
      this.hash = this.$route.params.hash
    },
  },
  apollo: {
    transfer: {
      query: gql`
        query transfer($hash: String!) {
          transfer(where: { extrinsic: { hash: { _eq: $hash } } }) {
            amount
            denom
            block_id
            to_address
            from_address
            to_evm_address
            from_evm_address
            timestamp
            extrinsic {
              id
              hash
              index
              error_message
              status
              events(where: { method: { _eq: "Transfer" } }) {
                data
                extrinsic_id
              }
            }
            token {
              address
              verified_contract {
                contract_data
              }
            }
            token_address
            fee_amount
          }
        }
      `,
      skip() {
        return !this.hash
      },
      variables() {
        return {
          hash: this.hash,
        }
      },
      result({ data }) {
        if (data && data.transfer) {
          this.transfer = data.transfer[0]
          this.transfer.to_address =
            this.transfer.to_address || this.transfer.to_evm_address

          this.transfer.success =
            data.transfer[0].extrinsic.status === 'success'

          if (this.transfer.to_address === 'deleted') {
            this.transfer.to_address =
              data.transfer[0].extrinsic.events[0].data[1]
          }

          this.transfer.from_address =
            this.transfer.from_address || this.transfer.from_evm_address
          if (this.transfer.from_address === 'deleted') {
            this.transfer.from_address =
              data.transfer[0].extrinsic.events[0].data[0]
          }

          if (
            this.transfer.token &&
            this.transfer.token.verified_contract &&
            this.transfer.token.verified_contract.contract_data
          ) {
            this.transfer.tokenName =
              this.transfer.token.verified_contract.contract_data.name
            this.transfer.symbol =
              this.transfer.token.verified_contract.contract_data.symbol
            this.transfer.decimals =
              this.transfer.token.verified_contract.contract_data.decimals
          }
        }
        this.loading = false
      },
    },
  },
}
</script>
