<template>
  <b-navbar toggleable="xl">
    <b-container class="px-sm-3">
      <b-navbar-brand>
        <nuxt-link to="/" class="navbar-brand" title="Reef block explorer">
          <img class="logo" src="/img/reef-logo-new.svg" />
          <span class="explorer">SCAN</span>
        </nuxt-link>
      </b-navbar-brand>
      <a
        v-if="network.coinGeckoDenom && USDConversion && USD24hChange"
        :href="`https://www.coingecko.com/en/coins/${network.coinGeckoDenom}`"
        target="_blank"
        class="fiat mh-2"
      >
        <strong>{{ network.tokenSymbol }}</strong> ${{ USDConversion }} ({{
          USD24hChange
        }}%)
      </a>
      <b-navbar-toggle target="nav-collapse" />
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item right to="/blocks">Blocks</b-nav-item>
          <b-nav-item right to="/transfers">Transfers</b-nav-item>
          <b-nav-item right to="/extrinsics">Extrinsics</b-nav-item>
          <b-nav-item right to="/events">Events</b-nav-item>
          <b-nav-item right to="/accounts">Accounts</b-nav-item>
          <b-nav-item right to="/contracts">Contracts</b-nav-item>
        </b-navbar-nav>
        <a
          v-b-tooltip.hover
          :title="network.name"
          href="https://docs.reef.finance/docs/developers/networks/"
          target="_blank"
          class="d-none d-lg-block d-xl-block"
        >
          <span class="badge badge-pill badge-primary2 network">
            <font-awesome-icon icon="plug" />
            {{ network.name }}
          </span>
        </a>
      </b-collapse>
    </b-container>
  </b-navbar>
</template>

<script>
import { network } from '@/frontend.config.js'
export default {
  data() {
    return {
      network,
    }
  },
  computed: {
    USDConversion() {
      return parseFloat(this.$store.state.fiat.usd).toFixed(3)
    },
    USD24hChange() {
      return parseFloat(this.$store.state.fiat.usd_24h_change).toFixed(2)
    },
  },
  created() {
    // Refresh fiat conversion values every minute
    if (this.network.coinGeckoDenom) {
      this.$store.dispatch('fiat/update')
      setInterval(() => {
        this.$store.dispatch('fiat/update')
      }, 60000)
    }
  },
}
</script>
