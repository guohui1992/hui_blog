## 1.GraphQL
GraphQL 是一种查询语言，它允许客户端指定请求的数据结构，服务器根据请求返回相应的数据。传统的 REST API 通常会有固定的端点，而 GraphQL 只提供一个端点，通过查询语言来获取不同的数据。

### 1.1 安装
```shell
npm install express express-graphql graphql --save
```
### 1.2 server1.js
```js
// 引入 express 模块
const express = require("express");
// 从 express-graphql 中引入 graphqlHTTP 方法
const { graphqlHTTP } = require("express-graphql");
// 从 graphql 模块中引入 buildSchema 方法，用于构建 GraphQL 的 schema
const { buildSchema } = require("graphql");
// 定义 GraphQL schema，定义了一个查询类型 Query 和一个用户类型 User
const schema = buildSchema(`
  type Query {
    // 定义查询 user，参数为 id（类型为 String，且是必填项），返回 User 类型
    user(id: String!): User
  }
  type User {
    // User 类型中包含 id, name 和 email 字段，类型均为 String
    id: String
    name: String
    email: String
  }
`);
// 定义一个用户数组，模拟用户数据
const users = [
  { id: "1", name: "zhangsan", email: "zhangsan@qq.com" },
  { id: "2", name: "lisi", email: "lisi@qq.com" },
];
// 定义 root 解析器，其中的 user 函数根据传入的 id 参数查找对应的用户
const root = {
  // 通过传入的 id 参数，使用 find 方法查找 users 数组中对应的用户
  user: ({ id }) => users.find((user) => user.id === id),
};
// 创建一个 express 应用实例
const app = express();
// 使用 express-graphql 中间件，设置 /graphql 路径，配置 schema 和 rootValue，并开启 GraphiQL 界面
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema, // 使用定义的 schema
    rootValue: root, // 使用定义的解析器
    graphiql: true, // 开启 graphiql 界面，方便在浏览器中测试
  })
);
// 监听 4000 端口，启动服务器，并在控制台输出提示信息
app.listen(4000, () =>
  console.log("Running a GraphQL API server at http://localhost:4000/graphql")
);
```
### 1.3 GraphiQL
`http://localhost:4000/graphql`
```js
# 欢迎使用 GraphiQL

GraphiQL 是一个基于浏览器的工具，用于编写、验证和测试 GraphQL 查询。

在屏幕的这一侧输入查询，您将看到智能提示，它能够识别当前的 GraphQL 类型架构，并在文本中实时突出显示语法和验证错误。

GraphQL 查询通常以 "{" 字符开始。以 # 开头的行会被忽略。

一个示例 GraphQL 查询可能如下所示：

{
  field(arg: "value") {
    subField
  }
}

快捷键：

- 格式化查询：Shift-Ctrl-P（或点击上方的格式化按钮）
- 合并查询：Shift-Ctrl-M（或点击上方的合并按钮）
- 运行查询：Ctrl-Enter（或点击上方的运行按钮）
- 自动补全：Ctrl-Space（或直接开始输入）
```
```json
{
  user(id: "1") {
    id
    name
    email
  }
}
```
## 2.参数和变量
在上一节中，我们通过查询直接传递了参数 id，但是在真实世界的应用中，我们通常不会在查询中硬编码值，而是使用变量。这样可以使查询更通用，且易于复用。

我们可以将 id 作为变量传递，而不是在查询中硬编码。
```js
query getUser($userId: String!) {
  user(id: $userId) {
    id
    name
    email
  }
}
```
然后，我们可以传递如下的变量：
```json
{
  "userId": "1"
}
```
+ `query getUser($userId: String!)`：我们定义了一个名为 getUser 的查询，并使用 `$userId` 作为变量。`String!` 表示这是一个非空字符串变量。
+ `user(id: $userId)`：在查询中，我们用变量 `$userId` 代替了之前的硬编码值 "1"。
## 3.复杂的数据结构
GraphQL 的强大之处在于能够查询嵌套数据。我们可以通过关联模型获取更复杂的数据结构。 例如，一个用户可能有多个帖子 (posts)，我们希望能够在同一次查询中获取用户及其所有的帖子。

