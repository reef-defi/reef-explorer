<template>
  <div class="file-explorer__file-preview">
    <pre :key="'content-' + content">{{ data }}</pre>

    <button
      :key="'btn-' + content"
      v-clipboard:copy="content"
      class="file-explorer__copy-btn"
      title="Copy to clipboard"
      @click="copy"
    >
      <font-awesome-icon icon="clipboard" />
      <span>Copy</span>
    </button>
  </div>
</template>

<script>
export default {
  props: {
    data: { type: [String, Array, Object], default: '' },
    name: { type: String, default: '' },
  },
  computed: {
    content() {
      if (typeof this.data !== 'string') {
        return JSON.stringify(this.data)
      }

      return this.data
    },
  },
  methods: {
    copy() {
      this.$bvToast.toast(this.name, {
        title: 'Copied to clipboard!',
        variant: 'success',
        autoHideDelay: 5000,
        appendToast: false,
      })
    },
  },
}
</script>

<style lang="scss">
.file-explorer__file-preview {
  width: 100%;
  position: relative;

  pre {
    max-width: 100%;
    background: rgba(#eaedf3, 0.5);
  }

  .file-explorer__copy-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    padding: 7px 15px;
    border-radius: 99px;
    background: linear-gradient(130deg, #b01f6c, #3c127b) !important;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    border: none;
    transition: all 0.125s;
    animation: file-explorer-copy-btn 0.3s ease-out;

    @keyframes file-explorer-copy-btn {
      from {
        opacity: 0;
      }
    }

    svg {
      font-size: 15px;
      margin-right: 7px;
    }

    span {
      font-size: 12px;
    }

    &:hover {
      filter: brightness(1.2);
    }

    &:active {
      filter: brightness(0.8);
    }
  }
}
</style>
