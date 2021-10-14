<template>
  <td class="table-cell" :class="`table-cell--${align}`">
    <div class="table-cell__content-wrapper">
      <component
        :is="getLink.url ? 'nuxt-link' : 'div'"
        :to="getLink.url ? getLink.url : null"
        class="table-cell__content"
        :class="{
          'table-cell__content--link': !!getLink.url,
          'table-cell__content--fill': getLink.fill !== false,
        }"
      >
        <slot />
      </component>
      <div v-if="label" class="table-cell__label">{{ label }}</div>
    </div>
  </td>
</template>

<script>
export default {
  name: 'Cell',
  props: {
    link: { type: [String, Object], default: '' },
    label: { type: String, default: '' },
    align: {
      type: String,
      default: 'left',
      validator(value) {
        return ['left', 'center', 'right'].includes(value)
      },
    },
  },
  computed: {
    getLink() {
      if (typeof this.link !== 'object') return { url: this.link }
      return this.link
    },
  },
}
</script>

<style lang="scss">
.table-cell {
  $height: 50px;

  padding: 5px !important;
  border-top: none !important;

  .table-cell__content-wrapper {
    padding: 0 4px;
    width: 100%;
    display: flex;
    flex-flow: column-reverse nowrap;
    justify-content: center;
    height: $height;
    min-height: $height;
    max-height: $height;

    .table-cell__label {
      white-space: nowrap;
      font-size: 12px;
      line-height: 1;
      margin-bottom: 4px;
      font-weight: 500;
      color: #6b6c6f;
    }

    .table-cell__content {
      white-space: nowrap;
      font-size: 13px;
      line-height: 15px;
      font-weight: 600;
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
            background: linear-gradient(90deg, #a93185, #5531a9);
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: #5531a9;
            box-shadow: inset 0 0 0 1px rgba(#8d1b70, 0.75);
          }

          &:hover {
            font-weight: 500;
            box-shadow: none;
            background: linear-gradient(130deg, #b01f6c, #3c127b);
            color: white;
          }
        }

        &.table-cell__content--fill {
          font-weight: 500;
          box-shadow: none;
          background: linear-gradient(130deg, #b01f6c, #3c127b);
          color: white;
        }

        & + .table-cell__label {
          margin-left: 4px;
        }
      }
    }
  }

  &--left {
    .table-cell__content-wrapper {
      align-items: flex-start;

      > * {
        text-align: left;
      }
    }
  }

  &--center {
    .table-cell__content-wrapper {
      align-items: center;

      > * {
        text-align: center;
      }
    }
  }

  &--right {
    .table-cell__content-wrapper {
      align-items: flex-end;

      > * {
        text-align: right;
      }
    }
  }
}
</style>
