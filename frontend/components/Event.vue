<template>
  <Card v-if="event" class="event-details">
    <Headline
      >Event {{ $route.params.block }}-{{ $route.params.index }}
    </Headline>

    <Data>
      <Row>
        <Cell>Block number</Cell>
        <Cell
          ><nuxt-link :to="`/block?blockNumber=${event.block_number}`">
            # {{ formatNumber(event.block_number) }}
          </nuxt-link>
        </Cell>
      </Row>

      <Row>
        <Cell>Timestamp</Cell>
        <Cell>
          {{ getDateFromTimestamp(event.timestamp) }}
        </Cell>
      </Row>

      <Row>
        <Cell>Event Index</Cell>
        <Cell>{{ event.event_index }}</Cell>
      </Row>

      <Row>
        <Cell>Section &amp; Method</Cell>
        <Cell>
          {{ event.section }} ➡
          {{ event.method }}
        </Cell>
      </Row>

      <Row>
        <Cell>Phase</Cell>
        <Cell>{{ event.phase }}</Cell>
      </Row>

      <Row class="event-details__data">
        <Cell>Data</Cell>
        <Cell>
          <pre>{{ JSON.stringify(JSON.parse(event.data), null, 2) }}</pre>
        </Cell>
      </Row>
    </Data>
  </Card>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
export default {
  mixins: [commonMixin],
  props: {
    event: {
      type: Object,
      default: undefined,
    },
  },
}
</script>

<style lang="scss">
.event-details {
  .event-details__data {
    .table-cell {
      &:last-child {
        .table-cell__content-wrapper {
          height: unset;
          max-height: unset;

          .table-cell__content {
            padding: 15px 0;
            white-space: initial;
            line-height: 1.6;

            pre {
              font-size: 13px;
              line-height: 15px;
              font-weight: 500;
              color: #3e3f42;
              margin: 0;
            }
          }
        }
      }
    }
  }
}
</style>
