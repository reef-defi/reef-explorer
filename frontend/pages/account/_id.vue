<template>
  <div>
    <section>
      <b-container class="account-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!parsedAccount" text="Account not valid" />
        <Card v-else class="account-details">
          <div class="account-details__identicon">
            <ReefIdenticon
              :key="parsedAccount.accountId"
              :address="parsedAccount.accountId"
              :size="80"
            />
          </div>

          <Headline
            v-if="
              parsedAccount.identity.display &&
              parsedAccount.identity.displayParent
            "
          >
            {{ parsedAccount.identity.displayParent }} /
            {{ parsedAccount.identity.display }}
          </Headline>
          <Headline v-else-if="parsedAccount.identity.display">
            {{ parsedAccount.identity.display }}
          </Headline>
          <Headline v-else>
            {{ shortAddress(parsedAccount.accountId) }}
          </Headline>

          <Data>
            <Row>
              <Cell>Address</Cell>
              <Cell>
                <ReefIdenticon
                  :key="parsedAccount.accountId"
                  class="account-details__account-identicon"
                  :address="parsedAccount.accountId"
                  :size="20"
                />
                <span>{{ parsedAccount.accountId }}</span>
              </Cell>
            </Row>

            <Row v-if="parsedAccount.evmAddress">
              <Cell>{{ $t('details.account.evm_address') }}</Cell>
              <Cell>
                <eth-identicon :address="parsedAccount.evmAddress" :size="20" />
                <span>{{ parsedAccount.evmAddress }}</span>
              </Cell>
            </Row>

            <Row v-if="parsedAccount.evmNonce">
              <Cell>{{ $t('details.account.evm_nonce') }}</Cell>
              <Cell>
                <span>{{ parsedAccount.evmNonce }}</span>
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.display">
              <Cell>Identity::display</Cell>
              <Cell>
                <span
                  v-if="
                    parsedAccount.identity.display &&
                    parsedAccount.identity.displayParent
                  "
                >
                  {{ parsedAccount.identity.displayParent }} /
                  {{ parsedAccount.identity.display }}
                </span>
                <span v-else>
                  {{ parsedAccount.identity.display }}
                </span>
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.email">
              <Cell>Identity::email</Cell>
              <Cell>
                <a
                  :href="`mailto:${parsedAccount.identity.email}`"
                  target="_blank"
                  >{{ parsedAccount.identity.email }}</a
                >
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.legal">
              <Cell>Identity::legal</Cell>
              <Cell>
                {{ parsedAccount.identity.legal }}
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.riot">
              <Cell>Identity::riot</Cell>
              <Cell>
                {{ parsedAccount.identity.riot }}
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.web">
              <Cell>Identity::web</Cell>
              <Cell>
                <a :href="parsedAccount.identity.web" target="_blank">{{
                  parsedAccount.identity.web
                }}</a>
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.twitter">
              <Cell>Identity::twitter</Cell>
              <Cell>
                <a
                  :href="`https://twitter.com/${parsedAccount.identity.twitter.substr(
                    1,
                    parsedAccount.identity.twitter.length
                  )}`"
                  target="_blank"
                  >{{ parsedAccount.identity.twitter }}</a
                >
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.judgements">
              <Cell>Identity::judgements</Cell>
              <Cell>
                <span v-if="parsedAccount.identity.judgements.length > 0">
                  {{ parsedAccount.identity.judgements }}
                </span>
                <span> No </span>
              </Cell>
            </Row>

            <Row v-if="parsedAccount.nonce">
              <Cell>{{ $t('details.account.account_nonce') }}</Cell>
              <Cell>
                {{ parsedAccount.nonce }}
              </Cell>
            </Row>

            <!-- <Row>
              <Cell>{{ $t('details.account.total_balance') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.balances.freeBalance) }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.available_balance') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.balances.availableBalance) }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.locked_balance') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.balances.lockedBalance) }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.reserved_balance') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.balances.reservedBalance) }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.is_vesting') }}</Cell>
              <Cell>
                {{ parsedAccount.balances.isVesting ? `Yes` : `No` }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.vested_balance') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.balances.vestedBalance) }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.vesting_total') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.balances.vestingTotal) }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.voting_balance') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.balances.votingBalance) }}
              </Cell>
            </Row> -->
          </Data>

          <!-- <Tabs v-model="tab" :options="$options.tabs" />

          <AccountTransfers
            v-if="tab === 'transfers'"
            :account-id="accountId"
          />

          <AccountTokenBalances
            v-if="tab === 'tokens'"
            :account-id="accountId"
          />

          <Activity v-if="tab === 'activity'" :account-id="accountId" />

          <StakingRewards v-if="tab === 'rewards'" :account-id="accountId" />

          <StakingSlashes v-if="tab === 'slashes'" :account-id="accountId" /> -->
        </Card>
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'
// import Activity from '@/components/Activity.vue'
// import AccountTransfers from '@/components/AccountTransfers.vue'
// import StakingRewards from '@/components/StakingRewards.vue'
// import StakingSlashes from '@/components/StakingSlashes.vue'
// import AccountTokenBalances from '@/components/AccountTokenBalances.vue'

export default {
  components: {
    ReefIdenticon,
    Loading,
    // Activity,
    // AccountTransfers,
    // StakingRewards,
    // StakingSlashes,
    // AccountTokenBalances,
  },
  mixins: [commonMixin],
  middleware: ['account'],
  tabs: {
    transfers: 'Transfers',
    tokens: 'Tokens',
    activity: 'Activity',
    rewards: 'Rewards',
    slashes: 'Slashes',
  },
  data() {
    return {
      network,
      loading: true,
      accountId: this.$route.params.id,
      parsedAccount: undefined,
      transfers: [],
      tab: 'transfers',
    }
  },
  watch: {
    $route() {
      this.accountId = this.$route.params.id
    },
  },
  apollo: {
    $subscribe: {
      account: {
        query: gql`
          subscription account($address: String!) {
            account(where: { address: { _eq: $address } }) {
              address
              evm_address
              available_balance
              free_balance
              locked_balance
              block_id
              timestamp
            }
          }
        `,
        variables() {
          return {
            address: this.accountId,
          }
        },
        result({ data }) {
          if (data.account[0]) {
            this.parsedAccount = {
              accountId: data.account[0].address,
              evmAddress: data.account[0].evm_address,
              evmNonce: data.account[0].evm_nonce,
              availableBalance: data.account[0].available_balance,
              freeBalance: data.account[0].free_balance,
              lockedBalance: data.account[0].locked_balance,
              balances: JSON.parse(data.account[0].balances || '{}'),
              nonce: data.account[0].nonce,
              identity: JSON.parse(data.account[0].identity || '{}'),
              timestamp: data.account[0].timestamp,
            }
          } else if (this.isAddress(this.accountId)) {
            this.parsedAccount = {
              accountId: this.accountId,
              evmAddress: null,
              evmNonce: null,
              availableBalance: '0',
              freeBalance: '0',
              lockedBalance: '0',
              balances: {
                accountId: this.accountId,
                accountNonce: '0x00000000',
                additional: [],
                freeBalance: '0x00000000000000000000000000000000',
                frozenFee: '0x00000000000000000000000000000000',
                frozenMisc: '0x00000000000000000000000000000000',
                reservedBalance: '0x00000000000000000000000000000000',
                votingBalance: '0x00000000000000000000000000000000',
                availableBalance: '0x00000000000000000000000000000000',
                lockedBalance: '0x00000000000000000000000000000000',
                lockedBreakdown: [],
                vestingLocked: '0x00000000000000000000000000000000',
                isVesting: false,
                vestedBalance: '0x00000000000000000000000000000000',
                vestedClaimable: '0x00000000000000000000000000000000',
                vestingEndBlock: '0x00000000',
                vestingPerBlock: '0x00000000000000000000000000000000',
                vestingTotal: '0x00000000000000000000000000000000',
              },
              nonce: 0,
              identity: {},
              timestamp: null,
            }
          }
          this.loading = false
        },
      },
    },
  },
}
</script>

<style lang="scss">
.account-details {
  .account-details__identicon {
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
  }

  .account-details__account-identicon {
    display: flex !important;
  }

  .amount {
    .table-cell__content {
      font-weight: 600;
      background: linear-gradient(90deg, #a93185, #5531a9);
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .tabs {
    margin: 25px 0;
  }
}
</style>
