<template>
  <div class="card-content">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'Card',
}
</script>

<style lang="scss">
.card-content {
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 0 10px -10px rgba(#0f233f, 0.5),
    0 5px 15px -5px rgba(#0f233f, 0.25);
  padding: 25px;

  @media only screen and (max-width: 768px) {
    padding: 15px;
    padding-top: 25px;
  }
}
</style>
