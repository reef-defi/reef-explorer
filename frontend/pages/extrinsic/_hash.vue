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
                Extrinsic {{ parsedExtrinsic.block_number }}-{{
                  parsedExtrinsic.extrinsic_index
                }}
              </h4>
              <div class="table-responsive pb-4">
                <table class="table table-striped extrinsic-table">
                  <tbody>
                    <tr>
                      <td>Block number</td>
                      <td class="text-right">
                        <nuxt-link
                          v-b-tooltip.hover
                          :to="`/block?blockNumber=${parsedExtrinsic.block_number}`"
                          title="Check block information"
                        >
                          #{{ formatNumber(parsedExtrinsic.block_number) }}
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
                      <td>Extrinsic hash</td>
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
                        <div v-if="parsedExtrinsic.signer">
                          <Identicon
                            :key="parsedExtrinsic.signer"
                            :address="parsedExtrinsic.signer"
                            :size="20"
                          />
                          <nuxt-link
                            v-b-tooltip.hover
                            :to="`/account/${parsedExtrinsic.signer}`"
                            :title="$t('details.block.account_details')"
                          >
                            {{ shortAddress(parsedExtrinsic.signer) }}
                          </nuxt-link>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Section and method</td>
                      <td class="text-right">
                        {{ parsedExtrinsic.section }} ➡
                        {{ parsedExtrinsic.method }}
                      </td>
                    </tr>
                    <tr>
                      <td>Documentation</td>
                      <td class="text-right">
                        {{ parsedExtrinsic.doc }}
                      </td>
                    </tr>
                    <tr>
                      <td>Arguments</td>
                      <td class="text-right">
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
                          icon="check-circle"
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
      blockHash: this.$route.params.hash,
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
      this.blockHash = this.$route.params.hash
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
        query extrinsic($hash: String!) {
          extrinsic(where: { hash: { _eq: $hash } }) {
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
        return !this.blockHash
      },
      variables() {
        return {
          hash: this.blockHash,
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
