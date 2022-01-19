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
        <Cell
          :link="`/event/${item.extrinsic.block_id}/${item.extrinsic.index}/${item.index}`"
        >
          # {{ formatNumber(item.extrinsic.block_id) }}-{{
            formatNumber(item.extrinsic.index)
          }}-{{ item.index }}
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
    extrinsicId: {
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
          subscription events($extrinsic_id: bigint!) {
            event(
              order_by: { index: asc }
              where: { extrinsic_id: { _eq: $extrinsic_id } }
            ) {
              extrinsic {
                id
                block_id
                index
              }
              index
              data
              method
              section
            }
          }
        `,
        variables() {
          return {
            extrinsic_id: parseInt(this.extrinsicId),
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
