<template>
  <div>
    <section>
      <b-container class="main py-5">
        <b-row class="mb-2">
          <b-col cols="12">
            <h1>
              {{ $t('pages.verifyContract.title') }}
            </h1>
          </b-col>
        </b-row>
        <div class="verify-contract">
          <b-alert show>
            Source code verification provides <strong>transparency</strong> for
            users interacting with REEF smart contracts. By uploading the source
            code, ReefScan will match the compiled code with that on the
            blockchain, allowing the users to audit the code to independently
            verify that it actually does what it is supposed to do.
          </b-alert>
          <b-form enctype="multipart/form-data" @submit="onSubmit">
            <div class="row">
              <div class="col-md-6">
                <b-form-group
                  id="input-group-source"
                  label="Combined source file:"
                  label-for="address"
                >
                  <b-form-file
                    ref="source"
                    v-model="$v.source.$model"
                    placeholder="Please select contract source file..."
                    drop-placeholder="Drop contract source file here..."
                    :state="validateState('source')"
                    aria-describedby="source-help"
                  ></b-form-file>
                  <b-form-text id="source-help">
                    Contract source file should be combined in one file using
                    <a
                      href="https://github.com/RyuuGan/sol-merger"
                      target="_blank"
                      >sol-merger</a
                    >
                    or
                    <a
                      href="https://github.com/BlockCatIO/solidity-flattener"
                      target="_blank"
                      >solidity-flattener</a
                    >. Filename excluding the extension should be equal to
                    contract name in source code
                  </b-form-text>
                  <b-progress
                    v-show="uploadPercentage > 0 && uploadPercentage !== 100"
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
                    :options="nightly ? compilerVersions : compilerAllVersions"
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
            </div>
            <div class="row">
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
              <div class="col-md-6">
                <b-form-group
                  id="input-group-optimization-target"
                  label="Target (Optimization):"
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
            <b-form-group
              id="license"
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
            <b-button type="submit" variant="outline-primary2" class="btn-block"
              >VERIFY CONTRACT</b-button
            >
          </b-form>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import gql from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import { validationMixin } from 'vuelidate'
// eslint-disable-next-line no-unused-vars
import { required, integer, minValue } from 'vuelidate/lib/validators'
import { network } from '@/frontend.config.js'