### 3.1 server3.js
```js
// 引入 express 模块
const express = require("express");
// 从 express-graphql 中引入 graphqlHTTP 方法，处理 GraphQL 请求
const { graphqlHTTP } = require("express-graphql");
// 从 graphql 模块中引入 buildSchema 方法，用于构建 GraphQL 的 schema
const { buildSchema } = require("graphql");
// 定义 GraphQL schema，定义了查询类型 Query、用户类型 User 和帖子类型 Post
const schema = buildSchema(`
  type Query {
    // 定义 user 查询，接收 id 参数（类型为 String，且为必填），返回 User 类型
    user(id: String!): User
  }
  // 定义 User 类型，包含 id、name、email 和 posts 字段
  type User {
    id: String
    name: String
    email: String
    // posts 字段是一个 Post 类型的数组
    posts: [Post]
  }
  // 定义 Post 类型，包含 id、title 和 content 字段
  type Post {
    id: String
    title: String
    content: String
  }
`);

// 定义用户数据数组，包含 id、name、email 和用户的帖子 posts 数据
const users = [
  {
    // 用户 zhangsan 的信息，包含一个帖子
    id: "1",
    name: "zhangsan",
    email: "zhangsan@qq.com",
    posts: [
      {
        id: "101",
        title: "First Post",
        content: "This is my first post",
      },
    ],
  },
  {
    // 用户 lisi 的信息，包含一个帖子
    id: "2",
    name: "lisi",
    email: "lisi@qq.com",
    posts: [
      {
        id: "102",
        title: "Jane's Post",
        content: "This is Jane's post",
      },
    ],
  },
];
// 定义 root 解析器，处理 GraphQL 查询请求
const root = {
  // user 解析器函数，通过传入的 id 参数查找对应的用户信息
  user: ({ id }) => users.find((user) => user.id === id),
};
// 创建一个 express 应用实例
const app = express();
// 使用 express-graphql 中间件，设置 /graphql 路径，配置 schema 和 rootValue，并开启 GraphiQL 界面
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema, // 使用定义的 schema
    rootValue: root, // 使用定义的解析器
    graphiql: true, // 开启 GraphiQL 界面，方便在浏览器中测试
  })
);
// 监听 4000 端口，启动服务器，并在控制台输出提示信息
app.listen(4000, () =>
  console.log("Running a GraphQL API server at http://localhost:4000/graphql")
);
```
### 3.2 graphql
```json
{
  user(id: "1") {
    id
    name
    email
    posts {
      id
      title
      content
    }
  }
}
```
## 4.Mutations（数据修改）
GraphQL 同样支持修改数据的操作，这称为 Mutation。Mutation 和查询的不同之处在于，Mutation 通常会引发数据的改变（如创建、更新或删除）。

### 4.1 server.js
```js
// 引入 express 模块
const express = require("express");
// 从 express-graphql 中引入 graphqlHTTP 方法，处理 GraphQL 请求
const { graphqlHTTP } = require("express-graphql");
// 从 graphql 模块中引入 buildSchema 方法，用于构建 GraphQL 的 schema
const { buildSchema } = require("graphql");
// 定义 GraphQL schema，包含查询类型 Query 和变更类型 Mutation
const schema = buildSchema(`
  type Query {
    // 定义 user 查询，接收 id 参数（类型为 String，且为必填），返回 User 类型
    user(id: String!): User
  }
  type Mutation {
    // 定义 addUser 变更，接收 id、name、email 参数（均为 String 且为必填），返回新增的 User 类型
    addUser(id: String!, name: String!, email: String!): User
  }
  // 定义 User 类型，包含 id、name 和 email 字段
  type User {
    id: String
    name: String
    email: String
  }
