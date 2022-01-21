<template>
  <div class="file-explorer">
    <div
      class="file-explorer__files"
      :class="{ 'file-explorer__files--collapsed': !!selected }"
    >
      <button
        v-for="(content, filename) in data"
        :key="filename"
        class="file-explorer__file"
        :class="{ 'file-explorer__file--selected': selected === filename }"
        @click="select(filename)"
      >
        <div class="file-explorer__file-icon">
          <font-awesome-icon :icon="['fas', 'file']" />
        </div>
        <div class="file-explorer__file-info">
          <div class="file-explorer__file-title">
            {{ getFilename(filename) }}
          </div>
          <div class="file-explorer__file-subtitle">{{ filename }}</div>
        </div>
      </button>
    </div>

    <div v-if="selected" class="file-explorer__file-preview">
      <pre :key="selected" v-html="data[selected]" />

      <button
        :key="selected"
        v-clipboard:copy="data[selected]"
        class="file-explorer__copy-btn"
        title="Copy to clipboard"
        @click="copy"
      >
        <font-awesome-icon icon="clipboard" />
        <span>Copy</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      default() {
        return {}
      },
    },
  },
  data() {
    return {
      selected: null,
    }
  },
  methods: {
    select(file) {
      if (this.selected === file) {
        this.selected = null
      } else {
        this.selected = file
      }
    },
    getFilename(filename = '') {
      filename = filename.toString().split('/')
      filename = filename[filename.length - 1]
      filename = filename.split('.')
      filename.splice(filename.length - 1, 1)
      return filename.join('')
    },
    copy() {
      this.$bvToast.toast(this.getFilename(this.selected), {
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
.file-explorer {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: flex-start;

  .file-explorer__files {
    width: 100%;
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    transition: all 0.3s ease-out;

    &--collapsed {
      border-right: solid 1px rgba(#eaedf3, 1);
      width: 200px;
    }

    .file-explorer__file {
      border: none;
      background: transparent;
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
      padding: 10px 15px;
      transition: all 0.125s;

      &:nth-child(odd) {
        background: rgba(#eaedf3, 0.5);
      }

      .file-explorer__file-icon {
        color: rgba(#3e3f42, 0.3);
        font-size: 23px;
        margin-right: 13px;
        transition: all 0.15s;
      }

      .file-explorer__file-info {
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;
        align-items: flex-start;
        max-width: calc(100% - 31px);
      }

      .file-explorer__file-title {
        color: #3e3f42;
        font-size: 0.875rem;
        font-weight: 600;
        white-space: nowrap;
        max-width: 100%;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      .file-explorer__file-subtitle {
        color: #3e3f42;
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
        max-width: 100%;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      &:hover {
        transition: none;
        cursor: pointer;
        background: rgba(#eaedf3, 1);

        .file-explorer__file-icon {
          color: #a9319a;
        }
      }

      &:active {
        transition: all 0.15s;
        background: darken(#eaedf3, 3%);

        .file-explorer__file-icon {
          color: #a9319a;
        }
      }

      &--selected {
        background: linear-gradient(130deg, #b01f6c, #3c127b) !important;

        .file-explorer__file-icon,
        .file-explorer__file-title,
        .file-explorer__file-subtitle {
          font-weight: 500;
          color: white !important;
        }
      }
    }
  }

  .file-explorer__file-preview {
    width: calc(100% - 200px);
    animation: file-explorer-preview 0.3s ease-out;
    position: relative;

    @keyframes file-explorer-preview {
      from {
        width: 0;
      }
    }

    pre {
      max-width: 100%;
      animation: file-explorer-preview-content 0.3s ease-out;
      background: rgba(#eaedf3, 0.5);

      @keyframes file-explorer-preview-content {
        from {
          opacity: 0;
          overflow: hidden;
        }

        to {
          overflow: hidden;
        }
      }
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

  @media only screen and (max-width: 992px) {
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;

    .file-explorer__files {
      width: 100%;
      border-right: none !important;
    }

    .file-explorer__file-preview {
      width: 100%;
      margin-top: 15px;
      animation: none;
    }
  }
}
</style>
