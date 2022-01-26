<template>
  <div class="contract-executions list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="transactions.length === 0" class="text-center py-4">
      <h5>
        {{ $t('components.contract_transactions.no_transactions_found') }}
      </h5>
    </div>
    <div v-else>
      <Table>
        <THead>
          <Cell>Transaction</Cell>
          <Cell>Extrinsic</Cell>
          <Cell>From address</Cell>
          <Cell>To address</Cell>
          <Cell>Amount</Cell>
          <Cell>Timestamp</Cell>
          <Cell align="center">Success</Cell>
        </THead>

        <Row v-for="(item, index) in transactions" :key="index">
          <Cell :link="`/contract/tx/${item.extrinsic.hash}`">{{
            shortHash(item.extrinsic.hash)
          }}</Cell>

          <Cell
            :link="`/extrinsic/${item.extrinsic.block_id}/${item.extrinsic.index}`"
          >
            #{{ formatNumber(item.extrinsic.block_id) }}-{{
              formatNumber(item.extrinsic.index)
            }}
          </Cell>

          <Cell
            :link="{ url: `/account/${item.from_address}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.signer"
              :address="item.from_address"
              :size="20"
            />
            <span>{{ shortAddress(item.from_address) }}</span>
          </Cell>

          <Cell
            :link="{ url: `/account/${item.to_address}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.signer"
              :address="item.to_address"
              :size="20"
            />
            <span>{{ shortAddress(item.to_address) }}</span>
          </Cell>

          <Cell>{{
            formatAmount(item.amount, item.symbol, item.decimals)
          }}</Cell>

          <Cell
            v-b-tooltip.hover
            class="list-view__age"
            :title="formatTimestamp(item.timestamp)"
          >
            <font-awesome-icon :icon="['far', 'clock']" />
            <span>{{ getAge(item.timestamp) }}</span>
          </Cell>

          <Cell align="center">
            <font-awesome-icon
              v-if="item.success"
              icon="check"
              class="text-success"
            />
            <font-awesome-icon v-else icon="times" class="text-danger" />
          </Cell>
        </Row>
      </Table>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
// eslint-disable-next-line no-unused-vars
import moment from 'moment'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  props: {
    contractId: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      loading: true,
      transactions: [],
    }
  },
  apollo: {
    $subscribe: {
      transactions: {
        query: gql`
          subscription transferQuery(
            $tokenAddress: String_comparison_exp = {}
          ) {
            transfer(
              limit: 10
              where: { token_address: $tokenAddress }
              order_by: { extrinsic_id: desc }
            ) {
              id
              from_address
              to_address
              success
              amount
              timestamp
              token_address
              extrinsic {
                hash
                block_id
                index
              }
              token {
                address
                verified_contract {
                  contract_data
                }
              }
            }
          }
        `,
        variables() {
          return {
            tokenAddress: { _eq: this.contractId.toLowerCase() },
          }
        },
        result({ data }) {
          if (data) {
            this.transactions = data.transfer.map((t) => ({
              ...t,
              symbol: t.token.verified_contract?.contract_data?.symbol,
              decimals: t.token.verified_contract?.contract_data?.decimals,
            }))
          }
          this.loading = false
        },
      },
    },
  },
}
</script>

<style>
.contract-executions .table th,
.contract-executions .table td {
  padding: 0.45rem;
}
.contract-executions .table thead th {
  border-bottom: 0;
}
.contract-executions .identicon {
  display: inline-block;
  margin: 0 0.2rem 0 0;
  cursor: copy;
}
</style>
