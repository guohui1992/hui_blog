## 1.Providers
+ 提供者是 Nest 中的一个基本概念。许多基本的 Nest 类都可以作为提供者——服务、仓库、工厂、助手等等。提供者的主要理念是它可以作为依赖注入；这意味着对象可以相互创建各种关系，并且将这些对象“连接”起来的功能可以很大程度上交给 Nest 运行时系统处理。

### 1.1 src\app.module.ts
src\app.module.ts
```js
import { Module } from "@nestjs/common";
import { AppController } from './app.controller';
+import {LoggerClassService,LoggerService,UseValueService,UseFactory} from './logger.service';
@Module({
    controllers: [AppController],
    providers:[
+       {
+           provide:'SUFFIX',
+           useValue:'suffix'
+       },
+        LoggerClassService,
+        {
+           provide:LoggerService,
+           useClass:LoggerService
+       },
+       {
+           provide:'StringToken',
+           useValue:new UseValueService('prefix')
+       },
+       {
+           provide:'FactoryToken',
+           inject:['prefix1','SUFFIX'],
+           useFactory:(prefix1,suffix)=>new UseFactory(prefix1,suffix)
+       }
    ]
})
export class AppModule {

}
```
### 1.2 app.controller.ts
src\app.controller.ts
```js
import { Controller, Get, Inject } from '@nestjs/common'
+import {
+    LoggerClassService,
+    LoggerService,
+    UseFactory,
+    UseValueService
+} from './logger.service'

@Controller()
export class AppController {
+   constructor(
+       private loggerClassService: LoggerClassService,
+       private loggerService: LoggerService,
+       @Inject('StringToken') private useValueService: UseValueService,
+       @Inject('FactoryToken') private useFactory: UseFactory,
+   ) {}
    @Get()
+   index() {
+       this.loggerClassService.log('index');
+       this.loggerService.log('index');
+       this.useValueService.log('index');
+       this.useFactory.log('index');
+       return 'index';
+   }
}
```
### 1.3 logger.service.ts
src\logger.service.ts
```js
import {Injectable,Inject} from '@nestjs/common';
@Injectable()
export class LoggerClassService{
    log(message){
        console.log('LoggerClassService',message)
    }
}
@Injectable()
export class LoggerService{
    constructor(@Inject('SUFFIX') private suffix:string){
        console.log('LoggerService',this.suffix)
    }
    log(message){
        console.log('LoggerService',message)
    }
}

@Injectable()
export class UseValueService{
    constructor(prefix:string){
        console.log('UseValueService',prefix)
    }
    log(message){
        console.log('UseValueService',message)
    }
}

@Injectable()
export class UseFactory{
    constructor(private prefix1:string,private suffix:string){
        console.log('UseFactory',prefix1,suffix)
    }
    log(message){
        console.log('UseFactory',this.suffix)
    }
}
```
### 1.4 common\index.ts
src\@nestjs\common\index.ts
```js
export * from './module.decorator'
export * from './controller.decorator';
export * from './http-methods.decorator';
export * from './param.decorator';
+export * from './injectable.decorator';
+export * from './inject.decorator';
+export * from './constants';
```
### 1.5 module.decorator.ts
src\@nestjs\common\module.decorator.ts
```js
import 'reflect-metadata';
interface ModuleMetadata{
  controllers?:Function[];
+ providers?:any[]
}
export function Module(metadata:ModuleMetadata):ClassDecorator{
    return (target:Function)=>{
      Reflect.defineMetadata('controllers',metadata.controllers,target);
+     Reflect.defineMetadata('providers',metadata.providers,target);
    }
}
```
### 1.6 injectable.decorator.ts
src\@nestjs\common\injectable.decorator.ts
```js
import 'reflect-metadata';
export function Injectable():ClassDecorator{
  return function(target:Function){
    Reflect.defineMetadata('injectable',true,target)
  }
}
```
### 1.7 inject.decorator.ts
src\@nestjs\common\inject.decorator.ts
```js
import 'reflect-metadata';
import {INJECTED_TOKENS} from '@nestjs/common'
export function Inject(token:string):ParameterDecorator{
   return (target:Object,propertyKey:string,parameterIndex:number)=>{
    const existingInjectedTokens = Reflect.getMetadata(INJECTED_TOKENS,target)??[];
    existingInjectedTokens[parameterIndex]=token;
    Reflect.defineMetadata(INJECTED_TOKENS,existingInjectedTokens,target);
   }
}
```
### 1.8 nest-application.ts
src\@nestjs\core\nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '@nestjs/common'
export class NestApplication {
    private readonly app: Express = express()
+   private readonly providers = new Map()
    constructor(protected readonly module) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            req.user = { name: 'admin', role: 'admin' };
            next();
        });
+       this.initProviders();
    }
+   initProviders() {
+       const providers = Reflect.getMetadata('providers', this.module) ?? [];
+       for (const provider of providers) {
+           if (provider.provide && provider.useClass) {
+               const dependencies = this.resolveDependencies(provider.useClass);
+               const classInstance = new provider.useClass(...dependencies);
+               this.providers.set(provider.provide, classInstance);
+           } else if (provider.provide && provider.useValue) {
+               this.providers.set(provider.provide, provider.useValue);
+           }  else if (provider.provide && provider.useFactory) {
+               const inject = provider.inject??[];
+               const injectedValues = inject.map(this.getProviderByToken);
+               const value = provider.useFactory(...injectedValues);
+               this.providers.set(provider.provide, value);
+           }else {
+               const dependencies = this.resolveDependencies(provider);
+               this.providers.set(provider, new provider(...dependencies));
+           }
+       }
+   }
    use(middleware) {
        this.app.use(middleware);
    }
    private getProviderByToken=(injectedToken)=>{
        return this.providers.get(injectedToken)??injectedToken;
    }
