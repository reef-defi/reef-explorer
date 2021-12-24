<template>
  <div class="verify-contract">
    <section>
      <b-container class="page-verify-contract main py-5">
        <div class="verify-contract__head">
          <Headline class="verify-contract__headline">
            {{ $t('pages.verifyContract.title') }}
          </Headline>
          <Tabs v-model="tab" :options="$options.tabs" />
        </div>
        <div v-if="tab === 'verify'" class="verify-contract">
          <b-alert show>
            Source code verification provides
            <strong>transparency</strong> for users interacting with REEF smart
            contracts. By uploading the source code, ReefScan will match the
            compiled code with that on the blockchain, allowing the users to
            audit the code to independently verify that it actually does what it
            is supposed to do.
          </b-alert>
          <b-form enctype="multipart/form-data" @submit="onSubmit">
            <div class="row">
              <div class="col-md-6">
                <b-form-group
                  id="input-group-address"
                  label="Contract name:"
                  label-for="contract-name"
                  description="Please enter the contract Name you would like to verify"
                >
                  <b-form-input
                    id="contract-name"
                    v-model="$v.contractName.$model"
                    type="text"
                    placeholder="Enter contract name"
                    :state="validateState('contractName')"
                  ></b-form-input>
                </b-form-group>
              </div>
              <div class="col-md-6">
                <b-form-group
                  id="compiler-version"
                  label="Compiler version:"
                  label-for="compiler-version"
                  description="Please select used Compiler Version for compiling contract"
                >
                  <b-form-select
                    id="compiler-version"
                    v-model="$v.compilerVersion.$model"
                    :options="nightly ? compilerVersions : compilerAllVersions"
                    :state="validateState('compilerVersion')"
                  ></b-form-select>
                </b-form-group>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <b-form-group
                  id="input-group-address"
                  label="Contract filename:"
                  label-for="contract-filename"
                  description="Please specify Filename in which contract is stored"
                >
                  <b-form-input
                    id="contract-name"
                    v-model="$v.contractFilename.$model"
                    type="text"
                    placeholder="Enter contract filename"
                    :state="validateState('contractFilename')"
                  ></b-form-input>
                </b-form-group>
              </div>
              <div class="col-md-6">
                <b-form-group
                  id="input-group-optimization-target"
                  label="EVM version:"
                  label-for="optimization-target"
                  description="Please select used EVM Version for compiling contract"
                >
                  <b-form-select
                    id="optimization-target"
                    v-model="$v.target.$model"
                    :options="targetOptions"
                    :state="validateState('target')"
                  ></b-form-select>
                </b-form-group>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <b-form-group
                  id="input-group-address"
                  label="Address:"
                  label-for="address"
                  description="Please enter the contracts Address"
                >
                  <b-form-input
                    id="address"
                    v-model="$v.address.$model"
                    type="text"
                    placeholder="Enter address"
                    :state="validateState('address')"
                  ></b-form-input>
                </b-form-group>
              </div>
              <div class="col-md-6">
                <b-form-group
                  id="input-group-optimization"
                  label="Optimization:"
                  label-for="optimization"
                  description="Please select contract Optimization"
                >
                  <b-form-select
                    id="optimization"
                    v-model="$v.optimization.$model"
                    :options="optimizationOptions"
                    :state="validateState('optimization')"
                  ></b-form-select>
                </b-form-group>
              </div>
            </div>
            <div class="row">

            </div>
            <div class="row">
              <div class="col-md-6">
                <b-form-group
                  id="input-group-license"
                  label="Open source license:"
                  label-for="license"
                  description="Please select Open Source License Type"
                >
                  <b-form-select
                    id="license"
                    v-model="$v.license.$model"
                    :options="licenses"
                    :state="validateState('license')"
                  ></b-form-select>
                </b-form-group>
              </div>
              <div class="col-md-6">

                <b-form-group
                  v-if="$v.optimization.$model"
                  id="input-group-optimization-runs"
                  label="Runs (Optimization):"
                  label-for="optimization-runs"
                  description="Please specify number of Runs used to optimize contracts source"
                >
                  <b-form-input
                    id="optimization-runs"
                    v-model="$v.runs.$model"
                    type="number"
                    :state="validateState('runs')"
                  ></b-form-input>
                </b-form-group>
              </div>
            </div>

            <b-form-group
              id="input-group-arguments"
              label="Constructor arguments:"
              label-for="arguments"
              description="Encoded constructor arguments"
            >
              <b-form-textarea
                id="arguments"
                v-model="$v.arguments.$model"
                placeholder="Enter encoded constructor arguments..."
                rows="6"
              ></b-form-textarea>
            </b-form-group>


            <recaptcha />
            <b-alert
              v-if="requestStatus === 'Verified'"
              variant="success"
              class="text-center"
              show
            >
              {{ requestStatus }}
            </b-alert>
            <b-alert
              v-if="requestStatus && requestStatus !== 'Verified'"
              variant="danger"
              class="text-center"
              show
            >
              {{ requestStatus }}
            </b-alert>
            <b-button type="submit" variant="outline-primary2" class="btn-block"
              >Verify Contract</b-button
            >
          </b-form>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import { validationMixin } from 'vuelidate'
