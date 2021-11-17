<template>
  <div>
    <section>
      <b-container class="token-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!contract">
          <h1 class="text-center">Token not found!</h1>
        </template>

        <Card v-else class="token-details">
          <div class="token-details__identicon">
            <eth-identicon :address="contractId" :size="80" />
          </div>

          <Headline>
            <font-awesome-icon
              v-if="contract.token_validated"
              v-b-tooltip.hover
              icon="check"
              class="text-success"
              title="Validated token"
            />
            <img
              v-if="contract.token_icon_url"
              :src="contract.token_icon_url"
              style="width: 32px; height: 32px"
            />
            <span>{{ contract.name || shortHash(contractId) }}</span>
          </Headline>

          <h4 class="text-center mb-4">
            <p class="mt-3">
              <b-badge class="ml-2" variant="info">ERC-20 token</b-badge>
              <b-badge v-if="contract.verified" class="ml-2" variant="success">
                Verified source
                <font-awesome-icon icon="check" />
              </b-badge>
              <b-badge v-else class="ml-2" variant="danger">
                Not verified source
                <font-awesome-icon icon="times" />
              </b-badge>
            </p>
          </h4>

          <Tabs v-model="tab" :options="tabs" />

          <!-- Info -->

          <Data v-if="tab === 'info'">
            <Row>
              <Cell>Contract address</Cell>
              <Cell>
                <eth-identicon :address="contractId" :size="16" />
                <nuxt-link :to="`/contract/${contractId}`">
                  {{ contractId }}
                </nuxt-link>
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.token_name') }}</Cell>
              <Cell>{{ contract.token_name }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.token_symbol') }}</Cell>
              <Cell>{{ contract.token_symbol }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.token_decimals') }}</Cell>
              <Cell>{{ contract.token_decimals }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.token_total_supply') }}</Cell>
              <Cell class="token-details__amount">
                {{
                  formatTokenAmount(
                    contract.token_total_supply,
                    contract.token_decimals,
                    contract.token_symbol
                  )
                }}
              </Cell>
            </Row>

            <Row>
              <Cell>Created at block</Cell>
              <Cell>
                <nuxt-link :to="`/block?blockNumber=${contract.block_height}`">
                  # {{ formatNumber(contract.block_height) }}
                </nuxt-link>
              </Cell>
            </Row>

            <Row v-if="contract.signer">
              <Cell>{{ $t('details.token.created') }}</Cell>
              <Cell>
                <ReefIdenticon
                  :key="contract.signer"
                  :address="contract.signer"
                  :size="20"
                  class="token-details__account-identicon"
                />
                <nuxt-link :to="`/account/${contract.signer}`">
                  {{ shortAddress(contract.signer) }}
                </nuxt-link>
              </Cell>
            </Row>
          </Data>

          <!-- Holders -->

          <TokenHolders
            v-if="tab === 'holders'"
            :holders="contract.holders"
            :decimals="contract.token_decimals"
            :symbol="contract.token_symbol"
          />

          <!-- Developer -->

          <Data v-if="tab === 'developer'">
            <Row>
              <Cell>{{ $t('details.token.compiler_version') }}</Cell>
              <Cell>{{ contract.compiler_version }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.optimization') }}</Cell>
              <Cell>
                <font-awesome-icon
                  :icon="contract.optimization ? 'check' : 'times'"
                  :class="
                    contract.optimization ? 'text-success' : 'text-danger'
                  "
                />
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.runs') }}</Cell>
              <Cell>{{ contract.runs }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.target') }}</Cell>
              <Cell>{{ contract.target }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.license') }}</Cell>
              <Cell>{{ contract.license }}</Cell>
            </Row>

            <Row v-if="contract.bytecode">
              <Cell>{{ $t('details.token.bytecode') }}</Cell>
              <Cell wrap>{{ contract.bytecode }}</Cell>
            </Row>

            <Row v-if="contract.deployment_bytecode">
              <Cell>{{ $t('details.contract.deployment_bytecode') }}</Cell>
              <Cell wrap>{{ contract.deployment_bytecode }}</Cell>
            </Row>

            <Row v-if="contract.abi">
              <Cell>{{ $t('details.token.abi') }}</Cell>
              <Cell class="table-json" wrap>
                <vue-json-pretty :data="JSON.parse(contract.abi)" />
              </Cell>
            </Row>
          </Data>

          <!-- Source -->

          <pre v-if="tab === 'source'" class="token-details__source">{{
            contract.source
          }}</pre>

          <!-- Transactions -->

          <ContractTransactions
            v-if="tab === 'transactions'"
            :contract-id="contractId"
          />

          <!-- Execute -->

          <contract-execute
            v-if="tab === 'execute'"
            :contract-id="contractId"
            :contract-name="contract.name"
            :contract-abi="JSON.parse(contract.abi)"
          />
        </Card>
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import VueJsonPretty from 'vue-json-pretty'
import ContractTransactions from '../../components/ContractTransactions.vue'
import ContractExecute from '../../components/ContractExecute.vue'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'

export default {
  components: {
    ReefIdenticon,
    Loading,
    VueJsonPretty,
    ContractTransactions,
    ContractExecute,
  },
  mixins: [commonMixin],
  data() {
    return {
      network,
      loading: true,
      contractId: this.$route.params.id,
      contract: undefined,
      tab: 'info',
    }
  },
  computed: {
    tabs() {
      if (this.contract?.verified) {
        return {
          info: 'Token Info',
          holders: 'Holders',
          developer: 'Developer',
          source: 'Verified Source',
          transactions: 'Transactions',
          execute: 'Execute',
        }
      }

      return {
        info: 'Token Info',
        holders: 'Holders',
        transactions: 'Transactions',
      }
    },
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
              deployment_bytecode
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
              token_icon_url
              token_validated
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

<style lang="scss">
.token-details {
  .details-headline {
    & + * {
      margin-top: 15px;
    }
  }

  .token-details__identicon {
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
    box-shadow: 0 0 10px -10px rgba(#0f233f, 0.5),
      0 5px 15px -5px rgba(#0f233f, 0.25);
    border-radius: 50%;
    height: 110px;
    width: 110px;
    margin: 0 auto 15px auto;
    overflow: hidden;

    img {
      border-radius: 50%;
    }
  }

  .tabs {
    margin: 25px 0;
  }

  .token-details__amount {
    .table-cell__content {
      font-weight: 600;
    }
  }

  .token-details__account-identicon {
    display: flex !important;
  }

  .token-details__source {
    background: rgba(#eaedf3, 0.5);
  }
}
</style>
