<template>
  <div>
    <section>
      <b-container class="event-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!parsedEvent" text="Event not found" />
        <Event v-else :event="parsedEvent" />
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import Event from '@/components/Event.vue'

export default {
  components: {
    Loading,
    Event,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      blockId: this.$route.params.block,
      extrinsicIndex: this.$route.params.extrinsicIndex,
      eventIndex: this.$route.params.eventIndex,
      parsedEvent: undefined,
    }
  },
  head() {
    return {
      title: 'Reef block explorer',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Reef chain block explorer',
        },
      ],
    }
  },
  watch: {
    $route() {
      this.blockId = this.$route.params.block
      this.extrinsicIndex = this.$route.params.extrinsicIndex
      this.eventIndex = this.$route.params.eventIndex
    },
  },
  apollo: {
    event: {
      query: gql`
        query event(
          $block_id: bigint!
          $extrinsic_index: bigint!
          $event_index: bigint!
        ) {
          event(
            where: {
              block_id: { _eq: $block_id }
              index: { _eq: $event_index }
              extrinsic: { index: { _eq: $extrinsic_index } }
            }
          ) {
            id
            block_id
            extrinsic {
              id
              block_id
              index
            }
            index
            data
            method
            phase
            section
            timestamp
          }
        }
      `,
      skip() {
        return !this.blockId || !this.extrinsicIndex || !this.eventIndex
      },
      variables() {
        return {
          block_id: parseInt(this.blockId),
          extrinsic_index: parseInt(this.extrinsicIndex),
          event_index: parseInt(this.eventIndex),
        }
      },
      result({ data }) {
        this.parsedEvent = data?.event[0]
        this.loading = false
      },
    },
  },
}
</script>
