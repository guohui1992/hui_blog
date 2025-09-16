## 1.什么是 etcd？
etcd 是一个分布式键值存储系统，主要用于分布式系统中的数据存储、服务发现、配置管理和协调等任务。它的设计理念是高可用性和一致性，确保系统能够在分布式环境中可靠地存储和检索数据。etcd 使用 Raft 共识算法来确保分布式系统中的数据一致性，即使在节点宕机或网络分区时，也能够确保数据的正确性。

**主要特点**：

1. 分布式键值存储：etcd 提供一个简单的键值对存储接口，适合用于服务注册、配置存储等场景。
2. 高可用性：通过 Raft 算法等机制，etcd 提供了强一致性和高可用性。
3. 服务发现与配置管理：etcd 可以用来实现分布式系统中的服务发现，微服务可以通过 etcd 注册自己，并通过它发现其他服务的位置。

## 2.etcd 的核心概念
1. 键值对存储（Key-Value Store）：etcd 的核心是简单的键值存储，数据以键值对的形式存储。键是唯一的，可以通过键来检索、更新、删除相关的值。

2. 租约（Lease）：租约是 etcd 中的一个核心机制，它为某些键值对提供生命周期管理。租约到期后，关联的键值对将自动失效。这通常用于服务发现中服务注册的有效期管理。

3. Watch：etcd 提供了 Watch 机制，可以实时监听键的变化，适用于配置变更通知或服务状态变化。

## 3.启动 etcd 服务

## 3.使用 etcd
我们可以使用 etcd3 这个 npm 包来与 etcd 进行交互。etcd3 是一个 Node.js 客户端库，可以帮助我们方便地操作 etcd 服务。

