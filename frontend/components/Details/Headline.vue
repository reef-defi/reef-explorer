<template>
  <div class="details-headline" :class="{ 'details-headline--small': small }">
    <span>
      <slot />
    </span>
  </div>
</template>

<script>
export default {
  name: 'Headline',
  props: {
    small: { type: Boolean, default: false },
  },
}
</script>

<style lang="scss">
.details-headline {
  display: flex;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  text-align: center;

  span {
    display: inline-block;
    background: linear-gradient(90deg, #a93185, #5531a9);
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &--small {
    font-size: 20px;
    text-align: left;
    justify-content: flex-start;
  }

  & + * {
    margin-top: 25px;
  }
}

* + .details-headline {
  &--small {
    margin-top: 25px;
  }
}
</style>
