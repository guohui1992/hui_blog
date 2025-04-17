# 01 Nest 介绍

[官网](https://docs.nestjs.com/)

## 1 Nest

### 1.1 安装

```shell
npm install ts-node
```

### 1.2 配置

.vscode/launch.json

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug ts",
            "type": "node",
            "request": "launch",
            "runtimeArgs": [
                "-r",
                "ts-node/register"
            ], //核心
            "args": [
                "${relativeFile}"
            ]
        }
    ]
}
```

## 2 启动Nest

```shell
npm i --save @nestjs/core @nestjs/common rxjs reflect-metadata @nestjs/platform-express
npm install -g ts-node
```

含义

| 包名                     | 介绍                                                         |
| ------------------------ | ------------------------------------------------------------ |
| @nestjs/core             | NestJS 框架的核心模块，提供构建、启动和管理 NestJS 应用程序的基础设施。 |
| @nestjs/common           | 包含构建 NestJS 应用的基础设施和常用装饰器、工具类、接口等，用于定义控制器、服务、中间件、守卫、拦截器、管道、异常过滤器等。 |
| rxjs                     | 用于构建异步和事件驱动程序的库，基于可观察序列的概念，提供强大的功能来处理异步数据流。 |
| reflect-metadata         | 在 JavaScript 和 TypeScript 中实现元编程的库，通过提供元数据反射 API，允许在运行时检查和操作对象的元数据。 |
| @nestjs/platform-express | NestJS 的平台适配器，用于将 NestJS 应用与 Express.js 集成，提供 Express.js 的中间件、路由等功能，并享受 NestJS 的模块化、依赖注入等高级特性。 |
| ts-node                  | 是一个用于直接执行 TypeScript 代码的 Node.js 实现，它允许开发者在不预先编译的情况下运行 TypeScript 文件 |

### 2.2 src/main.ts

```ts
// 从 @nestjs/core 模块中导入 NestFactory，用于创建 Nest 应用实例
import { NestFactory } from '@nestjs/core';
// 导入应用的根模块 AppModule
import { AppModule } from './app.module';
// 定义一个异步函数 bootstrap，用于启动应用
async function bootstrap() {
  // 使用 NestFactory.create 方法创建一个 Nest 应用实例，并传入根模块 AppModule
  const app = await NestFactory.create(AppModule);
  // 让应用监听 3000 端口
  await app.listen(3000);
}
// 调用 bootstrap 函数，启动应用
bootstrap();
```

NestFactory 是NestJS框架中用于创建Nest应用实例的核心类。它提供了一组静态方法，用于引导和启动应用程序。

NestFactory.create 创建一个Nest应用实例，默认使用Express作为底层HTTP服务器

### 2.3 app.modules.ts

```ts
// 从 '@nestjs/common' 模块中导入 Module 装饰器
import { Module } from '@nestjs/common';
// 从当前目录导入 AppController 控制器
import { AppController } from './app.controller';
// 使用 @Module 装饰器定义一个模块
@Module({
  // 在 controllers 属性中指定当前模块包含的控制器
  controllers: [AppController],
})
// 定义并导出 AppModule 模块
export class AppModule {}
```

@Module 是NestJS框架中的一个装饰器，用于定义模块。

模块是组织代码的基本单元，他们将相关的组件（如控制器、服务、提供者）组合在一起。NestJS 的模块系统受到了Angular的启发，旨在促进代码的模块化和可维护性。

### 2.4 app.controller.ts

```ts
// 导入 Controller 和 Get 装饰器
import { Controller, Get } from '@nestjs/common';
// 使用 @Controller 装饰器标记类为控制器
@Controller()
export class AppController {
  // 构造函数，目前没有任何参数和逻辑
  constructor() {}
  // 使用 @Get 装饰器标记方法为处理 GET 请求的路由
  @Get()
  // 定义 getHello 方法，返回类型为字符串
  getHello(): string {
    // 返回字符串 'hello'
    return 'hello';
  }
}
```

@Controller 是NestJS框架中的一个装饰器，用于将控制器方法映射到HTTP GET请求。这个装饰器是由 @nestjs/common 模块提供的。通过使用 @Get 装饰器，可以指定该方法处理特定路径上的GET请求。

### 2.5 package.json

```json
{
  "name": "2.first-step",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "ts-node src/main.ts"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@nestjs/common": "^10.3.9",
    "@nestjs/core": "^10.3.9",
    "@nestjs/platform-express": "^10.3.9",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  }
}
```

### 2.6 tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs", // 指定生成的模块代码的模块系统为 CommonJS，这是 Node.js 的模块系统。
    "declaration": true, // 生成 .d.ts 声明文件。
    "removeComments": true, // 删除编译后的注释。
    "emitDecoratorMetadata": true, // 为装饰器生成元数据。
    "experimentalDecorators": true, // 启用实验性的装饰器特性。
    "allowSyntheticDefaultImports": true, // 允许从没有默认导出的模块中默认导入。
    "esModuleInterop": true, // 启用所有与模块互操作相关的功能，包括为所有 export = 的模块生成默认导出，确保这些模块在 TypeScript 中可以使用默认导入语法，同时也包含了 "allowSyntheticDefaultImports" 的功能。
    "target": "ES2021", // 指定 ECMAScript 目标版本为 ES2021。
    "sourceMap": true, // 生成对应的 .map 文件。
    "outDir": "./dist", // 指定编译输出目录为 ./dist。
    "baseUrl": "./", // 设置解析非相对模块名的基准目录为 ./。
    "incremental": true, // 启用增量编译，提升编译速度。
    "skipLibCheck": true, // 跳过对所有声明文件的类型检查。
    "strictNullChecks": false, // 不启用严格的空值检查。
    "noImplicitAny": false, // 不禁止隐式 any 类型。
    "strictBindCallApply": false, // 不启用严格的 bind、call 和 apply 方法检查。
    "forceConsistentCasingInFileNames": false, // 不强制文件名大小写一致。
    "noFallthroughCasesInSwitch": false, // 不禁止 switch 语句中的 case 语句贯穿（fall through）。
  }
}
```

