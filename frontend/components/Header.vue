<template>
  <div class="header__wrapper">
    <div class="header">
      <div class="header__content">
        <nuxt-link to="/" class="header__logo">
          <Logo />
        </nuxt-link>

        <div class="header__links">
          <nuxt-link to="/blocks">Blocks</nuxt-link>
          <nuxt-link to="/transfers">Transfers</nuxt-link>
          <nuxt-link to="/extrinsics">Extrinsics</nuxt-link>
          <nuxt-link to="/events">Events</nuxt-link>
          <nuxt-link to="/accounts">Accounts</nuxt-link>
          <nuxt-link to="/contracts">Contracts</nuxt-link>
          <nuxt-link to="/tokens">Tokens</nuxt-link>

          <a
            v-if="network.id === 'reef-mainnet'"
            href="https://testnet.reefscan.com"
            >Reef Testnet</a
          >
          <a v-else href="https://reefscan.com">Reef Mainnet</a>
        </div>

        <ReefPrice />
      </div>
    </div>
  </div>
</template>

<script>
import Logo from '@/assets/Logo'
import ReefPrice from '@/components/ReefPrice'
import { network } from '@/frontend.config.js'

export default {
  components: {
    Logo,
    ReefPrice,
  },
  data() {
    return {
      network,
    }
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

<style lang="scss">
.header__wrapper {
  width: 100%;
  height: 60px;
  background: white;

  .header {
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: inherit;
    z-index: 10;
    background: white;
    box-shadow: 0 1px 3px -1px rgba(black, 0.05),
      0 5px 10px -5px rgba(black, 0.1);

    .header__content {
      width: 100%;
      max-width: 1140px;
      padding: 0 15px;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      height: 100%;

      .header__logo {
        display: flex;
        flex-flow: row nowrap;
        justify-content: flex-start;
        align-items: flex-end;

        svg {
          height: 44px;
        }

        &::after {
          content: 'Scan';
          text-transform: uppercase;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1px;
          transform: translate(-1px, -4px);
          color: #a93185;
          background: linear-gradient(225deg, #a93185, #5531a9);
          opacity: 0.85;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        &:hover {
          text-decoration: none;
        }
      }

      .reef-price {
        margin-bottom: 1px;
      }

      .header__links {
        display: flex;
        flex-flow: row nowrap;
        justify-content: flex-end;
        align-items: center;
        height: 100%;

        > a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          height: 100%;
          color: rgba(#3e3f42, 0.85);
          font-weight: 600;
          padding: 0 10px;
          font-size: 14px;
          text-decoration: none;

          &:hover {
            color: black;
          }

          &.nuxt-link-active,
          &:active {
            color: #a93185;
            background: linear-gradient(225deg, #a93185, #5531a9) !important;
            background-clip: text !important;
            -webkit-text-fill-color: transparent;
          }
        }
      }
    }
  }

  @media only screen and (max-width: 1200px) {
    .header {
      .header__content {
        max-width: 960px;

        .header__links {
          display: none;
        }
      }
    }
  }

  @media only screen and (max-width: 992px) {
    .header {
      .header__content {
        max-width: 720px;
      }
    }
  }

  @media only screen and (max-width: 768px) {
    .header {
      .header__content {
        max-width: 540px;
      }
    }
  }

  @media only screen and (max-width: 576px) {
    .header {
      .header__content {
        padding: 0 25px;
        max-width: 100%;

        .header__logo {
          svg {
            height: 40px;
          }
        }
      }
    }
  }
}
</style>
