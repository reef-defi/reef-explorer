<template>
  <div>
    <section>
      <b-container class="block-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!parsedBlock" text="Block not found" />
        <template v-else>
          <Block
            :parsed-block="parsedBlock"
            :parsed-extrinsics="parsedExtrinsics"
            :parsed-events="parsedEvents"
          />
        </template>
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import Block from '@/components/Block.vue'

export default {
  components: {
    Loading,
    Block,
  },
  data() {
    return {
      loading: true,
      blockNumber: this.$route.query.blockNumber,
      parsedBlock: undefined,
      parsedExtrinsics: [],
      parsedEvents: [],
    }
  },
  head() {
    return {
      title: 'Explorer | Reef Network',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Reef Chain is an EVM compatible chain for DeFi',
        },
      ],
    }
  },
  watch: {
    $route() {
      this.blockNumber = this.$route.query.blockNumber
    },
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription block($id: bigint!) {
            block(where: { id: { _eq: $id } }) {
              finalized
              hash
              id
              extrinsic_root
              parent_hash
              state_root
              timestamp
              author
            }
          }
        `,
        variables() {
          return {
            id: this.$route.query.blockNumber,
          }
        },
        result({ data }) {
          if (data.block[0]) {
            this.parsedBlock = data.block[0]
          }
          this.loading = false
        },
      },
      event: {
        query: gql`
          subscription event($block_id: bigint!) {
            event(where: { block_id: { _eq: $block_id } }) {
              block_id
              data
              index
              method
              phase
              section
            }
          }
        `,
        variables() {
          return {
            block_id: this.$route.query.blockNumber,
          }
        },
        result({ data }) {
          this.parsedEvents = data.event
        },
      },
      extrinsic: {
        query: gql`
          subscription extrinsic($block_id: bigint!) {
            extrinsic(where: { block_id: { _eq: $block_id } }) {
              id
              block_id
              index
              signer
              section
              method
              args
              hash
              docs
              type
            }
          }
        `,
        variables() {
          return {
            block_id: this.$route.query.blockNumber,
          }
        },
        result({ data }) {
          this.parsedExtrinsics = data.extrinsic
        },
      },
    },
  },
}
</script>
