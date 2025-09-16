## 1.微服务架构
微服务架构是一种将应用程序拆分为多个小型、独立的服务的架构，每个服务通常只负责单一的功能。各个服务之间通过消息通信，而不是通过共享数据库或者直接的 HTTP 请求来交互。

## 2. @nestjs/microservices
`@nestjs/microservices` 是 NestJS 框架中的一个模块，用于创建和管理微服务架构。它使得开发者可以使用不同的通信协议（如 TCP、gRPC、Redis、NATS 等）在分布式系统中轻松构建可扩展的微服务。NestJS 提供了统一的 API，开发者可以通过这种 API 方便地创建、管理和扩展微服务系统。

## 3. @nestjs/microservices 的主要功能
1. 多种通信协议支持：

+ TCP：点对点通信。
+ Redis：通过 Redis 发布/订阅的消息传递机制进行通信。
+ NATS：支持 NATS 作为消息传递的基础。
+ MQTT：使用 MQTT 协议进行通信，常用于物联网设备。
+ gRPC：高效的远程过程调用协议（RPC），适用于高性能、跨语言的服务通信。
2. 消息模式：

+ Request/Response（请求/响应）：一个服务请求数据，另一个服务返回响应。这种模式类似于 HTTP 请求和响应。
+ Event-Driven（事件驱动）：服务通过发布事件，而其他服务可以订阅和监听这些事件。这种模式更松散耦合，适合处理异步任务。
## 4.创建微服务
### 4.1创建 user 微服务
```shell
nest new microservice
npm install @nestjs/microservices --save
nest g app user
nest g app product

npm run start:dev user
npm run start:dev
```
### 4.1. user.controller.ts
apps/user/src/user.controller.ts
```js
import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
+import { MessagePattern } from '@nestjs/microservices';
@Controller()
export class UserController {
+ constructor(private readonly userService: UserService) { }
+ // 监听模式为 'sum' 的消息，接收两个数字并返回它们的和
+ @MessagePattern('sum')
+ sum(data: number[]): number {
+   return data.reduce((a, b) => a + b, 0);
  }
}
```

要处理从其他服务发送的消息，我们使用 `@MessagePattern()` 装饰器来定义服务端的消息处理函数。

`@MessagePattern('sum')` 装饰器表示该微服务会监听 `sum` 事件，处理传入的数据，并返回结果。

### 4.2. main.ts
apps/user/src/main.ts
```js
import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
+import { Transport } from '@nestjs/microservices';
async function bootstrap() {
+ // 创建一个 TCP 微服务，监听在 8877 端口
+ const app = await NestFactory.createMicroservice(UserModule, {
+   transport: Transport.TCP,
+   options: {
+     host: '127.0.0.1',  // 微服务监听的主机
+     port: 8877,         // 微服务监听的端口
+   },
+ });
+ await app.listen();
}
bootstrap();
```
### 4.3. app.controller.ts
apps/microservices/src/app.controller.ts

客户端可以通过 `ClientProxy` 来与微服务进行通信。下面是一个 HTTP 控制器，它向微服务发送消息，并接收响应。

在这个客户端示例中，`ClientProxyFactory.create()` 创建了一个 TCP 客户端，client.send() 用于向微服务发送请求消息。发送 sum 事件并传递数据 [1, 2]，然后微服务计算并返回结果。
```js
import { Controller, Get } from '@nestjs/common';
+import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
+import { firstValueFrom } from 'rxjs';
@Controller()
export class AppController {
+ private client: ClientProxy;
+
+ constructor() {
+   // 创建一个 TCP 客户端，连接到微服务
+   this.client = ClientProxyFactory.create({
+     transport: Transport.TCP,
+     options: { host: '127.0.0.1', port: 8877 },
+   });
+ }

+ @Get('sum')
+ async accumulate() {
+   // 发送消息 'sum' 给微服务，并传递两个数字
+   const result = await firstValueFrom(this.client.send<number>('sum', [1, 2]));
+   return result;
  }
}
```
## 5.事件驱动的通信
除了请求/响应模式，@nestjs/microservices 还支持事件驱动的通信模式。服务可以通过 emit() 方法来发布事件，而其他服务可以订阅这些事件并做出响应。

