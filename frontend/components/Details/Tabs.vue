<template>
  <div class="tabs">
    <div class="tabs__wrapper">
      <div ref="container" class="tabs__container">
        <button
          v-for="(title, key) in options"
          :key="key"
          :ref="'tab-' + key"
          class="tabs__tab"
          :class="{ 'tabs__tab--selected': value === key }"
          @click="select(key)"
        >
          {{ title }}
        </button>

        <div
          v-if="indicator"
          class="tabs__indicator"
          :style="`left: ${indicator.left}px; top: ${indicator.top}px; width: ${indicator.width}px;`"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tabs',
  model: {
    prop: 'value',
  },
  props: {
    value: { type: [String, Number, Boolean], default: '' },
    options: { type: Object, default: () => {} },
  },
  data() {
    return {
      indicator: null,
    }
  },
  watch: {
    value() {
      this.setIndicator()
    },
  },
  created() {
    this.setResizeListener()
  },
  mounted() {
    this.setIndicator()
  },
  beforeDestroy() {
    this.removeResizeListener()
  },
  methods: {
    select(key) {
      this.$emit('input', key)
    },
    setIndicator() {
      const key = 'tab-' + this.value
      let el = this.$refs[key]
      if (!el) {
        this.indicator = null
        return
      }

      el = el[0]

      const width = el.getBoundingClientRect().width

      const left = el.offsetLeft
      const top = el.offsetTop

      this.indicator = { width, top, left }
    },
    setResizeListener() {
      window.addEventListener('resize', this.setIndicator)
    },
    removeResizeListener() {
      window.removeEventListener('resize', this.setIndicator)
    },
  },
}
</script>

<style lang="scss">
.tabs {
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;

  .tabs__wrapper {
    background: rgba(#eaedf3, 0.5);
    border-radius: 8px;
    padding: 8px 3px;

    .tabs__container {
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-items: center;
      position: relative;

      .tabs__tab {
        margin: 0 5px;
        background: transparent;
        border-radius: 6px;
        display: flex;
        flex-flow: row nowrap;
        justify-content: center;
        align-items: center;
        text-align: center;
        font-size: 14px;
        font-weight: 600;
        border: none;
        color: rgba(#3e3f42, 0.65);
        transition: all 0.15s;
        padding: 0 13px;
        height: 35px;
        position: relative;
        z-index: 1;

        &:hover {
          color: #3e3f42;
          cursor: pointer;
        }

        &--selected {
          color: #3e3f42;
        }
      }

      .tabs__indicator {
        position: absolute;
        background: white;
        box-shadow: 0 0 10px -10px rgba(#0f233f, 0.5),
          0 5px 10px -5px rgba(#0f233f, 0.25);
        height: 35px;
        z-index: 0;
        border-radius: 6px;
        transition: all 0.2s;
      }
    }
  }
}
</style>