`);
// 定义用户数据数组，包含两个初始用户
let users = [
  { id: "1", name: "John Doe", email: "john@example.com" }, // 用户 John Doe 的数据
  { id: "2", name: "Jane Smith", email: "jane@example.com" }, // 用户 Jane Smith 的数据
];
// 定义 root 解析器，处理查询和变更请求
const root = {
  // user 解析器函数，通过传入的 id 参数查找对应的用户信息
  user: ({ id }) => users.find((user) => user.id === id),
  // addUser 解析器函数，接收 id, name, email 参数，创建新用户并将其添加到用户数组
  addUser: ({ id, name, email }) => {
    const newUser = { id, name, email }; // 创建一个新的用户对象
    users.push(newUser); // 将新用户添加到用户数组中
    return newUser; // 返回新创建的用户
  },
};
// 创建一个 express 应用实例
const app = express();
// 使用 express-graphql 中间件，设置 /graphql 路径，配置 schema 和 rootValue，并开启 GraphiQL 界面
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema, // 使用定义的 schema
    rootValue: root, // 使用定义的解析器
    graphiql: true, // 开启 GraphiQL 界面，方便在浏览器中测试
  })
);
// 监听 4000 端口，启动服务器，并在控制台输出提示信息
app.listen(4000, () =>
  console.log("Running a GraphQL API server at http://localhost:4000/graphql")
);
```
### 4.2 GraphiQL
```js
mutation {
  addUser(id: "3", name: "Tom", email: "tom@example.com") {
    id
    name
    email
  }
}
```
## 5.权限管理（Authorization）
在许多应用程序中，不同的用户拥有不同的权限（例如，普通用户、管理员等）。你需要确保某些查询或 Mutation 只能由特定用户访问。GraphQL 本身不提供权限管理的机制，但可以通过中间件或 resolver 实现。

### 5.1 server5.js
```js
const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const schema = buildSchema(`
  type Query {
    user(id: String!): User
  }

  type Mutation {
    deleteUser(id: String!): String
  }

  type User {
    id: String
    name: String
    email: String
  }
`);

let users = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
];

const currentUser = { role: "user" };
const root = {
  user: ({ id }) => users.find((user) => user.id === id),
  deleteUser: ({ id }) => {
    if (currentUser.role !== "admin") {
      throw new Error("Unauthorized! Only admins can delete users.");
    }
    users = users.filter((user) => user.id !== id);
    return `User with id ${id} deleted.`;
  },
};
const app = express();
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);
app.listen(4000, () =>
  console.log("Running a GraphQL API server at http://localhost:4000/graphql")
);
```
### 5.2 graphql
```js
mutation {
  deleteUser(id: "1")
}
```
## 6.性能优化
随着应用的复杂性增加，性能优化成为必须要考虑的问题。GraphQL 查询由于其灵活性，可能会导致过多的数据库查询，尤其是当需要嵌套查询时。典型的性能问题是所谓的 N+1 查询问题。

N+1 查询问题 例如，我们查询用户列表，并获取每个用户的帖子。每次查询一个用户时，都会单独查询该用户的帖子，这导致每个用户需要额外一次数据库查询。如果有 100 个用户，就会进行 1 + 100 次查询，造成性能瓶颈。

DataLoader 是 Facebook 开源的一个工具，用于批量处理和缓存请求，特别适合解决 N+1 问题。

