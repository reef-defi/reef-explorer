<template>
  <b-navbar toggleable="xl">
    <b-container class="px-sm-3">
      <b-navbar-brand>
        <nuxt-link to="/" class="navbar-brand" title="Reef block explorer">
          <img class="logo" src="/img/reef-logo.svg" />
          <span class="explorer">SCAN</span>
        </nuxt-link>
      </b-navbar-brand>
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
          title="Reef Testnet 4"
          href="https://docs.reef.finance/docs/developers/networks/"
          target="_blank"
          class="d-none d-lg-block d-xl-block"
        >
          <span class="badge badge-pill badge-primary2 network">
            <font-awesome-icon icon="plug" />
            Reef Testnet 4
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
}
</script>
