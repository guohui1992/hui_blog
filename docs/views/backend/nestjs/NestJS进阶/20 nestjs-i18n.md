## 1. nestjs-i18n
## 2. 安装
```shell
npm install --save nestjs-i18n
```
## 3 设置翻译文件
默认情况下，nestjs-i18n 使用 I18nJsonLoader 来读取 json 格式的翻译文件。请在项目的 src 目录中创建一个名为 i18n 的文件夹。

目录结构示例：
```
src
└── i18n
    ├── en
    │   └── test.json
    └── zh
        └── test.json
```
### 3.1 en/test.json
```json
{
    "HELLO": "Hello"
}
```
### 3.2 zh/test.json
```json
{
    "HELLO": "你好"
}
```
## 4. 注意事项
在构建过程中，i18n 文件夹不会自动复制到 dist 目录。要解决此问题，请修改 nest-cli.json 文件中的 compilerOptions。
```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "assets": [
      { "include": "i18n/**/*", "watchAssets": true }
    ]
  }
}
```
## 5. 模块配置
在 AppModule 中引入并配置 I18nModule：
```js
import { Module } from '@nestjs/common';
import * as path from 'path';
import { I18nModule } from 'nestjs-i18n';
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
    }),
  ],
  controllers: [],
})
export class AppModule {}
```
如果需要异步配置 nestjs-i18n，可以使用 I18nModule.forRootAsync：
```js
import { Module } from '@nestjs/common';
import * as path from 'path';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';

@Module({
  imports: [
    I18nModule.forRootAsync({
      useFactory: () => ({
        fallbackLanguage: 'en',
        loaderOptions: {
          path: path.join(__dirname, '/i18n/'),
          watch: true,
        },
      })
    }),
  ],
  controllers: [],
})
export class AppModule { }
```
I18nModule 是一个全局模块，只需在根模块中注册一次，之后整个应用都可以访问它。

在 loaderOptions 中设置 watch 为 true 可以启用实时重新加载。

nestjs-i18n 现在支持类型安全。点击[这里](https://nestjs-i18n.com/guides/type-safety)查看详情。

## 6. 添加解析器
解析器用于获取请求的当前语言。对于基本的 Web 应用程序，通常通过 Accept-Language 请求头实现。但在许多情况下，您可能希望通过用户设置或自定义请求头来覆盖语言。

nestjs-i18n 提供了一组内置的解析器。

要添加解析器，可以将它们添加到 I18nModule 的 resolvers 数组中。nestjs-i18n 将按顺序解析语言。例如，它首先尝试 QueryResolver，如果无法解析语言，则跳到下一个。
```js
import { Module } from '@nestjs/common';
import * as path from 'path';
import {
  AcceptLanguageResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
  ],
  controllers: [],
})
export class AppModule { }
```
或使用 forRootAsync：
```js
import { Module } from '@nestjs/common';
import * as path from 'path';
import {
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
  CookieResolver,
  I18nModule,
} from 'nestjs-i18n';
@Module({
  imports: [
    I18nModule.forRootAsync({
      useFactory: () => ({
        fallbackLanguage: "en",
        loaderOptions: {
          path: path.join(__dirname, "/i18n/"),
          watch: true,
        },
      }),
      resolvers: [
        new QueryResolver(["lang", "l"]),
        new HeaderResolver(["x-custom-lang"]),
        new CookieResolver(),
        AcceptLanguageResolver,
      ]
    }),
  ],
  controllers: [],
})
export class AppModule { }
```
## 7. 翻译内容
现在我们已经设置好了一切，可以开始翻译内容了！最简单的方法是在控制器中进行。
```js
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { I18n, I18nContext } from 'nestjs-i18n';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }
  @Get()
  async getHello(@I18n() i18n: I18nContext) {
    return await i18n.t('test.HELLO');
    //return await i18n.t('test.HELLO', { lang: I18nContext.current().lang });
    //return await i18n.t('test.HELLO', { lang: 'en' });
    //return this.appService.getHello();
  }
}
```
您还可以在服务中进行翻译：
```js
import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class AppService {
  constructor(private readonly i18n: I18nService) {}
  getHello(): string {
    return this.i18n.t('test.HELLO');
  }

  getHelloInSpecificLanguage(): string {
    return this.i18n.t('test.HELLO',{ lang: "en" });
  }
}
```