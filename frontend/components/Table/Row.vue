<template>
  <tr class="table-row" :class="{ 'table-row--container': container }">
    <slot />
  </tr>
</template>

<script>
export default {
  name: 'Row',
  props: {
    container: { type: Boolean, default: false },
  },
}
</script>

<style lang="scss">
.table-row {
  border: none;

  &--container {
    display: table-row-group;
  }

  &:nth-child(even) {
    background: rgba(#eaedf3, 0.5);
  }

  &:hover {
    background: #eaedf3;
  }
}
</style>
