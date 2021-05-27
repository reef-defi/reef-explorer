<template>
  <div v-if="request">
    <b-alert show>
      <p>
        Verification status for contract {{ request.addrress }} is
        {{ request.status }}
      </p>
    </b-alert>
  </div>
</template>
<script>
import gql from 'graphql-tag'
export default {
  props: {
    id: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      request: null,
    }
  },
  apollo: {
    $subscribe: {
      account: {
        query: gql`
          subscription contract_verification_request($id: String!) {
            contract_verification_request(where: { id: { _eq: $id } }) {
              contract_id
              status
            }
          }
        `,
        variables() {
          return {
            id: this.id ? this.id : '',
          }
        },
        result({ data }) {
          if (data.contract_verification_request[0]) {
            this.request = data.contract_verification_request[0]
          }
        },
      },
    },
  },
}
</script>