含义：

| 选项名                             | 选项介绍                                                     |
| ---------------------------------- | ------------------------------------------------------------ |
| `module`                           | 指定生成的模块代码的模块系统，`commonjs` 是 Node.js 的模块系统。 |
| `declaration`                      | 生成 `.d.ts` 声明文件。                                      |
| `removeComments`                   | 删除编译后的注释。                                           |
| `emitDecoratorMetadata`            | 为装饰器生成元数据。                                         |
| `experimentalDecorators`           | 启用实验性的装饰器特性。                                     |
| `esModuleInterop`                  | 允许从没有默认导出的模块中默认导入。这对于兼容性模块非常有用。 |
| `target`                           | 指定 ECMAScript 目标版本，`ES2021` 是一种现代的 JavaScript 版本。 |
| `sourceMap`                        | 生成对应的 `.map` 文件。                                     |
| `outDir`                           | 指定编译输出目录为 `./dist`。                                |
| `baseUrl`                          | 设置解析非相对模块名的基准目录为 `./`。                      |
| `incremental`                      | 启用增量编译，提升编译速度。                                 |
| `skipLibCheck`                     | 跳过对所有声明文件的类型检查。                               |
| `strictNullChecks`                 | 启用严格的空值检查。                                         |
| `noImplicitAny`                    | 禁止隐式 `any` 类型。                                        |
| `strictBindCallApply`              | 启用严格的 `bind`、`call` 和 `apply` 方法检查。              |
| `forceConsistentCasingInFileNames` | 强制文件名大小写一致。                                       |
| `noFallthroughCasesInSwitch`       | 禁止 switch 语句中的 case 语句贯穿（fall through）。         |

## 参考

### 1 ts-node

ts-node 是一个用于直接执行TypeScript 代码的Nodejs 实现，它允许开发者在不预先编译的情况下 运行 TypesScript 文件。 ts-node 结合了 TypeScript编译器和Nodejs，使得开发和测试 TypeScript 代码更加便捷。

**核心功能**

**1.即时编译和执行**

+ ts-node 在运行时即时编译ts代码，并将其传递给Nodejs执行，避免了需要先手动编译ts代码为js的步骤。

**2.REPL环境**

+ 提供一个REPL（Read-Eval-Print Loop）环境，可以在其中直接输入和执行ts代码，类似与Nodejs REPL。

**3.集成TypeScript配置**

+ ts-node 可以读取和使用项目中的tsconfig.json 配置文件，以确保代码按照指定的 TypeScript 编译选项执行。



**安装**

可以通过npm安装 ts-node

```shell
npm install -g ts-node
```

**基本用法**

**1.直接运行TypeScript文件**

```shell
ts-node src/index.ts
```

**2.使用REPL**

```shell
ts-node
```

进入REPL环境后，可以直接输入和执行TypeScript代码。

**3.指定tsconfig.json**

如果需要使用指定的tsconfig.json配置文件，可以使用 --project 选项：

```shell
ts-node --project tsconfig.json
```

**配置实例**

tsconfig.json 是TypeScript的配置文件，ts-node 会读取并应用其中的配置，例如：

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "strict": true,
    "esModuleInterop": true
  }
}
```

在上述配置中，TypeScript 编译器会将代码编译为 ES2020 标准的 JavaScript，并启用严格模式。

**配合其他工具**

**1.与nodemon配合**

在开发过程中，可以结合 `nodemon` 使用 `ts-node`，以便在代码更改时自动重启应用：

```shell
nodemon --exec ts-node src/index.ts
```

**使用Jest**

在 `jest.config.js` 中配置：

```json
module.exports = {
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js']
};
```

**性能优化**

在大型项目中，运行 TypeScript 代码的性能可能会受到影响。可以使用一些选项来优化 `ts-node` 的性能：

**跳过类型检查**： 使用 `--transpile-only` 选项跳过类型检查，只进行转译：

```shell
ts-node --transpile-only src/index.ts
```

**启用缓存**： 使用 `--cache` 选项启用编译结果的缓存，以加快后续运行速度：

```shell
ts-node --cache src/index.ts
```

**使用 swc 编译器**： `swc` 是一个速度非常快的 TypeScript/JavaScript 编译器，可以与 `ts-node` 配合使用：

首先安装 `ts-node` 和 `@swc/core`：

```shell
npm install ts-node @swc/core @swc/helpers
```

然后使用 `ts-node` 时指定 `swc` 作为编译器：

```shell
ts-node --swc src/index.ts
```

**总结**

`ts-node` 是一个强大的工具，使开发者能够在 Node.js 环境中直接运行 TypeScript 代码，而无需预先编译。它简化了开发流程，提高了开发效率，特别适合于快速开发和测试 TypeScript 应用程序。通过结合其他工具（如 nodemon 和测试框架），`ts-node` 能够在开发工作流中发挥更大的作用。

### 2 @nestjs/core

`@nestjs/core` 是 NestJS 框架的核心模块，提供了构建、启动和管理 NestJS 应用程序的基础设施。它包含了一些关键的类、接口和功能，用于处理依赖注入、模块管理、生命周期管理等。下面将详细讲解 `@nestjs/core` 的主要组成部分和它们的功能。

**主要功能和组成部分**

**NestFactory**：

- 用于创建和启动 NestJS 应用程序。它提供了静态方法 `create` 和 `createMicroservice`，用于分别创建标准的 HTTP 应用和微服务应用。

**INestApplication**：

- 这是 NestJS 应用实例的接口，定义了应用实例的方法和属性。
- 主要方法：
  - `listen(port, callback)`: 启动应用并监听指定端口。
  - `getHttpServer()`: 获取底层的 HTTP 服务器实例。
  - `close()`: 关闭应用。

**ModuleRef**：

- 模块引用，用于在运行时动态解析和获取模块中的提供者实例。
- 主要方法：
  - `get<T>(type: Type<T> | string | symbol, options?: { strict: boolean }): T`: 获取指定类型或标识符的提供者实例。
  - `resolve<T>(type: Type<T> | string | symbol, options?: { strict: boolean }): Promise<T>`: 异步获取指定类型或标识符的提供者实例。

**Reflector**：

- 反射工具类，用于获取和处理装饰器元数据。在实现守卫、拦截器、管道等功能时，常用于访问自定义元数据。
- 主要方法：
  - `get<T, K>(metadataKey: K, target: Type<any> | Function): T`: 获取指定元数据键的值。
  - `getAll<T>(metadataKey: any): T[]`: 获取所有元数据键的值。

**生命周期钩子**：

- NestJS 提供了一些生命周期钩子，用于在应用程序的不同阶段执行自定义逻辑。
- 主要接口：
  - `OnModuleInit`: 实现 `onModuleInit` 方法，在模块初始化时执行。
  - `OnModuleDestroy`: 实现 `onModuleDestroy` 方法，在模块销毁时执行。
  - `OnApplicationBootstrap`: 实现 `onApplicationBootstrap` 方法，在应用程序启动完成时执行。
  - `OnApplicationShutdown`: 实现 `onApplicationShutdown` 方法，在应用程序关闭时执行。

**代码示例**

以下是一个使用 `@nestjs/core` 构建和启动 NestJS 应用程序的示例：

```ts
import { NestFactory } from '@nestjs/core';
import { Module, Injectable, Controller, Get } from '@nestjs/common';