+    private resolveDependencies(Clazz) {
+        const injectedTokens = Reflect.getMetadata(INJECTED_TOKENS, Clazz) ?? [];
+        const constructorParams = Reflect.getMetadata(DESIGN_PARAMTYPES, Clazz)?? [];
+        return constructorParams.map((param, index) => {
+            return this.getProviderByToken(injectedTokens[index] ?? param);
+        });
+    }
    async init() {
        const controllers = Reflect.getMetadata('controllers', this.module) || [];
        Logger.log(`AppModule dependencies initialized`, 'InstanceLoader');
        for (const Controller of controllers) {
+           const dependencies = this.resolveDependencies(Controller);
+           const controller = new Controller(...dependencies);
            const prefix = Reflect.getMetadata('prefix', Controller) || '/';
            Logger.log(`${Controller.name} {${prefix}}`, 'RoutesResolver');
            const controllerPrototype = Controller.prototype;
            for (const methodName of Object.getOwnPropertyNames(controllerPrototype)) {
                const method = controllerPrototype[methodName];
                const httpMethod = Reflect.getMetadata('method', method);//GET
                const pathMetadata = Reflect.getMetadata('path', method);
                const redirectUrl = Reflect.getMetadata('redirectUrl', method);
                const redirectStatusCode = Reflect.getMetadata('redirectStatusCode', method);
                const statusCode = Reflect.getMetadata('statusCode', method);
                const headers = Reflect.getMetadata('headers', method) ?? [];
                if (!httpMethod) continue;
                const routePath = path.posix.join('/', prefix, pathMetadata)
                this.app[httpMethod.toLowerCase()](routePath, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
                    const args = this.resolveParams(controller, methodName, req, res, next);
                    const result = await method.call(controller, ...args);
                    if (result?.url) {
                        return res.redirect(result.statusCode || 302, result.url);
                    }
                    if (redirectUrl) {
                        return res.redirect(redirectStatusCode || 302, redirectUrl);
                    }
                    if (statusCode) {
                        res.statusCode = statusCode;
                    } else if (httpMethod === 'POST') {
                        res.statusCode = 201;
                    }
                    const responseMetadata = this.getResponseMetadata(controller, methodName);
                    if (!responseMetadata || (responseMetadata?.data?.passthrough)) {
                        headers.forEach(({ name, value }) => {
                            res.setHeader(name, value);
                        });

                        res.send(result);
                    }
                })
                Logger.log(`Mapped {${routePath}, ${httpMethod}} route`, 'RoutesResolver');
            }

        }
        Logger.log(`Nest application successfully started`, 'NestApplication');
    }
    private getResponseMetadata(controller, methodName) {
        const paramsMetaData = Reflect.getMetadata(`params`, controller, methodName) ?? [];
        return paramsMetaData.filter(Boolean).find((param) =>
            param.key === 'Response' || param.key === 'Res' || param.key === 'Next');
    }
    private resolveParams(instance: any, methodName: string, req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
        const paramsMetaData = Reflect.getMetadata(`params`, instance, methodName) ?? [];
        return paramsMetaData.map((paramMetaData) => {
            const { key, data, factory } = paramMetaData;//{passthrough:true}
            const ctx = {
                swithToHttp: () => ({
                    getRequest: () => req,
                    getResponse: () => req,
                    getNext: () => next,
                })
            }
            switch (key) {
                case "Request":
                case "Req":
                    return req;
                case "Query":
                    return data ? req.query[data] : req.query;
                case "Headers":
                    return data ? req.headers[data] : req.headers;
                case 'Session':
                    return data ? req.session[data] : req.session;
                case 'Ip':
                    return req.ip;
                case 'Param':
                    return data ? req.params[data] : req.params;
                case 'Body':
                    return data ? req.body[data] : req.body;
                case "Response":
                case "Res":
                    return res;
                case "Next":
                    return next;
                case "DecoratorFactory":
                    return factory(data, ctx);
                default:
                    return null;
            }
        })
    }
    async listen(port) {
        await this.init();
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:${port}`, 'NestApplication');
        });
    }
}
```
## 2.imports和exports

+ 模块是用 @Module() 装饰器注释的类。@Module() 装饰器提供的元数据被 Nest 用来组织应用程序结构。
+ 在 Nest 中，模块默认是单例的，因此您可以轻松地在多个模块之间共享任何提供者的同一个实例
+ 每个模块都是自动共享模块。一旦创建，它就可以被任何模块重用。
### 2.1 logger.module.ts
src\logger.module.ts
```js
import { Module } from '@nestjs/common';
import {LoggerClassService,LoggerService,UseValueService,UseFactory} from './logger.service';
@Module({
    providers:[
        {
            provide:'SUFFIX',
            useValue:'suffix'
        },
         LoggerClassService,
         {
            provide:LoggerService,
            useClass:LoggerService
        },
        {
            provide:'StringToken',
            useValue:new UseValueService('prefix')
        },
        {
            provide:'FactoryToken',
            inject:['prefix1','SUFFIX'],
            useFactory:(prefix1,suffix)=>new UseFactory(prefix1,suffix)
        }
    ]
})
export class LoggerModule {}
```
### 2.2 app.module.ts
src\app.module.ts
```js
import { Module } from "@nestjs/common";
import { AppController } from './app.controller';
+import { LoggerModule } from './logger.module';
@Module({
+   imports: [LoggerModule],
    controllers: [AppController]
})
export class AppModule {}
```
### 2.3 module.decorator.ts
src\@nestjs\common\module.decorator.ts
```js
import 'reflect-metadata';
interface ModuleMetadata{
  controllers?:Function[];
  providers?:any[];
+ exports?: any[];
+ imports?: any[];
}
export function Module(metadata:ModuleMetadata):ClassDecorator{
    return (target:Function)=>{
      Reflect.defineMetadata('controllers',metadata.controllers,target);
      Reflect.defineMetadata('providers',metadata.providers,target);
+     Reflect.defineMetadata('exports', metadata.exports, target);
+     Reflect.defineMetadata('imports', metadata.imports, target);
    }
}
```
### 2.4 nest-application.ts
src\@nestjs\core\nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '@nestjs/common'
export class NestApplication {
    private readonly app: Express = express()
    private readonly providers = new Map()
    constructor(protected readonly module) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            req.user = { name: 'admin', role: 'admin' };
            next();
        });
        this.initProviders();
    }
