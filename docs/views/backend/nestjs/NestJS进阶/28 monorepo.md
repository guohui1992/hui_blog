## 1.Monorepo 模式
+ [cli](https://nestjs.docs-hub.com/cli/overview)
+ [monorepo](https://nestjs.docs-hub.com/cli/monorepo)
+ [libraries](https://nestjs.docs-hub.com/cli/libraries)
在 NestJS 中，Monorepo 模式是一种项目结构策略，它允许多个模块或服务在同一个代码库中共同维护和开发。NestJS 提供了对 Monorepo 模式的内置支持，通过组织代码结构和工具链，使得开发多个相关模块或服务的项目更加高效。

+ **代码共享与复用**：在一个 Monorepo 中，不同模块可以轻松共享通用的库或功能，而无需重复代码。所有模块共享一个依赖管理器和代码仓库，这有助于减少版本管理和兼容性问题。

+ **统一依赖管理**：在 Monorepo 中，所有模块的依赖可以集中管理，避免每个模块单独维护自己的依赖文件。所有模块共享一个 package.json 文件，方便维护和升级依赖。

+ **一致的代码风格与工具链**：多个模块可以共用相同的代码风格和工具（如 ESLint、Prettier、Jest 等），确保代码质量一致，并且测试、构建和部署流程统一。

+ **简化跨模块协作**：在单一仓库中开发多个模块，开发人员可以轻松地跨模块协作和调试，避免了使用多个 Git 仓库时的复杂性。

+ **改进的 CI/CD 流程**：Monorepo 可以为多个模块统一设置持续集成和部署管道，减少单个项目的管理负担，提升整体效率。

## 2.创建项目
```shell
nest new mall-admin
nest g app mall-api
nest g library shared
```
```shell
├─apps
│  ├─mall-admin
│  │  ├─src
│  │  └─test
│  └─mall-api
│      ├─src
│      └─test
├─libs
│  └─shared
│      └─src
```
+ `apps/` 文件夹：存放多个应用，每个应用都是一个独立的 Nest 应用或微服务。它们可以是不同的微服务、API 网关或任何其他类型的应用。
+ `libs/` 文件夹：存放可重用的模块或库，如常见的服务、DTO（数据传输对象）、验证逻辑等。libs/ 中的库可以被 apps/ 中的多个应用引用，从而避免重复开发。
## 3.代码共享
### 3.1. shared.service.ts
libs/shared/src/shared.service.ts
```js
import { Injectable } from '@nestjs/common';

@Injectable()
+export class SharedService {
+ getSharedMessage(): string {
+   return '这是来自共享服务的消息！';
+ }
+}
```
### 3.2. mall-api.service.ts
apps/mall-api/src/mall-api.service.ts
```js
import { Injectable } from '@nestjs/common';
+import { SharedService } from '@app/shared';

@Injectable()
export class MallApiService {
+ constructor(private readonly sharedService: SharedService) {}
+
  getHello(): string {
+   return `商城API: ${this.sharedService.getSharedMessage()}`;
  }
}
```
### 3.3. mall-admin.service.ts
apps/mall-admin/src/mall-admin.service.ts
```js
import { Injectable } from '@nestjs/common';
+import { SharedService } from '@app/shared';

@Injectable()
export class MallAdminService {
+ constructor(private readonly sharedService: SharedService) { }
+
  getHello(): string {
+   return `商城管理后台: ${this.sharedService.getSharedMessage()}`;
  }
}
```
### 3.4. mall-api.module.ts
apps/mall-api/src/mall-api.module.ts
```js
import { Module } from '@nestjs/common';
import { MallApiController } from './mall-api.controller';
import { MallApiService } from './mall-api.service';
+import { SharedModule } from '@app/shared';

@Module({
+ imports: [SharedModule],
  controllers: [MallApiController],
  providers: [MallApiService],
})
export class MallApiModule {}
```
### 3.5. mall-admin.module.ts
apps/mall-admin/src/mall-admin.module.ts
```js
import { Module } from '@nestjs/common';
import { MallAdminController } from './mall-admin.controller';
import { MallAdminService } from './mall-admin.service';
+import { SharedModule } from '@app/shared';

@Module({
+ imports: [SharedModule],
  controllers: [MallAdminController],
  providers: [MallAdminService],
})
+export class AppModule { }
```
## 4.运行项目
```shell
npm run start:dev
npm run start:dev mall-api
```
## 4.编译项目
```shell
npm run build
npm run build mall-api
npm run build shared
```
## 5.tsconfig.json
tsconfig.json
```json
{
  // 编译器选项配置对象
  "compilerOptions": {
    // 指定模块系统为 CommonJS，通常用于 Node.js
    "module": "commonjs",
    // 生成声明文件 (.d.ts)
    "declaration": true,
    // 编译时移除代码中的注释
    "removeComments": true,
    // 为装饰器生成元数据 (用于反射)
    "emitDecoratorMetadata": true,
    // 启用实验性的装饰器特性
    "experimentalDecorators": true,
    // 允许使用默认导入语法，即使模块没有默认导出
    "allowSyntheticDefaultImports": true,
    // 指定 ECMAScript 版本为 ES2021
    "target": "ES2021",
    // 生成 source map 文件，帮助调试
    "sourceMap": true,
    // 指定编译输出目录
    "outDir": "./dist",
    // 设置基础路径，用于解析非相对模块
    "baseUrl": "./",
    // 启用增量编译，能加快后续的编译速度
    "incremental": true,
    // 跳过库文件的类型检查
    "skipLibCheck": true,
    // 不对 null 和 undefined 进行严格的检查
    "strictNullChecks": false,
    // 允许隐式的 any 类型
    "noImplicitAny": false,
    // 不对 call、apply 和 bind 进行严格检查
    "strictBindCallApply": false,
    // 强制文件名中的大小写一致性
    "forceConsistentCasingInFileNames": false,
    // 禁止 switch 语句中的 fallthrough 行为
    "noFallthroughCasesInSwitch": false,
    // 配置路径别名，用于模块引用
    "paths": {
      // 当引用 "@app/shared" 时，解析到 "libs/shared/src" 目录
      "@app/shared": [
        "libs/shared/src"
      ],
      // 当引用 "@app/shared/*" 时，解析到 "libs/shared/src/*"
      "@app/shared/*": [
        "libs/shared/src/*"
      ]
    }
  }
}
```
## 6..eslintrc.js
.eslintrc.js
```js
module.exports = {
  // 指定用于解析 TypeScript 代码的解析器
  parser: "@typescript-eslint/parser",
  // 解析器选项配置
  parserOptions: {
    // 指定 TypeScript 配置文件
    project: "tsconfig.json",
    // 指定 tsconfig.json 文件的根目录
    tsconfigRootDir: __dirname,
    // 代码使用 ECMAScript 模块
    sourceType: "module",
  },
  // 使用的 ESLint 插件
  plugins: ["@typescript-eslint/eslint-plugin"],
  // 扩展的规则集，推荐使用 TypeScript ESLint 规则和 Prettier 规则
  extends: [
    // 推荐的 TypeScript ESLint 规则
    "plugin:@typescript-eslint/recommended",
    // 推荐的 Prettier 配置以确保代码格式化
    "plugin:prettier/recommended",
  ],
  // 指定当前配置为根配置，不会向上查找其他 ESLint 配置文件
  root: true,
  // 环境配置，指定代码运行在 Node.js 和 Jest (用于测试) 环境中
  env: {
    node: true,
    jest: true,
  },
  // 忽略某些文件或路径的规则检查
  ignorePatterns: [".eslintrc.js"],
  // 自定义 ESLint 规则配置
  rules: {
    // 关闭接口名前缀规则（允许接口名称不以 "I" 开头）
    "@typescript-eslint/interface-name-prefix": "off",
    // 关闭要求显式声明函数返回类型的规则
    "@typescript-eslint/explicit-function-return-type": "off",
    // 关闭显式模块边界类型声明的规则
    "@typescript-eslint/explicit-module-boundary-types": "off",
    // 关闭禁止使用 any 类型的规则
    "@typescript-eslint/no-explicit-any": "off",
    // 设置行尾符规则，允许自动选择适合的平台行尾符
    "linebreak-style": ["error", "auto"],
  },
};
```
## 7.nest-cli.json
nest-cli.json
```json
{
  // JSON Schema，用于验证配置文件的结构
  "$schema": "https://json.schemastore.org/nest-cli",
  // 指定使用的 NestJS schematics 集合
  "collection": "@nestjs/schematics",
  // 指定应用程序的源代码根目录
  "sourceRoot": "apps/mall-admin/src",
  // 编译器选项配置
  "compilerOptions": {
    // 编译时删除输出目录中的旧文件
    "deleteOutDir": true,
    // 启用 Webpack 打包支持
    "webpack": true,
    // 指定 TypeScript 配置文件路径
    "tsConfigPath": "apps/mall-admin/tsconfig.app.json"
  },
  // 启用 monorepo 模式，表示项目是一个包含多个应用或库的单一代码库
  "monorepo": true,
  // 指定项目的根目录
  "root": "apps/mall-admin",
  // 定义多个项目的配置
  "projects": {
    // 定义 mall-admin 应用的配置
    "mall-admin": {
      // 项目类型为应用程序
      "type": "application",
      // 应用程序的根目录
      "root": "apps/mall-admin",
      // 应用程序的入口文件
      "entryFile": "main",
      // 应用程序的源代码根目录
      "sourceRoot": "apps/mall-admin/src",
      // 编译器选项配置
      "compilerOptions": {
        // 指定 TypeScript 配置文件路径
        "tsConfigPath": "apps/mall-admin/tsconfig.app.json"
      }
    },
    // 定义 mall-api 应用的配置
    "mall-api": {
      // 项目类型为应用程序
      "type": "application",
      // 应用程序的根目录
      "root": "apps/mall-api",
      // 应用程序的入口文件
      "entryFile": "main",
      // 应用程序的源代码根目录
      "sourceRoot": "apps/mall-api/src",
      // 编译器选项配置
      "compilerOptions": {
        // 指定 TypeScript 配置文件路径
        "tsConfigPath": "apps/mall-api/tsconfig.app.json"
      }
    },
    // 定义 shared 库的配置
    "shared": {
      // 项目类型为库
      "type": "library",
      // 库的根目录
      "root": "libs/shared",
      // 库的入口文件
      "entryFile": "index",
      // 库的源代码根目录
      "sourceRoot": "libs/shared/src",
      // 编译器选项配置
      "compilerOptions": {
        // 指定 TypeScript 配置文件路径
        "tsConfigPath": "libs/shared/tsconfig.lib.json"
      }
    }
  }
}
```