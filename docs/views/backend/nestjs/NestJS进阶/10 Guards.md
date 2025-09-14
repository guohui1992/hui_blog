## 1.Guards
+ 守卫是一个用 @Injectable() 装饰器注释的类，它实现了 CanActivate 接口。
+ Request=>Middleware=>Guard=>Pipe=>Before Interceptor=>Route handler=>After Interceptor=>Exception filter=>Response
+ 请求=>中间件=>守卫=>管道=>拦截器前=>路由处理程序=>拦截器后=>异常过滤器=>响应
### 1.1. can-activate.interface.ts
src/@nestjs/common/can-activate.interface.ts
```js
// 从当前目录下导入 ExecutionContext 接口
import { ExecutionContext } from './execution-context.interface';
// 定义 CanActivate 接口
export interface CanActivate {
    // 定义 canActivate 方法，接受一个 ExecutionContext 参数，返回 boolean 或 Promise<boolean>
    canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}
```
### 1.2. execution-context.interface.ts
src/@nestjs/common/execution-context.interface.ts
```js
// 从 './arguments-host.interface' 导入 ArgumentsHost 接口
import { ArgumentsHost } from './arguments-host.interface';
// 定义一个名为 ExecutionContext 的接口，它继承自 ArgumentsHost 接口
export interface ExecutionContext extends ArgumentsHost {
    // 定义一个方法 getClass，用于获取类
    // 该方法返回类型为泛型 T，默认类型为 any
    getClass<T = any>(): T;
    // 定义一个方法 getHandler，用于获取处理函数
    // 该方法返回类型为 Function
    getHandler(): Function;
}
```
### 1.3. set-metadata.decorator.ts
src/@nestjs/common/set-metadata.decorator.ts
```js
// 引入反射元数据的库
import 'reflect-metadata';
// 定义一个装饰器函数 SetMetadata，接受两个参数：metadataKey 和 metadataValue
export function SetMetadata(metadataKey: any, metadataValue: any): MethodDecorator & ClassDecorator {
    // 返回一个装饰器函数
    return (target: object | Function, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
        // 如果 descriptor 存在，则表示这是一个方法装饰器
        if (descriptor) {
            // 将元数据附加到方法上
            Reflect.defineMetadata(metadataKey, metadataValue, descriptor.value);
        } else {
            // 否则，将元数据附加到类上
            Reflect.defineMetadata(metadataKey, metadataValue, target);
        }
    };
}
```
### 1.4. use-guards.decorator.ts
src/@nestjs/common/use-guards.decorator.ts
```js
// 导入reflect-metadata，用于反射API的元数据
import 'reflect-metadata';
// 导入CanActivate接口
import { CanActivate } from './can-activate.interface';
// 定义一个装饰器函数UseGuards，可以作为方法和类的装饰器
export function UseGuards(...guards: (CanActivate | Function)[]): MethodDecorator & ClassDecorator {
    // 返回一个装饰器函数，接收目标对象、属性键和描述符作为参数
    return (target: object | Function, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
        // 如果有描述符，表示装饰的是方法
        if (descriptor) {
            // 将guards元数据定义在方法上
            Reflect.defineMetadata('guards', guards, descriptor.value);
        } else {
            // 如果没有描述符，表示装饰的是类，将guards元数据定义在类上
            Reflect.defineMetadata('guards', guards, target);
        }
    };
}
```
### 1.5. reflector.ts
src/@nestjs/core/reflector.ts
```js
// 引入 reflect-metadata 库，提供元数据反射的能力
import 'reflect-metadata';
// 定义一个 Reflector 类
export class Reflector {
    // get 方法，用于获取元数据
    // T 是泛型，表示返回值的类型，可以是任意类型
    // metadataKey 是元数据的键
    // target 是目标对象，可以是类或类的原型
    // key 是可选参数，表示目标对象上的具体属性
    get<T extends any>(metadataKey: any, target: any, key?: string): T {
        // 如果传入了 key 参数，则获取 target 对象上 key 属性的元数据
        // 否则，获取 target 对象的元数据
        return key
            ? Reflect.getMetadata(metadataKey, target, key)  // 获取 target 对象上 key 属性的元数据
            : Reflect.getMetadata(metadataKey, target);      // 获取 target 对象的元数据
    }
}
```
### 1.6. account.controller.ts
src/account.controller.ts
```js
// 导入 Controller, Get, UseGuards 装饰器
import { Controller, Get, UseGuards } from "@nestjs/common";
// 导入自定义的 RolesGuard
import { AuthGuard} from "./auth.guard";
// 导入自定义的 Roles 装饰器
import { Roles } from "./roles.decorator";
// 使用 @Controller 装饰器定义一个控制器，路由前缀为 'accounts'
@Controller('accounts')
export class AccountController {
    // 定义一个 GET 请求的处理方法
    @Get()
    // 使用 @UseGuards 装饰器来应用 AuthGuard守卫
    @UseGuards(RolesGuard)
    // 使用 @Roles 装饰器来限制只有具有 'admin' 角色的用户才能访问此方法
    @Roles('admin')
    // 异步方法，处理 GET 请求并返回一个字符串
    async index() {
        return 'This action returns all accounts';
    }
}
```
### 1.7. roles.decorator.ts
src/roles.decorator.ts
```js
// 从 @nestjs/common 模块中导入 SetMetadata 函数
import { SetMetadata } from '@nestjs/common';
// 定义一个名为 Roles 的函数，该函数接收任意数量的字符串参数并返回一个装饰器
export const Roles = (...roles: string[]) => 
    // 调用 SetMetadata 函数，将键 'roles' 和角色数组作为元数据设置在目标上
    SetMetadata('roles', roles);
```
### 1.8. auth.guard.ts
src/auth.guard.ts
```js
// 从 NestJS 的 common 包中导入 Injectable, CanActivate, ExecutionContext
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
// 从 NestJS 的 core 包中导入 Reflector
import { Reflector } from '@nestjs/core';
// 从 express 包中导入 Request
import { Request } from 'express';
// 使用 Injectable 装饰器标注 AuthGuard类，使其可以被注入到其他地方使用
@Injectable()
export class AuthGuard implements CanActivate {
    // 构造函数注入 Reflector
    constructor(private reflector: Reflector) { }
    // canActivate 方法用于决定是否允许某个请求通过
    canActivate(context: ExecutionContext): boolean {
        // 从处理程序的元数据中获取角色信息
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        // 如果没有角色信息，直接返回 true 允许通过
        if (!roles) {
            return true;
        }
        // 获取当前请求对象
        const request = context.switchToHttp().getRequest<Request>();
        // 从请求查询参数中获取用户角色
        const user = { roles: [request.query.role] };
        // 检查用户角色是否匹配所需角色
        return matchRoles(roles, user.roles);
    }
}
// matchRoles 函数用于检查用户角色是否匹配所需角色
function matchRoles(roles: string[], userRoles: string[]): boolean {
    // 如果用户的任何角色包含在所需角色中，则返回 true
    return userRoles.some(userRole => roles.includes(userRole));
}
```
### 1.9. index.ts
src/@nestjs/common/index.ts
```js
export * from './module.decorator'
export * from './controller.decorator';
export * from './http-methods.decorator';
export * from './param.decorator';
export * from './injectable.decorator';
export * from './inject.decorator';
export * from './constants';
export * from './request.method.enum';
export * from './middleware.interface';
export * from './nest-module.interface';
export * from './middleware-consumer.interface';
export * from './http-status.enum';
export * from './http-exception';
export * from './arguments-host.interface';
export * from './exception-filter.interface';
export * from './http-exception.filter';
export * from './catch.decorator';
export * from './use-filters.decorator';
export * from './pipe-transform.interface';
export * from './pipes';
export * from './argument-metadata.interface';
export * from './use-pipes.decorator';
+export * from './use-guards.decorator';
+export * from './can-activate.interface';
+export * from './execution-context.interface';
+export * from './set-metadata.decorator';
```
### 1.10. constants.ts
src/@nestjs/core/constants.ts
```js
export const APP_FILTER = 'APP_FILTER'
export const DECORATOR_FACTORY = 'DECORATOR_FACTORY';
export const APP_PIPE = 'APP_PIPE';
+export const FORBIDDEN_MESSAGE = 'Forbidden resource';
```
### 1.11. index.ts
src/@nestjs/core/index.ts
```js
export * from './nest-factory';
export * from './logger';
export * from './nest-application';
export * from './constants';
+export * from './reflector';
```
### 1.12. nest-application.ts
src/@nestjs/core/nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { PipeTransform, RequestMethod } from '@nestjs/common'
+import { APP_FILTER, DECORATOR_FACTORY, APP_PIPE, FORBIDDEN_MESSAGE } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
import { defineModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
+import { Reflector } from './reflector';
+import { CanActivate, ForbiddenException } from '@nestjs/common';
+import { ExecutionContext } from '@nestjs/common';
export class NestApplication {
    private readonly app: Express = express()
    private readonly providerInstances = new Map()
    private readonly globalProviders = new Set()
    private readonly moduleProviers = new Map()
    private readonly middlewares = []
    private readonly excludedRoutes = []
    private readonly defaultGlobalHttpExceptionFilter = new GlobalHttpExectionFilter()
    private readonly globalHttpExceptionFilters = []
    private readonly globalPipes: PipeTransform[] = [];
    constructor(protected readonly module) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }
    useGlobalFilters(...filters) {
        defineModule(this.module, filters.filter(filter => filter instanceof Function));
        this.globalHttpExceptionFilters.push(...filters);
    }
    exclude(...routeInfos): this {
        this.excludedRoutes.push(...routeInfos.map(this.normalizeRouteInfo));
        return this;
    }
    initMiddlewares() {
        this.module.prototype.configure?.(this);
    }
    apply(...middleware) {
        defineModule(this.module, middleware)
        this.middlewares.push(...middleware);
        return this;
    }
    getMiddelwareInstance(middleware) {
        if (middleware instanceof Function) {
            const dependencies = this.resolveDependencies(middleware);
            return new middleware(...dependencies);
        }
        return middleware;
    }
    isExcluded(reqPath: string, method: RequestMethod) {
        return this.excludedRoutes.some(routeInfo => {
            const { routePath, routeMethod } = routeInfo;
            return routePath === reqPath && (routeMethod === RequestMethod.ALL || routeMethod === method)
        });
    }
    forRoutes(...routes) {
        for (const route of routes) {
            for (const middleware of this.middlewares) {
                const { routePath, routeMethod } = this.normalizeRouteInfo(route);
                this.app.use(routePath, (req, res, next) => {
                    if (this.isExcluded(req.originalUrl, req.method)) {
                        return next();
                    }
                    if (routeMethod === RequestMethod.ALL || routeMethod === req.method) {
                        if ('use' in middleware.prototype || 'use' in middleware) {
                            const middlewareInstance = this.getMiddelwareInstance(middleware);
                            middlewareInstance.use(req, res, next);
                        } else if (middleware instanceof Function) {
                            middleware(req, res, next);
                        } else {
                            next();
                        }
                    } else {
                        next();
                    }
                });
            }
        }
        this.middlewares.length = 0;
        return this;
    }
    private normalizeRouteInfo(route) {
        let routePath = '';
        let routeMethod = RequestMethod.ALL;
        if (typeof route === 'string') {
            routePath = route;
        } else if ('path' in route) {
            routePath = route.path;
            routeMethod = route.method ?? RequestMethod.ALL;
        } else if (route instanceof Function) {
            routePath = Reflect.getMetadata('prefix', route);
        }
        routePath = path.posix.join('/', routePath);
        return { routePath, routeMethod }
    }
+   private addCoreProviders() {
+       this.addProvider(Reflector, this.module, true);
+   }
    async initProviders() {
+       this.addCoreProviders();
        const imports = Reflect.getMetadata('imports', this.module) ?? [];
        for (const importModule of imports) {
            let importedModule = importModule;
            if (importModule instanceof Promise) {
                importedModule = await importedModule;
            }
            if ('module' in importedModule) {
                const { module, providers, controllers, exports } = importedModule;
                const oldControllers = Reflect.getMetadata('controllers', module)
                const newControllers = [...(oldControllers ?? []), ...(controllers ?? [])];
                defineModule(module, newControllers);
                const oldProviders = Reflect.getMetadata('providers', module)
                const newProviders = [...(oldProviders ?? []), ...(providers ?? [])];
                defineModule(module, newProviders);
                const oldExports = Reflect.getMetadata('exports', module)
                const newExports = [...(oldExports ?? []), ...(exports ?? [])];
                Reflect.defineMetadata('controllers', newControllers, module)
                Reflect.defineMetadata('providers', newProviders, module)
                Reflect.defineMetadata('exports', newExports, module)
                this.registerProvidersFromModule(module, this.module);
            } else {
                this.registerProvidersFromModule(importedModule, this.module);
            }
        }
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        for (const provider of providers) {
            this.addProvider(provider, this.module);
        }
    }
    private registerProvidersFromModule(module, ...parentModules) {
        const global = Reflect.getMetadata('global', module);
        const importedProviders = Reflect.getMetadata('providers', module) ?? [];
        const exports = Reflect.getMetadata('exports', module) ?? [];
        for (const exportToken of exports) {
            if (this.isModule(exportToken)) {
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
        this.initController(module);
    }
    private isModule(exportToken) {
        return exportToken && exportToken instanceof Function && Reflect.getMetadata('isModule', exportToken);
    }
    addProvider(provider, module, global = false) {
        const providers = global ? this.globalProviders : (this.moduleProviers.get(module) || new Set());
        if (!global) {
            this.moduleProviers.set(module, providers);
        }
        const injectToken = provider.provide ?? provider;
        if (this.providerInstances.has(injectToken)) {
            if (!providers.has(injectToken)) {
                providers.add(injectToken);
            }
            return;
        }
        if (provider.provide && provider.useClass) {
            const Clazz = provider.useClass;
            const dependencies = this.resolveDependencies(Clazz);
            const value = new Clazz(...dependencies);
            this.providerInstances.set(provider.provide, value);
            providers.add(provider.provide);
        } else if (provider.provide && provider.useValue) {
            this.providerInstances.set(provider.provide, provider.useValue);
            providers.add(provider.provide);
        } else if (provider.provide && provider.useFactory) {
            const inject = provider.inject ?? [];
            const injectedValues = inject.map(injectToken => this.getProviderByToken(injectToken, module));
            const value = provider.useFactory(...injectedValues);
            this.providerInstances.set(provider.provide, value);
            providers.add(provider.provide);
        } else {
            const dependencies = this.resolveDependencies(provider);
            const value = new provider(...dependencies);
            this.providerInstances.set(provider, value);
            providers.add(provider);
        }
    }
    use(middleware) {
        this.app.use(middleware);
    }
    private getProviderByToken = (injectedToken, module) => {
        if (this.moduleProviers.get(module)?.has(injectedToken) || this.globalProviders.has(injectedToken)) {
            return this.providerInstances.get(injectedToken);
        } else {
            return null;
        }
    }
    private resolveDependencies(Clazz) {
        const injectedTokens = Reflect.getMetadata(INJECTED_TOKENS, Clazz) ?? [];
        const constructorParams = Reflect.getMetadata(DESIGN_PARAMTYPES, Clazz) ?? [];
        return constructorParams.map((param, index) => {
            const module = Reflect.getMetadata('module', Clazz);
            return this.getProviderByToken(injectedTokens[index] ?? param, module);
        });
    }
+   private getGuardInstance(guard: CanActivate | Function): CanActivate {
+       if (typeof guard === 'function') {
+           const dependencies = this.resolveDependencies(guard);
+           return new (guard as any)(...dependencies);
+       }
+       return guard as CanActivate;
+   }
+   private async callGuards(guards: CanActivate[], context: ExecutionContext) {
+       for (const guard of guards) {
+           const guardInstance = this.getGuardInstance(guard);
+           const canActivate = await guardInstance.canActivate(context);
+           if (!canActivate) {
+               throw new ForbiddenException(FORBIDDEN_MESSAGE);
+           }
+       }
+   }
    async initController(module) {
        const controllers = Reflect.getMetadata('controllers', module) || [];
        Logger.log(`AppModule dependencies initialized`, 'InstanceLoader');
        for (const Controller of controllers) {
            const dependencies = this.resolveDependencies(Controller);
            const controller = new Controller(...dependencies);
            const prefix = Reflect.getMetadata('prefix', Controller) || '/';
            Logger.log(`${Controller.name} {${prefix}}`, 'RoutesResolver');
            const controllerPrototype = Controller.prototype;
            const controllerFilters = Reflect.getMetadata('filters', Controller) ?? [];
            const controllerPipes = Reflect.getMetadata('pipes', Controller) || [];
+           const controllerGuards = Reflect.getMetadata('guards', Controller) || [];
            defineModule(this.module, controllerFilters);
            for (const methodName of Object.getOwnPropertyNames(controllerPrototype)) {
                const method = controllerPrototype[methodName];
                const httpMethod = Reflect.getMetadata('method', method);
                const pathMetadata = Reflect.getMetadata('path', method);
                const redirectUrl = Reflect.getMetadata('redirectUrl', method);
                const redirectStatusCode = Reflect.getMetadata('redirectStatusCode', method);
                const statusCode = Reflect.getMetadata('statusCode', method);
                const headers = Reflect.getMetadata('headers', method) ?? [];
                const methodFilters = Reflect.getMetadata('filters', method) ?? [];
                const methodPipes = Reflect.getMetadata('pipes', method) || [];
+               const methodGuards = Reflect.getMetadata('guards', method) || [];
                defineModule(this.module, methodFilters);
                const pipes = [...controllerPipes, ...methodPipes];
+               const guards = [...controllerGuards, ...methodGuards];
                if (!httpMethod) continue;
                const routePath = path.posix.join('/', prefix, pathMetadata)
                this.app[httpMethod.toLowerCase()](routePath, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
                    const host = {
                        switchToHttp: () => ({
                            getRequest: () => req,
                            getResponse: () => res,
                            getNext: () => next,
                        })
                    }
+                   const context: ExecutionContext = {
+                       ...host,
+                       getClass: () => Controller,
+                       getHandler: () => method,
+                   }
                    try {
+                       await this.callGuards(guards, context);
                        const args = await this.resolveParams(controller, methodName, req, res, next, host, pipes);
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
                        let a;
                        console.log(a.toString())
                    } catch (error) {
                        await this.callExceptionFilters(error, host, methodFilters, controllerFilters)
                    }
                })
                Logger.log(`Mapped {${routePath}, ${httpMethod}} route`, 'RoutesResolver');
            }
        }
        Logger.log(`Nest application successfully started`, 'NestApplication');
    }
    getFilterInstance(filter) {
        if (filter instanceof Function) {
            const dependencies = this.resolveDependencies(filter);
            console.log('dependencies', dependencies);
            return new filter(...dependencies);
        }
        return filter;
    }
    private callExceptionFilters(error, host, methodFilters, controllerFilters) {
        const allFilters = [...methodFilters, ...controllerFilters, ...this.globalHttpExceptionFilters, this.defaultGlobalHttpExceptionFilter];
        for (const filter of allFilters) {
            let filterInstance = this.getFilterInstance(filter);
            const exceptions = Reflect.getMetadata('catch', filterInstance.constructor) ?? [];
            if (exceptions.length === 0 || exceptions.some(exception => error instanceof exception)) {
                filterInstance.catch(error, host)
                break;
            }
        }
    }
    private getResponseMetadata(controller, methodName) {
        const paramsMetaData = Reflect.getMetadata(`params`, controller, methodName) ?? [];
        return paramsMetaData.filter(Boolean).find((param) =>
            param.key === 'Response' || param.key === 'Res' || param.key === 'Next');
    }
    private async resolveParams(instance: any, methodName: string, req: ExpressRequest, res: ExpressResponse, next: NextFunction, host, pipes: PipeTransform[]) {
        const paramsMetaData = Reflect.getMetadata(`params`, instance, methodName) ?? [];
        return Promise.all(paramsMetaData.map(async (paramMetaData) => {
            const { key, data, factory, pipes: paramPipes, metatype } = paramMetaData;
            let value;
            switch (key) {
                case "Request":
                case "Req":
                    value = req;
                    break;
                case "Query":
                    value = data ? req.query[data] : req.query;
                    break;
                case "Headers":
                    value = data ? req.headers[data] : req.headers;
                    break;
                case 'Session':
                    value = data ? req.session[data] : req.session;
                    break;
                case 'Ip':
                    value = req.ip;
                    break;
                case 'Param':
                    value = data ? req.params[data] : req.params;
                    break;
                case 'Body':
                    value = data ? req.body[data] : req.body;
                    break;
                case "Response":
                case "Res":
                    value = res;
                    break;
                case "Next":
                    value = next;
                    break;
                case DECORATOR_FACTORY:
                    value = factory(data, host);
                    break;
                default:
                    value = null;
                    break;
            }
            for (const pipe of [...this.globalPipes, ...pipes, ...paramPipes]) {
                const pipeInstance = this.getPipeInstance(pipe);
                const type = key === DECORATOR_FACTORY ? 'custom' : key.toLowerCase();
                value = await pipeInstance.transform(value, { type, data, metatype });
            }
            return value;
        }))
    }
    private getPipeInstance(pipe) {
        if (typeof pipe === 'function') {
            const dependencies = this.resolveDependencies(pipe);
            return new pipe(...dependencies);
        }
        return pipe;
    }
    async initGlobalFilters() {
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        for (const provider of providers) {
            if (provider.provide === APP_FILTER) {
                const providerInstance = this.getProviderByToken(APP_FILTER, this.module);
                this.useGlobalFilters(providerInstance)
            }
        }
    }
    useGlobalPipes(...pipes: PipeTransform[]): void {
        this.globalPipes.push(...pipes);
    }
    private initGlobalPipes() {
        const providers = Reflect.getMetadata('providers', this.module) || [];
        for (const provider of providers) {
            if (provider.provide === APP_PIPE) {
                const instance = this.getProviderByToken(APP_PIPE, this.module);
                this.useGlobalPipes(instance);
            }
        }
    }
    async listen(port) {
        await this.initProviders();
        await this.initMiddlewares();
        await this.initGlobalFilters();
        await this.initGlobalPipes();
        await this.initController(this.module);
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:3000`);
        });
    }
}
```
### 1.13. app.module.ts
src/app.module.ts
```js
import { Module, ValidationPipe } from "@nestjs/common";
import { AppController } from './app.controller';
import { APP_PIPE } from '@nestjs/core';
+import { AccountController } from './account.controller';
@Module({
+   controllers: [AppController, AccountController],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ValidationPipe,
        }
    ]
})
export class AppModule { }
```
## 2.createDecorator
+ Nest 提供了通过 Reflector#createDecorator 静态方法或内置的 @SetMetadata() 装饰器将自定义元数据附加到路由处理程序的能力。
+ 使用 Reflector#createDecorator 方法创建一个 @Roles() 装饰器，该装饰器将元数据附加到处理程序。Reflector 是由框架提供并从 @nestjs/core 包中导出的
### 2.1. roles2.decorator.ts
src/roles2.decorator.ts
```js
// 从 @nestjs/core 包中导入 Reflector 类
import { Reflector } from '@nestjs/core';
// 使用 Reflector 类的 createDecorator 方法创建一个新的装饰器 Roles2
// 该装饰器的泛型类型为 string[]，即该装饰器接受一个字符串数组作为参数
export const Roles2 = Reflector.createDecorator<string[]>();
2.2. roles2.guard.ts
src/roles2.guard.ts

// 从nestjs/common导入Injectable和CanActivate，以及ExecutionContext
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
// 从nestjs/core导入Reflector
import { Reflector } from '@nestjs/core';
// 导入自定义的Roles2装饰器
import { Roles2 } from './roles2.decorator';
// 导入express中的Request类型
import { Request } from 'express';
// 用@Injectable()装饰器标记RolesGuard2类，使其可以被依赖注入
@Injectable()
// 定义RolesGuard2类并实现CanActivate接口
export class RolesGuard2 implements CanActivate {
    // 构造函数，接收Reflector实例
    constructor(private reflector: Reflector) { }
    // 实现canActivate方法，用于路由守卫
    canActivate(context: ExecutionContext): boolean {
        // 获取处理程序上的Roles2元数据
        const roles: string[] = this.reflector.get(Roles2, context.getHandler());
        // 如果没有角色限制，则允许访问
        if (!roles) {
            return true;
        }
        // 获取当前请求对象
        const request = context.switchToHttp().getRequest<Request>();
        // 从请求查询参数中获取用户角色，并构造用户对象
        const user = { roles: [request.query.role] };
        // 检查用户角色是否匹配要求的角色
        return matchRoles(roles, user.roles);
    }
}
// 定义辅助函数matchRoles，用于检查用户角色是否匹配
function matchRoles(roles: string[], userRoles: string[]): boolean {
    // 检查用户角色数组中是否包含至少一个要求的角色
    return userRoles.some(userRole => roles.includes(userRole));
}
```
### 2.3. reflector.ts
src/@nestjs/core/reflector.ts
```js
// 导入 'reflect-metadata' 库
import 'reflect-metadata';
// 从 '@nestjs/common' 中导入 SetMetadata 函数
+import { SetMetadata } from '@nestjs/common';
// 定义 Reflector 类
export class Reflector {
    // 定义 get 方法，用于获取元数据
    get<T extends any>(metadataKey: any, target: any, key?: string): T {
        // 如果 key 存在，从 target 的 key 上获取元数据，否则从 target 上获取元数据
        return key
            ? Reflect.getMetadata(metadataKey, target, key)
            : Reflect.getMetadata(metadataKey, target);
    }

+   // 静态方法 createDecorator，用于创建装饰器
+   static createDecorator<T = any>() {
+       // 定义装饰器函数
+       function decoratorFn(metadataValue: T) {
+           // 返回装饰器函数
+           return (target: object, key?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
+               // 使用 SetMetadata 设置元数据
+               SetMetadata(decoratorFn, metadataValue)(target, key, descriptor);
+           };
+       }
+       // 返回装饰器函数
+       return decoratorFn;
+   }
}
```
### 2.4. account.controller.ts
src/account.controller.ts
```js
import { Controller, Get, UseGuards } from "@nestjs/common";
+import { RolesGuard2 } from "./roles2.guard";
+import { Roles2 } from "./roles2.decorator";
@Controller('accounts')
export class AccountController {
    @Get()
+   @UseGuards(RolesGuard2)
+   @Roles2(['admin'])
    async index() {
        return 'This action returns all accounts';
    }
}
```
## 3.useGlobalGuards
为了设置全局守卫，可以使用 Nest 应用程序实例的 useGlobalGuards() 方法
### 3.1. constants.ts
src/@nestjs/core/constants.ts
```js
export const APP_FILTER = 'APP_FILTER'
export const DECORATOR_FACTORY = 'DECORATOR_FACTORY';
export const APP_PIPE = 'APP_PIPE';
export const FORBIDDEN_MESSAGE = 'Forbidden resource';
+export const APP_GUARD = 'APP_GUARD';
```
### 3.2. nest-application.ts
src/@nestjs/core/nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { PipeTransform, RequestMethod } from '@nestjs/common'
+import { APP_FILTER, DECORATOR_FACTORY, APP_PIPE, FORBIDDEN_MESSAGE, APP_GUARD } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
import { defineModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
import { Reflector } from './reflector';
import { CanActivate, ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
export class NestApplication {
    private readonly app: Express = express()
    private readonly providerInstances = new Map()
    private readonly globalProviders = new Set()
    private readonly moduleProviers = new Map()
    private readonly middlewares = []
    private readonly excludedRoutes = []
    private readonly defaultGlobalHttpExceptionFilter = new GlobalHttpExectionFilter()
    private readonly globalHttpExceptionFilters = []
    private readonly globalPipes: PipeTransform[] = [];
+   private readonly globalGuards: CanActivate[] = [];
    constructor(protected readonly module) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }
    useGlobalFilters(...filters) {
        defineModule(this.module, filters.filter(filter => filter instanceof Function));
        this.globalHttpExceptionFilters.push(...filters);
    }
    exclude(...routeInfos): this {
        this.excludedRoutes.push(...routeInfos.map(this.normalizeRouteInfo));
        return this;
    }
    initMiddlewares() {
        this.module.prototype.configure?.(this);
    }
    apply(...middleware) {
        defineModule(this.module, middleware)
        this.middlewares.push(...middleware);
        return this;
    }
    getMiddelwareInstance(middleware) {
        if (middleware instanceof Function) {
            const dependencies = this.resolveDependencies(middleware);
            return new middleware(...dependencies);
        }
        return middleware;
    }
    isExcluded(reqPath: string, method: RequestMethod) {
        return this.excludedRoutes.some(routeInfo => {
            const { routePath, routeMethod } = routeInfo;
            return routePath === reqPath && (routeMethod === RequestMethod.ALL || routeMethod === method)
        });
    }
    forRoutes(...routes) {
        for (const route of routes) {
            for (const middleware of this.middlewares) {
                const { routePath, routeMethod } = this.normalizeRouteInfo(route);
                this.app.use(routePath, (req, res, next) => {
                    if (this.isExcluded(req.originalUrl, req.method)) {
                        return next();
                    }
                    if (routeMethod === RequestMethod.ALL || routeMethod === req.method) {
                        if ('use' in middleware.prototype || 'use' in middleware) {
                            const middlewareInstance = this.getMiddelwareInstance(middleware);
                            middlewareInstance.use(req, res, next);
                        } else if (middleware instanceof Function) {
                            middleware(req, res, next);
                        } else {
                            next();
                        }
                    } else {
                        next();
                    }
                });
            }
        }
        this.middlewares.length = 0;
        return this;
    }
    private normalizeRouteInfo(route) {
        let routePath = '';
        let routeMethod = RequestMethod.ALL;
        if (typeof route === 'string') {
            routePath = route;
        } else if ('path' in route) {
            routePath = route.path;
            routeMethod = route.method ?? RequestMethod.ALL;
        } else if (route instanceof Function) {
            routePath = Reflect.getMetadata('prefix', route);
        }
        routePath = path.posix.join('/', routePath);
        return { routePath, routeMethod }
    }
    private addCoreProviders() {
        this.addProvider(Reflector, this.module, true);
    }
    async initProviders() {
        this.addCoreProviders();
        const imports = Reflect.getMetadata('imports', this.module) ?? [];
        for (const importModule of imports) {
            let importedModule = importModule;
            if (importModule instanceof Promise) {
                importedModule = await importedModule;
            }
            if ('module' in importedModule) {
                const { module, providers, controllers, exports } = importedModule;
                const oldControllers = Reflect.getMetadata('controllers', module)
                const newControllers = [...(oldControllers ?? []), ...(controllers ?? [])];
                defineModule(module, newControllers);
                const oldProviders = Reflect.getMetadata('providers', module)
                const newProviders = [...(oldProviders ?? []), ...(providers ?? [])];
                defineModule(module, newProviders);
                const oldExports = Reflect.getMetadata('exports', module)
                const newExports = [...(oldExports ?? []), ...(exports ?? [])];
                Reflect.defineMetadata('controllers', newControllers, module)
                Reflect.defineMetadata('providers', newProviders, module)
                Reflect.defineMetadata('exports', newExports, module)
                this.registerProvidersFromModule(module, this.module);
            } else {
                this.registerProvidersFromModule(importedModule, this.module);
            }
        }
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        for (const provider of providers) {
            this.addProvider(provider, this.module);
        }
    }
    private registerProvidersFromModule(module, ...parentModules) {
        const global = Reflect.getMetadata('global', module);
        const importedProviders = Reflect.getMetadata('providers', module) ?? [];
        const exports = Reflect.getMetadata('exports', module) ?? [];
        for (const exportToken of exports) {
            if (this.isModule(exportToken)) {
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
        this.initController(module);
    }
    private isModule(exportToken) {
        return exportToken && exportToken instanceof Function && Reflect.getMetadata('isModule', exportToken);
    }
    addProvider(provider, module, global = false) {
        const providers = global ? this.globalProviders : (this.moduleProviers.get(module) || new Set());
        if (!global) {
            this.moduleProviers.set(module, providers);
        }
        const injectToken = provider.provide ?? provider;
        if (this.providerInstances.has(injectToken)) {
            if (!providers.has(injectToken)) {
                providers.add(injectToken);
            }
            return;
        }
        if (provider.provide && provider.useClass) {
            const Clazz = provider.useClass;
            const dependencies = this.resolveDependencies(Clazz);
            const value = new Clazz(...dependencies);
            this.providerInstances.set(provider.provide, value);
            providers.add(provider.provide);
        } else if (provider.provide && provider.useValue) {
            this.providerInstances.set(provider.provide, provider.useValue);
            providers.add(provider.provide);
        } else if (provider.provide && provider.useFactory) {
            const inject = provider.inject ?? [];
            const injectedValues = inject.map(injectToken => this.getProviderByToken(injectToken, module));
            const value = provider.useFactory(...injectedValues);
            this.providerInstances.set(provider.provide, value);
            providers.add(provider.provide);
        } else {
            const dependencies = this.resolveDependencies(provider);
            const value = new provider(...dependencies);
            this.providerInstances.set(provider, value);
            providers.add(provider);
        }
    }
    use(middleware) {
        this.app.use(middleware);
    }
    private getProviderByToken = (injectedToken, module) => {
        if (this.moduleProviers.get(module)?.has(injectedToken) || this.globalProviders.has(injectedToken)) {
            return this.providerInstances.get(injectedToken);
        } else {
            return null;
        }
    }
    private resolveDependencies(Clazz) {
        const injectedTokens = Reflect.getMetadata(INJECTED_TOKENS, Clazz) ?? [];
        const constructorParams = Reflect.getMetadata(DESIGN_PARAMTYPES, Clazz) ?? [];
        return constructorParams.map((param, index) => {
            const module = Reflect.getMetadata('module', Clazz);
            return this.getProviderByToken(injectedTokens[index] ?? param, module);
        });
    }
    private getGuardInstance(guard: CanActivate | Function): CanActivate {
        if (typeof guard === 'function') {
            const dependencies = this.resolveDependencies(guard);
            return new (guard as any)(...dependencies);
        }
        return guard as CanActivate;
    }
    private async callGuards(guards: CanActivate[], context: ExecutionContext) {
        for (const guard of guards) {
            const guardInstance = this.getGuardInstance(guard);
            const canActivate = await guardInstance.canActivate(context);
            if (!canActivate) {
                throw new ForbiddenException(FORBIDDEN_MESSAGE);
            }
        }
    }
    async initController(module) {
        const controllers = Reflect.getMetadata('controllers', module) || [];
        Logger.log(`AppModule dependencies initialized`, 'InstanceLoader');
        for (const Controller of controllers) {
            const dependencies = this.resolveDependencies(Controller);
            const controller = new Controller(...dependencies);
            const prefix = Reflect.getMetadata('prefix', Controller) || '/';
            Logger.log(`${Controller.name} {${prefix}}`, 'RoutesResolver');
            const controllerPrototype = Controller.prototype;
            const controllerFilters = Reflect.getMetadata('filters', Controller) ?? [];
            const controllerPipes = Reflect.getMetadata('pipes', Controller) || [];
            const controllerGuards = Reflect.getMetadata('guards', Controller) || [];
            defineModule(this.module, controllerFilters);
            for (const methodName of Object.getOwnPropertyNames(controllerPrototype)) {
                const method = controllerPrototype[methodName];
                const httpMethod = Reflect.getMetadata('method', method);
                const pathMetadata = Reflect.getMetadata('path', method);
                const redirectUrl = Reflect.getMetadata('redirectUrl', method);
                const redirectStatusCode = Reflect.getMetadata('redirectStatusCode', method);
                const statusCode = Reflect.getMetadata('statusCode', method);
                const headers = Reflect.getMetadata('headers', method) ?? [];
                const methodFilters = Reflect.getMetadata('filters', method) ?? [];
                const methodPipes = Reflect.getMetadata('pipes', method) || [];
                const methodGuards = Reflect.getMetadata('guards', method) || [];
                defineModule(this.module, methodFilters);
                const pipes = [...controllerPipes, ...methodPipes];
+               const guards = [...this.globalGuards, ...controllerGuards, ...methodGuards];
                if (!httpMethod) continue;
                const routePath = path.posix.join('/', prefix, pathMetadata)
                this.app[httpMethod.toLowerCase()](routePath, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
                    const host = {
                        switchToHttp: () => ({
                            getRequest: () => req,
                            getResponse: () => res,
                            getNext: () => next,
                        })
                    }
                    const context: ExecutionContext = {
                        ...host,
                        getClass: () => Controller,
                        getHandler: () => method,
                    }
                    try {
                        await this.callGuards(guards, context);
                        const args = await this.resolveParams(controller, methodName, req, res, next, host, pipes);
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
                        let a;
                        console.log(a.toString())
                    } catch (error) {
                        await this.callExceptionFilters(error, host, methodFilters, controllerFilters)
                    }
                })
                Logger.log(`Mapped {${routePath}, ${httpMethod}} route`, 'RoutesResolver');
            }
        }
        Logger.log(`Nest application successfully started`, 'NestApplication');
    }
    getFilterInstance(filter) {
        if (filter instanceof Function) {
            const dependencies = this.resolveDependencies(filter);
            console.log('dependencies', dependencies);
            return new filter(...dependencies);
        }
        return filter;
    }
    private callExceptionFilters(error, host, methodFilters, controllerFilters) {
        const allFilters = [...methodFilters, ...controllerFilters, ...this.globalHttpExceptionFilters, this.defaultGlobalHttpExceptionFilter];
        for (const filter of allFilters) {
            let filterInstance = this.getFilterInstance(filter);
            const exceptions = Reflect.getMetadata('catch', filterInstance.constructor) ?? [];
            if (exceptions.length === 0 || exceptions.some(exception => error instanceof exception)) {
                filterInstance.catch(error, host)
                break;
            }
        }
    }
    private getResponseMetadata(controller, methodName) {
        const paramsMetaData = Reflect.getMetadata(`params`, controller, methodName) ?? [];
        return paramsMetaData.filter(Boolean).find((param) =>
            param.key === 'Response' || param.key === 'Res' || param.key === 'Next');
    }
    private async resolveParams(instance: any, methodName: string, req: ExpressRequest, res: ExpressResponse, next: NextFunction, host, pipes: PipeTransform[]) {
        const paramsMetaData = Reflect.getMetadata(`params`, instance, methodName) ?? [];
        return Promise.all(paramsMetaData.map(async (paramMetaData) => {
            const { key, data, factory, pipes: paramPipes, metatype } = paramMetaData;
            let value;
            switch (key) {
                case "Request":
                case "Req":
                    value = req;
                    break;
                case "Query":
                    value = data ? req.query[data] : req.query;
                    break;
                case "Headers":
                    value = data ? req.headers[data] : req.headers;
                    break;
                case 'Session':
                    value = data ? req.session[data] : req.session;
                    break;
                case 'Ip':
                    value = req.ip;
                    break;
                case 'Param':
                    value = data ? req.params[data] : req.params;
                    break;
                case 'Body':
                    value = data ? req.body[data] : req.body;
                    break;
                case "Response":
                case "Res":
                    value = res;
                    break;
                case "Next":
                    value = next;
                    break;
                case DECORATOR_FACTORY:
                    value = factory(data, host);
                    break;
                default:
                    value = null;
                    break;
            }
            for (const pipe of [...this.globalPipes, ...pipes, ...paramPipes]) {
                const pipeInstance = this.getPipeInstance(pipe);
                const type = key === DECORATOR_FACTORY ? 'custom' : key.toLowerCase();
                value = await pipeInstance.transform(value, { type, data, metatype });
            }
            return value;
        }))
    }
    private getPipeInstance(pipe) {
        if (typeof pipe === 'function') {
            const dependencies = this.resolveDependencies(pipe);
            return new pipe(...dependencies);
        }
        return pipe;
    }
    async initGlobalFilters() {
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        for (const provider of providers) {
            if (provider.provide === APP_FILTER) {
                const providerInstance = this.getProviderByToken(APP_FILTER, this.module);
                this.useGlobalFilters(providerInstance)
            }
        }
    }
    useGlobalPipes(...pipes: PipeTransform[]): void {
        this.globalPipes.push(...pipes);
    }
    private initGlobalPipes() {
        const providers = Reflect.getMetadata('providers', this.module) || [];
        for (const provider of providers) {
            if (provider.provide === APP_PIPE) {
                const instance = this.getProviderByToken(APP_PIPE, this.module);
                this.useGlobalPipes(instance);
            }
        }
    }
+   private initGlobalGuards() {
+       const providers = Reflect.getMetadata('providers', this.module) || [];
+       for (const provider of providers) {
+           if (provider.provide === APP_GUARD) {
+               const instance = this.getProviderByToken(APP_GUARD, this.module);
+               this.useGlobalGuards(instance);
+           }
+       }
+   }
+   useGlobalGuards(...guards: CanActivate[]): void {
+       this.globalGuards.push(...guards);
+   }
    async listen(port) {
        await this.initProviders();
        await this.initMiddlewares();
        await this.initGlobalFilters();
        await this.initGlobalPipes();
+       await this.initGlobalGuards();
        await this.initController(this.module);
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:3000`);
        });
    }
}
```
### 3.3. app.module.ts
src/app.module.ts
```js
import { Module, ValidationPipe } from "@nestjs/common";
import { AppController } from './app.controller';
import { AccountController } from './account.controller';
+import { APP_PIPE, APP_GUARD } from '@nestjs/core';
+import { AuthGuard } from './auth.guard';
@Module({
    controllers: [AppController, AccountController],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ValidationPipe,
+       },
+       {
+           provide: APP_GUARD,
+           useClass: AuthGuard,
+       },
    ]
})
export class AppModule { }
```
### 3.4. main.ts
src/main.ts
```js
import { NestFactory } from "@nestjs/core";
import { AppModule } from './app.module';
+//import { AuthGuard} from './auth.guard';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
+   //app.useGlobalGuards(new AuthGuard());
    await app.listen(3000);
}
bootstrap();
```
