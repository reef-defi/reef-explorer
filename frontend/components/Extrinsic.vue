<template>
  <Card v-if="extrinsic" class="list-view extrinsic-details">
    <Headline
      >Extrinsic {{ extrinsic.block_id }}-{{ extrinsic.index }}
    </Headline>

    <div v-if="extrinsic.error_message" class="unverified-section">
      <div class="unverified-badge">
        <font-awesome-icon icon="exclamation-triangle" />
        <div class="unverified-badge__content">
          <div class="unverified-badge__text">Transaction failed</div>
        </div>
      </div>
    </div>

    <Data>
      <Row v-if="!!extrinsic.error_message" class="extrinsic-details__error">
        <Cell>Error Description</Cell>
        <Cell>
          {{ extrinsic.error_message }}
        </Cell>
      </Row>

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
        <Cell class="list-view__age">
          <font-awesome-icon :icon="['far', 'clock']" />
          <span>{{ getAge(getUnixTimestamp(extrinsic.timestamp)) }}</span>
          <span>({{ formatTimestamp(extrinsic.timestamp) }})</span>
        </Cell>
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
            icon="lock"
            class="text-success"
          />
          <div v-else>
            <font-awesome-icon icon="lock-open" class="text-gray" />
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
        <Cell wrap>
          <div>{{ extrinsic.docs }}</div>
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
      </Row> -->

      <Row v-if="extrinsic.signed_data !== null">
        <Cell>Fee</Cell>
        <Cell>
          <div>
            {{
              formatAmount(parseInt(extrinsic.signed_data.fee.partialFee, 16))
            }}
          </div>
        </Cell>
      </Row>

      <Row v-if="extrinsic.signed_data !== null">
        <Cell>Weight</Cell>
        <Cell>
          <div>
            {{ formatAmount(parseInt(extrinsic.signed_data.fee.weight, 16)) }}
          </div>
        </Cell>
      </Row>
    </Data>
    <extrinsic-events :extrinsic-id="parseInt(extrinsic.id)" />
  </Card>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
export default {
  components: {},
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
  .unverified-section {
    margin-top: 20px;
    margin-bottom: 30px;

    svg {
      margin-right: 5px;
      transform: translateY(-1px);
    }
  }

  .extrinsic-details__error {
    .table-cell__content {
      color: #dc3545 !important;
    }
  }

  .extrinsic-details__signer {
    > div {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
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
          line-height: 1.6;

          div {
            white-space: pre-wrap;
            word-break: break-word;
          }

          pre {
            white-space: pre-wrap;
            word-break: break-word;
            font-size: 13px;
            line-height: 15px;
            font-weight: 500;
            color: #3e3f42;
            margin: 0;
          }
        }
      }
    }
  }
}
</style>