+   // 初始化提供者
+   private initProviders() {
+       // 获取模块的导入元数据
+       const imports = Reflect.getMetadata('imports', this.module) || [];
+       // 遍历所有导入的模块
+       for (const importedModule of imports) {
+           // 获取导入模块中的提供者元数据
+           const importedProviders = Reflect.getMetadata('providers', importedModule) || [];
+           // 遍历并添加每个提供者
+           for (const provider of importedProviders) {
+               this.addProvider(provider);
+           }
+       }
+       // 获取当前模块的提供者元数据
+       const providers = Reflect.getMetadata('providers', this.module) || [];
+       // 遍历并添加每个提供者
+       for (const provider of providers) {
+           this.addProvider(provider);
+       }
+   }
+   // 添加提供者
+   addProvider(provider) {
+       // 如果提供者有provide和useClass属性
+       if (provider.provide && provider.useClass) {
+           // 解析依赖项
+           const dependencies = this.resolveDependencies(provider.useClass);
+           // 创建类实例
+           const classInstance = new provider.useClass(...dependencies);
+           // 将提供者添加到Map中
+           this.providers.set(provider.provide, classInstance);
+       } else if (provider.provide && provider.useValue) { // 如果提供者有provide和useValue属性
+           // 直接将值添加到Map中
+           this.providers.set(provider.provide, provider.useValue);
+       } else if (provider.provide && provider.useFactory) { // 如果提供者有provide和useFactory属性
+           const inject = provider.inject ?? [];
+           const injectedValues = inject.map(this.getProviderByToken);
+           const value = provider.useFactory(...injectedValues);
+           this.providers.set(provider.provide, value);
+       } else { // 直接是类
+           const dependencies = this.resolveDependencies(provider);
+           this.providers.set(provider, new provider(...dependencies));
+       }
+   }
    use(middleware) {
        this.app.use(middleware);
    }
    private getProviderByToken = (injectedToken) => {
        return this.providers.get(injectedToken) ?? injectedToken;
    }
    private resolveDependencies(Clazz) {
        const injectedTokens = Reflect.getMetadata(INJECTED_TOKENS, Clazz) ?? [];
        const constructorParams = Reflect.getMetadata(DESIGN_PARAMTYPES, Clazz) ?? [];
        return constructorParams.map((param, index) => {
            return this.getProviderByToken(injectedTokens[index] ?? param);
        });

    }
    async init() {
        const controllers = Reflect.getMetadata('controllers', this.module) || [];
        Logger.log(`AppModule dependencies initialized`, 'InstanceLoader');
        for (const Controller of controllers) {
            const dependencies = this.resolveDependencies(Controller);
            const controller = new Controller(...dependencies);
            const prefix = Reflect.getMetadata('prefix', Controller) || '/';
            Logger.log(`${Controller.name} {${prefix}}`, 'RoutesResolver');
            const controllerPrototype = Controller.prototype;
            for (const methodName of Object.getOwnPropertyNames(controllerPrototype)) {
                const method = controllerPrototype[methodName];
                const httpMethod = Reflect.getMetadata('method', method);//GET
                const pathMetadata = Reflect.getMetadata('path', method);
                const redirectUrl = Reflect.getMetadata('redirectUrl', method);
                const redirectStatusCode = Reflect.getMetadata('redirectStatusCode', method);
                const statusCode = Reflect.getMetadata('statusCode', method);
                const headers = Reflect.getMetadata('headers', method) ?? [];
                if (!httpMethod) continue;
                const routePath = path.posix.join('/', prefix, pathMetadata)
                this.app[httpMethod.toLowerCase()](routePath, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
                    const args = this.resolveParams(controller, methodName, req, res, next);
                    const result = await method.call(controller, ...args);
                    if (result?.url) {
                        return res.redirect(result.statusCode || 302, result.url);
                    }
                    if (redirectUrl) {
                        return res.redirect(redirectStatusCode || 302, redirectUrl);
                    }
                    if (statusCode) {
                        res.statusCode = statusCode;
                    } else if (httpMethod === 'POST') {
                        res.statusCode = 201;
                    }
                    const responseMetadata = this.getResponseMetadata(controller, methodName);
                    if (!responseMetadata || (responseMetadata?.data?.passthrough)) {
                        headers.forEach(({ name, value }) => {
                            res.setHeader(name, value);
                        });

                        res.send(result);
                    }
                })
                Logger.log(`Mapped {${routePath}, ${httpMethod}} route`, 'RoutesResolver');
            }

        }
        Logger.log(`Nest application successfully started`, 'NestApplication');
    }
    private getResponseMetadata(controller, methodName) {
        const paramsMetaData = Reflect.getMetadata(`params`, controller, methodName) ?? [];
        return paramsMetaData.filter(Boolean).find((param) =>
            param.key === 'Response' || param.key === 'Res' || param.key === 'Next');
    }
    private resolveParams(instance: any, methodName: string, req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
        const paramsMetaData = Reflect.getMetadata(`params`, instance, methodName) ?? [];
        return paramsMetaData.map((paramMetaData) => {
            const { key, data, factory } = paramMetaData;//{passthrough:true}
            const ctx = {
                swithToHttp: () => ({
                    getRequest: () => req,
                    getResponse: () => req,
                    getNext: () => next,
                })
            }
            switch (key) {
                case "Request":
                case "Req":
                    return req;
                case "Query":
                    return data ? req.query[data] : req.query;
                case "Headers":
                    return data ? req.headers[data] : req.headers;
                case 'Session':
                    return data ? req.session[data] : req.session;
                case 'Ip':
                    return req.ip;
                case 'Param':
                    return data ? req.params[data] : req.params;
                case 'Body':
                    return data ? req.body[data] : req.body;
                case "Response":
                case "Res":
                    return res;
                case "Next":
                    return next;
                case "DecoratorFactory":
                    return factory(data, ctx);
                default:
                    return null;
            }
        })
    }
    async listen(port) {
        await this.init();
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:${port}`, 'NestApplication');
        });
    }
}
```
## 3.模块重新导出
+ 模块可以导出其内部提供者。此外，它们可以重新导出它们导入的模块。
+ 在下面的示例中，CommonModule 被导入到并从 CoreModule 导出，从而使其可用于导入该模块的其他模块。
### 3.1 app.module.ts
src\app.module.ts
```js
import { Module } from "@nestjs/common";
import { AppController } from './app.controller';
+import { CoreModule } from './core.module';
@Module({
+   imports: [CoreModule],
    controllers: [AppController]
})
export class AppModule {}
```
### 3.2 core.module.ts
src\core.module.ts
```js
import { Module } from '@nestjs/common';
import { CommonModule } from './common.module';
@Module({
  imports: [CommonModule],
  exports: [CommonModule],
})
export class CoreModule {}
```
### 3.3 common.module.ts
src\common.module.ts
```js
import { Module } from '@nestjs/common';
import { CommonService } from './common.service';

@Module({
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
```
### 3.4 common.service.ts
src\common.service.ts
```js
import { Injectable } from '@nestjs/common';
@Injectable()
export class CommonService {
  log(message: string) {
    console.log('CommonService',message);
  }
}
```
### 3.5 app.controller.ts
src\app.controller.ts
```js
import { Controller, Get, Inject } from '@nestjs/common'
+import { CommonService } from './common.service'

@Controller()
export class AppController {
    constructor(
+       private readonly commonService: CommonService
    ) {}
    @Get()
    index() {
        return 'index';
    }
+   @Get('common')
+   common(): string {
+       this.commonService.log('Hello from CommonService');
+       return 'common';
+   }
}
```
### 3.6 module.decorator.ts
src\@nestjs\common\module.decorator.ts
```js
import 'reflect-metadata';
interface ModuleMetadata{
  controllers?:Function[];
  providers?:any[];
  exports?: any[];
  imports?: any[];
}
export function Module(metadata:ModuleMetadata):ClassDecorator{
    return (target:Function)=>{
+     Reflect.defineMetadata('isModule', true, target);
      Reflect.defineMetadata('controllers',metadata.controllers,target);
      Reflect.defineMetadata('providers',metadata.providers,target);
      Reflect.defineMetadata('exports', metadata.exports, target);
      Reflect.defineMetadata('imports', metadata.imports, target);
    }
}
```
### 3.7 nest-application.ts
src\@nestjs\core\nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '@nestjs/common'
export class NestApplication {
    private readonly app: Express = express()
    private readonly providers = new Map()
    constructor(protected readonly module) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            req.user = { name: 'admin', role: 'admin' };
            next();
        });
        this.initProviders();
    }
    private initProviders() {
        const imports = Reflect.getMetadata('imports', this.module) || [];
        for (const importedModule of imports) {
+           this.registerProvidersFromModule(importedModule);
        }
        const providers = Reflect.getMetadata('providers', this.module) || [];
        for (const provider of providers) {
            this.addProvider(provider);
        }
    }
