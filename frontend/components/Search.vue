<template>
  <!-- Filter -->
  <b-row class="mb-4 search-section">
    <div class="container">
      <label class="search-section__label">Reef Blockchain Explorer</label>
      <b-form-input
        id="searchInput"
        v-model="searchInput"
        class="search-section__input"
        type="search"
        placeholder="Search by block number, block hash, extrinsic hash or account address"
        @keydown.native="doSearch"
      />
      <Chain />
    </div>

    <bubbles :amount="20" />
  </b-row>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import Chain from '@/components/Chain.vue'
import bubbles from './BubblesAnimation.vue'

export default {
  components: { bubbles, Chain },
  mixins: [commonMixin],
  data() {
    return {
      searchInput: '',
    }
  },
  methods: {
    async doSearch(event) {
      if (event.keyCode === 13) {
        if (await this.isExtrinsicHash(this.searchInput)) {
          this.$router.push({
            path: `/extrinsic/${this.searchInput}`,
          })
        } else if (await this.isBlockHash(this.searchInput)) {
          this.$router.push({
            path: `/block/${this.searchInput}`,
          })
        } else if (this.isAddress(this.searchInput)) {
          this.$router.push({
            path: `/account/${this.searchInput}`,
          })
        } else if (this.isBlockNumber(this.searchInput)) {
          this.$router.push({
            path: `/block?blockNumber=${this.searchInput}`,
          })
        }
      }
    },
  },
}
</script>

<style lang="scss">
.search-section {
  position: relative;
  padding: 70px 0 0 0;
  background: linear-gradient(130deg, #a51863, #3c127b);
  margin: 0 !important;

  .search-section__label {
    font-size: 15px;
    font-weight: 500;
    color: white;
    line-height: 1;
    margin-bottom: 12px;
  }

  .search-section__input {
    padding: 25px;
    border: none;
    transition: all 0.2s;
    position: relative;
    z-index: 2;
    margin-bottom: 70px;

    &::placeholder {
      color: rgba(black, 0.75);
    }

    &:hover {
      transition: all 0.15s;
      box-shadow: 0 0 0 5px rgba(white, 0.25);
    }

    &:focus {
      transition: all 0.25s;
      background: white;
      box-shadow: 0 0 0 8px rgba(white, 0.25);
      border-radius: 25px;
      color: black;
    }
  }

  @media only screen and (max-width: 576px) {
    padding: 40px 10px 5px 10px;

    .search-section__input {
      font-size: 14px;
      padding: 25px 20px;
      margin-bottom: 45px;
    }
  }
}
</style>
