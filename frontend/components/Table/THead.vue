<template>
  <thead class="table-head">
    <slot />
  </thead>
</template>

<script>
export default {
  name: 'THead',
}
</script>

<style lang="scss">
.table-head {
  .table-cell {
    $height: 30px;

    .table-cell__content-wrapper {
      height: $height;
      min-height: $height;
      max-height: $height;

      .table-cell__content {
        font-weight: 600;
      }
    }
  }
}
</style>
