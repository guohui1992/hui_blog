## 1.单文件上传
+ [file-upload](https://nestjs.docs-hub.com/techniques/file-upload)
+ 为了处理文件上传，Nest 提供了一个基于 multer 中间件包的内置模块，用于 Express。

+ Multer 处理以 `multipart/form-data` 格式发布的数据，这种格式主要用于通过 HTTP POST 请求上传文件
```shell
npm i -D @types/multer
```
### 1.1. index.ts
src/@nestjs/platform-express/index.ts
```js
export * from './file.interceptor';
```
### 1.2. middleware.interface.ts
src/@nestjs/common/middleware.interface.ts
```js
+import { Request, Response, NextFunction } from 'express';
export interface NestMiddleware {
+   use(req: Request, res: Response, next: NextFunction)
}
```
### 1.3. app.module.ts
src/app.module.ts
```js
import { Module } from "@nestjs/common";
+import { UploadController } from './upload.controller';
@Module({
+   controllers: [UploadController]
})
export class AppModule { }
```
### 1.4. upload.controller.ts
src/upload.controller.ts
```js
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
@Controller('upload')
export class UploadController {
    @Post('file')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        console.log(file);
        return { message: 'File uploaded successfully' };
    }
}
```
### 1.5. file.interceptor.ts
src/@nestjs/platform-express/file.interceptor.ts
```js
// 从 @nestjs/common 导入 Injectable 和 NestInterceptor 装饰器以及 ExecutionContext 接口
import { Injectable, NestInterceptor, ExecutionContext } from '@nestjs/common';
// 导入 multer，用于处理文件上传
import multer from 'multer';
// 从 express 导入 Request 和 Response 类型
import { Request, Response } from 'express';

// 定义一个 FileInterceptor 工厂函数，接收一个文件名参数
export function FileInterceptor(fileName: string) {
    // 使用 @Injectable 装饰器定义一个可注入的类
    @Injectable()
    class FileInterceptor implements NestInterceptor {
        // 实现 NestInterceptor 接口中的 intercept 方法
        async intercept(context: ExecutionContext, next) {
            // 获取当前 HTTP 请求对象
            const request = context.switchToHttp().getRequest<Request>();
            // 获取当前 HTTP 响应对象
            const response = context.switchToHttp().getResponse<Response>();
            // 创建一个 multer 实例
            const upload = multer();
            // 使用 Promise 包装 multer 的单文件上传中间件
            await new Promise<void>((resolve, reject) => {
                upload.single(fileName)(request, response, (err) => (err ? reject(err) : resolve()));
            });
            // 调用 next.handle() 方法，继续处理请求
            return next.handle();
        }
    }
    // 返回一个新的 FileInterceptor 实例
    return new FileInterceptor();
}
```
### 1.6. param.decorator.ts
src/@nestjs/common/param.decorator.ts
```js
import 'reflect-metadata';
export const createParamDecorator = (keyOrFactory: String | Function) => {
    return (data?: any, ...pipes: any[]) => (target: any, propertyKey: string, parameterIndex: number) => {
        const existingParameters = Reflect.getMetadata(`params`, target, propertyKey) ?? [];
        const metatype = Reflect.getMetadata('design:paramtypes', target, propertyKey)[parameterIndex];
        if (keyOrFactory instanceof Function) {
            existingParameters[parameterIndex] = { parameterIndex, key: 'DecoratorFactory', factory: keyOrFactory, data, pipes, metatype };
        } else {
            existingParameters[parameterIndex] = { parameterIndex, key: keyOrFactory, data, pipes, metatype };
        }
        Reflect.defineMetadata(`params`, existingParameters, target, propertyKey);
    }
}
export const Request = createParamDecorator('Request');
export const Req = createParamDecorator('Req');
export const Query = createParamDecorator('Query');
export const Headers = createParamDecorator('Headers');
export const Session = createParamDecorator('Session');
export const Ip = createParamDecorator('Ip');
export const Param = createParamDecorator('Param');
export const Body = createParamDecorator('Body');
export const Response = createParamDecorator('Response');
export const Res = createParamDecorator('Res');
export const Next = createParamDecorator('Next');
+export const UploadedFile = createParamDecorator('File');
```
### 1.7. nest-application.ts
src/@nestjs/core/nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { ForbiddenException, RequestMethod } from '@nestjs/common'
import { APP_FILTER, DECORATOR_FACTORY, APP_PIPE, FORBODDEN_RESOURCE, APP_GUARD } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
import { defineModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
import { PipeTransform } from '@nestjs/common';
import { ExecutionContext } from '../common';
import { CanActivate } from '@nestjs/common';
import { Reflector } from './reflector';
import { Observable, from, mergeMap, of } from 'rxjs';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ArgumentsHost } from '@nestjs/common';
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
    private readonly globalInterceptors = []
    private readonly globalProviderMap = new Map([
        [APP_GUARD, new Map()],
        [APP_PIPE, new Map()],
        [APP_FILTER, new Map()],
        [APP_INTERCEPTOR, new Map()]
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
            const { useClass } = provider;
            if (!instanceMap.has(useClass)) {
                const instance = new useClass(...this.resolveDependencies(useClass));
                instanceMap.set(useClass, instance)
            }
        } else {
            this.addProvider(provider, module)
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
    getInterceptorInstance(interceptor) {
        if (typeof interceptor === 'function') {
            const dependencies = this.resolveDependencies(interceptor);
            return new interceptor(...dependencies);
        }
        return interceptor;
    }
    callInterceptors(controller, method, interceptors, context, host, pipes) {
        const nextFn = (i = 0) => {
            if (i >= interceptors.length) {
+               return from(this.resolveParams(controller, method.name, context, host, pipes))
+                   .pipe(
+                       mergeMap(args => {
+                           const result = method.call(controller, ...args);
+                           return result instanceof Promise ? from(result) : of(result);
+                       })
+                   );
            }
            const handler = {
                handle: () => nextFn(i + 1)
            }
            const interceptorInstance = this.getInterceptorInstance(interceptors[i]);
            const result = interceptorInstance.intercept(context, handler);
            return from(result).pipe(mergeMap(res => res instanceof Observable ? res : of(res)))
        }
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
            const controllerInterceptors = Reflect.getMetadata('interceptors', Controller) ?? [];
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
                const methodInterceptors = Reflect.getMetadata('interceptors', method) ?? [];
                const pipes = [...controllerPipes, ...methodPipes];
                const guards = [...this.globalGuards, ...controllerGuards, ...methodGuards];
                const interceptors = [...this.globalInterceptors, ...controllerInterceptors, ...methodInterceptors];
                defineModule(this.module, methodFilters);
                if (!httpMethod) continue;
                const routePath = path.posix.join('/', prefix, pathMetadata)
                this.app[httpMethod.toLowerCase()](routePath, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
                    const host: ArgumentsHost = {
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
-                       const args = await this.resolveParams(controller, methodName, context, host, pipes);
+                       this.callInterceptors(controller, method, interceptors, context, host, pipes)
                            .subscribe({
                                next: (result) => {
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
                                },
                                error: error => this.callExceptionFilters(error, host, methodFilters, controllerFilters)
                            });
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
    private async resolveParams(instance: any, methodName: string, context, host, pipes: PipeTransform[]) {
        const { getRequest, getResponse, getNext } = context.switchToHttp();
        const req = getRequest();
        const res = getResponse();
        const next = getNext();
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
+               case "File":
+                   value = req.file;
+                   break;
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
    useGlobalInterceptors(...interceptors) {
        this.globalInterceptors.push(...interceptors);
    }
    private initGlobalProviders() {
        for (const [provide, instanceMap] of this.globalProviderMap) {
            switch (provide) {
                case APP_INTERCEPTOR:
                    this.useGlobalInterceptors(...instanceMap.values())
                    break;
                case APP_GUARD:
                    this.useGlobalGuards(...instanceMap.values())
                    break;
                case APP_PIPE:
                    this.useGlobalPipes(...instanceMap.values())
                    break;
                case APP_FILTER:
                    this.useGlobalFilters(...instanceMap.values())
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
## 2.文件验证
通常情况下，验证传入的文件元数据（如文件大小或文件 MIME 类型）是很有用的。

为此，您可以创建自己的 Pipe 并将其绑定到带有 UploadedFile 装饰器的参数。

下面的示例演示了如何实现基本的文件大小验证管道：

### 2.1. file-size-validation.pipe.ts
src/pipes/file-size-validation.pipe.ts
```js
// 从 '@nestjs/common' 导入 PipeTransform, Injectable, ArgumentMetadata 和 BadRequestException
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
// 使用 @Injectable() 装饰器将类标记为可注入的服务
@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
    // 实现 PipeTransform 接口的 transform 方法
    transform(value: any, metadata: ArgumentMetadata) {
        // 定义最大文件大小为 1MB
        const maxSize = 1 * 1024 * 1024; // 1MB
        // 如果文件大小超过最大值，则抛出 BadRequestException 异常
        if (value.size > maxSize) {
            throw new BadRequestException('File size is too large');
        }
        // 返回原始文件值
        return value;
    }
}
```
### 2.2. upload.controller.ts
src/upload.controller.ts
```js
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
+import { FileSizeValidationPipe } from './pipes/file-size-validation.pipe';
@Controller('upload')
export class UploadController {
    @Post('file')
    @UseInterceptors(FileInterceptor('file'))
+   uploadFile(@UploadedFile(FileSizeValidationPipe) file: Express.Multer.File) {
        console.log(file);
        return { message: 'File uploaded successfully' };
    }
}
```
### 2.3. http-exception.ts
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
+       super({ message, error: error ?? "Bad Request", statusCode: HttpStatus.BAD_REQUEST }, HttpStatus.BAD_REQUEST)
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
    constructor(message?, error?) {
        super({ message: message ?? 'Request Timeout', error, statusCode: HttpStatus.REQUEST_TIMEOUT }, HttpStatus.REQUEST_TIMEOUT)
    }
}
```
### 2.4. param.decorator.ts
src/@nestjs/common/param.decorator.ts
```js
import 'reflect-metadata';
export const createParamDecorator = (keyOrFactory: String | Function) => {
    return (data?: any, ...pipes: any[]) => (target: any, propertyKey: string, parameterIndex: number) => {
+       if (data && typeof data !== 'string') {
+           pipes = [data, ...pipes];
+           data = null;
+       }
        const existingParameters = Reflect.getMetadata(`params`, target, propertyKey) ?? [];
        const metatype = Reflect.getMetadata('design:paramtypes', target, propertyKey)[parameterIndex];
        if (keyOrFactory instanceof Function) {
            existingParameters[parameterIndex] = { parameterIndex, key: 'DecoratorFactory', factory: keyOrFactory, data, pipes, metatype };
        } else {
            existingParameters[parameterIndex] = { parameterIndex, key: keyOrFactory, data, pipes, metatype };
        }
        Reflect.defineMetadata(`params`, existingParameters, target, propertyKey);
    }
}
export const Request = createParamDecorator('Request');
export const Req = createParamDecorator('Req');
export const Query = createParamDecorator('Query');
export const Headers = createParamDecorator('Headers');
export const Session = createParamDecorator('Session');
export const Ip = createParamDecorator('Ip');
export const Param = createParamDecorator('Param');
export const Body = createParamDecorator('Body');
export const Response = createParamDecorator('Response');
export const Res = createParamDecorator('Res');
export const Next = createParamDecorator('Next');
export const UploadedFile = createParamDecorator('File');
```
## 3.ParseFilePipe
Nest 提供了一个内置管道来处理常见用例并促进/标准化新用例的添加。这个管道称为 ParseFilePipe

### 3.1. file-validator.interface.ts
src/@nestjs/common/pipes/file/file-validator.interface.ts
```js
// 定义一个导出的接口 `FileValidator`
export interface FileValidator {
    // `validate` 方法，用于验证文件，参数是 `file`，类型为 `any`
    // 返回一个 `Promise` 对象，泛型为 `void`
    validate(file: any): Promise<void>;
}
```
### 3.2. index.ts
src/@nestjs/common/pipes/file/index.ts
```js
export * from './file-type.validator';
export * from './file-validator.interface';
export * from './max-file-size.validator';
export * from './parse-file.pipe';
```
### 3.3. index.ts
src/@nestjs/common/pipes/index.ts
```js
export * from './parse-int.pipe';
export * from './parse-float.pipe';
export * from './parse-bool.pipe';
export * from './parse-array.pipe';
export * from './parse-uuid.pipe';
+export * from './parse-enum.pipe';
+export * from './parse-default.pipe';
+export * from './validation-pipe';
+export * from './file';
```
### 3.4. file-type.validator.ts
src/@nestjs/common/pipes/file/file-type.validator.ts
```js
// 导入 Injectable 和 BadRequestException 模块
import { Injectable, BadRequestException } from '@nestjs/common';
// 导入 FileValidator 接口
import { FileValidator } from './file-validator.interface';
// 定义 FileTypeValidatorOptions 接口，包含 fileType 字符串类型的属性
export interface FileTypeValidatorOptions {
    fileType: string;
}
// 使用 Injectable 装饰器将 FileTypeValidator 声明为可注入的服务
@Injectable()
export class FileTypeValidator implements FileValidator {
    // 通过构造函数注入 FileTypeValidatorOptions
    constructor(private options: FileTypeValidatorOptions) { }
    // 定义异步验证方法 validate，接受文件对象作为参数
    async validate(file: any): Promise<void> {
        // 如果文件的 mimetype 属性不等于预期的文件类型
        if (file.mimetype !== this.options.fileType) {
            // 抛出 BadRequestException 异常，并提示验证失败
            throw new BadRequestException(`Validation failed (expected type is ${this.options.fileType})`);
        }
    }
}
```
### 3.5. max-file-size.validator.ts
src/@nestjs/common/pipes/file/max-file-size.validator.ts
```js
// 从 @nestjs/common 导入 Injectable 和 BadRequestException
import { Injectable, BadRequestException } from '@nestjs/common';
// 导入文件验证器接口
import { FileValidator } from './file-validator.interface';
// 定义一个接口，表示最大文件大小验证器的选项
export interface MaxFileSizeValidatorOptions {
    // 最大文件大小（以字节为单位）
    maxSize: number;
}
// 使用 @Injectable() 装饰器将类标记为可注入的服务
@Injectable()
// 定义 MaxFileSizeValidator 类，实现 FileValidator 接口
export class MaxFileSizeValidator implements FileValidator {
    // 构造函数，接收最大文件大小验证器的选项
    constructor(private options: MaxFileSizeValidatorOptions) { }
    // 异步验证方法，检查文件大小是否超过最大值
    async validate(file: any): Promise<void> {
        // 如果文件大小超过最大值，抛出 BadRequestException 异常
        if (file.size > this.options.maxSize) {
            throw new BadRequestException(`Validation failed (expected size is less than ${this.options.maxSize})`);
        }
    }
}
```
### 3.6. parse-file.pipe.ts
src/@nestjs/common/pipes/file/parse-file.pipe.ts
```js
// 导入Injectable装饰器，PipeTransform接口，BadRequestException异常类
import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

// 导入自定义的FileValidator接口
import { FileValidator } from './file-validator.interface';

// 定义ParseFilePipeOptions接口，包含一个可选的validators属性，类型为FileValidator数组
export interface ParseFilePipeOptions {
    validators?: FileValidator[];
}

// 使用Injectable装饰器标记ParseFilePipe类，使其成为可注入的服务
@Injectable()
export class ParseFilePipe implements PipeTransform {
    // 构造函数，接受一个ParseFilePipeOptions对象，默认值为空对象
    constructor(private options: ParseFilePipeOptions = {}) { }
    // 实现PipeTransform接口的transform方法，用于转换输入值
    async transform(value: any): Promise<any> {
        // 如果输入值为空，抛出BadRequestException异常，提示“没有提交文件”
        if (!value) {
            throw new BadRequestException('No file submitted');
        }
        // 如果options中存在validators数组，则逐个调用每个验证器的validate方法
        if (this.options.validators) {
            for (const validator of this.options.validators) {
                await validator.validate(value);
            }
        }
        // 返回经过验证的输入值
        return value;
    }
}
```
### 3.7. upload.controller.ts
src/upload.controller.ts
```js
+import { Controller, Post, UseInterceptors, UploadedFile, FileTypeValidator, MaxFileSizeValidator, ParseFilePipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { FileSizeValidationPipe } from './pipes/file-size-validation.pipe';
@Controller('upload')
export class UploadController {
    @Post('file')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile(FileSizeValidationPipe) file: Express.Multer.File) {
        console.log(file);
        return { message: 'File uploaded successfully' };
    }
+   @Post('file-validator')
+   @UseInterceptors(FileInterceptor('file'))
+   fileValidator(@UploadedFile(
+       new ParseFilePipe({
+           validators: [
+               new MaxFileSizeValidator({ maxSize: 1024 * 1024 }),
+               new FileTypeValidator({ fileType: 'image/png' }),
+           ],
+       }),
+   )
+   file: Express.Multer.File) {
+       console.log(file);
+       return { message: 'fileValidator' };
+   }
}
```
## 4.文件数组
+ 要上传具有单个字段名称标识的文件数组，请使用 FilesInterceptor() 装饰器（请注意装饰器名称中的复数 Files）。该装饰器接受三个参数：
    + fieldName：如上所述
    + maxCount：定义接受的最大文件数的可选数字
    + options：可选的 MulterOptions 对象，如上所述
### 4.1. upload.controller.ts
src/upload.controller.ts
```js
+import { Controller, Post, UseInterceptors, UploadedFile, FileTypeValidator, MaxFileSizeValidator, ParseFilePipe, UploadedFiles } from '@nestjs/common';
+import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { FileSizeValidationPipe } from './pipes/file-size-validation.pipe';
@Controller('upload')
export class UploadController {
    @Post('file')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile(FileSizeValidationPipe) file: Express.Multer.File) {
        console.log(file);
        return { message: 'File uploaded successfully' };
    }
    @Post('file-validator')
    @UseInterceptors(FileInterceptor('file'))
    fileValidator(@UploadedFile(
        new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 1024 * 1024 }),
                new FileTypeValidator({ fileType: 'image/png' }),
            ],
        }),
    )
    file: Express.Multer.File) {
        console.log(file);
        return { message: 'fileValidator' };
    }
+
+   @Post('files')
+   @UseInterceptors(FilesInterceptor('files', 10))
+   files(@UploadedFiles() files: Array<Express.Multer.File>) {
+       console.log(files);
+       return { message: 'Files uploaded successfully' };
+   }
}
```
### 4.2. file.interceptor.ts
src/@nestjs/platform-express/file.interceptor.ts
```js
+import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import multer from 'multer';
import { Request, Response } from 'express';
export function FileInterceptor(fileName: string) {
    @Injectable()
    class FileInterceptor implements NestInterceptor {
        async intercept(context: ExecutionContext, next) {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
            const upload = multer();
            await new Promise<void>((resolve, reject) => {
                upload.single(fileName)(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
    return new FileInterceptor();
+}
+
+export function FilesInterceptor(fieldName: string, maxCount?: number) {
+   @Injectable()
+   class FilesInterceptor implements NestInterceptor {
+       async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
+           const request = context.switchToHttp().getRequest<Request>();
+           const response = context.switchToHttp().getResponse<Response>();
+           const upload = multer();
+           await new Promise<void>((resolve, reject) => {
+               upload.array(fieldName, maxCount)(request, response, (err) => (err ? reject(err) : resolve()));
+           });
+           return next.handle();
+       }
+   }
+   return new FilesInterceptor();
}
```
### 4.3. param.decorator.ts
src/@nestjs/common/param.decorator.ts
```js
import 'reflect-metadata';
export const createParamDecorator = (keyOrFactory: String | Function) => {
    return (data?: any, ...pipes: any[]) => (target: any, propertyKey: string, parameterIndex: number) => {
        if (data && typeof data !== 'string') {
            pipes = [data, ...pipes];
            data = null;
        }
        const existingParameters = Reflect.getMetadata(`params`, target, propertyKey) ?? [];
        const metatype = Reflect.getMetadata('design:paramtypes', target, propertyKey)[parameterIndex];
        if (keyOrFactory instanceof Function) {
            existingParameters[parameterIndex] = { parameterIndex, key: 'DecoratorFactory', factory: keyOrFactory, data, pipes, metatype };
        } else {
            existingParameters[parameterIndex] = { parameterIndex, key: keyOrFactory, data, pipes, metatype };
        }
        Reflect.defineMetadata(`params`, existingParameters, target, propertyKey);
    }
}
export const Request = createParamDecorator('Request');
export const Req = createParamDecorator('Req');
export const Query = createParamDecorator('Query');
export const Headers = createParamDecorator('Headers');
export const Session = createParamDecorator('Session');
export const Ip = createParamDecorator('Ip');
export const Param = createParamDecorator('Param');
export const Body = createParamDecorator('Body');
export const Response = createParamDecorator('Response');
export const Res = createParamDecorator('Res');
export const Next = createParamDecorator('Next');
export const UploadedFile = createParamDecorator('File');
+export const UploadedFiles = createParamDecorator('Files');
```
### 4.4. nest-application.ts
src/@nestjs/core/nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { ForbiddenException, RequestMethod } from '@nestjs/common'
import { APP_FILTER, DECORATOR_FACTORY, APP_PIPE, FORBODDEN_RESOURCE, APP_GUARD } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
import { defineModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
import { PipeTransform } from '@nestjs/common';
import { ExecutionContext, ArgumentsHost } from '../common';
import { CanActivate } from '@nestjs/common';
import { Reflector } from './reflector';
import { Observable, from, mergeMap, of } from 'rxjs';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
    private readonly globalInterceptors = []
    private readonly globalProviderMap = new Map([
        [APP_GUARD, new Map()],
        [APP_PIPE, new Map()],
        [APP_FILTER, new Map()],
        [APP_INTERCEPTOR, new Map()]
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
                    if (this.isExcluded(req.originalUrl, req.method as RequestMethod)) {
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
            const { useClass } = provider;
            if (!instanceMap.has(useClass)) {
                const instance = new useClass(...this.resolveDependencies(useClass));
                instanceMap.set(useClass, instance)
            }
        } else {
            this.addProvider(provider, module)
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
    getInterceptorInstance(interceptor) {
        if (typeof interceptor === 'function') {
            const dependencies = this.resolveDependencies(interceptor);
            return new interceptor(...dependencies);
        }
        return interceptor;
    }
    callInterceptors(controller, method, interceptors, context, host, pipes) {
        const nextFn = (i = 0) => {
            if (i >= interceptors.length) {
                return from(this.resolveParams(controller, method.name, context, host, pipes))
                    .pipe(
                        mergeMap(args => {
                            console.log('args', args);
                            const result = method.call(controller, ...args);
                            return result instanceof Promise ? from(result) : of(result);
                        })
                    );
            }
            const handler = {
                handle: () => nextFn(i + 1)
            }
            const interceptorInstance = this.getInterceptorInstance(interceptors[i]);
            const result = interceptorInstance.intercept(context, handler);
            return from(result).pipe(mergeMap(res => res instanceof Observable ? res : of(res)))
        }
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
            const controllerInterceptors = Reflect.getMetadata('interceptors', Controller) ?? [];
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
                const methodInterceptors = Reflect.getMetadata('interceptors', method) ?? [];
                const pipes = [...controllerPipes, ...methodPipes];
                const guards = [...this.globalGuards, ...controllerGuards, ...methodGuards];
                const interceptors = [...this.globalInterceptors, ...controllerInterceptors, ...methodInterceptors];
                defineModule(this.module, methodFilters);
                if (!httpMethod) continue;
                const routePath = path.posix.join('/', prefix, pathMetadata)
                this.app[httpMethod.toLowerCase()](routePath, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
                    const host: ArgumentsHost = {
                        switchToHttp: () => ({
                            getRequest: <T>() => req as unknown as T,
                            getResponse: <T>() => res as unknown as T,
                            getNext: <T>() => next as unknown as T,
                        })
                    }
                    const context: ExecutionContext = {
                        ...host,
                        getClass: () => Controller,
                        getHandler: () => method
                    }
                    try {
                        await this.callGuards(guards, context);
                        this.callInterceptors(controller, method, interceptors, context, host, pipes)
                            .subscribe({
                                next: (result) => {
                                    console.log('subscribe.result', result)
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
                                },
                                error: error => this.callExceptionFilters(error, host, methodFilters, controllerFilters)
                            });
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
        console.log(error);
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
    private async resolveParams(instance: any, methodName: string, context, host, pipes: PipeTransform[]) {
        const { getRequest, getResponse, getNext } = context.switchToHttp();
        const req = getRequest();
        const res = getResponse();
        const next = getNext();
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
                case "File":
                    value = req.file;
                    break;
+               case "Files":
+                   value = req.files;
+                   break;
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
    useGlobalInterceptors(...interceptors) {
        this.globalInterceptors.push(...interceptors);
    }
    private initGlobalProviders() {
        for (const [provide, instanceMap] of this.globalProviderMap) {
            switch (provide) {
                case APP_INTERCEPTOR:
                    this.useGlobalInterceptors(...instanceMap.values())
                    break;
                case APP_GUARD:
                    this.useGlobalGuards(...instanceMap.values())
                    break;
                case APP_PIPE:
                    this.useGlobalPipes(...instanceMap.values())
                    break;
                case APP_FILTER:
                    this.useGlobalFilters(...instanceMap.values())
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
## 5.单元测试
+ [testing](https://nestjs.docs-hub.com/fundamentals/testing)
+ 自动化测试被认为是任何严肃的软件开发工作的重要组成部分
+ 这些测试通常涵盖各种类型，包括单元测试、端到端（e2e）测试、集成测试等
```shell
npm i --save-dev @nestjs/testing
npm i --save-dev jest @types/jest ts-jest
```
### 5.1. upload.controller.spec.ts
src/upload.controller.spec.ts
```js
// 导入 Test 和 TestingModule 模块
import { Test, TestingModule } from '@nestjs/testing';
// 导入 UploadController 控制器
import { UploadController } from './upload.controller';
// 描述 UploadController 的测试套件
describe('UploadController', () => {
    // 定义一个 UploadController 类型的变量 uploadController
    let uploadController: UploadController;
    // 在每个测试用例之前运行的异步函数
    beforeEach(async () => {
        // 创建一个测试模块实例，并传入 UploadController 控制器
        const app: TestingModule = await Test.createTestingModule({
            controllers: [UploadController]
        }).compile();
        // 获取测试模块中的 UploadController 实例
        uploadController = app.get<UploadController>(UploadController);
    });
    // 描述 index 方法的测试用例
    describe('index', () => {
        // 定义一个测试用例，期望返回 "hello"
        it('should return "hello"', () => {
            // 断言 uploadController.index() 方法的返回值的 message 属性为 'hello'
            expect(uploadController.index().message).toBe('hello');
        });
    });
});
```
### 5.2. upload.controller.ts
src/upload.controller.ts
```js
+import { Controller, Get, Post, UseInterceptors, UploadedFile, FileTypeValidator, MaxFileSizeValidator, ParseFilePipe, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { FileSizeValidationPipe } from './pipes/file-size-validation.pipe';
@Controller('upload')
export class UploadController {
+   @Get()
+   index() {
+       return { message: 'hello' }
+   }
    @Post('file')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile(FileSizeValidationPipe) file: Express.Multer.File) {
        console.log(file);
        return { message: 'File uploaded successfully' };
    }
    @Post('file-validator')
    @UseInterceptors(FileInterceptor('file'))
    fileValidator(@UploadedFile(
        new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 1024 * 1024 }),
                new FileTypeValidator({ fileType: 'image/png' }),
            ],
        }),
    )
    file: Express.Multer.File) {
        console.log(file);
        return { message: 'fileValidator' };
    }

    @Post('files')
    @UseInterceptors(FilesInterceptor('files', 10))
    files(@UploadedFiles() files: Array<Express.Multer.File>) {
        console.log(files);
        return { message: 'Files uploaded successfully' };
    }
}
```
### 5.3 package.json
package.json
```json
{
  "name": "3.controller",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "ts-node -r tsconfig-paths/register ./src/main.ts",
    "start:dev": "nodemon",
+   "test": "jest"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "@nestjs/common": "^10.3.9",
    "@nestjs/core": "^10.3.9",
    "@nestjs/platform-express": "^10.3.9",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "cli-color": "^2.0.4",
    "express-session": "^1.18.0",
    "jest": "^29.7.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "ts-jest": "^29.2.3",
    "uuid": "^10.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.3.10",
    "@types/jest": "^29.5.12",
    "@types/multer": "^1.4.11",
    "nodemon": "^3.1.3",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.4.5"
  },
+ "jest": {
+   "moduleFileExtensions": [
+     "js",
+     "json",
+     "ts"
+   ],
+   "rootDir": "src",
+   "testRegex": ".*\\.spec\\.ts$",
+   "transform": {
+     "^.+\\.(t|j)s$": "ts-jest"
+   },
+   "collectCoverageFrom": [
+     "**/*.(t|j)s"
+   ],
+   "coverageDirectory": "../coverage",
+   "testEnvironment": "node"
+ }
}
```
## 6.集成测试
```shell
npm install supertest
```
### 6.1 jest-e2e.json
test\jest-e2e.json
```json
{
    // 指定模块文件扩展名
    "moduleFileExtensions": [
        // JavaScript 文件扩展名
        "js",
        // JSON 文件扩展名
        "json",
        // TypeScript 文件扩展名
        "ts"
    ],
    // 根目录设置为当前目录
    "rootDir": ".",
    // 设置测试环境为 Node.js
    "testEnvironment": "node",
    // 使用正则表达式匹配测试文件
    "testRegex": ".e2e-spec.ts$",
    // 配置文件转换器
    "transform": {
        // 使用 ts-jest 转换 TypeScript 和 JavaScript 文件
        "^.+\\.(t|j)s$": "ts-jest"
    }
}
```
### 6.2 upload.controller.e2e-spec.ts
test\upload.controller.e2e-spec.ts
```js
// 从 @nestjs/testing 模块中导入 Test 和 TestingModule
import { Test, TestingModule } from '@nestjs/testing';
// 从 @nestjs/common 模块中导入 INestApplication 接口
import { INestApplication } from '@nestjs/common';
// 从项目的 src 目录中导入 AppModule
import { AppModule } from '../src/app.module';
// 导入路径处理模块 path
import * as path from 'path';
// 导入 supertest 模块
const request = require('supertest');
// 描述 'UploadController' 测试套件
describe('UploadController', () => {
    // 声明一个 INestApplication 类型的变量 app
    let app: INestApplication;
    // 在所有测试之前运行的钩子
    beforeAll(async () => {
        // 创建一个 TestingModule 实例
        const moduleFixture: TestingModule = await Test.createTestingModule({
            // 导入 AppModule
            imports: [AppModule],
        }).compile();
        // 创建一个 Nest 应用实例
        app = moduleFixture.createNestApplication();
        // 初始化应用
        await app.init();
    });
    // 定义一个测试用例，测试 /upload/files 路由
    it('/upload/files', async () => {
        // 发送一个 POST 请求到 /upload/files，包含多个文件
        const response = await request(app.getHttpServer())
            .post('/upload/files')
            // 设置请求头 Content-Type 为 multipart/form-data
            .set('Content-Type', 'multipart/form-data')
            // 附加第一个文件
            .attach('files', path.join(__dirname, 'test-files/file1.txt'))
            // 附加第二个文件
            .attach('files', path.join(__dirname, 'test-files/file2.txt'))
            // 附加第三个文件
            .attach('files', path.join(__dirname, 'test-files/file3.txt'));
        // 断言响应状态码为 201
        expect(response.status).toBe(201);
        // 断言响应体中的 message 为 'Files uploaded successfully'
        expect(response.body.message).toBe('Files uploaded successfully');
    });
    // 在所有测试之后运行的钩子
    afterAll(async () => {
        // 关闭应用
        await app.close();
    });
});
```
## 7.多个文件
### 7.1. upload.controller.ts
src/upload.controller.ts
```js
import { Controller, Get, Post, UseInterceptors, UploadedFile, FileTypeValidator, MaxFileSizeValidator, ParseFilePipe, UploadedFiles } from '@nestjs/common';
+import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { FileSizeValidationPipe } from './pipes/file-size-validation.pipe';
@Controller('upload')
export class UploadController {
    @Get()
    index() {
        return { message: 'hello' }
    }
    @Post('file')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile(FileSizeValidationPipe) file: Express.Multer.File) {
        console.log(file);
        return { message: 'File uploaded successfully' };
    }
    @Post('file-validator')
    @UseInterceptors(FileInterceptor('file'))
    fileValidator(@UploadedFile(
        new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 1024 * 1024 }),
                new FileTypeValidator({ fileType: 'image/png' }),
            ],
        }),
    )
    file: Express.Multer.File) {
        console.log(file);
        return { message: 'fileValidator' };
    }

    @Post('files')
    @UseInterceptors(FilesInterceptor('files', 10))
    files(@UploadedFiles() files: Array<Express.Multer.File>) {
        console.log(files);
        return { message: 'Files uploaded successfully' };
    }
