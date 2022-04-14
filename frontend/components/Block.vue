<template>
  <Card class="list-view block-details">
    <Headline>
      {{ $t('details.block.block') }} #
      {{ formatNumber(parsedBlock.id) }}
    </Headline>

    <Data>
      <Row>
        <Cell>{{ $t('details.block.timestamp') }}</Cell>
        <Cell class="list-view__age">
          <font-awesome-icon :icon="['far', 'clock']" />
          <span>{{ getAge(parsedBlock.timestamp) }}</span>
          <span>({{ formatTimestamp(parsedBlock.timestamp) }})</span>
        </Cell>
      </Row>

      <Row>
        <Cell>Status</Cell>
        <Cell>
          <font-awesome-icon
            :icon="parsedBlock.finalized ? 'check' : 'spinner'"
            :class="
              parsedBlock.finalized
                ? 'text-success'
                : 'list-view__processing-icon'
            "
            style="margin-right: 5px"
          />
          <span>{{ parsedBlock.finalized ? 'Finalized' : 'Processing' }}</span>
        </Cell>
      </Row>

      <Row>
        <Cell>{{ $t('details.block.hash') }}</Cell>
        <Cell>{{ parsedBlock.hash }}</Cell>
      </Row>

      <Row>
        <Cell>{{ $t('details.block.extrinsic_root') }}</Cell>
        <Cell>{{ parsedBlock.extrinsic_root }}</Cell>
      </Row>

      <Row>
        <Cell>{{ $t('details.block.parent_hash') }}</Cell>
        <Cell>
          <span v-if="parsedBlock.id === 0"> -- </span>
          <nuxt-link v-else :to="`/block?blockNumber=${parsedBlock.id - 1}`">
            {{ parsedBlock.parent_hash }}
          </nuxt-link>
        </Cell>
      </Row>

      <Row>
        <Cell>{{ $t('details.block.state_root') }}</Cell>
        <Cell>{{ parsedBlock.state_root }}</Cell>
      </Row>
    </Data>

    <Tabs v-model="tab" :options="tabs" />

    <Table v-if="tab === 'extrinsics'">
      <THead>
        <Cell>ID</Cell>
        <Cell>{{ $t('details.block.hash') }}</Cell>
        <Cell>{{ $t('details.block.signer') }}</Cell>
        <Cell>{{ $t('details.block.section') }}</Cell>
        <Cell>{{ $t('details.block.method') }}</Cell>
        <Cell>{{ $t('details.block.args') }}</Cell>
        <Cell align="center">{{ $t('details.block.success') }}</Cell>
      </THead>
      <Row
        v-for="(extrinsic, index) in parsedExtrinsics"
        :key="'extrinsic-' + index"
      >
        <Cell :link="`/extrinsic/${extrinsic.block_id}/${extrinsic.index}`"
          >{{ extrinsic.block_id }}-{{ extrinsic.index }}</Cell
        >
        <Cell>{{ shortHash(extrinsic.hash) }}</Cell>
        <Cell
          v-if="extrinsic.signer"
          :link="{ url: `/account/${extrinsic.signer}`, fill: false }"
          :title="$t('details.block.account_details')"
        >
          <ReefIdenticon
            :key="extrinsic.signer"
            :address="extrinsic.signer"
            :size="20"
          />
          <span>{{ shortAddress(extrinsic.signer) }}</span>
        </Cell>
        <Cell v-else />
        <Cell>{{ extrinsic.section }}</Cell>
        <Cell>{{ extrinsic.method }}</Cell>
        <Cell>{{ extrinsic.args }}</Cell>
        <Cell align="center">
          <font-awesome-icon
            v-if="extrinsic.success"
            icon="check"
            class="text-success"
          />
          <div v-else>
            <font-awesome-icon icon="times" class="text-danger" />
          </div>
        </Cell>
      </Row>
    </Table>

    <Table v-if="tab === 'events'">
      <THead>
        <Cell>{{ $t('details.block.section') }}</Cell>
        <Cell>{{ $t('details.block.method') }}</Cell>
        <Cell>{{ $t('details.block.phase') }}</Cell>
        <Cell>{{ $t('details.block.data') }}</Cell>
      </THead>

      <Row v-for="(event, index) in parsedEvents" :key="'event-' + index">
        <Cell>{{ event.section }}</Cell>
        <Cell>{{ event.method }}</Cell>
        <Cell>{{ event.phase }}</Cell>
        <Cell>
          <template
            v-if="event.section === `balances` && event.method === `Transfer`"
          >
            <ReefIdenticon
              :key="event.data[0]"
              :address="event.data[0]"
              :size="20"
            />
            <nuxt-link
              v-b-tooltip.hover
              :to="`/account/${event.data[0]}`"
              :title="$t('details.block.account_details')"
            >
              {{ shortAddress(event.data[0]) }}
            </nuxt-link>
            <font-awesome-icon icon="arrow-right" />
            <ReefIdenticon
              :key="event.data[1]"
              :address="event.data[1]"
              :size="20"
            />
            <nuxt-link
              v-b-tooltip.hover
              :to="`/account/${event.data[1]}`"
              :title="$t('details.block.account_details')"
            >
              {{ shortAddress(event.data[1]) }}
            </nuxt-link>
            <font-awesome-icon icon="arrow-right" />
            <span class="amount">
              {{ formatAmount(event.data[2]) }}
            </span>
          </template>
          <template v-else>
            {{ event.data }}
          </template>
        </Cell>
      </Row>
    </Table>
  </Card>
</template>

<script>
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  components: {
    ReefIdenticon,
  },
  mixins: [commonMixin],
  props: {
    parsedBlock: {
      type: Object,
      default: () => {},
    },
    parsedExtrinsics: {
      type: Array,
      default: () => [],
    },
    parsedEvents: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      tab: 'extrinsics',
    }
  },
  computed: {
    tabs() {
      return {
        extrinsics: this.$t('details.block.extrinsics'),
        events: this.$t('details.block.system_events'),
      }
    },
  },
}
</script>

<style lang="scss">
.block-details {
  .tabs {
    margin: 25px 0;
  }
}
</style>
