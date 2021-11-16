<template>
  <div>
    <section>
      <b-container class="contract-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!contract">
          <h1 class="text-center">Contract not found!</h1>
        </template>
        <Card v-else class="contract-details">
          <div class="contract-details__identicon">
            <eth-identicon :address="contractId" :size="80" />
          </div>

          <Headline>{{ contract.name || shortHash(contractId) }}</Headline>

          <h4 class="text-center mb-4">
            <p class="mt-3">
              <b-badge
                v-if="contract.is_erc20"
                :to="`/token/${contract.contract_id}`"
                class="ml-2"
                variant="info"
              >
                ERC-20 token
              </b-badge>
              <b-badge v-if="contract.verified" class="ml-2" variant="success">
                Verified source
                <font-awesome-icon icon="check" />
              </b-badge>
              <b-badge v-else class="ml-2" variant="danger">
                Not verified source
                <font-awesome-icon icon="times" />
              </b-badge>
            </p>
          </h4>

          <Tabs v-model="tab" :options="tabs" />

          <!-- General -->

          <Data v-if="tab === 'general'">
            <Row>
              <Cell>Contract address</Cell>
              <Cell>
                <eth-identicon :address="contractId" :size="20" />
                <span>{{ contractId }}</span>
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.contract.verified') }}</Cell>
              <Cell>
                <font-awesome-icon
                  :icon="contract.verified ? 'check' : 'times'"
                  :class="contract.verified ? 'text-success' : 'text-danger'"
                />
              </Cell>
            </Row>

            <Row>
              <Cell>Created at block</Cell>
              <Cell>
                <nuxt-link :to="`/block?blockNumber=${contract.block_height}`">
                  # {{ formatNumber(contract.block_height) }}
                </nuxt-link>
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.contract.signer') }}</Cell>
              <Cell>
                <ReefIdenticon
                  v-if="contract.owner"
                  :key="contract.owner"
                  class="contract-details__account-identicon"
                  :address="contract.owner"
                  :size="20"
                />
                <nuxt-link
                  v-if="contract.owner"
                  :to="`/account/${contract.owner}`"
                >
                  {{ shortAddress(contract.owner) }}
                </nuxt-link>
              </Cell>
            </Row>

            <Row v-if="contract.value">
              <Cell>{{ $t('details.contract.value') }}</Cell>
              <Cell>{{ contract.value }}</Cell>
            </Row>

            <Row v-if="contract.gas_limit">
              <Cell>{{ $t('details.contract.gas_limit') }}</Cell>
              <Cell>{{ contract.gas_limit }}</Cell>
            </Row>

            <Row v-if="contract.storage_limit">
              <Cell>{{ $t('details.contract.storage_limit') }}</Cell>
              <Cell>{{ contract.storage_limit }}</Cell>
            </Row>

            <!-- <Row v-if="contract.bytecode">
              <Cell>{{ $t('details.contract.bytecode') }}</Cell>
              <Cell wrap>{{ contract.bytecode }}</Cell>
            </Row> -->

            <Row v-if="contract.deployment_bytecode">
              <Cell>{{ $t('details.contract.deployment_bytecode') }}</Cell>
              <Cell wrap>{{ contract.deployment_bytecode }}</Cell>
            </Row>

            <Row v-if="contract.arguments">
              <Cell>{{ $t('details.contract.arguments') }}</Cell>
              <Cell wrap>{{ contract.arguments }}</Cell>
            </Row>

            <Row v-if="decodedArguments">
              <Cell>{{ $t('details.contract.decoded_arguments') }}</Cell>
              <Cell wrap>{{ decodedArguments }}</Cell>
            </Row>

            <Row v-if="contract.metadata">
              <Cell>{{ $t('details.contract.metadata') }}</Cell>
              <Cell wrap>{{ contract.metadata }}</Cell>
            </Row>

            <Row v-if="decodedMetadata">
              <Cell>{{ $t('details.contract.decoded_metadata') }}</Cell>
              <Cell class="table-json" wrap>
                <vue-json-pretty
                  :data="JSON.parse(JSON.stringify(decodedMetadata))"
                  :deep="2"
                />
              </Cell>
            </Row>

            <Promised :promise="getIpfsHash()">
              <template #default="data">
                <Row>
                  <Cell>{{ $t('details.contract.ipfs_hash') }}</Cell>
                  <Cell>
                    <a :href="`https://ipfs.io/ipfs/${data}`" target="_blank">
                      {{ data }}
                    </a>
                  </Cell>
                </Row>
              </template>
            </Promised>

            <Promised :promise="getBzzr1Hash()">
              <template #default="data">
                <Row>
                  <Cell>{{ $t('details.contract.bzzr1_hash') }}</Cell>
                  <Cell>{{ data }}</Cell>
                </Row>
              </template>
            </Promised>

            <Row v-if="decodedSolcVersion">
              <Cell>{{ $t('details.contract.deployment_solc_version') }}</Cell>
              <Cell wrap>{{ decodedSolcVersion }}</Cell>
            </Row>
          </Data>

          <!-- Developer -->

          <Data v-if="tab === 'developer'">
            <Row>
              <Cell>{{ $t('details.contract.compiler_version') }}</Cell>
              <Cell>{{ contract.compiler_version }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.contract.optimization') }}</Cell>
              <Cell>
                <font-awesome-icon
                  :icon="contract.optimization ? 'check' : 'times'"
                  :class="
                    contract.optimization ? 'text-success' : 'text-danger'
                  "
                />
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.contract.runs') }}</Cell>
              <Cell>{{ contract.runs }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.contract.target') }}</Cell>
              <Cell>{{ contract.target }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.contract.license') }}</Cell>
              <Cell>{{ contract.licence }}</Cell>
            </Row>
          </Data>

          <!-- Verified Source -->

          <pre v-if="tab === 'source'" class="contract-details__source">{{
            contract.source
          }}</pre>

          <vue-json-pretty v-if="tab === 'abi'" :data="contract.abi" />

          <ContractTransactions
            v-if="tab === 'transactions'"
            :contract-id="contractId"
          />

          <ContractExecute
            v-if="tab === 'execute'"
            :contract-id="contractId"
            :contract-name="contract.name"
            :contract-abi="contract.abi"
          />
        </Card>
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import VueJsonPretty from 'vue-json-pretty'
import { ethers } from 'ethers'
import cbor from 'cbor'
import Hash from 'ipfs-only-hash'
import { Promised } from 'vue-promised'
import ContractTransactions from '../../components/ContractTransactions.vue'
import ContractExecute from '../../components/ContractExecute.vue'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'

export default {
  components: {
    ReefIdenticon,
    Loading,
    VueJsonPretty,
    ContractTransactions,
    ContractExecute,
    Promised,
  },
  mixins: [commonMixin],
  data() {
    return {
      network,
      loading: true,
      contractId: this.$route.params.id,
      contract: undefined,
      tab: 'general',
    }
  },
  computed: {
    tabs() {
      if (this.contract?.verified) {
        return {
          general: 'General',
          developer: 'Developer',
          source: 'Verified Source',
          abi: 'ABI',
          transactions: 'Transactions',
          execute: 'Execute',
        }
      }

      return {
        general: 'General',
        transactions: 'Transactions',
      }
    },
    decodedArguments() {
      if (this.contract.abi && this.contract.bytecode_arguments) {
        // get constructor arguments types array
        const constructorTypes = this.contract.abi
          .find(({ type }) => type === 'constructor')
          .inputs.map((input) => input.type)

        // decode constructor arguments
        const abiCoder = new ethers.utils.AbiCoder()
        const decoded = abiCoder.decode(
          constructorTypes,
          '0x' + this.contract.bytecode_arguments
        )
        return decoded.toString()
      }
      return null
    },
    decodedMetadata() {
      if (this.contract.bytecode_metadata) {
        let encodedMetadata = ''
        const endSeq1 = '0033'
        const endSeqIndex1 = this.contract.bytecode_metadata.indexOf(endSeq1)
        const endSeq2 = '0032'
        const endSeqIndex2 = this.contract.bytecode_metadata.indexOf(endSeq2)
        if (this.contract.bytecode_metadata.includes(endSeq1)) {
          encodedMetadata = this.contract.bytecode_metadata.slice(
            0,
            endSeqIndex1
          )
        }
        if (this.contract.bytecode_metadata.includes(endSeq2)) {
          encodedMetadata = this.contract.bytecode_metadata.slice(
            0,
            endSeqIndex2
          )
        }
        // metadata is CBOR encoded (http://cbor.me/)
        const decodedMetadata = cbor.decode(encodedMetadata)
        return decodedMetadata
      }
      return null
    },
    decodedSolcVersion() {
      if (this.decodedMetadata) {
        const solcVersionArray = this.decodedMetadata?.solc || null
        return `${solcVersionArray[0]}.${solcVersionArray[1]}.${solcVersionArray[2]}`
      }
      return null
    },
  },
  watch: {
    $route() {
      this.contractId = this.$route.params.id
    },
  },
  apollo: {
    $subscribe: {
      contract: {
        query: gql`
          subscription contract($contract_id: String!) {
            contract(where: { contract_id: { _eq: $contract_id } }) {
              contract_id
              name
              deployment_bytecode
              bytecode_metadata
              bytecode_arguments
              arguments
              value
              gas_limit
              storage_limit
              owner
              block_height
              verified
              source
              compiler_version
              compiler_data
              optimization
              runs
              target
              timestamp
            }
          }
        `,
        variables() {
          return {
            contract_id: this.contractId,
          }
        },
        result({ data }) {
          if (data.contract[0]) {
            this.contract = data.contract[0]
            this.contract.abi = data.contract[0].compiler_data.flat()
          }
          this.loading = false
        },
      },
    },
  },
  methods: {
    async getIpfsHash() {
      // decode hash from uint8 array
      return await Hash.of(this.decodedMetadata?.ipfs)
    },
    async getBzzr1Hash() {
      // decode hash from uint8 array
      return await Hash.of(this.decodedMetadata?.bzzr1)
    },
  },
}
</script>

<style lang="scss">
.contract-details {
  .contract-details__source {
    background: rgba(#eaedf3, 0.5);
  }

  .details-headline {
    & + * {
      margin-top: 15px;
    }
  }

  .contract-details__identicon {
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
    box-shadow: 0 0 10px -10px rgba(#0f233f, 0.5),
      0 5px 15px -5px rgba(#0f233f, 0.25);
    border-radius: 50%;
    height: 110px;
    width: 110px;
    margin: 0 auto 15px auto;
    overflow: hidden;

    img {
      border-radius: 50%;
    }
  }

  .contract-details__account-identicon {
    display: flex !important;
  }

  .tabs {
    margin: 25px 0;
  }

  .data {
    .table-cell {
      & + .table-cell {
        .table-cell__content-wrapper {
          align-items: flex-end;

          .table-cell__content {
            text-align: right;
          }

          > * {
            text-align: right;
          }
        }
      }

      &.table-json {
        .table-cell__content-wrapper {
          align-items: flex-start;

          .table-cell__content {
            width: 100%;
            display: block;
            text-align: left;
            word-break: initial;
          }
        }
      }
    }
  }
}
</style>