+
+   @Post('fileFields')
+   @UseInterceptors(FileFieldsInterceptor([
+       { name: 'avatar', maxCount: 1 },
+       { name: 'background', maxCount: 1 },
+   ]))
+
+   fileFields(@UploadedFiles() files: { avatar?: Express.Multer.File[], background?: Express.Multer.File[] }) {
+       console.log(files);
+       return { message: 'successfully' };
+   }
}
```
### 7.2. file.interceptor.ts
src/@nestjs/platform-express/file.interceptor.ts
```js
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import multer from 'multer';
import { Request, Response } from 'express';
export function FileInterceptor(fileName: string) {
    @Injectable()
    class FileInterceptor implements NestInterceptor {
        async intercept(context: ExecutionContext, next) {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
            const upload = multer();
            await new Promise<void>((resolve, reject) => {
                upload.single(fileName)(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
    return new FileInterceptor();
}

export function FilesInterceptor(fieldName: string, maxCount?: number) {
    @Injectable()
    class FilesInterceptor implements NestInterceptor {
        async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
+           const upload = multer();
            await new Promise<void>((resolve, reject) => {
                upload.array(fieldName, maxCount)(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
    return new FilesInterceptor();
+}
+
+export function FileFieldsInterceptor(uploadFields: { name: string; maxCount?: number }[]) {
+   @Injectable()
+   class FileFieldsInterceptor implements NestInterceptor {
+       async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
+           const request = context.switchToHttp().getRequest<Request>();
+           const response = context.switchToHttp().getResponse<Response>();
+           const upload = multer();
+           await new Promise<void>((resolve, reject) => {
+               upload.fields(uploadFields)(request, response, (err) => (err ? reject(err) : resolve()));
+           });
+           return next.handle();
+       }
+   }
+   return new FileFieldsInterceptor();
}
```
## 8.任意文件
### 8.1. upload.controller.ts
src/upload.controller.ts
```js
import { Controller, Get, Post, UseInterceptors, UploadedFile, FileTypeValidator, MaxFileSizeValidator, ParseFilePipe, UploadedFiles } from '@nestjs/common';
+import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { FileSizeValidationPipe } from './pipes/file-size-validation.pipe';
@Controller('upload')
export class UploadController {
    @Get()
    index() {
        return { message: 'hello' }
    }
    @Post('file')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile(FileSizeValidationPipe) file: Express.Multer.File) {
        console.log(file);
        return { message: 'File uploaded successfully' };
    }
    @Post('file-validator')
    @UseInterceptors(FileInterceptor('file'))
    fileValidator(@UploadedFile(
        new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 1024 * 1024 }),
                new FileTypeValidator({ fileType: 'image/png' }),
            ],
        }),
    )
    file: Express.Multer.File) {
        console.log(file);
        return { message: 'fileValidator' };
    }

    @Post('files')
    @UseInterceptors(FilesInterceptor('files', 10))
    files(@UploadedFiles() files: Array<Express.Multer.File>) {
        console.log(files);
        return { message: 'Files uploaded successfully' };
    }

    @Post('fileFields')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'avatar', maxCount: 1 },
        { name: 'background', maxCount: 1 },
    ]))

    fileFields(@UploadedFiles() files: { avatar?: Express.Multer.File[], background?: Express.Multer.File[] }) {
        console.log(files);
        return { message: 'successfully' };
    }
