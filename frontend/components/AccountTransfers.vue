<template>
  <div class="account-transfers">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="transfers.length === 0" class="text-center py-4">
      <h5>{{ $t('components.transfers.no_transfer_found') }}</h5>
    </div>
    <div v-else>
      <!-- Filter -->
      <b-row style="margin-bottom: 1rem">
        <b-col cols="12">
          <b-form-input
            id="filterInput"
            v-model="filter"
            type="search"
            :placeholder="$t('components.transfers.search')"
          />
        </b-col>
      </b-row>
      <JsonCSV
        :data="transfers"
        class="download-csv mb-2"
        :name="`reef_transfers_${accountId}.csv`"
      >
        <font-awesome-icon icon="file-csv" />
        {{ $t('pages.accounts.download_csv') }}
      </JsonCSV>
      <div class="table-responsive">
        <b-table
          striped
          hover
          :fields="fields"
          :per-page="perPage"
          :current-page="currentPage"
          :items="transfers"
          :filter="filter"
          @filtered="onFiltered"
        >
          <template #cell(extrinsic_index)="data">
            <font-awesome-icon
              v-if="data.item.source === accountId"
              :icon="['fas', 'arrow-up']"
            />
            <font-awesome-icon v-else :icon="['fas', 'arrow-down']" />
          </template>
          <template #cell(timestamp)="data">
            <p class="mb-0">
              <font-awesome-icon :icon="['far', 'clock']" />
              {{ fromNow(data.item.timestamp) }}
            </p>
          </template>
          <template #cell(block_number)="data">
            <p class="mb-0">
              <nuxt-link :to="`/block?blockNumber=${data.item.block_number}`">
                #{{ formatNumber(data.item.block_number) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(hash)="data">
            <p class="mb-0">
              <nuxt-link :to="`/transfer/${data.item.hash}`">
                {{ shortHash(data.item.hash) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(source)="data">
            <p class="mb-0">
              <Identicon
                :key="data.item.source"
                :address="data.item.source"
                :size="20"
              />
              <nuxt-link
                :to="`/account/${data.item.source}`"
                :title="$t('pages.accounts.account_details')"
              >
                {{ shortAddress(data.item.source) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(destination)="data">
            <p class="mb-0">
              <Identicon
                :key="data.item.destination"
                :address="data.item.destination"
                :size="20"
              />
              <nuxt-link
                :to="`/account/${data.item.destination}`"
                :title="$t('pages.accounts.account_details')"
              >
                {{ shortAddress(data.item.destination) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(amount)="data">
            <p class="mb-0">
              {{ formatAmount(data.item.amount) }}
            </p>
          </template>
          <template #cell(fee_amount)="data">
            <p class="mb-0">
              {{ formatAmount(data.item.fee_amount) }}
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
        <div class="mt-4 d-flex">
          <b-pagination
            v-model="currentPage"
            :total-rows="totalRows"
            :per-page="perPage"
            aria-controls="validators-table"
          />
          <b-button-group class="ml-2">
            <b-button
              v-for="(item, index) in tableOptions"
              :key="index"
              @click="handleNumFields(item)"
            >
              {{ item }}
            </b-button>
          </b-button-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import gql from 'graphql-tag'
import JsonCSV from 'vue-json-csv'
import commonMixin from '@/mixins/commonMixin.js'
import Identicon from '@/components/Identicon.vue'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Identicon,
    JsonCSV,
    Loading,
  },
  mixins: [commonMixin],
  props: {
    accountId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      transfers: [],
      filter: null,
      filterOn: [],
      tableOptions: paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'extrinsic_index',
          label: '',
          sortable: false,
        },
        {
          key: 'hash',
          label: 'Hash',
          sortable: true,
        },
        {
          key: 'block_number',
          label: 'Block',
          sortable: true,
        },
        {
          key: 'timestamp',
          label: 'Date',
          sortable: true,
        },
        {
          key: 'source',
          label: 'From',
          sortable: true,
        },
        {
          key: 'destination',
          label: 'To',
          sortable: true,
        },
        {
          key: 'amount',
          label: 'Amount',
          sortable: true,
        },
        {
          key: 'fee_amount',
          label: 'Fee',
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
    handleNumFields(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
    onFiltered(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length
      this.currentPage = 1
    },
  },
  apollo: {
    $subscribe: {
      transfer: {
        query: gql`
          subscription transfer($accountId: String!) {
            transfer(
              order_by: { block_number: desc }
              where: {
                _or: [
                  { source: { _eq: $accountId } }
                  { destination: { _eq: $accountId } }
                ]
              }
            ) {
              block_number
              extrinsic_index
              section
              method
              hash
              source
              destination
              amount
              denom
              fee_amount
              success
              error_message
              timestamp
            }
          }
        `,
        variables() {
          return {
            accountId: this.accountId,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          this.transfers = data.transfer
          this.totalRows = this.transfers.length
          this.loading = false
        },
      },
    },
  },
}
</script>

<style>
.account-transfers {
  background-color: white;
}
.spinner {
  color: #d3d2d2;
}
</style>
