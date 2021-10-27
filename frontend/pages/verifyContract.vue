<template>
  <div>
    <section>
      <b-container class="page-verify-contract main py-5">
        <b-row class="mb-2">
          <b-col cols="12">
            <h1>
              {{ $t('pages.verifyContract.title') }}
            </h1>
          </b-col>
        </b-row>
        <b-tabs content-class="mt-3">
          <b-tab title="Verify contract" active>
            <div class="verify-contract">
              <b-alert show>
                Source code verification provides
                <strong>transparency</strong> for users interacting with REEF
                smart contracts. By uploading the source code, ReefScan will
                match the compiled code with that on the blockchain, allowing
                the users to audit the code to independently verify that it
                actually does what it is supposed to do.
              </b-alert>
              <b-form enctype="multipart/form-data" @submit="onSubmit">
                <div class="row">
                  <div class="col-md-6">
                    <b-form-group
                      id="input-group-source"
                      label="Source file:"
                      label-for="address"
                    >
                      <b-form-file
                        ref="source"
                        v-model="$v.source.$model"
                        accept=".sol"
                        placeholder="Please select contract source file..."
                        drop-placeholder="Drop contract source file here..."
                        :state="validateState('source')"
                        aria-describedby="source-help"
                        @change="onFileChange"
                      ></b-form-file>
                      <b-form-text id="source-help">
                        <ul>
                          <li>
                            <font-awesome-icon icon="arrow-right" /> Multiple
                            source files should be combined in one single file
                            using
                            <a
                              href="https://github.com/reef-defi/reef-merger"
                              target="_blank"
                              >reef-merger</a
                            >.
                          </li>
                          <li>
                            <font-awesome-icon icon="arrow-right" />
                            <strong>Filename</strong> excluding the extension
                            should be <strong>equal</strong> to
                            <strong>contract name</strong> in source code.
                          </li>
                          <li>
                            <font-awesome-icon icon="arrow-right" /> File
                            extension should be <strong>".sol"</strong>.
                          </li>
                        </ul>
                      </b-form-text>
                      <b-progress
                        v-show="
                          uploadPercentage > 0 && uploadPercentage !== 100
                        "
                        striped
                        animated
                        :max="100"
                        class="mt-3"
                        :value="uploadPercentage"
                      ></b-progress>
                    </b-form-group>
                  </div>
                  <div class="col-md-6">
                    <b-form-group
                      id="input-group-address"
                      label="Address:"
                      label-for="address"
                      description="Please enter the Contract Address you would like to verify"
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
                </div>
                <div class="row">
                  <div class="col-md-6">
                    <b-form-group
                      id="compiler-version"
                      label="Compiler version:"
                      label-for="compiler-version"
                    >
                      <b-form-select
                        id="compiler-version"
                        v-model="$v.compilerVersion.$model"
                        :options="
                          nightly ? compilerVersions : compilerAllVersions
                        "
                        :state="validateState('compilerVersion')"
                      ></b-form-select>
                      <b-form-checkbox
                        id="nightly"
                        v-model="nightly"
                        name="nightly"
                        class="py-2"
                      >
                        Un-Check to show nightly commits also
                      </b-form-checkbox>
                    </b-form-group>
                  </div>
                  <div class="col-md-6">
                    <b-form-group
                      id="input-group-optimization-target"
                      label="EVM version:"
                      label-for="optimization-target"
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
                      id="input-group-optimization"
                      label="Optimization:"
                      label-for="optimization"
                    >
                      <b-form-select
                        id="optimization"
                        v-model="$v.optimization.$model"
                        :options="optimizationOptions"
                        :state="validateState('optimization')"
                      ></b-form-select>
                    </b-form-group>
                  </div>
                  <div class="col-md-6">
                    <b-form-group
                      id="input-group-optimization-runs"
                      label="Runs (Optimization):"
                      label-for="optimization-runs"
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
                <recaptcha />
                <verification-status :id="requestId" />
                <b-button
                  type="submit"
                  variant="outline-primary2"
                  class="btn-block"
                  >VERIFY CONTRACT</b-button
                >
              </b-form>
            </div>
          </b-tab>
          <b-tab title="Verification requests">
            <verification-requests :requests="requests" class="my-4" />
          </b-tab>
        </b-tabs>
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
  data() {
    return {
      requestId: null,
      requestIds: [],
      requests: [],
      source: null,
      sourceContent: null,
      uploadPercentage: 0,
      address: '',
      compilerVersion: null,
      arguments: '',
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
      compilerAllVersions: [
        { text: 'Please select', value: null },
        {
          text: 'v0.8.7-nightly.2021.7.29+commit.5ff0811b',
          value: 'v0.8.7-nightly.2021.7.29+commit.5ff0811b',
        },
        {
          text: 'v0.8.7-nightly.2021.7.28+commit.1794e1c8',
          value: 'v0.8.7-nightly.2021.7.28+commit.1794e1c8',
        },
        {
          text: 'v0.8.7-nightly.2021.7.27+commit.c018cdf4',
          value: 'v0.8.7-nightly.2021.7.27+commit.c018cdf4',
        },
        {
          text: 'v0.8.7-nightly.2021.7.26+commit.f97fe813',
          value: 'v0.8.7-nightly.2021.7.26+commit.f97fe813',
        },
        {
          text: 'v0.8.7-nightly.2021.7.25+commit.a2ce4616',
          value: 'v0.8.7-nightly.2021.7.25+commit.a2ce4616',
        },
        {
          text: 'v0.8.7-nightly.2021.7.21+commit.6d6c9e6e',
          value: 'v0.8.7-nightly.2021.7.21+commit.6d6c9e6e',
        },
        {
          text: 'v0.8.7-nightly.2021.7.20+commit.d655a3c9',
          value: 'v0.8.7-nightly.2021.7.20+commit.d655a3c9',
        },
        {
          text: 'v0.8.7-nightly.2021.7.15+commit.3d26d47d',
          value: 'v0.8.7-nightly.2021.7.15+commit.3d26d47d',
        },
        {
          text: 'v0.8.7-nightly.2021.7.14+commit.90f77f8c',
          value: 'v0.8.7-nightly.2021.7.14+commit.90f77f8c',
        },
        {
          text: 'v0.8.7-nightly.2021.7.13+commit.57d32ca2',
          value: 'v0.8.7-nightly.2021.7.13+commit.57d32ca2',
        },
        {
          text: 'v0.8.7-nightly.2021.7.12+commit.ef6ad57c',
          value: 'v0.8.7-nightly.2021.7.12+commit.ef6ad57c',
        },
        {
          text: 'v0.8.7-nightly.2021.7.8+commit.c3fa520c',
          value: 'v0.8.7-nightly.2021.7.8+commit.c3fa520c',
        },
        {
          text: 'v0.8.7-nightly.2021.7.7+commit.46514ffa',
          value: 'v0.8.7-nightly.2021.7.7+commit.46514ffa',
        },
        {
          text: 'v0.8.7-nightly.2021.7.6+commit.69233c37',
          value: 'v0.8.7-nightly.2021.7.6+commit.69233c37',
        },
        {
          text: 'v0.8.7-nightly.2021.7.5+commit.19b217dc',
          value: 'v0.8.7-nightly.2021.7.5+commit.19b217dc',
        },
        {
          text: 'v0.8.7-nightly.2021.7.2+commit.f6cb933f',
          value: 'v0.8.7-nightly.2021.7.2+commit.f6cb933f',
        },
        {
          text: 'v0.8.7-nightly.2021.7.1+commit.98e1dee4',
          value: 'v0.8.7-nightly.2021.7.1+commit.98e1dee4',
        },
        {
          text: 'v0.8.7-nightly.2021.6.30+commit.8a6a330d',
          value: 'v0.8.7-nightly.2021.6.30+commit.8a6a330d',
        },
        {
          text: 'v0.8.7-nightly.2021.6.29+commit.eaac16c7',
          value: 'v0.8.7-nightly.2021.6.29+commit.eaac16c7',
        },
        {
          text: 'v0.8.7-nightly.2021.6.28+commit.d91dc995',
          value: 'v0.8.7-nightly.2021.6.28+commit.d91dc995',
        },
        {
          text: 'v0.8.7-nightly.2021.6.23+commit.cbf1c3ae',
          value: 'v0.8.7-nightly.2021.6.23+commit.cbf1c3ae',
        },
        {
          text: 'v0.8.7-nightly.2021.6.22+commit.9cf6021d',
          value: 'v0.8.7-nightly.2021.6.22+commit.9cf6021d',
        },
        {
          text: 'v0.8.6+commit.11564f7e',
          value: 'v0.8.6+commit.11564f7e',
        },
        {
          text: 'v0.8.6-nightly.2021.6.21+commit.a96114b3',
          value: 'v0.8.6-nightly.2021.6.21+commit.a96114b3',
        },
        {
          text: 'v0.8.6-nightly.2021.6.17+commit.11281586',
          value: 'v0.8.6-nightly.2021.6.17+commit.11281586',
        },
        {
          text: 'v0.8.6-nightly.2021.6.16+commit.61468301',
          value: 'v0.8.6-nightly.2021.6.16+commit.61468301',
        },
        {
          text: 'v0.8.6-nightly.2021.6.15+commit.e7bf1cc7',
          value: 'v0.8.6-nightly.2021.6.15+commit.e7bf1cc7',
        },
        {
          text: 'v0.8.6-nightly.2021.6.14+commit.b2ffa910',
          value: 'v0.8.6-nightly.2021.6.14+commit.b2ffa910',
        },
        {
          text: 'v0.8.5+commit.a4f2e591',
          value: 'v0.8.5+commit.a4f2e591',
        },
        {
          text: 'v0.8.5-nightly.2021.6.10+commit.a4f2e591',
          value: 'v0.8.5-nightly.2021.6.10+commit.a4f2e591',
        },
        {
          text: 'v0.8.5-nightly.2021.6.9+commit.98e7b61a',
          value: 'v0.8.5-nightly.2021.6.9+commit.98e7b61a',
        },
        {
          text: 'v0.8.5-nightly.2021.6.8+commit.e77e9e44',
          value: 'v0.8.5-nightly.2021.6.8+commit.e77e9e44',
        },
        {
          text: 'v0.8.5-nightly.2021.6.7+commit.7d8a4e63',
          value: 'v0.8.5-nightly.2021.6.7+commit.7d8a4e63',
        },
        {
          text: 'v0.8.5-nightly.2021.6.4+commit.1f8f1a3d',
          value: 'v0.8.5-nightly.2021.6.4+commit.1f8f1a3d',
        },
        {
          text: 'v0.8.5-nightly.2021.6.3+commit.1638b210',
          value: 'v0.8.5-nightly.2021.6.3+commit.1638b210',
        },
        {
          text: 'v0.8.5-nightly.2021.6.1+commit.4cbf9ff7',
          value: 'v0.8.5-nightly.2021.6.1+commit.4cbf9ff7',
        },
        {
          text: 'v0.8.5-nightly.2021.5.31+commit.7d1df951',
          value: 'v0.8.5-nightly.2021.5.31+commit.7d1df951',
        },
        {
          text: 'v0.8.5-nightly.2021.5.27+commit.2f0df8f0',
          value: 'v0.8.5-nightly.2021.5.27+commit.2f0df8f0',
        },
        {
          text: 'v0.8.5-nightly.2021.5.26+commit.a3634934',
          value: 'v0.8.5-nightly.2021.5.26+commit.a3634934',
        },
        {
          text: 'v0.8.5-nightly.2021.5.25+commit.6640fb8c',
          value: 'v0.8.5-nightly.2021.5.25+commit.6640fb8c',
        },
        {
          text: 'v0.8.5-nightly.2021.5.24+commit.c5031799',
          value: 'v0.8.5-nightly.2021.5.24+commit.c5031799',
        },
        {
          text: 'v0.8.5-nightly.2021.5.21+commit.29c8f282',
          value: 'v0.8.5-nightly.2021.5.21+commit.29c8f282',
        },
        {
          text: 'v0.8.5-nightly.2021.5.20+commit.13388e28',
          value: 'v0.8.5-nightly.2021.5.20+commit.13388e28',
        },
        {
          text: 'v0.8.5-nightly.2021.5.19+commit.d07c85db',
          value: 'v0.8.5-nightly.2021.5.19+commit.d07c85db',
        },
        {
          text: 'v0.8.5-nightly.2021.5.18+commit.dac24294',
          value: 'v0.8.5-nightly.2021.5.18+commit.dac24294',
        },
        {
          text: 'v0.8.5-nightly.2021.5.17+commit.21af5408',
          value: 'v0.8.5-nightly.2021.5.17+commit.21af5408',
        },
        {
          text: 'v0.8.5-nightly.2021.5.14+commit.f58d5873',
          value: 'v0.8.5-nightly.2021.5.14+commit.f58d5873',
        },
        {
          text: 'v0.8.5-nightly.2021.5.13+commit.324caef5',
          value: 'v0.8.5-nightly.2021.5.13+commit.324caef5',
        },
        {
          text: 'v0.8.5-nightly.2021.5.12+commit.98e2b4e5',
          value: 'v0.8.5-nightly.2021.5.12+commit.98e2b4e5',
        },
        {
          text: 'v0.8.5-nightly.2021.5.11+commit.eb991775',
          value: 'v0.8.5-nightly.2021.5.11+commit.eb991775',
        },
        {
          text: 'v0.8.5-nightly.2021.5.10+commit.643140e2',
          value: 'v0.8.5-nightly.2021.5.10+commit.643140e2',
        },
        {
          text: 'v0.8.5-nightly.2021.5.7+commit.5d070c5b',
          value: 'v0.8.5-nightly.2021.5.7+commit.5d070c5b',
        },
        {
          text: 'v0.8.5-nightly.2021.5.6+commit.518629a8',
          value: 'v0.8.5-nightly.2021.5.6+commit.518629a8',
        },
        {
          text: 'v0.8.5-nightly.2021.5.5+commit.4c7b61d8',
          value: 'v0.8.5-nightly.2021.5.5+commit.4c7b61d8',
        },
        {
          text: 'v0.8.5-nightly.2021.5.4+commit.1d1175c2',
          value: 'v0.8.5-nightly.2021.5.4+commit.1d1175c2',
        },
        {
          text: 'v0.8.5-nightly.2021.5.3+commit.fe4822a1',
          value: 'v0.8.5-nightly.2021.5.3+commit.fe4822a1',
        },
        {
          text: 'v0.8.5-nightly.2021.4.29+commit.f1d58c54',
          value: 'v0.8.5-nightly.2021.4.29+commit.f1d58c54',
        },
        {
          text: 'v0.8.5-nightly.2021.4.28+commit.850c25bf',
          value: 'v0.8.5-nightly.2021.4.28+commit.850c25bf',
        },
        {
          text: 'v0.8.5-nightly.2021.4.27+commit.c7944637',
          value: 'v0.8.5-nightly.2021.4.27+commit.c7944637',
        },
        {
          text: 'v0.8.5-nightly.2021.4.26+commit.2e99a56b',
          value: 'v0.8.5-nightly.2021.4.26+commit.2e99a56b',
        },
        {
          text: 'v0.8.5-nightly.2021.4.24+commit.eed0bf58',
          value: 'v0.8.5-nightly.2021.4.24+commit.eed0bf58',
        },
        {
          text: 'v0.8.5-nightly.2021.4.23+commit.173a5118',
          value: 'v0.8.5-nightly.2021.4.23+commit.173a5118',
        },
        {
          text: 'v0.8.5-nightly.2021.4.22+commit.f162c484',
          value: 'v0.8.5-nightly.2021.4.22+commit.f162c484',
        },
        {
          text: 'v0.8.5-nightly.2021.4.21+commit.85274304',
          value: 'v0.8.5-nightly.2021.4.21+commit.85274304',
        },
        { text: 'v0.8.4+commit.c7e474f2', value: 'v0.8.4+commit.c7e474f2' },
        {
          text: 'v0.8.4-nightly.2021.4.20+commit.cf7f814a',
          value: 'v0.8.4-nightly.2021.4.20+commit.cf7f814a',
        },
        {
          text: 'v0.8.4-nightly.2021.4.19+commit.159d6f9e',
          value: 'v0.8.4-nightly.2021.4.19+commit.159d6f9e',
        },
        {
          text: 'v0.8.4-nightly.2021.4.16+commit.f9b23ca8',
          value: 'v0.8.4-nightly.2021.4.16+commit.f9b23ca8',
        },
        {
          text: 'v0.8.4-nightly.2021.4.14+commit.69411436',
          value: 'v0.8.4-nightly.2021.4.14+commit.69411436',
        },
        {
          text: 'v0.8.4-nightly.2021.4.13+commit.f188f3d9',
          value: 'v0.8.4-nightly.2021.4.13+commit.f188f3d9',
        },
        {
          text: 'v0.8.4-nightly.2021.4.12+commit.0289994d',
          value: 'v0.8.4-nightly.2021.4.12+commit.0289994d',
        },
        {
          text: 'v0.8.4-nightly.2021.4.8+commit.124db22f',
          value: 'v0.8.4-nightly.2021.4.8+commit.124db22f',
        },
        {
          text: 'v0.8.4-nightly.2021.4.6+commit.a5cae64a',
          value: 'v0.8.4-nightly.2021.4.6+commit.a5cae64a',
        },
        {
          text: 'v0.8.4-nightly.2021.4.1+commit.5433a640',
          value: 'v0.8.4-nightly.2021.4.1+commit.5433a640',
        },
        {
          text: 'v0.8.4-nightly.2021.3.31+commit.b2555eac',
          value: 'v0.8.4-nightly.2021.3.31+commit.b2555eac',
        },
        {
          text: 'v0.8.4-nightly.2021.3.30+commit.851051c6',
          value: 'v0.8.4-nightly.2021.3.30+commit.851051c6',
        },
        {
          text: 'v0.8.4-nightly.2021.3.29+commit.2346ec1c',
          value: 'v0.8.4-nightly.2021.3.29+commit.2346ec1c',
        },
        {
          text: 'v0.8.4-nightly.2021.3.26+commit.c37bf893',
          value: 'v0.8.4-nightly.2021.3.26+commit.c37bf893',
        },
        {
          text: 'v0.8.4-nightly.2021.3.25+commit.d75a132f',
          value: 'v0.8.4-nightly.2021.3.25+commit.d75a132f',
        },
        {
          text: 'v0.8.4-nightly.2021.3.24+commit.6eac77ae',
          value: 'v0.8.4-nightly.2021.3.24+commit.6eac77ae',
        },
        { text: 'v0.8.3+commit.8d00100c', value: 'v0.8.3+commit.8d00100c' },
        {
          text: 'v0.8.3-nightly.2021.3.22+commit.54cea090',
          value: 'v0.8.3-nightly.2021.3.22+commit.54cea090',
        },
        {
          text: 'v0.8.3-nightly.2021.3.17+commit.e179d0aa',
          value: 'v0.8.3-nightly.2021.3.17+commit.e179d0aa',
        },
        {
          text: 'v0.8.3-nightly.2021.3.16+commit.35da404c',
          value: 'v0.8.3-nightly.2021.3.16+commit.35da404c',
        },
        {
          text: 'v0.8.3-nightly.2021.3.15+commit.ae1b321a',
          value: 'v0.8.3-nightly.2021.3.15+commit.ae1b321a',
        },
        {
          text: 'v0.8.3-nightly.2021.3.12+commit.ccd9de13',
          value: 'v0.8.3-nightly.2021.3.12+commit.ccd9de13',
        },
        {
          text: 'v0.8.3-nightly.2021.3.11+commit.0e22d0bd',
          value: 'v0.8.3-nightly.2021.3.11+commit.0e22d0bd',
        },
        {
          text: 'v0.8.3-nightly.2021.3.10+commit.23f03e1b',
          value: 'v0.8.3-nightly.2021.3.10+commit.23f03e1b',
        },
        {
          text: 'v0.8.3-nightly.2021.3.9+commit.ad5d34df',
          value: 'v0.8.3-nightly.2021.3.9+commit.ad5d34df',
        },
        {
          text: 'v0.8.3-nightly.2021.3.5+commit.093ea461',
          value: 'v0.8.3-nightly.2021.3.5+commit.093ea461',
        },
        {
          text: 'v0.8.3-nightly.2021.3.4+commit.08df163a',
          value: 'v0.8.3-nightly.2021.3.4+commit.08df163a',
        },
        {
          text: 'v0.8.3-nightly.2021.3.3+commit.be564773',
          value: 'v0.8.3-nightly.2021.3.3+commit.be564773',
        },
        { text: 'v0.8.2+commit.661d1103', value: 'v0.8.2+commit.661d1103' },
        {
          text: 'v0.8.2-nightly.2021.3.2+commit.661d1103',
          value: 'v0.8.2-nightly.2021.3.2+commit.661d1103',
        },
        {
          text: 'v0.8.2-nightly.2021.3.1+commit.ad48b713',
          value: 'v0.8.2-nightly.2021.3.1+commit.ad48b713',
        },
        {
          text: 'v0.8.2-nightly.2021.2.25+commit.44493ad4',
          value: 'v0.8.2-nightly.2021.2.25+commit.44493ad4',
        },
        {
          text: 'v0.8.2-nightly.2021.2.24+commit.eacf7c1c',
          value: 'v0.8.2-nightly.2021.2.24+commit.eacf7c1c',
        },
        {
          text: 'v0.8.2-nightly.2021.2.23+commit.1220d8df',
          value: 'v0.8.2-nightly.2021.2.23+commit.1220d8df',
        },
        {
          text: 'v0.8.2-nightly.2021.2.22+commit.e75e3fc2',
          value: 'v0.8.2-nightly.2021.2.22+commit.e75e3fc2',
        },
        {
          text: 'v0.8.2-nightly.2021.2.19+commit.6fd5ea01',
          value: 'v0.8.2-nightly.2021.2.19+commit.6fd5ea01',
        },
        {
          text: 'v0.8.2-nightly.2021.2.18+commit.5c6633f9',
          value: 'v0.8.2-nightly.2021.2.18+commit.5c6633f9',
        },
        {
          text: 'v0.8.2-nightly.2021.2.12+commit.b385b41f',
          value: 'v0.8.2-nightly.2021.2.12+commit.b385b41f',
        },
        {
          text: 'v0.8.2-nightly.2021.2.11+commit.003701f6',
          value: 'v0.8.2-nightly.2021.2.11+commit.003701f6',
        },
        {
          text: 'v0.8.2-nightly.2021.2.10+commit.215233d5',
          value: 'v0.8.2-nightly.2021.2.10+commit.215233d5',
        },
        {
          text: 'v0.8.2-nightly.2021.2.9+commit.9b20c984',
          value: 'v0.8.2-nightly.2021.2.9+commit.9b20c984',
        },
        {
          text: 'v0.8.2-nightly.2021.2.8+commit.ec62d123',
          value: 'v0.8.2-nightly.2021.2.8+commit.ec62d123',
        },
        {
          text: 'v0.8.2-nightly.2021.2.4+commit.2fb27884',
          value: 'v0.8.2-nightly.2021.2.4+commit.2fb27884',
        },
        {
          text: 'v0.8.2-nightly.2021.2.3+commit.1a949e53',
          value: 'v0.8.2-nightly.2021.2.3+commit.1a949e53',
        },
        {
          text: 'v0.8.2-nightly.2021.2.2+commit.358324ed',
          value: 'v0.8.2-nightly.2021.2.2+commit.358324ed',
        },
        {
          text: 'v0.8.2-nightly.2021.2.1+commit.dde6353c',
          value: 'v0.8.2-nightly.2021.2.1+commit.dde6353c',
        },
        {
          text: 'v0.8.2-nightly.2021.1.28+commit.70882cc4',
          value: 'v0.8.2-nightly.2021.1.28+commit.70882cc4',
        },
        {
          text: 'v0.8.2-nightly.2021.1.27+commit.49dbcba3',
          value: 'v0.8.2-nightly.2021.1.27+commit.49dbcba3',
        },
        { text: 'v0.8.1+commit.df193b15', value: 'v0.8.1+commit.df193b15' },
        {
          text: 'v0.8.1-nightly.2021.1.27+commit.34fa756f',
          value: 'v0.8.1-nightly.2021.1.27+commit.34fa756f',
        },
        {
          text: 'v0.8.1-nightly.2021.1.25+commit.ccdf57c9',
          value: 'v0.8.1-nightly.2021.1.25+commit.ccdf57c9',
        },
        {
          text: 'v0.8.1-nightly.2021.1.22+commit.8a844237',
          value: 'v0.8.1-nightly.2021.1.22+commit.8a844237',
        },
        {
          text: 'v0.8.1-nightly.2021.1.21+commit.3045770a',
          value: 'v0.8.1-nightly.2021.1.21+commit.3045770a',
        },
        {
          text: 'v0.8.1-nightly.2021.1.20+commit.a75b87c8',
          value: 'v0.8.1-nightly.2021.1.20+commit.a75b87c8',
        },
        {
          text: 'v0.8.1-nightly.2021.1.19+commit.1df28473',
          value: 'v0.8.1-nightly.2021.1.19+commit.1df28473',
        },
        {
          text: 'v0.8.1-nightly.2021.1.18+commit.957e9995',
          value: 'v0.8.1-nightly.2021.1.18+commit.957e9995',
        },
        {
          text: 'v0.8.1-nightly.2021.1.15+commit.055c4b4d',
          value: 'v0.8.1-nightly.2021.1.15+commit.055c4b4d',
        },
        {
          text: 'v0.8.1-nightly.2021.1.14+commit.eaf7d7da',
          value: 'v0.8.1-nightly.2021.1.14+commit.eaf7d7da',
        },
        {
          text: 'v0.8.1-nightly.2021.1.13+commit.50146114',
          value: 'v0.8.1-nightly.2021.1.13+commit.50146114',
        },
        {
          text: 'v0.8.1-nightly.2021.1.12+commit.e9dcd4f8',
          value: 'v0.8.1-nightly.2021.1.12+commit.e9dcd4f8',
        },
        {
          text: 'v0.8.1-nightly.2021.1.11+commit.67d21a87',
          value: 'v0.8.1-nightly.2021.1.11+commit.67d21a87',
        },
        {
          text: 'v0.8.1-nightly.2021.1.8+commit.f03245d4',
          value: 'v0.8.1-nightly.2021.1.8+commit.f03245d4',
        },
        {
          text: 'v0.8.1-nightly.2021.1.7+commit.d11cf15d',
          value: 'v0.8.1-nightly.2021.1.7+commit.d11cf15d',
        },
        {
          text: 'v0.8.1-nightly.2021.1.6+commit.5241b7b7',
          value: 'v0.8.1-nightly.2021.1.6+commit.5241b7b7',
        },
        {
          text: 'v0.8.1-nightly.2021.1.4+commit.fce6d999',
          value: 'v0.8.1-nightly.2021.1.4+commit.fce6d999',
        },
        {
          text: 'v0.8.1-nightly.2020.12.30+commit.0e32fa82',
          value: 'v0.8.1-nightly.2020.12.30+commit.0e32fa82',
        },
        {
          text: 'v0.8.1-nightly.2020.12.29+commit.86c30b4c',
          value: 'v0.8.1-nightly.2020.12.29+commit.86c30b4c',
        },
        {
          text: 'v0.8.1-nightly.2020.12.28+commit.8e9a5a02',
          value: 'v0.8.1-nightly.2020.12.28+commit.8e9a5a02',
        },
        {
          text: 'v0.8.1-nightly.2020.12.22+commit.e299d8ba',
          value: 'v0.8.1-nightly.2020.12.22+commit.e299d8ba',
        },
        {
          text: 'v0.8.1-nightly.2020.12.21+commit.b78443ac',
          value: 'v0.8.1-nightly.2020.12.21+commit.b78443ac',
        },
        {
          text: 'v0.8.1-nightly.2020.12.20+commit.67712d50',
          value: 'v0.8.1-nightly.2020.12.20+commit.67712d50',
        },
        {
          text: 'v0.8.1-nightly.2020.12.18+commit.158154ba',
          value: 'v0.8.1-nightly.2020.12.18+commit.158154ba',
        },
        {
          text: 'v0.8.1-nightly.2020.12.17+commit.8194cbb4',
          value: 'v0.8.1-nightly.2020.12.17+commit.8194cbb4',
        },
        {
          text: 'v0.8.1-nightly.2020.12.16+commit.2be078b4',
          value: 'v0.8.1-nightly.2020.12.16+commit.2be078b4',
        },
        { text: 'v0.8.0+commit.c7dfd78e', value: 'v0.8.0+commit.c7dfd78e' },
        { text: 'v0.7.6+commit.7338295f', value: 'v0.7.6+commit.7338295f' },
        {
          text: 'v0.7.6-nightly.2020.12.15+commit.17293858',
          value: 'v0.7.6-nightly.2020.12.15+commit.17293858',
        },
        {
          text: 'v0.7.6-nightly.2020.12.14+commit.d83ce0bc',
          value: 'v0.7.6-nightly.2020.12.14+commit.d83ce0bc',
        },
        {
          text: 'v0.7.6-nightly.2020.12.11+commit.db9aa36d',
          value: 'v0.7.6-nightly.2020.12.11+commit.db9aa36d',
        },
        {
          text: 'v0.7.6-nightly.2020.12.10+commit.9e4f3bad',
          value: 'v0.7.6-nightly.2020.12.10+commit.9e4f3bad',
        },
        {
          text: 'v0.7.6-nightly.2020.12.9+commit.7e930f7b',
          value: 'v0.7.6-nightly.2020.12.9+commit.7e930f7b',
        },
        {
          text: 'v0.7.6-nightly.2020.12.8+commit.0d7f9ae1',
          value: 'v0.7.6-nightly.2020.12.8+commit.0d7f9ae1',
        },
        {
          text: 'v0.7.6-nightly.2020.12.7+commit.b23d9230',
          value: 'v0.7.6-nightly.2020.12.7+commit.b23d9230',
        },
        {
          text: 'v0.7.6-nightly.2020.12.4+commit.3619a0a0',
          value: 'v0.7.6-nightly.2020.12.4+commit.3619a0a0',
        },
        {
          text: 'v0.7.6-nightly.2020.12.3+commit.a27d7707',
          value: 'v0.7.6-nightly.2020.12.3+commit.a27d7707',
        },
        {
          text: 'v0.7.6-nightly.2020.12.2+commit.3cd0b252',
          value: 'v0.7.6-nightly.2020.12.2+commit.3cd0b252',
        },
        {
          text: 'v0.7.6-nightly.2020.12.1+commit.e10712c1',
          value: 'v0.7.6-nightly.2020.12.1+commit.e10712c1',
        },
        {
          text: 'v0.7.6-nightly.2020.11.30+commit.91e67472',
          value: 'v0.7.6-nightly.2020.11.30+commit.91e67472',
        },
        {
          text: 'v0.7.6-nightly.2020.11.27+commit.887569ef',
          value: 'v0.7.6-nightly.2020.11.27+commit.887569ef',
        },
        {
          text: 'v0.7.6-nightly.2020.11.26+commit.e8843fe1',
          value: 'v0.7.6-nightly.2020.11.26+commit.e8843fe1',
        },
        {
          text: 'v0.7.6-nightly.2020.11.25+commit.7eb5fc31',
          value: 'v0.7.6-nightly.2020.11.25+commit.7eb5fc31',
        },
        {
          text: 'v0.7.6-nightly.2020.11.24+commit.ae34fba4',
          value: 'v0.7.6-nightly.2020.11.24+commit.ae34fba4',
        },
        {
          text: 'v0.7.6-nightly.2020.11.23+commit.61425e35',
          value: 'v0.7.6-nightly.2020.11.23+commit.61425e35',
        },
        {
          text: 'v0.7.6-nightly.2020.11.21+commit.8bf455bb',
          value: 'v0.7.6-nightly.2020.11.21+commit.8bf455bb',
        },
        {
          text: 'v0.7.6-nightly.2020.11.20+commit.3a3303f2',
          value: 'v0.7.6-nightly.2020.11.20+commit.3a3303f2',
        },
        {
          text: 'v0.7.6-nightly.2020.11.19+commit.8d315ee1',
          value: 'v0.7.6-nightly.2020.11.19+commit.8d315ee1',
        },
        {
          text: 'v0.7.6-nightly.2020.11.18+commit.bfe87378',
          value: 'v0.7.6-nightly.2020.11.18+commit.bfe87378',
        },
        { text: 'v0.7.5+commit.eb77ed08', value: 'v0.7.5+commit.eb77ed08' },
        {
          text: 'v0.7.5-nightly.2020.11.17+commit.e1292380',
          value: 'v0.7.5-nightly.2020.11.17+commit.e1292380',
        },
        {
          text: 'v0.7.5-nightly.2020.11.16+commit.a97521bf',
          value: 'v0.7.5-nightly.2020.11.16+commit.a97521bf',
        },
        {
          text: 'v0.7.5-nightly.2020.11.13+commit.f1846b57',
          value: 'v0.7.5-nightly.2020.11.13+commit.f1846b57',
        },
        {
          text: 'v0.7.5-nightly.2020.11.12+commit.c69c7f32',
          value: 'v0.7.5-nightly.2020.11.12+commit.c69c7f32',
        },
        {
          text: 'v0.7.5-nightly.2020.11.11+commit.44eb63fa',
          value: 'v0.7.5-nightly.2020.11.11+commit.44eb63fa',
        },
        {
          text: 'v0.7.5-nightly.2020.11.10+commit.d3a016b5',
          value: 'v0.7.5-nightly.2020.11.10+commit.d3a016b5',
        },
        {
          text: 'v0.7.5-nightly.2020.11.9+commit.41f50365',
          value: 'v0.7.5-nightly.2020.11.9+commit.41f50365',
        },
        {
          text: 'v0.7.5-nightly.2020.11.6+commit.6fa42b5e',
          value: 'v0.7.5-nightly.2020.11.6+commit.6fa42b5e',
        },
        {
          text: 'v0.7.5-nightly.2020.11.5+commit.f55f5c24',
          value: 'v0.7.5-nightly.2020.11.5+commit.f55f5c24',
        },
        {
          text: 'v0.7.5-nightly.2020.11.4+commit.5b412544',
          value: 'v0.7.5-nightly.2020.11.4+commit.5b412544',
        },
        {
          text: 'v0.7.5-nightly.2020.11.3+commit.a8045ba5',
          value: 'v0.7.5-nightly.2020.11.3+commit.a8045ba5',
        },
        {
          text: 'v0.7.5-nightly.2020.11.2+commit.c83d8fae',
          value: 'v0.7.5-nightly.2020.11.2+commit.c83d8fae',
        },
        {
          text: 'v0.7.5-nightly.2020.10.29+commit.be02db49',
          value: 'v0.7.5-nightly.2020.10.29+commit.be02db49',
        },
        {
          text: 'v0.7.5-nightly.2020.10.28+commit.f42280f5',
          value: 'v0.7.5-nightly.2020.10.28+commit.f42280f5',
        },
        {
          text: 'v0.7.5-nightly.2020.10.27+commit.f1ed5100',
          value: 'v0.7.5-nightly.2020.10.27+commit.f1ed5100',
        },
        {
          text: 'v0.7.5-nightly.2020.10.26+commit.96c188be',
          value: 'v0.7.5-nightly.2020.10.26+commit.96c188be',
        },
        {
          text: 'v0.7.5-nightly.2020.10.23+commit.08a27b9c',
          value: 'v0.7.5-nightly.2020.10.23+commit.08a27b9c',
        },
        {
          text: 'v0.7.5-nightly.2020.10.22+commit.95c521a3',
          value: 'v0.7.5-nightly.2020.10.22+commit.95c521a3',
        },
        {
          text: 'v0.7.5-nightly.2020.10.21+commit.38d58a45',
          value: 'v0.7.5-nightly.2020.10.21+commit.38d58a45',
        },
        {
          text: 'v0.7.5-nightly.2020.10.20+commit.06394672',
          value: 'v0.7.5-nightly.2020.10.20+commit.06394672',
        },
        {
          text: 'v0.7.5-nightly.2020.10.19+commit.58579332',
          value: 'v0.7.5-nightly.2020.10.19+commit.58579332',
        },
        { text: 'v0.7.4+commit.3f05b770', value: 'v0.7.4+commit.3f05b770' },
        {
          text: 'v0.7.4-nightly.2020.10.18+commit.6aae7cae',
          value: 'v0.7.4-nightly.2020.10.18+commit.6aae7cae',
        },
        {
          text: 'v0.7.4-nightly.2020.10.16+commit.eedd12ad',
          value: 'v0.7.4-nightly.2020.10.16+commit.eedd12ad',
        },
        {
          text: 'v0.7.4-nightly.2020.10.15+commit.9aafb62e',
          value: 'v0.7.4-nightly.2020.10.15+commit.9aafb62e',
        },
        {
          text: 'v0.7.4-nightly.2020.10.14+commit.36a36caf',
          value: 'v0.7.4-nightly.2020.10.14+commit.36a36caf',
        },
        {
          text: 'v0.7.4-nightly.2020.10.13+commit.8d241fec',
          value: 'v0.7.4-nightly.2020.10.13+commit.8d241fec',
        },
        {
          text: 'v0.7.4-nightly.2020.10.12+commit.abfa136a',
          value: 'v0.7.4-nightly.2020.10.12+commit.abfa136a',
        },
        {
          text: 'v0.7.4-nightly.2020.10.9+commit.d9215cf9',
          value: 'v0.7.4-nightly.2020.10.9+commit.d9215cf9',
        },
        {
          text: 'v0.7.4-nightly.2020.10.8+commit.3739b03a',
          value: 'v0.7.4-nightly.2020.10.8+commit.3739b03a',
        },
        { text: 'v0.7.3+commit.9bfce1f6', value: 'v0.7.3+commit.9bfce1f6' },
        {
          text: 'v0.7.3-nightly.2020.10.6+commit.25d40805',
          value: 'v0.7.3-nightly.2020.10.6+commit.25d40805',
        },
        {
          text: 'v0.7.3-nightly.2020.10.2+commit.756e21a8',
          value: 'v0.7.3-nightly.2020.10.2+commit.756e21a8',
        },
        {
          text: 'v0.7.3-nightly.2020.9.30+commit.3af21c92',
          value: 'v0.7.3-nightly.2020.9.30+commit.3af21c92',
        },
        {
          text: 'v0.7.3-nightly.2020.9.29+commit.343c13f9',
          value: 'v0.7.3-nightly.2020.9.29+commit.343c13f9',
        },
        {
          text: 'v0.7.3-nightly.2020.9.28+commit.dd5b0a71',
          value: 'v0.7.3-nightly.2020.9.28+commit.dd5b0a71',
        },
        { text: 'v0.7.2+commit.51b20bc0', value: 'v0.7.2+commit.51b20bc0' },
        {
          text: 'v0.7.2-nightly.2020.9.25+commit.b34465c5',
          value: 'v0.7.2-nightly.2020.9.25+commit.b34465c5',
        },
        {
          text: 'v0.7.2-nightly.2020.9.24+commit.5711d664',
          value: 'v0.7.2-nightly.2020.9.24+commit.5711d664',
        },
        {
          text: 'v0.7.2-nightly.2020.9.23+commit.35a7d5d3',
          value: 'v0.7.2-nightly.2020.9.23+commit.35a7d5d3',
        },
        {
          text: 'v0.7.2-nightly.2020.9.22+commit.700cc4c9',
          value: 'v0.7.2-nightly.2020.9.22+commit.700cc4c9',
        },
        {
          text: 'v0.7.2-nightly.2020.9.21+commit.d80a81b0',
          value: 'v0.7.2-nightly.2020.9.21+commit.d80a81b0',
        },
        {
          text: 'v0.7.2-nightly.2020.9.17+commit.b571fd05',
          value: 'v0.7.2-nightly.2020.9.17+commit.b571fd05',
        },
        {
          text: 'v0.7.2-nightly.2020.9.16+commit.90506528',
          value: 'v0.7.2-nightly.2020.9.16+commit.90506528',
        },
        {
          text: 'v0.7.2-nightly.2020.9.15+commit.3399570d',
          value: 'v0.7.2-nightly.2020.9.15+commit.3399570d',
        },
        {
          text: 'v0.7.2-nightly.2020.9.12+commit.38175150',
          value: 'v0.7.2-nightly.2020.9.12+commit.38175150',
        },
        {
          text: 'v0.7.2-nightly.2020.9.11+commit.31b5102a',
          value: 'v0.7.2-nightly.2020.9.11+commit.31b5102a',
        },
        {
          text: 'v0.7.2-nightly.2020.9.10+commit.0db79dbc',
          value: 'v0.7.2-nightly.2020.9.10+commit.0db79dbc',
        },
        {
          text: 'v0.7.2-nightly.2020.9.9+commit.95a284e5',
          value: 'v0.7.2-nightly.2020.9.9+commit.95a284e5',
        },
        {
          text: 'v0.7.2-nightly.2020.9.8+commit.20233240',
          value: 'v0.7.2-nightly.2020.9.8+commit.20233240',
        },
        {
          text: 'v0.7.2-nightly.2020.9.7+commit.38e6f272',
          value: 'v0.7.2-nightly.2020.9.7+commit.38e6f272',
        },
        {
          text: 'v0.7.2-nightly.2020.9.3+commit.f9649660',
          value: 'v0.7.2-nightly.2020.9.3+commit.f9649660',
        },
        {
          text: 'v0.7.2-nightly.2020.9.2+commit.cde65224',
          value: 'v0.7.2-nightly.2020.9.2+commit.cde65224',
        },
        { text: 'v0.7.1+commit.f4a555be', value: 'v0.7.1+commit.f4a555be' },
        {
          text: 'v0.7.1-nightly.2020.9.1+commit.0d83977d',
          value: 'v0.7.1-nightly.2020.9.1+commit.0d83977d',
        },
        {
          text: 'v0.7.1-nightly.2020.8.31+commit.34543e5e',
          value: 'v0.7.1-nightly.2020.8.31+commit.34543e5e',
        },
        {
          text: 'v0.7.1-nightly.2020.8.28+commit.98cc1d99',
          value: 'v0.7.1-nightly.2020.8.28+commit.98cc1d99',
        },
        {
          text: 'v0.7.1-nightly.2020.8.27+commit.e872b1b5',
          value: 'v0.7.1-nightly.2020.8.27+commit.e872b1b5',
        },
        {
          text: 'v0.7.1-nightly.2020.8.26+commit.fdc4142b',
          value: 'v0.7.1-nightly.2020.8.26+commit.fdc4142b',
        },
        {
          text: 'v0.7.1-nightly.2020.8.25+commit.29b6c172',
          value: 'v0.7.1-nightly.2020.8.25+commit.29b6c172',
        },
        {
          text: 'v0.7.1-nightly.2020.8.24+commit.21489d81',
          value: 'v0.7.1-nightly.2020.8.24+commit.21489d81',
        },
        {
          text: 'v0.7.1-nightly.2020.8.22+commit.bff0f9bd',
          value: 'v0.7.1-nightly.2020.8.22+commit.bff0f9bd',
        },
        {
          text: 'v0.7.1-nightly.2020.8.21+commit.4dd25f73',
          value: 'v0.7.1-nightly.2020.8.21+commit.4dd25f73',
        },
        {
          text: 'v0.7.1-nightly.2020.8.20+commit.4a720a65',
          value: 'v0.7.1-nightly.2020.8.20+commit.4a720a65',
        },
        {
          text: 'v0.7.1-nightly.2020.8.19+commit.9e488f12',
          value: 'v0.7.1-nightly.2020.8.19+commit.9e488f12',
        },
        {
          text: 'v0.7.1-nightly.2020.8.18+commit.3c27d36e',
          value: 'v0.7.1-nightly.2020.8.18+commit.3c27d36e',
        },
        {
          text: 'v0.7.1-nightly.2020.8.17+commit.660ef792',
          value: 'v0.7.1-nightly.2020.8.17+commit.660ef792',
        },
        {
          text: 'v0.7.1-nightly.2020.8.13+commit.b1fb9da6',
          value: 'v0.7.1-nightly.2020.8.13+commit.b1fb9da6',
        },
        {
          text: 'v0.7.1-nightly.2020.8.12+commit.acdaff63',
          value: 'v0.7.1-nightly.2020.8.12+commit.acdaff63',
        },
        {
          text: 'v0.7.1-nightly.2020.8.11+commit.e68d16d8',
          value: 'v0.7.1-nightly.2020.8.11+commit.e68d16d8',
        },
        {
          text: 'v0.7.1-nightly.2020.8.10+commit.05901f5b',
          value: 'v0.7.1-nightly.2020.8.10+commit.05901f5b',
        },
        {
          text: 'v0.7.1-nightly.2020.8.6+commit.241a564f',
          value: 'v0.7.1-nightly.2020.8.6+commit.241a564f',
        },
        {
          text: 'v0.7.1-nightly.2020.8.5+commit.3a409c39',
          value: 'v0.7.1-nightly.2020.8.5+commit.3a409c39',
        },
        {
          text: 'v0.7.1-nightly.2020.8.4+commit.b8fd409f',
          value: 'v0.7.1-nightly.2020.8.4+commit.b8fd409f',
        },
        {
          text: 'v0.7.1-nightly.2020.8.3+commit.d31f05fc',
          value: 'v0.7.1-nightly.2020.8.3+commit.d31f05fc',
        },
        {
          text: 'v0.7.1-nightly.2020.7.31+commit.08791ab0',
          value: 'v0.7.1-nightly.2020.7.31+commit.08791ab0',
        },
        {
          text: 'v0.7.1-nightly.2020.7.29+commit.f2fa5b5f',
          value: 'v0.7.1-nightly.2020.7.29+commit.f2fa5b5f',
        },
        {
          text: 'v0.7.1-nightly.2020.7.28+commit.cd2ce283',
          value: 'v0.7.1-nightly.2020.7.28+commit.cd2ce283',
        },
        { text: 'v0.7.0+commit.9e61f92b', value: 'v0.7.0+commit.9e61f92b' },
        {
          text: 'v0.7.0-nightly.2020.7.27+commit.4e4b3ee6',
          value: 'v0.7.0-nightly.2020.7.27+commit.4e4b3ee6',
        },
        {
          text: 'v0.7.0-nightly.2020.7.23+commit.7ad27188',
          value: 'v0.7.0-nightly.2020.7.23+commit.7ad27188',
        },
        { text: 'v0.6.12+commit.27d51765', value: 'v0.6.12+commit.27d51765' },
        { text: 'v0.6.11+commit.5ef660b1', value: 'v0.6.11+commit.5ef660b1' },
        {
          text: 'v0.6.11-nightly.2020.6.25+commit.48dd3634',
          value: 'v0.6.11-nightly.2020.6.25+commit.48dd3634',
        },
        { text: 'v0.6.10+commit.00c0fcaf', value: 'v0.6.10+commit.00c0fcaf' },
        {
          text: 'v0.6.10-nightly.2020.6.10+commit.0a5d9927',
          value: 'v0.6.10-nightly.2020.6.10+commit.0a5d9927',
        },
        {
          text: 'v0.6.10-nightly.2020.6.9+commit.1e8e0ebd',
          value: 'v0.6.10-nightly.2020.6.9+commit.1e8e0ebd',
        },
        {
          text: 'v0.6.10-nightly.2020.6.8+commit.3d241eed',
          value: 'v0.6.10-nightly.2020.6.8+commit.3d241eed',
        },
        {
          text: 'v0.6.10-nightly.2020.6.5+commit.d4552678',
          value: 'v0.6.10-nightly.2020.6.5+commit.d4552678',
        },
        {
          text: 'v0.6.10-nightly.2020.6.4+commit.0ec96337',
          value: 'v0.6.10-nightly.2020.6.4+commit.0ec96337',
        },
        { text: 'v0.6.9+commit.3e3065ac', value: 'v0.6.9+commit.3e3065ac' },
        {
          text: 'v0.6.9-nightly.2020.6.4+commit.70e62524',
          value: 'v0.6.9-nightly.2020.6.4+commit.70e62524',
        },
        {
          text: 'v0.6.9-nightly.2020.6.3+commit.de5e2835',
          value: 'v0.6.9-nightly.2020.6.3+commit.de5e2835',
        },
        {
          text: 'v0.6.9-nightly.2020.6.2+commit.22f7a9f0',
          value: 'v0.6.9-nightly.2020.6.2+commit.22f7a9f0',
        },
        {
          text: 'v0.6.9-nightly.2020.5.29+commit.b01a1a36',
          value: 'v0.6.9-nightly.2020.5.29+commit.b01a1a36',
        },
        {
          text: 'v0.6.9-nightly.2020.5.28+commit.ee8307ce',
          value: 'v0.6.9-nightly.2020.5.28+commit.ee8307ce',
        },
        {
          text: 'v0.6.9-nightly.2020.5.27+commit.57ac8628',
          value: 'v0.6.9-nightly.2020.5.27+commit.57ac8628',
        },
        {
          text: 'v0.6.9-nightly.2020.5.14+commit.33d8d838',
          value: 'v0.6.9-nightly.2020.5.14+commit.33d8d838',
        },
        { text: 'v0.6.8+commit.0bbfe453', value: 'v0.6.8+commit.0bbfe453' },
        {
          text: 'v0.6.8-nightly.2020.5.14+commit.a6d0067b',
          value: 'v0.6.8-nightly.2020.5.14+commit.a6d0067b',
        },
        {
          text: 'v0.6.8-nightly.2020.5.13+commit.aca70049',
          value: 'v0.6.8-nightly.2020.5.13+commit.aca70049',
        },
        {
          text: 'v0.6.8-nightly.2020.5.12+commit.b014b89e',
          value: 'v0.6.8-nightly.2020.5.12+commit.b014b89e',
        },
        {
          text: 'v0.6.8-nightly.2020.5.11+commit.39249bc6',
          value: 'v0.6.8-nightly.2020.5.11+commit.39249bc6',
        },
        {
          text: 'v0.6.8-nightly.2020.5.8+commit.4e58c672',
          value: 'v0.6.8-nightly.2020.5.8+commit.4e58c672',
        },
        {
          text: 'v0.6.8-nightly.2020.5.7+commit.741c41a1',
          value: 'v0.6.8-nightly.2020.5.7+commit.741c41a1',
        },
        {
          text: 'v0.6.8-nightly.2020.5.6+commit.3a93080c',
          value: 'v0.6.8-nightly.2020.5.6+commit.3a93080c',
        },
        {
          text: 'v0.6.8-nightly.2020.5.5+commit.1de73a16',
          value: 'v0.6.8-nightly.2020.5.5+commit.1de73a16',
        },
        {
          text: 'v0.6.8-nightly.2020.5.4+commit.1bb07e26',
          value: 'v0.6.8-nightly.2020.5.4+commit.1bb07e26',
        },
        { text: 'v0.6.7+commit.b8d736ae', value: 'v0.6.7+commit.b8d736ae' },
        {
          text: 'v0.6.7-nightly.2020.5.4+commit.94f7ffcf',
          value: 'v0.6.7-nightly.2020.5.4+commit.94f7ffcf',
        },
        {
          text: 'v0.6.7-nightly.2020.5.1+commit.5163c09e',
          value: 'v0.6.7-nightly.2020.5.1+commit.5163c09e',
        },
        {
          text: 'v0.6.7-nightly.2020.4.29+commit.602b29cb',
          value: 'v0.6.7-nightly.2020.4.29+commit.602b29cb',
        },
        {
          text: 'v0.6.7-nightly.2020.4.28+commit.75a25d53',
          value: 'v0.6.7-nightly.2020.4.28+commit.75a25d53',
        },
        {
          text: 'v0.6.7-nightly.2020.4.27+commit.61b1369f',
          value: 'v0.6.7-nightly.2020.4.27+commit.61b1369f',
        },
        {
          text: 'v0.6.7-nightly.2020.4.25+commit.ed6c6b31',
          value: 'v0.6.7-nightly.2020.4.25+commit.ed6c6b31',
        },
        {
          text: 'v0.6.7-nightly.2020.4.24+commit.2b39f3b9',
          value: 'v0.6.7-nightly.2020.4.24+commit.2b39f3b9',
        },
        {
          text: 'v0.6.7-nightly.2020.4.23+commit.aaa434da',
          value: 'v0.6.7-nightly.2020.4.23+commit.aaa434da',
        },
        {
          text: 'v0.6.7-nightly.2020.4.22+commit.d0fcd468',
          value: 'v0.6.7-nightly.2020.4.22+commit.d0fcd468',
        },
        {
          text: 'v0.6.7-nightly.2020.4.20+commit.7eff836a',
          value: 'v0.6.7-nightly.2020.4.20+commit.7eff836a',
        },
        {
          text: 'v0.6.7-nightly.2020.4.17+commit.ccc06c49',
          value: 'v0.6.7-nightly.2020.4.17+commit.ccc06c49',
        },
        {
          text: 'v0.6.7-nightly.2020.4.16+commit.0f7a5e80',
          value: 'v0.6.7-nightly.2020.4.16+commit.0f7a5e80',
        },
        {
          text: 'v0.6.7-nightly.2020.4.15+commit.cbd90f8d',
          value: 'v0.6.7-nightly.2020.4.15+commit.cbd90f8d',
        },
        {
          text: 'v0.6.7-nightly.2020.4.14+commit.accd8d76',
          value: 'v0.6.7-nightly.2020.4.14+commit.accd8d76',
        },
        {
          text: 'v0.6.7-nightly.2020.4.9+commit.f8aaa83e',
          value: 'v0.6.7-nightly.2020.4.9+commit.f8aaa83e',
        },
        { text: 'v0.6.6+commit.6c089d02', value: 'v0.6.6+commit.6c089d02' },
        {
          text: 'v0.6.6-nightly.2020.4.9+commit.605e176f',
          value: 'v0.6.6-nightly.2020.4.9+commit.605e176f',
        },
        {
          text: 'v0.6.6-nightly.2020.4.8+commit.9fab9df1',
          value: 'v0.6.6-nightly.2020.4.8+commit.9fab9df1',
        },
        {
          text: 'v0.6.6-nightly.2020.4.7+commit.582c7545',
          value: 'v0.6.6-nightly.2020.4.7+commit.582c7545',
        },
        {
          text: 'v0.6.6-nightly.2020.4.6+commit.e349f4b7',
          value: 'v0.6.6-nightly.2020.4.6+commit.e349f4b7',
        },
        { text: 'v0.6.5+commit.f956cc89', value: 'v0.6.5+commit.f956cc89' },
        {
          text: 'v0.6.5-nightly.2020.4.6+commit.8451639f',
          value: 'v0.6.5-nightly.2020.4.6+commit.8451639f',
        },
        {
          text: 'v0.6.5-nightly.2020.4.3+commit.00acaadd',
          value: 'v0.6.5-nightly.2020.4.3+commit.00acaadd',
        },
        {
          text: 'v0.6.5-nightly.2020.4.2+commit.c8f0629e',
          value: 'v0.6.5-nightly.2020.4.2+commit.c8f0629e',
        },
        {
          text: 'v0.6.5-nightly.2020.4.1+commit.c11d5b8d',
          value: 'v0.6.5-nightly.2020.4.1+commit.c11d5b8d',
        },
        {
          text: 'v0.6.5-nightly.2020.3.31+commit.b83d82ab',
          value: 'v0.6.5-nightly.2020.3.31+commit.b83d82ab',
        },
        {
          text: 'v0.6.5-nightly.2020.3.30+commit.469316f8',
          value: 'v0.6.5-nightly.2020.3.30+commit.469316f8',
        },
        {
          text: 'v0.6.5-nightly.2020.3.26+commit.994591b8',
          value: 'v0.6.5-nightly.2020.3.26+commit.994591b8',
        },
        {
          text: 'v0.6.5-nightly.2020.3.25+commit.18971389',
          value: 'v0.6.5-nightly.2020.3.25+commit.18971389',
        },
        {
          text: 'v0.6.5-nightly.2020.3.24+commit.d584b2d1',
          value: 'v0.6.5-nightly.2020.3.24+commit.d584b2d1',
        },
        {
          text: 'v0.6.5-nightly.2020.3.23+commit.848f405f',
          value: 'v0.6.5-nightly.2020.3.23+commit.848f405f',
        },
        {
          text: 'v0.6.5-nightly.2020.3.19+commit.8834b1ac',
          value: 'v0.6.5-nightly.2020.3.19+commit.8834b1ac',
        },
        {
          text: 'v0.6.5-nightly.2020.3.18+commit.cfd315e1',
          value: 'v0.6.5-nightly.2020.3.18+commit.cfd315e1',
        },
        {
          text: 'v0.6.5-nightly.2020.3.17+commit.435c9dae',
          value: 'v0.6.5-nightly.2020.3.17+commit.435c9dae',
        },
        {
          text: 'v0.6.5-nightly.2020.3.16+commit.e21567c1',
          value: 'v0.6.5-nightly.2020.3.16+commit.e21567c1',
        },
        {
          text: 'v0.6.5-nightly.2020.3.13+commit.362c2175',
          value: 'v0.6.5-nightly.2020.3.13+commit.362c2175',
        },
        {
          text: 'v0.6.5-nightly.2020.3.12+commit.bdd8045d',
          value: 'v0.6.5-nightly.2020.3.12+commit.bdd8045d',
        },
        {
          text: 'v0.6.5-nightly.2020.3.11+commit.1167af1d',
          value: 'v0.6.5-nightly.2020.3.11+commit.1167af1d',
        },
        {
          text: 'v0.6.5-nightly.2020.3.10+commit.59071f60',
          value: 'v0.6.5-nightly.2020.3.10+commit.59071f60',
        },
        { text: 'v0.6.4+commit.1dca32f3', value: 'v0.6.4+commit.1dca32f3' },
        {
          text: 'v0.6.4-nightly.2020.3.10+commit.683ebc8e',
          value: 'v0.6.4-nightly.2020.3.10+commit.683ebc8e',
        },
        {
          text: 'v0.6.4-nightly.2020.3.9+commit.dbe2a5f4',
          value: 'v0.6.4-nightly.2020.3.9+commit.dbe2a5f4',
        },
        {
          text: 'v0.6.4-nightly.2020.3.8+commit.a328e940',
          value: 'v0.6.4-nightly.2020.3.8+commit.a328e940',
        },
        {
          text: 'v0.6.4-nightly.2020.3.6+commit.78ce4b96',
          value: 'v0.6.4-nightly.2020.3.6+commit.78ce4b96',
        },
        {
          text: 'v0.6.4-nightly.2020.3.4+commit.27a4670a',
          value: 'v0.6.4-nightly.2020.3.4+commit.27a4670a',
        },
        {
          text: 'v0.6.4-nightly.2020.3.3+commit.20679d63',
          value: 'v0.6.4-nightly.2020.3.3+commit.20679d63',
        },
        {
          text: 'v0.6.4-nightly.2020.2.27+commit.b65a165d',
          value: 'v0.6.4-nightly.2020.2.27+commit.b65a165d',
        },
        {
          text: 'v0.6.4-nightly.2020.2.26+commit.6930e0c2',
          value: 'v0.6.4-nightly.2020.2.26+commit.6930e0c2',
        },
        {
          text: 'v0.6.4-nightly.2020.2.25+commit.af81d4b6',
          value: 'v0.6.4-nightly.2020.2.25+commit.af81d4b6',
        },
        {
          text: 'v0.6.4-nightly.2020.2.24+commit.aa6a2b47',
          value: 'v0.6.4-nightly.2020.2.24+commit.aa6a2b47',
        },
        {
          text: 'v0.6.4-nightly.2020.2.20+commit.525fe384',
          value: 'v0.6.4-nightly.2020.2.20+commit.525fe384',
        },
        {
          text: 'v0.6.4-nightly.2020.2.19+commit.8f2c5fc0',
          value: 'v0.6.4-nightly.2020.2.19+commit.8f2c5fc0',
        },
        {
          text: 'v0.6.4-nightly.2020.2.18+commit.ba9f740a',
          value: 'v0.6.4-nightly.2020.2.18+commit.ba9f740a',
        },
        { text: 'v0.6.3+commit.8dda9521', value: 'v0.6.3+commit.8dda9521' },
        {
          text: 'v0.6.3-nightly.2020.2.18+commit.64f9dc35',
          value: 'v0.6.3-nightly.2020.2.18+commit.64f9dc35',
        },
        {
          text: 'v0.6.3-nightly.2020.2.17+commit.50421e8b',
          value: 'v0.6.3-nightly.2020.2.17+commit.50421e8b',
        },
        {
          text: 'v0.6.3-nightly.2020.2.14+commit.96709b32',
          value: 'v0.6.3-nightly.2020.2.14+commit.96709b32',
        },
        {
          text: 'v0.6.3-nightly.2020.2.13+commit.7af581df',
          value: 'v0.6.3-nightly.2020.2.13+commit.7af581df',
        },
        {
          text: 'v0.6.3-nightly.2020.2.12+commit.0e100e7e',
          value: 'v0.6.3-nightly.2020.2.12+commit.0e100e7e',
        },
        {
          text: 'v0.6.3-nightly.2020.2.11+commit.5214cb0e',
          value: 'v0.6.3-nightly.2020.2.11+commit.5214cb0e',
        },
        {
          text: 'v0.6.3-nightly.2020.2.10+commit.64bb0d55',
          value: 'v0.6.3-nightly.2020.2.10+commit.64bb0d55',
        },
        {
          text: 'v0.6.3-nightly.2020.2.7+commit.462cd432',
          value: 'v0.6.3-nightly.2020.2.7+commit.462cd432',
        },
        {
          text: 'v0.6.3-nightly.2020.2.6+commit.93191ceb',
          value: 'v0.6.3-nightly.2020.2.6+commit.93191ceb',
        },
        {
          text: 'v0.6.3-nightly.2020.2.5+commit.913d5f32',
          value: 'v0.6.3-nightly.2020.2.5+commit.913d5f32',
        },
        {
          text: 'v0.6.3-nightly.2020.2.4+commit.836938c1',
          value: 'v0.6.3-nightly.2020.2.4+commit.836938c1',
        },
        {
          text: 'v0.6.3-nightly.2020.2.3+commit.93a41f7a',
          value: 'v0.6.3-nightly.2020.2.3+commit.93a41f7a',
        },
        {
          text: 'v0.6.3-nightly.2020.1.31+commit.b6190e06',
          value: 'v0.6.3-nightly.2020.1.31+commit.b6190e06',
        },
        {
          text: 'v0.6.3-nightly.2020.1.30+commit.ad98bf0f',
          value: 'v0.6.3-nightly.2020.1.30+commit.ad98bf0f',
        },
        {
          text: 'v0.6.3-nightly.2020.1.29+commit.01eb9a5b',
          value: 'v0.6.3-nightly.2020.1.29+commit.01eb9a5b',
        },
        {
          text: 'v0.6.3-nightly.2020.1.28+commit.2d3bd91d',
          value: 'v0.6.3-nightly.2020.1.28+commit.2d3bd91d',
        },
        {
          text: 'v0.6.3-nightly.2020.1.27+commit.8809d4bb',
          value: 'v0.6.3-nightly.2020.1.27+commit.8809d4bb',
        },
        { text: 'v0.6.2+commit.bacdbe57', value: 'v0.6.2+commit.bacdbe57' },
        {
          text: 'v0.6.2-nightly.2020.1.27+commit.1bdb409b',
          value: 'v0.6.2-nightly.2020.1.27+commit.1bdb409b',
        },
        {
          text: 'v0.6.2-nightly.2020.1.23+commit.3add37a2',
          value: 'v0.6.2-nightly.2020.1.23+commit.3add37a2',
        },
        {
          text: 'v0.6.2-nightly.2020.1.22+commit.641bb815',
          value: 'v0.6.2-nightly.2020.1.22+commit.641bb815',
        },
        {
          text: 'v0.6.2-nightly.2020.1.20+commit.470c19eb',
          value: 'v0.6.2-nightly.2020.1.20+commit.470c19eb',
        },
        {
          text: 'v0.6.2-nightly.2020.1.17+commit.92908f52',
          value: 'v0.6.2-nightly.2020.1.17+commit.92908f52',
        },
        {
          text: 'v0.6.2-nightly.2020.1.16+commit.3d4a2219',
          value: 'v0.6.2-nightly.2020.1.16+commit.3d4a2219',
        },
        {
          text: 'v0.6.2-nightly.2020.1.15+commit.9d9a7ebe',
          value: 'v0.6.2-nightly.2020.1.15+commit.9d9a7ebe',
        },
        {
          text: 'v0.6.2-nightly.2020.1.14+commit.6dbadf69',
          value: 'v0.6.2-nightly.2020.1.14+commit.6dbadf69',
        },
        {
          text: 'v0.6.2-nightly.2020.1.13+commit.408458b7',
          value: 'v0.6.2-nightly.2020.1.13+commit.408458b7',
        },
        {
          text: 'v0.6.2-nightly.2020.1.10+commit.d577a768',
          value: 'v0.6.2-nightly.2020.1.10+commit.d577a768',
        },
        {
          text: 'v0.6.2-nightly.2020.1.9+commit.17158995',
          value: 'v0.6.2-nightly.2020.1.9+commit.17158995',
        },
        {
          text: 'v0.6.2-nightly.2020.1.8+commit.12b52ae6',
          value: 'v0.6.2-nightly.2020.1.8+commit.12b52ae6',
        },
        { text: 'v0.6.1+commit.e6f7d5a4', value: 'v0.6.1+commit.e6f7d5a4' },
        {
          text: 'v0.6.1-nightly.2020.1.7+commit.8385256b',
          value: 'v0.6.1-nightly.2020.1.7+commit.8385256b',
        },
        {
          text: 'v0.6.1-nightly.2020.1.6+commit.20cf9d9f',
          value: 'v0.6.1-nightly.2020.1.6+commit.20cf9d9f',
        },
        {
          text: 'v0.6.1-nightly.2020.1.3+commit.943af71d',
          value: 'v0.6.1-nightly.2020.1.3+commit.943af71d',
        },
        {
          text: 'v0.6.1-nightly.2020.1.2+commit.d082b9b8',
          value: 'v0.6.1-nightly.2020.1.2+commit.d082b9b8',
        },
        {
          text: 'v0.6.1-nightly.2019.12.20+commit.ece6463f',
          value: 'v0.6.1-nightly.2019.12.20+commit.ece6463f',
        },
        {
          text: 'v0.6.1-nightly.2019.12.19+commit.d420fe37',
          value: 'v0.6.1-nightly.2019.12.19+commit.d420fe37',
        },
        {
          text: 'v0.6.1-nightly.2019.12.18+commit.9a1cc027',
          value: 'v0.6.1-nightly.2019.12.18+commit.9a1cc027',
        },
        { text: 'v0.6.0+commit.26b70077', value: 'v0.6.0+commit.26b70077' },
        {
          text: 'v0.6.0-nightly.2019.12.17+commit.d13438ee',
          value: 'v0.6.0-nightly.2019.12.17+commit.d13438ee',
        },
        {
          text: 'v0.6.0-nightly.2019.12.16+commit.7390b5b5',
          value: 'v0.6.0-nightly.2019.12.16+commit.7390b5b5',
        },
        {
          text: 'v0.6.0-nightly.2019.12.14+commit.1c01c69e',
          value: 'v0.6.0-nightly.2019.12.14+commit.1c01c69e',
        },
        {
          text: 'v0.6.0-nightly.2019.12.13+commit.9ddd5042',
          value: 'v0.6.0-nightly.2019.12.13+commit.9ddd5042',
        },
        {
          text: 'v0.6.0-nightly.2019.12.12+commit.104a8c59',
          value: 'v0.6.0-nightly.2019.12.12+commit.104a8c59',
        },
        {
          text: 'v0.6.0-nightly.2019.12.11+commit.7247e72d',
          value: 'v0.6.0-nightly.2019.12.11+commit.7247e72d',
        },
        {
          text: 'v0.6.0-nightly.2019.12.10+commit.7244aa01',
          value: 'v0.6.0-nightly.2019.12.10+commit.7244aa01',
        },
      ],
      licenses: [
        { text: 'Please select', value: null },
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
          .post(network.verificatorApi + '/manual-contract-verification', {
            filename: vm.source.name,
            name: vm.source.name.split('.')[0],
            source: JSON.stringify(sourceObject),
            address: toChecksumAddress(vm.address),
            compilerVersion: vm.compilerVersion,
            arguments: vm.arguments
              ? JSON.stringify(vm.arguments)
              : JSON.stringify([]),
            optimization: JSON.stringify(vm.optimization),
            runs: vm.runs,
            target,
            license: undefined,
            token,
          })
          .then((resp) => {
            // eslint-disable-next-line no-console
            // console.log('verification request data uploaded:', resp.data)
            vm.requestId = resp.data.data.id
            vm.requestIds.push(resp.data.data.id)
            // eslint-disable-next-line no-console
            // console.log('verification request id:', vm.requestId)
          })
          .catch(function (errors) {
            vm.requestId = null
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
      const client = vm.$apollo
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
  apollo: {
    $subscribe: {
      requests: {
        query: gql`
          subscription contract_verification_request($requestIds: [String!]) {
            contract_verification_request(
              where: { id: { _in: $requestIds } }
              order_by: { timestamp: desc }
            ) {
              compiler_version
              contract_id
              error_message
              error_type
              filename
              id
              license
              optimization
              runs
              status
              target
              timestamp
            }
          }
        `,
        variables() {
          return {
            requestIds: this.requestIds,
          }
        },
        result({ data }) {
          this.requests = data.contract_verification_request
          // eslint-disable-next-line no-console
          // console.log(this.requests)
        },
      },
    },
  },
}
</script>
