<template>
  <Table>
    <THead>
      <Cell>Account ID</Cell>
      <Cell>EVM Address</Cell>
      <Cell align="right">Balance</Cell>
    </THead>

    <Row v-for="(item, index) in holders" :key="index">
      <Cell
        :link="`/account/${item.holder_account_id}`"
        :title="$t('pages.accounts.account_details')"
      >
        <ReefIdenticon
          :key="item.holder_account_id"
          :address="item.holder_account_id"
          :size="20"
        />
        <span>{{ shortAddress(item.holder_account_id) }}</span>
      </Cell>

      <Cell
        v-if="item.holder_evm_address"
        :link="{ fill: false, url: `/account/${item.holder_account_id}` }"
      >
        <eth-identicon :address="item.holder_evm_address" :size="20" />
        <span>{{
          item.holder_evm_address ? shortHash(item.holder_evm_address) : ''
        }}</span>
      </Cell>

      <Cell align="right">{{
        formatTokenAmount(item.balance, decimals, symbol)
      }}</Cell>
    </Row>
  </Table>
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
    }
  },
}
</script>
