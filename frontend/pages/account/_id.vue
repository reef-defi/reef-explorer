<template>
  <div>
    <section>
      <b-container class="account-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!parsedAccount">
          <h1 class="text-center">Account not found!</h1>
        </template>
        <template v-else>
          <div class="card mb-4">
            <div class="card-body">
              <p class="text-center mb-2">
                <Identicon
                  :key="parsedAccount.accountId"
                  :address="parsedAccount.accountId"
                  :size="80"
                />
              </p>
              <h4 class="text-center mb-4">
                <span
                  v-if="
                    parsedAccount.identity.display &&
                    parsedAccount.identity.displayParent
                  "
                >
                  {{ parsedAccount.identity.displayParent }} /
                  {{ parsedAccount.identity.display }}
                </span>
                <span v-else-if="parsedAccount.identity.display">
                  {{ parsedAccount.identity.display }}
                </span>
                <span v-else>
                  {{ shortAddress(parsedAccount.accountId) }}
                </span>
              </h4>
              <h4 class="text-center mb-4 amount">
                {{ formatAmount(parsedAccount.balances.freeBalance) }}
              </h4>
              <div class="table-responsive pb-4">
                <table class="table table-striped">
                  <tbody>
                    <tr>
                      <td>{{ $t('details.account.account_id') }}</td>
                      <td>
                        <Identicon
                          :key="parsedAccount.accountId"
                          :address="parsedAccount.accountId"
                          :size="20"
                        />
                        <span>{{ parsedAccount.accountId }}</span>
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.evmAddress">
                      <td>{{ $t('details.account.evm_address') }}</td>
                      <td>
                        <eth-identicon
                          :address="parsedAccount.evmAddress"
                          :size="20"
                        />
                        <span>{{ parsedAccount.evmAddress }}</span>
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.display">
                      <td>Identity::display</td>
                      <td>
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
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.email">
                      <td>Identity::email</td>
                      <td>
                        <a
                          :href="`mailto:${parsedAccount.identity.email}`"
                          target="_blank"
                          >{{ parsedAccount.identity.email }}</a
                        >
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.legal">
                      <td>Identity::legal</td>
                      <td>
                        {{ parsedAccount.identity.legal }}
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.riot">
                      <td>Identity::riot</td>
                      <td>
                        {{ parsedAccount.identity.riot }}
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.web">
                      <td>Identity::web</td>
                      <td>
                        <a :href="parsedAccount.identity.web" target="_blank">{{
                          parsedAccount.identity.web
                        }}</a>
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.twitter">
                      <td>Identity::twitter</td>
                      <td>
                        <a
                          :href="`https://twitter.com/${parsedAccount.identity.twitter.substr(
                            1,
                            parsedAccount.identity.twitter.length
                          )}`"
                          target="_blank"
                          >{{ parsedAccount.identity.twitter }}</a
                        >
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.judgements">
                      <td>Identity::judgements</td>
                      <td>
                        <span
                          v-if="parsedAccount.identity.judgements.length > 0"
                        >
                          {{ parsedAccount.identity.judgements }}
                        </span>
                        <span> No </span>
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.account_nonce') }}</td>
                      <td>
                        {{ parsedAccount.nonce }}
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.total_balance') }}</td>
                      <td class="amount">
                        {{ formatAmount(parsedAccount.balances.freeBalance) }}
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.available_balance') }}</td>
                      <td class="amount">
                        {{
                          formatAmount(parsedAccount.balances.availableBalance)
                        }}
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.locked_balance') }}</td>
                      <td class="amount">
                        {{ formatAmount(parsedAccount.balances.lockedBalance) }}
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.reserved_balance') }}</td>
                      <td class="amount">
                        {{
                          formatAmount(parsedAccount.balances.reservedBalance)
                        }}
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.is_vesting') }}</td>
                      <td>
                        {{ parsedAccount.balances.isVesting ? `Yes` : `No` }}
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.vested_balance') }}</td>
                      <td class="amount">
                        {{ formatAmount(parsedAccount.balances.vestedBalance) }}
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.vesting_total') }}</td>
                      <td class="amount">
                        {{ formatAmount(parsedAccount.balances.vestingTotal) }}
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.voting_balance') }}</td>
                      <td class="amount">
                        {{ formatAmount(parsedAccount.balances.votingBalance) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <b-tabs class="mt-4" content-class="mt-4" fill>
                <b-tab active>
                  <template #title>
                    <h5>Transfers</h5>
                  </template>
                  <AccountTransfers :account-id="accountId" />
                </b-tab>
                <b-tab>
                  <template #title>
                    <h5>Tokens</h5>
                  </template>
                  <account-token-balances :account-id="accountId" />
                </b-tab>
                <b-tab>
                  <template #title>
                    <h5>Activity</h5>
                  </template>
                  <Activity :account-id="accountId" />
                </b-tab>
                <b-tab>
                  <template #title>
                    <h5>Rewards</h5>
                  </template>
                  <staking-rewards :account-id="accountId" />
                </b-tab>
                <b-tab>
                  <template #title>
                    <h5>Slashes</h5>
                  </template>
                  <staking-slashes :account-id="accountId" />
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
import Activity from '@/components/Activity.vue'
import AccountTransfers from '@/components/AccountTransfers.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'
import StakingRewards from '@/components/StakingRewards.vue'
import StakingSlashes from '@/components/StakingSlashes.vue'
import AccountTokenBalances from '@/components/AccountTokenBalances.vue'

export default {
  components: {
    Identicon,
    Loading,
    Activity,
    AccountTransfers,
    StakingRewards,
    StakingSlashes,
    AccountTokenBalances,
  },
  mixins: [commonMixin],
  middleware: ['account'],
  data() {
    return {
      network,
      loading: true,
      accountId: this.$route.params.id,
      parsedAccount: undefined,
      transfers: [],
      fields: [
        {
          key: 'block_number',
          label: 'Block number',
          class: 'd-none d-sm-none d-md-none d-lg-block d-xl-block',
          sortable: true,
        },
        {
          key: 'from',
          label: 'From',
          sortable: true,
        },
        {
          key: 'to',
          label: 'To',
          sortable: true,
        },
        {
          key: 'amount',
          label: 'Amount',
          sortable: true,
        },
      ],
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
          subscription account($account_id: String!) {
            account(where: { account_id: { _eq: $account_id } }) {
              account_id
              evm_address
              balances
              available_balance
              free_balance
              locked_balance
              nonce
              block_height
              identity
              timestamp
            }
          }
        `,
        variables() {
          return {
            account_id: this.accountId,
          }
        },
        result({ data }) {
          if (data.account[0]) {
            this.parsedAccount = {
              accountId: data.account[0].account_id,
              evmAddress: data.account[0].evm_address,
              availableBalance: data.account[0].available_balance,
              freeBalance: data.account[0].free_balance,
              lockedBalance: data.account[0].locked_balance,
              balances: JSON.parse(data.account[0].balances),
              nonce: data.account[0].nonce,
              identity:
                data.account[0].identity !== ``
                  ? JSON.parse(data.account[0].identity)
                  : {},
              timestamp: data.account[0].timestamp,
            }
          }
          this.loading = false
        },
      },
    },
  },
}
</script>