import { checkAddressChecksum, toChecksumAddress } from 'web3-utils'
// eslint-disable-next-line no-unused-vars
import { required, integer, minValue } from 'vuelidate/lib/validators'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'

export default {
  mixins: [commonMixin, validationMixin],
  tabs: {
    verify: 'Verify Contract',
    requests: 'Verificantion Requests',
  },
  data() {
    return {
      tab: 'verify',
      requestStatus: null,
      requestId: null,
      requestIds: [],
      requests: [],
      source: null,
      sourceContent: null,
      uploadPercentage: 0,
      address: '',
      compilerVersion: null,
      verificationError: '',
      arguments: '',
      contractName: '',
      contractFilename: '',
      nightly: true,
      optimization: true,
      runs: 200,
      target: 'default',
      license: 'none',
      targetOptions: [
        { text: 'Default (compiler defaults)', value: 'default' },
        { text: 'homestead (oldest version)', value: 'homestead' },
        { text: 'tangerineWhistle', value: 'tangerineWhistle' },
        { text: 'spuriousDragon', value: 'spuriousDragon' },
        { text: 'byzantium (default for <= v0.5.4)', value: 'byzantium' },
        { text: 'constantinople', value: 'constantinople' },
        { text: 'petersburg (default for >= v0.5.5)', value: 'petersburg' },
        { text: 'istanbul (default for >= v0.5.14)', value: 'istanbul' },
      ],
      optimizationOptions: [
        { text: 'Yes', value: true },
        { text: 'No', value: false },
      ],
      compilerVersions: [
        { text: 'Please select', value: null },
        { text: 'v0.8.6+commit.11564f7e', value: 'v0.8.6+commit.11564f7e' },
        { text: 'v0.8.5+commit.a4f2e591', value: 'v0.8.5+commit.a4f2e591' },
        { text: 'v0.8.4+commit.c7e474f2', value: 'v0.8.4+commit.c7e474f2' },
        { text: 'v0.8.3+commit.8d00100c', value: 'v0.8.3+commit.8d00100c' },
        { text: 'v0.8.2+commit.661d1103', value: 'v0.8.2+commit.661d1103' },
        { text: 'v0.8.1+commit.df193b15', value: 'v0.8.1+commit.df193b15' },
        { text: 'v0.8.0+commit.c7dfd78e', value: 'v0.8.0+commit.c7dfd78e' },
        { text: 'v0.7.6+commit.7338295f', value: 'v0.7.6+commit.7338295f' },
        { text: 'v0.7.5+commit.eb77ed08', value: 'v0.7.5+commit.eb77ed08' },
        { text: 'v0.7.4+commit.3f05b770', value: 'v0.7.4+commit.3f05b770' },
        { text: 'v0.7.3+commit.9bfce1f6', value: 'v0.7.3+commit.9bfce1f6' },
        { text: 'v0.7.2+commit.51b20bc0', value: 'v0.7.2+commit.51b20bc0' },
        { text: 'v0.7.1+commit.f4a555be', value: 'v0.7.1+commit.f4a555be' },
        { text: 'v0.7.0+commit.9e61f92b', value: 'v0.7.0+commit.9e61f92b' },
        { text: 'v0.6.12+commit.27d51765', value: 'v0.6.12+commit.27d51765' },
        { text: 'v0.6.11+commit.5ef660b1', value: 'v0.6.11+commit.5ef660b1' },
        { text: 'v0.6.10+commit.00c0fcaf', value: 'v0.6.10+commit.00c0fcaf' },
        { text: 'v0.6.9+commit.3e3065ac', value: 'v0.6.9+commit.3e3065ac' },
        { text: 'v0.6.8+commit.0bbfe453', value: 'v0.6.8+commit.0bbfe453' },
        { text: 'v0.6.7+commit.b8d736ae', value: 'v0.6.7+commit.b8d736ae' },
        { text: 'v0.6.6+commit.6c089d02', value: 'v0.6.6+commit.6c089d02' },
        { text: 'v0.6.5+commit.f956cc89', value: 'v0.6.5+commit.f956cc89' },
        { text: 'v0.6.4+commit.1dca32f3', value: 'v0.6.4+commit.1dca32f3' },
        { text: 'v0.6.3+commit.8dda9521', value: 'v0.6.3+commit.8dda9521' },
        { text: 'v0.6.2+commit.bacdbe57', value: 'v0.6.2+commit.bacdbe57' },
        { text: 'v0.6.1+commit.e6f7d5a4', value: 'v0.6.1+commit.e6f7d5a4' },
        { text: 'v0.6.0+commit.26b70077', value: 'v0.6.0+commit.26b70077' },
      ],
      compilerAllVersions: [{ text: 'Please select', value: null }],
      licenses: [
        { text: 'No License', value: 'none' },
        { text: 'The Unlicense', value: 'unlicense' },
        { text: 'MIT License', value: 'MIT' },
        { text: 'GNU General Public License v2.0', value: 'GNU GPLv2' },
        { text: 'GNU General Public License v3.0', value: 'GNU GPLv3' },
        {
          text: 'GNU Lesser General Public License v2.1',
          value: 'GNU LGPLv2.1',
        },
        { text: 'GNU Lesser General Public License v3.0', value: 'GNU LGPLv3' },
        { text: 'BSD 2-clause "Simplified" license', value: 'BSD-2-Clause' },
        {
          text: 'BSD 3-clause "New" Or "Revised" license',
          value: 'BSD-3-Clause',
        },
        { text: 'Mozilla Public License 2.0', value: 'MPL-2.0' },
        { text: 'Open Software License 3.0', value: 'OSL-3.0' },
        { text: 'Apache 2.0', value: 'Apache-2.0' },
        { text: 'GNU Affero General Public License', value: 'GNU AGPLv3' },
      ],
    }
  },
  validations: {
    contractName: {
      required,
    },
    contractFilename: {
      required,
    },
    source: {
      required,
    },
    address: {
      required,
      isValidContractId: (value, vm) => vm.isValidContractId(value, vm),
    },
    arguments: {},
    compilerVersion: {
      required,
    },
    optimization: {
      required,
    },
    runs: {
      required,
      integer,
      minValue: (value) => value >= 0,
    },
    target: {
      required,
    },
    license: {
      required,
    },
  },
  methods: {
    validateState(name) {
      const { $dirty, $error } = this.$v[name]
      return $dirty ? !$error : null
    },
    async onSubmit(evt) {
      evt.preventDefault()
      this.$v.$touch()
      if (this.$v.$invalid) {
        return false
      }
      try {
        // generate recaptcha token
        const token = await this.$recaptcha.getResponse()

        // figure out default target
        const vm = this
        let target = vm.target
        // compilerVersion: could be formatted like 'v0.4.24-nightly.2018.5.16+commit.7f965c86' or 'v0.8.6+commit.11564f7e'
        if (target === 'default') {
          const compilerVersionNumber = vm.compilerVersion
            .split('-')[0]
            .split('+')[0]
            .substring(1)
          const compilerVersionNumber1 = parseInt(
            compilerVersionNumber.split('.')[0]
          )
          const compilerVersionNumber2 = parseInt(
            compilerVersionNumber.split('.')[1]
          )
          const compilerVersionNumber3 = parseInt(
            compilerVersionNumber.split('.')[2]
          )
          if (
            compilerVersionNumber1 === 0 &&
            compilerVersionNumber2 <= 5 &&
            compilerVersionNumber3 <= 4
          ) {
            target = 'byzantium'
          } else if (
            compilerVersionNumber1 === 0 &&
            compilerVersionNumber2 >= 5 &&
            compilerVersionNumber3 >= 5 &&
            compilerVersionNumber3 < 14
          ) {
            target = 'petersburg'
          } else {
            target = 'istanbul'
          }
        }

        // call manual verification api
        const sourceObject = {}
        sourceObject[vm.source.name] = vm.sourceContent
        this.$axios
          .post(network.verificatorApi + '/form-verification', {
            address: toChecksumAddress(vm.address),
            name: vm.source.name.split('.')[0],
            runs: vm.runs,
            filename: vm.source.name,
            source: JSON.stringify(sourceObject),
            compilerVersion: vm.compilerVersion,
            optimization: JSON.stringify(vm.optimization),
            token,
            arguments: vm.arguments,
            target,
            license: vm.license,
          })
          .then((resp) => {
            // eslint-disable-next-line no-console
            console.log('verification status:', resp.data)
            vm.requestStatus = resp.data
          })
          .catch((error) => {
            vm.requestStatus = error.response.data
          })

        // at the end you need to reset recaptcha
        await this.$recaptcha.reset()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('recaptcha error:', error)
      }
    },
    isValidContractId: async (contractId, vm) => {
      if (!checkAddressChecksum(contractId)) {
        return false
      }
      const client = vm.$apollo.provider.defaultClient
      const query = gql`
        query contract {
          contract(where: { contract_id: { _eq: "${
            toChecksumAddress(contractId) || ''
          }" } }) {
            verified
          }
        }
      `
      const response = await client.query({ query })
      return (
        response.data.contract.length > 0 && !response.data.contract[0].verified
      )
    },
    onFileChange(e) {
      const files = e.target.files || e.dataTransfer.files
      if (!files.length) return
      this.readFile(files[0])
    },
    readFile(file) {
      const reader = new FileReader()
      const vm = this
      reader.onload = (e) => {
        vm.sourceContent = e.target.result
      }
      reader.readAsText(file)
    },
  },
}
</script>

<style lang="scss">
.verify-contract {
  .verify-contract__head {
    width: 100%;
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .verify-contract__headline {
      justify-content: flex-start;
      text-align: left;
    }

    .tabs {
      margin-top: 0;
    }

    @media only screen and (max-width: 991px) {
      flex-flow: column nowrap;
      justify-content: flex-start;

      .verify-contract__headline {
        justify-content: center;
        text-align: center;
      }

      .tabs {
        margin-top: 15px;
      }
    }
  }

  .alert {
    margin-bottom: 25px;
  }

  .btn {
    margin-top: 5px;
    border: none;
    padding: 10px 21px;
    font-size: 15px;
    border-radius: 99px;
    background: linear-gradient(90deg, #a93185, #5531a9);
    transition: filter 0.15s;
    color: white;

    &:hover {
      filter: brightness(1.2);
    }

    &:active {
      filter: brightness(1.4);
    }
  }
}
</style>
