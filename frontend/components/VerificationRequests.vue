<template>
  <div class="verification-requests">
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="requests">
        <template #cell(contract_id)="data">
          <p class="mb-0">
            {{ shortAddress(data.item.contract_id) }}
          </p>
        </template>
        <template #cell(timestamp)="data">
          <p class="mb-0">
            {{ getDateFromTimestamp(data.item.timestamp / 1000) }}
          </p>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  props: {
    requests: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      fields: [
        {
          key: 'timestamp',
          label: 'Date/time',
        },
        {
          key: 'contract_id',
          label: 'Contract',
        },
        {
          key: 'filename',
          label: 'Filename',
        },
        {
          key: 'compiler_version',
          label: 'Compiler',
        },

        {
          key: 'optimization',
          label: 'Optimization',
        },
        {
          key: 'runs',
          label: 'Runs',
        },
        {
          key: 'target',
          label: 'Target',
        },
        {
          key: 'status',
          label: 'Status',
        },
        {
          key: 'error_type',
          label: 'Error type',
        },
      ],
    }
  },
}
</script>

<style>
.verification-requests .table th,
.verification-requests .table td {
  padding: 0.45rem;
}
.verification-requests .table thead th {
  border-bottom: 0;
}
.verification-requests .identicon {
  display: inline-block;
  margin: 0 0.2rem 0 0;
  cursor: copy;
}
</style>
