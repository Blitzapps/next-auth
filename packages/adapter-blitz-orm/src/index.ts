import type BormClient from "@blitzapps/blitz-orm"
import { BQLResponseSingle } from "@blitzapps/blitz-orm"
import type { Adapter, AdapterUser, AdapterSession } from "next-auth/adapters"

export const BlitzOrmAdapter = (client: BormClient): Adapter => {
  return {
    createUser: async (data) => {
      const res = await client.mutate(
        { $entity: "User", ...data },
        { noMetadata: true }
      )
      if (!res) {
        return null
      }
      return res as any
    },
    getUser: async (id) => {
      const res = await client.query(
        { $entity: "User", $id: id },
        { noMetadata: true }
      )
      return res as any
    },
    getUserByEmail: async (email) => {
      const res = await client.query(
        { $entity: "User", $filter: { email } },
        { noMetadata: true }
      )
      if (Array.isArray(res) && res.length === 0) {
        return null
      }
      return res as any
    },
    createSession: async (session) => {
      const { userId, ...insertableSession } = session
      const res = await client.mutate({
        $entity: "Session",
        user: userId,
        ...insertableSession,
      })
      const newSession =
        res?.find((r: BQLResponseSingle) => r && r.$entity === "Session") ||
        null
      return newSession
    },
    getSessionAndUser: async (sessionToken) => {
      const res = await client.query(
        {
          $entity: "Session",
          $filter: { sessionToken },
          $fields: ["id", "sessionToken", "expires", { $path: "user" }],
        },
        { noMetadata: true }
      )
      if (!res || Array.isArray(res) || !res.user) {
        return null
      }
      const { user, ...session } = res
      return { user, session: { ...session, userId: user.id } } as unknown as {
        user: AdapterUser
        session: AdapterSession
      }
    },
    updateUser: async (user) => {
      const { id, ...newUser } = user
      const res = await client.mutate(
        {
          $entity: "User",
          $id: user.id,
          ...newUser,
        },
        { noMetadata: true }
      )
      return res as unknown as AdapterUser
    },
    updateSession: async (session) => {
      const { sessionToken, ...newSession } = session
      const queryRes = await client.query({
        $entity: "Session",
        $filter: { sessionToken },
      })
      if (Array.isArray(queryRes) || !queryRes?.$id) {
        return null
      }
      const mutationRes = await client.mutate(
        { $entity: "Session", $id: queryRes.$id, ...newSession },
        { noMetadata: true }
      )
      return mutationRes as unknown as AdapterSession
    },
    linkAccount: async (account) => {
      const { userId, ...insertableAccount } = account
      await client.mutate({
        $entity: "Account",
        user: userId,
        ...insertableAccount,
      })
    },
    getUserByAccount: async (account) => {
      const { provider, providerAccountId } = account
      const res = await client.query(
        {
          $entity: "Account",
          $filter: { provider, providerAccountId },
          $fields: [{ $path: "user" }],
        },
        { noMetadata: true }
      )
      if (!res || !Array.isArray(res) || res.length === 0) {
        return null
      }
      return res[0]?.user || null
    },
    deleteSession: async (sessionToken) => {
      const session = await client.query({
        $entity: "Session",
        $filter: { sessionToken },
      })
      if (!session || Array.isArray(session) || !session?.$id) {
        return null
      }
      await client.mutate({
        $entity: "Session",
        $id: session.$id,
        $op: "delete",
      })
    },
    createVerificationToken: async (token) => {
      const res = await client.mutate(
        { $entity: "VerificationToken", ...token },
        { noMetadata: true }
      )
      return res as any
    },
    useVerificationToken: async (params) => {
      const verificationToken = await client.query(
        {
          $entity: "VerificationToken",
          $filter: { identifier: params.identifier, token: params.token },
        },
        { noMetadata: true }
      )
      if (
        !verificationToken ||
        Array.isArray(verificationToken) ||
        !verificationToken?.id
      ) {
        return null
      }
      const { id, ...cleanVerificationToken } = verificationToken
      await client.mutate({
        $entity: "VerificationToken",
        $id: id,
        $op: "delete",
      })
      return cleanVerificationToken as any
    },
    unlinkAccount: async (account) => {
      const { provider, providerAccountId } = account
      const res = await client.query({
        $entity: "Account",
        $filter: { provider, providerAccountId },
      })
      if (!res || !Array.isArray(res) || res.length === 0 || !res[0]?.$id) {
        return
      }
      const { $id } = res[0]
      await client.mutate({ $entity: "Account", $id, $op: "delete" })
    },
    deleteUser: async (userId) => {
      const userRes = await client.query({ $entity: "User", $id: userId })
      if (!userRes || Array.isArray(userRes) || !userRes?.$id) {
        return
      }
      const { accounts, sessions } = userRes
      await Promise.all([
        ...accounts.map(
          async (id: string) =>
            await client.mutate({ $entity: "Account", $id: id, $op: "delete" })
        ),
        ...sessions.map(
          async (id: string) =>
            await client.mutate({ $entity: "Session", $id: id, $op: "delete" })
        ),
        await client.mutate({
          $entity: "User",
          $id: userId,
          $op: "delete",
        }),
      ])
    },
  }
}
