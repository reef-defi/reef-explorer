<template>
  <!-- Filter -->
  <b-row class="mb-4 search-section">
    <div class="container">
      <div v-if="label || $slots.label" class="search-section__label-section">
        <label v-if="label" class="search-section__label" v-html="label" />
        <slot name="label" />
      </div>
      <b-form-input
        id="searchInput"
        :value="value"
        class="search-section__input"
        type="search"
        :placeholder="placeholder"
        @keydown.native="$emit('keydown', $event)"
        @input="$emit('input', $event)"
      />
      <Chain v-if="showStats" />
      <slot name="bottom" />
    </div>

    <bubbles :amount="20" />
  </b-row>
</template>

<script>
import Chain from '@/components/Chain.vue'
import bubbles from '@/components/BubblesAnimation.vue'

export default {
  components: { bubbles, Chain },
  model: {
    prop: 'value',
  },
  props: {
    value: { default: '' },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    showStats: { type: Boolean, default: false },
  },
}
</script>

<style lang="scss">
.search-section {
  position: relative;
  padding: 70px 0 0 0;
  background: linear-gradient(130deg, #a51863, #3c127b);
  margin: 0 !important;

  .search-section__label-section {
    width: 100%;
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .search-section__label {
      font-size: 15px;
      font-weight: 500;
      color: white;
      line-height: 1;
      margin-bottom: 0;
    }
  }

  .search-section__input {
    padding: 25px 21px;
    border: none;
    transition: all 0.2s;
    position: relative;
    z-index: 2;
    margin-bottom: 70px;
    border-radius: 10px;

    &::placeholder {
      color: rgba(black, 0.75);
    }

    &:hover {
      transition: all 0.15s;
      box-shadow: 0 0 0 5px rgba(white, 0.25);
    }

    &:focus {
      transition: all 0.25s;
      background: white;
      box-shadow: 0 0 0 8px rgba(white, 0.25);
      border-radius: 25px;
      color: black;
    }
  }

  @media only screen and (max-width: 576px) {
    padding: 35px 10px 5px 10px;

    .search-section__label-section {
      flex-flow: column nowrap;
      justify-content: flex-start;
      align-items: flex-start;
    }

    .search-section__input {
      font-size: 14px;
      padding: 25px 20px;
      margin-bottom: 45px;
    }
  }
}
</style>