// 服务
@Injectable()
class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}

// 控制器
@Controller()
class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

// 模块
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
class AppModule {}

// 创建和启动应用
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
```

**详解**

**服务 (AppService)**：

- `@Injectable` 装饰器标记 AppService 类为可注入服务。
- `getHello` 方法返回字符串 "Hello World!"。

**控制器 (AppController)**：

- `@Controller` 装饰器标记 AppController 类为控制器。
- `@Get` 装饰器标记 `getHello` 方法为处理 GET 请求的路由。

**模块 (AppModule)**：

- `@Module` 装饰器配置模块的控制器和提供者。

**应用启动 (bootstrap)**：

- 使用 `NestFactory.create` 方法创建应用实例。
- 通过 `app.listen` 启动应用监听 3000 端口，并输出应用运行信息。

通过 `@nestjs/core` 提供的这些功能，开发者可以构建、配置和管理 NestJS 应用程序的各个方面，从而实现高效、可扩展的应用开发。

### 3. @nestjs/common

`@nestjs/common` 是 NestJS 框架的核心模块之一，包含了构建 NestJS 应用程序的基础设施和常用装饰器、工具类、接口等。它提供了一些常用的功能，用于定义控制器、服务、中间件、守卫、拦截器、管道、异常过滤器等。

**主要功能**

**1. 控制器 (Controllers)**：

- **@Controller**：标记一个类为控制器，控制器用于定义处理传入请求的路由和方法。
- **HTTP 方法装饰器**：如 `@Get`、`@Post`、`@Put`、`@Delete` 等，用于标记控制器方法对应的 HTTP 请求方法和路由。

**2.提供者 (Providers)**：

- **@Injectable**：标记一个类为可注入的服务，服务可以在控制器或其他服务中通过依赖注入的方式使用。

**3.中间件 (Middleware)**：

- **NestMiddleware**：接口，用于定义中间件类，实现 `use` 方法来处理请求。
- **MiddlewareConsumer**：用于配置中间件在模块中的应用。

**4.守卫 (Guards)**：

- **CanActivate**：接口，用于定义守卫类，实现 `canActivate` 方法来决定请求是否可以继续处理。
- **@UseGuards**：装饰器，用于在控制器或方法级别应用守卫。

**5.拦截器 (Interceptors)**：

- **NestInterceptor**：接口，用于定义拦截器类，实现 `intercept` 方法来处理请求和响应。
- **@UseInterceptors**：装饰器，用于在控制器或方法级别应用拦截器。

**6.管道 (Pipes)**：

- **PipeTransform**：接口，用于定义管道类，实现 `transform` 方法来转换和验证请求数据。
- **@UsePipes**：装饰器，用于在控制器或方法级别应用管道。

**7.异常过滤器 (Exception Filters)**：

- **ExceptionFilter**：接口，用于定义异常过滤器类，实现 `catch` 方法来处理异常。
- **@UseFilters**：装饰器，用于在控制器或方法级别应用异常过滤器。

**8.元数据与反射 (Metadata & Reflection)**：

- **ReflectMetadata**：装饰器，用于定义自定义元数据。
- **Reflector**：工具类，用于获取和处理装饰器元数据。

**常用装饰器和工具类**

- **@Inject**：用于显式注入依赖。
- **@Optional**：用于标记可选依赖。
- **@Headers**：获取请求头信息。
- **@Body**：获取请求体数据。
- **@Query**：获取查询参数。
- **@Param**：获取路由参数。
- **@Req**：获取请求对象。
- **@Res**：获取响应对象。
- **@Next**：获取下一步中间件函数。

**代码示例**

以下是一个使用 `@nestjs/common` 构建的简单 NestJS 应用示例：

```ts
import { Module, Injectable, Controller, Get, NestMiddleware, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

// 服务
@Injectable()
class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}

// 控制器
@Controller()
class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

// 中间件
class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    console.log('Request...');
    next();
  }
}

// 模块
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(AppController);
  }
}

