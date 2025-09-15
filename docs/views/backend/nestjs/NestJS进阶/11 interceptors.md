## 1. Interceptors
+ 拦截器是一个用 @Injectable() 装饰器注释的类，它实现了 NestInterceptor 接口。
+ 拦截器具有一组有用的功能，这些功能灵感来源于面向方面编程（AOP）技术。它们使得以下操+ 作成为可能：
    + 在方法执行之前/之后绑定额外的逻辑
    + 转换从函数返回的结果
    + 转换从函数抛出的异常
    + 扩展基本的函数行为
    + 根据特定条件完全覆盖一个函数（例如，用于缓存目的）
### 1.1. logging1.interceptor.ts
src/logging1.interceptor.ts
```js
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
@Injectable()
export class Logging1Interceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        console.log('Before1...');
        const now = Date.now();
        return next
            .handle()
            .pipe(
                tap(() => console.log(`After1... ${Date.now() - now}ms`)),
            );
    }
}
```
### 1.2. logging2.interceptor.ts
src/logging2.interceptor.ts
```js
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
@Injectable()
export class Logging2Interceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        console.log('Before2...');
        const now = Date.now();
        return next
            .handle()
            .pipe(
                tap(() => console.log(`After2... ${Date.now() - now}ms`)),
            );
    }
}
```
### 1.3. pay.controller.ts
src/pay.controller.ts
```js
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { Logging1Interceptor } from './logging1.interceptor';
import { Logging2Interceptor } from './logging2.interceptor';
@Controller('pay')
@UseInterceptors(Logging1Interceptor)
@UseInterceptors(Logging2Interceptor)
export class PayController {
    @Get()
    async pay() {
        console.log('pay...');
        return 'pay';
    }
}
/**
  Before2...
  Before1...
  pay...
  After1... 3ms
  After2... 9ms
 */
```
### 1.4. app.module.ts
src/app.module.ts
```js
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
+import { PayController } from './pay.controller';
@Module({
+   controllers: [PayController],
    providers: []
})
export class AppModule { }
```
## 2. UseInterceptors
### 2.1. nest-interceptor.interface.ts
src/@nestjs/common/nest-interceptor.interface.ts
```js
import { ExecutionContext } from './execution-context.interface';
export interface NestInterceptor<T = any, R = any> {
  intercept(context: ExecutionContext, next);
}
```
### 2.2. use-interceptors.decorator.ts
src/@nestjs/common/use-interceptors.decorator.ts
```js
import 'reflect-metadata';
export function UseInterceptors(...interceptors): MethodDecorator & ClassDecorator {
  return (target: object | Function, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
    if (descriptor) {
      const existingInterceptors = Reflect.getMetadata('interceptors', descriptor.value) || [];
      Reflect.defineMetadata('interceptors', [...existingInterceptors, ...interceptors], descriptor.value);
    } else {
      const existingInterceptors = Reflect.getMetadata('interceptors', target) || [];
      Reflect.defineMetadata('interceptors', [...existingInterceptors, ...interceptors], target);
    }
  };
}
```
### 2.3. index.ts
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
export * from './use-guards.decorator';
export * from './execution-context.interface';
export * from './can-activate.interface';
export * from './set-metadata.decorator';
+export * from './nest-interceptor.interface';
+export * from './use-interceptors.decorator';
```
### 2.4. nest-application.ts
src/@nestjs/core/nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
+import { ForbiddenException, NestInterceptor, RequestMethod } from '@nestjs/common'
import { APP_FILTER, DECORATOR_FACTORY, APP_PIPE, FORBODDEN_RESOURCE, APP_GUARD } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
import { defineModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
import { PipeTransform } from '@nestjs/common';
import { ExecutionContext } from '../common';
import { CanActivate } from '@nestjs/common';
import { Reflector } from './reflector';
+import { Observable, from, of, mergeMap } from 'rxjs';
export class NestApplication {
    private readonly app: Express = express()
    private readonly providerInstances = new Map()
    private readonly globalProviders = new Set()
    private readonly moduleProviers = new Map()
    private readonly middlewares = []
    private readonly excludedRoutes = []
    private readonly defaultGlobalHttpExceptionFilter = new GlobalHttpExectionFilter()
    private readonly globalHttpExceptionFilters = []
    private readonly globalPipes: PipeTransform[] = []
    private readonly globalGuards = []
    constructor(protected readonly module) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }
    useGlobalPipes(...pipes: PipeTransform[]) {
        this.globalPipes.push(...pipes);
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
    private addDefaultProviders() {
        this.addProvider(Reflector, this.module, true);
    }
    async initProviders() {
        this.addDefaultProviders();
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
    private getGuardInstance(guard) {
        if (typeof guard === 'function') {
            const dependencies = this.resolveDependencies(guard);
            return new guard(...dependencies);
        }
        return guard;
    }
    async callGuards(guards: CanActivate[], context: ExecutionContext) {
        for (const guard of guards) {
            const guardInstance = this.getGuardInstance(guard);
            const canActivate = await guardInstance.canActivate(context);
            if (!canActivate) {
                throw new ForbiddenException(FORBODDEN_RESOURCE);
            }
        }
    }
+   private getInterceptorInstance(interceptor: NestInterceptor | Function): NestInterceptor {
+       if (typeof interceptor === 'function') {
+           const dependencies = this.resolveDependencies(interceptor);
+           return new (interceptor as any)(...dependencies);
+       }
+       return interceptor as NestInterceptor;
+   }
+   private callInterceptors(controller, method, args, interceptors: NestInterceptor[], context: ExecutionContext): Observable<any> {
+       const nextFn = (i = 0): Observable<any> => {
+           if (i >= interceptors.length) {
+               const result = method.call(controller, ...args);
+               return result instanceof Promise ? from(result) : of(result);
+           }
+           const handler = {
+               handle: () => nextFn(i + 1),
+           };
+           const interceptorInstance = this.getInterceptorInstance(interceptors[i]);
+           const result = interceptorInstance.intercept(context, handler);
+           return from(result).pipe(mergeMap(res => res instanceof Observable ? res : of(res)));
+       };
+       return nextFn();
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
            const controllerPipes = Reflect.getMetadata('pipes', Controller) ?? [];
            const controllerGuards = Reflect.getMetadata('guards', Controller) ?? [];
+           const controllerInterceptors = Reflect.getMetadata('interceptors', Controller) || [];
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
                const methodPipes = Reflect.getMetadata('pipes', method) ?? [];
                const methodGuards = Reflect.getMetadata('guards', method) ?? [];
+               const methodInterceptors = Reflect.getMetadata('interceptors', method) || [];
                const pipes = [...controllerPipes, ...methodPipes];
                const guards = [...this.globalGuards, ...controllerGuards, ...methodGuards];
+               const interceptors = [...controllerInterceptors, ...methodInterceptors];
                defineModule(this.module, methodFilters);
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
                        getHandler: () => method
                    }
                    try {
                        await this.callGuards(guards, context);
                        const args = await this.resolveParams(controller, methodName, req, res, next, host, pipes);
+                       this.callInterceptors(controller, method, args, interceptors, context).subscribe((result) => {
+                           if (result?.url) {
+                               return res.redirect(result.statusCode || 302, result.url);
+                           }
+                           if (redirectUrl) {
+                               return res.redirect(redirectStatusCode || 302, redirectUrl);
+                           }
+                           if (statusCode) {
+                               res.statusCode = statusCode;
+                           } else if (httpMethod === 'POST') {
+                               res.statusCode = 201;
+                           }
+                           const responseMetadata = this.getResponseMetadata(controller, methodName);
+                           if (!responseMetadata || (responseMetadata?.data?.passthrough)) {
+                               headers.forEach(({ name, value }) => {
+                                   res.setHeader(name, value);
+                               });
+                               res.send(result);
+                           }
+                       })
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
    private initGlobalPipes() {
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        for (const provider of providers) {
            if (provider.provide === APP_PIPE) {
                const providerInstance = this.getProviderByToken(APP_PIPE, this.module);
                this.useGlobalPipes(providerInstance)
            }
        }
    }
    initGlobalGuards() {
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        for (const provider of providers) {
            if (provider.provide === APP_GUARD) {
                const providerInstance = this.getProviderByToken(APP_GUARD, this.module);
                this.useGlobalGuards(providerInstance)
            }
        }
    }
    useGlobalGuards(...guards) {
        this.globalGuards.push(...guards);
    }
    async listen(port) {
        await this.initProviders();
        await this.initMiddlewares();
        await this.initGlobalFilters();
        await this.initGlobalPipes();
        await this.initGlobalGuards();
        await this.initController(this.module);
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:${port}`, 'NestApplication');
        });
    }
}
```
### 2.5. logger1.interceptor.ts
src/logger1.interceptor.ts
```js
+import { ExecutionContext, NestInterceptor } from "@nestjs/common";
import { tap } from 'rxjs/operators'
export class Logging1Interceptor implements NestInterceptor {
+   async intercept(context: ExecutionContext, next) {
        console.log('Before1...')
        const now = Date.now();
        return next.handle().pipe(tap(() => {
            console.log(`After1... ${Date.now() - now}ms`)
        }));
    }
}
```
### 2.6. logger2.interceptor.ts
src/logger2.interceptor.ts
```js
+import { ExecutionContext, NestInterceptor } from "@nestjs/common";
import { tap } from 'rxjs/operators'
export class Logging2Interceptor implements NestInterceptor {
+   async intercept(context: ExecutionContext, next) {
        console.log('Before2...')
        const now = Date.now();
        return next.handle().pipe(tap(() => {
            console.log(`After2... ${Date.now() - now}ms`)
        }));
    }
}
```
## 3. useGlobalInterceptors
+ 为了设置全局拦截器，我们使用 Nest 应用程序实例的 useGlobalInterceptors() 方法
### 3.1. logger3.interceptor.ts
src/logger3.interceptor.ts
```js
import { ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators'
export class Logging3Interceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next): Observable<any> {
        console.log('Before3...')
        const now = Date.now();
        return next.handle().pipe(tap(() => {
            console.log(`After3... ${Date.now() - now}ms`)
        }));
    }
}
```
### 3.2. logger4.interceptor.ts
src/logger4.interceptor.ts
```js
import { ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators'
export class Logging4Interceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next): Observable<any> {
        console.log('Before4...')
        const now = Date.now();
        return next.handle().pipe(tap(() => {
            console.log(`After4... ${Date.now() - now}ms`)
        }));
    }
}
```
### 3.3. logger5.interceptor.ts
src/logger5.interceptor.ts
```js
import { ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators'
export class Logging5Interceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next): Observable<any> {
        console.log('Before5...')
        const now = Date.now();
        return next.handle().pipe(tap(() => {
            console.log(`After5... ${Date.now() - now}ms`)
        }));
    }
}
```
### 3.4. logger6.interceptor.ts
src/logger6.interceptor.ts
```js
import { ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators'
export class Logging6Interceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next): Observable<any> {
        console.log('Before6...')
        const now = Date.now();
        return next.handle().pipe(tap(() => {
            console.log(`After6... ${Date.now() - now}ms`)
        }));
    }
}
```
### 3.5. nest-application.ts
src/@nestjs/core/nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { ForbiddenException, NestInterceptor, RequestMethod } from '@nestjs/common'
import { APP_FILTER, DECORATOR_FACTORY, APP_PIPE, FORBODDEN_RESOURCE, APP_GUARD } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
import { defineModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
import { PipeTransform } from '@nestjs/common';
import { ExecutionContext } from '../common';
import { CanActivate } from '@nestjs/common';
import { Reflector } from './reflector';
import { Observable, from, of, mergeMap } from 'rxjs';
export class NestApplication {
    private readonly app: Express = express()
    private readonly providerInstances = new Map()
    private readonly globalProviders = new Set()
    private readonly moduleProviers = new Map()
    private readonly middlewares = []
    private readonly excludedRoutes = []
    private readonly defaultGlobalHttpExceptionFilter = new GlobalHttpExectionFilter()
    private readonly globalHttpExceptionFilters = []
    private readonly globalPipes: PipeTransform[] = []
    private readonly globalGuards = []
+   private readonly globalInterceptors: NestInterceptor[] = [];
    constructor(protected readonly module) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }
    useGlobalPipes(...pipes: PipeTransform[]) {
        this.globalPipes.push(...pipes);
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
    private addDefaultProviders() {
        this.addProvider(Reflector, this.module, true);
    }
    async initProviders() {
        this.addDefaultProviders();
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
    private getGuardInstance(guard) {
        if (typeof guard === 'function') {
            const dependencies = this.resolveDependencies(guard);
            return new guard(...dependencies);
        }
        return guard;
    }
    async callGuards(guards: CanActivate[], context: ExecutionContext) {
        for (const guard of guards) {
            const guardInstance = this.getGuardInstance(guard);
            const canActivate = await guardInstance.canActivate(context);
            if (!canActivate) {
                throw new ForbiddenException(FORBODDEN_RESOURCE);
            }
        }
    }
    private getInterceptorInstance(interceptor: NestInterceptor | Function): NestInterceptor {
        if (typeof interceptor === 'function') {
            const dependencies = this.resolveDependencies(interceptor);
            return new (interceptor as any)(...dependencies);
        }
        return interceptor as NestInterceptor;
    }
    private callInterceptors(controller, method, args, interceptors: NestInterceptor[], context: ExecutionContext): Observable<any> {
        const nextFn = (i = 0): Observable<any> => {
            if (i >= interceptors.length) {
                const result = method.call(controller, ...args);
                return result instanceof Promise ? from(result) : of(result);
            }
            const handler = {
                handle: () => nextFn(i + 1),
            };
            const interceptorInstance = this.getInterceptorInstance(interceptors[i]);
            const result = interceptorInstance.intercept(context, handler);
            return from(result).pipe(mergeMap(res => res instanceof Observable ? res : of(res)));
        };
        return nextFn();
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
            const controllerPipes = Reflect.getMetadata('pipes', Controller) ?? [];
            const controllerGuards = Reflect.getMetadata('guards', Controller) ?? [];
            const controllerInterceptors = Reflect.getMetadata('interceptors', Controller) || [];
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
                const methodPipes = Reflect.getMetadata('pipes', method) ?? [];
                const methodGuards = Reflect.getMetadata('guards', method) ?? [];
                const methodInterceptors = Reflect.getMetadata('interceptors', method) || [];
                const pipes = [...controllerPipes, ...methodPipes];
                const guards = [...this.globalGuards, ...controllerGuards, ...methodGuards];
+               const interceptors = [...this.globalInterceptors, ...controllerInterceptors, ...methodInterceptors];
                defineModule(this.module, methodFilters);
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
                        getHandler: () => method
                    }
                    try {
                        await this.callGuards(guards, context);
                        const args = await this.resolveParams(controller, methodName, req, res, next, host, pipes);
                        this.callInterceptors(controller, method, args, interceptors, context).subscribe((result) => {
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
    private initGlobalPipes() {
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        for (const provider of providers) {
            if (provider.provide === APP_PIPE) {
                const providerInstance = this.getProviderByToken(APP_PIPE, this.module);
                this.useGlobalPipes(providerInstance)
            }
        }
    }
    initGlobalGuards() {
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        for (const provider of providers) {
            if (provider.provide === APP_GUARD) {
                const providerInstance = this.getProviderByToken(APP_GUARD, this.module);
                this.useGlobalGuards(providerInstance)
            }
        }
    }
    useGlobalGuards(...guards) {
        this.globalGuards.push(...guards);
    }
+   useGlobalInterceptors(...interceptors: NestInterceptor[]): void {
+       this.globalInterceptors.push(...interceptors);
+   }
    async listen(port) {
        await this.initProviders();
        await this.initMiddlewares();
        await this.initGlobalFilters();
        await this.initGlobalPipes();
        await this.initGlobalGuards();
        await this.initController(this.module);
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:${port}`, 'NestApplication');
        });
    }
}
```
### 3.6. main.ts
src/main.ts
```js
import { NestFactory } from "@nestjs/core";
import { AppModule } from './app.module';
+import { Logging6Interceptor } from "./logger6.interceptor";
+import { Logging5Interceptor } from "./logger5.interceptor";
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
+   app.useGlobalInterceptors(new Logging6Interceptor());
+   app.useGlobalInterceptors(new Logging5Interceptor());
    await app.listen(3000);
}
bootstrap();
```
### 3.7. pay.controller.ts
src/pay.controller.ts
```js
import { Get, Controller, UseInterceptors } from "@nestjs/common";
import { Logging1Interceptor } from "./logger1.interceptor";
import { Logging2Interceptor } from "./logger2.interceptor";
+import { Logging3Interceptor } from "./logger3.interceptor";
+import { Logging4Interceptor } from "./logger4.interceptor";
@Controller('pay')
+@UseInterceptors(Logging3Interceptor)
+@UseInterceptors(Logging4Interceptor)
export class PayController {
    @Get()
    @UseInterceptors(Logging1Interceptor)
    @UseInterceptors(Logging2Interceptor)
    async pay() {
        console.log('pay...');
        return 'pay'
    }
}
```
## 4. APP_INTERCEPTOR
### 4.1. constants.ts
src/@nestjs/core/constants.ts
```js
export const APP_FILTER = 'APP_FILTER';
export const DECORATOR_FACTORY = 'DECORATOR_FACTORY';
export const APP_PIPE = 'APP_PIPE';
export const FORBODDEN_RESOURCE = "Forbidden resource";
export const APP_GUARD = 'APP_GUARD';
+export const APP_INTERCEPTOR = 'APP_INTERCEPTOR';
```
### 4.2. nest-application.ts
src/@nestjs/core/nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { ForbiddenException, NestInterceptor, RequestMethod } from '@nestjs/common'
+import { APP_FILTER, DECORATOR_FACTORY, APP_PIPE, FORBODDEN_RESOURCE, APP_GUARD, APP_INTERCEPTOR } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
import { defineModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
import { PipeTransform } from '@nestjs/common';
import { ExecutionContext } from '../common';
import { CanActivate } from '@nestjs/common';
import { Reflector } from './reflector';
import { Observable, from, of, mergeMap } from 'rxjs';
export class NestApplication {
    private readonly app: Express = express()
    private readonly providerInstances = new Map()
    private readonly globalProviders = new Set()
    private readonly moduleProviers = new Map()
    private readonly middlewares = []
    private readonly excludedRoutes = []
    private readonly defaultGlobalHttpExceptionFilter = new GlobalHttpExectionFilter()
    private readonly globalHttpExceptionFilters = []
    private readonly globalPipes: PipeTransform[] = []
    private readonly globalGuards = []
    private readonly globalInterceptors: NestInterceptor[] = [];
+   private readonly globalProviderMap = new Map([
+       [APP_INTERCEPTOR, new Map()],
+       [APP_GUARD, new Map()],
+       [APP_PIPE, new Map()],
+       [APP_FILTER, new Map()]
+   ])
    constructor(protected readonly module) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }
    useGlobalPipes(...pipes: PipeTransform[]) {
        this.globalPipes.push(...pipes);
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
    private addDefaultProviders() {
        this.addProvider(Reflector, this.module, true);
    }
    async initProviders() {
        this.addDefaultProviders();
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
+           this.processProvider(provider, this.module);
+       }
+   }
+   private processProvider(provider, module) {
+       if (this.globalProviderMap.has(provider.provide)) {
+           let instanceMap = this.globalProviderMap.get(provider.provide);
+           if (!instanceMap) {
+               instanceMap = new Map();
+               this.globalProviderMap.set(provider.provide, instanceMap);
+           }
+           const { useClass } = provider;
+           if (!instanceMap.has(useClass)) {
+               const instance = new useClass(...this.resolveDependencies(useClass));
+               instanceMap.set(useClass, instance);
+           }
+       } else {
+           this.addProvider(provider, module);
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
    private getGuardInstance(guard) {
        if (typeof guard === 'function') {
            const dependencies = this.resolveDependencies(guard);
            return new guard(...dependencies);
        }
        return guard;
    }
    async callGuards(guards: CanActivate[], context: ExecutionContext) {
        for (const guard of guards) {
            const guardInstance = this.getGuardInstance(guard);
            const canActivate = await guardInstance.canActivate(context);
            if (!canActivate) {
                throw new ForbiddenException(FORBODDEN_RESOURCE);
            }
        }
    }
    private getInterceptorInstance(interceptor: NestInterceptor | Function): NestInterceptor {
        if (typeof interceptor === 'function') {
            const dependencies = this.resolveDependencies(interceptor);
            return new (interceptor as any)(...dependencies);
        }
        return interceptor as NestInterceptor;
    }
    private callInterceptors(controller, method, args, interceptors: NestInterceptor[], context: ExecutionContext): Observable<any> {
        const nextFn = (i = 0): Observable<any> => {
            if (i >= interceptors.length) {
                const result = method.call(controller, ...args);
                return result instanceof Promise ? from(result) : of(result);
            }
            const handler = {
                handle: () => nextFn(i + 1),
            };
            const interceptorInstance = this.getInterceptorInstance(interceptors[i]);
            const result = interceptorInstance.intercept(context, handler);
            return from(result).pipe(mergeMap(res => res instanceof Observable ? res : of(res)));
        };
        return nextFn();
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
            const controllerPipes = Reflect.getMetadata('pipes', Controller) ?? [];
            const controllerGuards = Reflect.getMetadata('guards', Controller) ?? [];
            const controllerInterceptors = Reflect.getMetadata('interceptors', Controller) || [];
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
                const methodPipes = Reflect.getMetadata('pipes', method) ?? [];
                const methodGuards = Reflect.getMetadata('guards', method) ?? [];
                const methodInterceptors = Reflect.getMetadata('interceptors', method) || [];
                const pipes = [...controllerPipes, ...methodPipes];
                const guards = [...this.globalGuards, ...controllerGuards, ...methodGuards];
                const interceptors = [...this.globalInterceptors, ...controllerInterceptors, ...methodInterceptors];
                defineModule(this.module, methodFilters);
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
                        getHandler: () => method
                    }
                    try {
                        await this.callGuards(guards, context);
                        const args = await this.resolveParams(controller, methodName, req, res, next, host, pipes);
                        this.callInterceptors(controller, method, args, interceptors, context).subscribe((result) => {
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
    private initGlobalPipes() {
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        for (const provider of providers) {
            if (provider.provide === APP_PIPE) {
                const providerInstance = this.getProviderByToken(APP_PIPE, this.module);
                this.useGlobalPipes(providerInstance)
            }
        }
    }
    initGlobalGuards() {
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        for (const provider of providers) {
            if (provider.provide === APP_GUARD) {
                const providerInstance = this.getProviderByToken(APP_GUARD, this.module);
                this.useGlobalGuards(providerInstance)
            }
        }
    }
    useGlobalGuards(...guards) {
        this.globalGuards.push(...guards);
    }
    useGlobalInterceptors(...interceptors: NestInterceptor[]): void {
        this.globalInterceptors.push(...interceptors);
    }
+   private initGlobalProviders() {
+       for (const [provide, instanceMap] of this.globalProviderMap) {
+           switch (provide) {
+               case APP_INTERCEPTOR:
+                   this.useGlobalInterceptors(...instanceMap.values());
+                   break;
+               case APP_GUARD:
+                   this.useGlobalGuards(...instanceMap.values());
+                   break;
+               case APP_PIPE:
+                   this.useGlobalPipes(...instanceMap.values());
+                   break;
+               case APP_FILTER:
+                   this.useGlobalFilters(...instanceMap.values());
+                   break;
+           }
+       }
+   }
    async listen(port) {
        await this.initProviders();
        await this.initMiddlewares();
+       await this.initGlobalProviders();
        await this.initController(this.module);
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:${port}`, 'NestApplication');
        });
    }
}
```
### 4.3. app.module.ts
src/app.module.ts
```js
import { Module } from "@nestjs/common";
import { PayController } from './pay.controller';
+import { APP_INTERCEPTOR } from '@nestjs/core';
+import { Logging6Interceptor } from "./logger6.interceptor";
+import { Logging5Interceptor } from "./logger5.interceptor";
@Module({
    controllers: [PayController],
+   providers: [
+       {
+           provide: APP_INTERCEPTOR,
+           useClass: Logging6Interceptor,
+       },
+       {
+           provide: APP_INTERCEPTOR,
+           useClass: Logging5Interceptor,
+       }
+   ]
})
export class AppModule { }
```
### 4.4. main.ts
src/main.ts
```js
import { NestFactory } from "@nestjs/core";
import { AppModule } from './app.module';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
}
bootstrap();
/**
Before6...
Before5...
Before4...
Before3...
Before2...
Before1...
pay...
After1... 2ms
After2... 3ms
After3... 3ms
After4... 4ms
After5... 5ms
After6... 7ms
 */
