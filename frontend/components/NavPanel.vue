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
        '': 'Home',
        blocks: 'Blocks',
        transfers: 'Transfers',
        extrinsics: 'Extrinsics',
        accounts: 'Accounts',
        events: 'Events',
        contracts: 'Contracts',
        tokens: 'Tokens',
      }

      const getIcon = (route) => {
        const icons = {
          '': 'home',
          blocks: 'cube',
          transfers: 'exchange-alt',
          extrinsics: 'atom',
          events: 'comment',
          accounts: 'wallet',
          contracts: 'link',
          tokens: 'coins',
        }

        return icons[route] || ''
      }

      for (const key in links) {
        items.push({
          type: 'link',
          icon: getIcon(key),
          text: links[key],
          class: key === '' ? 'home' : key,
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
    &--home {
      .panel-item__icon {
        width: 20px;
        transform: translateY(1px);
      }
    }
  }

  .panel-more {
    .panel-more__content {
      .panel-more__item {
        .panel-item {
          &--home {
            .panel-item__icon {
              width: 32px;
            }
          }
        }
      }
    }
  }
}
</style>
