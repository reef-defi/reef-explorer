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
      extrinsicId: this.$route.params.block,
      eventIndex: this.$route.params.index,
      parsedEvent: undefined,
    }
  },
  head() {
    return {
      title: 'Reef chain block explorer',
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
      this.extrinsicId = this.$route.params.block
      this.eventIndex = this.$route.params.index
    },
  },
  apollo: {
    event: {
      query: gql`
        query event($extrinsic_id: bigint!, $index: bigint!) {
          event(
            where: {
              extrinsic_id: { _eq: $extrinsic_id }
              index: { _eq: $index }
            }
          ) {
            id
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
        return !this.extrinsicId || !this.eventIndex
      },
      variables() {
        return {
          extrinsic_id: parseInt(this.extrinsicId),
          index: parseInt(this.eventIndex),
        }
      },
      result({ data }) {
        this.parsedEvent = data.event[0]
        this.loading = false
      },
    },
  },
}
</script>
