## 1.什么是 gRPC？
gRPC 是由 Google 开发的一种高性能、通用的远程过程调用（Remote Procedure Call，简称 RPC）框架。gRPC 采用 HTTP/2 作为底层协议，使用 Protocol Buffers 作为接口定义语言（IDL）和消息序列化方式。它支持多种编程语言，并且提供强大的流式传输和双向通信能力，非常适合在分布式系统或微服务架构中进行高效通信。

## 2.gRPC 的主要特点：
1. **高效的通信**：基于 HTTP/2，gRPC 支持多路复用、流控制和二进制传输，使其具有高效的性能。
2. **跨语言支持**：gRPC 支持多种编程语言，如 Node.js、Go、Java、Python 等。
3. **Protocol Buffers**：gRPC 使用 Protocol Buffers（Protobuf）作为序列化协议，这比 JSON 或 XML 更紧凑和高效。
4. **多种通信模式**：
    + 单次请求/响应（Unary RPC）
    + 服务器流式通信（Server streaming RPC）
    + 客户端流式通信（Client streaming RPC）
    + 双向流式通信（Bidirectional streaming RPC）
## 3. 安装 gRPC 和 Protocol Buffers
```shell
npm install @grpc/grpc-js @grpc/proto-loader
```
+ `@grpc/grpc-js` 是 gRPC 的核心库，用于实现 gRPC 通信。
+ `@grpc/proto-loader` 用于加载 .proto 文件，这些文件定义了 gRPC 服务的接口。
## 4. 定义 gRPC 服务
使用 .proto 文件来定义服务接口和数据结构

hello.proto
```js
// 使用 proto3 语法版本
syntax = "proto3";
// 定义包名为 "hello"
package hello;
// 定义一个 Greeter 服务
service Greeter {
  // 定义一个 RPC 方法 sayHello，接收 HelloRequest，返回 HelloReply
  rpc sayHello (HelloRequest) returns (HelloReply);
}
// 定义 HelloRequest 消息，包含一个字段 name
message HelloRequest {
  // 定义一个字符串类型的 name 字段，并且字段序号为 1
  string name = 1;
}
// 定义 HelloReply 消息，包含一个字段 message
message HelloReply {
  // 定义一个字符串类型的 message 字段，并且字段序号为 1
  string message = 1;
}
```
这段 `.proto` 文件定义了一个简单的 gRPC 服务 Greeter，它通过 sayHello 方法实现接收请求和返回响应的功能，常用于客户端-服务端的通信。

字段序号的作用：每个字段都有一个唯一的数字编号（称为字段序号），这些编号是用来唯一标识消息中的字段的。在 Protobuf 的二进制格式中，消息会被序列化为字节，而不是使用字段名称，而是使用字段序号来引用特定的字段，从而提高效率和减少消息体积。

