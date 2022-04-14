<template>
  <div class="list-view">
    <Search
      v-model="filter"
      :placeholder="$t('pages.blocks.search_placeholder')"
      :label="`${$t('pages.extrinsics.title')} ${formatNumber(totalRows)}`"
    />

    <section>
      <b-container>
        <div class="list-view__table">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <Table v-else>
            <THead>
              <Cell>Hash</Cell>
              <Cell>Extrinsic</Cell>
              <Cell>Age</Cell>
              <Cell>Section/Method</Cell>
              <Cell align="center">Signed</Cell>
            </THead>

            <Row v-for="(item, index) in extrinsics" :key="index">
              <Cell :link="`/extrinsic/${item.hash}`">
                {{ shortHash(item.hash) }}
              </Cell>

              <Cell
                :link="{
                  url: `/extrinsic/${item.block_id}/${item.index}`,
                  fill: false,
                }"
                >{{ item.block_id }}-{{ item.index }}</Cell
              >

              <Cell class="list-view__age">
                <font-awesome-icon :icon="['far', 'clock']" />
                <span>{{ getAge(getUnixTimestamp(item.timestamp)) }}</span>
                <span>({{ formatTimestamp(item.timestamp) }})</span>
              </Cell>

              <Cell>{{ item.section }} ➡ {{ item.method }}</Cell>

              <Cell align="center">
                <font-awesome-icon
                  v-if="item.type === 'signed'"
                  icon="lock"
                  class="text-success"
                />
                <font-awesome-icon v-else icon="lock-open" class="text-gray" />
              </Cell>
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
      extrinsics: [],
      paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 1,
      nExtrinsics: 0,
    }
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsics(
            $blockNumber: bigint_comparison_exp
            $perPage: Int!
            $offset: Int!
          ) {
            extrinsic(
              limit: $perPage
              offset: $offset
              where: { block_id: $blockNumber }
              order_by: { block_id: desc, index: desc }
            ) {
              id
              block_id
              index
              signer
              section
              method
              hash
              type
              timestamp
              error_message
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.filter ? { _eq: parseInt(this.filter) } : {},
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.extrinsics = data.extrinsic
          this.totalRows = this.filter
            ? this.extrinsics.length
            : this.nExtrinsics
          this.loading = false
        },
      },
      totalExtrinsics: {
        query: gql`
          subscription total {
            chain_info(where: { name: { _eq: "extrinsics" } }, limit: 1) {
              count
            }
          }
        `,
        result({ data }) {
          this.nExtrinsics = data.chain_info[0].count
          this.totalRows = this.nExtrinsics
        },
      },
    },
  },
}
</script>