// 创建和启动应用
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
```

**详解**

**1.服务 (AppService)**：

- `@Injectable` 装饰器标记 AppService 类为可注入服务。
- `getHello` 方法返回字符串 "Hello World!"。

**2.控制器 (AppController)**：

- `@Controller` 装饰器标记 AppController 类为控制器。
- `@Get` 装饰器标记 `getHello` 方法为处理 GET 请求的路由。

**3.中间件 (LoggerMiddleware)**：

- 实现 `NestMiddleware` 接口的 `use` 方法，在每个请求前输出日志信息。

**4.模块 (AppModule)**：

- `@Module` 装饰器配置模块的控制器和提供者。
- 实现 `NestModule` 接口的 `configure` 方法，配置 LoggerMiddleware 中间件。

**5.应用启动 (bootstrap)**：

- 使用 `NestFactory.create` 方法创建应用实例。
- 通过 `app.listen` 启动应用监听 3000 端口，并输出应用运行信息。

通过 `@nestjs/common` 提供的这些功能，开发者可以快速构建、配置和管理 NestJS 应用程序，提高开发效率，简化代码结构。

### 4.rxjs

RxJS（Reactive Extensions for JavaScript）是一个用于构建异步和事件驱动程序的库，基于可观察序列的概念。RxJS 提供了强大的功能来处理异步数据流，使得编写复杂的异步操作变得更加简单和高效。

**核心概念**

**1.Observable (可观察对象)**：

- 可观察对象是 RxJS 的核心，用于表示一个可以被观察的数据流。可以从各种来源创建 Observable，比如事件、HTTP 请求、定时器等。
- 示例：

```ts
import { Observable } from 'rxjs';

const observable = new Observable(subscriber => {
  subscriber.next('Hello');
  subscriber.next('World');
  subscriber.complete();
});

observable.subscribe(value => console.log(value));
```

**2.Observer (观察者)**：

- 观察者是一个回调对象，用于响应 Observable 发出的数据、错误或完成通知。观察者包含 `next`、`error` 和 `complete` 三个方法。
- 示例：

```ts
const observer = {
  next: value => console.log(value),
  error: err => console.error(err),
  complete: () => console.log('Completed')
};

observable.subscribe(observer);
```

**3.Subscription (订阅)**：

- 订阅表示对 Observable 的订阅过程，订阅后，Observable 会开始发出数据。可以通过调用 `unsubscribe` 方法取消订阅。
- 示例：

```ts
const subscription = observable.subscribe(observer);
subscription.unsubscribe();
```

**4.Operators (操作符)**：

- 操作符是用于转换、过滤和组合 Observable 的函数。RxJS 提供了丰富的操作符来处理数据流，如 `map`、`filter`、`merge`、`concat`、`switchMap` 等。
- 示例：

```ts
import { from } from 'rxjs';
import { map, filter } from 'rxjs/operators';

const numbers = from([1, 2, 3, 4, 5]);
const squareOdd = numbers.pipe(
  filter(n => n % 2 !== 0),
  map(n => n * n)
);

squareOdd.subscribe(value => console.log(value));
```

**5.Subject (主题)**：

- Subject 是一种特殊的 Observable，它既是 Observable 也是 Observer。可以用来多播值给多个订阅者。
- 示例：

```ts
import { Subject } from 'rxjs';

const subject = new Subject();

subject.subscribe(value => console.log(`Observer A: ${value}`));
subject.subscribe(value => console.log(`Observer B: ${value}`));

subject.next('Hello');
subject.next('World');
```

**常用操作符**

**1.创建操作符**：

- `of`: 创建一个发出指定值的 Observable。
- `from`: 从数组、Promise、迭代器或 Observable-like 对象创建 Observable。
- `interval`: 创建一个发出递增数字的 Observable，使用定时器。

**2.转换操作符**：

- `map`: 将 Observable 发出的每个值应用一个函数，返回新的值。
- `switchMap`: 映射每个值为一个新的 Observable，并取消前一个内部 Observable 的订阅。

**3.过滤操作符**：

- `filter`: 过滤出符合条件的值。
- `take`: 只取前 n 个值。

**4.组合操作符**：

- `merge`: 将多个 Observable 合并成一个。
- `concat`: 按顺序串联多个 Observable。

**5.错误处理操作符**：

- `catchError`: 捕获错误并返回一个新的 Observable 或抛出错误。
- `retry`: 在发生错误时重新订阅源 Observable。

**代码示例**

以下是一个综合使用 RxJS 核心概念和操作符的示例：

```ts
import { of, from, interval, Subject } from 'rxjs';
import { map, filter, switchMap, take, catchError } from 'rxjs/operators';

// 创建一个简单的 Observable
const observable = of(1, 2, 3, 4, 5);

observable
  .pipe(
    filter(x => x % 2 === 0),
    map(x => x * x)
  )
  .subscribe(value => console.log(`Filtered and squared: ${value}`));

// 从数组创建 Observable
const arrayObservable = from([10, 20, 30, 40, 50]);

arrayObservable
  .pipe(
    map(x => x / 10),
    take(3)
  )
  .subscribe(value => console.log(`Mapped and taken: ${value}`));

// 使用 interval 创建定时 Observable
const intervalObservable = interval(1000);

intervalObservable
  .pipe(
    take(5),
    switchMap(val => of(`Interval value: ${val}`))
  )
  .subscribe(value => console.log(value));

// 使用 Subject 进行多播
const subject = new Subject();

subject.subscribe(value => console.log(`Observer A: ${value}`));
subject.subscribe(value => console.log(`Observer B: ${value}`));

subject.next('Hello');
subject.next('World');
```

通过 RxJS，开发者可以更容易地处理复杂的异步操作和事件驱动的编程模式，提高代码的可读性和可维护性。

### 5.reflect-metadata

`reflect-metadata` 是一个用于在 JavaScript 和 TypeScript 中实现元编程的库。它通过提供元数据反射 API，允许开发者在运行时检查和操作对象的元数据。元数据可以看作是关于程序结构的额外信息，比如类、属性或方法的注解。

**核心概念**

**1.元数据 (Metadata)**：

- 元数据是附加在程序元素（如类、方法、属性等）上的信息，可以在运行时通过反射 API 获取和操作。

**2.反射 (Reflection)**：

- 反射是一种能力，使得程序可以在运行时检查自身的结构，并对其进行修改或操作。

**`reflect-metadata` 的基本功能**

**1.定义元数据**：

- 使用 `Reflect.defineMetadata` 方法定义元数据。

```ts
import 'reflect-metadata';

