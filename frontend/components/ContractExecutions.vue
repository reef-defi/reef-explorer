<template>
  <div class="contract-executions">
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="extrinsics">
        <template #cell(timestamp)="data">
          <p class="mb-0">
            {{ formatTimestamp(data.item.timestamp) }}
          </p>
        </template>
        <template #cell(block_number)="data">
          <p class="mb-0">
            <nuxt-link
              :to="`/extrinsic/${data.item.block_number}/${data.item.extrinsic_index}`"
            >
              #{{ formatNumber(data.item.block_number) }}-{{
                data.item.extrinsic_index
              }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(hash)="data">
          <p class="mb-0">
            {{ shortHash(data.item.hash) }}
          </p>
        </template>
        <template #cell(signer)="data">
          <p class="mb-0">
            <nuxt-link
              :to="`/account/${data.item.signer}`"
              :title="$t('pages.accounts.account_details')"
            >
              <Identicon
                :key="data.item.signer"
                :address="data.item.signer"
                :size="20"
              />
              {{ shortAddress(data.item.signer) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(success)="data">
          <p class="mb-0">
            <font-awesome-icon
              v-if="data.item.success"
              icon="check"
              class="text-success"
            />
            <font-awesome-icon v-else icon="times" class="text-danger" />
          </p>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import gql from 'graphql-tag'
// eslint-disable-next-line no-unused-vars
import moment from 'moment'

export default {
  mixins: [commonMixin],
  props: {
    contractId: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      extrinsics: [],
      fields: [
        {
          key: 'timestamp',
          label: 'Date/time',
          sortable: true,
        },
        {
          key: 'block_number',
          label: 'Extrinsic',
          sortable: true,
        },
        {
          key: 'hash',
          label: 'Hash',
          class: 'd-none d-sm-none d-md-none d-lg-block d-xl-block',
          sortable: true,
        },
        {
          key: 'signer',
          label: 'Signer',
          sortable: true,
        },
        {
          key: 'success',
          label: 'Success',
          sortable: true,
        },
      ],
    }
  },
  methods: {
    formatTimestamp: (timestamp) => {
      return moment.unix(timestamp).format('YYYY/MM/DD HH:mm:ss')
    },
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsics($contractId: String!) {
            extrinsic(
              order_by: { block_number: desc }
              where: {
                section: { _eq: "evm" }
                method: { _eq: "call" }
                args: { _like: $contractId }
              }
              limit: 10
            ) {
              block_number
              extrinsic_index
              hash
              is_signed
              signer
              args
              success
              timestamp
            }
          }
        `,
        variables() {
          return {
            contractId: `["${this.contractId.toLowerCase()}",%`,
          }
        },
        result({ data }) {
          this.extrinsics = data.extrinsic
        },
      },
    },
  },
}
</script>

<style>
.contract-executions .table th,
.contract-executions .table td {
  padding: 0.45rem;
}
.contract-executions .table thead th {
  border-bottom: 0;
}
.contract-executions .identicon {
  display: inline-block;
  margin: 0 0.2rem 0 0;
  cursor: copy;
}
</style>
