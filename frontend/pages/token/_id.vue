<template>
  <div>
    <section>
      <b-container class="contract-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!contract">
          <h1 class="text-center">Token not found!</h1>
        </template>
        <template v-else>
          <div class="card mb-4">
            <div class="card-body">
              <h4 class="text-center mb-4">
                <eth-identicon :address="contractId" :size="32" />
                <span v-if="contract.name">
                  {{ contract.name }}
                </span>
                <span v-else>
                  {{ contractId }}
                </span>
                <b-badge class="ml-2" variant="info">ERC20 token</b-badge>
              </h4>
              <b-tabs content-class="mt-3">
                <b-tab title="Token info" active>
                  <div class="table-responsive pb-4">
                    <table class="table table-striped">
                      <tbody>
                        <tr v-if="contract.token_name">
                          <td>{{ $t('details.token.token_name') }}</td>
                          <td class="text-right">
                            {{ contract.token_name }}
                          </td>
                        </tr>
                        <tr v-if="contract.token_symbol">
                          <td>{{ $t('details.token.token_symbol') }}</td>
                          <td class="text-right">
                            {{ contract.token_symbol }}
                          </td>
                        </tr>
                        <tr v-if="contract.token_decimals">
                          <td>{{ $t('details.token.token_decimals') }}</td>
                          <td class="text-right">
                            {{ contract.token_decimals }}
                          </td>
                        </tr>
                        <tr v-if="contract.token_total_supply">
                          <td>{{ $t('details.token.token_total_supply') }}</td>
                          <td class="text-right">
                            {{
                              formatTokenAmount(
                                contract.token_total_supply,
                                contract.token_decimals,
                                contract.token_symbol
                              )
                            }}
                          </td>
                        </tr>
                        <tr>
                          <td>Contract address</td>
                          <td class="text-right">
                            <eth-identicon :address="contractId" :size="16" />
                            {{ contractId }}
                          </td>
                        </tr>
                        <tr>
                          <td>Created at block</td>
                          <td class="text-right">
                            <nuxt-link
                              :to="`/block?blockNumber=${contract.block_height}`"
                            >
                              #{{ formatNumber(contract.block_height) }}
                            </nuxt-link>
                          </td>
                        </tr>
                        <tr>
                          <td>{{ $t('details.token.created') }}</td>
                          <td class="text-right">
                            <div v-if="contract.signer">
                              <Identicon
                                :key="contract.signer"
                                :address="contract.signer"
                                :size="20"
                              />
                              <nuxt-link :to="`/account/${contract.signer}`">
                                {{ shortAddress(contract.signer) }}
                              </nuxt-link>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </b-tab>
                <b-tab title="Holders">
                  <token-holders
                    :holders="contract.holders"
                    :decimals="contract.token_decimals"
                    :symbol="contract.token_symbol"
                  />
                </b-tab>
                <b-tab v-if="contract.verified" title="Developer">
                  <div class="table-responsive pb-4">
                    <table class="table table-striped">
                      <tbody>
                        <tr>
                          <td>{{ $t('details.token.compiler_version') }}</td>
                          <td class="text-right">
                            {{ contract.compiler_version }}
                          </td>
                        </tr>
                        <tr>
                          <td>{{ $t('details.token.optimization') }}</td>
                          <td class="text-right">
                            <p v-if="contract.optimization" class="mb-0">
                              <font-awesome-icon
                                icon="check"
                                class="text-success"
                              />
                            </p>
                            <p v-else class="mb-0">
                              <font-awesome-icon
                                icon="times"
                                class="text-danger"
                              />
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td>{{ $t('details.token.runs') }}</td>
                          <td class="text-right">
                            {{ contract.runs }}
                          </td>
                        </tr>
                        <tr>
                          <td>{{ $t('details.token.target') }}</td>
                          <td class="text-right">
                            {{ contract.target }}
                          </td>
                        </tr>
                        <tr>
                          <td>{{ $t('details.token.license') }}</td>
                          <td class="text-right">
                            {{ contract.license }}
                          </td>
                        </tr>
                        <tr v-if="contract.bytecode">
                          <td>{{ $t('details.token.bytecode') }}</td>
                          <td class="text-right">
                            <span class="bytecode" style="color: #aaa">{{
                              contract.bytecode
                            }}</span>
                          </td>
                        </tr>
                        <tr v-if="contract.abi">
                          <td>{{ $t('details.token.abi') }}</td>
                          <td class="text-right">
                            <vue-json-pretty :data="JSON.parse(contract.abi)" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </b-tab>
                <b-tab v-if="contract.verified" title="Verified source">
                  <pre>{{ contract.source }}</pre>
                </b-tab>
                <b-tab title="Interactions">
                  <contract-executions :contract-id="contractId" />
                </b-tab>
                <b-tab v-if="contract.verified" title="Contract call">
                  <contract-call
                    :contract-id="contractId"
                    :contract-name="contract.name"
                    :contract-abi="JSON.parse(contract.abi)"
                  />
                </b-tab>
              </b-tabs>
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
import VueJsonPretty from 'vue-json-pretty'
import ContractExecutions from '../../components/ContractExecutions.vue'

export default {
  components: {
    Identicon,
    Loading,
    VueJsonPretty,
    ContractExecutions,
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
    $subscribe: {
      contract: {
        query: gql`
          subscription contract($contract_id: String!) {
            contract(where: { contract_id: { _eq: $contract_id } }) {
              contract_id
              name
              bytecode
              value
              gas_limit
              storage_limit
              signer
              block_height
              verified
              source
              compiler_version
              optimization
              runs
              target
              abi
              license
              token_name
              token_symbol
              token_decimals
              token_total_supply
              timestamp
              holders {
                holder_account_id
                holder_evm_address
                balance
              }
              holders_aggregate {
                aggregate {
                  count(columns: holder_account_id)
                }
              }
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
  },
}
</script>

<style>
.contract-page .bytecode {
  word-break: break-all;
}
</style>
