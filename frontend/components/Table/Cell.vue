<template>
  <td
    class="table-cell"
    :class="[
      `table-cell--${align}`,
      {
        'table-cell--button': tag === 'button',
        'table-cell--sorting': isSorting,
        'table-cell--descending-sort': isDescending,
        'table-cell--wrap': wrap,
      },
    ]"
  >
    <div class="table-cell__content-wrapper">
      <component
        :is="tag"
        :to="!sortable && getLink.url ? getLink.url : null"
        class="table-cell__content"
        :class="{
          'table-cell__content--link': !!getLink.url,
          'table-cell__content--fill': getLink.fill !== false,
        }"
        @click="sort()"
      >
        <slot />

        <font-awesome-icon
          v-if="sortable"
          class="table-cell__sort-icon"
          :class="{ 'table-cell__sort-icon--reverse': isDescending }"
          icon="caret-down"
        />
      </component>
    </div>
  </td>
</template>

<script>
export default {
  name: 'Cell',
  props: {
    link: { type: [String, Object], default: '' },
    sortable: { type: Array, default: null },
    align: {
      type: String,
      default: 'left',
      validator(value) {
        return ['left', 'center', 'right'].includes(value)
      },
    },
    wrap: { type: Boolean, default: false },
  },
  computed: {
    tag() {
      if (this.sortable) return 'button'
      if (this.getLink.url) return 'nuxt-link'

      return 'div'
    },
    getLink() {
      if (typeof this.link !== 'object') return { url: this.link }
      return this.link
    },
    isSorting() {
      return this.sortable && this.sortable[0] === this.sortable[1]?.property
    },
    isDescending() {
      return (
        this.isSorting &&
        ((this.sortable[1]?.descending && !this.sortable[2]) ||
          (!this.sortable[1]?.descending && this.sortable[2]))
      )
    },
  },
  methods: {
    sort() {
      if (this.tag !== 'button' || !this.sortable) {
        return
      }

      if (this.isSorting) {
        // eslint-disable-next-line
        this.sortable[1].descending = !this.sortable[1].descending
      } else {
        // eslint-disable-next-line
        this.sortable[1].property = this.sortable[0]
        // eslint-disable-next-line
        if (this.sortable[2]) this.sortable[1].descending = true
        // eslint-disable-next-line
        else this.sortable[1].descending = false
      }
    },
  },
}
</script>

<style lang="scss">
.table-cell {
  $height: 40px;

  padding: 5px !important;
  border-top: none !important;

  .table-cell__content-wrapper {
    padding: 0 7px;
    width: 100%;
    display: flex;
    flex-flow: column-reverse nowrap;
    justify-content: center;
    height: $height;
    min-height: $height;
    max-height: $height;

    .table-cell__content {
      white-space: nowrap;
      font-size: 13px;
      line-height: 15px;
      font-weight: 500;
      color: #3e3f42;
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;

      &--link {
        border-radius: 99px;
        padding: 0 10px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        height: 27px;
        transition: filter 0.15s;

        &:hover {
          text-decoration: none;
          filter: brightness(1.2);
        }

        &:active {
          filter: brightness(1.4);
        }

        &:not(.table-cell__content--fill) {
          &:not(:hover) {
            box-shadow: inset 0 0 0 1px rgba(#8d1b70, 0.75);

            &,
            span {
              background: linear-gradient(90deg, #a93185, #5531a9);
              background-clip: text;
              -webkit-text-fill-color: transparent;
              color: #5531a9;
            }

            span {
              font-weight: 500;
            }
          }

          &:hover {
            box-shadow: none;
            background: linear-gradient(130deg, #b01f6c, #3c127b);
            color: white;
          }
        }

        &.table-cell__content--fill {
          box-shadow: none;
          background: linear-gradient(130deg, #b01f6c, #3c127b);
          color: white;
        }
      }

      > a {
        background: linear-gradient(90deg, #a93185, #5531a9);
        background-clip: text;
        -webkit-text-fill-color: transparent;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 1px;
          left: 0;
          right: 0;
          margin: 0 auto;
          opacity: 0;
          transform: translateY(3px);
          background: linear-gradient(90deg, #a93185, #5531a9);
          transition: all 0.15s;
        }

        &:hover {
          &::after {
            opacity: 1;
            transform: none;
          }
        }
      }
    }
  }

  &--sorting {
    .table-cell__content-wrapper {
      .table-cell__content {
        color: #8d1b70 !important;

        .table-cell__sort-icon {
          opacity: 1 !important;
        }
      }
    }
  }

  &--descending-sort {
    .table-cell__content-wrapper {
      .table-cell__content {
        .table-cell__sort-icon {
          transform: scaleY(-1);
        }
      }
    }
  }

  &--button {
    padding: 0 !important;

    .table-cell__content-wrapper {
      padding: 0;
      height: auto !important;
      min-height: unset !important;
      max-height: unset !important;

      .table-cell__content {
        height: $height !important;
        padding: 5px 12px;
        width: 100%;
        border: none;
        background: transparent;
        transition: all 0.1s;

        .table-cell__sort-icon {
          transition: all 0.15s;
          opacity: 0;
          margin-left: 7px;
        }

        &:hover {
          background: #eaedf3;
          transition: none;

          .table-cell__sort-icon {
            opacity: 1;
          }
        }

        &:active {
          background: darken(#eaedf3, 3%);
        }
      }
    }
  }

  &--left {
    .table-cell__content-wrapper {
      align-items: flex-start;

      .table-cell__content {
        justify-content: flex-start;
      }

      > * {
        text-align: left;
      }
    }
  }

  &--center {
    .table-cell__content-wrapper {
      align-items: center;

      .table-cell__content {
        justify-content: center;
      }

      > * {
        text-align: center;
      }
    }
  }

  &--right {
    .table-cell__content-wrapper {
      align-items: flex-end;

      .table-cell__content {
        justify-content: flex-end;
      }

      > * {
        text-align: right;
      }
    }
  }

  &--wrap {
    .table-cell__content-wrapper {
      height: unset;
      max-height: unset;

      .table-cell__content {
        padding: 10px 0;
        white-space: initial;
        line-height: 1.6;
        justify-content: flex-end;
        word-break: break-all;
      }
    }
  }
}
</style>
