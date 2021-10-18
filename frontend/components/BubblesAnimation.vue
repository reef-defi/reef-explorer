<template>
  <div class="bubbles">
    <div
      v-for="i in amount"
      :key="i"
      class="bubbles__bubble"
      :style="`
        animation-delay: ${i * 0.5 - 0.1}s;
        left: ${random(25, 75)}%;
        transform: scale(${random(0.75, 1.25)});
        opacity: ${random(0.5, 1)};
      `"
    />
  </div>
</template>

<script>
export default {
  props: {
    amount: { type: Number, default: 20 },
  },
  methods: {
    random(min, max) {
      return Math.random() * (max - min) + min
    },
  },
}
</script>

<style lang="scss">
.bubbles {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 100%;
  width: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;

  .bubbles__bubble {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgba(white, 0.25), inset 0 0 5px white,
      inset 0 2px 2px rgba(white, 0.25);
    animation: bubble 5s infinite ease-in-out both;

    @keyframes bubble {
      from {
        bottom: -50px;
      }

      to {
        bottom: calc(100% + 50px);
      }
    }
  }
}
</style>
