<template>
  <Panel class="nav-panel" :items="items" />
</template>

<script>
import Panel from '@/components/Panel'

export default {
  components: { Panel },
  computed: {
    items() {
      const items = []

      const links = {
        '': 'Explore',
        accounts: 'Accounts',
        tokens: 'Tokens',
        transfers: 'Transfers',
        contracts: 'Contracts',
        blocks: 'Blocks',
        extrinsics: 'Extrinsics',
        events: 'Events',
      }

      const getIcon = (route) => {
        const icons = {
          '': 'search',
          accounts: 'wallet',
          tokens: 'coins',
          transfers: 'exchange-alt',
          contracts: 'link',
          blocks: 'cube',
          extrinsics: 'atom',
          events: 'comment',
        }

        return icons[route] || ''
      }

      for (const key in links) {
        items.push({
          type: 'link',
          icon: getIcon(key),
          text: links[key],
          class: key === '' ? 'explore' : key,
          route: `/${key}`,
        })
      }

      return items
    },
  },
}
</script>

<style lang="scss">
.nav-panel {
  .panel-item {
    &--explore {
      .panel-item__icon {
        width: 18px;
        transform: translate(-1px, 1px);
      }
    }
  }

  .panel-more {
    .panel-more__content {
      .panel-more__item {
        .panel-item {
          &--explore {
            .panel-item__icon {
              transform: translate(-2px, 2px);
            }
          }
        }
      }
    }
  }
}
</style>
