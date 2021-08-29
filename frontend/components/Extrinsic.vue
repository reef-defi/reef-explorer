<template>
  <div v-if="extrinsic" class="table-responsive pb-4">
    <table class="table table-striped extrinsic-table">
      <tbody>
        <tr>
          <td>Block number</td>
          <td>
            <nuxt-link :to="`/block?blockNumber=${extrinsic.block_number}`">
              #{{ formatNumber(extrinsic.block_number) }}
            </nuxt-link>
          </td>
        </tr>
        <tr>
          <td>Timestamp</td>
          <td>
            <p class="mb-0">
              {{ getDateFromTimestamp(extrinsic.timestamp) }}
            </p>
          </td>
        </tr>
        <tr>
          <td>Extrinsic index</td>
          <td>
            {{ extrinsic.extrinsic_index }}
          </td>
        </tr>
        <tr>
          <td>Extrinsic hash</td>
          <td>
            {{ extrinsic.hash }}
          </td>
        </tr>
        <tr>
          <td>Signed?</td>
          <td>
            <font-awesome-icon
              v-if="extrinsic.is_signed"
              icon="check"
              class="text-success"
            />
            <font-awesome-icon v-else icon="times" class="text-danger" />
          </td>
        </tr>
        <tr>
          <td>Signer</td>
          <td>
            <div v-if="extrinsic.signer">
              <Identicon
                :key="extrinsic.signer"
                :address="extrinsic.signer"
                :size="20"
              />
              <nuxt-link :to="`/account/${extrinsic.signer}`">
                {{ shortAddress(extrinsic.signer) }}
              </nuxt-link>
            </div>
          </td>
        </tr>
        <tr>
          <td>Section and method</td>
          <td>
            {{ extrinsic.section }} ➡
            {{ extrinsic.method }}
          </td>
        </tr>
        <tr>
          <td>Documentation</td>
          <td>
            {{ extrinsic.doc }}
          </td>
        </tr>
        <tr>
          <td>Arguments</td>
          <td>
            <pre class="mb-0">{{
              JSON.stringify(JSON.parse(extrinsic.args), null, 2)
            }}</pre>
          </td>
        </tr>
        <tr>
          <td>Weight</td>
          <td>
            <div v-if="extrinsic.fee_info">
              {{ formatNumber(JSON.parse(extrinsic.fee_info).weight) }}
            </div>
          </td>
        </tr>
        <tr>
          <td>Fee class</td>
          <td>
            <div v-if="extrinsic.fee_info">
              {{ JSON.parse(extrinsic.fee_info).class }}
            </div>
          </td>
        </tr>
        <tr>
          <td>Fee</td>
          <td class="amount">
            <div v-if="extrinsic.fee_info">
              {{ formatAmount(JSON.parse(extrinsic.fee_info).partialFee) }}
            </div>
          </td>
        </tr>
        <tr>
          <td>Success</td>
          <td>
            <font-awesome-icon
              v-if="extrinsic.success"
              icon="check"
              class="text-success"
            />
            <font-awesome-icon v-else icon="times" class="text-danger" />
            <template v-if="!extrinsic.success">
              <Promised
                :promise="
                  getExtrinsicFailedFriendlyError(
                    extrinsic.block_number,
                    extrinsic.extrinsic_index,
                    $apollo.provider.defaultClient
                  )
                "
              >
                <template #default="data"
                  ><span class="text-danger ml-2">{{ data }}</span></template
                >
              </Promised>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import { Promised } from 'vue-promised'
export default {
  components: { Promised },
  mixins: [commonMixin],
  props: {
    extrinsic: {
      type: Object,
      default: undefined,
    },
  },
}
</script>