```
## 5. 响应映射
+ 已经知道 handle() 返回一个 Observable。流包含从路由处理程序返回的值，因此我们可以使用 RxJS 的 map() 操作符轻松地对其进行修改。

### 5.1. excludeNull.interceptor.ts
src/excludeNull.interceptor.ts
```js
import { Injectable, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable()
export class ExcludeNullInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next): Observable<any> {
        return next
            .handle()
            .pipe(map(value => {
                console.log('ExcludeNullInterceptor', value);
                return value === null ? '' : value
            }));
    }
}
```
### 5.2. transform.interceptor.ts
src/transform.interceptor.ts
```js
import { Injectable, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
export interface Response<T> {
    data: T;
}
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next): Observable<Response<T>> {
        return next.handle().pipe(map(data => {
            console.log('TransformInterceptor', data);
            return ({ data });
        }));
    }
}
```
### 5.3. main.ts
src/main.ts
```js
import { NestFactory } from "@nestjs/core";
import { AppModule } from './app.module';
+import { TransformInterceptor } from './transform.interceptor';
+import { ExcludeNullInterceptor } from './excludeNull.interceptor';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
+   app.useGlobalInterceptors(new TransformInterceptor());
+   app.useGlobalInterceptors(new ExcludeNullInterceptor());
    await app.listen(3000);
}
bootstrap();
/**
Before6...
Before5...
Before4...
Before3...
Before2...
Before1...
pay...
After1... 2ms
After2... 3ms
After3... 3ms
After4... 4ms
After5... 5ms
After6... 7ms
 */
 ```
### 5.4. pay.controller.ts
src/pay.controller.ts
```js
import { Get, Controller, UseInterceptors } from "@nestjs/common";
import { Logging1Interceptor } from "./logger1.interceptor";
import { Logging2Interceptor } from "./logger2.interceptor";
import { Logging3Interceptor } from "./logger3.interceptor";
import { Logging4Interceptor } from "./logger4.interceptor";
@Controller('pay')
@UseInterceptors(Logging3Interceptor)
@UseInterceptors(Logging4Interceptor)
export class PayController {
    @Get()
    @UseInterceptors(Logging1Interceptor)
    @UseInterceptors(Logging2Interceptor)
    async pay() {
        console.log('pay...');
        return 'pay'
    }
+   @Get('null')
+   async null() {
+       console.log('null...');
+       return null;
+   }
}
```
## 6. 异常映射
+ 另一个有趣的用例是利用 RxJS 的 catchError() 操作符覆盖抛出的异常：
## 6.1. errors.interceptor.ts
src/errors.interceptor.ts
```js
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    BadGatewayException
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next): Observable<any> {
        return next
            .handle()
            .pipe(
                catchError(err => throwError(() => new BadGatewayException())),
            );
    }
}
```
### 6.2. http-exception.ts
src/@nestjs/common/http-exception.ts
```js
import { HttpStatus } from "./http-status.enum";
export class HttpException extends Error {
    private readonly response: string | object
    private readonly status: HttpStatus
    constructor(response: string | object, status: HttpStatus) {
        super();
        this.response = response;
        this.status = status;
    }
    getResponse() {
        return this.response;
    }
    getStatus() {
        return this.status;
    }
}
export class BadRequestException extends HttpException {
    constructor(message, error?) {
        super({ message, error, statusCode: HttpStatus.BAD_REQUEST }, HttpStatus.BAD_REQUEST)
    }
}
export class ForbiddenException extends HttpException {
    constructor(message, error?) {
        super({ message, error, statusCode: HttpStatus.FORBIDDEN }, HttpStatus.FORBIDDEN)
    }
}
+export class BadGatewayException extends HttpException {
+   constructor(message?, error?) {
+       super({ message: message ?? 'Bad Gateway', error, statusCode: HttpStatus.BAD_GATEWAY }, HttpStatus.BAD_GATEWAY)
    }
}
export class RequestTimeoutException extends HttpException {
    constructor(message, error?) {
        super({ message, error, statusCode: HttpStatus.REQUEST_TIMEOUT }, HttpStatus.REQUEST_TIMEOUT)
    }
}
```
### 6.3. nest-application.ts
src/@nestjs/core/nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { ForbiddenException, NestInterceptor, RequestMethod } from '@nestjs/common'
import { APP_FILTER, DECORATOR_FACTORY, APP_PIPE, FORBODDEN_RESOURCE, APP_GUARD, APP_INTERCEPTOR } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
import { defineModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
import { PipeTransform } from '@nestjs/common';
import { ExecutionContext } from '../common';
import { CanActivate } from '@nestjs/common';
import { Reflector } from './reflector';
+import { Observable, from, of, mergeMap, catchError } from 'rxjs';
export class NestApplication {
    private readonly app: Express = express()
    private readonly providerInstances = new Map()
    private readonly globalProviders = new Set()
    private readonly moduleProviers = new Map()
    private readonly middlewares = []
    private readonly excludedRoutes = []
    private readonly defaultGlobalHttpExceptionFilter = new GlobalHttpExectionFilter()
    private readonly globalHttpExceptionFilters = []
    private readonly globalPipes: PipeTransform[] = []
    private readonly globalGuards = []
    private readonly globalInterceptors: NestInterceptor[] = [];
    private readonly globalProviderMap = new Map([
        [APP_INTERCEPTOR, new Map()],
        [APP_GUARD, new Map()],
        [APP_PIPE, new Map()],
        [APP_FILTER, new Map()]
    ])
    constructor(protected readonly module) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }
    useGlobalPipes(...pipes: PipeTransform[]) {
        this.globalPipes.push(...pipes);
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
    private addDefaultProviders() {
        this.addProvider(Reflector, this.module, true);
    }
    async initProviders() {
        this.addDefaultProviders();
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
            this.processProvider(provider, this.module);
        }
    }
    private processProvider(provider, module) {
        if (this.globalProviderMap.has(provider.provide)) {
            let instanceMap = this.globalProviderMap.get(provider.provide);
            if (!instanceMap) {
                instanceMap = new Map();
                this.globalProviderMap.set(provider.provide, instanceMap);
            }
            const { useClass } = provider;
            if (!instanceMap.has(useClass)) {
                const instance = new useClass(...this.resolveDependencies(useClass));
                instanceMap.set(useClass, instance);
            }
        } else {
            this.addProvider(provider, module);
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
    private getGuardInstance(guard) {
        if (typeof guard === 'function') {
            const dependencies = this.resolveDependencies(guard);
            return new guard(...dependencies);
        }
        return guard;
    }
    async callGuards(guards: CanActivate[], context: ExecutionContext) {
        for (const guard of guards) {
            const guardInstance = this.getGuardInstance(guard);
            const canActivate = await guardInstance.canActivate(context);
            if (!canActivate) {
                throw new ForbiddenException(FORBODDEN_RESOURCE);
            }
        }
    }
    private getInterceptorInstance(interceptor: NestInterceptor | Function): NestInterceptor {
        if (typeof interceptor === 'function') {
            const dependencies = this.resolveDependencies(interceptor);
            return new (interceptor as any)(...dependencies);
        }
        return interceptor as NestInterceptor;
    }
    private callInterceptors(controller, method, args, interceptors: NestInterceptor[], context: ExecutionContext): Observable<any> {
        const nextFn = (i = 0): Observable<any> => {
            if (i >= interceptors.length) {
                const result = method.call(controller, ...args);
                return result instanceof Promise ? from(result) : of(result);
            }
            const handler = {
                handle: () => nextFn(i + 1),
            };
            const interceptorInstance = this.getInterceptorInstance(interceptors[i]);
            const result = interceptorInstance.intercept(context, handler);
            return from(result).pipe(mergeMap(res => res instanceof Observable ? res : of(res)));
        };
        return nextFn();
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
            const controllerPipes = Reflect.getMetadata('pipes', Controller) ?? [];
            const controllerGuards = Reflect.getMetadata('guards', Controller) ?? [];
            const controllerInterceptors = Reflect.getMetadata('interceptors', Controller) || [];
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
                const methodPipes = Reflect.getMetadata('pipes', method) ?? [];
                const methodGuards = Reflect.getMetadata('guards', method) ?? [];
                const methodInterceptors = Reflect.getMetadata('interceptors', method) || [];
                const pipes = [...controllerPipes, ...methodPipes];
                const guards = [...this.globalGuards, ...controllerGuards, ...methodGuards];
                const interceptors = [...this.globalInterceptors, ...controllerInterceptors, ...methodInterceptors];
                defineModule(this.module, methodFilters);
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
                        getHandler: () => method
                    }
                    try {
                        await this.callGuards(guards, context);
                        const args = await this.resolveParams(controller, methodName, req, res, next, host, pipes);
+                       this.callInterceptors(controller, method, args, interceptors, context).subscribe({
+                           next: (result) => {
+                               if (result?.url) {
+                                   return res.redirect(result.statusCode || 302, result.url);
+                               }
+                               if (redirectUrl) {
+                                   return res.redirect(redirectStatusCode || 302, redirectUrl);
+                               }
+                               if (statusCode) {
+                                   res.statusCode = statusCode;
+                               } else if (httpMethod === 'POST') {
+                                   res.statusCode = 201;
+                               }
+                               const responseMetadata = this.getResponseMetadata(controller, methodName);
+                               if (!responseMetadata || (responseMetadata?.data?.passthrough)) {
+                                   headers.forEach(({ name, value }) => {
+                                       res.setHeader(name, value);
+                                   });
+                                   res.send(result);
+                               }
+                           },
+                           error: (error) => this.callExceptionFilters(error, host, methodFilters, controllerFilters)
                        })
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
    private initGlobalPipes() {
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        for (const provider of providers) {
            if (provider.provide === APP_PIPE) {
                const providerInstance = this.getProviderByToken(APP_PIPE, this.module);
                this.useGlobalPipes(providerInstance)
            }
        }
    }
    initGlobalGuards() {
        const providers = Reflect.getMetadata('providers', this.module) ?? [];
        for (const provider of providers) {
            if (provider.provide === APP_GUARD) {
                const providerInstance = this.getProviderByToken(APP_GUARD, this.module);
                this.useGlobalGuards(providerInstance)
            }
        }
    }
    useGlobalGuards(...guards) {
        this.globalGuards.push(...guards);
    }
    useGlobalInterceptors(...interceptors: NestInterceptor[]): void {
        this.globalInterceptors.push(...interceptors);
    }
    private initGlobalProviders() {
        for (const [provide, instanceMap] of this.globalProviderMap) {
            switch (provide) {
                case APP_INTERCEPTOR:
                    this.useGlobalInterceptors(...instanceMap.values());
                    break;
                case APP_GUARD:
                    this.useGlobalGuards(...instanceMap.values());
                    break;
                case APP_PIPE:
                    this.useGlobalPipes(...instanceMap.values());
                    break;
                case APP_FILTER:
                    this.useGlobalFilters(...instanceMap.values());
                    break;
            }
        }
    }
    async listen(port) {
        await this.initProviders();
        await this.initMiddlewares();
        await this.initGlobalProviders();
        await this.initController(this.module);
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:${port}`, 'NestApplication');
        });
    }
}
```
### 6.4. main.ts
src/main.ts
```js
import { NestFactory } from "@nestjs/core";
import { AppModule } from './app.module';
import { TransformInterceptor } from './transform.interceptor';
import { ExcludeNullInterceptor } from './excludeNull.interceptor';
+import { ErrorsInterceptor } from './errors.interceptor';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalInterceptors(new ExcludeNullInterceptor());
+   app.useGlobalInterceptors(new ErrorsInterceptor());
    await app.listen(3000);
}
bootstrap();
/**
Before6...
Before5...
Before4...
Before3...
Before2...
Before1...
pay...
After1... 2ms
After2... 3ms
After3... 3ms
After4... 4ms
After5... 5ms
After6... 7ms
 */