+   private registerProvidersFromModule(module) {
+       const providers = Reflect.getMetadata('providers', module) || [];
+       const exports = Reflect.getMetadata('exports', module) || [];
+       for (const exportToken of exports) {
+           if (this.isModule(exportToken)) {
+               this.registerProvidersFromModule(exportToken)
+           } else {
+               const provider = providers.find(provider => provider === exportToken || provider.provide === exportToken);
+               if (provider) this.addProvider(provider);
+           }
+       }
+   }
+   isModule(injectToken) {
+       return injectToken && injectToken instanceof Function && Reflect.getMetadata('isModule', injectToken)
+    }
    addProvider(provider) {
        if (provider.provide && provider.useClass) {
            const dependencies = this.resolveDependencies(provider.useClass);
            const classInstance = new provider.useClass(...dependencies);
            this.providers.set(provider.provide, classInstance);
        } else if (provider.provide && provider.useValue) {
            this.providers.set(provider.provide, provider.useValue);
        } else if (provider.provide && provider.useFactory) {
            const inject = provider.inject ?? [];
            const injectedValues = inject.map(this.getProviderByToken);
            const value = provider.useFactory(...injectedValues);
            this.providers.set(provider.provide, value);
        } else {
            const dependencies = this.resolveDependencies(provider);
            this.providers.set(provider, new provider(...dependencies));
        }
    }
    use(middleware) {
        this.app.use(middleware);
    }
    private getProviderByToken = (injectedToken) => {
        return this.providers.get(injectedToken) ?? injectedToken;
    }
    private resolveDependencies(Clazz) {
        const injectedTokens = Reflect.getMetadata(INJECTED_TOKENS, Clazz) ?? [];
        const constructorParams = Reflect.getMetadata(DESIGN_PARAMTYPES, Clazz) ?? [];
        return constructorParams.map((param, index) => {
            return this.getProviderByToken(injectedTokens[index] ?? param);
        });

    }
    async init() {
        const controllers = Reflect.getMetadata('controllers', this.module) || [];
        Logger.log(`AppModule dependencies initialized`, 'InstanceLoader');
        for (const Controller of controllers) {
            const dependencies = this.resolveDependencies(Controller);
            const controller = new Controller(...dependencies);
            const prefix = Reflect.getMetadata('prefix', Controller) || '/';
            Logger.log(`${Controller.name} {${prefix}}`, 'RoutesResolver');
            const controllerPrototype = Controller.prototype;
            for (const methodName of Object.getOwnPropertyNames(controllerPrototype)) {
                const method = controllerPrototype[methodName];
                const httpMethod = Reflect.getMetadata('method', method);//GET
                const pathMetadata = Reflect.getMetadata('path', method);
                const redirectUrl = Reflect.getMetadata('redirectUrl', method);
                const redirectStatusCode = Reflect.getMetadata('redirectStatusCode', method);
                const statusCode = Reflect.getMetadata('statusCode', method);
                const headers = Reflect.getMetadata('headers', method) ?? [];
                if (!httpMethod) continue;
                const routePath = path.posix.join('/', prefix, pathMetadata)
                this.app[httpMethod.toLowerCase()](routePath, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
                    const args = this.resolveParams(controller, methodName, req, res, next);
                    const result = await method.call(controller, ...args);
                    if (result?.url) {
                        return res.redirect(result.statusCode || 302, result.url);
                    }
                    if (redirectUrl) {
                        return res.redirect(redirectStatusCode || 302, redirectUrl);
                    }
                    if (statusCode) {
                        res.statusCode = statusCode;
                    } else if (httpMethod === 'POST') {
                        res.statusCode = 201;
                    }
                    const responseMetadata = this.getResponseMetadata(controller, methodName);
                    if (!responseMetadata || (responseMetadata?.data?.passthrough)) {
                        headers.forEach(({ name, value }) => {
                            res.setHeader(name, value);
                        });

                        res.send(result);
                    }
                })
                Logger.log(`Mapped {${routePath}, ${httpMethod}} route`, 'RoutesResolver');
            }

        }
        Logger.log(`Nest application successfully started`, 'NestApplication');
    }
    private getResponseMetadata(controller, methodName) {
        const paramsMetaData = Reflect.getMetadata(`params`, controller, methodName) ?? [];
        return paramsMetaData.filter(Boolean).find((param) =>
            param.key === 'Response' || param.key === 'Res' || param.key === 'Next');
    }
    private resolveParams(instance: any, methodName: string, req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
        const paramsMetaData = Reflect.getMetadata(`params`, instance, methodName) ?? [];
        return paramsMetaData.map((paramMetaData) => {
            const { key, data, factory } = paramMetaData;//{passthrough:true}
            const ctx = {
                swithToHttp: () => ({
                    getRequest: () => req,
                    getResponse: () => req,
                    getNext: () => next,
                })
            }
            switch (key) {
                case "Request":
                case "Req":
                    return req;
                case "Query":
                    return data ? req.query[data] : req.query;
                case "Headers":
                    return data ? req.headers[data] : req.headers;
                case 'Session':
                    return data ? req.session[data] : req.session;
                case 'Ip':
                    return req.ip;
                case 'Param':
                    return data ? req.params[data] : req.params;
                case 'Body':
                    return data ? req.body[data] : req.body;
                case "Response":
                case "Res":
                    return res;
                case "Next":
                    return next;
                case "DecoratorFactory":
                    return factory(data, ctx);
                default:
                    return null;
            }
        })
    }
    async listen(port) {
        await this.init();
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:${port}`, 'NestApplication');
        });
    }
}
```
## 4.全局模块
+ 如果必须在每个地方都导入相同的模块集合，这会变得很乏味。与 Nest 不同， Angular 的 providers 是在全局范围内注册的。一旦定义，它们就可以在任何地方使用。然而，Nest 将提供者封装在模块范围内。您不能在不首先导入封装模块的情况下在其他地方使用模块的提供者。
+ 当您希望提供一组应该在所有地方开箱即用的提供者（例如，助手、数据库连接等）时，可以使用 @Global() 装饰器将模块设为全局模块。
### 4.1 app.module.ts
src\app.module.ts
```js
import { Module } from "@nestjs/common";
import { AppController } from './app.controller';
+import { CommonModule } from './common.module';
+import { OtherModule } from './other.module';
@Module({
+   imports: [CommonModule,OtherModule],
    controllers: [AppController],
    providers: [],
})
export class AppModule {}
```
### 4.2 app.controller.ts
src\app.controller.ts
```js
import { Controller, Get } from '@nestjs/common'
+import { OtherService } from './other.service'

@Controller()
export class AppController {
+   constructor(
+       private readonly otherService: OtherService
+   ) {}
    @Get()
    index() {
        return 'index';
    }
+   @Get('other')
+   other(): string {
+       this.otherService.log('Hello from otherService');
+       return 'other';
+   }
}
```
### 4.3 common.module.ts
src\common.module.ts
```js
+import { Module ,Global } from '@nestjs/common';
import { CommonService } from './common.service';
+@Global()
@Module({
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
```
### 4.4 src\other.module.ts
src\other.module.ts
```js
import { Module } from '@nestjs/common';
import { OtherService } from './other.service';
@Module({
    providers:[
        OtherService
    ],
    exports:[
        OtherService
    ]
})
export class OtherModule {}
```
### 4.5 other.service.ts
src\other.service.ts
```js
import { Injectable } from "@nestjs/common"
import { CommonService } from './common.service'
@Injectable()
export class OtherService{
    constructor(
        private readonly commonService: CommonService
    ) {}
    log(message){
        this.commonService.log(message);
    }
}
```
### 4.6 module.decorator.ts
src\@nestjs\common\module.decorator.ts
```js
import 'reflect-metadata';
interface ModuleMetadata {
  controllers?: Function[];
  providers?: any[];
  exports?: any[];
  imports?: any[];
}
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata('isModule', true, target);
+   metadata.controllers?.forEach(controller => {
+     Reflect.defineMetadata('module', target, controller);
+   });
    Reflect.defineMetadata('controllers', metadata.controllers, target);
    Reflect.defineMetadata('providers', metadata.providers, target);
    Reflect.defineMetadata('exports', metadata.exports, target);
    Reflect.defineMetadata('imports', metadata.imports, target);

  }
}
+export function defineModule(providers, module) {
+  providers?.forEach(provider => {
+      if (provider instanceof Function) {
+          Reflect.defineMetadata('module', module, provider);
+      } else if (provider.useClass instanceof Function) {
+          Reflect.defineMetadata('module', module, provider.useClass);
+      }
+  });
+}
+export function Global(): ClassDecorator {
+  return (target: Function) => {
+    Reflect.defineMetadata('global', true, target);
+  };
+}
```
### 4.7 nest-application.ts
src\@nestjs\core\nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
+import { INJECTED_TOKENS, DESIGN_PARAMTYPES, defineModule } from '@nestjs/common'
export class NestApplication {
    private readonly app: Express = express()
+   private readonly providerInstances = new Map();
+   private readonly globalProviders = new Set();
+   private readonly moduleProviders = new Map();
    constructor(protected readonly module) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            req.user = { name: 'admin', role: 'admin' };
            next();
        });
        this.initProviders();
    }
    private initProviders() {
        const imports = Reflect.getMetadata('imports', this.module) || [];
        for (const importedModule of imports) {
+           this.registerProvidersFromModule(importedModule,this.module);
        }
        const providers = Reflect.getMetadata('providers', this.module) || [];
        for (const provider of providers) {
+           this.addProvider(provider,this.module);
        }
    }
