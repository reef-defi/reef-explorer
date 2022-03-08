<template>
  <div>
    <section>
      <b-container class="token-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!contract" text="Token not found" />

        <Card v-else class="token-details">
          <div class="token-details__identicon">
            <eth-identicon :address="address" :size="80" />
          </div>

          <Headline>
            <img
              v-if="contract.verified_contract.contract_data.icon_url"
              :src="contract.verified_contract.token_icon_url"
              style="width: 32px; height: 32px"
            />
            <span>{{ tokenName }}</span>
          </Headline>

          <h4 class="text-center mb-4">
            <p class="mt-3">
              <b-badge class="ml-2" variant="info">{{
                contractType.toUpperCase()
              }}</b-badge>
              <b-badge
                v-if="contract.verified_contract"
                class="ml-2"
                variant="success"
              >
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
                <eth-identicon :address="address" :size="16" />
                <nuxt-link :to="`/contract/${address}`">
                  {{ address }}
                </nuxt-link>
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.token_name') }}</Cell>
              <Cell>{{
                contract.verified_contract &&
                contract.verified_contract.contract_data
                  ? contract.verified_contract.contract_data.name
                  : ''
              }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.token_symbol') }}</Cell>
              <Cell>{{
                contract.verified_contract.contract_data
                  ? contract.verified_contract.contract_data.symbol
                  : ''
              }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.token_decimals') }}</Cell>
              <Cell>{{
                contract.verified_contract.contract_data
                  ? contract.verified_contract.contract_data.decimals
                  : ''
              }}</Cell>
            </Row>
            <!--            TODO Ziga
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
            </Row>-->

            <Row>
              <Cell>Created at block</Cell>
              <Cell>
                <nuxt-link
                  :to="`/block?blockNumber=${contract.extrinsic.block_id}`"
                >
                  # {{ formatNumber(contract.extrinsic.block_id) }}
                </nuxt-link>
              </Cell>
            </Row>

            <Row v-if="contract.extrinsic.signer">
              <Cell>{{ $t('details.token.created') }}</Cell>
              <Cell>
                <ReefIdenticon
                  :key="contract.extrinsic.signer"
                  :address="contract.extrinsic.signer"
                  :size="20"
                  class="token-details__account-identicon"
                />
                <nuxt-link :to="`/account/${contract.extrinsic.signer}`">
                  {{ shortAddress(contract.extrinsic.signer) }}
                </nuxt-link>
              </Cell>
            </Row>
          </Data>

          <!-- Holders -->
          <TokenHolders
            v-if="tab === 'holders'"
            :token-id="$route.params.id"
            :decimals="tokenData.decimals"
            :symbol="tokenData.symbol"
          />

          <!-- Transfers -->

          <TokenTransfers
            v-if="tab === 'transfers'"
            :token-id="$route.params.id"
            :decimals="tokenData.decimals"
            :symbol="tokenData.symbol"
          />

          <!-- Execute -->

          <contract-execute
            v-if="tab === 'execute'"
            :contract-id="address"
            :contract-name="contract.verified_contract.name"
            :contract-abi="contract.abi"
          />
        </Card>
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import ContractExecute from '../../components/ContractExecute.vue'
import Loading from '@/components/Loading.vue'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import { network } from '@/frontend.config.js'
import commonMixin from '@/mixins/commonMixin.js'
import TokenHolders from '@/components/TokenHolders'
import TokenTransfers from '@/components/TokenTransfers'

export default {
  components: {
    ReefIdenticon,
    Loading,
    TokenHolders,
    TokenTransfers,
    ContractExecute,
  },
  mixins: [commonMixin],
  data() {
    return {
      network,
      loading: true,
      address: this.toContractAddress(this.$route.params.id),
      contract: undefined,
      tab: 'info',
    }
  },
  computed: {
    tabs() {
      if (this.contract?.verified_contract) {
        return {
          info: 'Token Info',
          holders: 'Holders',
          transfers: 'Transfers',
        }
      }

      return {
        info: 'Token Info',
        holders: 'Holders',
      }
    },
    tokenData() {
      const data = this.contract?.verified_contract?.contract_data || {}

      return {
        ...data,
        address: this.address,
      }
    },
    tokenName() {
      const data = this.tokenData
      if (data.name && data.symbol) {
        return `${data.name} (${data.symbol})`
      }

      return this.contractName
    },
  },
  watch: {
    $route() {
      this.address = this.$route.params.id
    },
  },
  apollo: {
    $subscribe: {
      contract: {
        /* TODO Ziga - where can we get these in query
        holders {
          holder_account_id
          holder_evm_address
          balance
        }
        holders_aggregate {
          aggregate {
            count(columns: holder_account_id)
          }
        } */
        query: gql`
          subscription contract($address: String!) {
            contract(where: { address: { _ilike: $address } }) {
              address
              bytecode
              extrinsic {
                signer
                block_id
              }
              verified_contract {
                address
                name
                args
                source
                compiler_version
                compiled_data
                contract_data
                optimization
                runs
                target
                type
              }
              timestamp
            }
          }
        `,
        variables() {
          return {
            address: this.address,
          }
        },
        result({ data }) {
          if (data.contract[0] && data.contract[0].verified_contract) {
            const name = data.contract[0].verified_contract.name

            this.contractType = data.contract[0].verified_contract.type.replace(
              'ERC',
              'ERC-'
            )
            this.contractName = data.contract[0].verified_contract.name

            this.contract = data.contract[0]
            this.contract.abi =
              data.contract[0].verified_contract &&
              data.contract[0].verified_contract.compiled_data &&
              data.contract[0].verified_contract.compiled_data[name]
                ? data.contract[0].verified_contract.compiled_data[name]
                : []

            this.contract.source = Object.keys(
              data.contract[0].verified_contract.source
            ).reduce(this.sourceCode(data), [])
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
