<template>
  <div class="details-headline">
    <span>
      <slot />
    </span>
  </div>
</template>

<script>
export default {
  name: 'Headline',
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

  & + * {
    margin-top: 25px;
  }
}
</style>
