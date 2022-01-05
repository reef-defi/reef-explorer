<template>
  <div class="table__wrapper">
    <table class="table">
      <slot />
    </table>
  </div>
</template>

<script>
export default {
  name: 'Table',
}
</script>

<style lang="scss">
.table__wrapper {
  width: 100%;
  overflow: auto;

  .table {
    width: 100%;
    margin-bottom: 0;
  }
}
</style>