+ postLoader 使用 DataLoader 实现批量查询。batchPosts 函数会批量获取用户的帖子，而不是每次为单个用户查询帖子。
+ DataLoader 会收集多个用户的查询请求，并在一次数据库查询中完成处理，避免了多次查询的开销。
### 6.1 server.js
```js
// 引入 Express.js 框架，用于创建 HTTP 服务器
const express = require("express");
// 从 express-graphql 中引入 graphqlHTTP，用于处理 GraphQL 请求
const { graphqlHTTP } = require("express-graphql");
// 从 graphql 包中引入 buildSchema，用于构建 GraphQL schema
const { buildSchema } = require("graphql");
// 引入 DataLoader，用于批量加载数据，避免 N+1 查询问题
const DataLoader = require("dataloader");
// 定义批量获取用户帖子的方法
const batchPosts = async (userIds) => {
  // 模拟的帖子数据
  const posts = [
    { userId: "1", id: "101", title: "Post 1" },
    { userId: "1", id: "103", title: "Post 3" },
    { userId: "2", id: "102", title: "Post 2" },
  ];
  // 根据 userIds 数组，返回对应用户的帖子数组
  return userIds.map((userId) =>
    posts.filter((post) => post.userId === userId)
  );
};
// 创建 DataLoader 实例，用于批量加载用户的帖子
const postLoader = new DataLoader((userIds) => batchPosts(userIds));
// 使用 buildSchema 定义 GraphQL schema，包括查询类型和数据类型
const schema = buildSchema(`
  type Query {
    user(id: String!): User
  }
  type User {
    id: String
    name: String
    email: String
    posts: [Post]
  }
  type Post {
    id: String
    title: String
  }
`);
// 模拟的用户数据
const users = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
];
// 定义 User 类，用于在解析器中返回用户对象，并包含获取帖子的方法
class User {
  // 构造函数，初始化用户属性
  constructor(userData) {
    this.id = userData.id;
    this.name = userData.name;
    this.email = userData.email;
  }
  // 定义 posts 方法，当请求 User 的 posts 字段时调用
  posts() {
    // 使用 DataLoader 加载该用户的帖子
    return postLoader.load(this.id);
  }
}
// 定义根解析器
const root = {
  // 定义 user 查询的解析器，根据 ID 查找用户
  user: ({ id }) => {
    // 查找对应的用户数据
    const userData = users.find((user) => user.id === id);
    // 如果找到用户，返回 User 类的实例；否则返回 null
    return userData ? new User(userData) : null;
  },
};
// 创建 Express 应用实例
const app = express();
// 使用 graphqlHTTP 中间件处理 /graphql 路径的请求
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema, // 指定 GraphQL schema
    rootValue: root, // 指定解析器
    graphiql: true, // 启用 GraphiQL 调试工具
  })
);
// 启动服务器，监听 4000 端口
app.listen(4000, () =>
  console.log("Running a GraphQL API server at http://localhost:4000/graphql")
);
6.2 GraphiQL
{
  user(id: "1") {
    id
    name
    posts {
      id
      title
    }
  }
}
```
## 7.订阅（Subscriptions）
GraphQL 订阅（Subscription）允许客户端实时接收服务器上的数据更新。当特定事件发生时，服务器可以推送数据给客户端。订阅通常用于聊天、通知、数据流等需要实时更新的场景。

因为 express-graphql 仅支持查询和 Mutation，不支持订阅（Subscriptions）。要测试订阅，你需要使用 WebSocket 进行通讯，而这可以通过结合 apollo-server-express 和 subscriptions-transport-ws 来实现。

我们可以使用 graphql-subscriptions 和 PubSub 来实现订阅功能。每当有新用户添加时，所有订阅者都会收到通知。

