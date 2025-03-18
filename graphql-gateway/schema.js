import { gql } from "graphql-tag";

export const typeDefs = gql`
  type Preferences {
    promotions: Boolean
    orderUpdates: Boolean
    recommendations: Boolean
  }

  type User {
    id: Int
    name: String
    email: String
    preferences: Preferences
  }

  type Notification {
    id: Int
    userId: Int
    type: String
    content: String
    sentAt: String
    read: Boolean
  }

  type Recommendation {
    id: Int
    userId: Int
    productId: Int
    reason: String
  }

  type Order {
    id: Int
    userId: Int
    status: String
  }

  type AuthPayload {
    token: String
    userId: Int
  }

  input PreferencesInput {
    promotions: Boolean
    orderUpdates: Boolean
    recommendations: Boolean
  }

  input UserRegisterInput {
    name: String!
    email: String!
    password: String!
    preferences: PreferencesInput
  }

  input UserLoginInput {
    email: String!
    password: String!
  }

  input PlaceOrderInput {
    userId: Int!
  }

  type Query {
    me: User
    userNotifications: [Notification]
    recommendations: [Recommendation]
    orders: [Order]
  }

  type Mutation {
    register(userInput: UserRegisterInput!): User
    login(loginInput: UserLoginInput!): AuthPayload
    updatePreferences(prefsInput: PreferencesInput!): User
    placeOrder(orderInput: PlaceOrderInput!): Order
    markNotificationRead(notificationId: Int!): Boolean
  }
`;
