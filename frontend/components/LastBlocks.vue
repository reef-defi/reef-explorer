<template>
  <div class="last-blocks">
    <div class="headline">
      <nuxt-link
        v-b-tooltip.hover
        :to="`/blocks`"
        title="Click to see last blocks"
      >
        Last Blocks
      </nuxt-link>
    </div>

    <Table>
      <THead>
        <Cell>Block</Cell>
        <Cell>Hash</Cell>
        <Cell>Status</Cell>
        <Cell align="center">Extrinsics</Cell>
        <Cell align="center">Events</Cell>
      </THead>
      <Row v-for="(item, index) in blocks" :key="'item-' + index">
        <Cell :link="`/block?blockNumber=${item.block_number}`"
          ># {{ formatNumber(item.block_number) }}</Cell
        >

        <Cell>{{ shortHash(item.block_hash) }}</Cell>

        <Cell>
          <font-awesome-icon
            :icon="item.finalized ? 'check' : 'spinner'"
            :class="
              item.finalized ? 'text-success' : 'last-blocks__processing-icon'
            "
            style="margin-right: 5px"
          />
          <span>{{ item.finalized ? 'Finalized' : 'Processing' }}</span>
        </Cell>

        <Cell align="center">{{ item.total_extrinsics }}</Cell>

        <Cell align="center">{{ item.total_events }}</Cell>
      </Row>
    </Table>
  </div>
</template>

<script>
import '@/components/Table'
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  data: () => {
    return {
      blocks: [],
    }
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription blocks {
            block(order_by: { block_number: desc }, where: {}, limit: 10) {
              block_number
              finalized
              block_hash
              total_extrinsics
              total_events
            }
          }
        `,
        result({ data }) {
          this.blocks = data.block
        },
      },
    },
  },
}
</script>

<style lang="scss">
.last-blocks {
  .last-blocks__processing-icon {
    opacity: 0.75;
    animation: spin 1.5s linear infinite;

    @keyframes spin {
      from {
        transform: none;
      }
      to {
        transform: rotate(360deg);
      }
    }
  }
}
</style>
