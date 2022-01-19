<template>
  <div class="last-activity">
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="extrinsics">
        <template #cell(block_id)="data">
          <p class="mb-0">
            <nuxt-link :to="`/block?blockNumber=${data.item.block_id}`">
              #{{ formatNumber(data.item.block_id) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(signer)="data">
          <p class="mb-0 d-inline-block">
            <ReefIdenticon
              :key="data.item.signer"
              :address="data.item.signer"
              :size="20"
            />
            <nuxt-link :to="`/account/${data.item.signer}`">
              {{ shortAddress(data.item.signer) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(section)="data">
          <p class="mb-0">
            {{ data.item.section }} ➡
            {{ data.item.method }}
          </p>
        </template>
      </b-table>
    </div>
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
      fields: [
        {
          key: 'block_id',
          label: 'Id',
          sortable: true,
        },
        {
          key: 'signer',
          label: 'Signer',
          class: 'd-none d-sm-none d-md-none d-lg-block d-xl-block',
          sortable: true,
        },
        {
          key: 'section',
          label: 'Extrinsic',
          sortable: true,
        },
      ],
    }
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsics {
            extrinsic(
              order_by: { block_id: desc }
              where: { type: { _eq: "signed" } }
              limit: 10
            ) {
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

<style>
.last-activity .table th,
.last-activity .table td {
  padding: 0.45rem;
}
.last-activity .table thead th {
  border-bottom: 0;
}
.last-activity .identicon {
  display: inline-block;
  margin: 0 0.2rem 0 0;
  cursor: copy;
}
</style>