```
### 6.5. pay.controller.ts
src/pay.controller.ts
```js
+import { Get, Controller, UseInterceptors, BadRequestException } from "@nestjs/common";
import { Logging1Interceptor } from "./logger1.interceptor";
import { Logging2Interceptor } from "./logger2.interceptor";
import { Logging3Interceptor } from "./logger3.interceptor";
import { Logging4Interceptor } from "./logger4.interceptor";
@Controller('pay')
@UseInterceptors(Logging3Interceptor)
@UseInterceptors(Logging4Interceptor)
export class PayController {
    @Get()
    @UseInterceptors(Logging1Interceptor)
    @UseInterceptors(Logging2Interceptor)
    async pay() {
        console.log('pay...');
        return 'pay'
    }
    @Get('null')
    async null() {
        console.log('null...');
        return null;
    }
+   @Get('error')
+   async error() {
+       console.log('error...');
+       throw new BadRequestException('error');
+   }
}
```
## 7. CacheInterceptor
+ 有几种原因导致我们有时可能希望完全阻止调用处理程序并返回不同的值。一个明显的例子是实现缓存以提高响应时间

### 7.1. cache.interceptor.ts
src/cache.interceptor.ts
```js
import { Injectable, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next): Observable<any> {
        const isCached = true;
        if (isCached) {
            return of([]);
        }
        return next.handle();
    }
}
```
### 7.2. pay.controller.ts
src/pay.controller.ts
```js
import { Get, Controller, UseInterceptors, BadRequestException } from "@nestjs/common";
import { Logging1Interceptor } from "./logger1.interceptor";
import { Logging2Interceptor } from "./logger2.interceptor";
import { Logging3Interceptor } from "./logger3.interceptor";
import { Logging4Interceptor } from "./logger4.interceptor";
+import { CacheInterceptor } from './cache.interceptor';
+
@Controller('pay')
@UseInterceptors(Logging3Interceptor)
@UseInterceptors(Logging4Interceptor)
export class PayController {
    @Get()
    @UseInterceptors(Logging1Interceptor)
    @UseInterceptors(Logging2Interceptor)
    async pay() {
        console.log('pay...');
        return 'pay'
    }
    @Get('null')
    async null() {
        console.log('null...');
        return null;
    }
    @Get('error')
    async error() {
        console.log('error...');
        throw new BadRequestException('error');
    }
+   @Get('cache')
+   @UseInterceptors(CacheInterceptor)
+   async cache() {
+       console.log('cache...');
+       return 'cache';
+   }
}
```
## 8. TimeoutInterceptor
### 8.1. timeout.interceptor.ts
src/timeout.interceptor.ts
```js
import { Injectable, NestInterceptor, ExecutionContext, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next): Observable<any> {
        return next.handle().pipe(
            timeout(1000),
            catchError(err => {
                if (err instanceof TimeoutError) {
                    return throwError(() => new RequestTimeoutException());
                } else {
                    return throwError(() => err);
                }
            }),
        );
    }
}
```
### 8.2. http-exception.ts
src/@nestjs/common/http-exception.ts
```js
import { HttpStatus } from "./http-status.enum";
export class HttpException extends Error {
    private readonly response: string | object
    private readonly status: HttpStatus
    constructor(response: string | object, status: HttpStatus) {
        super();
        this.response = response;
        this.status = status;
    }
    getResponse() {
        return this.response;
    }
    getStatus() {
        return this.status;
    }
}
export class BadRequestException extends HttpException {
    constructor(message, error?) {
        super({ message, error, statusCode: HttpStatus.BAD_REQUEST }, HttpStatus.BAD_REQUEST)
    }
}
export class ForbiddenException extends HttpException {
    constructor(message, error?) {
        super({ message, error, statusCode: HttpStatus.FORBIDDEN }, HttpStatus.FORBIDDEN)
    }
}
export class BadGatewayException extends HttpException {
    constructor(message?, error?) {
        super({ message: message ?? 'Bad Gateway', error, statusCode: HttpStatus.BAD_GATEWAY }, HttpStatus.BAD_GATEWAY)
    }
}
export class RequestTimeoutException extends HttpException {
+   constructor(message?, error?) {
+       super({ message: message ?? "Request Timeout", error, statusCode: HttpStatus.REQUEST_TIMEOUT }, HttpStatus.REQUEST_TIMEOUT)
    }
}
```
### 8.3. main.ts
src/main.ts
```js
import { NestFactory } from "@nestjs/core";
import { AppModule } from './app.module';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
}
bootstrap();
```
### 8.4. pay.controller.ts
src/pay.controller.ts
```js
import { Get, Controller, UseInterceptors, BadRequestException } from "@nestjs/common";
import { Logging1Interceptor } from "./logger1.interceptor";
import { Logging2Interceptor } from "./logger2.interceptor";
import { Logging3Interceptor } from "./logger3.interceptor";
import { Logging4Interceptor } from "./logger4.interceptor";
import { CacheInterceptor } from './cache.interceptor';
+import { TimeoutInterceptor } from './timeout.interceptor';

