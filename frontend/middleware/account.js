import gql from 'graphql-tag'
export default async function ({ app, route, store, redirect }) {
  const id = route.params.id
  if (id.match(/0x*/)) {
    const client = app.apolloProvider.defaultClient
    const query = gql`
      query account {
        account(where: {evm_address: {_eq: "${id.toLowerCase()}"}}) {
          account_id
        }
      }
    `
    const response = await client.query({ query })
    if (response.data.account.lenght > 0) {
      const accountId = response.data.account[0].account_id
      if (accountId) {
        redirect(`/account/${accountId}`)
      } else {
        return false
      }
    } else {
      return false
    }
  }
  return route
}
