<template>
  <button
    :class="{ 'hamburger-btn--close': value }"
    class="hamburger-btn"
    title="Menu"
    @click="$emit('input', !value)"
  >
    <div v-for="n in 3" :key="n" />
  </button>
</template>

<script>
export default {
  model: {
    prop: 'value',
  },
  props: {
    value: { type: Boolean, default: false },
  },
}
</script>

<style lang="scss">
.hamburger-btn {
  display: none;
  position: relative;
  width: 63px;
  min-width: 63px;
  background: transparent;
  border: none;
  outline: none;
  margin: 0;
  padding: 20px;
  transition: all 0.2s;
  margin-right: -20px;

  div {
    position: relative;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, #a93185, #5531a9);
    border-radius: 999px;
    flex-grow: 1;
    transition: all 0.2s;
  }

  div:nth-child(1) {
    margin-top: 0;
  }

  div:nth-child(2) {
    margin-top: 5px;
  }

  div:nth-child(3) {
    margin-top: 5px;
    float: right;
  }

  &:hover {
    cursor: pointer;
  }

  &--close {
    div:nth-child(1) {
      margin-top: 0;
      width: 100%;
      transform: translateY(6px) rotate(45deg);
    }

    div:nth-child(2) {
      width: 0;
      margin-left: 50%;
    }

    div:nth-child(3) {
      transform: translateY(-6px) rotate(-45deg);
      width: 100%;
    }

    &:hover {
      cursor: pointer;

      div {
        &:nth-child(1) {
          margin-left: 0;
          width: 100%;
        }

        &:nth-child(3) {
          margin-right: 0;
          width: 100%;
        }
      }
    }
  }

  @media only screen and (max-width: 1220px) {
    display: block;
  }
}
</style>
