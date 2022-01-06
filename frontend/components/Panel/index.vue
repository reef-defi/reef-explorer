<template>
  <div class="panel">
    <div class="panel__wrapper">
      <div class="panel__links">
        <Item v-for="(item, index) in getItems" :key="index" :data="item" />
      </div>
    </div>

    <transition name="panel-more">
      <div v-if="moreOpen" class="panel-more">
        <button class="panel-more__close-btn" @click="closeMore">
          <font-awesome-icon icon="times" />
        </button>

        <b-dropdown class="panel-more__network">
          <template #button-content>
            {{ network.name }}
          </template>
          <b-dropdown-item href="https://reefscan.com">Mainnet</b-dropdown-item>
          <b-dropdown-item href="https://testnet.reefscan.com"
            >Testnet</b-dropdown-item
          >
        </b-dropdown>

        <div class="panel-more__content">
          <div
            v-for="(item, index) in items"
            :key="'more-' + index"
            class="panel-more__item"
          >
            <Item :data="item" @click="closeMore" />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import Item from './Item'
import { network } from '@/frontend.config.js'

export default {
  components: { Item },
  props: {
    items: { type: Array, default: () => [] },
    moreOpen: { type: Boolean, default: false },
  },
  data() {
    return {
      network,
    }
  },
  computed: {
    getItems() {
      const limit = (() => {
        const vw = Math.max(
          document.documentElement.offsetWidth || 0,
          window.innerWidth || 0
        )

        if (vw <= 768) return 3

        return 4
      })()

      if (this.items.length <= limit) {
        return this.items
      }

      return [
        ...this.items.slice(0, limit),
        {
          type: 'button',
          icon: 'ellipsis-h',
          text: 'More',
          class: 'more',
          action: this.openMore,
        },
      ]
    },
  },
  methods: {
    openMore() {
      this.$emit('toggle-more', true)
      document.body.style.overflow = 'hidden'
    },
    closeMore() {
      this.$emit('toggle-more', false)
      document.body.style.overflow = null
    },
  },
}
</script>

<style lang="scss">
.panel {
  width: 100%;
  min-height: 60px;
  max-height: 60px;
  display: none;

  .panel__wrapper {
    position: fixed;
    height: 60px;
    background: white;
    box-shadow: 0 -1px 3px -1px rgba(black, 0.05),
      0 -5px 10px -5px rgba(black, 0.1);
    width: 100%;
    bottom: 0;
    left: 0;
    z-index: 100;

    .panel__links {
      width: 100%;
      padding: 0 15px;
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
      align-items: center;
      height: 100%;
    }
  }

  .panel-more {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: rgba(white, 0.9);
    backdrop-filter: blur(20px);
    z-index: 101;
    height: 100vh;
    overflow: hidden;

    .panel-more__close-btn {
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
      align-items: center;
      border: none;
      width: 42px;
      height: 42px;
      background: transparent;
      position: absolute;
      top: 0;
      right: 0;
      font-size: 23px;
      color: #797689;
      z-index: 2;
    }

    .panel-more__content {
      padding: 30px;
      width: 100%;
      min-height: calc(100vh - 90px);
      height: calc(100vh - 90px);
      max-height: calc(100vh - 90px);
      overflow: auto;
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: stretch;

      .panel-more__item {
        width: 50%;
        padding: 10px;

        .panel-item {
          border-radius: 10px;
          border: solid 1px #d8dce6;
          font-size: 14px;
          font-weight: 600;
          padding-bottom: 0;

          .panel-item__icon {
            height: 40px;
            width: 26px;
          }

          span {
            margin-top: 10px;
          }
        }
      }
    }

    .panel-more__network {
      padding: 40px;
      padding-bottom: 10px;
      margin-bottom: 0;
      width: 100%;

      & + .panel-more__content {
        padding-top: 0;
      }

      > .btn {
        height: 40px;
        background: transparent;
        border: solid 1px #d8dce6;
        color: #3e3f42;
        border-radius: 10px;
        font-weight: 600;
        font-size: 14px;

        &::after {
          vertical-align: 0.2em;
        }
      }

      .dropdown-menu {
        width: calc(100% - 80px);
      }
    }
  }

  .panel-more-enter-active,
  .panel-more-leave-active {
    transition: all 0.25s;
  }

  .panel-more-enter,
  .panel-more-leave-to {
    transform: translateY(50px);
    opacity: 0;
  }

  @media only screen and (max-width: 1200px) {
    display: block;
  }
}
</style>
