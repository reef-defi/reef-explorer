<template>
  <tr class="table-row">
    <slot />
  </tr>
</template>

<script>
export default {
  name: 'Row',
}
</script>

<style lang="scss">
.table-row {
  border: none;

  &:nth-child(even) {
    background: rgba(#eaedf3, 0.5);
  }

  &:hover {
    background: #eaedf3;
  }
}
</style>
