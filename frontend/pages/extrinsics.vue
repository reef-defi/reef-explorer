<template>
  <div class="list-view">
    <Search
      v-model="filter"
      :placeholder="$t('pages.blocks.search_placeholder')"
      :label="`${$t('pages.extrinsics.title')}<span>${formatNumber(
        totalRows
      )}</span>`"
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
              <Cell align="center">Success</Cell>
            </THead>

            <Row v-for="(item, index) in extrinsics" :key="index">
              <Cell :link="`/extrinsic/${item.hash}`">
                {{ shortHash(item.hash) }}
              </Cell>

              <Cell
                :link="{
                  url: `/extrinsic/${item.block_number}/${item.extrinsic_index}`,
                  fill: false,
                }"
                >{{ item.block_number }}-{{ item.extrinsic_index }}</Cell
              >

              <Cell class="list-view__age">
                <font-awesome-icon :icon="['far', 'clock']" />
                <span>{{ getAge(item.timestamp) }}</span>
                <span>({{ formatTimestamp(item.timestamp) }})</span>
              </Cell>

              <Cell>{{ item.section }} ➡ {{ item.method }}</Cell>

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
    }
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsics(
            $blockNumber: bigint
            $perPage: Int!
            $offset: Int!
          ) {
            extrinsic(
              limit: $perPage
              offset: $offset
              where: { block_number: { _eq: $blockNumber } }
              order_by: { block_number: desc, extrinsic_index: desc }
            ) {
              block_number
              extrinsic_index
              is_signed
              signer
              section
              method
              hash
              success
              timestamp
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.filter ? parseInt(this.filter) : undefined,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.extrinsics = data.extrinsic
          if (this.filter) {
            this.totalRows = this.extrinsics.length
          }
          this.loading = false
        },
      },
      totalExtrinsics: {
        query: gql`
          subscription total {
            total(where: { name: { _eq: "extrinsics" } }, limit: 1) {
              count
            }
          }
        `,
        result({ data }) {
          if (!this.filter) {
            this.totalRows = data.total[0].count
          }
        },
      },
    },
  },
}
</script>