@Controller('pay')
@UseInterceptors(Logging3Interceptor)
@UseInterceptors(Logging4Interceptor)
export class PayController {
    @Get()
    @UseInterceptors(Logging1Interceptor)
    @UseInterceptors(Logging2Interceptor)
    async pay() {
        console.log('pay...');
        return 'pay'
    }
    @Get('null')
    async null() {
        console.log('null...');
        return null;
    }
    @Get('error')
    async error() {
        console.log('error...');
        throw new BadRequestException('error');
    }
    @Get('cache')
    @UseInterceptors(CacheInterceptor)
    async cache() {
        console.log('cache...');
        return 'cache';
    }
+   @Get('timeout')
+   @UseInterceptors(TimeoutInterceptor)
+   async timeout() {
+       await new Promise(resolve => setTimeout(resolve, 2000));
+   }
}
```
## 参考
### 1.AOP
AOP（面向方面编程，Aspect-Oriented Programming）是一种编程范式，用于将跨领域关注点（如日志记录、事务管理、缓存等）从业务逻辑中分离出来，以提高代码的模块化和可维护性。AOP 通过“切面”（Aspect）来封装这些关注点，并通过“切点”（Pointcut）来定义在哪些地方应用这些切面。

#### 1.1 在方法执行之前/之后绑定额外的逻辑
```js
function logBeforeAndAfter(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`Before executing ${propertyName}`);
    const result = originalMethod.apply(this, args);
    console.log(`After executing ${propertyName}`);
    return result;
  };

  return descriptor;
}

