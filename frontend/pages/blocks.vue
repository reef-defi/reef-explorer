<template>
  <div class="list-view">
    <Search
      v-model="filter"
      placeholder="Search by block number"
      :label="`${$t('pages.blocks.title')} ${formatNumber(totalRows)}`"
    />

    <section>
      <b-container>
        <div class="list-view__table">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <Table v-else>
            <THead>
              <Cell>Block</Cell>
              <Cell>Age</Cell>
              <Cell>Status</Cell>
              <Cell>Hash</Cell>
              <!--              <Cell align="center">Extrinsics</Cell>
              <Cell align="center">Events</Cell>-->
            </THead>

            <Row v-for="(item, index) in blocks" :key="index">
              <Cell :link="`/block/${item.hash}`"
                ># {{ formatNumber(item.id) }}</Cell
              >

              <Cell class="list-view__age">
                <font-awesome-icon :icon="['far', 'clock']" />
                <span>{{ getAge(item.timestamp) }}</span>
                <span>({{ formatTimestamp(item.timestamp) }})</span>
              </Cell>

              <Cell>
                <font-awesome-icon
                  :icon="item.finalized ? 'check' : 'spinner'"
                  :class="
                    item.finalized
                      ? 'text-success'
                      : 'list-view__processing-icon'
                  "
                  style="margin-right: 5px"
                />
                <span>{{ item.finalized ? 'Finalized' : 'Processing' }}</span>
              </Cell>

              <Cell>{{ shortHash(item.hash) }}</Cell>

              <!--              <Cell align="center">{{ item.total_extrinsics }}</Cell>

              <Cell align="center">{{ item.total_events }}</Cell>-->
            </Row>
          </Table>

          <div class="list-view__pagination">
            <PerPage v-model="perPage" />
            <b-pagination
              v-model="currentPage"
              :total-rows="totalRows"
              :per-page="perPage"
            />
          </div>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Search from '@/components/Search'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Loading,
    Search,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      filter: '',
      blocks: [],
      paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 1,
    }
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription blocks(
            $blockNumber: bigint_comparison_exp
            $perPage: Int!
            $offset: Int!
          ) {
            block(
              limit: $perPage
              offset: $offset
              where: { id: $blockNumber }
              order_by: { id: desc }
            ) {
              id
              finalized
              hash
              timestamp
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.isBlockNumber(this.filter)
              ? { _eq: parseInt(this.filter) }
              : {},
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.blocks = data.block
          if (this.filter) {
            this.totalRows = this.blocks.length
          }
          this.loading = false
        },
      },
      totalBlocks: {
        query: gql`
          subscription chain_info {
            chain_info(where: { name: { _eq: "blocks" } }, limit: 1) {
              count
            }
          }
        `,
        result({ data }) {
          if (!this.filter) {
            this.totalRows = data.chain_info[0].count
          }
        },
      },
    },
  },
}
</script>
