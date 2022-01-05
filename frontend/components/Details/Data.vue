<template>
  <div class="data">
    <Table>
      <slot />
    </Table>
  </div>
</template>

<script>
import Table from '@/components/Table/Table'

export default {
  name: 'Data',
  components: { Table },
}
</script>

<style lang="scss">
.data {
  width: 100%;

  .table-row {
    &:nth-child(even) {
      background: transparent;
    }

    &:nth-child(odd) {
      background: rgba(#eaedf3, 0.5);
    }

    .table-cell {
      &:first-child {
        .table-cell__content {
          font-weight: 600;
        }
      }

      .identicon,
      .eth-identicon {
        margin-left: 0;
      }
    }
  }

  .table-cell {
    &.table-json {
      .table-cell__content-wrapper {
        align-items: flex-start;

        .table-cell__content {
          width: 100%;
          display: block;
          text-align: left;
          word-break: initial;
        }
      }
    }
  }
}
</style>
