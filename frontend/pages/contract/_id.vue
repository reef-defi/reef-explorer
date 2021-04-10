<template>
  <div>
    <section>
      <b-container class="contract-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!contract">
          <h1 class="text-center">Account not found!</h1>
        </template>
        <template v-else>
          <div class="card mb-4">
            <div class="card-body">
              <h4 class="text-center mb-4">
                {{ contractId }}
              </h4>
              <div class="table-responsive pb-4">
                <table class="table table-striped">
                  <tbody>
                    <tr>
                      <td>Created at block</td>
                      <td class="text-right">
                        <nuxt-link
                          v-b-tooltip.hover
                          :to="`/block?blockNumber=${contract.block_height}`"
                          title="Check block information"
                        >
                          #{{ formatNumber(contract.block_height) }}
                        </nuxt-link>
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.contract.signer') }}</td>
                      <td class="text-right">
                        <Identicon
                          :key="contract.signer"
                          :address="contract.signer"
                          :size="20"
                        />
                        <span>{{ contract.signer }}</span>
                      </td>
                    </tr>
                    <tr v-if="contract.value">
                      <td>{{ $t('details.contract.value') }}</td>
                      <td class="text-right">
                        {{ contract.value }}
                      </td>
                    </tr>
                    <tr v-if="contract.gas_limit">
                      <td>{{ $t('details.contract.gas_limit') }}</td>
                      <td class="text-right">
                        {{ contract.gas_limit }}
                      </td>
                    </tr>
                    <tr v-if="contract.storage_limit">
                      <td>{{ $t('details.contract.storage_limit') }}</td>
                      <td class="text-right">
                        {{ contract.storage_limit }}
                      </td>
                    </tr>
                    <tr v-if="contract.init">
                      <td>{{ $t('details.contract.init') }}</td>
                      <td class="text-right">
                        <span class="init" style="color: #aaa">{{
                          contract.init
                        }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
      </b-container>
    </section>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import Identicon from '@/components/Identicon.vue'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'

export default {
  components: {
    Identicon,
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      network,
      loading: true,
      contractId: this.$route.params.id,
      contract: undefined,
    }
  },
  watch: {
    $route() {
      this.contractId = this.$route.params.id
    },
  },
  apollo: {
    account: {
      query: gql`
        query contract($contract_id: String!) {
          contract(where: { contract_id: { _eq: $contract_id } }) {
            contract_id
            init
            value
            gas_limit
            storage_limit
            signer
            block_height
            timestamp
          }
        }
      `,
      variables() {
        return {
          contract_id: this.contractId,
        }
      },
      result({ data }) {
        if (data.contract[0]) {
          this.contract = data.contract[0]
        }
        this.loading = false
      },
    },
  },
}
</script>

<style>
.contract-page .init {
  word-break: break-all;
}
</style>
