<template>
  <div class="last-extrinsics">
    <div class="headline">
      <nuxt-link
        v-b-tooltip.hover
        :to="`/extrinsics`"
        title="Click to see last extrinsics"
      >
        Last Extrinsics
      </nuxt-link>
    </div>

    <Table>
      <THead>
        <Cell>Id</Cell>
        <Cell>Hash</Cell>
        <Cell>Extrinsic</Cell>
      </THead>
      <Row v-for="(item, index) in extrinsics" :key="'item-' + index">
        <Cell :link="`/extrinsic/${item.block_id}/${item.index}`"
          ># {{ formatNumber(item.block_id) }}-{{ item.index }}</Cell
        >

        <Cell>{{ shortHash(item.hash) }}</Cell>
        <Cell>{{ item.section }} ➡ {{ item.method }}</Cell>
      </Row>
    </Table>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      extrinsics: [],
    }
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsics {
            extrinsic(order_by: { block_id: desc }, where: {}, limit: 10) {
              id
              block_id
              index
              type
              signer
              section
              method
              hash
              docs
            }
          }
        `,
        result({ data }) {
          this.extrinsics = data.extrinsic
        },
      },
    },
  },
}
</script>
