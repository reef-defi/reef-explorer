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
                  label-class="font-weight-bolder"
                  description="Please enter the contract Name you would like to verify"
                >
                  <b-form-input
                    id="contract-name"
                    v-model="$v.contractName.$model"
                    type="text"
                    class="input-height"
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
                  label-class="font-weight-bolder"
                  description="Please select used Compiler Version for compiling contract"
                >
                  <b-form-select
                    id="compiler-version"
                    class="input-height"
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
                  label-class="font-weight-bolder"
                  description="Please specify Filename in which contract is stored. Filename must exist in source filepath maping"
                >
                  <b-form-input
                    id="contract-name"
                    v-model="$v.contractFilename.$model"
                    type="text"
                    class="input-height"
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
                  label-class="font-weight-bolder"
                  description="Please select used EVM Version for compiling contract"
                >
                  <b-form-select
                    id="optimization-target"
                    v-model="$v.target.$model"
                    :options="targetOptions"
                    class="input-height"
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
                  label-class="font-weight-bolder"
                  description="Please enter the contracts Address"
                >
                  <b-form-input
                    id="address"
                    v-model="$v.address.$model"
                    type="text"
                    class="input-height"
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
                  label-class="font-weight-bolder"
                  description="Please select contract Optimization"
                >
                  <b-form-select
                    id="optimization"
                    v-model="$v.optimization.$model"
                    class="input-height"
                    :options="optimizationOptions"
                    :state="validateState('optimization')"
                  ></b-form-select>
                </b-form-group>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <b-form-group
                  id="input-group-license"
                  label="Open source license:"
                  label-for="license"
                  label-class="font-weight-bolder"
                  description="Please select Open Source License Type"
                >
                  <b-form-select
                    id="license"
                    class="input-height"
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
                  label-class="font-weight-bolder"
                  description="Please specify number of Runs used to optimize contracts source"
                >
                  <b-form-input
                    id="optimization-runs"
                    class="input-height"
                    v-model="$v.runs.$model"
                    type="number"
                    :state="validateState('runs')"
                  ></b-form-input>
                </b-form-group>
              </div>
            </div>
            <div>
              <div class="d-flex justify-content-lg-between">
                <label class="d-block font-weight-bolder my-auto">Sources:</label>
                <div>
                  <b-button
                    class="btn-sm btn-danger px-3 mt-0"
                    v-on:click="removeLastSource"
                  >-</b-button>
                  <b-button
                    class="btn-sm btn-success px-3 mt-0"
                    v-on:click="addSource"
                  >+</b-button>
                </div>
              </div>
              <div class="row">
                <div
                  :key="index"
                  class="col-md-12 pb-3"
                  v-for="(source, index) in source"
                >
                  <b-form-input
                    class="content-source-filename"
                    v-model="source.filename"
                    placeholder="Contract source filepath"
                  />
                  <div
                    v-if="source.content === null"
                    class="d-flex flex-column"
                  >
                  <div class="d-flex justify-content-center ">
                    <b-form-file
                      accept=".sol"
                      class="text-center radius-0"
                      placeholder="Please select contract source file..."
                      drop-placeholder="Drop contract source file here..."
                      aria-describedby="source-help"
                      @change="(event) => onFileChange(event, index)"
                    />
                  </div>
                  <div class="d-flex justify-content-center">
                    <b-button
                      class="w-100 mt-0 content-source empty-source-btn"
                      v-on:click="() => emptySource(index)"
                    >
                      Or create an empty source file
                    </b-button>
                  </div>
                </div>
                <b-form-textarea
                  class="content-source"
                  v-if="source.content !== null"
                  v-model="source.content"
                  placeholder="Source code"
                  rows="7"
                />
                </div>
              </div>
            </div>
            <b-alert show>
              Providing contract filesources is crutial for contract verification! <br/>
              Here user shoudl create a project file-map to verify its contract.
              It is best to use exact filepaths like in project directory. <br/>
              I.E. `contract/Storage.sol` should be used in Contract source filepath <br/>
            </b-alert>
            <b-form-group
              id="input-group-arguments"
              label="Constructor arguments:"
              label-class="font-weight-bolder"
              label-for="arguments"
              description="Encoded constructor arguments"
            >
              <b-form-input
                id="arguments"
                class="input-height"
                v-model="$v.args.$model"
                placeholder="Enter encoded constructor arguments..."
                rows="6"
              ></b-form-input>
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
              >Verify Contract
            </b-button>
          </b-form>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import { validationMixin } from 'vuelidate'
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
      source: [
        {filename: '', content: null},
      ],
      sourceContent: null,
      uploadPercentage: 0,
      address: '',
      compilerVersion: null,
      args: '',
      contractName: '',
      contractFilename: '',
      nightly: true,
      optimization: true,
      runs: 200,
      target: 'london',
      license: 'none',
      targetOptions: [
        { text: 'Default (compiler defaults)', value: 'london' },
        { text: 'berlin', value: 'berlin' },
        { text: 'constantinople', value: 'constantinople' },
        { text: 'spuriousDragon', value: 'spuriousDragon' },
        { text: 'tangerineWhistle', value: 'tangerineWhistle' },
        { text: 'homestead (oldest version)', value: 'homestead' },
        { text: 'petersburg (default for >= v0.5.5)', value: 'petersburg' },
        { text: 'istanbul (default for >= v0.5.14)', value: 'istanbul' },
        { text: 'byzantium (default for <= v0.5.4)', value: 'byzantium' },
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
    contractAddress: {
      required,
    },
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
    },
    args: {},
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
      evt.preventDefault();
      const ensure = (condition, message) => {
        if (!condition) {
          throw new Error(message);
        }
      }
      try {
        // generate recaptcha token
        const token = await this.$recaptcha.getResponse()
        ensure(this.contractName !== "", "Contract name must not be empty");
        ensure(this.contractFilename !== "", "Contract filename must not be empty");
        ensure(this.address.length === 42, "Contract address is missing or it is not in correct form");

        this.source
          .forEach(({filename, content}) => {
            ensure(filename !== "", "Source filename is missing");
            ensure(content !== "" && content !== null, "Source filename is missing");
          });
        ensure(this.compilerVersion !== null, "Compiler version is missing");

        //   // call manual verification api
        const sourceObj = this.source
          .reduce((prev, {filename, content}) =>
            ({...prev, [filename]: content}),
          {});

        const body = {
          token,
          runs: this.runs,
          target: this.target,
          address: this.address,
          license: this.license,
          name: this.contractName,
          arguments: `[${this.args}]`,
          filename: this.contractFilename,
          source: JSON.stringify(sourceObj),
          optimization: `${this.optimization}`,
          compilerVersion: this.compilerVersion,
        };
        await this.$axios.post(network.verificatorApi, body);
        // at the end you need to reset recaptcha
        await this.$recaptcha.reset();
        this.requestStatus = "Verified";
      } catch (error) {
        // eslint-disable-next-line no-console
        if (error.response) {
          this.requestStatus = error.response.data.message;
        } else if (error.message) {
          this.requestStatus = error.message;
        } else {
          this.requestStatus = 'Recaptcha token is missing';
          console.log('recaptcha error:', error)
        }
      }
    },
    onFileChange(e, index) {
      const files = e.target.files || e.dataTransfer.files
      if (!files.length) return
      this.readFile(files[0], index)
    },
    readFile(file, index) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.source[index].content = e.target.result
      }
      reader.readAsText(file)
    },
    addSource() {
      this.source.push({filename: "", content: null})
    },
    removeLastSource() {
      if (this.source.length <= 1) { return; }
      this.source = this.source.slice(0, this.source.length-1);
    },
    emptySource(index) {
      this.source[index].content = "";
    }
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
  .input-height {
    height: 45px !important;
  }
  .content-source-filename {
    border-bottom-left-radius: 0% !important;
    border-bottom-right-radius: 0% !important;
    border-bottom: solid 1px !important;
    border-color: #ccc !important;
  }
  .content-source {
    border-top-left-radius: 0% !important;
    border-top-right-radius: 0% !important;
  }

  .empty-source-btn {
    border-bottom-left-radius: 8px !important;
    border-bottom-right-radius: 8px !important;
  }

  .radius-0 {
    border-radius: 0% !important;
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
