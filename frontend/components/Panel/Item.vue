<template>
  <component
    :is="component"
    ref="clicked"
    :to="component === 'router-link' ? data.route : null"
    class="panel-item"
    :class="[
      data.class ? `panel-item--${data.class}` : '',
      { 'panel-item--active': clicked },
    ]"
    :title="data.text"
    @click="action()"
  >
    <font-awesome-icon class="panel-item__icon" :icon="data.icon" />
    <span>{{ data.text }}</span>
  </component>
</template>

<script>
import Clicked from '@/mixins/Clicked'

export default {
  mixins: [Clicked],
  props: {
    data: { type: Object, required: true },
  },
  computed: {
    component() {
      const map = {
        link: 'router-link',
        button: 'button',
      }

      return map[this.data.type] || null
    },
  },
  mounted() {
    this.handleClick()
  },
  methods: {
    action() {
      this.$emit('click')

      if (
        this.component === 'button' &&
        this.data.action &&
        typeof this.data.action === 'function'
      ) {
        this.data.action()
      }
    },
    handleClick() {
      let el = this.$refs.clicked
      if (el.$el) el = el.$el

      el.addEventListener('click', () => {
        this.$emit('click')
      })
    },
  },
}
</script>

<style lang="scss">
.panel-item {
  text-decoration: none;
  color: #3e3f42;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  flex-basis: 0;
  transition: all 0.25s;
  height: 100%;
  position: relative;
  overflow: hidden;
  border: none;
  background: transparent;
  text-align: center;
  padding: 0;
  padding-bottom: 3px;

  &:hover {
    cursor: pointer;
    text-decoration: none;
    color: #3e3f42;
  }

  .panel-item__icon {
    height: 25px;
    width: 16px;
    position: relative;
    z-index: 1;
    color: #797689;
  }

  span {
    margin-top: 3px;
    position: relative;
    z-index: 1;
  }

  &--active {
    &::after {
      position: absolute;
      content: '';
      padding-left: 50%;
      padding-top: 50%;
      border-radius: 50%;
      background: #eaedf3;
      z-index: 0;
      animation: panel-item-active 0.35s forwards ease-out;

      @keyframes panel-item-active {
        from {
          opacity: 1;
          transform: scale(1.3);
        }

        40% {
          opacity: 1;
        }

        to {
          opacity: 0;
          transform: scale(3);
        }
      }
    }
  }

  &.nuxt-link-exact-active {
    color: #8e1b71;

    .panel-item__icon {
      color: #8e1b71;
    }
  }
}
</style>
