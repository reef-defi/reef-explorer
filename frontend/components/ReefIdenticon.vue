<template>
  <div
    v-b-tooltip.hover
    title="Click to copy address to clipboard"
    class="d-inline-block identicon"
    @click.stop.prevent="showToast"
  >
    <Identicon
      :key="address"
      v-clipboard:copy="address"
      :size="size"
      :theme="'substrate'"
      :value="address"
      class="identicon"
    />
  </div>
</template>
<script>
import Identicon from '@polkadot/vue-identicon'
export default {
  components: {
    Identicon,
  },
  props: {
    address: {
      type: String,
      default: () => '',
    },
    theme: {
      type: String,
      default: () => 'substrate',
    },
    size: {
      type: Number,
      default: () => 20,
    },
  },
  methods: {
    showToast() {
      this.$bvToast.toast(this.address, {
        title: 'Address copied to clipboard!',
        variant: 'success',
        autoHideDelay: 5000,
        appendToast: false,
      })
    },
  },
}
</script>
