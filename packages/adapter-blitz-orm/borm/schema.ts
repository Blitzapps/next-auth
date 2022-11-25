import { v4 as uuidv4 } from "uuid"

import type { BormSchema, DataField } from "@blitzapps/blitz-orm"

const id: DataField = {
  shared: true,
  path: "id",
  cardinality: "ONE",
  default: { type: "function", value: () => uuidv4() },
  validations: { required: true, unique: true },
  contentType: "UUID",
}

const email: DataField = {
  path: "email",
  cardinality: "ONE",
  contentType: "EMAIL",
  validations: { unique: true },
}

const timestamp: DataField = {
  path: "timestamp",
  cardinality: "ONE",
  contentType: "DATE",
}

const string: DataField = {
  path: "string",
  contentType: "TEXT",
  cardinality: "ONE",
}

const number: DataField = {
  path: "number",
  contentType: "NUMBER",
  cardinality: "ONE",
}

const authSchema: BormSchema = {
  entities: {
    User: {
      idFields: ["id"],
      defaultDBConnector: { id: "default" },
      dataFields: [
        { ...id },
        { ...string, path: "name" },
        { ...email },
        { ...timestamp, path: "emailVerified" },
        { ...string, path: "image" },
      ],
	  linkFields: [
		{relation: "UserAccount", role: "user", oppositeRole: "account"},
		{relation: "UserSession", role: "user", oppositeRole: "session"},
	  ]
    },
    Account: {
      idFields: ["id"],
      defaultDBConnector: { id: "default" },
      dataFields: [
        { ...id },
        { ...string, path: "type" },
        { ...string, path: "provider" },
        { ...string, path: "providerAccountId" },
        { ...string, path: "refresh_token" },
        { ...string, path: "access_token" },
        { ...number, path: "expires_at" },
        { ...string, path: "token_type" },
        { ...string, path: "scope" },
        { ...string, path: "id_token" },
        { ...string, path: "session_state" },
        { ...string, path: "oauth_token_secret" },
        { ...string, path: "oauth_token" },
      ],
	  linkFields: [
		{relation: "UserAccount", role: "account", oppositeRole: "user"}
	  ]
    },
    Session: {
      idFields: ["id"],
      defaultDBConnector: { id: "default" },
      dataFields: [
        { ...id },
        { ...timestamp, path: "expires" },
        { ...string, path: "sessionToken", validations: { unique: true } },
      ],
	  linkFields: [
		{relation: "UserSession", role: "session", oppositeRole: "user"}
	  ]
    },
    VerificationToken: {
      idFields: ["id"],
      defaultDBConnector: { id: "default" },
      dataFields: [
        { ...id },
        { ...string, path: "identifier" },
        { ...string, path: "token", validations: { unique: true } },
        { ...timestamp, path: "expires" },
      ],
    },
  },
  relations: {
    UserAccount: {
      defaultDBConnector: { id: "default" },
      idFields: ["id"],
      dataFields: [{ ...id }],
      roles: {
		user: {
			entity: "User",
			dbConnector: { id: "default" },
			cardinality: "ONE",
			path: "user",
		  },
        account: {
          entity: "Account",
          dbConnector: { id: "default", path: "account" },
          cardinality: "MANY",
          path: "accounts",
        },
      },
    },
	UserSession: {
		defaultDBConnector: { id: "default" },
		idFields: ["id"],
		dataFields: [{ ...id }],
		roles: {
		  user: {
			  entity: "User",
			  dbConnector: { id: "default", path: "user" },
			  cardinality: "ONE",
			  path: "user",
			},
		  session: {
			entity: "Session",
			dbConnector: { id: "default", path: "session" },
			cardinality: "MANY",
			path: "sessions",
		  },
		},
	}
  },
};

export default authSchema
