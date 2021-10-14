<template>
  <div>
    <section>
      <Search />
      <b-container class="main py-5 dashboard">
        <Chain />
        <LastBlocks />
        <LastTransfers />
        <div class="row" style="margin-top: 30px">
          <div class="col-md-6 mb-4">
            <LastExtrinsics />
          </div>
          <div class="col-md-6 mb-4">
            <LastEvents />
          </div>
        </div>
      </b-container>
    </section>
  </div>
</template>
<script>
import LastBlocks from '@/components/LastBlocks.vue'
import LastTransfers from '@/components/LastTransfers.vue'
import LastExtrinsics from '@/components/LastExtrinsics.vue'
import LastEvents from '@/components/LastEvents.vue'
import Chain from '@/components/Chain.vue'
import Search from '@/components/Search.vue'
import { network } from '@/frontend.config.js'

export default {
  components: {
    LastBlocks,
    LastTransfers,
    LastExtrinsics,
    LastEvents,
    Chain,
    Search,
  },
  data: () => {
    return {
      network,
    }
  },
  head() {
    return {
      title: 'Explorer | Reef Network',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Reef Chain is an EVM compatible chain for DeFi',
        },
      ],
    }
  },
}
</script>