+   private registerProvidersFromModule(module, ...parentModules) {
+       const global = Reflect.getMetadata('global', module);
        const providers = Reflect.getMetadata('providers', module) || [];
        const exports = Reflect.getMetadata('exports', module) || [];
        for (const exportToken of exports) {
            if (this.isModule(exportToken)) {
+               this.registerProvidersFromModule(exportToken, module, ...parentModules)
            } else {
                const provider = providers.find(provider => provider === exportToken || provider.provide === exportToken);
                if (provider){
+                   [module, ...parentModules].forEach(module => {
+                       this.addProvider(provider,module,global);
+                   });
                } 
            }
        }
    }
    isModule(injectToken) {
        return injectToken && injectToken instanceof Function && Reflect.getMetadata('isModule', injectToken)
    }
    addProvider(provider,module,global = false) {
+       const providers = global ? this.globalProviders : (this.moduleProviders.get(module) || new Set());
+       if (!global && !this.moduleProviders.has(module)) {
+         this.moduleProviders.set(module, providers);
+       }
        if (provider.provide && provider.useClass) {
            const injectToken = provider.provide || provider;
            const dependencies = this.resolveDependencies(provider.useClass);
            const classInstance = new provider.useClass(...dependencies);
+           this.providerInstances.set(injectToken, classInstance);
+           providers.add(injectToken);
        } else if (provider.provide && provider.useValue) {
+           providers.add(provider.provide);
        } else if (provider.provide && provider.useFactory) {
            const inject = provider.inject ?? [];
+           const injectedValues = inject.map((inject)=>this.getProviderByToken(inject,module));
            const value = provider.useFactory(...injectedValues);
+           this.providerInstances.set(provider.provide, value);
+           providers.add(provider.provide);
        } else {
            const dependencies = this.resolveDependencies(provider);
            const classInstance = new provider(...dependencies);
+           this.providerInstances.set(provider, classInstance);
+           providers.add(provider);
        }
    }
    use(middleware) {
        this.app.use(middleware);
    }
    private getProviderByToken(injectedToken: any, module: any) {
+       if (this.globalProviders.has(injectedToken)) {
+         return this.providerInstances.get(injectedToken);
+       } else if (this.moduleProviders.get(module)?.has(injectedToken)) {
+         return this.providerInstances.get(injectedToken);
+       }
    }
    private resolveDependencies(Clazz) {
        const injectedTokens = Reflect.getMetadata(INJECTED_TOKENS, Clazz) ?? [];
        const constructorParams = Reflect.getMetadata(DESIGN_PARAMTYPES, Clazz) ?? [];
        return constructorParams.map((param, index) => {
+           const module = Reflect.getMetadata('module', Clazz);
+           const injectedToken = injectedTokens[index] ?? param;
+           return this.getProviderByToken(injectedToken,module);
        });

    }
    async init() {
        const controllers = Reflect.getMetadata('controllers', this.module) || [];
        Logger.log(`AppModule dependencies initialized`, 'InstanceLoader');
        for (const Controller of controllers) {
            const dependencies = this.resolveDependencies(Controller);
            const controller = new Controller(...dependencies);
            const prefix = Reflect.getMetadata('prefix', Controller) || '/';
            Logger.log(`${Controller.name} {${prefix}}`, 'RoutesResolver');
            const controllerPrototype = Controller.prototype;
            for (const methodName of Object.getOwnPropertyNames(controllerPrototype)) {
                const method = controllerPrototype[methodName];
                const httpMethod = Reflect.getMetadata('method', method);//GET
                const pathMetadata = Reflect.getMetadata('path', method);
                const redirectUrl = Reflect.getMetadata('redirectUrl', method);
                const redirectStatusCode = Reflect.getMetadata('redirectStatusCode', method);
                const statusCode = Reflect.getMetadata('statusCode', method);
                const headers = Reflect.getMetadata('headers', method) ?? [];
                if (!httpMethod) continue;
                const routePath = path.posix.join('/', prefix, pathMetadata)
                this.app[httpMethod.toLowerCase()](routePath, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
                    const args = this.resolveParams(controller, methodName, req, res, next);
                    const result = await method.call(controller, ...args);
                    if (result?.url) {
                        return res.redirect(result.statusCode || 302, result.url);
                    }
                    if (redirectUrl) {
                        return res.redirect(redirectStatusCode || 302, redirectUrl);
                    }
                    if (statusCode) {
                        res.statusCode = statusCode;
                    } else if (httpMethod === 'POST') {
                        res.statusCode = 201;
                    }
                    const responseMetadata = this.getResponseMetadata(controller, methodName);
                    if (!responseMetadata || (responseMetadata?.data?.passthrough)) {
                        headers.forEach(({ name, value }) => {
                            res.setHeader(name, value);
                        });

                        res.send(result);
                    }
                })
                Logger.log(`Mapped {${routePath}, ${httpMethod}} route`, 'RoutesResolver');
            }

        }
        Logger.log(`Nest application successfully started`, 'NestApplication');
    }
    private getResponseMetadata(controller, methodName) {
        const paramsMetaData = Reflect.getMetadata(`params`, controller, methodName) ?? [];
        return paramsMetaData.filter(Boolean).find((param) =>
            param.key === 'Response' || param.key === 'Res' || param.key === 'Next');
    }
    private resolveParams(instance: any, methodName: string, req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
        const paramsMetaData = Reflect.getMetadata(`params`, instance, methodName) ?? [];
        return paramsMetaData.map((paramMetaData) => {
            const { key, data, factory } = paramMetaData;//{passthrough:true}
            const ctx = {
                swithToHttp: () => ({
                    getRequest: () => req,
                    getResponse: () => req,
                    getNext: () => next,
                })
            }
            switch (key) {
                case "Request":
                case "Req":
                    return req;
                case "Query":
                    return data ? req.query[data] : req.query;
                case "Headers":
                    return data ? req.headers[data] : req.headers;
                case 'Session':
                    return data ? req.session[data] : req.session;
                case 'Ip':
                    return req.ip;
                case 'Param':
                    return data ? req.params[data] : req.params;
                case 'Body':
                    return data ? req.body[data] : req.body;
                case "Response":
                case "Res":
                    return res;
                case "Next":
                    return next;
                case "DecoratorFactory":
                    return factory(data, ctx);
                default:
                    return null;
            }
        })
    }
    async listen(port) {
        await this.init();
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:${port}`, 'NestApplication');
        });
    }
}
```
## 5.动态模块
+ Nest 模块系统包含一个强大的功能，称为动态模块。此功能使您能够轻松创建可注册和配置提供者的自定义模块。
### 5.1 app.module.ts
src\app.module.ts
```js
import { Module } from "@nestjs/common";
import { AppController } from './app.controller';
+import { DynamicConfigModule } from './dynamicConfig.module';
+import { AppService } from './app.service';
@Module({
+   imports: [
+       DynamicConfigModule.forRoot()
+   ],
    controllers: [AppController],
+   providers: [AppService]
})
export class AppModule {

}
```
### 5.2 app.controller.ts
src\app.controller.ts
```js
import { Controller, Get, Inject } from '@nestjs/common'
+import { AppService } from './app.service';

@Controller()
export class AppController {
+   constructor(
+       private readonly appService: AppService
+   ) { }
+   @Get('config')
+   getConfig(): string {
+       const config = this.appService.getConfig();
+       return `Config Options: ${JSON.stringify(config)}`;
+   }
}
```
### 5.3 app.service.ts
src\app.service.ts
```js
import { Inject, Injectable } from '@nestjs/common';
@Injectable()
export class AppService {
  constructor(
    @Inject('CONFIG') private readonly config: any,
  ) {}

  getConfig() {
    return this.config;
  }
}
```
### 5.4 dynamicConfig.module.ts
src\dynamicConfig.module.ts
```js
import { Module, DynamicModule } from '@nestjs/common';
@Module({})
export class DynamicConfigModule {
  static forRoot(): DynamicModule {
    const providers:any = [
      {
        provide: 'CONFIG',
        useValue: {apiKey:'123'}
      }
    ];
    return {
      module: DynamicConfigModule,
      providers,
      exports: providers.map(provider => (provider instanceof Function ? provider : provider.provide))
    };
  }
}
```
### 5.5 module.decorator.ts
src\@nestjs\common\module.decorator.ts
```js
import 'reflect-metadata';
//模块的元数据
interface ModuleMetadata{
  controllers?:Function[];
  providers?:any[];
  exports?:any[];//模块的导出 可以把自己的一部分providers导出给别的模块的，别的模块只要导入了自己这个模块，
  imports?:any[];//导入的模块 可以导入别的模块，把别的模块的导出的providers给自己用
}
//定义模块装饰器
export function Module(metadata:ModuleMetadata):ClassDecorator{
    return (target:Function)=>{
      //当一个类使用Module装饰器的时候就可以添加标识它是一个模块的元数据
      Reflect.defineMetadata('isModule',true,target);
      //给模块类添加元数据 AppModule,元数据的名字叫controllers,值是controllers数组[AppController]
      //给模块类AppModule添加元数据 providers，值是[LoggerService]
      //就是把控制器的类和提供者的类和对应的模块进行了关联
      defineModule(target,metadata.controllers);
      Reflect.defineMetadata('controllers',metadata.controllers,target);
      defineModule(target,metadata.providers??[]);
      Reflect.defineMetadata('providers',metadata.providers,target);
      //在类上保存exports
      Reflect.defineMetadata('exports',metadata.exports,target);
      //在类上保存imports
      Reflect.defineMetadata('imports',metadata.imports,target);
    }
}

export function defineModule(nestModule,targets=[]){
  //遍历targets数组，为每个元素添加元数据，key是nestModule,值是对应的模块
  targets.forEach(target=>{
    Reflect.defineMetadata('module',nestModule,target);
  })
}
export function Global(){
  return (target:Function)=>{
    Reflect.defineMetadata('global',true,target);
  }
}
+export interface DynamicModule extends ModuleMetadata {
+  module: Function;
+}
```
### 5.6 nest-application.ts
src\@nestjs\core\nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '@nestjs/common'
+import { defineModule } from '../common';
export class NestApplication {
    //在它的内部私用化一个Express实例
    private readonly app: Express = express()
    //在此处保存所有的provider的实例key就是token, 值就是类的实例或者值
    private readonly providerInstances = new Map()
    //此入存放着全局可用的提供者和token
    private readonly globalProviders = new Set()
    //记录每个模块里有哪些provider的token
    private readonly moduleProviers = new Map()
    constructor(protected readonly module) {
        this.app.use(express.json());//用来把JSON格式的请求体对象放在req.body上
        this.app.use(express.urlencoded({ extended: true }));//把form表单格式的请求体对象放在req.body
        this.app.use((req, res, next) => {
            req.user = { name: 'admin', role: 'admin' };
            next();
        });
        this.initProviders();//注入providers
    }
    //初始化提供化
    initProviders() {//重写注册provider的流程
        //获取模块导入的元数据
        const imports = Reflect.getMetadata('imports', this.module) ?? [];
        //遍历所有的导入的模块
        for (const importModule of imports) {//LoggerModule
+           if (importModule.module) {
+              const { module, providers, exports } = importModule;
+              defineModule(this.module,providers);
+              Reflect.defineMetadata('providers', [...(module.providers || []), ...providers], module);
+              Reflect.defineMetadata('exports', [...(module.exports || []), ...exports], module);
+              this.registerProvidersFromModule(module, this.module);
+            } else {
+              this.registerProvidersFromModule(importModule, this.module);
+            }
+       }
        //获取当前模块提供者的元数据
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        //遍历并添加每个提供者
        for (const provider of providers) {
            this.addProvider(provider, this.module);
        }
    }
    private registerProvidersFromModule(module, ...parentModules) {
        //获取导入的是不是全局模块
        const global = Reflect.getMetadata('global', module);
        //拿到导入的模块providers进行全量注册
        const importedProviders = Reflect.getMetadata('providers', module) ?? [];
        //1.有可能导入的模块只导出了一部分，并没有全量导出,所以需要使用exports进行过滤 
        const exports = Reflect.getMetadata('exports', module) ?? [];
        //遍历导出exports数组
        for (const exportToken of exports) {
            //2.exports里还可能有module
            if (this.isModule(exportToken)) {
                //要执行递归操作
                this.registerProvidersFromModule(exportToken, module, ...parentModules);
            } else {
                const provider = importedProviders.find(provider => provider === exportToken || provider.provide == exportToken);
                if (provider) {
                    [module, ...parentModules].forEach(module => {
                        this.addProvider(provider, module, global);
                    });
                }
            }
        }
    }
    private isModule(exportToken) {
        return exportToken && exportToken instanceof Function && Reflect.getMetadata('isModule', exportToken);
    }
    //原来的provider都混在一起了，现在需要分开，每个模块有自己的providers
    addProvider(provider, module, global = false) {
        //此providers代表module这个模块对应的provider的token
        const providers = global ? this.globalProviders : (this.moduleProviers.get(module) || new Set());
        if (!this.moduleProviers.has(module)) {
            this.moduleProviers.set(module, providers);
        }
        //获取要注册的provider的token
        const injectToken = provider.provide ?? provider;
        //如果实例池里已经有此token对应的实例了
        if (this.providerInstances.has(injectToken)) {
            //则直接把此token放入到providers这个集合直接返回
            if(!providers.has(injectToken)){
                providers.add(injectToken);
            }
            return;
        }
        //如果有provider的token,并且有useClass属性，说明提供的是一个类，需要实例化
        if (provider.provide && provider.useClass) {
            //获取这个类的定义LoggerService
            const Clazz = provider.useClass;
            //获取此类的参数['suffix']
            const dependencies = this.resolveDependencies(Clazz);
            //创建提供者类的实例
            const value = new Clazz(...dependencies);
            //把提供者的token和实例保存到Map中
            this.providerInstances.set(provider.provide, value);
            providers.add(provider.provide);
            //如果提供的是一个值，则直接放到Map中
        } else if (provider.provide && provider.useValue) {
            this.providerInstances.set(provider.provide, provider.useValue);
            providers.add(provider.provide);
        } else if (provider.provide && provider.useFactory) {
            const inject = provider.inject ?? [];//获取要注入工厂函数的参数  
            //解析出参数的值
            const injectedValues = inject.map(injectToken => this.getProviderByToken(injectToken, module));
            //执行工厂方法，获取返回的值 
            const value = provider.useFactory(...injectedValues);
            //把token和值注册到Map中
            this.providerInstances.set(provider.provide, value);
            providers.add(provider.provide);
        } else {
            //获取此类的参数['suffix']
            const dependencies = this.resolveDependencies(provider);
            //创建提供者类的实例
            const value = new provider(...dependencies);
            //把提供者的token和实例保存到Map中
            this.providerInstances.set(provider, value);
            providers.add(provider);
        }
    }
    use(middleware) {
        this.app.use(middleware);
    }
    private getProviderByToken = (injectedToken, module) => {
        //如何通过token在特定模块下找对应的provider
        //先找到此模块对应的token set,再判断此injectedToken在不在此set中,如果存在， 是可能返回对应的provider实例
        if (this.moduleProviers.get(module)?.has(injectedToken) || this.globalProviders.has(injectedToken)) {
            return this.providerInstances.get(injectedToken);
        } else {
            return null;
        }

    }
    private resolveDependencies(Clazz) {
        //取得注入的token
        const injectedTokens = Reflect.getMetadata(INJECTED_TOKENS, Clazz) ?? [];
        //获取构造函数的参数类型
        const constructorParams = Reflect.getMetadata(DESIGN_PARAMTYPES, Clazz) ?? [];
        return constructorParams.map((param, index) => {
            const module = Reflect.getMetadata('module', Clazz);
            //把每个param中的token默认换成对应的provider值
            return this.getProviderByToken(injectedTokens[index] ?? param, module);
        });

    }
    //配置初始化工作
    async init() {
        //取出模块里所有的控制器，然后做好路由配置
        const controllers = Reflect.getMetadata('controllers', this.module) || [];
        Logger.log(`AppModule dependencies initialized`, 'InstanceLoader');
        //路由映射的核心是知道 什么样的请求方法什么样的路径对应的哪个处理函数
        for (const Controller of controllers) {
            //解析出控制器的依赖
            const dependencies = this.resolveDependencies(Controller);
            //创建每个控制器的实例
            const controller = new Controller(...dependencies);
            //获取控制器的路径前缀
            const prefix = Reflect.getMetadata('prefix', Controller) || '/';
            //开始解析路由
            Logger.log(`${Controller.name} {${prefix}}`, 'RoutesResolver');
            const controllerPrototype = Controller.prototype;
            //遍历类的原型上的方法名
            for (const methodName of Object.getOwnPropertyNames(controllerPrototype)) {
                //获取原型上的方法 index
                const method = controllerPrototype[methodName];
                //取得此函数上绑定的方法名的元数据
                const httpMethod = Reflect.getMetadata('method', method);//GET
                //取得此函数上绑定的路径的元数据
                const pathMetadata = Reflect.getMetadata('path', method);
                const redirectUrl = Reflect.getMetadata('redirectUrl', method);
                const redirectStatusCode = Reflect.getMetadata('redirectStatusCode', method);
                const statusCode = Reflect.getMetadata('statusCode', method);
                const headers = Reflect.getMetadata('headers', method) ?? [];
                //如果方法名不存在，则不处理
                if (!httpMethod) continue;
                //拼出来完整的路由路径
                const routePath = path.posix.join('/', prefix, pathMetadata)
                //配置路由，当客户端以httpMethod方法请求routePath路径的时候，会由对应的函数进行处理
                this.app[httpMethod.toLowerCase()](routePath, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
                    const args = this.resolveParams(controller, methodName, req, res, next);
                    //执行路由处理函数，获取返回值
                    const result = await method.call(controller, ...args);
                    if (result?.url) {
                        return res.redirect(result.statusCode || 302, result.url);
                    }
                    //判断如果需要重定向，则直接重定向到指定的redirectUrl
                    if (redirectUrl) {
                        return res.redirect(redirectStatusCode || 302, redirectUrl);
                    }
                    if (statusCode) {
                        res.statusCode = statusCode;
                    } else if (httpMethod === 'POST') {
                        res.statusCode = 201;
                    }
                    //判断controller的methodName方法里有没有使用Response或Res参数装饰器，如果用了任何一个则不发响应
                    const responseMetadata = this.getResponseMetadata(controller, methodName);
                    //或者没有注入Response参数装饰器，或者注入了但是传递了passthrough参数，都会由Nest.js来返回响应
                    if (!responseMetadata || (responseMetadata?.data?.passthrough)) {
                        headers.forEach(({ name, value }) => {
                            res.setHeader(name, value);
                        });
                        //把返回值序列化发回给客户端
                        res.send(result);
                    }
                })
                Logger.log(`Mapped {${routePath}, ${httpMethod}} route`, 'RoutesResolver');
            }

        }
        Logger.log(`Nest application successfully started`, 'NestApplication');
    }
    private getResponseMetadata(controller, methodName) {
        const paramsMetaData = Reflect.getMetadata(`params`, controller, methodName) ?? [];
        return paramsMetaData.filter(Boolean).find((param) =>
            param.key === 'Response' || param.key === 'Res' || param.key === 'Next');
    }
    private resolveParams(instance: any, methodName: string, req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
        //获取参数的元数据
        const paramsMetaData = Reflect.getMetadata(`params`, instance, methodName) ?? [];
        //[{ parameterIndex: 0, key: 'Req' },{ parameterIndex: 1, key: 'Request' }]
        //此处就是把元数据变成实际的参数
        return paramsMetaData.map((paramMetaData) => {
            const { key, data, factory } = paramMetaData;//{passthrough:true}
            const ctx = {//因为Nest不但支持http,还支持graphql 微服务 websocket
                swithToHttp: () => ({
                    getRequest: () => req,
                    getResponse: () => req,
                    getNext: () => next,
                })
            }
            switch (key) {
                case "Request":
                case "Req":
                    return req;
                case "Query":
                    return data ? req.query[data] : req.query;
                case "Headers":
                    return data ? req.headers[data] : req.headers;
                case 'Session':
                    return data ? req.session[data] : req.session;
                case 'Ip':
                    return req.ip;
                case 'Param':
                    return data ? req.params[data] : req.params;
                case 'Body':
                    return data ? req.body[data] : req.body;
                case "Response":
                case "Res":
                    return res;
                case "Next":
                    return next;
                case "DecoratorFactory":
                    return factory(data, ctx);
                default:
                    return null;
            }
        })
        //[req,req]
    }
    //启动HTTP服务器
    async listen(port) {
        await this.init();
        //调用express实例的listen方法启动一个HTTP服务器，监听port端口
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:${port}`, 'NestApplication');
        });
    }
}
```
## 6.传递参数
### 6.1 app.module.ts
src\app.module.ts
```js
import { Module } from "@nestjs/common";
import { AppController } from './app.controller';
import { DynamicConfigModule } from './dynamicConfig.module';
import { AppService } from './app.service';
@Module({
    imports: [
        DynamicConfigModule.forRoot({
+            apiKey:'456'
        })
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {

}
```
### 6.2 dynamicConfig.module.ts
src\dynamicConfig.module.ts
```js
import { Module, DynamicModule } from '@nestjs/common';
@Module({})
export class DynamicConfigModule {
+ static forRoot(configValue): DynamicModule {
    const providers:any = [
      {
        provide: 'CONFIG',
+       useValue: configValue
      }
    ];
    return {
      module: DynamicConfigModule,
      providers,
      exports: providers.map(provider => (provider instanceof Function ? provider : provider.provide))
    };
  }
}
```