### 7.1 安装
```shell
npm install express graphql apollo-server-express  graphql-subscriptions subscriptions-transport-ws
```
### 7.2 server6.js
```js
// 引入 Express.js 框架，用于创建 HTTP 服务器
const express = require("express");
// 从 Apollo Server Express 引入 ApolloServer 和 gql，用于定义 GraphQL 服务器
const { ApolloServer, gql } = require("apollo-server-express");
// 引入 PubSub 来处理 GraphQL 中的发布订阅机制
const { PubSub } = require("graphql-subscriptions");
// 引入原生 HTTP 模块，用于创建 HTTP 服务器
const { createServer } = require("http");
// 引入 subscriptions-transport-ws 中的 SubscriptionServer，用于处理 WebSocket 订阅
const { SubscriptionServer } = require("subscriptions-transport-ws");
// 从 GraphQL 包中引入 execute 和 subscribe 函数，用于处理 GraphQL 的查询和订阅
const { execute, subscribe } = require("graphql");
// 引入 makeExecutableSchema，用于生成可执行的 GraphQL schema
const { makeExecutableSchema } = require("@graphql-tools/schema");
// 创建 PubSub 实例，用于发布和订阅事件
const pubsub = new PubSub();
// 定义 GraphQL schema，包括查询、Mutation 和订阅
const typeDefs = gql`
  type Query {
    user(id: String!): User
  }
  type Mutation {
    addUser(id: String!, name: String!, email: String!): User
  }
  type Subscription {
    userAdded: User
  }
  type User {
    id: String
    name: String
    email: String
  }
`;
// 模拟用户数据
let users = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
];
// 定义 GraphQL 的 resolver，包括查询、Mutation 和订阅
const resolvers = {
  // Query resolver：根据用户 ID 查找用户
  Query: {
    user: (_, { id }) => users.find((user) => user.id === id),
  },
  // Mutation resolver：添加用户，并发布 'USER_ADDED' 事件
  Mutation: {
    addUser: (_, { id, name, email }) => {
      const newUser = { id, name, email };
      users.push(newUser); // 将新用户添加到用户列表中
      pubsub.publish("USER_ADDED", { userAdded: newUser }); // 发布 'USER_ADDED' 事件
      return newUser; // 返回新用户
    },
  },
  // Subscription resolver：订阅 'USER_ADDED' 事件
  Subscription: {
    userAdded: {
      // 当有新的用户添加时，使用 asyncIterator 监听 'USER_ADDED' 事件
      subscribe: () => pubsub.asyncIterator(["USER_ADDED"]),
    },
  },
};
// 使用 typeDefs 和 resolvers 创建可执行的 GraphQL schema
const schema = makeExecutableSchema({ typeDefs, resolvers });
// 立即执行函数，用于启动服务器
(async function () {
  // 创建 Express 应用
  const app = express();
  // 创建 Apollo Server 实例，并将 schema 传入
  const apolloServer = new ApolloServer({ schema });
  // 启动 Apollo Server
  await apolloServer.start();
  // 将 Apollo Server 的中间件添加到 Express 应用中
  apolloServer.applyMiddleware({ app });
  // 创建 HTTP 服务器，传入 Express 应用
  const httpServer = createServer(app);
  // 创建 WebSocket 订阅服务器，监听订阅请求
  SubscriptionServer.create(
    {
      schema, // 使用 GraphQL schema
      execute, // 处理查询
      subscribe, // 处理订阅
    },
    {
      server: httpServer, // 使用 HTTP 服务器
      path: apolloServer.graphqlPath, // 使用相同的路径处理订阅
    }
  );
  // 定义服务器端口
  const PORT = 4000;
  // 启动 HTTP 服务器并监听指定端口
  httpServer.listen(PORT, () => {
    // 打印服务器启动信息
    console.log(
      `Server running at http://localhost:${PORT}${apolloServer.graphqlPath}`
    );
    // 打印 WebSocket 订阅准备就绪信息
    console.log(
      `Subscriptions ready at ws://localhost:${PORT}${apolloServer.graphqlPath}`
    );
  });
})();
```
### 7.3 graphiQL
[apollographql](https://studio.apollographql.com/sandbox?endpoint=http%3A%2F%2Flocalhost%3A4000%2Fgraphql)
```js
subscription {
  userAdded {
    id
    name
    email
  }
}
```
```js
mutation {
  addUser(id: "3", name: "Tom", email: "tom@example.com") {
    id
    name
    email
  }
}
```