class Example {
  @logBeforeAndAfter
  someMethod() {
    console.log('Executing someMethod');
  }
}

const example = new Example();
example.someMethod();
```
#### 1.2. 转换从函数返回的结果
```js
function transformResult(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const result = originalMethod.apply(this, args);
    return `Transformed Result: ${result}`;
  };

  return descriptor;
}

class Example {
  @transformResult
  getResult() {
    return 'Original Result';
  }
}

const example = new Example();
console.log(example.getResult());
```
#### 1.3. 转换从函数抛出的异常
```js
function transformException(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    try {
      return originalMethod.apply(this, args);
    } catch (e) {
      throw new Error(`Transformed Exception: ${e.message}`);
    }
  };

  return descriptor;
}

class Example {
  @transformException
  riskyMethod() {
    throw new Error('Original Exception');
  }
}

const example = new Example();
try {
  example.riskyMethod();
} catch (e) {
  console.error(e.message);
}
```
#### 1.4. 扩展基本的函数行为
```js
function extendBehavior(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log('Extending behavior');
    return originalMethod.apply(this, args);
  };

  return descriptor;
}

class Example {
  @extendBehavior
  baseMethod() {
    console.log('Executing baseMethod');
  }
}

const example = new Example();
example.baseMethod();
```
#### 1.5. 根据特定条件完全覆盖一个函数（例如，用于缓存目的）
```js
const cache = new Map();

