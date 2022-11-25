import BormClient from "@blitzapps/blitz-orm"
import { runBasicTests } from "@next-auth/adapter-test"

import authConfig from "../borm/config"
import authSchema from "../borm/schema"
import { BlitzOrmAdapter } from "../src"

const c = new BormClient({ schema: authSchema, config: authConfig })

jest.setTimeout(15000)

runBasicTests({
  adapter: BlitzOrmAdapter(c),
  db: {
    session: async (sessionToken) => {
      const res = await c.query(
        {
          $entity: "Session",
          $filter: { sessionToken: sessionToken },
          $fields: ["id", "sessionToken", "expires", { $path: "user" }],
        },
        { noMetadata: true }
      )
      if (!res || Array.isArray(res)) {
        return null
      }
      const { user, ...session } = res
      return { ...session, userId: user?.id }
    },
    user: async (id) => {
      const res = await c.query(
        { $entity: "User", $id: id },
        { noMetadata: true }
      )
      if (!res) {
        return null
      }
      if (Array.isArray(res)) {
        throw new Error("Unexpected array instead of single user")
      }
      const { accounts, sessions, ...user } = res
      return user
    },
    account: async (providerAccountId: {
      provider: string
      providerAccountId: string
    }) => {
      const res = await c.query(
        {
          $entity: "Account",
          $filter: {
            provider: providerAccountId.provider,
            providerAccountId: providerAccountId.providerAccountId,
          },
        },
        { noMetadata: true }
      )
      if (Array.isArray(res) && res.length === 1) {
        // @ts-expect-error - user is not standard in return type
        const { user, ...account } = res[0]
        return { ...account, userId: user }
      }
      return null
    },
    verificationToken: async (params: {
      identifier: string
      token: string
    }) => {
      const res = await c.query(
        {
          $entity: "VerificationToken",
          $filter: {
            identifier: params.identifier,
            token: params.token,
          },
        },
        { noMetadata: true }
      )
      if (!res) {
        return null
      }
      if (Array.isArray(res)) {
        throw new Error("Unexpected array instead of single user")
      }
      const { id, ...rest } = res
      return rest
    },
  },
})
