<template>
  <div class="token-transfers list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="transfers.length === 0" class="text-center py-4">
      <h5>No transfers found</h5>
    </div>
    <div v-else>
      <Table>
        <THead>
          <Cell>Transfer</Cell>
          <Cell>Extrinsic</Cell>
          <Cell>From address</Cell>
          <Cell>To address</Cell>
          <Cell>Amount</Cell>
          <Cell>Timestamp</Cell>
          <Cell align="center">Success</Cell>
        </THead>

        <Row v-for="(item, index) in list" :key="index">
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
              :key="item.extrinsic.signer"
              :address="item.from_address"
              :size="20"
            />
            <span>
              {{ shortAddress(item.from_address || item.from_evm_address) }}
            </span>
          </Cell>

          <Cell
            :link="{ url: `/account/${item.to_address}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.extrinsic.signer"
              :address="item.to_address"
              :size="20"
            />
            <span>
              {{ shortAddress(item.to_address || item.to_evm_address) }}
            </span>
          </Cell>

          <Cell>{{ formatAmount(item.amount, symbol, decimals) }}</Cell>

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
              v-if="item.extrinsic.status === 'success'"
              icon="check"
              class="text-success"
            />
            <font-awesome-icon v-else icon="times" class="text-danger" />
          </Cell>
        </Row>
      </Table>

      <div class="list-view__pagination">
        <PerPage v-model="perPage" />
        <b-pagination
          v-model="currentPage"
          :total-rows="transfers.length"
          :per-page="perPage"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import tableUtils from '@/mixins/tableUtils'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin, tableUtils],
  props: {
    tokenId: { type: String, required: true },
    decimals: { type: Number, default: 0 },
    symbol: { type: String, default: '' },
  },
  data() {
    return {
      loading: true,
      transfers: [],
      tableOptions: paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 1,
      activeSort: {
        property: 'timestamp',
        descending: true,
      },
    }
  },
  computed: {
    list() {
      return this.paginate(
        this.sort(this.transfers),
        this.perPage,
        this.currentPage
      )
    },
  },
  apollo: {
    $subscribe: {
      transfer: {
        query: gql`
          subscription transfer($tokenId: String!) {
            transfer(
              order_by: { timestamp: desc }
              where: { token_address: { _eq: $tokenId } }
            ) {
              extrinsic {
                hash
                block_id
                index
                signer
                status
              }
              to_address
              from_address
              to_evm_address
              from_evm_address
              amount
              timestamp
            }
          }
        `,
        variables() {
          return {
            tokenId: this.tokenId,
          }
        },
        skip() {
          return !this.tokenId
        },
        result({ data }) {
          this.transfers = data.transfer
          this.totalRows = this.transfers.length
          this.loading = false
        },
      },
    },
  },
}
</script>