function cacheResult(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const cacheKey = JSON.stringify(args);
    if (cache.has(cacheKey)) {
      console.log('Returning cached result');
      return cache.get(cacheKey);
    } else {
      const result = originalMethod.apply(this, args);
      cache.set(cacheKey, result);
      return result;
    }
  };

  return descriptor;
}

class Example {
  @cacheResult
  calculate(a: number, b: number) {
    console.log('Calculating...');
    return a + b;
  }
}

const example = new Example();
console.log(example.calculate(1, 2)); // Calculating... 3
console.log(example.calculate(1, 2)); // Returning cached result 3
```
### 2.RxJS
RxJS（Reactive Extensions for JavaScript）是一个用于处理异步事件的库。

#### 2.1 Observable
Observable 是 RxJS 的核心，它表示一个数据流，可以是同步或异步的。Observable 可以发出多个值，并可以通过 Observer 进行订阅。

Observer 是一个对象，它定义了回调函数，用于处理 Observable 发出的数据、错误和完成信号。

**创建**:
```js
import { Observable } from 'rxjs';
const observable = new Observable(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
});
observable.subscribe({
  next(x) { console.log('Got value ' + x); },
  error(err) { console.error('Something wrong occurred: ' + err); },
  complete() { console.log('Done'); }
});
```
#### 2.2 Subscription
Subscription 表示一个对 Observable 的订阅。通过 Subscription 对象，你可以执行以下操作：

+ 取消订阅 Observable，即停止接收数据。
+ 组合多个 Subscription，统一管理它们。
创建: Subscription 是通过调用 Observable 的 subscribe 方法创建的
```js
import { Observable } from 'rxjs';
// 创建一个简单的 Observable
const observable = new Observable(subscriber => {
    let count = 0;
    const intervalId = setInterval(() => {
        subscriber.next(count++);
    }, 1000);
    // 当 Observable 被取消订阅时清除定时器
    return () => {
        clearInterval(intervalId);
        console.log('Unsubscribed');
    };
});

// 订阅 Observable
const subscription = observable.subscribe(value => console.log(value));
// 5秒后取消订阅
setTimeout(() => {
    subscription.unsubscribe();
}, 5000);
```
#### 2.3 操作符
##### 2.3.1 创建操作符
| 操作符名称 | 操作符介绍 |
|----------|-----------|
| of | 创建一个发出指定值序列的 Observable。 |
| from | 将数组、Promise、迭代器或类数组对象转换为 Observable。 |
| throwError | 创建一个立即发出错误的 Observable。 |
| interval | 创建一个每隔指定时间间隔发出递增数字的 Observable。 |
| timer | 创建一个在指定延迟后发出单个值的 Observable，然后可选地按指定间隔发出后续值。 |
| ajax | 创建一个执行 HTTP 请求并发出响应的 Observable（需要 rxjs/ajax）。 |
| empty | 创建一个什么都不做、立即完成的 Observable。 |
| never | 创建一个不发出任何值或完成的 Observable。 |
| range | 创建一个发出指定范围内顺序整数的 Observable。 |
| defer | 创建一个 Observable，该 Observable 的创建是由订阅决定的。 |
| generate | 创建一个 Observable，按生成函数生成值，直到某个条件为假。 |
| bindCallback | 将回调函数转换为返回 Observable 的函数。 |
| bindNodeCallback | 将 Node.js 风格的回调函数转换为返回 Observable 的函数。 |
| combineLatest | 创建一个 Observable，当其任一输入 Observable 发出值时，发出最近发出的值的组合。 |
| concat | 顺序连接多个 Observables 并发出它们的值。 |
| forkJoin | 当所有提供的 Observables 完成时，发出最新的值。 |
| merge | 合并多个 Observables 的值，以并行方式发出它们。 |
| race | 创建一个 Observable，只发出首先发出值或事件的输入 Observable 的值。 |
| zip | 组合多个 Observables 的值，以数组的形式发出它们。 |
| fromEvent | 创建一个 Observable，该 Observable 发出从事件目标（如 DOM 元素、Node.js 事件发射器等）上发出的事件。 |
| fromEventPattern | 创建一个 Observable，从添加和移除事件处理程序的 API 发出事件。 |

###### 2.3.1.1 of
**概念**: of 是一个创建操作符，用于创建一个发出特定值的 Observable。

示例:
```js
import { of } from 'rxjs';

const observable = of(1, 2, 3);
observable.subscribe(console.log); // 输出: 1, 2, 3
```
###### 2.3.1.2 from
概念: from 是一个创建操作符，用于将数组、Promise 或迭代器转换为 Observable。

示例:
```js
import { from } from 'rxjs';

const observable = from([1, 2, 3]);
observable.subscribe(console.log); // 输出: 1, 2, 3
```
###### 2.3.1.3 throwError
概念: throwError 是一个创建操作符，用于创建一个立即发出错误的 Observable。

示例:
```js
import { throwError } from 'rxjs';

