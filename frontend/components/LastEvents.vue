<template>
  <div class="last-events">
    <div class="headline">
      <nuxt-link
        v-b-tooltip.hover
        :to="`/blocks`"
        title="Click to see last events"
      >
        Last events
      </nuxt-link>
    </div>

    <Table>
      <Row v-for="(item, index) in events" :key="'item-' + index">
        <Cell
          label="Id"
          :link="`/event/${item.block_number}/${item.event_index}`"
          ># {{ formatNumber(item.block_number) }}-{{ item.event_index }}</Cell
        >

        <Cell label="Event">{{ item.section }} ➡ {{ item.method }}</Cell>
      </Row>
    </Table>
  </div>
</template>

<script>
import '@/components/Table'
import commonMixin from '@/mixins/commonMixin.js'
import gql from 'graphql-tag'

export default {
  mixins: [commonMixin],
  data: () => {
    return {
      events: [],
    }
  },
  apollo: {
    $subscribe: {
      event: {
        query: gql`
          subscription events {
            event(order_by: { block_number: desc }, where: {}, limit: 10) {
              block_number
              event_index
              data
              method
              phase
              section
            }
          }
        `,
        result({ data }) {
          this.events = data.event
        },
      },
    },
  },
}
</script>
