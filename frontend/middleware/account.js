import { gql } from 'graphql-tag'
import { toChecksumAddress } from 'web3-utils'
export default async function ({ app, route, store, redirect }) {
  const id = route.params.id

  const checkAddress = () => {
    let check
    try {
      check = toChecksumAddress(id)
    } catch {
      return false
    }

    return check
  }

  if (id.match(/0x*/)) {
    const client = app.apolloProvider.defaultClient
    const query = gql`
      query account {
        account(where: {evm_address: {_eq: "${checkAddress()}"}}) {
          address
        }
      }
    `
    const response = await client.query({ query })
    if (response.data.account.length > 0) {
      const accountId = response.data.account[0].address
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
