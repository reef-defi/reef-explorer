<template>
  <div>
    <section>
      <b-container class="extrinsic-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!parsedExtrinsic">
          <h1 class="text-center">Extrinsic not found!</h1>
        </template>
        <template v-else>
          <div class="card mt-4 mb-3">
            <div class="card-body">
              <h4 class="text-center mb-4">
                Extrinsic {{ blockNumber }}-{{ extrinsicIndex }}
              </h4>
              <div class="table-responsive pb-4">
                <table class="table table-striped extrinsic-table">
                  <tbody>
                    <tr>
                      <td>Block number</td>
                      <td class="text-right">
                        <nuxt-link
                          v-b-tooltip.hover
                          :to="`/block?blockNumber=${blockNumber}`"
                          title="Check block information"
                        >
                          #{{ formatNumber(blockNumber) }}
                        </nuxt-link>
                      </td>
                    </tr>
                    <tr>
                      <td>Extrinsic index</td>
                      <td class="text-right">
                        {{ parsedExtrinsic.extrinsic_index }}
                      </td>
                    </tr>
                    <tr>
                      <td>Hash</td>
                      <td class="text-right">
                        {{ parsedExtrinsic.hash }}
                      </td>
                    </tr>
                    <tr>
                      <td>Signed?</td>
                      <td class="text-right">
                        {{ parsedExtrinsic.is_signed }}
                      </td>
                    </tr>
                    <tr>
                      <td>Signer</td>
                      <td class="text-right">
                        {{ parsedExtrinsic.signer }}
                      </td>
                    </tr>
                    <tr>
                      <td>Extrinsic</td>
                      <td class="text-right">
                        {{ parsedExtrinsic.section }} ➡
                        {{ parsedExtrinsic.method }}
                      </td>
                    </tr>
                    <tr>
                      <td>Doc</td>
                      <td class="text-right">
                        {{ parsedExtrinsic.doc }}
                      </td>
                    </tr>
                    <tr>
                      <td>Args</td>
                      <td class="text-right break-all">
                        {{ parsedExtrinsic.args }}
                      </td>
                    </tr>
                    <tr>
                      <td>Success</td>
                      <td class="text-right">
                        <font-awesome-icon
                          v-if="parsedExtrinsic.success"
                          icon="check-circle"
                          class="text-success"
                        />
                        <font-awesome-icon
                          v-else
                          icon="times"
                          class="text-danger"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
      </b-container>
    </section>
  </div>
</template>
<script>
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import gql from 'graphql-tag'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      blockNumber: this.$route.params.block,
      extrinsicIndex: this.$route.params.index,
      parsedExtrinsic: undefined,
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
      this.blockNumber = this.$route.params.block
      this.extrinsicIndex = this.$route.params.index
    },
  },
  methods: {
    getDateFromTimestamp(timestamp) {
      if (timestamp === 0) {
        return `--`
      }
      const newDate = new Date()
      newDate.setTime(timestamp * 1000)
      return newDate.toUTCString()
    },
  },
  apollo: {
    extrinsic: {
      query: gql`
        query extrinsic($block_number: bigint!, $extrinsic_index: Int!) {
          extrinsic(
            where: {
              block_number: { _eq: $block_number }
              extrinsic_index: { _eq: $extrinsic_index }
            }
          ) {
            block_number
            extrinsic_index
            is_signed
            signer
            section
            method
            args
            hash
            doc
            success
          }
        }
      `,
      skip() {
        return !this.blockNumber || !this.extrinsicIndex
      },
      variables() {
        return {
          block_number: this.blockNumber,
          extrinsic_index: this.extrinsicIndex,
        }
      },
      result({ data }) {
        this.parsedExtrinsic = data.extrinsic[0]
        this.loading = false
      },
    },
  },
}
</script>
