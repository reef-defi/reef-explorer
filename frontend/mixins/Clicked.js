export default {
  data() {
    return {
      clicked: false,
    }
  },
  mounted() {
    this.clicked_setListeners()
  },
  beforeDestroy() {
    this.clicked_removeListeners()
  },
  methods: {
    clicked_setListeners() {
      let el = this.$refs.clicked
      if (!el) return

      if (el.$el) el = el.$el

      el.addEventListener('mousedown', this.clicked_handleMouseDown)
    },
    clicked_removeListeners() {
      let el = this.$refs.clicked
      if (!el) return

      if (el.$el) el = el.$el

      el.removeEventListener('mousedown', this.clicked_handleMouseDown)
    },
    clicked_handleMouseDown(e) {
      this.$emit('mousedown', e)
      this.clicked_trigger()
    },
    clicked_trigger() {
      if (this.$options.clickedTimer) {
        clearTimeout(this.$options.clickedTimer)
        this.clicked = false
      }

      this.$nextTick(() => {
        this.clicked = true

        const duration = this.$options.clickedDuration

        this.$options.clickedTimer = setTimeout(() => {
          this.clicked = false
          this.$options.clickedTimer = null
        }, duration * 1000)
      })
    },
  },
  clickedDuration: 0.35,
  clickedTimer: null,
}