## 5. 编写 gRPC 服务端代码
server.js
```js
// 导入 gRPC 库
const grpc = require("@grpc/grpc-js");
// 导入 proto 文件加载器，用于解析 .proto 文件
const protoLoader = require("@grpc/proto-loader");
// 同步加载 hello.proto 文件并解析为定义包
const packageDefinition = protoLoader.loadSync("hello.proto", {});
// 使用 gRPC 加载解析后的 proto 定义，生成服务对象
const helloProto = grpc.loadPackageDefinition(packageDefinition).hello;
// 定义 sayHello 方法，用于处理客户端的请求
function sayHello(call, callback) {
  // 从请求中获取客户端传递的 name 参数，并生成响应消息
  const replyMessage = `Hello, ${call.request.name}!`;
  // 通过回调返回响应消息
  callback(null, { message: replyMessage });
}
// 主函数，创建并启动 gRPC 服务器
function main() {
  // 创建一个 gRPC 服务器实例
  const server = new grpc.Server();
  // 注册 Greeter 服务，将 sayHello 方法绑定到服务中
  server.addService(helloProto.Greeter.service, { sayHello: sayHello });
  // 绑定服务器到指定的地址和端口，并启动服务器
  server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      // 如果绑定失败，输出错误信息
      if (error) {
        console.error("绑定失败:", error);
        return;
      }
      // 成功启动服务器，打印启动信息
      console.log(`gRPC 服务器在端口 ${port} 启动`);
    }
  );
}
// 调用主函数，启动 gRPC 服务器
main();
```
+ **加载 .proto 文件**：我们使用 @grpc/proto-loader 加载定义在 hello.proto 文件中的服务接口。
+ **实现 gRPC 方法**：在 sayHello 方法中，我们从 call.request.name 中获取请求的 name 字段，并返回一个消息。
+ **创建 gRPC 服务器**：我们创建了一个 gRPC 服务器并注册 Greeter 服务到服务器上，监听在 0.0.0.0:50051 端口。
## 6. 编写 gRPC 客户端代码
client.js
```js
// 导入 gRPC 库
const grpc = require("@grpc/grpc-js");
// 导入 proto 文件加载器，用于解析 .proto 文件
const protoLoader = require("@grpc/proto-loader");
// 同步加载 hello.proto 文件并解析为定义包
const packageDefinition = protoLoader.loadSync("hello.proto", {});
// 使用 gRPC 加载解析后的 proto 定义，生成服务对象
const helloProto = grpc.loadPackageDefinition(packageDefinition).hello;
// 主函数，创建并调用 gRPC 客户端
function main() {
  // 创建一个 gRPC 客户端，连接到本地的 gRPC 服务器 'localhost:50051'
  // 使用不加密的凭据进行通信（createInsecure）
  const client = new helloProto.Greeter(
    "localhost:50051",
    grpc.credentials.createInsecure()
  );
  // 调用 sayHello 方法，发送一个包含 name 字段的请求对象
  client.sayHello({ name: "World" }, (error, response) => {
    // 如果调用过程中发生错误，打印错误信息
    if (error) {
      console.error("调用服务出错:", error);
    } else {
      // 如果没有错误，打印服务端返回的响应消息
      console.log("服务响应:", response.message);
    }
  });
}
// 调用主函数，启动客户端并调用服务
main();
```
+ **连接服务端**：客户端通过 localhost:50051 连接到 gRPC 服务端。
+ **调用方法**：客户端调用 sayHello 方法，并发送一个包含 name 字段的请求，打印服务端的响应结果。
## 7. 服务器流式通信
### 7.1. hello.proto
hello.proto
```js
syntax = "proto3";
package hello;
service Greeter {
  rpc sayHello (HelloRequest) returns (HelloReply);
+ rpc SayHelloStream (HelloRequest) returns (stream HelloReply);
}
message HelloRequest {
  string name = 1;
}
message HelloReply {
  string message = 1;
}
```
### 7.2. client.js
client.js
```js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('hello.proto', {});
const helloProto = grpc.loadPackageDefinition(packageDefinition).hello;
function main() {
    const client = new helloProto.Greeter('localhost:50051', grpc.credentials.createInsecure());
    client.sayHello({ name: 'World' }, (error, response) => {
        if (error) {
            console.error('调用服务出错:', error);
        } else {
            console.log('服务响应:', response.message);
        }
    });
+   client.sayHelloStream({ name: 'World' }).on('data', (response) => {
+       console.log('服务流响应:', response.message);
+   });
}
main();
```
### 7.3. server.js
server.js
```js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('hello.proto', {});
const helloProto = grpc.loadPackageDefinition(packageDefinition).hello;
function sayHello(call, callback) {
    const replyMessage = `Hello, ${call.request.name}!`;
    callback(null, { message: replyMessage });
}
+function sayHelloStream(call) {
+   const names = ['Alice', 'Bob', 'Charlie'];
+   names.forEach((name, index) => {
+       setTimeout(() => {
+           call.write({ message: `Hello, ${name}!` });
+           if (index === names.length - 1) {
+               call.end();
+           }
+       }, 1000 * (index + 1)); // 每隔 1 秒发送一个消息
+   });
+}
function main() {
    const server = new grpc.Server();
+   server.addService(helloProto.Greeter.service, {
+       sayHello: sayHello,
+       sayHelloStream: sayHelloStream
+   });
    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
            console.error('绑定失败:', error);
            return;
        }
        console.log(`gRPC 服务器在端口 ${port} 启动`);
    });
}
main();
```