Reflect.defineMetadata('role', 'admin', target);
```

**2.获取元数据**：

- 使用 `Reflect.getMetadata` 方法获取元数据。

```ts
const role = Reflect.getMetadata('role', target);
console.log(role); // 'admin'
```

**3.检查元数据**：

- 使用 `Reflect.hasMetadata` 方法检查是否存在指定的元数据。

```ts
const hasRoleMetadata = Reflect.hasMetadata('role', target);
console.log(hasRoleMetadata); // true
```

**4.删除元数据**：

- 使用 `Reflect.deleteMetadata` 方法删除元数据。

```ts
Reflect.deleteMetadata('role', target);
const hasRoleMetadata = Reflect.hasMetadata('role', target);
console.log(hasRoleMetadata); // false
```

**应用示例**

以下是一些使用 `reflect-metadata` 的常见场景和示例代码：

**1.类装饰器**：

- 使用装饰器为类添加元数据。

```ts
import 'reflect-metadata';

@Reflect.metadata('role', 'admin')
class User {
  constructor(public name: string) {}
}

const role = Reflect.getMetadata('role', User);
console.log(role); // 'admin'
```

**2.方法装饰器**：

- 使用装饰器为方法添加元数据。

```ts
import 'reflect-metadata';

class UserService {
  @Reflect.metadata('role', 'admin')
  getUser() {}
}

const role = Reflect.getMetadata('role', UserService.prototype, 'getUser');
console.log(role); // 'admin'
```

**3.参数装饰器**：

- 使用装饰器为方法参数添加元数据。

```ts
import 'reflect-metadata';

class UserService {
  getUser(@Reflect.metadata('required', true) id: number) {}
}

const requiredMetadata = Reflect.getMetadata('required', UserService.prototype, 'getUser');
console.log(requiredMetadata); // true
```

**4.属性装饰器**：

- 使用装饰器为类属性添加元数据。

```ts
import 'reflect-metadata';

class User {
  @Reflect.metadata('format', 'email')
  email: string;
}

const formatMetadata = Reflect.getMetadata('format', User.prototype, 'email');
console.log(formatMetadata); // 'email'
```

**完整示例**

以下是一个综合使用 `reflect-metadata` 的示例，展示如何为类、方法和属性添加元数据并在运行时进行操作：

```ts
import 'reflect-metadata';

// 类装饰器
function Role(role: string) {
  return Reflect.metadata('role', role);
}

// 方法装饰器
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with arguments:`, args);
    return originalMethod.apply(this, args);
  };
}

// 属性装饰器
function Format(format: string) {
  return Reflect.metadata('format', format);
}

@Role('admin')
class User {
  @Format('email')
  email: string;

  constructor(email: string) {
    this.email = email;
  }

  @Log
  getUserInfo() {
    return `User email: ${this.email}`;
  }
}

const user = new User('test@example.com');

// 获取类的元数据
const role = Reflect.getMetadata('role', User);
console.log(`Role: ${role}`); // 'Role: admin'

// 获取属性的元数据
const emailFormat = Reflect.getMetadata('format', User.prototype, 'email');
console.log(`Email format: ${emailFormat}`); // 'Email format: email'

// 调用方法，触发日志输出
console.log(user.getUserInfo());
```

**结论**

`reflect-metadata` 提供了一种在 JavaScript 和 TypeScript 中实现元编程的方法，使得开发者可以通过装饰器和反射 API 添加、获取和操作元数据。这在构建复杂的框架和库时非常有用，如依赖注入、路由、验证等场景。通过掌握 `reflect-metadata` 的使用，可以更灵活地控制和扩展应用程序的行为。

### 6.@nestjs/platform-express

`@nestjs/platform-express` 是 NestJS 框架中的一个平台适配器，用于将 NestJS 应用与 Express.js 集成。NestJS 是一个基于 TypeScript 的进程框架，支持多种底层 HTTP 服务器库，如 Express 和 Fastify。`@nestjs/platform-express` 提供了将 NestJS 应用运行在 Express.js 之上的能力，使得开发者能够利用 Express.js 的中间件、路由等功能，同时享受 NestJS 提供的模块化、依赖注入、装饰器等高级特性。

**主要功能和组成部分**

**1.ExpressAdapter**：

- 提供适配器接口，用于将 Express.js 与 NestJS 集成。
- 可以自定义 Express 实例，并将其传递给 NestJS 应用。

**2.File Upload**：

- 提供文件上传支持，通过 `@nestjs/platform-express` 中的 `FileInterceptor`、`FilesInterceptor` 等装饰器和 Multer 进行文件上传处理。

**3.中间件 (Middleware)**：

- 可以使用 Express.js 中的中间件功能，通过 `NestMiddleware` 接口和 `MiddlewareConsumer` 来配置中间件。

**4.静态文件服务**：

- 提供静态文件服务的功能，允许开发者在 NestJS 应用中直接提供静态资源。

**代码示例**

以下是一个使用 `@nestjs/platform-express` 构建和启动 NestJS 应用的示例：

**1.基本应用示例**：

```ts
import { Module, Controller, Get, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

// 控制器
@Controller()
class AppController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}

// 模块
@Module({
  controllers: [AppController],
})
class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 配置中间件
  }
}

// 创建和启动应用
async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
```

**2.文件上传示例**：

```ts
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('upload')
class UploadController {
  @Post('single')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      }
    })
  }))
  uploadFile(@UploadedFile() file) {
    console.log(file);
    return { message: 'File uploaded successfully!', file };
  }
}

@Module({
  controllers: [UploadController],
})
class UploadModule {}

async function bootstrap() {
  const app = await NestFactory.create(UploadModule);
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
```

