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
        <Cell :link="`/event/${item.block_number}/${item.event_index}`">
          # {{ formatNumber(item.block_number) }}-{{ item.event_index }}
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
          subscription events($block_number: bigint!, $phase: String!) {
            event(
              order_by: { block_number: desc }
              where: {
                block_number: { _eq: $block_number }
                phase: { _eq: $phase }
              }
            ) {
              block_number
              event_index
              data
              method
              phase
              section
            }
          }
        `,
        variables() {
          return {
            block_number: parseInt(this.blockNumber),
            phase: `{"applyExtrinsic":${this.extrinsicIndex}}`,
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
