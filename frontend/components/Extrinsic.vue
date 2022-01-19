<template>
  <Card v-if="extrinsic" class="list-view extrinsic-details">
    <Headline
      >Extrinsic {{ extrinsic.block_id }}-{{ extrinsic.index }}
    </Headline>

    <Data>
      <Row>
        <Cell>Block number</Cell>
        <Cell
          ><nuxt-link :to="`/block?blockNumber=${extrinsic.block_id}`">
            # {{ formatNumber(extrinsic.block_id) }}
          </nuxt-link>
        </Cell>
      </Row>

      <Row>
        <Cell>Timestamp</Cell>
        <Cell>{{
          getDateFromTimestamp(getUnixTimestamp(extrinsic.timestamp))
        }}</Cell>
      </Row>

      <Row>
        <Cell>Extrinsic index</Cell>
        <Cell>{{ extrinsic.index }}</Cell>
      </Row>

      <Row>
        <Cell>Extrinsic hash</Cell>
        <Cell>{{ extrinsic.hash }}</Cell>
      </Row>

      <Row>
        <Cell>Signed</Cell>
        <Cell>
          <font-awesome-icon
            v-if="extrinsic.type === 'signed'"
            icon="check"
            class="text-success"
          />
          <div v-else>
            <font-awesome-icon icon="times" class="text-danger" />
            <small>({{ extrinsic.type }})</small>
          </div>
        </Cell>
      </Row>

      <Row class="extrinsic-details__signer">
        <Cell>Signer</Cell>
        <Cell>
          <div v-if="extrinsic.signer">
            <ReefIdenticon
              :key="extrinsic.signer"
              :address="extrinsic.signer"
              :size="20"
            />
            <nuxt-link :to="`/account/${extrinsic.signer}`">
              {{ shortAddress(extrinsic.signer) }}
            </nuxt-link>
          </div>
        </Cell>
      </Row>

      <Row>
        <Cell>Section and method</Cell>
        <Cell>
          {{ extrinsic.section }} ➡
          {{ extrinsic.method }}
        </Cell>
      </Row>

      <Row class="extrinsic-details__documentation">
        <Cell>Documentation</Cell>
        <Cell>
          {{ extrinsic.docs }}
        </Cell>
      </Row>

      <Row class="extrinsic-details__arguments">
        <Cell>Arguments</Cell>
        <Cell>
          <pre>{{ JSON.stringify(extrinsic.args, null, 2) }}</pre>
        </Cell>
      </Row>

      <!-- <Row>
        <Cell>Weight</Cell>
        <Cell>
          <div v-if="extrinsic.fee_info">
            {{ formatNumber(JSON.parse(extrinsic.fee_info).weight) }}
          </div>
        </Cell>
      </Row>

      <Row>
        <Cell>Fee class</Cell>
        <Cell>
          <div v-if="extrinsic.fee_info">
            {{ JSON.parse(extrinsic.fee_info).class }}
          </div>
        </Cell>
      </Row>

      <Row>
        <Cell>Fee</Cell>
        <Cell>
          <div v-if="extrinsic.fee_info">
            {{ formatAmount(JSON.parse(extrinsic.fee_info).partialFee) }}
          </div>
        </Cell>
      </Row> -->

      <Row>
        <Cell>Description</Cell>
        <Cell>
          <font-awesome-icon
            v-if="extrinsic.type === 'signed'"
            icon="check"
            class="text-success"
          />
          <font-awesome-icon v-else icon="times" class="text-danger" />
          <template v-if="extrinsic.type !== 'signed'">
            <Promised
              :promise="
                getExtrinsicFailedFriendlyError(
                  extrinsic.block_id,
                  extrinsic.index,
                  $apollo.provider.defaultClient
                )
              "
            >
              <template #default="data">
                <span class="text-danger ml-2">{{ data }}</span>
              </template>
            </Promised>
          </template>
        </Cell>
      </Row>
    </Data>
    <extrinsic-events
      :extrinsic-id="parseInt(extrinsic.id)"
      :extrinsic-index="parseInt(extrinsic.index)"
    />
  </Card>
</template>

<script>
import { Promised } from 'vue-promised'
import commonMixin from '@/mixins/commonMixin.js'
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

<style lang="scss">
.extrinsic-details {
  .extrinsic-details__signer {
    > div {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
    }
  }

  .extrinsic-details__arguments {
    .table-cell__content {
      pre {
        font-size: 13px;
        line-height: 15px;
        font-weight: 500;
        color: #3e3f42;
        margin: 0;
      }
    }
  }

  .extrinsic-details__documentation,
  .extrinsic-details__arguments {
    .table-cell:last-child {
      .table-cell__content-wrapper {
        height: unset;
        max-height: unset;

        .table-cell__content {
          padding: 15px 0;
          white-space: initial;
          line-height: 1.6;
        }
      }
    }
  }
}
</style>