**3.静态文件服务示例**：

```ts
import { Module, Controller, Get, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

@Controller()
class AppController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}

@Module({
  controllers: [AppController],
})
class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 配置静态文件服务
    const server = consumer.apply().getInstance();
    server.use('/static', express.static(join(__dirname, '..', 'public')));
  }
}

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
```

**结论**

`@nestjs/platform-express` 提供了将 NestJS 与 Express.js 集成的能力，使得开发者可以利用 Express.js 的强大功能，同时享受 NestJS 带来的模块化、依赖注入和装饰器等高级特性。通过使用 `@nestjs/platform-express`，开发者可以轻松构建高效、可扩展的 Web 应用程序。

### 7.NestFactory

`NestFactory` 是 NestJS 框架中用于创建 Nest 应用实例的核心类。它提供了一组静态方法，用于引导和启动应用程序。通过 `NestFactory`，你可以创建 HTTP 服务、微服务以及独立的应用实例。

**主要方法**

**1.create**：

- 创建一个 Nest 应用实例，默认使用 Express 作为底层 HTTP 服务器。
- 语法：

```ts
static async create<T>(module: Type<T>, options?: NestApplicationOptions): Promise<INestApplication>;
```

**2.createMicroservice**：

- 创建一个微服务实例。
- 语法：

```ts
static createMicroservice<T>(module: Type<T>, options: MicroserviceOptions): INestMicroservice;
```

**3.createApplicationContext**：

- 创建一个独立的应用上下文，通常用于测试或执行不需要完整 HTTP 服务的任务。
- 语法：

```ts
static async createApplicationContext<T>(module: Type<T>, options?: NestApplicationContextOptions): Promise<INestApplicationContext>;
```

**创建一个 HTTP 服务**

通过 `NestFactory.create` 方法可以创建一个 HTTP 服务。下面是一个简单的示例：

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
```

在这个示例中：

- `NestFactory.create(AppModule)` 创建了一个 Nest 应用实例。
- `app.listen(3000)` 启动应用，监听 3000 端口。

**创建一个微服务**

通过 `NestFactory.createMicroservice` 方法可以创建一个微服务。下面是一个简单的示例：

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
  });
  app.listen(() => console.log('Microservice is listening'));
}
bootstrap();
```

在这个示例中：

- `NestFactory.createMicroservice` 创建了一个 TCP 传输的微服务实例。
- `app.listen` 启动微服务。

**创建一个独立的应用上下文**

通过 `NestFactory.createApplicationContext` 方法可以创建一个独立的应用上下文，适用于运行任务或进行测试。下面是一个简单的示例：

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const appService = appContext.get(AppService);
  appService.runTask();
  await appContext.close();
}
bootstrap();
```

在这个示例中：

- `NestFactory.createApplicationContext(AppModule)` 创建了一个应用上下文实例。
- 通过 `appContext.get(AppService)` 获取服务实例并运行任务。

**常见选项**

- **logger**：

  - 自定义日志记录器。

  - 语法：

    ```typescript
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });
    ```

- **bodyParser**：

  - 配置 bodyParser 中间件选项。

  - 语法：

    ```typescript
    const app = await NestFactory.create(AppModule, {
      bodyParser: false, // 禁用 bodyParser
    });
    ```

**总结**

`NestFactory` 是创建和启动 NestJS 应用的核心工具。它提供了多种方法，适用于不同类型的应用程序，包括 HTTP 服务、微服务和独立的应用上下文。通过理解和使用 `NestFactory`，开发者可以高效地引导和管理 NestJS 应用程序。

### 8.@Module

`@Module` 是 NestJS 框架中的一个装饰器，用于定义模块。模块是组织代码的基本单元，它们将相关的组件（如控制器、服务、提供者等）组合在一起。NestJS 的模块系统受到了 Angular 的启发，旨在促进代码的模块化和可维护性。

**核心概念**

1. **模块装饰器 (@Module)**：
   - 用于标记一个类为 NestJS 模块，并提供模块的元数据。
2. **模块元数据**：
   - `imports`: 导入的模块列表，这些模块的提供者可以在当前模块中使用。
   - `controllers`: 当前模块定义的控制器。
   - `providers`: 当前模块定义的提供者（服务等），这些提供者可以注入到模块的其他组件中。
   - `exports`: 当前模块提供并可以在其他模块中使用的提供者。

**使用示例**

以下是一个基本的模块示例：

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

在这个示例中：

- `@Module` 装饰器定义了 `AppModule` 类为一个模块。
- `imports` 数组为空，表示没有导入其他模块。
- `controllers` 数组包含了 `AppController`，这是一个控制器。
- `providers` 数组包含了 `AppService`，这是一个提供者（服务）。

**模块的详细示例**

下面是一个更复杂的示例，展示了如何使用多个模块、控制器和服务：

**1.创建用户模块**：

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

**2.创建用户控制器**：

```typescript
import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
```

**3.创建用户服务**：

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly users = [{ id: 1, name: 'John Doe' }];

  findAll() {
    return this.users;
  }
}
```

**4.在应用模块中导入用户模块**：

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**模块元数据详解**

- **imports**：

  - 导入其他模块，使得这些模块的提供者可以在当前模块中使用。模块之间的依赖通过 `imports` 数组进行管理。

  - 示例：

    ```typescript
    @Module({
      imports: [UsersModule],
    })
    export class AppModule {}
    ```

- **controllers**：

  - 当前模块定义的控制器。这些控制器负责处理传入的请求并返回响应。

  - 示例：

    ```typescript
    @Module({
      controllers: [AppController],
    })
    export class AppModule {}
    ```

- **providers**：

  - 当前模块定义的提供者。这些提供者可以是服务、工厂、或其他可以注入的依赖。

  - 示例：

    ```typescript
    @Module({
      providers: [AppService],
    })
    export class AppModule {}
    ```

