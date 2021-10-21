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
        <template v-else>
          <div class="card mb-4">
            <div class="card-body">
              <h4 class="text-center mb-4">
                <eth-identicon :address="contractId" :size="32" />
                <span v-if="contract.name">
                  {{ contract.name }}
                </span>
                <span v-else>
                  {{ shortHash(contractId) }}
                </span>
                <p class="mt-3">
                  <b-badge
                    v-if="contract.is_erc20"
                    :to="`/token/${contract.contract_id}`"
                    class="ml-2"
                    variant="info"
                  >
                    ERC-20 token
                  </b-badge>
                  <b-badge
                    v-if="contract.verified"
                    class="ml-2"
                    variant="success"
                  >
                    Verified source
                    <font-awesome-icon icon="check" />
                  </b-badge>
                  <b-badge v-else class="ml-2" variant="danger">
                    Not verified source
                    <font-awesome-icon icon="times" />
                  </b-badge>
                </p>
              </h4>
              <b-tabs content-class="mt-3">
                <b-tab title="General" active>
                  <div class="table-responsive pb-4">
                    <table class="table contract-data table-striped">
                      <tbody>
                        <tr>
                          <td>Contract address</td>
                          <td class="text-right">
                            <eth-identicon :address="contractId" :size="16" />
                            {{ contractId }}
                          </td>
                        </tr>
                        <tr>
                          <td>{{ $t('details.contract.verified') }}</td>
                          <td class="text-right">
                            <p v-if="contract.verified" class="mb-0">
                              <font-awesome-icon
                                icon="check"
                                class="text-success"
                              />
                            </p>
                            <p v-else class="mb-0">
                              <font-awesome-icon
                                icon="times"
                                class="text-danger"
                              />
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td>Created at block</td>
                          <td class="text-right">
                            <nuxt-link
                              :to="`/block?blockNumber=${contract.block_height}`"
                            >
                              #{{ formatNumber(contract.block_height) }}
                            </nuxt-link>
                          </td>
                        </tr>
                        <tr>
                          <td>{{ $t('details.contract.signer') }}</td>
                          <td class="text-right">
                            <div v-if="contract.signer">
                              <ReefIdenticon
                                :key="contract.signer"
                                :address="contract.signer"
                                :size="20"
                              />
                              <nuxt-link :to="`/account/${contract.signer}`">
                                {{ shortAddress(contract.signer) }}
                              </nuxt-link>
                            </div>
                          </td>
                        </tr>
                        <tr v-if="contract.value">
                          <td>{{ $t('details.contract.value') }}</td>
                          <td class="text-right">
                            {{ contract.value }}
                          </td>
                        </tr>
                        <tr v-if="contract.gas_limit">
                          <td>{{ $t('details.contract.gas_limit') }}</td>
                          <td class="text-right">
                            {{ contract.gas_limit }}
                          </td>
                        </tr>
                        <tr v-if="contract.storage_limit">
                          <td>{{ $t('details.contract.storage_limit') }}</td>
                          <td class="text-right">
                            {{ contract.storage_limit }}
                          </td>
                        </tr>
                        <tr v-if="contract.bytecode">
                          <td>{{ $t('details.contract.bytecode') }}</td>
                          <td class="text-right">
                            <span class="bytecode" style="color: #aaa">{{
                              contract.bytecode
                            }}</span>
                          </td>
                        </tr>
                        <tr v-if="contract.deployment_bytecode">
                          <td>
                            {{ $t('details.contract.deployment_bytecode') }}
                          </td>
                          <td class="text-right">
                            <span class="bytecode" style="color: #aaa">{{
                              contract.deployment_bytecode
                            }}</span>
                          </td>
                        </tr>
                        <tr v-if="contract.arguments">
                          <td>
                            {{ $t('details.contract.arguments') }}
                          </td>
                          <td class="text-right">
                            <span class="bytecode" style="color: #aaa">{{
                              contract.arguments
                            }}</span>
                          </td>
                        </tr>
                        <tr v-if="decodedArguments">
                          <td>
                            {{ $t('details.contract.decoded_arguments') }}
                          </td>
                          <td class="text-right">
                            <span class="bytecode" style="color: #aaa">{{
                              decodedArguments
                            }}</span>
                          </td>
                        </tr>
                        <tr v-if="contract.metadata">
                          <td>
                            {{ $t('details.contract.metadata') }}
                          </td>
                          <td class="text-right">
                            <span class="bytecode" style="color: #aaa">{{
                              contract.metadata
                            }}</span>
                          </td>
                        </tr>
                        <tr v-if="decodedMetadata">
                          <td>
                            {{ $t('details.contract.decoded_metadata') }}
                          </td>
                          <td class="text-right">
                            <vue-json-pretty
                              :data="
                                JSON.parse(JSON.stringify(decodedMetadata))
                              "
                              :deep="2"
                            />
                          </td>
                        </tr>
                        <Promised :promise="getIpfsHash()">
                          <template #default="data">
                            <tr>
                              <td>
                                {{ $t('details.contract.ipfs_hash') }}
                              </td>
                              <td class="text-right">
                                <a
                                  :href="`https://ipfs.io/ipfs/${data}`"
                                  target="_blank"
                                >
                                  {{ data }}
                                </a>
                              </td>
                            </tr>
                          </template>
                        </Promised>
                        <Promised :promise="getBzzr1Hash()">
                          <template #default="data">
                            <tr>
                              <td>
                                {{ $t('details.contract.bzzr1_hash') }}
                              </td>
                              <td class="text-right">{{ data }}</td>
                            </tr>
                          </template>
                        </Promised>
                        <tr v-if="decodedSolcVersion">
                          <td>
                            {{ $t('details.contract.deployment_solc_version') }}
                          </td>
                          <td class="text-right">
                            {{ decodedSolcVersion }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </b-tab>
                <b-tab v-if="contract.verified" title="Developer">
                  <div class="table-responsive pb-4">
                    <table class="table table-striped">
                      <tbody>
                        <tr>
                          <td>{{ $t('details.contract.compiler_version') }}</td>
                          <td class="text-right">
                            {{ contract.compiler_version }}
                          </td>
                        </tr>
                        <tr>
                          <td>{{ $t('details.contract.optimization') }}</td>
                          <td class="text-right">
                            <p v-if="contract.optimization" class="mb-0">
                              <font-awesome-icon
                                icon="check"
                                class="text-success"
                              />
                            </p>
                            <p v-else class="mb-0">
                              <font-awesome-icon
                                icon="times"
                                class="text-danger"
                              />
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td>{{ $t('details.contract.runs') }}</td>
                          <td class="text-right">
                            {{ contract.runs }}
                          </td>
                        </tr>
                        <tr>
                          <td>{{ $t('details.contract.target') }}</td>
                          <td class="text-right">
                            {{ contract.target }}
                          </td>
                        </tr>
                        <tr>
                          <td>{{ $t('details.contract.license') }}</td>
                          <td class="text-right">
                            {{ contract.license }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </b-tab>
                <b-tab v-if="contract.verified" title="Verified source">
                  <pre>{{ contract.source }}</pre>
                </b-tab>
                <b-tab v-if="contract.verified" title="ABI">
                  <vue-json-pretty :data="JSON.parse(contract.abi)" />
                </b-tab>
                <b-tab title="Transactions">
                  <contract-transactions :contract-id="contractId" />
                </b-tab>
                <b-tab v-if="contract.verified" title="Execute">
                  <contract-execute
                    :contract-id="contractId"
                    :contract-name="contract.name"
                    :contract-abi="JSON.parse(contract.abi)"
                  />
                </b-tab>
              </b-tabs>
            </div>
          </div>
        </template>
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
    }
  },
  computed: {
    decodedArguments() {
      if (this.contract.abi && this.contract.arguments) {
        // get constructor arguments types array
        const constructorTypes = JSON.parse(this.contract.abi)
          .find(({ type }) => type === 'constructor')
          .inputs.map((input) => input.type)

        // decode constructor arguments
        const abiCoder = new ethers.utils.AbiCoder()
        const decoded = abiCoder.decode(
          constructorTypes,
          '0x' + this.contract.arguments
        )
        // eslint-disable-next-line no-console
        console.log('decoded constructor arguments', decoded)
        return decoded.toString()
      }
      return null
    },
    decodedMetadata() {
      if (this.contract.metadata) {
        let encodedMetadata = ''
        const endSeq1 = '0033'
        const endSeqIndex1 = this.contract.metadata.indexOf(endSeq1)
        const endSeq2 = '0032'
        const endSeqIndex2 = this.contract.metadata.indexOf(endSeq2)
        if (this.contract.metadata.includes(endSeq1)) {
          encodedMetadata = this.contract.metadata.slice(0, endSeqIndex1)
        }
        if (this.contract.metadata.includes(endSeq2)) {
          encodedMetadata = this.contract.metadata.slice(0, endSeqIndex2)
        }
        // metadata is CBOR encoded (http://cbor.me/)
        const decodedMetadata = cbor.decode(encodedMetadata)
        // eslint-disable-next-line no-console
        console.log(decodedMetadata)
        return decodedMetadata
      }
      return null
    },
    decodedSolcVersion() {
      if (this.decodedMetadata) {
        const solcVersionArray = this.decodedMetadata?.solc || null
        // eslint-disable-next-line no-console
        console.log(solcVersionArray)
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
              bytecode
              metadata
              arguments
              value
              gas_limit
              storage_limit
              signer
              block_height
              verified
              source
              compiler_version
              optimization
              runs
              target
              abi
              license
              is_erc20
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