const observable = throwError(() => new Error('An error occurred'));
observable.subscribe({
    next: console.log,
    error: err => console.error('Error:', err)
});
```
##### 2.3.2 管道操作符
在 RxJS 中，pipe 是一个核心概念，用于将多个操作符组合在一起，形成一个管道（pipeline），通过这个管道，可以对 Observable 发出的数据进行各种转换和操作。

管道操作符（pipeable operators）是 RxJS 中最常用的一类操作符，它们可以通过 pipe 方法进行链式调用。

pipe 方法是 Observable 实例上的一个方法，它接受多个操作符作为参数，并返回一个新的 Observable，该 Observable 是应用了这些操作符后的结果。

**转换操作符**

| 操作符名称 | 操作符介绍 |
|----------|-----------|
| map | 对 Observable 发出的每个值进行转换，类似于数组的 map 方法。 |
| mapTo | 将 Observable 发出的每个值映射为一个固定值。 |
| scan | 对 Observable 发出的值进行累加，并在每次累加后发出累加值。 |

**过滤操作符**

| 操作符名称 | 操作符介绍 |
|----------|-----------|
| filter | 过滤 Observable 发出的值，只发出通过谓词函数检查的值。 |
| first | 只发出 Observable 发出的第一个值。 |
| last | 只发出 Observable 发出的最后一个值。 |
| take | 只发出 Observable 发出的前 n 个值。 |
| skip | 跳过 Observable 发出的前 n 个值。 |
| distinctUntilChanged | 只发出当前值与前一个值不相同的值，常用于去重操作。 |

**组合操作符**
| 操作符名称 | 操作符介绍 |
|----------|-----------|
| merge | 合并多个 Observable。 |
| concat | 按顺序连接多个 Observable。 |
| combineLatest | 将多个 Observable 最新发出的值组合起来，创建一个新的 Observable。 |
| withLatestFrom | 将一个 Observable 与另一个 Observable 的最新值结合，创建一个新的 Observable。 |

**错误处理操作符**

| 操作符名称 | 操作符介绍 |
|----------|-----------|
| catchError | 捕获 Observable 发出的错误，并返回一个新的 Observable 以处理错误。 |
| retry | 在 Observable 发生错误时，重新订阅并重试指定次数。 |
| retryWhen | 在 Observable 发生错误时，根据指定的策略重新订阅并重试。 |


**时间相关操作符**

| 操作符名称 | 操作符介绍 |
|----------|-----------|
| debounceTime | 等待指定时间后发出 Observable 的值，如果在等待时间内有新值，则重新计时，常用于去抖动操作。 |
| throttleTime | 限制 Observable 发出值的频率，在指定时间内只发出一个值，常用于节流操作。 |
| delay | 延迟 Observable 发出值的时间。 |
| timeout | 对 Observable 施加超时限制，超过时间抛出错误。 |

###### 2.3.2.1 tap
概念: tap 是一个操作符，用于对 Observable 发出的每个值执行副作用操作（如日志记录）。它不会改变数据流中的值。

示例:
```js
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

const observable = of(1, 2, 3).pipe(
  tap(value => console.log('Value:', value))
);

observable.subscribe();
```
###### 2.3.2.2 map
概念: map 是一个操作符，用于对 Observable 发出的每个值进行转换。

示例:
```js
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

const observable = of(1, 2, 3).pipe(
  map(value => value * 2)
);