### 5.1. user.controller.ts
apps/user/src/user.controller.ts
```js
import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
+import { EventPattern, MessagePattern } from '@nestjs/microservices';
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }
  // 监听模式为 'sum' 的消息，接收两个数字并返回它们的和
  @MessagePattern('sum')
  sum(data: number[]): number {
    return data.reduce((a, b) => a + b, 0);
  }
+
+ // 事件处理
+ @EventPattern('user_created')
+ handleUserCreated(data: any) {
+   console.log('User Created Event:', data);
+ }
}
```
### 5.2. app.controller.ts
apps/microservices/src/app.controller.ts
```js
import { Controller, Get } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
@Controller()
export class AppController {
  private client: ClientProxy;

  constructor() {
    // 创建一个 TCP 客户端，连接到微服务
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: 8877 },
    });
  }

  @Get('sum')
  async accumulate() {
    // 发送消息 'sum' 给微服务，并传递两个数字
    const result = await firstValueFrom(this.client.send<number>('sum', [1, 2]));
+   // 事件发布
+   this.client.emit('user_created', { id: 1, name: 'John Doe' });
    return result;
  }
}
```
## 6. gRPC 微服务
### 6.1 安装
```shell
npm install @grpc/grpc-js @nestjs/microservices
```
### 6.2. hello.proto
apps/microservices/src/hello.proto
```js
syntax = "proto3";
package hello;
service Greeter {
  rpc sayHello (HelloRequest) returns (HelloReply){}
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```
### 6.3. hello.proto
apps/user/src/hello.proto
```js
syntax = "proto3";
package hello;
service Greeter {
  rpc sayHello (HelloRequest) returns (HelloReply) {}
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```
### 6.4. user.controller.ts
apps/user/src/user.controller.ts
```js
+import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
+import { GrpcMethod } from '@nestjs/microservices';
+
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }
+ // 使用 @GrpcMethod 装饰器实现 sayHello 方法
+ @GrpcMethod('Greeter', 'sayHello')
+ sayHello(data: { name: string }): { message: string } {
+   // 处理客户端请求，并返回 HelloReply 消息
+   return { message: `Hello, ${data.name}!` };
  }
}
```
### 6.5. main.ts
apps/user/src/main.ts
```js
import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
+import { Transport, MicroserviceOptions } from '@nestjs/microservices';
+import { join } from 'path';
+
async function bootstrap() {
+ const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserModule, {
+   transport: Transport.GRPC,
    options: {
+     package: 'hello',
+     protoPath: join(__dirname, 'hello.proto'),
+     url: '0.0.0.0:50051',
    },
  });
  await app.listen();
+ console.log('gRPC 微服务正在监听');
}
bootstrap();
```
### 6.6. app.module.ts
apps/microservices/src/app.module.ts
```js
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
+import { ClientsModule, Transport } from '@nestjs/microservices';
+import { join } from 'path';

@Module({
+ imports: [
+   ClientsModule.register([
+     {
+       name: 'USER_PACKAGE',
+       transport: Transport.GRPC,
+       options: {
+         package: 'hello',
+         protoPath: join(__dirname, 'hello.proto'),
+         url: '0.0.0.0:50051',
+       },
+     },
+   ]),
+ ],
  controllers: [AppController],
})
+export class AppModule { }
```
### 6.7. app.controller.ts
apps/microservices/src/app.controller.ts
```js
+import { Controller, Get, Inject, Param } from '@nestjs/common';
+import { ClientGrpc } from '@nestjs/microservices';
+import { firstValueFrom, Observable } from 'rxjs';
+
+interface HelloRequest {
+ name: string;
+}
+
+interface HelloReply {
+ message: string;
+}
+
+interface GreeterService {
+ sayHello(data: HelloRequest): Observable<HelloReply>;
+}
+
@Controller()
export class AppController {
+ private greeterService: GreeterService;
+
+ constructor(@Inject('USER_PACKAGE') private readonly userClient: ClientGrpc) { }

+ onModuleInit() {
+   this.greeterService = this.userClient.getService<GreeterService>('Greeter');
  }

+ @Get('greet/:name')
+ async greet(@Param('name') name: string) {
+   return firstValueFrom(this.greeterService.sayHello({ name }));
  }
}
```
### 6.8. nest-cli.json
nest-cli.json
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/microservices/src",
  "compilerOptions": {
+   "assets": [
+     "**/*.proto"
+   ],
+   "watchAssets": true,
    "deleteOutDir": true,
    "webpack": true,
    "tsConfigPath": "apps/microservices/tsconfig.app.json"
  },
  "monorepo": true,
  "root": "apps/microservices",
  "projects": {
    "microservices": {
      "type": "application",
      "root": "apps/microservices",
      "entryFile": "main",
      "sourceRoot": "apps/microservices/src",
      "compilerOptions": {
        "tsConfigPath": "apps/microservices/tsconfig.app.json"
      }
    },
    "user": {
      "type": "application",
      "root": "apps/user",
      "entryFile": "main",
      "sourceRoot": "apps/user/src",
      "compilerOptions": {
        "tsConfigPath": "apps/user/tsconfig.app.json"
      }
    },
    "product": {
      "type": "application",
      "root": "apps/product",
      "entryFile": "main",
      "sourceRoot": "apps/product/src",
      "compilerOptions": {
        "tsConfigPath": "apps/product/tsconfig.app.json"
      }
    }
  }
}
```