- **exports**：

  - 导出当前模块的提供者，使其可以在其他模块中使用。

  - 示例：

    ```typescript
    @Module({
      providers: [AppService],
      exports: [AppService],
    })
    export class AppModule {}
    ```

**总结**

`@Module` 是 NestJS 框架中用于定义模块的装饰器。通过模块，开发者可以将相关的控制器、服务和其他组件组织在一起，提高代码的模块化和可维护性。模块的 `imports`、`controllers`、`providers` 和 `exports` 元数据属性使得模块之间可以相互依赖和协作，形成一个高内聚、低耦合的应用架构。

### 9.@Controller

`@Controller` 是 NestJS 框架中的一个装饰器，用于定义控制器。控制器是处理传入 HTTP 请求的核心组件。每个控制器负责处理特定的请求路径和相应的 HTTP 方法。控制器使用路由装饰器（如 `@Get`、`@Post` 等）来定义路由和请求处理方法。

**基本使用**

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll(): string {
    return 'This action returns all users';
  }
}
```

在这个示例中：

- `@Controller('users')` 装饰器将 `UsersController` 类标记为一个控制器，并将基本路径设为 `users`。
- `@Get()` 装饰器将 `findAll` 方法映射到 HTTP GET 请求。

**详细示例**

**1.定义控制器**：

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CreateUserDto } from './create-user.dto';

@Controller('users')
export class UsersController {
  @Get()
  findAll(): string {
    return 'This action returns all users';
  }

  @Get(':id')
  findOne(@Param('id') id: string): string {
    return `This action returns user #${id}`;
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): string {
    return 'This action adds a new user';
  }
}
```

在这个示例中：

- `@Get()` 装饰器将 `findAll` 方法映射到没有参数的 HTTP GET 请求。
- `@Get(':id')` 装饰器将 `findOne` 方法映射到具有 `id` 参数的 HTTP GET 请求。
- `@Post()` 装饰器将 `create` 方法映射到 HTTP POST 请求，并从请求体中提取数据。
- **使用 DTO（数据传输对象）**：

```typescript
export class CreateUserDto {
  readonly name: string;
  readonly age: number;
}
```

在控制器中，使用 `@Body()` 装饰器提取请求体数据并将其映射到 DTO。

**常用装饰器**

- **@Get**：处理 HTTP GET 请求。
- **@Post**：处理 HTTP POST 请求。
- **@Put**：处理 HTTP PUT 请求。
- **@Delete**：处理 HTTP DELETE 请求。
- **@Patch**：处理 HTTP PATCH 请求。
- **@Param**：提取路由参数。
- **@Body**：提取请求体数据。
- **@Query**：提取查询参数。
- **@Headers**：提取请求头。

**路由前缀**

可以为控制器定义路由前缀，这样所有的路由都将基于该前缀。

```typescript
@Controller('users')
export class UsersController {
  @Get()
  findAll(): string {
    return 'This action returns all users';
  }
}
```

在这个例子中，`UsersController` 的所有路由都将基于 `users` 前缀，例如 `GET /users` 将调用 `findAll` 方法。

**分组路由**

通过路由前缀，可以将相关的路由分组到一个控制器中，便于管理和维护。

```typescript
@Controller('users')
export class UsersController {
  @Get()
  findAll(): string {
    return 'This action returns all users';
  }

  @Get(':id')
  findOne(@Param('id') id: string): string {
    return `This action returns user #${id}`;
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): string {
    return 'This action adds a new user';
  }
}
```

通过上述代码，`GET /users` 将调用 `findAll` 方法，`GET /users/:id` 将调用 `findOne` 方法，`POST /users` 将调用 `create` 方法。

**结论**

`@Controller` 是 NestJS 框架中用于定义控制器的装饰器。控制器负责处理传入的 HTTP 请求，并返回响应。通过使用各种装饰器（如 `@Get`、`@Post`、`@Param` 等），可以方便地定义和管理路由及其对应的处理方法。控制器将请求映射到处理程序，使得应用程序的结构更加清晰和模块化。

### 10. @Get

`@Get` 是 NestJS 框架中的一个装饰器，用于将控制器方法映射到 HTTP GET 请求。这个装饰器是由 `@nestjs/common` 模块提供的。通过使用 `@Get` 装饰器，可以指定该方法处理特定路径上的 GET 请求。

**基本用法**

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll(): string {
    return 'This action returns all users';
  }
}
```

在这个示例中：

- `@Controller('users')` 将 `UsersController` 类定义为一个控制器，并将其基本路径设为 `users`。
- `@Get()` 装饰器将 `findAll` 方法映射到 `GET /users` 请求。

**处理带参数的 GET 请求**

可以通过在 `@Get` 装饰器中指定路径参数来处理带参数的 GET 请求。

```typescript
import { Controller, Get, Param } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get(':id')
  findOne(@Param('id') id: string): string {
    return `This action returns user #${id}`;
  }
}
```

在这个示例中：

- `@Get(':id')` 装饰器将 `findOne` 方法映射到 `GET /users/:id` 请求，其中 `:id` 是一个路由参数。
- `@Param('id')` 装饰器用于提取请求路径中的 `id` 参数。

**处理带查询参数的 GET 请求**

可以通过使用 `@Query` 装饰器来提取查询参数。

```typescript
import { Controller, Get, Query } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll(@Query('age') age: string): string {
    return `This action returns users of age ${age}`;
  }
}
```

在这个示例中：

- `@Query('age')` 装饰器用于提取请求 URL 中的查询参数 `age`。
- 请求 `GET /users?age=25` 将调用 `findAll` 方法，并传递 `age` 参数的值。

**组合使用路径和查询参数**

可以同时使用路径参数和查询参数来处理更复杂的请求。

```typescript
import { Controller, Get, Param, Query } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get(':id')
  findOne(@Param('id') id: string, @Query('includePosts') includePosts: boolean): string {
    return `This action returns user #${id} with includePosts=${includePosts}`;
  }
}
```

在这个示例中：

- `@Get(':id')` 装饰器将 `findOne` 方法映射到 `GET /users/:id` 请求。
- `@Param('id')` 和 `@Query('includePosts')` 分别用于提取路径参数和查询参数。

**完整示例**

以下是一个完整的示例，展示了如何在控制器中使用 `@Get` 装饰器处理不同的 GET 请求：

```typescript
import { Controller, Get, Param, Query } from '@nestjs/common';

