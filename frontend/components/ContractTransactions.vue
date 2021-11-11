<template>
  <div class="contract-executions list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="extrinsics.length === 0" class="text-center py-4">
      <h5>
        {{ $t('components.contract_transactions.no_transactions_found') }}
      </h5>
    </div>
    <div v-else>
      <Table>
        <THead>
          <Cell>Transaction</Cell>
          <Cell>Timestamp</Cell>
          <Cell>Extrinsic</Cell>
          <Cell>Signer</Cell>
          <Cell align="center">Success</Cell>
        </THead>

        <Row v-for="(item, index) in extrinsics" :key="index">
          <Cell :link="`/contract/tx/${item.hash}`">{{
            shortHash(item.hash)
          }}</Cell>

          <Cell class="list-view__age">
            <font-awesome-icon :icon="['far', 'clock']" />
            <span
              >{{ fromNow(item.timestamp) }} ({{
                formatTimestamp(item.timestamp)
              }})</span
            >
          </Cell>

          <Cell
            :link="{
              url: `/extrinsic/${item.block_number}/${item.extrinsic_index}`,
              fill: false,
            }"
            ># {{ formatNumber(item.block_number) }}-{{
              item.extrinsic_index
            }}</Cell
          >

          <Cell
            :link="{ url: `/account/${item.signer}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.signer"
              :address="item.signer"
              :size="20"
            />
            <span>{{ shortAddress(item.signer) }}</span>
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
      extrinsics: [],
    }
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsics($contractId: String!) {
            extrinsic(
              order_by: { block_number: desc }
              where: {
                section: { _eq: "evm" }
                method: { _eq: "call" }
                args: { _like: $contractId }
              }
              limit: 10
            ) {
              block_number
              extrinsic_index
              hash
              is_signed
              signer
              args
              success
              timestamp
            }
          }
        `,
        variables() {
          return {
            contractId: `["${this.contractId.toLowerCase()}",%`,
          }
        },
        result({ data }) {
          this.extrinsics = data.extrinsic
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
