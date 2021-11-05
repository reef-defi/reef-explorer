<template>
  <div class="per-page">
    <b-button-group class="per-page__desktop">
      <b-button
        v-for="(option, index) in $options.paginationOptions"
        :key="index"
        variant="outline-secondary"
        class="per-page__option"
        :class="{ 'per-page__option--selected': value === option }"
        @click="setPageSize(option)"
      >
        {{ option }}
      </b-button>
    </b-button-group>

    <b-dropdown
      class="m-md-2 per-page__mobile"
      text="Page size"
      variant="outline-secondary"
    >
      <b-dropdown-item
        v-for="(option, index) in $options.paginationOptions"
        :key="index"
        @click="setPageSize(option)"
      >
        {{ option }}
      </b-dropdown-item>
    </b-dropdown>
  </div>
</template>

<script>
import { paginationOptions } from '@/frontend.config.js'

export default {
  paginationOptions,
  name: 'PerPage',
  model: {
    prop: 'value',
  },
  props: {
    value: { type: [String, Number], default: null },
  },
  created() {
    this.init()
  },
  methods: {
    init() {
      if (this.value) return

      const value = localStorage.paginationOptions || 20
      this.$emit('input', parseInt(value))
    },
    setPageSize(value) {
      value = parseInt(value)

      localStorage.paginationOptions = value
      this.$emit('input', value)
    },
  },
}
</script>

<style lang="scss">
.per-page {
  .per-page__desktop {
    margin-bottom: 0 !important;

    .per-page__option {
      border-color: #eaedf3;
      background: rgba(#eaedf3, 0.25);
      color: rgba(#3e3f42, 0.75);
      font-size: 13px;
      line-height: 16px;
      font-weight: 600;
      min-width: 31px;
      height: 31px;
      padding: 0 10px;
      transition: none;

      &--selected {
        background: linear-gradient(90deg, #a93185, #5531a9);
        background-clip: text;
        -webkit-text-fill-color: transparent;
        pointer-events: none;
      }

      &:hover {
        border-color: transparent !important;
        font-weight: 500;
        color: white;
        background: linear-gradient(150deg, #bb2b84, #5c1e8f);
        box-shadow: none;
      }

      &:active {
        background: linear-gradient(
          150deg,
          darken(#bb2b84, 5%),
          darken(#5c1e8f, 5%)
        );
        box-shadow: none;
      }

      &:focus {
        box-shadow: none !important;
      }
    }
  }

  .per-page__mobile {
    display: none;
    margin: 0;

    > .btn {
      border: none;
      box-shadow: inset 0 -5px 10px #eaedf3;
      background: rgba(#eaedf3, 0.25);
      color: rgba(#3e3f42, 0.85);
      font-size: 13px;
      line-height: 16px;
      font-weight: 600;
      min-width: 31px;
      height: 31px;
      padding: 0 12px;
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
      align-items: center;
      transition: none;

      &::after {
        margin-left: 7px;
      }

      &:hover {
        border-color: transparent !important;
        font-weight: 500;
        color: white;
        background: linear-gradient(150deg, #bb2b84, #5c1e8f);
        box-shadow: none;
      }

      &:active {
        font-weight: 500;
        color: white;
        background: linear-gradient(
          150deg,
          darken(#bb2b84, 5%),
          darken(#5c1e8f, 5%)
        );
        box-shadow: none;
      }
    }

    &.show {
      > .btn {
        border-color: transparent !important;
        font-weight: 500;
        color: white;
        background: linear-gradient(150deg, #bb2b84, #5c1e8f);
        box-shadow: none;
      }
    }
  }

  @media only screen and (max-width: 1200px) {
    .per-page__desktop {
      display: none;
    }

    .per-page__mobile {
      display: block;
    }
  }

  @media only screen and (max-width: 768px) {
    margin-top: 15px;
  }
}
</style>
