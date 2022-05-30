<template>
  <div>
    <section>
      <b-container class="contract-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!contract" text="Contract not found" />
        <Card v-else class="contract-details">
          <div class="contract-details__identicon">
            <eth-identicon :address="address" :size="80" />
          </div>

          <Headline>{{
            contract.verified_contract
              ? contract.verified_contract.name
              : '' || shortHash(address)
          }}</Headline>

          <h4 class="text-center mb-4">
            <p class="mt-3">
              <b-badge
                v-if="
                  contract.verified_contract &&
                  contract.verified_contract.type !== 'other'
                "
                :to="`/token/${contract.address}`"
                class="ml-2"
                variant="info"
              >
                {{ contract.verified_contract.type.replace('ERC', 'ERC-') }}
              </b-badge>
              <b-badge
                v-if="contract.verified_contract"
                class="ml-2"
                variant="success"
              >
                Verified source
                <font-awesome-icon icon="check" />
              </b-badge>
            </p>
            <div v-if="!contract.verified_contract" class="unverified-section">
              <div class="unverified-badge">
                <div class="unverified-badge__content">
                  <div class="unverified-badge__text">
                    Contract's source code has not yet been published by it's
                    creator.
                  </div>
                </div>
              </div>

              <nuxt-link
                to="/verifyContract"
                class="unverified-section__verify-btn"
              >
                Submit source
              </nuxt-link>
            </div>
          </h4>

          <Tabs v-model="tab" :options="tabs" />

          <!-- General -->

          <Data v-if="tab === 'general'">
            <Row>
              <Cell>Contract address</Cell>
              <Cell>
                <eth-identicon :address="address" :size="20" />
                <span>{{ address }}</span>
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.contract.verified') }}</Cell>
              <Cell>
                <font-awesome-icon
                  :icon="contract.verified_contract ? 'check' : 'times'"
                  :class="
                    contract.verified_contract ? 'text-success' : 'text-danger'
                  "
                />
              </Cell>
            </Row>

            <Row v-if="tokenData">
              <Cell>Token</Cell>
              <Cell>
                <eth-identicon :address="tokenData.address" :size="16" />
                <nuxt-link :to="`/token/${tokenData.address}`">
                  {{ tokenData.fullName }}
                </nuxt-link>
              </Cell>
            </Row>

            <Row>
              <Cell>Created at block</Cell>
              <Cell>
                <nuxt-link
                  :to="`/block?blockNumber=${contract.extrinsic.block_id}`"
                >
                  # {{ formatNumber(contract.extrinsic.block_id) }}
                </nuxt-link>
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.contract.signer') }}</Cell>
              <Cell>
                <ReefIdenticon
                  v-if="contract.signer"
                  :key="contract.signer"
                  class="contract-details__account-identicon"
                  :address="contract.signer"
                  :size="20"
                />
                <nuxt-link
                  v-if="contract.signer"
                  :to="`/account/${contract.signer}`"
                >
                  {{ shortAddress(contract.signer) }}
                </nuxt-link>
              </Cell>
            </Row>
            <Row>
              <Cell>Contract balance</Cell>
              <Cell>
                <span>{{ formatAmount(this.balance) }}</span>
              </Cell>
            </Row>
            <!--TODO Ziga
            <Row v-if="contract.value">
              <Cell>{{ $t('details.contract.value') }}</Cell>
              <Cell>{{ contract.value }}</Cell>
            </Row>-->
            <!--TODO Ziga
            <Row v-if="contract.gas_limit">
              <Cell>{{ $t('details.contract.gas_limit') }}</Cell>
              <Cell>{{ contract.gas_limit }}</Cell>
            </Row>-->
            <!--TODO Ziga
            <Row v-if="contract.storage_limit">
              <Cell>{{ $t('details.contract.storage_limit') }}</Cell>
              <Cell>{{ contract.storage_limit }}</Cell>
            </Row>-->

            <!-- <Row v-if="contract.bytecode">
              <Cell>{{ $t('details.contract.bytecode') }}</Cell>
              <Cell wrap>{{ contract.bytecode }}</Cell>
            </Row> -->

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
                    {{ `https://ipfs.io/ipfs/${data}` }}
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
            <Row v-if="contract.verified_contract">
              <Cell>{{ $t('details.contract.compiler_version') }}</Cell>
              <Cell>{{ contract.verified_contract.compiler_version }}</Cell>
            </Row>

            <Row v-if="contract.verified_contract">
              <Cell>{{ $t('details.contract.optimization') }}</Cell>
              <Cell>
                <font-awesome-icon
                  :icon="
                    contract.verified_contract.optimization ? 'check' : 'times'
                  "
                  :class="
                    contract.verified_contract.optimization
                      ? 'text-success'
                      : 'text-danger'
                  "
                />
              </Cell>
            </Row>

            <Row v-if="contract.verified_contract">
              <Cell>{{ $t('details.contract.runs') }}</Cell>
              <Cell>{{ contract.verified_contract.runs }}</Cell>
            </Row>

            <Row v-if="contract.verified_contract">
              <Cell>{{ $t('details.contract.target') }}</Cell>
              <Cell>{{ contract.verified_contract.target }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.contract.license') }}</Cell>
              <Cell>{{ contract.licence }}</Cell>
            </Row>

            <Row v-if="contract.bytecode">
              <Cell>{{ $t('details.contract.bytecode') }}</Cell>
              <Cell wrap>{{ contract.bytecode }}</Cell>
            </Row>

            <Row v-if="contract.arguments">
              <Cell>{{ $t('details.contract.arguments') }}</Cell>
              <Cell wrap>{{ contract.arguments }}</Cell>
            </Row>

            <Row v-if="decodedArguments">
              <Cell>{{ $t('details.contract.decoded_arguments') }}</Cell>
              <Cell wrap>{{ decodedArguments }}</Cell>
            </Row>
          </Data>

          <!-- Execute -->
          <ContractExecute
            v-if="tab === 'execute'"
            :contract-id="address"
            :contract-name="contract.verified_contract.name"
            :contract-abi="contract.abi"
          />

          <!-- Verified Source -->
          <FileExplorer
            v-if="tab === 'source'"
            :data="contract.verified_contract.source"
          />

          <!-- ABI -->
          <File v-if="tab === 'abi'" :data="contract.abi" />

          <!-- Transactions -->
          <ContractTransactions
            v-if="tab === 'transactions'"
            :contract-id="address"
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
// import cbor from 'cbor'
import Hash from 'ipfs-only-hash'
import { Promised } from 'vue-promised'
import { Contract } from 'ethers'
import { Provider } from '@reef-defi/evm-provider'
import { WsProvider } from '@polkadot/api'
import ERC20Abi from '../../assets/erc20Abi.json'
import ContractExecute from '../../components/ContractExecute.vue'
import ContractTransactions from '../../components/ContractTransactions.vue'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'
import FileExplorer from '@/components/FileExplorer'
import File from '@/components/FileExplorer/File'

export default {
  components: {
    ContractTransactions,
    ReefIdenticon,
    Loading,
    VueJsonPretty,
    ContractExecute,
    Promised,
    FileExplorer,
    File,
  },
  mixins: [commonMixin],
  data() {
    return {
      network,
      balance: 0,
      loading: true,
      address: this.toContractAddress(this.$route.params.id),
      contract: undefined,
      provider: undefined,
      tab: 'general',
    }
  },
  computed: {
    tabs() {
      if (this.contract?.verified_contract) {
        return {
          general: 'General',
          developer: 'Developer',
          execute: 'Execute',
          source: 'Verified Source',
          abi: 'ABI',
          transactions: 'Transactions',
        }
      }

      return {
        general: 'General',
        transactions: 'Transactions',
      }
    },
    tokenData() {
      const data = this.contract?.verified_contract?.contract_data

      if (!data) {
        return null
      }
      const fullName =
        data.name && data.symbol
          ? `${data.name} (${data.symbol})`
          : this.contract.verified_contract.name

      return {
        ...data,
        fullName,
        address: this.address,
      }
    },
    decodedArguments() {
      if (
        this.contract.abi &&
        this.contract.abi.length > 0 &&
        this.contract.bytecode_arguments
      ) {
        try {
          // get constructor arguments types array
          const constructor = this.contract.abi.find(
            ({ type }) => type === 'constructor'
          )
          if (!constructor) {
            return ''
          }

          const constructorTypes = constructor.inputs.map((input) => input.type)

          // decode constructor arguments
          const abiCoder = new ethers.utils.AbiCoder()
          const decoded = abiCoder.decode(
            constructorTypes,
            '0x' + this.contract.bytecode_arguments
          )
          return decoded.toString()
        } catch {
          return null
        }
      }
      return null
    },
    decodedMetadata() {
      /* TODO Ziga
      if (this.contract.bytecode_context) {
        let encodedMetadata = ''
        const endSeq1 = '0033'
        const endSeqIndex1 = this.contract.bytecode_context.indexOf(endSeq1)
        const endSeq2 = '0032'
        const endSeqIndex2 = this.contract.bytecode_context.indexOf(endSeq2)
        if (this.contract.bytecode_context.includes(endSeq1)) {
          encodedMetadata = this.contract.bytecode_context.slice(
            0,
            endSeqIndex1
          )
        }
        if (this.contract.bytecode_context.includes(endSeq2)) {
          encodedMetadata = this.contract.bytecode_context.slice(
            0,
            endSeqIndex2
          )
        }
        // metadata is CBOR encoded (http://cbor.me/)
        const decodedMetadata = cbor.decode(encodedMetadata)
        return decodedMetadata
      } */
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
      this.address = this.$route.params.id
    },
  },
  apollo: {
    $subscribe: {
      contract: {
        query: gql`
          subscription contract($address: String!) {
            contract(where: { address: { _ilike: $address } }) {
              address
              verified_contract {
                name
                args
                source
                compiler_version
                compiled_data
                contract_data
                optimization
                runs
                target
                type
              }
              bytecode
              bytecode_context
              bytecode_arguments
              signer
              extrinsic {
                block_id
              }
              timestamp
            }
          }
        `,
        variables() {
          return {
            address: this.address,
          }
        },
        async result({ data }) {
          if (data.contract[0]) {
            this.contract = data.contract[0]
            const name = data.contract[0].verified_contract?.name

            this.contract.abi =
              data.contract[0].verified_contract &&
              data.contract[0].verified_contract.compiled_data &&
              data.contract[0].verified_contract.compiled_data[name]
                ? data.contract[0].verified_contract.compiled_data[name]
                : []

            if (data.contract[0].verified_contract) {
              this.contract.source = Object.keys(
                data.contract[0].verified_contract.source
              ).reduce(this.sourceCode(data), [])
            }

            if (
              this.contract.bytecode_context &&
              !this.contract.bytecode_context.startsWith('0x')
            ) {
              this.contract.bytecode_context =
                '0x' + this.contract.bytecode_context
            }
          }

          const provider = new Provider({
            provider: new WsProvider(network.nodeWs),
          })
          await provider.api.isReady
          const contract = new Contract(
            '0x0000000000000000000000000000000001000000',
            ERC20Abi,
            provider
          )
          const balance = await contract.balanceOf(this.address)
          await provider.api.disconnect()
          this.balance = balance.toString()
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
    }
  }
}
</style>