export default {
  mixins: [commonMixin, validationMixin],
  data() {
    return {
      requestId: null,
      source: null,
      uploadPercentage: 0,
      address: '',
      compilerVersion: null,
      nightly: true,
      optimization: true,
      runs: 200,
      target: 'istanbul',
      license: 'none',
      targetOptions: [
        { text: 'Please select', value: null },
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
        { text: 'v0.5.17+commit.d19bba13', value: 'v0.5.17+commit.d19bba13' },
        { text: 'v0.5.16+commit.9c3226ce', value: 'v0.5.16+commit.9c3226ce' },
        { text: 'v0.5.15+commit.6a57276f', value: 'v0.5.15+commit.6a57276f' },
        { text: 'v0.5.14+commit.01f1aaa4', value: 'v0.5.14+commit.01f1aaa4' },
        { text: 'v0.5.13+commit.5b0b510c', value: 'v0.5.13+commit.5b0b510c' },
        { text: 'v0.5.12+commit.7709ece9', value: 'v0.5.12+commit.7709ece9' },
        { text: 'v0.5.11+commit.22be8592', value: 'v0.5.11+commit.22be8592' },
        { text: 'v0.5.11+commit.c082d0b4', value: 'v0.5.11+commit.c082d0b4' },
        { text: 'v0.5.10+commit.5a6ea5b1', value: 'v0.5.10+commit.5a6ea5b1' },
        { text: 'v0.5.9+commit.c68bc34e', value: 'v0.5.9+commit.c68bc34e' },
        { text: 'v0.5.9+commit.e560f70d', value: 'v0.5.9+commit.e560f70d' },
        { text: 'v0.5.8+commit.23d335f2', value: 'v0.5.8+commit.23d335f2' },
        { text: 'v0.5.7+commit.6da8b019', value: 'v0.5.7+commit.6da8b019' },
        { text: 'v0.5.6+commit.b259423e', value: 'v0.5.6+commit.b259423e' },
        { text: 'v0.5.5+commit.47a71e8f', value: 'v0.5.5+commit.47a71e8f' },
        { text: 'v0.5.4+commit.9549d8ff', value: 'v0.5.4+commit.9549d8ff' },
        { text: 'v0.5.3+commit.10d17f24', value: 'v0.5.3+commit.10d17f24' },
        { text: 'v0.5.2+commit.1df8f40c', value: 'v0.5.2+commit.1df8f40c' },
        { text: 'v0.5.1+commit.c8a2cb62', value: 'v0.5.1+commit.c8a2cb62' },
        { text: 'v0.5.0+commit.1d4f565a', value: 'v0.5.0+commit.1d4f565a' },
        { text: 'v0.4.26+commit.4563c3fc', value: 'v0.4.26+commit.4563c3fc' },
        { text: 'v0.4.25+commit.59dbf8f1', value: 'v0.4.25+commit.59dbf8f1' },
        { text: 'v0.4.24+commit.e67f0147', value: 'v0.4.24+commit.e67f0147' },
        { text: 'v0.4.23+commit.124ca40d', value: 'v0.4.23+commit.124ca40d' },
        { text: 'v0.4.22+commit.4cb486ee', value: 'v0.4.22+commit.4cb486ee' },
        { text: 'v0.4.21+commit.dfe3193c', value: 'v0.4.21+commit.dfe3193c' },
        { text: 'v0.4.20+commit.3155dd80', value: 'v0.4.20+commit.3155dd80' },
        { text: 'v0.4.19+commit.c4cbbb05', value: 'v0.4.19+commit.c4cbbb05' },
        { text: 'v0.4.18+commit.9cf6e910', value: 'v0.4.18+commit.9cf6e910' },
        { text: 'v0.4.17+commit.bdeb9e52', value: 'v0.4.17+commit.bdeb9e52' },
        { text: 'v0.4.16+commit.d7661dd9', value: 'v0.4.16+commit.d7661dd9' },
        { text: 'v0.4.15+commit.8b45bddb', value: 'v0.4.15+commit.8b45bddb' },
        { text: 'v0.4.15+commit.bbb8e64f', value: 'v0.4.15+commit.bbb8e64f' },
        { text: 'v0.4.14+commit.c2215d46', value: 'v0.4.14+commit.c2215d46' },
        { text: 'v0.4.13+commit.0fb4cb1a', value: 'v0.4.13+commit.0fb4cb1a' },
        { text: 'v0.4.12+commit.194ff033', value: 'v0.4.12+commit.194ff033' },
        { text: 'v0.4.11+commit.68ef5810', value: 'v0.4.11+commit.68ef5810' },
      ],
      compilerAllVersions: [
        { text: 'Please select', value: null },
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
        { text: 'v0.5.17+commit.d19bba13', value: 'v0.5.17+commit.d19bba13' },
        { text: 'v0.5.16+commit.9c3226ce', value: 'v0.5.16+commit.9c3226ce' },
        { text: 'v0.5.15+commit.6a57276f', value: 'v0.5.15+commit.6a57276f' },
        { text: 'v0.5.14+commit.01f1aaa4', value: 'v0.5.14+commit.01f1aaa4' },
        {
          text: 'v0.5.14-nightly.2019.12.10+commit.45aa7a88',
          value: 'v0.5.14-nightly.2019.12.10+commit.45aa7a88',
        },
        {
          text: 'v0.5.14-nightly.2019.12.9+commit.d6667560',
          value: 'v0.5.14-nightly.2019.12.9+commit.d6667560',
        },
        {
          text: 'v0.5.14-nightly.2019.12.5+commit.d2e3933d',
          value: 'v0.5.14-nightly.2019.12.5+commit.d2e3933d',
        },
        {
          text: 'v0.5.14-nightly.2019.12.4+commit.2a1b6f55',
          value: 'v0.5.14-nightly.2019.12.4+commit.2a1b6f55',
        },
        {
          text: 'v0.5.14-nightly.2019.11.30+commit.4775af73',
          value: 'v0.5.14-nightly.2019.11.30+commit.4775af73',
        },
        {
          text: 'v0.5.14-nightly.2019.11.29+commit.7b038dbd',
          value: 'v0.5.14-nightly.2019.11.29+commit.7b038dbd',
        },
        {
          text: 'v0.5.14-nightly.2019.11.28+commit.40d9744b',
          value: 'v0.5.14-nightly.2019.11.28+commit.40d9744b',
        },
        {
          text: 'v0.5.14-nightly.2019.11.27+commit.87943bf4',
          value: 'v0.5.14-nightly.2019.11.27+commit.87943bf4',
        },
        {
          text: 'v0.5.14-nightly.2019.11.26+commit.200a92b4',
          value: 'v0.5.14-nightly.2019.11.26+commit.200a92b4',
        },
        {
          text: 'v0.5.14-nightly.2019.11.25+commit.c4622774',
          value: 'v0.5.14-nightly.2019.11.25+commit.c4622774',
        },
        {
          text: 'v0.5.14-nightly.2019.11.21+commit.9eac460c',
          value: 'v0.5.14-nightly.2019.11.21+commit.9eac460c',
        },
        {
          text: 'v0.5.14-nightly.2019.11.20+commit.7535039f',
          value: 'v0.5.14-nightly.2019.11.20+commit.7535039f',
        },
        {
          text: 'v0.5.14-nightly.2019.11.19+commit.e383b2bb',
          value: 'v0.5.14-nightly.2019.11.19+commit.e383b2bb',
        },
        {
          text: 'v0.5.14-nightly.2019.11.18+commit.79af19db',
          value: 'v0.5.14-nightly.2019.11.18+commit.79af19db',
        },
        {
          text: 'v0.5.14-nightly.2019.11.15+commit.6a993152',
          value: 'v0.5.14-nightly.2019.11.15+commit.6a993152',
        },
        {
          text: 'v0.5.14-nightly.2019.11.14+commit.3e04fd6e',
          value: 'v0.5.14-nightly.2019.11.14+commit.3e04fd6e',
        },
        { text: 'v0.5.13+commit.5b0b510c', value: 'v0.5.13+commit.5b0b510c' },
        {
          text: 'v0.5.13-nightly.2019.11.14+commit.d1c6ab8a',
          value: 'v0.5.13-nightly.2019.11.14+commit.d1c6ab8a',
        },
        {
          text: 'v0.5.13-nightly.2019.11.13+commit.6bef3071',
          value: 'v0.5.13-nightly.2019.11.13+commit.6bef3071',
        },
        {
          text: 'v0.5.13-nightly.2019.11.12+commit.52a9de83',
          value: 'v0.5.13-nightly.2019.11.12+commit.52a9de83',
        },
        {
          text: 'v0.5.13-nightly.2019.11.11+commit.7c7cca5f',
          value: 'v0.5.13-nightly.2019.11.11+commit.7c7cca5f',
        },
        {
          text: 'v0.5.13-nightly.2019.11.10+commit.a5f0422d',
          value: 'v0.5.13-nightly.2019.11.10+commit.a5f0422d',
        },
        {
          text: 'v0.5.13-nightly.2019.11.8+commit.78be9385',
          value: 'v0.5.13-nightly.2019.11.8+commit.78be9385',
        },
        {
          text: 'v0.5.13-nightly.2019.11.7+commit.37c6ab4c',
          value: 'v0.5.13-nightly.2019.11.7+commit.37c6ab4c',
        },
        {
          text: 'v0.5.13-nightly.2019.11.6+commit.56a3abcd',
          value: 'v0.5.13-nightly.2019.11.6+commit.56a3abcd',
        },
        {
          text: 'v0.5.13-nightly.2019.11.5+commit.9bec5334',
          value: 'v0.5.13-nightly.2019.11.5+commit.9bec5334',
        },
        {
          text: 'v0.5.13-nightly.2019.11.4+commit.26c6a1fc',
          value: 'v0.5.13-nightly.2019.11.4+commit.26c6a1fc',
        },
        {
          text: 'v0.5.13-nightly.2019.11.1+commit.73954f16',
          value: 'v0.5.13-nightly.2019.11.1+commit.73954f16',
        },
        {
          text: 'v0.5.13-nightly.2019.10.31+commit.d932f2d0',
          value: 'v0.5.13-nightly.2019.10.31+commit.d932f2d0',
        },
        {
          text: 'v0.5.13-nightly.2019.10.29+commit.5d906cd5',
          value: 'v0.5.13-nightly.2019.10.29+commit.5d906cd5',
        },
        {
          text: 'v0.5.13-nightly.2019.10.28+commit.9eb08c0c',
          value: 'v0.5.13-nightly.2019.10.28+commit.9eb08c0c',
        },
        {
          text: 'v0.5.13-nightly.2019.10.25+commit.302a51a5',
          value: 'v0.5.13-nightly.2019.10.25+commit.302a51a5',
        },
        {
          text: 'v0.5.13-nightly.2019.10.24+commit.15e39f7d',
          value: 'v0.5.13-nightly.2019.10.24+commit.15e39f7d',
        },
        {
          text: 'v0.5.13-nightly.2019.10.23+commit.e56d1aa5',
          value: 'v0.5.13-nightly.2019.10.23+commit.e56d1aa5',
        },
        {
          text: 'v0.5.13-nightly.2019.10.22+commit.eca2b9bd',
          value: 'v0.5.13-nightly.2019.10.22+commit.eca2b9bd',
        },
        {
          text: 'v0.5.13-nightly.2019.10.18+commit.d5b2f347',
          value: 'v0.5.13-nightly.2019.10.18+commit.d5b2f347',
        },
        {
          text: 'v0.5.13-nightly.2019.10.17+commit.5ea1d90f',
          value: 'v0.5.13-nightly.2019.10.17+commit.5ea1d90f',
        },
        {
          text: 'v0.5.13-nightly.2019.10.16+commit.9ec8bcda',
          value: 'v0.5.13-nightly.2019.10.16+commit.9ec8bcda',
        },
        {
          text: 'v0.5.13-nightly.2019.10.15+commit.83bb1515',
          value: 'v0.5.13-nightly.2019.10.15+commit.83bb1515',
        },
        {
          text: 'v0.5.13-nightly.2019.10.4+commit.6cbcc379',
          value: 'v0.5.13-nightly.2019.10.4+commit.6cbcc379',
        },
        {
          text: 'v0.5.13-nightly.2019.10.2+commit.2d150b65',
          value: 'v0.5.13-nightly.2019.10.2+commit.2d150b65',
        },
        {
          text: 'v0.5.13-nightly.2019.10.1+commit.74d2b228',
          value: 'v0.5.13-nightly.2019.10.1+commit.74d2b228',
        },
        { text: 'v0.5.12+commit.7709ece9', value: 'v0.5.12+commit.7709ece9' },
        {
          text: 'v0.5.12-nightly.2019.10.1+commit.cbdc3bc1',
          value: 'v0.5.12-nightly.2019.10.1+commit.cbdc3bc1',
        },
        {
          text: 'v0.5.12-nightly.2019.9.30+commit.88476475',
          value: 'v0.5.12-nightly.2019.9.30+commit.88476475',
        },
        {
          text: 'v0.5.12-nightly.2019.9.24+commit.973e4ca9',
          value: 'v0.5.12-nightly.2019.9.24+commit.973e4ca9',
        },
        {
          text: 'v0.5.12-nightly.2019.9.23+commit.c4208a6a',
          value: 'v0.5.12-nightly.2019.9.23+commit.c4208a6a',
        },
        {
          text: 'v0.5.12-nightly.2019.9.19+commit.0478eb1e',
          value: 'v0.5.12-nightly.2019.9.19+commit.0478eb1e',
        },
        {
          text: 'v0.5.12-nightly.2019.9.17+commit.58f0f9db',
          value: 'v0.5.12-nightly.2019.9.17+commit.58f0f9db',
        },
        {
          text: 'v0.5.12-nightly.2019.9.16+commit.34a84f3a',
          value: 'v0.5.12-nightly.2019.9.16+commit.34a84f3a',
        },
        {
          text: 'v0.5.12-nightly.2019.9.13+commit.5d58c43a',
          value: 'v0.5.12-nightly.2019.9.13+commit.5d58c43a',
        },
        {
          text: 'v0.5.12-nightly.2019.9.12+commit.b747c267',
          value: 'v0.5.12-nightly.2019.9.12+commit.b747c267',
        },
        {
          text: 'v0.5.12-nightly.2019.9.11+commit.5063e537',
          value: 'v0.5.12-nightly.2019.9.11+commit.5063e537',
        },
        {
          text: 'v0.5.12-nightly.2019.9.10+commit.4452a9b6',
          value: 'v0.5.12-nightly.2019.9.10+commit.4452a9b6',
        },
        {
          text: 'v0.5.12-nightly.2019.9.9+commit.f5e976ce',
          value: 'v0.5.12-nightly.2019.9.9+commit.f5e976ce',
        },
        {
          text: 'v0.5.12-nightly.2019.9.6+commit.7e80fceb',
          value: 'v0.5.12-nightly.2019.9.6+commit.7e80fceb',
        },
        {
          text: 'v0.5.12-nightly.2019.9.5+commit.96980d0b',
          value: 'v0.5.12-nightly.2019.9.5+commit.96980d0b',
        },
        {
          text: 'v0.5.12-nightly.2019.9.4+commit.c5fbf23f',
          value: 'v0.5.12-nightly.2019.9.4+commit.c5fbf23f',
        },
        {
          text: 'v0.5.12-nightly.2019.9.3+commit.d1831b15',
          value: 'v0.5.12-nightly.2019.9.3+commit.d1831b15',
        },
        {
          text: 'v0.5.12-nightly.2019.9.2+commit.3c963eb0',
          value: 'v0.5.12-nightly.2019.9.2+commit.3c963eb0',
        },
        {
          text: 'v0.5.12-nightly.2019.8.29+commit.459aed90',
          value: 'v0.5.12-nightly.2019.8.29+commit.459aed90',
        },
        {
          text: 'v0.5.12-nightly.2019.8.28+commit.e74b63b6',
          value: 'v0.5.12-nightly.2019.8.28+commit.e74b63b6',
        },
        {
          text: 'v0.5.12-nightly.2019.8.26+commit.e1bb4b9f',
          value: 'v0.5.12-nightly.2019.8.26+commit.e1bb4b9f',
        },
        {
          text: 'v0.5.12-nightly.2019.8.24+commit.bb104546',
          value: 'v0.5.12-nightly.2019.8.24+commit.bb104546',
        },
        {
          text: 'v0.5.12-nightly.2019.8.23+commit.b5048bd6',
          value: 'v0.5.12-nightly.2019.8.23+commit.b5048bd6',
        },
        {
          text: 'v0.5.12-nightly.2019.8.19+commit.a39d26f3',
          value: 'v0.5.12-nightly.2019.8.19+commit.a39d26f3',
        },
        {
          text: 'v0.5.12-nightly.2019.8.16+commit.058bbd39',
          value: 'v0.5.12-nightly.2019.8.16+commit.058bbd39',
        },
        {
          text: 'v0.5.12-nightly.2019.8.15+commit.2508cbc1',
          value: 'v0.5.12-nightly.2019.8.15+commit.2508cbc1',
        },
        {
          text: 'v0.5.12-nightly.2019.8.14+commit.fb8137df',
          value: 'v0.5.12-nightly.2019.8.14+commit.fb8137df',
        },
        {
          text: 'v0.5.12-nightly.2019.8.13+commit.a6cbc3b8',
          value: 'v0.5.12-nightly.2019.8.13+commit.a6cbc3b8',
        },
        { text: 'v0.5.11+commit.22be8592', value: 'v0.5.11+commit.22be8592' },
        { text: 'v0.5.11+commit.c082d0b4', value: 'v0.5.11+commit.c082d0b4' },
        {
          text: 'v0.5.11-nightly.2019.8.12+commit.b285e086',
          value: 'v0.5.11-nightly.2019.8.12+commit.b285e086',
        },
        {
          text: 'v0.5.11-nightly.2019.8.10+commit.f5f2bbb2',
          value: 'v0.5.11-nightly.2019.8.10+commit.f5f2bbb2',
        },
        {
          text: 'v0.5.11-nightly.2019.8.9+commit.682a3ece',
          value: 'v0.5.11-nightly.2019.8.9+commit.682a3ece',
        },
        {
          text: 'v0.5.11-nightly.2019.8.8+commit.16efcfdb',
          value: 'v0.5.11-nightly.2019.8.8+commit.16efcfdb',
        },
        {
          text: 'v0.5.11-nightly.2019.8.7+commit.6166dc8e',
          value: 'v0.5.11-nightly.2019.8.7+commit.6166dc8e',
        },
        {
          text: 'v0.5.11-nightly.2019.8.6+commit.cd563e52',
          value: 'v0.5.11-nightly.2019.8.6+commit.cd563e52',
        },
        {
          text: 'v0.5.11-nightly.2019.8.5+commit.29d47d5c',
          value: 'v0.5.11-nightly.2019.8.5+commit.29d47d5c',
        },
        {
          text: 'v0.5.11-nightly.2019.8.2+commit.967ee944',
          value: 'v0.5.11-nightly.2019.8.2+commit.967ee944',
        },
        {
          text: 'v0.5.11-nightly.2019.8.1+commit.aa87a607',
          value: 'v0.5.11-nightly.2019.8.1+commit.aa87a607',
        },
        {
          text: 'v0.5.11-nightly.2019.7.31+commit.32e6e356',
          value: 'v0.5.11-nightly.2019.7.31+commit.32e6e356',
        },
        {
          text: 'v0.5.11-nightly.2019.7.30+commit.092e62f1',
          value: 'v0.5.11-nightly.2019.7.30+commit.092e62f1',
        },
        {
          text: 'v0.5.11-nightly.2019.7.29+commit.2fdc07c5',
          value: 'v0.5.11-nightly.2019.7.29+commit.2fdc07c5',
        },
        {
          text: 'v0.5.11-nightly.2019.7.25+commit.4f7fec69',
          value: 'v0.5.11-nightly.2019.7.25+commit.4f7fec69',
        },
        {
          text: 'v0.5.11-nightly.2019.7.23+commit.14699340',
          value: 'v0.5.11-nightly.2019.7.23+commit.14699340',
        },
        {
          text: 'v0.5.11-nightly.2019.7.22+commit.535553b5',
          value: 'v0.5.11-nightly.2019.7.22+commit.535553b5',
        },
        {
          text: 'v0.5.11-nightly.2019.7.19+commit.508cf66d',
          value: 'v0.5.11-nightly.2019.7.19+commit.508cf66d',
        },
        {
          text: 'v0.5.11-nightly.2019.7.18+commit.1d673a3b',
          value: 'v0.5.11-nightly.2019.7.18+commit.1d673a3b',
        },
        {
          text: 'v0.5.11-nightly.2019.7.17+commit.4fa78004',
          value: 'v0.5.11-nightly.2019.7.17+commit.4fa78004',
        },
        {
          text: 'v0.5.11-nightly.2019.7.16+commit.a5a7983a',
          value: 'v0.5.11-nightly.2019.7.16+commit.a5a7983a',
        },
        {
          text: 'v0.5.11-nightly.2019.7.11+commit.88477bdb',
          value: 'v0.5.11-nightly.2019.7.11+commit.88477bdb',
        },
        {
          text: 'v0.5.11-nightly.2019.7.10+commit.ba922e76',
          value: 'v0.5.11-nightly.2019.7.10+commit.ba922e76',
        },
        {
          text: 'v0.5.11-nightly.2019.7.9+commit.8d006d20',
          value: 'v0.5.11-nightly.2019.7.9+commit.8d006d20',
        },
        {
          text: 'v0.5.11-nightly.2019.7.8+commit.25928767',
          value: 'v0.5.11-nightly.2019.7.8+commit.25928767',
        },
        {
          text: 'v0.5.11-nightly.2019.7.4+commit.3b2ebba4',
          value: 'v0.5.11-nightly.2019.7.4+commit.3b2ebba4',
        },
        {
          text: 'v0.5.11-nightly.2019.7.3+commit.c3c8bc09',
          value: 'v0.5.11-nightly.2019.7.3+commit.c3c8bc09',
        },
        {
          text: 'v0.5.11-nightly.2019.7.2+commit.06d01d15',
          value: 'v0.5.11-nightly.2019.7.2+commit.06d01d15',
        },
        {
          text: 'v0.5.11-nightly.2019.7.1+commit.b8dbf7d2',
          value: 'v0.5.11-nightly.2019.7.1+commit.b8dbf7d2',
        },
        {
          text: 'v0.5.11-nightly.2019.6.27+commit.3597de35',
          value: 'v0.5.11-nightly.2019.6.27+commit.3597de35',
        },
        {
          text: 'v0.5.11-nightly.2019.6.26+commit.b4a0a793',
          value: 'v0.5.11-nightly.2019.6.26+commit.b4a0a793',
        },
        {
          text: 'v0.5.11-nightly.2019.6.25+commit.1cc84753',
          value: 'v0.5.11-nightly.2019.6.25+commit.1cc84753',
        },
        { text: 'v0.5.10+commit.5a6ea5b1', value: 'v0.5.10+commit.5a6ea5b1' },
        {
          text: 'v0.5.10-nightly.2019.6.25+commit.92529068',
          value: 'v0.5.10-nightly.2019.6.25+commit.92529068',
        },
        {
          text: 'v0.5.10-nightly.2019.6.24+commit.eb5b8298',
          value: 'v0.5.10-nightly.2019.6.24+commit.eb5b8298',
        },
        {
          text: 'v0.5.10-nightly.2019.6.20+commit.096e3fcd',
          value: 'v0.5.10-nightly.2019.6.20+commit.096e3fcd',
        },
        {
          text: 'v0.5.10-nightly.2019.6.19+commit.53f26d97',
          value: 'v0.5.10-nightly.2019.6.19+commit.53f26d97',
        },
        {
          text: 'v0.5.10-nightly.2019.6.18+commit.b6695071',
          value: 'v0.5.10-nightly.2019.6.18+commit.b6695071',
        },
        {
          text: 'v0.5.10-nightly.2019.6.17+commit.9c5dc63e',
          value: 'v0.5.10-nightly.2019.6.17+commit.9c5dc63e',
        },
        {
          text: 'v0.5.10-nightly.2019.6.14+commit.4aa0c9e0',
          value: 'v0.5.10-nightly.2019.6.14+commit.4aa0c9e0',
        },
        {
          text: 'v0.5.10-nightly.2019.6.13+commit.62bd7032',
          value: 'v0.5.10-nightly.2019.6.13+commit.62bd7032',
        },
        {
          text: 'v0.5.10-nightly.2019.6.12+commit.502d22a2',
          value: 'v0.5.10-nightly.2019.6.12+commit.502d22a2',
        },
        {
          text: 'v0.5.10-nightly.2019.6.11+commit.bd1f65d6',
          value: 'v0.5.10-nightly.2019.6.11+commit.bd1f65d6',
        },
        {
          text: 'v0.5.10-nightly.2019.6.7+commit.dc085bb8',
          value: 'v0.5.10-nightly.2019.6.7+commit.dc085bb8',
        },
        {
          text: 'v0.5.10-nightly.2019.6.6+commit.fc35c139',
          value: 'v0.5.10-nightly.2019.6.6+commit.fc35c139',
        },
        {
          text: 'v0.5.10-nightly.2019.6.5+commit.3a331639',
          value: 'v0.5.10-nightly.2019.6.5+commit.3a331639',
        },
        {
          text: 'v0.5.10-nightly.2019.6.4+commit.95e6b2e4',
          value: 'v0.5.10-nightly.2019.6.4+commit.95e6b2e4',
        },
        {
          text: 'v0.5.10-nightly.2019.5.30+commit.dd04a35c',
          value: 'v0.5.10-nightly.2019.5.30+commit.dd04a35c',
        },
        {
          text: 'v0.5.10-nightly.2019.5.29+commit.c9e2d388',
          value: 'v0.5.10-nightly.2019.5.29+commit.c9e2d388',
        },
        {
          text: 'v0.5.10-nightly.2019.5.28+commit.ff8898b8',
          value: 'v0.5.10-nightly.2019.5.28+commit.ff8898b8',
        },
        { text: 'v0.5.9+commit.c68bc34e', value: 'v0.5.9+commit.c68bc34e' },
        { text: 'v0.5.9+commit.e560f70d', value: 'v0.5.9+commit.e560f70d' },
        {
          text: 'v0.5.9-nightly.2019.5.28+commit.01b6b680',
          value: 'v0.5.9-nightly.2019.5.28+commit.01b6b680',
        },
        {
          text: 'v0.5.9-nightly.2019.5.27+commit.c14279fc',
          value: 'v0.5.9-nightly.2019.5.27+commit.c14279fc',
        },
        {
          text: 'v0.5.9-nightly.2019.5.24+commit.2a2cea08',
          value: 'v0.5.9-nightly.2019.5.24+commit.2a2cea08',
        },
        {
          text: 'v0.5.9-nightly.2019.5.23+commit.7cf51876',
          value: 'v0.5.9-nightly.2019.5.23+commit.7cf51876',
        },
        {
          text: 'v0.5.9-nightly.2019.5.22+commit.f06582f9',
          value: 'v0.5.9-nightly.2019.5.22+commit.f06582f9',
        },
        {
          text: 'v0.5.9-nightly.2019.5.21+commit.0e132d07',
          value: 'v0.5.9-nightly.2019.5.21+commit.0e132d07',
        },
        {
          text: 'v0.5.9-nightly.2019.5.20+commit.0731abd3',
          value: 'v0.5.9-nightly.2019.5.20+commit.0731abd3',
        },
        {
          text: 'v0.5.9-nightly.2019.5.17+commit.88e9fbe6',
          value: 'v0.5.9-nightly.2019.5.17+commit.88e9fbe6',
        },
        {
          text: 'v0.5.9-nightly.2019.5.16+commit.46d6f395',
          value: 'v0.5.9-nightly.2019.5.16+commit.46d6f395',
        },
        {
          text: 'v0.5.9-nightly.2019.5.15+commit.a10501bb',
          value: 'v0.5.9-nightly.2019.5.15+commit.a10501bb',
        },
        {
          text: 'v0.5.9-nightly.2019.5.14+commit.563aec1d',
          value: 'v0.5.9-nightly.2019.5.14+commit.563aec1d',
        },
        {
          text: 'v0.5.9-nightly.2019.5.13+commit.a28b6224',
          value: 'v0.5.9-nightly.2019.5.13+commit.a28b6224',
        },
        {
          text: 'v0.5.9-nightly.2019.5.10+commit.661b08e1',
          value: 'v0.5.9-nightly.2019.5.10+commit.661b08e1',
        },
        {
          text: 'v0.5.9-nightly.2019.5.9+commit.8f2c8daf',
          value: 'v0.5.9-nightly.2019.5.9+commit.8f2c8daf',
        },
        {
          text: 'v0.5.9-nightly.2019.5.8+commit.97f16421',
          value: 'v0.5.9-nightly.2019.5.8+commit.97f16421',
        },
        {
          text: 'v0.5.9-nightly.2019.5.7+commit.a21f8a0b',
          value: 'v0.5.9-nightly.2019.5.7+commit.a21f8a0b',
        },
        {
          text: 'v0.5.9-nightly.2019.5.6+commit.dee1c110',
          value: 'v0.5.9-nightly.2019.5.6+commit.dee1c110',
        },
        {
          text: 'v0.5.9-nightly.2019.5.2+commit.90f2fe6f',
          value: 'v0.5.9-nightly.2019.5.2+commit.90f2fe6f',
        },
        {
          text: 'v0.5.9-nightly.2019.4.30+commit.b6bcd8a1',
          value: 'v0.5.9-nightly.2019.4.30+commit.b6bcd8a1',
        },
        { text: 'v0.5.8+commit.23d335f2', value: 'v0.5.8+commit.23d335f2' },
        {
          text: 'v0.5.8-nightly.2019.4.30+commit.0dc461b9',
          value: 'v0.5.8-nightly.2019.4.30+commit.0dc461b9',
        },
        {
          text: 'v0.5.8-nightly.2019.4.29+commit.578d6180',
          value: 'v0.5.8-nightly.2019.4.29+commit.578d6180',
        },
        {
          text: 'v0.5.8-nightly.2019.4.25+commit.eea425a3',
          value: 'v0.5.8-nightly.2019.4.25+commit.eea425a3',
        },
        {
          text: 'v0.5.8-nightly.2019.4.24+commit.f124bace',
          value: 'v0.5.8-nightly.2019.4.24+commit.f124bace',
        },
        {
          text: 'v0.5.8-nightly.2019.4.23+commit.13518820',
          value: 'v0.5.8-nightly.2019.4.23+commit.13518820',
        },
        {
          text: 'v0.5.8-nightly.2019.4.18+commit.fce19bde',
          value: 'v0.5.8-nightly.2019.4.18+commit.fce19bde',
        },
        {
          text: 'v0.5.8-nightly.2019.4.17+commit.1feefa1c',
          value: 'v0.5.8-nightly.2019.4.17+commit.1feefa1c',
        },
        {
          text: 'v0.5.8-nightly.2019.4.16+commit.a61931c5',
          value: 'v0.5.8-nightly.2019.4.16+commit.a61931c5',
        },
        {
          text: 'v0.5.8-nightly.2019.4.15+commit.e4e786a9',
          value: 'v0.5.8-nightly.2019.4.15+commit.e4e786a9',
        },
        {
          text: 'v0.5.8-nightly.2019.4.14+commit.6c68904f',
          value: 'v0.5.8-nightly.2019.4.14+commit.6c68904f',
        },
        {
          text: 'v0.5.8-nightly.2019.4.12+commit.31abeb99',
          value: 'v0.5.8-nightly.2019.4.12+commit.31abeb99',
        },
        {
          text: 'v0.5.8-nightly.2019.4.11+commit.e97d4b4a',
          value: 'v0.5.8-nightly.2019.4.11+commit.e97d4b4a',
        },
        {
          text: 'v0.5.8-nightly.2019.4.10+commit.9eaaf42c',
          value: 'v0.5.8-nightly.2019.4.10+commit.9eaaf42c',
        },
        {
          text: 'v0.5.8-nightly.2019.4.5+commit.9ef84df4',
          value: 'v0.5.8-nightly.2019.4.5+commit.9ef84df4',
        },
        {
          text: 'v0.5.8-nightly.2019.4.4+commit.ee2f5662',
          value: 'v0.5.8-nightly.2019.4.4+commit.ee2f5662',
        },
        {
          text: 'v0.5.8-nightly.2019.4.3+commit.1b7878cf',
          value: 'v0.5.8-nightly.2019.4.3+commit.1b7878cf',
        },
        {
          text: 'v0.5.8-nightly.2019.4.2+commit.7b0f7eb1',
          value: 'v0.5.8-nightly.2019.4.2+commit.7b0f7eb1',
        },
        {
          text: 'v0.5.8-nightly.2019.4.1+commit.a3a60b8e',
          value: 'v0.5.8-nightly.2019.4.1+commit.a3a60b8e',
        },
        {
          text: 'v0.5.8-nightly.2019.3.29+commit.91a54f9b',
          value: 'v0.5.8-nightly.2019.3.29+commit.91a54f9b',
        },
        {
          text: 'v0.5.8-nightly.2019.3.28+commit.2bbc41ad',
          value: 'v0.5.8-nightly.2019.3.28+commit.2bbc41ad',
        },
        {
          text: 'v0.5.8-nightly.2019.3.27+commit.97818f65',
          value: 'v0.5.8-nightly.2019.3.27+commit.97818f65',
        },
        {
          text: 'v0.5.8-nightly.2019.3.26+commit.b85fc1a6',
          value: 'v0.5.8-nightly.2019.3.26+commit.b85fc1a6',
        },
        { text: 'v0.5.7+commit.6da8b019', value: 'v0.5.7+commit.6da8b019' },
        {
          text: 'v0.5.7-nightly.2019.3.26+commit.d079cdbf',
          value: 'v0.5.7-nightly.2019.3.26+commit.d079cdbf',
        },
        {
          text: 'v0.5.7-nightly.2019.3.25+commit.99ed3a64',
          value: 'v0.5.7-nightly.2019.3.25+commit.99ed3a64',
        },
        {
          text: 'v0.5.7-nightly.2019.3.22+commit.0af47da1',
          value: 'v0.5.7-nightly.2019.3.22+commit.0af47da1',
        },
        {
          text: 'v0.5.7-nightly.2019.3.21+commit.ebb8c175',
          value: 'v0.5.7-nightly.2019.3.21+commit.ebb8c175',
        },
        {
          text: 'v0.5.7-nightly.2019.3.20+commit.5245a66d',
          value: 'v0.5.7-nightly.2019.3.20+commit.5245a66d',
        },
        {
          text: 'v0.5.7-nightly.2019.3.19+commit.c7824932',
          value: 'v0.5.7-nightly.2019.3.19+commit.c7824932',
        },
        {
          text: 'v0.5.7-nightly.2019.3.18+commit.5b5c9aa2',
          value: 'v0.5.7-nightly.2019.3.18+commit.5b5c9aa2',
        },
        {
          text: 'v0.5.7-nightly.2019.3.14+commit.d1d6d59c',
          value: 'v0.5.7-nightly.2019.3.14+commit.d1d6d59c',
        },
        {
          text: 'v0.5.7-nightly.2019.3.13+commit.2da906d9',
          value: 'v0.5.7-nightly.2019.3.13+commit.2da906d9',
        },
        { text: 'v0.5.6+commit.b259423e', value: 'v0.5.6+commit.b259423e' },
        {
          text: 'v0.5.6-nightly.2019.3.13+commit.9ccd5dfe',
          value: 'v0.5.6-nightly.2019.3.13+commit.9ccd5dfe',
        },
        {
          text: 'v0.5.6-nightly.2019.3.12+commit.2f37cd09',
          value: 'v0.5.6-nightly.2019.3.12+commit.2f37cd09',
        },
        {
          text: 'v0.5.6-nightly.2019.3.11+commit.189983a1',
          value: 'v0.5.6-nightly.2019.3.11+commit.189983a1',
        },
        { text: 'v0.5.5+commit.47a71e8f', value: 'v0.5.5+commit.47a71e8f' },
        {
          text: 'v0.5.5-nightly.2019.3.5+commit.c283f6d8',
          value: 'v0.5.5-nightly.2019.3.5+commit.c283f6d8',
        },
        {
          text: 'v0.5.5-nightly.2019.3.4+commit.5490a5cd',
          value: 'v0.5.5-nightly.2019.3.4+commit.5490a5cd',
        },
        {
          text: 'v0.5.5-nightly.2019.2.28+commit.e9543d83',
          value: 'v0.5.5-nightly.2019.2.28+commit.e9543d83',
        },
        {
          text: 'v0.5.5-nightly.2019.2.27+commit.a0dcb36f',
          value: 'v0.5.5-nightly.2019.2.27+commit.a0dcb36f',
        },
        {
          text: 'v0.5.5-nightly.2019.2.26+commit.472a6445',
          value: 'v0.5.5-nightly.2019.2.26+commit.472a6445',
        },
        {
          text: 'v0.5.5-nightly.2019.2.25+commit.52ee955f',
          value: 'v0.5.5-nightly.2019.2.25+commit.52ee955f',
        },
        {
          text: 'v0.5.5-nightly.2019.2.21+commit.e7a8fed0',
          value: 'v0.5.5-nightly.2019.2.21+commit.e7a8fed0',
        },
        {
          text: 'v0.5.5-nightly.2019.2.20+commit.c8fb2c1b',
          value: 'v0.5.5-nightly.2019.2.20+commit.c8fb2c1b',
        },
        {
          text: 'v0.5.5-nightly.2019.2.19+commit.d9e4a10d',
          value: 'v0.5.5-nightly.2019.2.19+commit.d9e4a10d',
        },
        {
          text: 'v0.5.5-nightly.2019.2.18+commit.db7b38e3',
          value: 'v0.5.5-nightly.2019.2.18+commit.db7b38e3',
        },
        {
          text: 'v0.5.5-nightly.2019.2.16+commit.2f0926c3',
          value: 'v0.5.5-nightly.2019.2.16+commit.2f0926c3',
        },
        {
          text: 'v0.5.5-nightly.2019.2.15+commit.04081303',
          value: 'v0.5.5-nightly.2019.2.15+commit.04081303',
        },
        {
          text: 'v0.5.5-nightly.2019.2.14+commit.33318249',
          value: 'v0.5.5-nightly.2019.2.14+commit.33318249',
        },
        {
          text: 'v0.5.5-nightly.2019.2.13+commit.b1a5ffb9',
          value: 'v0.5.5-nightly.2019.2.13+commit.b1a5ffb9',
        },
        {
          text: 'v0.5.5-nightly.2019.2.12+commit.828255fa',
          value: 'v0.5.5-nightly.2019.2.12+commit.828255fa',
        },
        { text: 'v0.5.4+commit.9549d8ff', value: 'v0.5.4+commit.9549d8ff' },
        {
          text: 'v0.5.4-nightly.2019.2.12+commit.f0f34984',
          value: 'v0.5.4-nightly.2019.2.12+commit.f0f34984',
        },
        {
          text: 'v0.5.4-nightly.2019.2.11+commit.49cd55d3',
          value: 'v0.5.4-nightly.2019.2.11+commit.49cd55d3',
        },
        {
          text: 'v0.5.4-nightly.2019.2.7+commit.caecdfab',
          value: 'v0.5.4-nightly.2019.2.7+commit.caecdfab',
        },
        {
          text: 'v0.5.4-nightly.2019.2.6+commit.e5bf1f1d',
          value: 'v0.5.4-nightly.2019.2.6+commit.e5bf1f1d',
        },
        {
          text: 'v0.5.4-nightly.2019.2.5+commit.f3c9b41f',
          value: 'v0.5.4-nightly.2019.2.5+commit.f3c9b41f',
        },
        {
          text: 'v0.5.4-nightly.2019.2.4+commit.82b69963',
          value: 'v0.5.4-nightly.2019.2.4+commit.82b69963',
        },
        {
          text: 'v0.5.4-nightly.2019.1.31+commit.ddab3f06',
          value: 'v0.5.4-nightly.2019.1.31+commit.ddab3f06',
        },
        {
          text: 'v0.5.4-nightly.2019.1.30+commit.bf3968d6',
          value: 'v0.5.4-nightly.2019.1.30+commit.bf3968d6',
        },
        {
          text: 'v0.5.4-nightly.2019.1.29+commit.ebf503a6',
          value: 'v0.5.4-nightly.2019.1.29+commit.ebf503a6',
        },
        {
          text: 'v0.5.4-nightly.2019.1.28+commit.e6d102f2',
          value: 'v0.5.4-nightly.2019.1.28+commit.e6d102f2',
        },
        {
          text: 'v0.5.4-nightly.2019.1.26+commit.0ef45b28',
          value: 'v0.5.4-nightly.2019.1.26+commit.0ef45b28',
        },
        {
          text: 'v0.5.4-nightly.2019.1.24+commit.2e7274b4',
          value: 'v0.5.4-nightly.2019.1.24+commit.2e7274b4',
        },
        {
          text: 'v0.5.4-nightly.2019.1.23+commit.ea292393',
          value: 'v0.5.4-nightly.2019.1.23+commit.ea292393',
        },
        {
          text: 'v0.5.4-nightly.2019.1.22+commit.26c06550',
          value: 'v0.5.4-nightly.2019.1.22+commit.26c06550',
        },
        { text: 'v0.5.3+commit.10d17f24', value: 'v0.5.3+commit.10d17f24' },
        {
          text: 'v0.5.3-nightly.2019.1.22+commit.d87d9a26',
          value: 'v0.5.3-nightly.2019.1.22+commit.d87d9a26',
        },
        {
          text: 'v0.5.3-nightly.2019.1.21+commit.606c2b99',
          value: 'v0.5.3-nightly.2019.1.21+commit.606c2b99',
        },
        {
          text: 'v0.5.3-nightly.2019.1.19+commit.d3270bc3',
          value: 'v0.5.3-nightly.2019.1.19+commit.d3270bc3',
        },
        {
          text: 'v0.5.3-nightly.2019.1.18+commit.7b759866',
          value: 'v0.5.3-nightly.2019.1.18+commit.7b759866',
        },
        {
          text: 'v0.5.3-nightly.2019.1.17+commit.49f74a7b',
          value: 'v0.5.3-nightly.2019.1.17+commit.49f74a7b',
        },
        {
          text: 'v0.5.3-nightly.2019.1.16+commit.82453a76',
          value: 'v0.5.3-nightly.2019.1.16+commit.82453a76',
        },
        {
          text: 'v0.5.3-nightly.2019.1.15+commit.6146c59a',
          value: 'v0.5.3-nightly.2019.1.15+commit.6146c59a',
        },
        {
          text: 'v0.5.3-nightly.2019.1.14+commit.051df319',
          value: 'v0.5.3-nightly.2019.1.14+commit.051df319',
        },
        {
          text: 'v0.5.3-nightly.2019.1.11+commit.94688d2f',
          value: 'v0.5.3-nightly.2019.1.11+commit.94688d2f',
        },
        {
          text: 'v0.5.3-nightly.2019.1.10+commit.31033fb4',
          value: 'v0.5.3-nightly.2019.1.10+commit.31033fb4',
        },
        {
          text: 'v0.5.3-nightly.2019.1.9+commit.63319cfd',
          value: 'v0.5.3-nightly.2019.1.9+commit.63319cfd',
        },
        {
          text: 'v0.5.3-nightly.2019.1.8+commit.a0ca746c',
          value: 'v0.5.3-nightly.2019.1.8+commit.a0ca746c',
        },
        {
          text: 'v0.5.3-nightly.2019.1.7+commit.f3799034',
          value: 'v0.5.3-nightly.2019.1.7+commit.f3799034',
        },
        {
          text: 'v0.5.3-nightly.2019.1.3+commit.d597b1db',
          value: 'v0.5.3-nightly.2019.1.3+commit.d597b1db',
        },
        {
          text: 'v0.5.3-nightly.2018.12.20+commit.245ec29c',
          value: 'v0.5.3-nightly.2018.12.20+commit.245ec29c',
        },
        { text: 'v0.5.2+commit.1df8f40c', value: 'v0.5.2+commit.1df8f40c' },
        {
          text: 'v0.5.2-nightly.2018.12.19+commit.88750920',
          value: 'v0.5.2-nightly.2018.12.19+commit.88750920',
        },
        {
          text: 'v0.5.2-nightly.2018.12.18+commit.4b43aeca',
          value: 'v0.5.2-nightly.2018.12.18+commit.4b43aeca',
        },
        {
          text: 'v0.5.2-nightly.2018.12.17+commit.12874029',
          value: 'v0.5.2-nightly.2018.12.17+commit.12874029',
        },
        {
          text: 'v0.5.2-nightly.2018.12.13+commit.b3e2ba15',
          value: 'v0.5.2-nightly.2018.12.13+commit.b3e2ba15',
        },
        {
          text: 'v0.5.2-nightly.2018.12.12+commit.85291bcb',
          value: 'v0.5.2-nightly.2018.12.12+commit.85291bcb',
        },
        {
          text: 'v0.5.2-nightly.2018.12.11+commit.599760b6',
          value: 'v0.5.2-nightly.2018.12.11+commit.599760b6',
        },
        {
          text: 'v0.5.2-nightly.2018.12.10+commit.6240d9e7',
          value: 'v0.5.2-nightly.2018.12.10+commit.6240d9e7',
        },
        {
          text: 'v0.5.2-nightly.2018.12.7+commit.52ff3c94',
          value: 'v0.5.2-nightly.2018.12.7+commit.52ff3c94',
        },
        {
          text: 'v0.5.2-nightly.2018.12.6+commit.5a08ae5e',
          value: 'v0.5.2-nightly.2018.12.6+commit.5a08ae5e',
        },
        {
          text: 'v0.5.2-nightly.2018.12.5+commit.6efe2a52',
          value: 'v0.5.2-nightly.2018.12.5+commit.6efe2a52',
        },
        {
          text: 'v0.5.2-nightly.2018.12.4+commit.e49f37be',
          value: 'v0.5.2-nightly.2018.12.4+commit.e49f37be',
        },
        {
          text: 'v0.5.2-nightly.2018.12.3+commit.e6a01d26',
          value: 'v0.5.2-nightly.2018.12.3+commit.e6a01d26',
        },
        { text: 'v0.5.1+commit.c8a2cb62', value: 'v0.5.1+commit.c8a2cb62' },
        {
          text: 'v0.5.1-nightly.2018.12.3+commit.a73df9bc',
          value: 'v0.5.1-nightly.2018.12.3+commit.a73df9bc',
        },
        {
          text: 'v0.5.1-nightly.2018.11.30+commit.a7ca4991',
          value: 'v0.5.1-nightly.2018.11.30+commit.a7ca4991',
        },
        {
          text: 'v0.5.1-nightly.2018.11.29+commit.f6d01323',
          value: 'v0.5.1-nightly.2018.11.29+commit.f6d01323',
        },
        {
          text: 'v0.5.1-nightly.2018.11.28+commit.7cbf0468',
          value: 'v0.5.1-nightly.2018.11.28+commit.7cbf0468',
        },
        {
          text: 'v0.5.1-nightly.2018.11.27+commit.bc7cb301',
          value: 'v0.5.1-nightly.2018.11.27+commit.bc7cb301',
        },
        {
          text: 'v0.5.1-nightly.2018.11.26+commit.f9378967',
          value: 'v0.5.1-nightly.2018.11.26+commit.f9378967',
        },
        {
          text: 'v0.5.1-nightly.2018.11.25+commit.1e03c160',
          value: 'v0.5.1-nightly.2018.11.25+commit.1e03c160',
        },
        {
          text: 'v0.5.1-nightly.2018.11.23+commit.616ef8bc',
          value: 'v0.5.1-nightly.2018.11.23+commit.616ef8bc',
        },
        {
          text: 'v0.5.1-nightly.2018.11.22+commit.dc748bc7',
          value: 'v0.5.1-nightly.2018.11.22+commit.dc748bc7',
        },
        {
          text: 'v0.5.1-nightly.2018.11.21+commit.2c6e1888',
          value: 'v0.5.1-nightly.2018.11.21+commit.2c6e1888',
        },
        {
          text: 'v0.5.1-nightly.2018.11.19+commit.d3f66ca0',
          value: 'v0.5.1-nightly.2018.11.19+commit.d3f66ca0',
        },
        {
          text: 'v0.5.1-nightly.2018.11.17+commit.5be45e73',
          value: 'v0.5.1-nightly.2018.11.17+commit.5be45e73',
        },
        {
          text: 'v0.5.1-nightly.2018.11.15+commit.9db76403',
          value: 'v0.5.1-nightly.2018.11.15+commit.9db76403',
        },
        {
          text: 'v0.5.1-nightly.2018.11.14+commit.10d99fc3',
          value: 'v0.5.1-nightly.2018.11.14+commit.10d99fc3',
        },
        {
          text: 'v0.5.1-nightly.2018.11.13+commit.74ede87a',
          value: 'v0.5.1-nightly.2018.11.13+commit.74ede87a',
        },
        { text: 'v0.5.0+commit.1d4f565a', value: 'v0.5.0+commit.1d4f565a' },
        {
          text: 'v0.5.0-nightly.2018.11.13+commit.ac980fb8',
          value: 'v0.5.0-nightly.2018.11.13+commit.ac980fb8',
        },
        {
          text: 'v0.5.0-nightly.2018.11.12+commit.09f8ff27',
          value: 'v0.5.0-nightly.2018.11.12+commit.09f8ff27',
        },
        {
          text: 'v0.5.0-nightly.2018.11.11+commit.405565db',
          value: 'v0.5.0-nightly.2018.11.11+commit.405565db',
        },
        {
          text: 'v0.5.0-nightly.2018.11.9+commit.9709dfe0',
          value: 'v0.5.0-nightly.2018.11.9+commit.9709dfe0',
        },
        {
          text: 'v0.5.0-nightly.2018.11.8+commit.cc2de07b',
          value: 'v0.5.0-nightly.2018.11.8+commit.cc2de07b',
        },
        {
          text: 'v0.5.0-nightly.2018.11.7+commit.a459b8c8',
          value: 'v0.5.0-nightly.2018.11.7+commit.a459b8c8',
        },
        {
          text: 'v0.5.0-nightly.2018.11.5+commit.88aee34c',
          value: 'v0.5.0-nightly.2018.11.5+commit.88aee34c',
        },
        {
          text: 'v0.5.0-nightly.2018.11.4+commit.e4da724f',
          value: 'v0.5.0-nightly.2018.11.4+commit.e4da724f',
        },
        {
          text: 'v0.5.0-nightly.2018.10.30+commit.cbbbc0d5',
          value: 'v0.5.0-nightly.2018.10.30+commit.cbbbc0d5',
        },
        {
          text: 'v0.5.0-nightly.2018.10.29+commit.0b4f6ab7',
          value: 'v0.5.0-nightly.2018.10.29+commit.0b4f6ab7',
        },
        {
          text: 'v0.5.0-nightly.2018.10.28+commit.c338b422',
          value: 'v0.5.0-nightly.2018.10.28+commit.c338b422',
        },
        {
          text: 'v0.5.0-nightly.2018.10.26+commit.c8400353',
          value: 'v0.5.0-nightly.2018.10.26+commit.c8400353',
        },
        {
          text: 'v0.5.0-nightly.2018.10.25+commit.f714b0dd',
          value: 'v0.5.0-nightly.2018.10.25+commit.f714b0dd',
        },
        {
          text: 'v0.5.0-nightly.2018.10.24+commit.01566c2e',
          value: 'v0.5.0-nightly.2018.10.24+commit.01566c2e',
        },
        {
          text: 'v0.5.0-nightly.2018.10.23+commit.f5f977ea',
          value: 'v0.5.0-nightly.2018.10.23+commit.f5f977ea',
        },
        {
          text: 'v0.5.0-nightly.2018.10.22+commit.a2f5087d',
          value: 'v0.5.0-nightly.2018.10.22+commit.a2f5087d',
        },
        {
          text: 'v0.5.0-nightly.2018.10.19+commit.c13b5280',
          value: 'v0.5.0-nightly.2018.10.19+commit.c13b5280',
        },
        {
          text: 'v0.5.0-nightly.2018.10.18+commit.99dc869e',
          value: 'v0.5.0-nightly.2018.10.18+commit.99dc869e',
        },
        {
          text: 'v0.5.0-nightly.2018.10.17+commit.ba158882',
          value: 'v0.5.0-nightly.2018.10.17+commit.ba158882',
        },
        {
          text: 'v0.5.0-nightly.2018.10.16+commit.b723893a',
          value: 'v0.5.0-nightly.2018.10.16+commit.b723893a',
        },
        {
          text: 'v0.5.0-nightly.2018.10.15+commit.b965fd6e',
          value: 'v0.5.0-nightly.2018.10.15+commit.b965fd6e',
        },
        {
          text: 'v0.5.0-nightly.2018.10.12+commit.1d312c8e',
          value: 'v0.5.0-nightly.2018.10.12+commit.1d312c8e',
        },
        {
          text: 'v0.5.0-nightly.2018.10.11+commit.6b5d041e',
          value: 'v0.5.0-nightly.2018.10.11+commit.6b5d041e',
        },
        {
          text: 'v0.5.0-nightly.2018.10.10+commit.06200b4b',
          value: 'v0.5.0-nightly.2018.10.10+commit.06200b4b',
        },
        {
          text: 'v0.5.0-nightly.2018.10.9+commit.4ab2e03b',
          value: 'v0.5.0-nightly.2018.10.9+commit.4ab2e03b',
        },
        {
          text: 'v0.5.0-nightly.2018.10.8+commit.7d2dc143',
          value: 'v0.5.0-nightly.2018.10.8+commit.7d2dc143',
        },
        {
          text: 'v0.5.0-nightly.2018.10.6+commit.363b527b',
          value: 'v0.5.0-nightly.2018.10.6+commit.363b527b',
        },
        {
          text: 'v0.5.0-nightly.2018.10.5+commit.44c1293a',
          value: 'v0.5.0-nightly.2018.10.5+commit.44c1293a',
        },
        {
          text: 'v0.5.0-nightly.2018.10.4+commit.68dfe8b6',
          value: 'v0.5.0-nightly.2018.10.4+commit.68dfe8b6',
        },
        {
          text: 'v0.5.0-nightly.2018.10.3+commit.b8b31eb3',
          value: 'v0.5.0-nightly.2018.10.3+commit.b8b31eb3',
        },
        {
          text: 'v0.5.0-nightly.2018.10.2+commit.b77b79c4',
          value: 'v0.5.0-nightly.2018.10.2+commit.b77b79c4',
        },
        {
          text: 'v0.5.0-nightly.2018.10.1+commit.80012e69',
          value: 'v0.5.0-nightly.2018.10.1+commit.80012e69',
        },
        {
          text: 'v0.5.0-nightly.2018.9.30+commit.8ef47cb6',
          value: 'v0.5.0-nightly.2018.9.30+commit.8ef47cb6',
        },
        {
          text: 'v0.5.0-nightly.2018.9.27+commit.963ae540',
          value: 'v0.5.0-nightly.2018.9.27+commit.963ae540',
        },
        {
          text: 'v0.5.0-nightly.2018.9.26+commit.d72498b3',
          value: 'v0.5.0-nightly.2018.9.26+commit.d72498b3',
        },
        {
          text: 'v0.5.0-nightly.2018.9.25+commit.608f36d7',
          value: 'v0.5.0-nightly.2018.9.25+commit.608f36d7',
        },
        { text: 'v0.4.26+commit.4563c3fc', value: 'v0.4.26+commit.4563c3fc' },
        {
          text: 'v0.4.26-nightly.2018.9.25+commit.1b8334e5',
          value: 'v0.4.26-nightly.2018.9.25+commit.1b8334e5',
        },
        {
          text: 'v0.4.26-nightly.2018.9.24+commit.dce1ed5a',
          value: 'v0.4.26-nightly.2018.9.24+commit.dce1ed5a',
        },
        {
          text: 'v0.4.26-nightly.2018.9.21+commit.8f96fe69',
          value: 'v0.4.26-nightly.2018.9.21+commit.8f96fe69',
        },
        {
          text: 'v0.4.26-nightly.2018.9.20+commit.2150aea3',
          value: 'v0.4.26-nightly.2018.9.20+commit.2150aea3',
        },
        {
          text: 'v0.4.26-nightly.2018.9.19+commit.7c15f6b1',
          value: 'v0.4.26-nightly.2018.9.19+commit.7c15f6b1',
        },
        {
          text: 'v0.4.26-nightly.2018.9.18+commit.fcb48bce',
          value: 'v0.4.26-nightly.2018.9.18+commit.fcb48bce',
        },
        {
          text: 'v0.4.26-nightly.2018.9.17+commit.2409986c',
          value: 'v0.4.26-nightly.2018.9.17+commit.2409986c',
        },
        {
          text: 'v0.4.26-nightly.2018.9.13+commit.8b089cc8',
          value: 'v0.4.26-nightly.2018.9.13+commit.8b089cc8',
        },
        { text: 'v0.4.25+commit.59dbf8f1', value: 'v0.4.25+commit.59dbf8f1' },
        {
          text: 'v0.4.25-nightly.2018.9.13+commit.15c8c0d2',
          value: 'v0.4.25-nightly.2018.9.13+commit.15c8c0d2',
        },
        {
          text: 'v0.4.25-nightly.2018.9.12+commit.9214c7c3',
          value: 'v0.4.25-nightly.2018.9.12+commit.9214c7c3',
        },
        {
          text: 'v0.4.25-nightly.2018.9.11+commit.d66e956a',
          value: 'v0.4.25-nightly.2018.9.11+commit.d66e956a',
        },
        {
          text: 'v0.4.25-nightly.2018.9.10+commit.86d85025',
          value: 'v0.4.25-nightly.2018.9.10+commit.86d85025',
        },
        {
          text: 'v0.4.25-nightly.2018.9.6+commit.f19cddd5',
          value: 'v0.4.25-nightly.2018.9.6+commit.f19cddd5',
        },
        {
          text: 'v0.4.25-nightly.2018.9.5+commit.a996ea26',
          value: 'v0.4.25-nightly.2018.9.5+commit.a996ea26',
        },
        {
          text: 'v0.4.25-nightly.2018.9.4+commit.f27d7edf',
          value: 'v0.4.25-nightly.2018.9.4+commit.f27d7edf',
        },
        {
          text: 'v0.4.25-nightly.2018.9.3+commit.0b9cc80b',
          value: 'v0.4.25-nightly.2018.9.3+commit.0b9cc80b',
        },
        {
          text: 'v0.4.25-nightly.2018.8.16+commit.a9e7ae29',
          value: 'v0.4.25-nightly.2018.8.16+commit.a9e7ae29',
        },
        {
          text: 'v0.4.25-nightly.2018.8.15+commit.2946b7cd',
          value: 'v0.4.25-nightly.2018.8.15+commit.2946b7cd',
        },
        {
          text: 'v0.4.25-nightly.2018.8.14+commit.6ca39739',
          value: 'v0.4.25-nightly.2018.8.14+commit.6ca39739',
        },
        {
          text: 'v0.4.25-nightly.2018.8.13+commit.a2c754b3',
          value: 'v0.4.25-nightly.2018.8.13+commit.a2c754b3',
        },
        {
          text: 'v0.4.25-nightly.2018.8.9+commit.63d071d6',
          value: 'v0.4.25-nightly.2018.8.9+commit.63d071d6',
        },
        {
          text: 'v0.4.25-nightly.2018.8.8+commit.d2ca9c82',
          value: 'v0.4.25-nightly.2018.8.8+commit.d2ca9c82',
        },
        {
          text: 'v0.4.25-nightly.2018.8.7+commit.cda3fbda',
          value: 'v0.4.25-nightly.2018.8.7+commit.cda3fbda',
        },
        {
          text: 'v0.4.25-nightly.2018.8.6+commit.3684151e',
          value: 'v0.4.25-nightly.2018.8.6+commit.3684151e',
        },
        {
          text: 'v0.4.25-nightly.2018.8.3+commit.04efbc9e',
          value: 'v0.4.25-nightly.2018.8.3+commit.04efbc9e',
        },
        {
          text: 'v0.4.25-nightly.2018.8.2+commit.6003ed2a',
          value: 'v0.4.25-nightly.2018.8.2+commit.6003ed2a',
        },
        {
          text: 'v0.4.25-nightly.2018.8.1+commit.21888e24',
          value: 'v0.4.25-nightly.2018.8.1+commit.21888e24',
        },
        {
          text: 'v0.4.25-nightly.2018.7.31+commit.75c1a9bd',
          value: 'v0.4.25-nightly.2018.7.31+commit.75c1a9bd',
        },
        {
          text: 'v0.4.25-nightly.2018.7.30+commit.9d09e21b',
          value: 'v0.4.25-nightly.2018.7.30+commit.9d09e21b',
        },
        {
          text: 'v0.4.25-nightly.2018.7.27+commit.bc51b0f6',
          value: 'v0.4.25-nightly.2018.7.27+commit.bc51b0f6',
        },
        {
          text: 'v0.4.25-nightly.2018.7.25+commit.ff8e9300',
          value: 'v0.4.25-nightly.2018.7.25+commit.ff8e9300',
        },
        {
          text: 'v0.4.25-nightly.2018.7.24+commit.fc68d22b',
          value: 'v0.4.25-nightly.2018.7.24+commit.fc68d22b',
        },
        {
          text: 'v0.4.25-nightly.2018.7.23+commit.79ddcc76',
          value: 'v0.4.25-nightly.2018.7.23+commit.79ddcc76',
        },
        {
          text: 'v0.4.25-nightly.2018.7.20+commit.d3000e70',
          value: 'v0.4.25-nightly.2018.7.20+commit.d3000e70',
        },
        {
          text: 'v0.4.25-nightly.2018.7.19+commit.e3c2f20f',
          value: 'v0.4.25-nightly.2018.7.19+commit.e3c2f20f',
        },
        {
          text: 'v0.4.25-nightly.2018.7.18+commit.b909df45',
          value: 'v0.4.25-nightly.2018.7.18+commit.b909df45',
        },
        {
          text: 'v0.4.25-nightly.2018.7.17+commit.56096e9c',
          value: 'v0.4.25-nightly.2018.7.17+commit.56096e9c',
        },
        {
          text: 'v0.4.25-nightly.2018.7.16+commit.98656423',
          value: 'v0.4.25-nightly.2018.7.16+commit.98656423',
        },
        {
          text: 'v0.4.25-nightly.2018.7.12+commit.ff9974e9',
          value: 'v0.4.25-nightly.2018.7.12+commit.ff9974e9',
        },
        {
          text: 'v0.4.25-nightly.2018.7.11+commit.07910c80',
          value: 'v0.4.25-nightly.2018.7.11+commit.07910c80',
        },
        {
          text: 'v0.4.25-nightly.2018.7.10+commit.5c404fcf',
          value: 'v0.4.25-nightly.2018.7.10+commit.5c404fcf',
        },
        {
          text: 'v0.4.25-nightly.2018.7.9+commit.c42583d2',
          value: 'v0.4.25-nightly.2018.7.9+commit.c42583d2',
        },
        {
          text: 'v0.4.25-nightly.2018.7.5+commit.b1ab81ef',
          value: 'v0.4.25-nightly.2018.7.5+commit.b1ab81ef',
        },
        {
          text: 'v0.4.25-nightly.2018.7.4+commit.47637224',
          value: 'v0.4.25-nightly.2018.7.4+commit.47637224',
        },
        {
          text: 'v0.4.25-nightly.2018.7.3+commit.09f3532e',
          value: 'v0.4.25-nightly.2018.7.3+commit.09f3532e',
        },
        {
          text: 'v0.4.25-nightly.2018.7.2+commit.a5608b31',
          value: 'v0.4.25-nightly.2018.7.2+commit.a5608b31',
        },
        {
          text: 'v0.4.25-nightly.2018.6.29+commit.c9cab803',
          value: 'v0.4.25-nightly.2018.6.29+commit.c9cab803',
        },
        {
          text: 'v0.4.25-nightly.2018.6.28+commit.42680629',
          value: 'v0.4.25-nightly.2018.6.28+commit.42680629',
        },
        {
          text: 'v0.4.25-nightly.2018.6.27+commit.b67dfa15',
          value: 'v0.4.25-nightly.2018.6.27+commit.b67dfa15',
        },
        {
          text: 'v0.4.25-nightly.2018.6.26+commit.24f124f8',
          value: 'v0.4.25-nightly.2018.6.26+commit.24f124f8',
        },
        {
          text: 'v0.4.25-nightly.2018.6.25+commit.b7003505',
          value: 'v0.4.25-nightly.2018.6.25+commit.b7003505',
        },
        {
          text: 'v0.4.25-nightly.2018.6.22+commit.9b67bdb3',
          value: 'v0.4.25-nightly.2018.6.22+commit.9b67bdb3',
        },
        {
          text: 'v0.4.25-nightly.2018.6.21+commit.0d104718',
          value: 'v0.4.25-nightly.2018.6.21+commit.0d104718',
        },
        {
          text: 'v0.4.25-nightly.2018.6.20+commit.ba7fbf11',
          value: 'v0.4.25-nightly.2018.6.20+commit.ba7fbf11',
        },
        {
          text: 'v0.4.25-nightly.2018.6.19+commit.c72e04c3',
          value: 'v0.4.25-nightly.2018.6.19+commit.c72e04c3',
        },
        {
          text: 'v0.4.25-nightly.2018.6.18+commit.4247b004',
          value: 'v0.4.25-nightly.2018.6.18+commit.4247b004',
        },
        {
          text: 'v0.4.25-nightly.2018.6.17+commit.1692f78b',
          value: 'v0.4.25-nightly.2018.6.17+commit.1692f78b',
        },
        {
          text: 'v0.4.25-nightly.2018.6.14+commit.baeabe1c',
          value: 'v0.4.25-nightly.2018.6.14+commit.baeabe1c',
        },
        {
          text: 'v0.4.25-nightly.2018.6.13+commit.3055e4ca',
          value: 'v0.4.25-nightly.2018.6.13+commit.3055e4ca',
        },
        {
          text: 'v0.4.25-nightly.2018.6.12+commit.56a965ea',
          value: 'v0.4.25-nightly.2018.6.12+commit.56a965ea',
        },
        {
          text: 'v0.4.25-nightly.2018.6.11+commit.d0355619',
          value: 'v0.4.25-nightly.2018.6.11+commit.d0355619',
        },
        {
          text: 'v0.4.25-nightly.2018.6.8+commit.81c5a6e4',
          value: 'v0.4.25-nightly.2018.6.8+commit.81c5a6e4',
        },
        {
          text: 'v0.4.25-nightly.2018.6.7+commit.ddd256a6',
          value: 'v0.4.25-nightly.2018.6.7+commit.ddd256a6',
        },
        {
          text: 'v0.4.25-nightly.2018.6.6+commit.59b35fa5',
          value: 'v0.4.25-nightly.2018.6.6+commit.59b35fa5',
        },
        {
          text: 'v0.4.25-nightly.2018.6.5+commit.7422cd73',
          value: 'v0.4.25-nightly.2018.6.5+commit.7422cd73',
        },
        {
          text: 'v0.4.25-nightly.2018.6.4+commit.0a074d84',
          value: 'v0.4.25-nightly.2018.6.4+commit.0a074d84',
        },
        {
          text: 'v0.4.25-nightly.2018.6.3+commit.ef8fb63b',
          value: 'v0.4.25-nightly.2018.6.3+commit.ef8fb63b',
        },
        {
          text: 'v0.4.25-nightly.2018.5.30+commit.3f3d6df2',
          value: 'v0.4.25-nightly.2018.5.30+commit.3f3d6df2',
        },
        {
          text: 'v0.4.25-nightly.2018.5.28+commit.0c223b03',
          value: 'v0.4.25-nightly.2018.5.28+commit.0c223b03',
        },
        {
          text: 'v0.4.25-nightly.2018.5.23+commit.18c651b7',
          value: 'v0.4.25-nightly.2018.5.23+commit.18c651b7',
        },
        {
          text: 'v0.4.25-nightly.2018.5.22+commit.849b1bd5',
          value: 'v0.4.25-nightly.2018.5.22+commit.849b1bd5',
        },
        {
          text: 'v0.4.25-nightly.2018.5.21+commit.e97f9b6b',
          value: 'v0.4.25-nightly.2018.5.21+commit.e97f9b6b',
        },
        {
          text: 'v0.4.25-nightly.2018.5.18+commit.4d7b092c',
          value: 'v0.4.25-nightly.2018.5.18+commit.4d7b092c',
        },
        {
          text: 'v0.4.25-nightly.2018.5.17+commit.4aa2f036',
          value: 'v0.4.25-nightly.2018.5.17+commit.4aa2f036',
        },
        {
          text: 'v0.4.25-nightly.2018.5.16+commit.3897c367',
          value: 'v0.4.25-nightly.2018.5.16+commit.3897c367',
        },
        { text: 'v0.4.24+commit.e67f0147', value: 'v0.4.24+commit.e67f0147' },
        {
          text: 'v0.4.24-nightly.2018.5.16+commit.7f965c86',
          value: 'v0.4.24-nightly.2018.5.16+commit.7f965c86',
        },
        {
          text: 'v0.4.24-nightly.2018.5.15+commit.b8b46099',
          value: 'v0.4.24-nightly.2018.5.15+commit.b8b46099',
        },
        {
          text: 'v0.4.24-nightly.2018.5.14+commit.7a669b39',
          value: 'v0.4.24-nightly.2018.5.14+commit.7a669b39',
        },
        {
          text: 'v0.4.24-nightly.2018.5.11+commit.43803b1a',
          value: 'v0.4.24-nightly.2018.5.11+commit.43803b1a',
        },
        {
          text: 'v0.4.24-nightly.2018.5.10+commit.85d417a8',
          value: 'v0.4.24-nightly.2018.5.10+commit.85d417a8',
        },
        {
          text: 'v0.4.24-nightly.2018.5.9+commit.1e953355',
          value: 'v0.4.24-nightly.2018.5.9+commit.1e953355',
        },
        {
          text: 'v0.4.24-nightly.2018.5.8+commit.0a63bc17',
          value: 'v0.4.24-nightly.2018.5.8+commit.0a63bc17',
        },
        {
          text: 'v0.4.24-nightly.2018.5.7+commit.6db7e09a',
          value: 'v0.4.24-nightly.2018.5.7+commit.6db7e09a',
        },
        {
          text: 'v0.4.24-nightly.2018.5.4+commit.81d61ca0',
          value: 'v0.4.24-nightly.2018.5.4+commit.81d61ca0',
        },
        {
          text: 'v0.4.24-nightly.2018.5.3+commit.72c3b3a2',
          value: 'v0.4.24-nightly.2018.5.3+commit.72c3b3a2',
        },
        {
          text: 'v0.4.24-nightly.2018.5.2+commit.dc18cde6',
          value: 'v0.4.24-nightly.2018.5.2+commit.dc18cde6',
        },
        {
          text: 'v0.4.24-nightly.2018.4.30+commit.9e61b25d',
          value: 'v0.4.24-nightly.2018.4.30+commit.9e61b25d',
        },
        {
          text: 'v0.4.24-nightly.2018.4.27+commit.1604a996',
          value: 'v0.4.24-nightly.2018.4.27+commit.1604a996',
        },
        {
          text: 'v0.4.24-nightly.2018.4.26+commit.ef2111a2',
          value: 'v0.4.24-nightly.2018.4.26+commit.ef2111a2',
        },
        {
          text: 'v0.4.24-nightly.2018.4.25+commit.81cca26f',
          value: 'v0.4.24-nightly.2018.4.25+commit.81cca26f',
        },
        {
          text: 'v0.4.24-nightly.2018.4.24+commit.258ae892',
          value: 'v0.4.24-nightly.2018.4.24+commit.258ae892',
        },
        {
          text: 'v0.4.24-nightly.2018.4.23+commit.c7ee2ca0',
          value: 'v0.4.24-nightly.2018.4.23+commit.c7ee2ca0',
        },
        {
          text: 'v0.4.24-nightly.2018.4.22+commit.2fae248d',
          value: 'v0.4.24-nightly.2018.4.22+commit.2fae248d',
        },
        {
          text: 'v0.4.24-nightly.2018.4.20+commit.0f328431',
          value: 'v0.4.24-nightly.2018.4.20+commit.0f328431',
        },
        {
          text: 'v0.4.24-nightly.2018.4.19+commit.27d79906',
          value: 'v0.4.24-nightly.2018.4.19+commit.27d79906',
        },
        { text: 'v0.4.23+commit.124ca40d', value: 'v0.4.23+commit.124ca40d' },
        {
          text: 'v0.4.23-nightly.2018.4.19+commit.ae834e3d',
          value: 'v0.4.23-nightly.2018.4.19+commit.ae834e3d',
        },
        {
          text: 'v0.4.23-nightly.2018.4.18+commit.85687a37',
          value: 'v0.4.23-nightly.2018.4.18+commit.85687a37',
        },
        {
          text: 'v0.4.23-nightly.2018.4.17+commit.5499db01',
          value: 'v0.4.23-nightly.2018.4.17+commit.5499db01',
        },
        { text: 'v0.4.22+commit.4cb486ee', value: 'v0.4.22+commit.4cb486ee' },
        {
          text: 'v0.4.22-nightly.2018.4.16+commit.d8030c9b',
          value: 'v0.4.22-nightly.2018.4.16+commit.d8030c9b',
        },
        {
          text: 'v0.4.22-nightly.2018.4.14+commit.73ca3e8a',
          value: 'v0.4.22-nightly.2018.4.14+commit.73ca3e8a',
        },
        {
          text: 'v0.4.22-nightly.2018.4.13+commit.2001cc6b',
          value: 'v0.4.22-nightly.2018.4.13+commit.2001cc6b',
        },
        {
          text: 'v0.4.22-nightly.2018.4.12+commit.c3dc67d0',
          value: 'v0.4.22-nightly.2018.4.12+commit.c3dc67d0',
        },
        {
          text: 'v0.4.22-nightly.2018.4.11+commit.b7b6d0ce',
          value: 'v0.4.22-nightly.2018.4.11+commit.b7b6d0ce',
        },
        {
          text: 'v0.4.22-nightly.2018.4.10+commit.27385d6d',
          value: 'v0.4.22-nightly.2018.4.10+commit.27385d6d',
        },
        {
          text: 'v0.4.22-nightly.2018.4.6+commit.9bd49516',
          value: 'v0.4.22-nightly.2018.4.6+commit.9bd49516',
        },
        {
          text: 'v0.4.22-nightly.2018.4.5+commit.c6adad93',
          value: 'v0.4.22-nightly.2018.4.5+commit.c6adad93',
        },
        {
          text: 'v0.4.22-nightly.2018.4.4+commit.920de496',
          value: 'v0.4.22-nightly.2018.4.4+commit.920de496',
        },
        {
          text: 'v0.4.22-nightly.2018.4.3+commit.3fbdd655',
          value: 'v0.4.22-nightly.2018.4.3+commit.3fbdd655',
        },
        {
          text: 'v0.4.22-nightly.2018.3.30+commit.326d656a',
          value: 'v0.4.22-nightly.2018.3.30+commit.326d656a',
        },
        {
          text: 'v0.4.22-nightly.2018.3.29+commit.c2ae33f8',
          value: 'v0.4.22-nightly.2018.3.29+commit.c2ae33f8',
        },
        {
          text: 'v0.4.22-nightly.2018.3.27+commit.af262281',
          value: 'v0.4.22-nightly.2018.3.27+commit.af262281',
        },
        {
          text: 'v0.4.22-nightly.2018.3.21+commit.8fd53c1c',
          value: 'v0.4.22-nightly.2018.3.21+commit.8fd53c1c',
        },
        {
          text: 'v0.4.22-nightly.2018.3.16+commit.2b2527f3',
          value: 'v0.4.22-nightly.2018.3.16+commit.2b2527f3',
        },
        {
          text: 'v0.4.22-nightly.2018.3.15+commit.3f1e0d84',
          value: 'v0.4.22-nightly.2018.3.15+commit.3f1e0d84',
        },
        {
          text: 'v0.4.22-nightly.2018.3.14+commit.c3f07b52',
          value: 'v0.4.22-nightly.2018.3.14+commit.c3f07b52',
        },
        {
          text: 'v0.4.22-nightly.2018.3.13+commit.f2614be9',
          value: 'v0.4.22-nightly.2018.3.13+commit.f2614be9',
        },
        {
          text: 'v0.4.22-nightly.2018.3.12+commit.c6e9dd13',
          value: 'v0.4.22-nightly.2018.3.12+commit.c6e9dd13',
        },
        {
          text: 'v0.4.22-nightly.2018.3.8+commit.fbc29f6d',
          value: 'v0.4.22-nightly.2018.3.8+commit.fbc29f6d',
        },
        {
          text: 'v0.4.22-nightly.2018.3.7+commit.b5e804b8',
          value: 'v0.4.22-nightly.2018.3.7+commit.b5e804b8',
        },
        { text: 'v0.4.21+commit.dfe3193c', value: 'v0.4.21+commit.dfe3193c' },
        {
          text: 'v0.4.21-nightly.2018.3.7+commit.bd7bc7c4',
          value: 'v0.4.21-nightly.2018.3.7+commit.bd7bc7c4',
        },
        {
          text: 'v0.4.21-nightly.2018.3.6+commit.a9e02acc',
          value: 'v0.4.21-nightly.2018.3.6+commit.a9e02acc',
        },
        {
          text: 'v0.4.21-nightly.2018.3.5+commit.cd6ffbdf',
          value: 'v0.4.21-nightly.2018.3.5+commit.cd6ffbdf',
        },
        {
          text: 'v0.4.21-nightly.2018.3.1+commit.cf6720ea',
          value: 'v0.4.21-nightly.2018.3.1+commit.cf6720ea',
        },
        {
          text: 'v0.4.21-nightly.2018.2.28+commit.ac5485a2',
          value: 'v0.4.21-nightly.2018.2.28+commit.ac5485a2',
        },
        {
          text: 'v0.4.21-nightly.2018.2.27+commit.415ac2ae',
          value: 'v0.4.21-nightly.2018.2.27+commit.415ac2ae',
        },
        {
          text: 'v0.4.21-nightly.2018.2.26+commit.cd2d8936',
          value: 'v0.4.21-nightly.2018.2.26+commit.cd2d8936',
        },
        {
          text: 'v0.4.21-nightly.2018.2.23+commit.cae6cc2c',
          value: 'v0.4.21-nightly.2018.2.23+commit.cae6cc2c',
        },
        {
          text: 'v0.4.21-nightly.2018.2.22+commit.71a34abd',
          value: 'v0.4.21-nightly.2018.2.22+commit.71a34abd',
        },
        {
          text: 'v0.4.21-nightly.2018.2.21+commit.16c7eabc',
          value: 'v0.4.21-nightly.2018.2.21+commit.16c7eabc',
        },
        {
          text: 'v0.4.21-nightly.2018.2.20+commit.dcc4083b',
          value: 'v0.4.21-nightly.2018.2.20+commit.dcc4083b',
        },
        {
          text: 'v0.4.21-nightly.2018.2.19+commit.839acafb',
          value: 'v0.4.21-nightly.2018.2.19+commit.839acafb',
        },
        {
          text: 'v0.4.21-nightly.2018.2.16+commit.3f7e82d0',
          value: 'v0.4.21-nightly.2018.2.16+commit.3f7e82d0',
        },
        {
          text: 'v0.4.21-nightly.2018.2.15+commit.f4aa05f3',
          value: 'v0.4.21-nightly.2018.2.15+commit.f4aa05f3',
        },
        {
          text: 'v0.4.21-nightly.2018.2.14+commit.bb3b327c',
          value: 'v0.4.21-nightly.2018.2.14+commit.bb3b327c',
        },
        { text: 'v0.4.20+commit.3155dd80', value: 'v0.4.20+commit.3155dd80' },
        {
          text: 'v0.4.20-nightly.2018.2.13+commit.27ef9794',
          value: 'v0.4.20-nightly.2018.2.13+commit.27ef9794',
        },
        {
          text: 'v0.4.20-nightly.2018.2.12+commit.954903b5',
          value: 'v0.4.20-nightly.2018.2.12+commit.954903b5',
        },
        {
          text: 'v0.4.20-nightly.2018.1.29+commit.a668b9de',
          value: 'v0.4.20-nightly.2018.1.29+commit.a668b9de',
        },
        {
          text: 'v0.4.20-nightly.2018.1.26+commit.bbad48bb',
          value: 'v0.4.20-nightly.2018.1.26+commit.bbad48bb',
        },
        {
          text: 'v0.4.20-nightly.2018.1.25+commit.e7afde95',
          value: 'v0.4.20-nightly.2018.1.25+commit.e7afde95',
        },
        {
          text: 'v0.4.20-nightly.2018.1.24+commit.b177352a',
          value: 'v0.4.20-nightly.2018.1.24+commit.b177352a',
        },
        {
          text: 'v0.4.20-nightly.2018.1.23+commit.31aaf433',
          value: 'v0.4.20-nightly.2018.1.23+commit.31aaf433',
        },
        {
          text: 'v0.4.20-nightly.2018.1.22+commit.e5def2da',
          value: 'v0.4.20-nightly.2018.1.22+commit.e5def2da',
        },
        {
          text: 'v0.4.20-nightly.2018.1.19+commit.eba46a65',
          value: 'v0.4.20-nightly.2018.1.19+commit.eba46a65',
        },
        {
          text: 'v0.4.20-nightly.2018.1.18+commit.33723c45',
          value: 'v0.4.20-nightly.2018.1.18+commit.33723c45',
        },
        {
          text: 'v0.4.20-nightly.2018.1.17+commit.4715167e',
          value: 'v0.4.20-nightly.2018.1.17+commit.4715167e',
        },
        {
          text: 'v0.4.20-nightly.2018.1.15+commit.14fcbd65',
          value: 'v0.4.20-nightly.2018.1.15+commit.14fcbd65',
        },
        {
          text: 'v0.4.20-nightly.2018.1.11+commit.0c20b6da',
          value: 'v0.4.20-nightly.2018.1.11+commit.0c20b6da',
        },
        {
          text: 'v0.4.20-nightly.2018.1.10+commit.a75d5333',
          value: 'v0.4.20-nightly.2018.1.10+commit.a75d5333',
        },
        {
          text: 'v0.4.20-nightly.2018.1.6+commit.2548228b',
          value: 'v0.4.20-nightly.2018.1.6+commit.2548228b',
        },
        {
          text: 'v0.4.20-nightly.2018.1.5+commit.bca01f8f',
          value: 'v0.4.20-nightly.2018.1.5+commit.bca01f8f',
        },
        {
          text: 'v0.4.20-nightly.2018.1.4+commit.a0771691',
          value: 'v0.4.20-nightly.2018.1.4+commit.a0771691',
        },
        {
          text: 'v0.4.20-nightly.2017.12.20+commit.efc198d5',
          value: 'v0.4.20-nightly.2017.12.20+commit.efc198d5',
        },
        {
          text: 'v0.4.20-nightly.2017.12.19+commit.2d800e67',
          value: 'v0.4.20-nightly.2017.12.19+commit.2d800e67',
        },
        {
          text: 'v0.4.20-nightly.2017.12.18+commit.37b70e8e',
          value: 'v0.4.20-nightly.2017.12.18+commit.37b70e8e',
        },
        {
          text: 'v0.4.20-nightly.2017.12.14+commit.3d1830f3',
          value: 'v0.4.20-nightly.2017.12.14+commit.3d1830f3',
        },
        {
          text: 'v0.4.20-nightly.2017.12.13+commit.bfc54463',
          value: 'v0.4.20-nightly.2017.12.13+commit.bfc54463',
        },
        {
          text: 'v0.4.20-nightly.2017.12.12+commit.1ddd4e2b',
          value: 'v0.4.20-nightly.2017.12.12+commit.1ddd4e2b',
        },
        {
          text: 'v0.4.20-nightly.2017.12.11+commit.4a1f18c9',
          value: 'v0.4.20-nightly.2017.12.11+commit.4a1f18c9',
        },
        {
          text: 'v0.4.20-nightly.2017.12.8+commit.226bfe5b',
          value: 'v0.4.20-nightly.2017.12.8+commit.226bfe5b',
        },
        {
          text: 'v0.4.20-nightly.2017.12.6+commit.c2109436',
          value: 'v0.4.20-nightly.2017.12.6+commit.c2109436',
        },
        {
          text: 'v0.4.20-nightly.2017.12.5+commit.b47e023d',
          value: 'v0.4.20-nightly.2017.12.5+commit.b47e023d',
        },
        {
          text: 'v0.4.20-nightly.2017.12.4+commit.240c79e6',
          value: 'v0.4.20-nightly.2017.12.4+commit.240c79e6',
        },
        {
          text: 'v0.4.20-nightly.2017.12.1+commit.6d8d0393',
          value: 'v0.4.20-nightly.2017.12.1+commit.6d8d0393',
        },
        {
          text: 'v0.4.20-nightly.2017.11.30+commit.cb16a5d3',
          value: 'v0.4.20-nightly.2017.11.30+commit.cb16a5d3',
        },
        { text: 'v0.4.19+commit.c4cbbb05', value: 'v0.4.19+commit.c4cbbb05' },
        {
          text: 'v0.4.19-nightly.2017.11.30+commit.f5a2508e',
          value: 'v0.4.19-nightly.2017.11.30+commit.f5a2508e',
        },
        {
          text: 'v0.4.19-nightly.2017.11.29+commit.7c69d88f',
          value: 'v0.4.19-nightly.2017.11.29+commit.7c69d88f',
        },
        {
          text: 'v0.4.19-nightly.2017.11.22+commit.f22ac8fc',
          value: 'v0.4.19-nightly.2017.11.22+commit.f22ac8fc',
        },
        {
          text: 'v0.4.19-nightly.2017.11.21+commit.5c9e273d',
          value: 'v0.4.19-nightly.2017.11.21+commit.5c9e273d',
        },
        {
          text: 'v0.4.19-nightly.2017.11.17+commit.2b5ef806',
          value: 'v0.4.19-nightly.2017.11.17+commit.2b5ef806',
        },
        {
          text: 'v0.4.19-nightly.2017.11.16+commit.58e452d1',
          value: 'v0.4.19-nightly.2017.11.16+commit.58e452d1',
        },
        {
          text: 'v0.4.19-nightly.2017.11.15+commit.e3206d8e',
          value: 'v0.4.19-nightly.2017.11.15+commit.e3206d8e',
        },
        {
          text: 'v0.4.19-nightly.2017.11.14+commit.bc39e730',
          value: 'v0.4.19-nightly.2017.11.14+commit.bc39e730',
        },
        {
          text: 'v0.4.19-nightly.2017.11.13+commit.060b2c2b',
          value: 'v0.4.19-nightly.2017.11.13+commit.060b2c2b',
        },
        {
          text: 'v0.4.19-nightly.2017.11.11+commit.284c3839',
          value: 'v0.4.19-nightly.2017.11.11+commit.284c3839',
        },
        {
          text: 'v0.4.19-nightly.2017.10.29+commit.eb140bc6',
          value: 'v0.4.19-nightly.2017.10.29+commit.eb140bc6',
        },
        {
          text: 'v0.4.19-nightly.2017.10.28+commit.f9b24009',
          value: 'v0.4.19-nightly.2017.10.28+commit.f9b24009',
        },
        {
          text: 'v0.4.19-nightly.2017.10.27+commit.1e085f85',
          value: 'v0.4.19-nightly.2017.10.27+commit.1e085f85',
        },
        {
          text: 'v0.4.19-nightly.2017.10.26+commit.59d4dfbd',
          value: 'v0.4.19-nightly.2017.10.26+commit.59d4dfbd',
        },
        {
          text: 'v0.4.19-nightly.2017.10.24+commit.1313e9d8',
          value: 'v0.4.19-nightly.2017.10.24+commit.1313e9d8',
        },
        {
          text: 'v0.4.19-nightly.2017.10.23+commit.dc6b1f02',
          value: 'v0.4.19-nightly.2017.10.23+commit.dc6b1f02',
        },
        {
          text: 'v0.4.19-nightly.2017.10.20+commit.bdd2858b',
          value: 'v0.4.19-nightly.2017.10.20+commit.bdd2858b',
        },
        {
          text: 'v0.4.19-nightly.2017.10.19+commit.c58d9d2c',
          value: 'v0.4.19-nightly.2017.10.19+commit.c58d9d2c',
        },
        {
          text: 'v0.4.19-nightly.2017.10.18+commit.f7ca2421',
          value: 'v0.4.19-nightly.2017.10.18+commit.f7ca2421',
        },
        { text: 'v0.4.18+commit.9cf6e910', value: 'v0.4.18+commit.9cf6e910' },
        {
          text: 'v0.4.18-nightly.2017.10.18+commit.e854da1a',
          value: 'v0.4.18-nightly.2017.10.18+commit.e854da1a',
        },
        {
          text: 'v0.4.18-nightly.2017.10.17+commit.8fbfd62d',
          value: 'v0.4.18-nightly.2017.10.17+commit.8fbfd62d',
        },
        {
          text: 'v0.4.18-nightly.2017.10.16+commit.dbc8655b',
          value: 'v0.4.18-nightly.2017.10.16+commit.dbc8655b',
        },
        {
          text: 'v0.4.18-nightly.2017.10.15+commit.a74c9aef',
          value: 'v0.4.18-nightly.2017.10.15+commit.a74c9aef',
        },
        {
          text: 'v0.4.18-nightly.2017.10.10+commit.c35496bf',
          value: 'v0.4.18-nightly.2017.10.10+commit.c35496bf',
        },
        {
          text: 'v0.4.18-nightly.2017.10.9+commit.6f832cac',
          value: 'v0.4.18-nightly.2017.10.9+commit.6f832cac',
        },
        {
          text: 'v0.4.18-nightly.2017.10.6+commit.961f8746',
          value: 'v0.4.18-nightly.2017.10.6+commit.961f8746',
        },
        {
          text: 'v0.4.18-nightly.2017.10.5+commit.995b5525',
          value: 'v0.4.18-nightly.2017.10.5+commit.995b5525',
        },
        {
          text: 'v0.4.18-nightly.2017.10.4+commit.0c3888ab',
          value: 'v0.4.18-nightly.2017.10.4+commit.0c3888ab',
        },
        {
          text: 'v0.4.18-nightly.2017.10.3+commit.5c284589',
          value: 'v0.4.18-nightly.2017.10.3+commit.5c284589',
        },
        {
          text: 'v0.4.18-nightly.2017.10.2+commit.c6161030',
          value: 'v0.4.18-nightly.2017.10.2+commit.c6161030',
        },
        {
          text: 'v0.4.18-nightly.2017.9.29+commit.b9218468',
          value: 'v0.4.18-nightly.2017.9.29+commit.b9218468',
        },
        {
          text: 'v0.4.18-nightly.2017.9.28+commit.4d01d086',
          value: 'v0.4.18-nightly.2017.9.28+commit.4d01d086',
        },
        {
          text: 'v0.4.18-nightly.2017.9.27+commit.809d5ce1',
          value: 'v0.4.18-nightly.2017.9.27+commit.809d5ce1',
        },
        {
          text: 'v0.4.18-nightly.2017.9.26+commit.eb5a6aac',
          value: 'v0.4.18-nightly.2017.9.26+commit.eb5a6aac',
        },
        {
          text: 'v0.4.18-nightly.2017.9.25+commit.a72237f2',
          value: 'v0.4.18-nightly.2017.9.25+commit.a72237f2',
        },
        {
          text: 'v0.4.18-nightly.2017.9.22+commit.a2a58789',
          value: 'v0.4.18-nightly.2017.9.22+commit.a2a58789',
        },
        { text: 'v0.4.17+commit.bdeb9e52', value: 'v0.4.17+commit.bdeb9e52' },
        {
          text: 'v0.4.17-nightly.2017.9.21+commit.725b4fc2',
          value: 'v0.4.17-nightly.2017.9.21+commit.725b4fc2',
        },
        {
          text: 'v0.4.17-nightly.2017.9.20+commit.c0b3e5b0',
          value: 'v0.4.17-nightly.2017.9.20+commit.c0b3e5b0',
        },
        {
          text: 'v0.4.17-nightly.2017.9.19+commit.1fc71bd7',
          value: 'v0.4.17-nightly.2017.9.19+commit.1fc71bd7',
        },
        {
          text: 'v0.4.17-nightly.2017.9.18+commit.c289fd3d',
          value: 'v0.4.17-nightly.2017.9.18+commit.c289fd3d',
        },
        {
          text: 'v0.4.17-nightly.2017.9.16+commit.a0d17172',
          value: 'v0.4.17-nightly.2017.9.16+commit.a0d17172',
        },
        {
          text: 'v0.4.17-nightly.2017.9.14+commit.7dd372ce',
          value: 'v0.4.17-nightly.2017.9.14+commit.7dd372ce',
        },
        {
          text: 'v0.4.17-nightly.2017.9.12+commit.4770f8f4',
          value: 'v0.4.17-nightly.2017.9.12+commit.4770f8f4',
        },
        {
          text: 'v0.4.17-nightly.2017.9.11+commit.fbe24da1',
          value: 'v0.4.17-nightly.2017.9.11+commit.fbe24da1',
        },
        {
          text: 'v0.4.17-nightly.2017.9.6+commit.59223061',
          value: 'v0.4.17-nightly.2017.9.6+commit.59223061',
        },
        {
          text: 'v0.4.17-nightly.2017.9.5+commit.f242331c',
          value: 'v0.4.17-nightly.2017.9.5+commit.f242331c',
        },
        {
          text: 'v0.4.17-nightly.2017.9.4+commit.8283f836',
          value: 'v0.4.17-nightly.2017.9.4+commit.8283f836',
        },
        {
          text: 'v0.4.17-nightly.2017.8.31+commit.402d6e71',
          value: 'v0.4.17-nightly.2017.8.31+commit.402d6e71',
        },
        {
          text: 'v0.4.17-nightly.2017.8.29+commit.2d39a42d',
          value: 'v0.4.17-nightly.2017.8.29+commit.2d39a42d',
        },
        {
          text: 'v0.4.17-nightly.2017.8.28+commit.d15cde2a',
          value: 'v0.4.17-nightly.2017.8.28+commit.d15cde2a',
        },
        {
          text: 'v0.4.17-nightly.2017.8.25+commit.e945f458',
          value: 'v0.4.17-nightly.2017.8.25+commit.e945f458',
        },
        {
          text: 'v0.4.17-nightly.2017.8.24+commit.012d9f79',
          value: 'v0.4.17-nightly.2017.8.24+commit.012d9f79',
        },
        { text: 'v0.4.16+commit.d7661dd9', value: 'v0.4.16+commit.d7661dd9' },
        {
          text: 'v0.4.16-nightly.2017.8.24+commit.78c2dcac',
          value: 'v0.4.16-nightly.2017.8.24+commit.78c2dcac',
        },
        {
          text: 'v0.4.16-nightly.2017.8.23+commit.c5f11d93',
          value: 'v0.4.16-nightly.2017.8.23+commit.c5f11d93',
        },
        {
          text: 'v0.4.16-nightly.2017.8.22+commit.f874fc28',
          value: 'v0.4.16-nightly.2017.8.22+commit.f874fc28',
        },
        {
          text: 'v0.4.16-nightly.2017.8.21+commit.0cf60488',
          value: 'v0.4.16-nightly.2017.8.21+commit.0cf60488',
        },
        {
          text: 'v0.4.16-nightly.2017.8.16+commit.83561e13',
          value: 'v0.4.16-nightly.2017.8.16+commit.83561e13',
        },
        {
          text: 'v0.4.16-nightly.2017.8.15+commit.dca1f45c',
          value: 'v0.4.16-nightly.2017.8.15+commit.dca1f45c',
        },
        {
          text: 'v0.4.16-nightly.2017.8.14+commit.4d9790b6',
          value: 'v0.4.16-nightly.2017.8.14+commit.4d9790b6',
        },
        {
          text: 'v0.4.16-nightly.2017.8.11+commit.c84de7fa',
          value: 'v0.4.16-nightly.2017.8.11+commit.c84de7fa',
        },
        {
          text: 'v0.4.16-nightly.2017.8.10+commit.41e3cbe0',
          value: 'v0.4.16-nightly.2017.8.10+commit.41e3cbe0',
        },
        {
          text: 'v0.4.16-nightly.2017.8.9+commit.81887bc7',
          value: 'v0.4.16-nightly.2017.8.9+commit.81887bc7',
        },
        { text: 'v0.4.15+commit.8b45bddb', value: 'v0.4.15+commit.8b45bddb' },
        { text: 'v0.4.15+commit.bbb8e64f', value: 'v0.4.15+commit.bbb8e64f' },
        {
          text: 'v0.4.15-nightly.2017.8.8+commit.41e72436',
          value: 'v0.4.15-nightly.2017.8.8+commit.41e72436',
        },
        {
          text: 'v0.4.15-nightly.2017.8.7+commit.212454a9',
          value: 'v0.4.15-nightly.2017.8.7+commit.212454a9',
        },
        {
          text: 'v0.4.15-nightly.2017.8.4+commit.e48730fe',
          value: 'v0.4.15-nightly.2017.8.4+commit.e48730fe',
        },
        {
          text: 'v0.4.15-nightly.2017.8.2+commit.04166ce1',
          value: 'v0.4.15-nightly.2017.8.2+commit.04166ce1',
        },
        {
          text: 'v0.4.15-nightly.2017.8.1+commit.7e07eb6e',
          value: 'v0.4.15-nightly.2017.8.1+commit.7e07eb6e',
        },
        {
          text: 'v0.4.15-nightly.2017.7.31+commit.93f90eb2',
          value: 'v0.4.15-nightly.2017.7.31+commit.93f90eb2',
        },
        { text: 'v0.4.14+commit.c2215d46', value: 'v0.4.14+commit.c2215d46' },
        {
          text: 'v0.4.14-nightly.2017.7.31+commit.22326189',
          value: 'v0.4.14-nightly.2017.7.31+commit.22326189',
        },
        {
          text: 'v0.4.14-nightly.2017.7.28+commit.7e40def6',
          value: 'v0.4.14-nightly.2017.7.28+commit.7e40def6',
        },
        {
          text: 'v0.4.14-nightly.2017.7.27+commit.1298a8df',
          value: 'v0.4.14-nightly.2017.7.27+commit.1298a8df',
        },
        {
          text: 'v0.4.14-nightly.2017.7.26+commit.0d701c94',
          value: 'v0.4.14-nightly.2017.7.26+commit.0d701c94',
        },
        {
          text: 'v0.4.14-nightly.2017.7.25+commit.3c2b710b',
          value: 'v0.4.14-nightly.2017.7.25+commit.3c2b710b',
        },
        {
          text: 'v0.4.14-nightly.2017.7.24+commit.cfb11ff7',
          value: 'v0.4.14-nightly.2017.7.24+commit.cfb11ff7',
        },
        {
          text: 'v0.4.14-nightly.2017.7.21+commit.75b48616',
          value: 'v0.4.14-nightly.2017.7.21+commit.75b48616',
        },
        {
          text: 'v0.4.14-nightly.2017.7.20+commit.d70974ea',
          value: 'v0.4.14-nightly.2017.7.20+commit.d70974ea',
        },
        {
          text: 'v0.4.14-nightly.2017.7.19+commit.3ad326be',
          value: 'v0.4.14-nightly.2017.7.19+commit.3ad326be',
        },
        {
          text: 'v0.4.14-nightly.2017.7.18+commit.c167a31b',
          value: 'v0.4.14-nightly.2017.7.18+commit.c167a31b',
        },
        {
          text: 'v0.4.14-nightly.2017.7.14+commit.7c97546f',
          value: 'v0.4.14-nightly.2017.7.14+commit.7c97546f',
        },
        {
          text: 'v0.4.14-nightly.2017.7.13+commit.2b33e0bc',
          value: 'v0.4.14-nightly.2017.7.13+commit.2b33e0bc',
        },
        {
          text: 'v0.4.14-nightly.2017.7.12+commit.b981ef20',
          value: 'v0.4.14-nightly.2017.7.12+commit.b981ef20',
        },
        {
          text: 'v0.4.14-nightly.2017.7.11+commit.0b17ff1b',
          value: 'v0.4.14-nightly.2017.7.11+commit.0b17ff1b',
        },
        {
          text: 'v0.4.14-nightly.2017.7.10+commit.6fa5d47f',
          value: 'v0.4.14-nightly.2017.7.10+commit.6fa5d47f',
        },
        {
          text: 'v0.4.14-nightly.2017.7.9+commit.aafcc360',
          value: 'v0.4.14-nightly.2017.7.9+commit.aafcc360',
        },
        {
          text: 'v0.4.14-nightly.2017.7.8+commit.7d1ddfc6',
          value: 'v0.4.14-nightly.2017.7.8+commit.7d1ddfc6',
        },
        {
          text: 'v0.4.14-nightly.2017.7.6+commit.08dade9f',
          value: 'v0.4.14-nightly.2017.7.6+commit.08dade9f',
        },
        { text: 'v0.4.13+commit.0fb4cb1a', value: 'v0.4.13+commit.0fb4cb1a' },
        {
          text: 'v0.4.13-nightly.2017.7.6+commit.40d4ee49',
          value: 'v0.4.13-nightly.2017.7.6+commit.40d4ee49',
        },
        {
          text: 'v0.4.13-nightly.2017.7.5+commit.2b505e7a',
          value: 'v0.4.13-nightly.2017.7.5+commit.2b505e7a',
        },
        {
          text: 'v0.4.13-nightly.2017.7.4+commit.331b0b1c',
          value: 'v0.4.13-nightly.2017.7.4+commit.331b0b1c',
        },
        {
          text: 'v0.4.13-nightly.2017.7.3+commit.6e4e627b',
          value: 'v0.4.13-nightly.2017.7.3+commit.6e4e627b',
        },
        { text: 'v0.4.12+commit.194ff033', value: 'v0.4.12+commit.194ff033' },
        {
          text: 'v0.4.12-nightly.2017.7.3+commit.0c7530a8',
          value: 'v0.4.12-nightly.2017.7.3+commit.0c7530a8',
        },
        {
          text: 'v0.4.12-nightly.2017.7.1+commit.06f8949f',
          value: 'v0.4.12-nightly.2017.7.1+commit.06f8949f',
        },
        {
          text: 'v0.4.12-nightly.2017.6.30+commit.568e7520',
          value: 'v0.4.12-nightly.2017.6.30+commit.568e7520',
        },
        {
          text: 'v0.4.12-nightly.2017.6.29+commit.f5372cda',
          value: 'v0.4.12-nightly.2017.6.29+commit.f5372cda',
        },
        {
          text: 'v0.4.12-nightly.2017.6.28+commit.e19c4125',
          value: 'v0.4.12-nightly.2017.6.28+commit.e19c4125',
        },
        {
          text: 'v0.4.12-nightly.2017.6.27+commit.bc31d496',
          value: 'v0.4.12-nightly.2017.6.27+commit.bc31d496',
        },
        {
          text: 'v0.4.12-nightly.2017.6.26+commit.f8794892',
          value: 'v0.4.12-nightly.2017.6.26+commit.f8794892',
        },
        {
          text: 'v0.4.12-nightly.2017.6.25+commit.29b8cdb5',
          value: 'v0.4.12-nightly.2017.6.25+commit.29b8cdb5',
        },
        {
          text: 'v0.4.12-nightly.2017.6.23+commit.793f05fa',
          value: 'v0.4.12-nightly.2017.6.23+commit.793f05fa',
        },
        {
          text: 'v0.4.12-nightly.2017.6.22+commit.1c54ce2a',
          value: 'v0.4.12-nightly.2017.6.22+commit.1c54ce2a',
        },
        {
          text: 'v0.4.12-nightly.2017.6.21+commit.ac977cdf',
          value: 'v0.4.12-nightly.2017.6.21+commit.ac977cdf',
        },
        {
          text: 'v0.4.12-nightly.2017.6.20+commit.cb5f2f90',
          value: 'v0.4.12-nightly.2017.6.20+commit.cb5f2f90',
        },
        {
          text: 'v0.4.12-nightly.2017.6.19+commit.0c75afb2',
          value: 'v0.4.12-nightly.2017.6.19+commit.0c75afb2',
        },
        {
          text: 'v0.4.12-nightly.2017.6.16+commit.17de4a07',
          value: 'v0.4.12-nightly.2017.6.16+commit.17de4a07',
        },
        {
          text: 'v0.4.12-nightly.2017.6.15+commit.71fea1e3',
          value: 'v0.4.12-nightly.2017.6.15+commit.71fea1e3',
        },
        {
          text: 'v0.4.12-nightly.2017.6.14+commit.43cfab70',
          value: 'v0.4.12-nightly.2017.6.14+commit.43cfab70',
        },
        {
          text: 'v0.4.12-nightly.2017.6.13+commit.0c8c2091',
          value: 'v0.4.12-nightly.2017.6.13+commit.0c8c2091',
        },
        {
          text: 'v0.4.12-nightly.2017.6.12+commit.496c2a20',
          value: 'v0.4.12-nightly.2017.6.12+commit.496c2a20',
        },
        {
          text: 'v0.4.12-nightly.2017.6.9+commit.76667fed',
          value: 'v0.4.12-nightly.2017.6.9+commit.76667fed',
        },
        {
          text: 'v0.4.12-nightly.2017.6.8+commit.51fcfbcf',
          value: 'v0.4.12-nightly.2017.6.8+commit.51fcfbcf',
        },
        {
          text: 'v0.4.12-nightly.2017.6.6+commit.243e389f',
          value: 'v0.4.12-nightly.2017.6.6+commit.243e389f',
        },
        {
          text: 'v0.4.12-nightly.2017.6.1+commit.96de7a83',
          value: 'v0.4.12-nightly.2017.6.1+commit.96de7a83',
        },
        {
          text: 'v0.4.12-nightly.2017.5.30+commit.254b5572',
          value: 'v0.4.12-nightly.2017.5.30+commit.254b5572',
        },
        {
          text: 'v0.4.12-nightly.2017.5.29+commit.4a5dc6a4',
          value: 'v0.4.12-nightly.2017.5.29+commit.4a5dc6a4',
        },
        {
          text: 'v0.4.12-nightly.2017.5.26+commit.e43ff797',
          value: 'v0.4.12-nightly.2017.5.26+commit.e43ff797',
        },
        {
          text: 'v0.4.12-nightly.2017.5.24+commit.cf639f48',
          value: 'v0.4.12-nightly.2017.5.24+commit.cf639f48',
        },
        {
          text: 'v0.4.12-nightly.2017.5.23+commit.14b22150',
          value: 'v0.4.12-nightly.2017.5.23+commit.14b22150',
        },
        {
          text: 'v0.4.12-nightly.2017.5.22+commit.e3af0640',
          value: 'v0.4.12-nightly.2017.5.22+commit.e3af0640',
        },
        {
          text: 'v0.4.12-nightly.2017.5.19+commit.982f6613',
          value: 'v0.4.12-nightly.2017.5.19+commit.982f6613',
        },
        {
          text: 'v0.4.12-nightly.2017.5.18+commit.6f9428e9',
          value: 'v0.4.12-nightly.2017.5.18+commit.6f9428e9',
        },
        {
          text: 'v0.4.12-nightly.2017.5.17+commit.b4c6877a',
          value: 'v0.4.12-nightly.2017.5.17+commit.b4c6877a',
        },
        {
          text: 'v0.4.12-nightly.2017.5.16+commit.2ba87fe8',
          value: 'v0.4.12-nightly.2017.5.16+commit.2ba87fe8',
        },
        {
          text: 'v0.4.12-nightly.2017.5.11+commit.242e4318',
          value: 'v0.4.12-nightly.2017.5.11+commit.242e4318',
        },
        {
          text: 'v0.4.12-nightly.2017.5.10+commit.a6586f75',
          value: 'v0.4.12-nightly.2017.5.10+commit.a6586f75',
        },
        {
          text: 'v0.4.12-nightly.2017.5.6+commit.822c9057',
          value: 'v0.4.12-nightly.2017.5.6+commit.822c9057',
        },
        {
          text: 'v0.4.12-nightly.2017.5.5+commit.0582fcb9',
          value: 'v0.4.12-nightly.2017.5.5+commit.0582fcb9',
        },
        {
          text: 'v0.4.12-nightly.2017.5.4+commit.025b32d9',
          value: 'v0.4.12-nightly.2017.5.4+commit.025b32d9',
        },
        { text: 'v0.4.11+commit.68ef5810', value: 'v0.4.11+commit.68ef5810' },
        {
          text: 'v0.4.11-nightly.2017.5.3+commit.1aa0f77a',
          value: 'v0.4.11-nightly.2017.5.3+commit.1aa0f77a',
        },
        {
          text: 'v0.4.11-nightly.2017.5.2+commit.5aeb6352',
          value: 'v0.4.11-nightly.2017.5.2+commit.5aeb6352',
        },
        {
          text: 'v0.4.11-nightly.2017.4.28+commit.f33614e1',
          value: 'v0.4.11-nightly.2017.4.28+commit.f33614e1',
        },
        {
          text: 'v0.4.11-nightly.2017.4.27+commit.abe77f48',
          value: 'v0.4.11-nightly.2017.4.27+commit.abe77f48',
        },
        {
          text: 'v0.4.11-nightly.2017.4.26+commit.3cbdf6d4',
          value: 'v0.4.11-nightly.2017.4.26+commit.3cbdf6d4',
        },
        {
          text: 'v0.4.11-nightly.2017.4.25+commit.c3b839ca',
          value: 'v0.4.11-nightly.2017.4.25+commit.c3b839ca',
        },
        {
          text: 'v0.4.11-nightly.2017.4.24+commit.a9f42157',
          value: 'v0.4.11-nightly.2017.4.24+commit.a9f42157',
        },
        {
          text: 'v0.4.11-nightly.2017.4.22+commit.aa441668',
          value: 'v0.4.11-nightly.2017.4.22+commit.aa441668',
        },
        {
          text: 'v0.4.11-nightly.2017.4.21+commit.e3eea9fc',
          value: 'v0.4.11-nightly.2017.4.21+commit.e3eea9fc',
        },
        {
          text: 'v0.4.11-nightly.2017.4.20+commit.6468955f',
          value: 'v0.4.11-nightly.2017.4.20+commit.6468955f',
        },
        {
          text: 'v0.4.11-nightly.2017.4.18+commit.82628a80',
          value: 'v0.4.11-nightly.2017.4.18+commit.82628a80',
        },
        {
          text: 'v0.4.11-nightly.2017.4.13+commit.138c952a',
          value: 'v0.4.11-nightly.2017.4.13+commit.138c952a',
        },
        {
          text: 'v0.4.11-nightly.2017.4.10+commit.9fe20650',
          value: 'v0.4.11-nightly.2017.4.10+commit.9fe20650',
        },
        {
          text: 'v0.4.11-nightly.2017.3.29+commit.fefb3fad',
          value: 'v0.4.11-nightly.2017.3.29+commit.fefb3fad',
        },
        {
          text: 'v0.4.11-nightly.2017.3.28+commit.215184ef',
          value: 'v0.4.11-nightly.2017.3.28+commit.215184ef',
        },
        {
          text: 'v0.4.11-nightly.2017.3.27+commit.9d769a56',
          value: 'v0.4.11-nightly.2017.3.27+commit.9d769a56',
        },
        {
          text: 'v0.4.11-nightly.2017.3.22+commit.74d7c513',
          value: 'v0.4.11-nightly.2017.3.22+commit.74d7c513',
        },
        {
          text: 'v0.4.11-nightly.2017.3.21+commit.6fb27dee',
          value: 'v0.4.11-nightly.2017.3.21+commit.6fb27dee',
        },
        {
          text: 'v0.4.11-nightly.2017.3.20+commit.57bc763e',
          value: 'v0.4.11-nightly.2017.3.20+commit.57bc763e',
        },
        {
          text: 'v0.4.11-nightly.2017.3.17+commit.2f2ad42c',
          value: 'v0.4.11-nightly.2017.3.17+commit.2f2ad42c',
        },
        {
          text: 'v0.4.11-nightly.2017.3.16+commit.a2eb2c0a',
          value: 'v0.4.11-nightly.2017.3.16+commit.a2eb2c0a',
        },
        {
          text: 'v0.4.11-nightly.2017.3.15+commit.0157b86c',
          value: 'v0.4.11-nightly.2017.3.15+commit.0157b86c',
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
      isUnverifiedContract: (value, vm) => vm.isUnverifiedContract(value, vm),
    },
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

        // call verificator-api
        const vm = this
        const formData = new FormData()
        formData.append('source', vm.source)
        formData.append('address', vm.address.toLowerCase())
        formData.append('compilerVersion', vm.compilerVersion)
        formData.append('optimization', vm.optimization)
        formData.append('runs', vm.runs)
        formData.append('target', vm.target)
        formData.append('license', vm.license)
        formData.append('token', token)
        this.$axios
          .post(network.verificatorApi + '/request', formData, {
            onUploadProgress(progressEvent) {
              vm.uploadPercentage = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
            },
          })
          .then((resp) => {
            // eslint-disable-next-line no-console
            console.log('verification request data uploaded:', resp.data)
            vm.requestId = resp.data.data.id
            // eslint-disable-next-line no-console
            console.log('verification request id:', vm.requestId)
          })
          .catch(function (errors) {
            // eslint-disable-next-line no-console
            console.log(errors)
            vm.requestId = null
          })

        // at the end you need to reset recaptcha
        await this.$recaptcha.reset()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('recaptcha error:', error)
      }
    },
    isUnverifiedContract: async (contractId, vm) => {
      const client = vm.$apollo
      const query = gql`
        query contract {
          contract(where: { contract_id: { _eq: "${
            contractId.toLowerCase() || ''
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
  },
}
</script>
