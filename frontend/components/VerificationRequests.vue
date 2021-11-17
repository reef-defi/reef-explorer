<template>
  <div>
    <Table>
      <THead>
        <Cell>Date/Time</Cell>
        <Cell>Contract</Cell>
        <Cell>Filename</Cell>
        <Cell>Compiler</Cell>
        <Cell>Optimization</Cell>
        <Cell>Runs</Cell>
        <Cell>Target</Cell>
        <Cell>Status</Cell>
        <Cell>Error Type</Cell>
      </THead>

      <Row v-for="(item, index) in requests" :key="index">
        <Cell>{{ getDateFromTimestamp(item.timestamp / 1000) }}</Cell>
        <Cell>{{ shortAddress(item.contract_id) }}</Cell>
        <Cell>{{ item.filename }}</Cell>
        <Cell>{{ item.compiler_version }}</Cell>
        <Cell>{{ item.optimization }}</Cell>
        <Cell>{{ item.runs }}</Cell>
        <Cell>{{ item.target }}</Cell>
        <Cell>{{ item.status }}</Cell>
        <Cell>{{ item.error_type }}</Cell>
      </Row>
    </Table>
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
}
</script>