+
+   @Post('anyFiles')
+   @UseInterceptors(AnyFilesInterceptor())
+   anyFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
+       console.log(files);
+       return { message: 'successfully' };
+   }
}
```
### 8.2. file.interceptor.ts
src/@nestjs/platform-express/file.interceptor.ts
```js
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import multer from 'multer';
import { Request, Response } from 'express';
export function FileInterceptor(fileName: string) {
    @Injectable()
    class FileInterceptor implements NestInterceptor {
        async intercept(context: ExecutionContext, next) {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
            const upload = multer();
            await new Promise<void>((resolve, reject) => {
                upload.single(fileName)(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
    return new FileInterceptor();
}

export function FilesInterceptor(fieldName: string, maxCount?: number) {
    @Injectable()
    class FilesInterceptor implements NestInterceptor {
        async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
            const upload = multer();
            await new Promise<void>((resolve, reject) => {
                upload.array(fieldName, maxCount)(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
    return new FilesInterceptor();
}

export function FileFieldsInterceptor(uploadFields: { name: string; maxCount?: number }[]) {
    @Injectable()
    class FileFieldsInterceptor implements NestInterceptor {
        async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
            const upload = multer();
            await new Promise<void>((resolve, reject) => {
                upload.fields(uploadFields)(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
    return new FileFieldsInterceptor();
+}
+
+export function AnyFilesInterceptor() {
+   @Injectable()
+   class AnyFilesInterceptor implements NestInterceptor {
+       async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
+           const request = context.switchToHttp().getRequest<Request>();
+           const response = context.switchToHttp().getResponse<Response>();
+           const upload = multer();
+           await new Promise<void>((resolve, reject) => {
+               upload.any()(request, response, (err) => (err ? reject(err) : resolve()));
+           });
+           return next.handle();
+       }
+   }
+   return new AnyFilesInterceptor();
}
```
## 9.无文件
### 9.1. upload.controller.ts
src/upload.controller.ts
```js
import { Controller, Get, Post, UseInterceptors, UploadedFile, FileTypeValidator, MaxFileSizeValidator, ParseFilePipe, UploadedFiles } from '@nestjs/common';
+import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor, AnyFilesInterceptor, NoFilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { FileSizeValidationPipe } from './pipes/file-size-validation.pipe';
@Controller('upload')
export class UploadController {
    @Get()
    index() {
        return { message: 'hello' }
    }
    @Post('file')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile(FileSizeValidationPipe) file: Express.Multer.File) {
        console.log(file);
        return { message: 'File uploaded successfully' };
    }
    @Post('file-validator')
    @UseInterceptors(FileInterceptor('file'))
    fileValidator(@UploadedFile(
        new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 1024 * 1024 }),
                new FileTypeValidator({ fileType: 'image/png' }),
            ],
        }),
    )
    file: Express.Multer.File) {
        console.log(file);
        return { message: 'fileValidator' };
    }

    @Post('files')
    @UseInterceptors(FilesInterceptor('files', 10))
    files(@UploadedFiles() files: Array<Express.Multer.File>) {
        console.log(files);
        return { message: 'Files uploaded successfully' };
    }

    @Post('fileFields')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'avatar', maxCount: 1 },
        { name: 'background', maxCount: 1 },
    ]))

    fileFields(@UploadedFiles() files: { avatar?: Express.Multer.File[], background?: Express.Multer.File[] }) {
        console.log(files);
        return { message: 'successfully' };
    }

+   @Post('any-files')
    @UseInterceptors(AnyFilesInterceptor())
    anyFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
        console.log(files);
        return { message: 'successfully' };
    }
+
+   @Post('no-files')
+   @UseInterceptors(NoFilesInterceptor)
+   @UseInterceptors(AnyFilesInterceptor())
+   noFiles() {
+       return { message: 'No files uploaded' };
+   }
}
```
### 9.2. file.interceptor.ts
src/@nestjs/platform-express/file.interceptor.ts
```js
+import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import multer from 'multer';
import { Request, Response } from 'express';
+import { Observable } from 'rxjs';
export function FileInterceptor(fileName: string) {
    @Injectable()
    class FileInterceptor implements NestInterceptor {
        async intercept(context: ExecutionContext, next) {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
            const upload = multer();
            await new Promise<void>((resolve, reject) => {
                upload.single(fileName)(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
    return new FileInterceptor();
}

export function FilesInterceptor(fieldName: string, maxCount?: number) {
    @Injectable()
    class FilesInterceptor implements NestInterceptor {
        async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
            const upload = multer();
            await new Promise<void>((resolve, reject) => {
                upload.array(fieldName, maxCount)(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
    return new FilesInterceptor();
}

export function FileFieldsInterceptor(uploadFields: { name: string; maxCount?: number }[]) {
    @Injectable()
    class FileFieldsInterceptor implements NestInterceptor {
        async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
            const upload = multer();
            await new Promise<void>((resolve, reject) => {
                upload.fields(uploadFields)(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
    return new FileFieldsInterceptor();
}

export function AnyFilesInterceptor() {
    @Injectable()
    class AnyFilesInterceptor implements NestInterceptor {
        async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
            const upload = multer();
            await new Promise<void>((resolve, reject) => {
                upload.any()(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
    return new AnyFilesInterceptor();
+}
+@Injectable()
+export class NoFilesInterceptor implements NestInterceptor {
+   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
+       const request = context.switchToHttp().getRequest<Request>();
+       if (request.files && request.files.length as number > 0) {
+           throw new BadRequestException('Files are not allowed');
+       }
+       return next.handle();
+   }
}
```
## 10.默认选项
### 10.1. constants.ts
src/@nestjs/platform-express/constants.ts
```js
// 定义一个常量 MULTER_MODULE_OPTIONS，用于表示 multer 模块的选项
export const MULTER_MODULE_OPTIONS = 'MULTER_MODULE_OPTIONS';
```
### 10.2. multer-options.interface.ts
src/@nestjs/platform-express/multer-options.interface.ts
```js
// 定义一个接口 MulterModuleOptions
export interface MulterModuleOptions {
    // 可选属性 dest，类型为字符串
    dest?: string;
}
```
### 10.3. index.ts
src/@nestjs/platform-express/index.ts
```js
export * from './file.interceptor';
export * from './multer.module';
```
### 10.4. app.module.ts
src/app.module.ts
```js
import { Module } from "@nestjs/common";
import { UploadController } from './upload.controller';
+import { MulterModule } from '@nestjs/platform-express';
@Module({
+   imports: [
+       MulterModule.register({
+           dest: './upload',
+       }),
+   ],
    controllers: [UploadController]
})
export class AppModule { }
```
### 10.5. multer-config.service.ts
src/@nestjs/platform-express/multer-config.service.ts
```js
// 从 '@nestjs/common' 模块中导入 Inject 和 Injectable 装饰器
import { Inject, Injectable } from '@nestjs/common';
// 从本地文件 './constants' 中导入 MULTER_MODULE_OPTIONS 常量
import { MULTER_MODULE_OPTIONS } from './constants';
// 从本地文件 './multer-options.interface' 中导入 MulterModuleOptions 接口
import { MulterModuleOptions } from './multer-options.interface';
// 导入 multer 模块
import multer from 'multer';
// 使用 Injectable 装饰器标记 MulterConfigService 类，使其成为可注入的服务
@Injectable()
export class MulterConfigService {
    // 使用构造函数注入 MULTER_MODULE_OPTIONS，并将其赋值给私有成员变量 options
    constructor(
        @Inject(MULTER_MODULE_OPTIONS) private options: MulterModuleOptions,
    ) { }
    // 创建 createMulterOptions 方法，返回配置选项
    createMulterOptions() {
        // 打印 'createMulterOptions' 和当前的配置选项到控制台
        console.log('createMulterOptions', this.options);
        // 返回配置选项
        return this.options;
    }
    // 创建 getMulterInstance 方法，返回 multer 实例
    getMulterInstance() {
        // 调用 createMulterOptions 方法并传递给 multer 以创建并返回 multer 实例
        return multer(this.createMulterOptions());
    }
}
```
### 10.6. multer.module.ts
src/@nestjs/platform-express/multer.module.ts
```js
// 从 '@nestjs/common' 导入 DynamicModule, Global, Module
import { DynamicModule, Global, Module } from '@nestjs/common';
// 从本地文件导入 MulterModuleOptions 接口
import { MulterModuleOptions } from './multer-options.interface';
// 从本地文件导入常量 MULTER_MODULE_OPTIONS
import { MULTER_MODULE_OPTIONS } from './constants';
// 从本地文件导入 MulterConfigService 服务
import { MulterConfigService } from './multer-config.service';
// 将模块声明为全局模块
@Global()
// 使用 @Module 装饰器定义一个空的模块
@Module({})
export class MulterModule {
    // 定义一个静态方法 register，接收 MulterModuleOptions 类型的参数，并返回 DynamicModule
    static register(options: MulterModuleOptions): DynamicModule {
        return {
            // 指定该模块
            module: MulterModule,
            // 定义提供者
            providers: [
                {
                    // 提供 MULTER_MODULE_OPTIONS 令牌
                    provide: MULTER_MODULE_OPTIONS,
                    // 使用传入的 options 值
                    useValue: options,
                },
                // 注册 MulterConfigService 服务
                MulterConfigService,
            ],
            // 导出 MulterConfigService 服务
            exports: [MulterConfigService],
        };
    }
}
```
### 10.7. module.decorator.ts
src/@nestjs/common/module.decorator.ts
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
    defineModule(target, metadata.controllers);
    Reflect.defineMetadata('controllers', metadata.controllers, target);
+   defineProvidersModule(target, metadata.providers);
    Reflect.defineMetadata('providers', metadata.providers, target);
    Reflect.defineMetadata('exports', metadata.exports, target);
    Reflect.defineMetadata('imports', metadata.imports, target);
  }
}
+export function defineProvidersModule(nestModule, providers = []) {
+ defineModule(nestModule,
+   (providers ?? []).map(provider => provider instanceof Function ? provider : provider.useClass)
+     .filter(Boolean));
+}
export function defineModule(nestModule, targets = []) {
  targets.forEach(target => {
    Reflect.defineMetadata('module', nestModule, target);
  })
}
export function Global() {
  return (target: Function) => {
    Reflect.defineMetadata('global', true, target);
  }
}
export interface DynamicModule extends ModuleMetadata {
  module: Function
}
```
### 10.8. file.interceptor.ts
src/@nestjs/platform-express/file.interceptor.ts
```js
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import multer from 'multer';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
+import { MulterConfigService } from './multer-config.service';
export function FileInterceptor(fileName: string) {
    @Injectable()
    class FileInterceptor implements NestInterceptor {
+       constructor(
+           readonly multerConfigService: MulterConfigService
+       ) { }
        async intercept(context: ExecutionContext, next) {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
+           const upload = this.multerConfigService.getMulterInstance().single(fileName);
            await new Promise<void>((resolve, reject) => {
+               upload(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
+   return FileInterceptor;
}

export function FilesInterceptor(fieldName: string, maxCount?: number) {
    @Injectable()
    class FilesInterceptor implements NestInterceptor {
+       constructor(
+           readonly multerConfigService: MulterConfigService
+       ) { }
        async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
+           const upload = this.multerConfigService.getMulterInstance().array(fieldName, maxCount);
            await new Promise<void>((resolve, reject) => {
+               upload(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
+   return FilesInterceptor;
}

export function FileFieldsInterceptor(uploadFields: { name: string; maxCount?: number }[]) {
    @Injectable()
    class FileFieldsInterceptor implements NestInterceptor {
+       constructor(
+           readonly multerConfigService: MulterConfigService
+       ) { }
        async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
+           const upload = this.multerConfigService.getMulterInstance().fields(uploadFields);
            await new Promise<void>((resolve, reject) => {
+               upload(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
+   return FileFieldsInterceptor;
}

export function AnyFilesInterceptor() {
    @Injectable()
    class AnyFilesInterceptor implements NestInterceptor {
+       constructor(
+           readonly multerConfigService: MulterConfigService
+       ) { }
        async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();
+           const upload = this.multerConfigService.getMulterInstance().any();
            await new Promise<void>((resolve, reject) => {
+               upload(request, response, (err) => (err ? reject(err) : resolve()));
            });
            return next.handle();
        }
    }
+   return AnyFilesInterceptor;
}
@Injectable()
export class NoFilesInterceptor implements NestInterceptor {
+   constructor(
+       readonly multerConfigService: MulterConfigService
+   ) { }
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        if (request.files && request.files.length as number > 0) {
            throw new BadRequestException('Files are not allowed');
        }
        return next.handle();
    }
}
```
### 10.9. nest-application.ts
src/@nestjs/core/nest-application.ts
```js
import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { ForbiddenException, RequestMethod } from '@nestjs/common'
import { APP_FILTER, DECORATOR_FACTORY, APP_PIPE, FORBODDEN_RESOURCE, APP_GUARD } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
+import { defineModule, defineProvidersModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
import { PipeTransform } from '@nestjs/common';
import { ExecutionContext, ArgumentsHost } from '../common';
import { CanActivate } from '@nestjs/common';
import { Reflector } from './reflector';
import { Observable, from, mergeMap, of } from 'rxjs';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
    private readonly globalInterceptors = []
    private readonly globalProviderMap = new Map([
        [APP_GUARD, new Map()],
        [APP_PIPE, new Map()],
        [APP_FILTER, new Map()],
        [APP_INTERCEPTOR, new Map()]
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
                    if (this.isExcluded(req.originalUrl, req.method as RequestMethod)) {
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
+       this.addProvider(Reflector, this.module);
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
+               defineProvidersModule(module, newProviders);
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
            const { useClass } = provider;
            if (!instanceMap.has(useClass)) {
                const instance = new useClass(...this.resolveDependencies(useClass));
                instanceMap.set(useClass, instance)
            }
        } else {
            this.addProvider(provider, module)
        }
    }
    private registerProvidersFromModule(module, ...parentModules) {
        const importedProviders = Reflect.getMetadata('providers', module) ?? [];
        const exports = Reflect.getMetadata('exports', module) ?? [];
+       for (let importedProvider of importedProviders) {
+           const exportToken = importedProvider.provide ?? importedProvider;
+           if (exports.includes()) {
+               if (this.isModule(exportToken)) {
+                   this.registerProvidersFromModule(exportToken, module, ...parentModules);
+               } else {
+                   const provider = importedProviders.find(provider => provider === exportToken || provider.provide == exportToken);
+                   if (provider) {
+                       [module, ...parentModules].forEach(module => {
+                           this.processProvider(provider, module);
+                       });
+                   }
                }
+           } else {
+               this.processProvider(importedProvider, module);
            }
        }
        this.initController(module);
    }
    private isModule(exportToken) {
        return exportToken && exportToken instanceof Function && Reflect.getMetadata('isModule', exportToken);
    }
+   addProvider(provider, module) {
+       const global = Reflect.getMetadata('global', module) ?? false;
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
    getInterceptorInstance(interceptor) {
        if (typeof interceptor === 'function') {
            const dependencies = this.resolveDependencies(interceptor);
            return new interceptor(...dependencies);
        }
        return interceptor;
    }
    callInterceptors(controller, method, interceptors, context, host, pipes) {
        const nextFn = (i = 0) => {
            if (i >= interceptors.length) {
                return from(this.resolveParams(controller, method.name, context, host, pipes))
                    .pipe(
                        mergeMap(args => {
                            const result = method.call(controller, ...args);
                            return result instanceof Promise ? from(result) : of(result);
                        })
                    );
            }
            const handler = {
                handle: () => nextFn(i + 1)
            }
            const interceptorInstance = this.getInterceptorInstance(interceptors[i]);
            const result = interceptorInstance.intercept(context, handler);
            return from(result).pipe(mergeMap(res => res instanceof Observable ? res : of(res)))
        }
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
            const controllerInterceptors = Reflect.getMetadata('interceptors', Controller) ?? [];
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
                const methodInterceptors = Reflect.getMetadata('interceptors', method) ?? [];
                const pipes = [...controllerPipes, ...methodPipes];
                const guards = [...this.globalGuards, ...controllerGuards, ...methodGuards];
                const interceptors = [...this.globalInterceptors, ...controllerInterceptors, ...methodInterceptors];
                defineModule(this.module, methodFilters);
                if (!httpMethod) continue;
                const routePath = path.posix.join('/', prefix, pathMetadata)
                this.app[httpMethod.toLowerCase()](routePath, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
                    const host: ArgumentsHost = {
                        switchToHttp: () => ({
                            getRequest: <T>() => req as unknown as T,
                            getResponse: <T>() => res as unknown as T,
                            getNext: <T>() => next as unknown as T,
                        })
                    }
                    const context: ExecutionContext = {
                        ...host,
                        getClass: () => Controller,
                        getHandler: () => method
                    }
                    try {
                        await this.callGuards(guards, context);
                        this.callInterceptors(controller, method, interceptors, context, host, pipes)
                            .subscribe({
                                next: (result) => {
                                    console.log('subscribe.result', result)
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
                                },
                                error: error => this.callExceptionFilters(error, host, methodFilters, controllerFilters)
                            });
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
        console.log(error);
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
    private async resolveParams(instance: any, methodName: string, context, host, pipes: PipeTransform[]) {
        const { getRequest, getResponse, getNext } = context.switchToHttp();
        const req = getRequest();
        const res = getResponse();
        const next = getNext();
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
                case "File":
                    value = req.file;
                    break;
                case "Files":
                    value = req.files;
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
    useGlobalInterceptors(...interceptors) {
        this.globalInterceptors.push(...interceptors);
    }
    private initGlobalProviders() {
        for (const [provide, instanceMap] of this.globalProviderMap) {
            switch (provide) {
                case APP_INTERCEPTOR:
                    this.useGlobalInterceptors(...instanceMap.values())
                    break;
                case APP_GUARD:
                    this.useGlobalGuards(...instanceMap.values())
                    break;
                case APP_PIPE:
                    this.useGlobalPipes(...instanceMap.values())
                    break;
                case APP_FILTER:
                    this.useGlobalFilters(...instanceMap.values())
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
