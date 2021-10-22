<template>
  <div v-if="lastBlock" class="chain-info">
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">{{ $t('components.network.last_block') }}</h4>
        <nuxt-link
          v-b-tooltip.hover
          :to="`/block?blockNumber=${lastBlock}`"
          title="Click to see block info!"
        >
          <h6 class="d-inline-block">#{{ formatNumber(lastBlock) }}</h6>
        </nuxt-link>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">
          {{ $t('components.network.last_block_finalized') }}
        </h4>
        <nuxt-link
          v-b-tooltip.hover
          :to="`/block?blockNumber=${lastFinalizedBlock}`"
          title="Click to see block info!"
        >
          <h6 class="d-inline-block">
            #{{ formatNumber(lastFinalizedBlock) }}
          </h6>
        </nuxt-link>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">Total extrinsics</h4>
        <nuxt-link
          v-b-tooltip.hover
          to="/extrinsics"
          title="Click to see extrinsics!"
        >
          <h6 class="d-inline-block">
            {{ formatNumber(totalExtrinsics) }}
          </h6>
        </nuxt-link>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">Total events</h4>
        <nuxt-link v-b-tooltip.hover to="/events" title="Click to see events!">
          <h6 class="d-inline-block">{{ formatNumber(totalEvents) }}</h6>
        </nuxt-link>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">{{ $t('components.network.accounts') }}</h4>
        <nuxt-link
          v-b-tooltip.hover
          to="/accounts"
          title="Click to see accounts!"
        >
          <h6 class="d-inline-block">
            {{ formatNumber(totalAccounts) }}
          </h6>
        </nuxt-link>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">
          {{ $t('components.network.transfers') }}
        </h4>
        <nuxt-link
          v-b-tooltip.hover
          to="/transfers"
          title="Click to see tranfers!"
        >
          <h6 class="d-inline-block">{{ formatNumber(totalTransfers) }}</h6>
        </nuxt-link>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">
          {{ $t('components.network.contracts') }}
        </h4>
        <nuxt-link
          v-b-tooltip.hover
          to="/contracts"
          title="Click to see contracts!"
        >
          <h6 class="d-inline-block">
            {{ formatNumber(totalContracts) }}
          </h6>
        </nuxt-link>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">
          {{ $t('components.network.total_issuance') }}
        </h4>
        <h6 class="d-inline-block">
          {{ formatAmount(totalIssuance) }}
        </h6>
      </div>
    </div>
  </div>
</template>

<script>
import { BigNumber } from 'bignumber.js'
import { gql } from 'graphql-tag'
import commonMixin from '../mixins/commonMixin.js'
import { network } from '../frontend.config.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      network,
      lastBlock: 0,
      lastFinalizedBlock: 0,
      totalExtrinsics: 0,
      totalEvents: 0,
      totalAccounts: 0,
      totalContracts: 0,
      totalIssuance: 0,
      totalTransfers: 0,
    }
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription blocks {
            block(order_by: { block_number: desc }, where: {}, limit: 1) {
              block_number
              total_issuance
            }
          }
        `,
        result({ data }) {
          this.lastBlock = data.block[0].block_number
          this.totalIssuance = data.block[0].total_issuance
        },
      },
      finalized: {
        query: gql`
          subscription blocks {
            block(
              limit: 1
              order_by: { block_number: desc }
              where: { finalized: { _eq: true } }
            ) {
              block_number
            }
          }
        `,
        result({ data }) {
          this.lastFinalizedBlock = data.block[0].block_number
        },
      },
      total: {
        query: gql`
          subscription total {
            total {
              name
              count
            }
          }
        `,
        result({ data }) {
          this.totalExtrinsics =
            data.total.find((row) => row.name === 'extrinsics').count || 0
          this.totalTransfers =
            data.total.find((row) => row.name === 'transfers').count || 0
          this.totalEvents =
            data.total.find((row) => row.name === 'events').count || 0
          this.totalContracts =
            data.total.find((row) => row.name === 'contracts').count || 0
        },
      },
      accounts: {
        query: gql`
          subscription account_aggregate {
            account_aggregate {
              aggregate {
                count
              }
            }
          }
        `,
        result({ data }) {
          this.totalAccounts = parseInt(data.account_aggregate.aggregate.count)
        },
      },
    },
  },
  methods: {
    formatAmount(amount) {
      return `${new BigNumber(amount)
        .div(new BigNumber(10).pow(network.tokenDecimals))
        .toFixed(0)
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')} ${network.tokenSymbol}`
    },
  },
}
</script>

<style lang="scss">
.chain-info {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: flex-end;
  padding-bottom: 30px;
  position: relative;
  z-index: 2;

  .card {
    border: none;
    box-shadow: none;
    background: transparent;

    .card-body {
      padding: 0;
    }

    h4 {
      font-size: 13px;
      line-height: 15px;
      color: #ff51ca;
      margin-bottom: 5px !important;
      text-shadow: 1px 1px 1px rgba(black, 0.25);
      white-space: nowrap;
      text-overflow: ellipsis;
      max-width: 100%;
      overflow: hidden;
    }

    h6 {
      font-size: 17px;
      line-height: 19px;
      font-weight: 500;
      margin-bottom: 0 !important;
      color: white;
      text-shadow: 1px 1px 1px rgba(black, 0.25);
    }

    a {
      &:hover {
        h6 {
          text-decoration: underline;
        }
      }
    }

    & + .card {
      margin-left: 50px;
    }
  }

  @media only screen and (max-width: 1199.98px) {
    flex-wrap: wrap;
    margin-top: -20px;

    .card {
      width: 25%;
      margin-top: 20px;

      & + .card {
        margin-left: 0;
      }
    }
  }

  @media only screen and (max-width: 768px) {
    .card {
      width: 33.33%;
    }
  }

  @media only screen and (max-width: 576px) {
    .card {
      width: 50%;
    }
  }
}
</style>
