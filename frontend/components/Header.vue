<template>
  <div class="header__wrapper">
    <div class="header">
      <div class="header__content">
        <div class="logo__wrapper">
          <Hamburger
            :value="mobileMenuOpen"
            @input="$emit('toggle-mobile-menu', $event)"
          />
          <nuxt-link to="/" class="header__logo">
            <Logo />
          </nuxt-link>
        </div>

        <div class="header__links">
          <nuxt-link to="/" exact>Explore</nuxt-link>
          <nuxt-link to="/blocks">Blocks</nuxt-link>
          <nuxt-link to="/accounts">Accounts</nuxt-link>
          <nuxt-link to="/transfers">Transfers</nuxt-link>
          <nuxt-link to="/contracts">Contracts</nuxt-link>
          <nuxt-link to="/tokens">Tokens</nuxt-link>

          <div class="header__links-group">
            <span class="header__links-group-label">Other</span>

            <div class="header__links-group-links">
              <nuxt-link to="/extrinsics">Extrinsics</nuxt-link>
              <nuxt-link to="/events">Events</nuxt-link>
            </div>
          </div>

          <b-dropdown class="header__network">
            <template #button-content>
              {{ network.name }}
            </template>
            <b-dropdown-item href="https://reefscan.com"
              >Mainnet</b-dropdown-item
            >
            <b-dropdown-item href="https://testnet.reefscan.com"
              >Testnet</b-dropdown-item
            >
          </b-dropdown>
        </div>

        <ReefPrice />
      </div>
    </div>
  </div>
</template>

<script>
import Logo from '@/assets/Logo'
import Hamburger from '@/components/Hamburger'
import ReefPrice from '@/components/ReefPrice'
import { network } from '@/frontend.config.js'

export default {
  components: {
    Logo,
    ReefPrice,
    Hamburger,
  },
  props: {
    mobileMenuOpen: { type: Boolean, default: false },
  },
  data() {
    return {
      network,
      test: false,
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

      .logo__wrapper {
        display: flex;
        grid-gap: 1em;

        .header__logo {
          display: flex;
          flex-flow: row nowrap;
          justify-content: flex-start;
          align-items: center;

          svg {
            height: 44px;
          }

          &::after {
            content: 'Scan';
            text-transform: uppercase;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 1px;
            transform: translate(4px, -4px);
            color: #a93185;
            background: linear-gradient(225deg, #a93185, #5531a9);
            opacity: 0.85;
            //noinspection CssInvalidPropertyValue
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          &:hover {
            text-decoration: none;
          }
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
            //noinspection CssInvalidPropertyValue
            background-clip: text !important;
            -webkit-text-fill-color: transparent;
          }
        }

        .header__links-group-links {
          display: none;
          position: absolute;
          left: 0;
          top: calc(100% - 20px);
          padding: 8px 0;
          margin-top: 8px;
          border-radius: 5px;
          background: white;
          box-shadow: 0 1px 3px -1px rgba(black, 0.05),
            0 5px 10px -5px rgba(black, 0.1);
          z-index: 1;
          border: 1px solid rgba(black, 0.15);

          a {
            display: block;
            width: 100%;
            padding: 0.25rem 1.5rem;
            font-weight: 400;
            font-size: 16px;
            color: #212529;
            text-align: left;
            white-space: nowrap;

            &:hover {
              text-decoration: none;
              background: #e9ecef;
              color: #16181b;
            }
          }
        }

        .header__links-group {
          position: relative;
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

          .header__links-group-label {
            cursor: pointer;
          }

          .nuxt-link-active {
            color: #a93185;
            background: linear-gradient(225deg, #a93185, #5531a9) !important;
            //noinspection CssInvalidPropertyValue
            background-clip: text !important;
            -webkit-text-fill-color: transparent;
          }

          &:hover,
          &:active {
            color: black;

            .header__links-group-links {
              display: block;
            }
          }
        }

        .header__network {
          margin-bottom: 0;
          margin-left: 15px;

          > .btn {
            background: rgba(#eaedf3, 1);
            padding: 5px 14px;
            font-weight: 600;
            color: rgba(#3e3f42, 0.85);
            font-size: 14px;
            border: none;

            svg {
              margin-right: 4px;
            }

            &::after {
              vertical-align: 0.12em;
            }

            &:hover,
            &.show {
              color: rgba(#3e3f42, 1);
              background: darken(#eaedf3, 5%);
            }
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
        padding: 0 20px;
        max-width: 100%;

        .header__logo {
          svg {
            height: 40px;
          }
        }

        .reef-price {
          margin-left: auto;
        }
      }
    }
  }
}
</style>