### 3.1. 安装 etcd3
首先，我们需要安装 etcd3 依赖库：
```shell
npm install etcd3
```
### 3.2. 使用 etcd 存储和检索键值
以下是一个基本的 Node.js 示例，展示如何使用 etcd3 存储、获取和删除键值。
```js
// 从 etcd3 库中导入 Etcd3 类
const { Etcd3 } = require("etcd3");

// 配置 etcd 连接选项，包括主机地址、连接超时时间和认证信息
const etcdConfig = {
  hosts: ["http://localhost:2379"], // etcd 服务的地址
  dialTimeout: 5000, // 连接超时时间为 5000 毫秒
  auth: {
    // etcd 服务的用户名和密码
    username: "root",
    password: "root",
  },
};

// 使用配置创建一个新的 etcd 客户端实例
const client = new Etcd3(etcdConfig);
// 定义一个异步函数，用于执行 etcd 的相关操作
async function main() {
  try {
    // 在 etcd 中存储键 "foo" 并将其值设置为 "bar"
    await client.put("foo").value("bar");
    console.log('存储键 "foo" 的值为 "bar"。');
    // 获取键 "foo" 的值
    const value = await client.get("foo").string();
    console.log(`获取键 "foo" 的值为: ${value}`);
    // 删除键 "foo"
    await client.delete().key("foo");
    console.log('删除键 "foo"。');
  } catch (error) {
    // 捕获并打印操作过程中发生的错误
    console.error("操作过程中发生错误:", error.message);
  } finally {
    // 关闭 etcd 客户端连接
    await client.close();
  }
}
// 调用 main 函数，并捕获任何未处理的错误
main().catch(console.error);
3.3. 使用 Watch 监听键的变化
通过 Watch 机制，可以监听某个键的变化，并在键被更新或删除时执行相应的回调。下面是一个监听键 foo 变化的示例：

// 从 etcd3 库中导入 Etcd3 类
const { Etcd3 } = require("etcd3");
// 配置 etcd 连接选项，包括主机地址、连接超时时间和认证信息
const etcdConfig = {
  hosts: ["http://localhost:2379"], // etcd 服务的地址
  dialTimeout: 5000, // 连接超时时间为 5000 毫秒
  auth: {
    // etcd 服务的用户名和密码
    username: "root",
    password: "root",
  },
};
// 使用配置创建一个新的 etcd 客户端实例
const client = new Etcd3(etcdConfig);
// 定义一个异步函数，用于监听键的变化
async function watchKey() {
  // 创建一个 watcher，监听键 "foo" 的变化
  const watcher = await client.watch().key("foo").create();
  // 当键 "foo" 被更新时，触发 'put' 事件，并打印新的值
  watcher.on("put", (res) => {
    console.log(`Key "foo" was updated with value: ${res.value.toString()}`);
  });
  // 当键 "foo" 被删除时，触发 'delete' 事件，并打印提示信息
  watcher.on("delete", () => {
    console.log('Key "foo" was deleted.');
  });
  // 模拟更新键 "foo"，将其值设置为 "new_value"
  await client.put("foo").value("new_value");
  // 模拟删除键 "foo"
  await client.delete().key("foo");
}
// 调用 watchKey 函数，并捕获任何未处理的错误
watchKey().catch(console.error);
这个示例展示了如何监听某个键的变化，当键 foo 被更新时，打印新值；当键 foo 被删除时，打印提示消息。

3.4. 租约（Lease）机制
在分布式系统中，服务可能需要动态注册到 etcd 中，并需要注册信息有生命周期。通过租约机制，我们可以为键设置有效期。租约到期后，键值对会自动失效。

下面的示例演示了如何使用租约创建一个临时的键值对，并在租约到期后自动删除：

// 从 etcd3 库中导入 Etcd3 类
const { Etcd3 } = require("etcd3");
// 配置 etcd 连接选项，包括主机地址、连接超时时间和认证信息
const etcdConfig = {
  hosts: ["http://localhost:2379"], // etcd 服务的地址
  dialTimeout: 5000, // 连接超时时间为 5000 毫秒
  auth: {
    // etcd 服务的用户名和密码
    username: "root",
    password: "root",
  },
};
// 使用配置创建一个新的 etcd 客户端实例
const client = new Etcd3(etcdConfig);
// 定义一个异步函数，用于演示租约和监听功能
async function leaseAndWatchExample() {
  // 创建一个 5 秒的租约，且不自动续约 (autoKeepAlive: false)
  const lease = client.lease(5, { autoKeepAlive: false });
  // 在租约内，设置键 "service/foo" 的值为 'temporary_value'
  await lease.put("service/foo").value("temporary_value");
  console.log('创建了一个5秒的租约，并设置了键 "service/foo"');
  // 开始监听键 "service/foo" 的变化
  console.log('开始监听键 "service/foo" 的变化...');
  const watcher = await client
    .watch()
    .key("service/foo") // 指定监听的键
    .create(); // 创建监听
  // 当键 "service/foo" 被更新时，触发 'put' 事件
  watcher
    .on("put", (response) => {
      console.log('键 "service/foo" 被更新:', response.value.toString());
    })
    // 当键 "service/foo" 被删除时，触发 'delete' 事件
    .on("delete", () => {
      console.log('键 "service/foo" 被删除');
    });
  // 等待 6 秒后检查键 "service/foo" 的状态（租约已过期时键会被删除）
  setTimeout(async () => {
    const value = await client.get("service/foo").string(); // 获取键值
    console.log(`6秒后，键 "service/foo" 的值为: ${value || "已过期"}`);
  }, 6000);
  // 等待 10 秒后取消监听，并关闭 etcd 客户端连接
  setTimeout(async () => {
    watcher.cancel(); // 取消对键 "service/foo" 的监听
    console.log("停止监听");
    await client.close(); // 关闭 etcd 客户端
  }, 10000);
}
// 执行异步函数，并捕获任何未处理的错误
leaseAndWatchExample().catch(console.error);
在这个示例中，键 service/foo 被设置为一个 5 秒的租约，租约到期后，该键值会自动删除。

3.5.服务发现
在微服务架构中，etcd 可以作为服务注册中心。每个微服务将自己注册到 etcd 中，并且其他微服务可以通过 etcd 来发现和连接这些服务。

const { Etcd3 } = require("etcd3"); // 从 etcd3 库中导入 Etcd3 类
// 配置 etcd 连接选项，包括主机地址、连接超时时间和认证信息
const etcdConfig = {
  hosts: ["http://localhost:2379"], // etcd 服务的地址
  dialTimeout: 5000, // 连接超时时间为 5000 毫秒
  auth: {
    // etcd 服务的用户名和密码
    username: "root",
    password: "root",
  },
};
// 创建 etcd 客户端实例
const client = new Etcd3(etcdConfig);
// 注册服务，serviceName 为服务名称，serviceAddress 为服务地址，ttl 为租约的生存时间
async function registerService(serviceName, serviceAddress, ttl = 10) {
  const lease = client.lease(ttl); // 创建一个带有指定生存时间的租约
  await lease.put(`services/${serviceName}`).value(serviceAddress); // 将服务名称和地址存储在 etcd 中
  console.log(`服务 ${serviceName} 已注册，地址: ${serviceAddress}`); // 打印注册服务的日志
  return lease; // 返回租约对象
}
// 发现服务，serviceName 为服务名称，返回对应的服务地址
async function discoverService(serviceName) {
  const value = await client.get(`services/${serviceName}`).string(); // 从 etcd 获取服务地址
  return value; // 返回服务地址
}
// 监听服务的变化，serviceName 为服务名称
async function watchService(serviceName) {
  const watcher = await client
    .watch() // 创建一个监视器来监听服务变化
    .key(`services/${serviceName}`) // 指定要监听的服务
    .create();
  // 当服务地址更新时触发 'put' 事件
  watcher
    .on("put", (response) => {
      console.log(`服务 ${serviceName} 更新: ${response.value.toString()}`); // 打印更新后的服务地址
    })
    // 当服务被删除时触发 'delete' 事件
    .on("delete", () => {
      console.log(`服务 ${serviceName} 已下线`); // 打印服务下线日志
    });
  return watcher; // 返回监视器对象
}
// 主函数，演示服务注册、发现、监听和取消操作
async function main() {
  try {
    // 注册服务 'myapp'，地址为 'http://localhost:3000'
    const serviceLease = await registerService(
      "myapp",
      "http://localhost:3000"
    );
    // 发现服务 'myapp'，并打印其地址
    const serviceAddress = await discoverService("myapp");
    console.log(`发现服务 myapp，地址: ${serviceAddress}`);
    // 监听服务 'myapp' 的变化
    const watcher = await watchService("myapp");
    // 5 秒后更新服务地址为 'http://localhost:3001'
    setTimeout(async () => {
      await registerService("myapp", "http://localhost:3001");
    }, 5000);
    // 15 秒后取消监听、撤销租约并关闭 etcd 客户端
    setTimeout(async () => {
      watcher.cancel(); // 取消服务的监听
      await serviceLease.revoke(); // 撤销租约，服务下线
      await client.close(); // 关闭 etcd 客户端
      console.log("结束"); // 打印结束日志
    }, 15000);
  } catch (error) {
    // 捕获并打印操作过程中发生的错误
    console.error("操作过程中发生错误:", error.message);
  }
}
// 执行主函数，并捕获任何未处理的错误
main().catch(console.error);
```