observable.subscribe(console.log); // 输出: 2, 4, 6
```
###### 2.3.2.3 catchError
概念: catchError 是一个操作符，用于捕获 Observable 中的错误，并返回一个新的 Observable 以处理错误。

示例:
```js
import { of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const observable = throwError(() => new Error('An error occurred')).pipe(
    catchError(err => of(`Caught: ${err}`))
);

observable.subscribe(console.log); // 输出: Caught: An error occurred
```
###### 2.3.2.4 timeout
概念: timeout 是一个操作符，用于对 Observable 施加超时限制，如果超过指定时间没有发出值，则抛出错误。

示例:
```js
import { of } from 'rxjs';
import { timeout, delay } from 'rxjs/operators';

const observable = of('Hello').pipe(
  delay(2000), // 模拟延迟
  timeout(1000) // 超时时间
);

observable.subscribe({
  next: console.log,
  error: err => console.error('Error:', err)
});
```
### 3.Interceptors
#### 3.1 单个Interceptor
```js
// 导入 Observable 和 of 函数
import { Observable, of } from 'rxjs';
// 导入 tap 操作符
import { tap } from 'rxjs/operators';

// 定义一个执行上下文类
class ExecutionContext {
    // 定义一个处理方法，返回一个 Observable
    handle(): Observable<any> {
        // 打印日志 "pay..."
        console.log('pay...');
        // 返回一个发出 'Original Result' 的 Observable
        return of('Original Result');
    }
}

// 定义一个日志拦截器类
class LoggingInterceptor {
    // 定义拦截方法，接受一个上下文和下一个要执行的上下文
    intercept(context: ExecutionContext, next: ExecutionContext): Observable<any> {
        // 打印日志 "Before..."
        console.log('Before...');
        // 获取当前时间戳
        const now = Date.now();
        // 调用下一个上下文的 handle 方法，并添加管道操作符
        return next.handle().pipe(
            // 使用 tap 操作符在 handle 方法执行后打印执行时间
            tap(() => console.log(`After... ${Date.now() - now}ms`)),
        );
    }
}

// 创建一个执行上下文实例
const context = new ExecutionContext();
// 创建一个日志拦截器实例
const interceptor = new LoggingInterceptor();
// 调用拦截器的拦截方法，并订阅其返回的 Observable
interceptor.intercept(context, context).subscribe(result => {
    // 打印最终结果
    console.log('Result:', result);
});
```
#### 3.2 多个Interceptor
```js
// 从 'rxjs' 导入 Observable 和 of
import { Observable, of } from 'rxjs';
// 从 'rxjs/operators' 导入 tap 操作符
import { tap } from 'rxjs/operators';

// 定义一个模拟的执行上下文类
class ExecutionContext {
    // handle 方法返回一个 Observable，模拟处理操作
    handle(): Observable<any> {
        console.log('pay...'); // 打印日志
        return of('Original Result'); // 返回一个发出 'Original Result' 的 Observable
    }
}

// 定义第一个日志拦截器类
export class Logging1Interceptor {
    // 拦截方法，接受上下文和下一个处理函数
    intercept(context: ExecutionContext, next: { handle: () => Observable<any> }): Observable<any> {
        console.log('Before1...'); // 在处理之前打印日志
        const now = Date.now(); // 记录当前时间
        // 调用下一个处理函数并记录处理后的时间
        return next.handle().pipe(
            tap(() => console.log(`After1... ${Date.now() - now}ms`)),
        );
    }
}

// 定义第二个日志拦截器类
export class Logging2Interceptor {
    // 拦截方法，接受上下文和下一个处理函数
    intercept(context: ExecutionContext, next: { handle: () => Observable<any> }): Observable<any> {
        console.log('Before2...'); // 在处理之前打印日志
        const now = Date.now(); // 记录当前时间
        // 调用下一个处理函数并记录处理后的时间
        return next.handle().pipe(
            tap(() => console.log(`After2... ${Date.now() - now}ms`)),
        );
    }
}

// 创建一个执行上下文的实例
const context = new ExecutionContext();
// 创建日志拦截器的实例
const logging1Interceptor = new Logging1Interceptor();
const logging2Interceptor = new Logging2Interceptor();

// 定义原始的处理函数
let originalHandler = () => context.handle();
// 定义第一个拦截器的处理函数
const logger1Handler = () => logging1Interceptor.intercept(context, { handle: originalHandler })
// 定义第二个拦截器的处理函数
const logger2Handler = () => logging2Interceptor.intercept(context, { handle: logger1Handler })

// 执行第二个拦截器并订阅其结果
logger2Handler().subscribe(result => {
    console.log('Final Result:', result); // 打印最终结果
});
```
#### 3.3 通用多个Interceptor
```js
// 导入 Observable 和 of 创建操作符
import { Observable, of } from 'rxjs';
// 导入 tap 操作符
import { tap } from 'rxjs/operators';

// 定义一个模拟的执行上下文类
class ExecutionContext {
    // 定义 handle 方法，返回一个 Observable
    handle(): Observable<any> {
        // 打印 "pay..."
        console.log('pay...');
        // 返回一个发出 'Original Result' 的 Observable
        return of('Original Result');
    }
}

// 定义第一个日志拦截器
export class Logging1Interceptor {
    // 拦截方法，接受一个上下文和下一个处理器
    intercept(context: ExecutionContext, next: { handle: () => Observable<any> }): Observable<any> {
        // 打印 "Before1..."
        console.log('Before1...');
        // 记录当前时间
        const now = Date.now();
        // 调用下一个处理器的 handle 方法，并在之后执行 tap 操作
        return next.handle().pipe(
            // 打印 "After1..." 和经过的时间
            tap(() => console.log(`After1... ${Date.now() - now}ms`)),
        );
    }
}

// 定义第二个日志拦截器
export class Logging2Interceptor {
    // 拦截方法，接受一个上下文和下一个处理器
    intercept(context: ExecutionContext, next: { handle: () => Observable<any> }): Observable<any> {
        // 打印 "Before2..."
        console.log('Before2...');
        // 记录当前时间
        const now = Date.now();
        // 调用下一个处理器的 handle 方法，并在之后执行 tap 操作
        return next.handle().pipe(
            // 打印 "After2..." 和经过的时间
            tap(() => console.log(`After2... ${Date.now() - now}ms`)),
        );
    }
}

// 定义一个函数，用于执行多个拦截器
function executeInterceptors(context: ExecutionContext, interceptors: any[]): Observable<any> {
    // 初始化当前处理器为上下文的 handle 方法
    let currentHandler = () => context.handle();
    // 遍历拦截器数组
    interceptors.forEach(interceptor => {
        // 保存之前的处理器
        const previousHandler = currentHandler;
        // 更新当前处理器为当前拦截器的 intercept 方法
        currentHandler = () => interceptor.intercept(context, { handle: previousHandler });
    });
    // 返回最终的处理器
    return currentHandler();
}

// 创建执行上下文实例
const context = new ExecutionContext();
// 创建拦截器数组
const interceptors = [new Logging1Interceptor(), new Logging2Interceptor()];
// 执行拦截器链，并订阅最终的 Observable
executeInterceptors(context, interceptors).subscribe(result => {
    // 打印最终结果
    console.log('Final Result:', result);
});
```
### 4.call
#### 4.1 of
of 是一个创建可观察对象的函数。它接受任意数量的参数，并将这些参数依次作为数据项发出。

示例代码：
```js
of(1, 2, 3).subscribe({
    next: console.log, // 输出 1, 2, 3
    error: err => console.error(err),
    complete: () => console.log('Completed') // 输出 'Completed'
});
```
在这个例子中，of(1, 2, 3) 创建了一个可观察对象，该对象会依次发出值 1, 2, 3，然后完成。

#### 4.2 from
from 也是一个创建可观察对象的函数。它可以接受各种可迭代对象（如数组、Promise 等），并将它们转换为可观察对象。
```js
from([1, 2, 3]).subscribe({
    next: console.log, // 输出 1, 2, 3
    error: err => console.error(err),
    complete: () => console.log('Completed') // 输出 'Completed'
});
```
在这个例子中，from([1, 2, 3]) 创建了一个可观察对象，该对象会依次发出数组中的值 1, 2, 3，然后完成。

#### 4.3 mergeMap
mergeMap 是一个操作符，它用于将每个源值映射到一个新的可观察对象，然后将这些内部可观察对象的值合并到一个单一的输出可观察对象中。
```js
of(1, 2, 3)
    .pipe(
        mergeMap(value => of(value * 2))
    )
    .subscribe({
        next: console.log, // 输出 2, 4, 6
        error: err => console.error(err),
        complete: () => console.log('Completed') // 输出 'Completed'
    });
```
在这个例子中，of(1, 2, 3) 创建了一个可观察对象，该对象会依次发出值 1, 2, 3。mergeMap 操作符将每个值映射到一个新的可观察对象（通过 of(value * 2)），然后将这些新可观察对象的值合并到一个单一的输出可观察对象中，最终输出 2, 4, 6，然后完成。

#### 4.4 实现
```js
// 定义一个可观察对象类
class Observable {
    // 存储订阅函数
    _subscribe;
    // 构造函数，接受一个订阅函数作为参数
    constructor(subscribe) {
        this._subscribe = subscribe;
    }
    // 订阅方法，接受一个观察者对象
    subscribe(observer) {
        // 调用存储的订阅函数，并传入观察者对象
        return this._subscribe(observer);
    }
    // 管道方法，接受多个操作符函数，并依次应用它们
    pipe(...operators) {
        // 使用reduce方法，将每个操作符函数依次应用到源可观察对象上
        return operators.reduce((source, operator) => operator(source), this);
    }
}
// 定义一个of函数，用于创建包含指定值的可观察对象
function of(...values) {
    // 返回一个新的可观察对象
    return new Observable(observer => {
        // 遍历每个值，并调用观察者的next方法
        values.forEach(value => observer.next(value));
        // 通知观察者，所有值都已发出
        observer.complete();
    });
}
// 定义一个from函数，用于将可迭代对象或Promise转换为可观察对象
function from(input) {
    // 返回一个新的可观察对象
    return new Observable(observer => {
        if (input instanceof Promise) {
            // 如果输入是一个Promise
            input.then(value => {
                observer.next(value); // 当Promise解决时，发送值
                observer.complete(); // 完成通知
            }).catch(err => {
                observer.error(err); // 当Promise拒绝时，发送错误
            });
        } else {
            // 如果输入是一个可迭代对象
            for (let value of input) {
                observer.next(value); // 发送每个值
            }
            observer.complete(); // 完成通知
        }
    });
}
// 定义mergeMap操作符
function mergeMap(project) {
    // 返回一个接受源可观察对象的函数
    return function (source) {
        // 返回一个新的可观察对象
        return new Observable(observer => {
            // 订阅源可观察对象
            source.subscribe({
                // 当源可观察对象发出值时
                next: value => {
                    // 调用project函数，生成新的可观察对象
                    const innerObservable = project(value);
                    // 订阅生成的可观察对象，并将其值传递给外部观察者
                    innerObservable.subscribe({
                        next: innerValue => observer.next(innerValue),
                        error: err => observer.error(err),
                        complete: () => { } // 内部可观察对象完成时不做任何操作
                    });
                },
                error: err => observer.error(err),
                complete: () => observer.complete()
            });
        });
    };
}
// 使用of和mergeMap的示例代码
of(1, 2, 3)
    .pipe(
        mergeMap(value => of(value * 2))
    )
    .subscribe({
        next: console.log, // 输出 2, 4, 6
        error: err => console.error(err),
        complete: () => console.log('Completed') // 输出 'Completed'
    });
// 使用from和mergeMap的示例代码（处理可迭代对象）
from([1, 2, 3])
    .pipe(
        mergeMap(value => of(value * 2))
    )
    .subscribe({
        next: console.log, // 输出 2, 4, 6
        error: err => console.error(err),
        complete: () => console.log('Completed') // 输出 'Completed'
    });
// 使用from和mergeMap的示例代码（处理Promise）
from(Promise.resolve(1))
    .pipe(
        mergeMap(value => of(value * 2))
    )
    .subscribe({
        next: console.log, // 输出 2
        error: err => console.error(err),
        complete: () => console.log('Completed') // 输出 'Completed'
    });
```
#### 4.5 链式执行
```js
import { Observable, of, from } from "rxjs";
import { tap, mergeMap } from 'rxjs/operators';
// 路由处理函数
function routeHandler(): any {
    console.log('pay...');
    return 'pay';
}
// 第一个日志拦截器
export class Logging1Interceptor {
    async intercept(_, next) {
        console.log('Before1...');
        const now = Date.now();
        return next.handle().pipe(tap(() => {
            console.log(`After1... ${Date.now() - now}ms`);
        }));
    }
}
// 第二个日志拦截器
export class Logging2Interceptor {
    async intercept(_, next) {
        console.log('Before2...');
        const now = Date.now();
        return next.handle().pipe(tap(() => {
            console.log(`After2... ${Date.now() - now}ms`);
        }));
    }
}
// 创建拦截器实例
const logging1Interceptor = new Logging1Interceptor();
const logging2Interceptor = new Logging2Interceptor();
const interceptors = [logging2Interceptor, logging1Interceptor];
// 调用拦截器的函数
function callInterceptors() {
    const nextFn = (i = 0): Observable<any> => {
        if (i >= interceptors.length) {
            const result = routeHandler();
            return result instanceof Promise ? from(result) : of(result);
        }
        const handler = {
            handle: () => nextFn(i + 1),
        };
        const result = interceptors[i].intercept(null, handler);
        return from(result).pipe(mergeMap(res => res instanceof Observable ? res : of(res)));
    };
    return nextFn();
}
// 订阅并打印结果
callInterceptors().subscribe(console.log);
```