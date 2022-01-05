<template>
  <div>
    <section>
      <b-container class="transfer-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!transfer" text="Transfer not found" />
        <Transfer v-else :transfer="transfer" />
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      hash: this.$route.params.hash,
      transfer: undefined,
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
  watch: {
    $route() {
      this.hash = this.$route.params.hash
    },
  },
  apollo: {
    extrinsic: {
      query: gql`
        query extrinsic($hash: String!) {
          extrinsic(where: { hash: { _eq: $hash } }) {
            block_id
            index
            type
            signer
            signed_data
            section
            method
            args
            hash
            docs
            timestamp
          }
        }
      `,
      skip() {
        return !this.hash
      },
      variables() {
        return {
          hash: this.hash,
        }
      },
      result({ data }) {
        if (data && data.extrinsic) {
          this.transfer = data.extrinsic[0]
        }
        this.loading = false
      },
    },
  },
}
</script>
