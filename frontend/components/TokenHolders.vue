<template>
  <div class="token-holders">
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="holders">
        <template #cell(holder_account_id)="data">
          <p class="mb-0">
            <nuxt-link
              :to="`/account/${data.item.holder_account_id}`"
              :title="$t('pages.accounts.account_details')"
            >
              <Identicon
                :key="data.item.holder_account_id"
                :address="data.item.holder_account_id"
                :size="20"
              />
              {{ shortAddress(data.item.holder_account_id) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(holder_evm_address)="data">
          <span v-if="data.item.holder_evm_address">
            <eth-identicon :address="data.item.holder_evm_address" :size="20" />
            <nuxt-link :to="`/account/${data.item.holder_account_id}`">
              {{
                data.item.holder_evm_address
                  ? shortHash(data.item.holder_evm_address)
                  : ''
              }}
            </nuxt-link>
          </span>
        </template>
        <template #cell(balance)="data">
          <p class="mb-0">
            {{ formatTokenAmount(data.item.balance, decimals, symbol) }}
          </p>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  props: {
    holders: {
      type: Array,
      default: () => [],
    },
    decimals: {
      type: Number,
      default: () => 0,
    },
    symbol: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      extrinsics: [],
      fields: [
        {
          key: 'holder_account_id',
          label: 'Account Id',
          sortable: true,
        },
        {
          key: 'holder_evm_address',
          label: 'EVM address',
          sortable: true,
        },
        {
          key: 'balance',
          label: 'Balance',
          sortable: true,
        },
      ],
    }
  },
}
</script>

<style>
.token-holders .table th,
.token-holders .table td {
  padding: 0.45rem;
}
.token-holders .table thead th {
  border-bottom: 0;
}
</style>
