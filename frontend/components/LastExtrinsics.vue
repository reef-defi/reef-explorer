<template>
  <div class="last-extrinsics">
    <div class="headline">
      <nuxt-link
        v-b-tooltip.hover
        :to="`/blocks`"
        title="Click to see last extrinsics"
      >
        Last extrinsics
      </nuxt-link>
    </div>

    <Table>
      <Row v-for="(item, index) in extrinsics" :key="'item-' + index">
        <Cell
          label="Id"
          :link="`/extrinsic/${item.block_number}/${item.extrinsic_index}`"
          >#{{ formatNumber(item.block_number) }}-{{
            item.extrinsic_index
          }}</Cell
        >

        <Cell label="Hash">{{ shortHash(item.hash) }}</Cell>
        <Cell label="Extrinsic">{{ item.section }} ➡ {{ item.method }}</Cell>
      </Row>
    </Table>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import gql from 'graphql-tag'

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
            extrinsic(order_by: { block_number: desc }, where: {}, limit: 10) {
              block_number
              extrinsic_index
              is_signed
              signer
              section
              method
              hash
              doc
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