@Controller('users')
export class UsersController {
  // 处理没有参数的 GET 请求
  @Get()
  findAll(): string {
    return 'This action returns all users';
  }

  // 处理带路径参数的 GET 请求
  @Get(':id')
  findOne(@Param('id') id: string): string {
    return `This action returns user #${id}`;
  }

  // 处理带查询参数的 GET 请求
  @Get()
  findByAge(@Query('age') age: string): string {
    return `This action returns users of age ${age}`;
  }

  // 处理带路径和查询参数的 GET 请求
  @Get(':id/details')
  findOneWithDetails(@Param('id') id: string, @Query('includePosts') includePosts: boolean): string {
    return `This action returns user #${id} with includePosts=${includePosts}`;
  }
}
```

在这个示例中：

- `findAll` 方法处理没有参数的 GET 请求。
- `findOne` 方法处理带路径参数的 GET 请求。
- `findByAge` 方法处理带查询参数的 GET 请求。
- `findOneWithDetails` 方法处理带路径和查询参数的 GET 请求。

**总结**

`@Get` 是一个用于处理 HTTP GET 请求的装饰器，通过它可以轻松地将控制器方法映射到特定的请求路径。通过结合使用 `@Param` 和 `@Query` 等装饰器，可以灵活地处理各种类型的 GET 请求。使用 `@Get` 装饰器，可以使代码更加模块化和易于维护。

### 11.esModuleInterop

`esModuleInterop` 和 `allowSyntheticDefaultImports`两个选项都是 TypeScript 编译器选项，用于处理 ES6 模块和 CommonJS 模块之间的兼容性问题。它们的主要目的是让 TypeScript 更容易与使用不同模块系统的 JavaScript 代码库进行互操作，但它们的作用和影响有所不同。

**相同点**

**1.模块兼容性**：

- 这两个选项都旨在解决 TypeScript 中 ES6 模块与 CommonJS 模块的兼容性问题，使得开发者可以更方便地导入和使用现有的 JavaScript 库。

**2.启用方式**：

- 两个选项都可以单独启用，也可以一起启用。不过，如果启用了 `esModuleInterop`，通常不需要再单独启用 `allowSyntheticDefaultImports`，因为 `esModuleInterop` 已经包含了 `allowSyntheticDefaultImports` 的功能。

**不同点**

**1.作用范围**：

- `allowSyntheticDefaultImports`：
  - 允许从没有默认导出的模块中导入默认导出。这意味着即使模块没有实际的 `default` 导出，TypeScript 也会假设它有一个，并允许 `import` 语句使用默认导入。
  - 主要作用是让 TypeScript 可以更方便地导入 CommonJS 模块，尤其是那些没有明确默认导出的模块。
- `esModuleInterop`：
  - 启用所有与模块互操作相关的功能，包括 `allowSyntheticDefaultImports`。它的作用不仅仅限于允许默认导入，还包括重新调整 TypeScript 对模块的导入和导出行为，使其更符合 ES6 规范。
  - 还会为所有 `export =` 的模块生成默认导出，确保这些模块在 TypeScript 中可以使用默认导入语法。

**2.编译器行为**：

- `allowSyntheticDefaultImports`：
  - 只是一个语法上的调整，允许使用默认导入语法，但不改变编译后的输出。
- `esModuleInterop`：
  - 改变编译输出，使其与 ES6 模块的行为更加一致。启用这个选项后，TypeScript 编译器会在生成的 JavaScript 代码中添加额外的帮助代码，以模拟 ES6 的模块行为。

**示例**

假设我们有一个 CommonJS 模块 `commonjs-module.js`：

```javascript
// commonjs-module.js
module.exports = { foo: 'bar' };
```

**1.只启用 `allowSyntheticDefaultImports`**：

```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true
  }
}
```

在 TypeScript 中：

```typescript
import commonjsModule from './commonjs-module';
console.log(commonjsModule.foo); // 'bar'
```

编译后：

```javascript
const commonjs_module_1 = require('./commonjs-module');
console.log(commonjs_module_1.default.foo); // 这里会报错，因为 `commonjs-module.js` 没有 `default` 导出
```

**2.启用 `esModuleInterop`**（隐含包含 `allowSyntheticDefaultImports`）：

```json
{
  "compilerOptions": {
    "esModuleInterop": true
  }
}
```

在 TypeScript 中：

```typescript
import commonjsModule from './commonjs-module';
console.log(commonjsModule.foo); // 'bar'
```

编译后：

```javascript
const tslib_1 = require('tslib');
const commonjs_module_1 = tslib_1.__importDefault(require('./commonjs-module'));
console.log(commonjs_module_1.default.foo); // 正确，因为 `__importDefault` 函数创建了一个默认导出
```

**总结**

- **相同点**：
  - 都是用于处理 ES6 模块与 CommonJS 模块的兼容性问题。
  - 都能简化从没有默认导出的模块中导入默认导出的操作。
- **不同点**：
  - `allowSyntheticDefaultImports` 仅仅允许使用默认导入语法，但不改变编译输出。
  - `esModuleInterop` 不仅允许使用默认导入语法，还会调整编译输出，使其与 ES6 模块行为一致，并包含了 `allowSyntheticDefaultImports` 的功能。

在现代 TypeScript 项目中，通常推荐启用 `esModuleInterop`，以便更好地支持模块互操作，并使编译后的代码更符合 ES6 模块规范。







