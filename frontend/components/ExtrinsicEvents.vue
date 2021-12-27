<template>
  <div class="extrinsic-events">
    <Headline small>Triggered Events</Headline>

    <Table>
      <THead>
        <Cell>Event</Cell>
        <Cell>Section &amp; Method</Cell>
        <Cell>Data</Cell>
      </THead>

      <Row v-for="(item, index) in events" :key="index">
        <Cell :link="`/event/${item.block_id}/${item.index}`">
          # {{ formatNumber(item.block_id) }}-{{ item.index }}
        </Cell>
        <Cell>{{ item.section }} ➡ {{ item.method }}</Cell>
        <Cell>{{ item.data }}</Cell>
      </Row>
    </Table>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  props: {
    blockNumber: {
      type: Number,
      default: () => 0,
    },
    extrinsicIndex: {
      type: Number,
      default: () => 0,
    },
  },
  data: () => {
    return {
      events: [],
    }
  },
  apollo: {
    $subscribe: {
      events: {
        query: gql`
          subscription events($block_id: bigint!) {
            event(
              order_by: { block_id: desc }
              where: { block_id: { _eq: $block_id } }
            ) {
              block_id
              index
              data
              method
              section
            }
          }
        `,
        variables() {
          return {
            block_id: parseInt(this.blockNumber),
          }
        },
        result({ data }) {
          this.events = data.event
        },
      },
    },
  },
}
</script>

<style lang="scss">
.extrinsic-events {
  margin-top: 30px;
}
</style>
