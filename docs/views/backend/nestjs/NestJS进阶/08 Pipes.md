0.重构
定义模块
路由配置
详细告知报错原因
0.1. app2.controller.ts
src/app2.controller.ts

import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service';
@Controller('app2')
export class App2Controller {
   constructor(
      private readonly appService: AppService
   ) { }
   @Get()
   index() {
      return this.appService.getPrefix() + 'app2';
   }
}
0.2. http-exception.filter.ts
src/@nestjs/common/http-exception.filter.ts

import { ArgumentsHost, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from 'express';
export class GlobalHttpExectionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
+       if (response.headersSent) {
+           return
+       }
        if (exception instanceof HttpException) {
            if (typeof exception.getResponse() === 'string') {
                const status: any = exception.getStatus();
                response.status(status).json({
                    statusCode: status,
                    message: exception.getResponse()
                })
            } else {
                response.status(exception.getStatus()).json(exception.getResponse())
            }
        } else {
            return response.status(500).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
+               error: exception.message,
                message: "Internal server error"
            });
        }
    }
}
0.3. module.decorator.ts
src/@nestjs/common/module.decorator.ts

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
+   defineModule(target, (metadata.providers ?? []).map(provider => provider instanceof Function ? provider : provider.useClass).filter(Boolean));
   Reflect.defineMetadata('providers', metadata.providers, target);
   Reflect.defineMetadata('exports', metadata.exports, target);
   Reflect.defineMetadata('imports', metadata.imports, target);
 }
}
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
0.4. nest-application.ts
src/@nestjs/core/nest-application.ts

import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { ArgumentsHost, RequestMethod, GlobalHttpExectionFilter, defineModule, INJECTED_TOKENS, DESIGN_PARAMTYPES } from '@nestjs/common'
import { APP_FILTER } from './constants';
export class NestApplication {
    private readonly app: Express = express()
    private readonly providerInstances = new Map()
    private readonly globalProviders = new Set()
    private readonly moduleProviers = new Map()
    private readonly middlewares = []
    private readonly excludedRoutes = []
    private readonly defaultGlobalHttpExceptionFilter = new GlobalHttpExectionFilter()
    private readonly globalHttpExceptionFilters = []
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
+       this.middlewares.length = 0;
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
    async initProviders() {
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
            console.log('module', module);
            console.log('token', injectedTokens[index] ?? param);
            return this.getProviderByToken(injectedTokens[index] ?? param, module);
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
            const controllerFilters = Reflect.getMetadata('filters', Controller) ?? [];
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
                    try {
                        const args = this.resolveParams(controller, methodName, req, res, next, host);
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
    private resolveParams(instance: any, methodName: string, req: ExpressRequest, res: ExpressResponse, next: NextFunction, host) {
        const paramsMetaData = Reflect.getMetadata(`params`, instance, methodName) ?? [];
        return paramsMetaData.map((paramMetaData) => {
            const { key, data, factory } = paramMetaData;
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
                    return factory(data, host);
                default:
                    return null;
            }
        })
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
    async listen(port) {
        await this.initProviders();
        await this.initMiddlewares();
        await this.initGlobalFilters();
        await this.init();
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:${port}`, 'NestApplication');
        });
    }
}
0.5. app.controller.ts
src/app.controller.ts

+import { Controller, Get } from '@nestjs/common'
+import { AppService } from './app.service';
+@Controller('app')
export class AppController {
+  constructor(
+     private readonly appService: AppService
+  ) { }
+  @Get()
+  index() {
+     return this.appService.getPrefix() + 'app';
   }
}
0.6. app.module.ts
src/app.module.ts

+import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AppController } from './app.controller';
+import { App2Controller } from './app2.controller';
+import { Request, Response, NextFunction } from 'express';
+import { AppService } from './app.service';
+export function logger1(req: Request, res: Response, next: NextFunction) {
+   console.log(`logger1...`);
+   next();
+};
+export function logger2(req: Request, res: Response, next: NextFunction) {
+   console.log(`logger2...`);
+   next();
+};
@Module({
+   controllers: [AppController, App2Controller],
+   providers: [
        {
+           provide: 'PREFIX',
+           useValue: "prefix"
        },
+       AppService
    ]
})
+export class AppModule implements NestModule {
+   configure(consumer: MiddlewareConsumer) {
+       consumer
+           .apply(logger1)
+           .forRoutes(AppController)
+           .apply(logger2)
+           .forRoutes(App2Controller)
+   }
}
0.7. app.service.ts
src/app.service.ts

+import { Inject } from '@nestjs/common';
+export class AppService {
    constructor(
+       @Inject('PREFIX') private readonly prefix: string
+   ) {
    }
+   getPrefix() {
+       return this.prefix
    }
}
1.ParseIntPipe
管道是一个用 @Injectable() 装饰器注释的类，它实现了 PipeTransform 接口。
管道有两个典型的用例：
转换：将输入数据转换为所需的形式（例如，从字符串转换为整数）
验证：评估输入数据，如果有效，则简单地将其传递，否则抛出异常
1.1. pipe-transform.interface.ts
src/@nestjs/common/pipe-transform.interface.ts

export interface PipeTransform<T = any, R = any> {
    transform(value: T, metadata?: any): R;
}
1.2. index.ts
src/@nestjs/common/pipes/index.ts

export * from './parse-int.pipe';
1.3. parse-int.pipe.ts
src/@nestjs/common/pipes/parse-int.pipe.ts

import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
    transform(value: string): number {
        const val = parseInt(value, 10);
        if (isNaN(val)) {
            throw new BadRequestException(`Validation failed. "${value}" is not an integer.`);
        }
        return val;
    }
}
1.4. http-exception.ts
src\@nestjs\common\http-exception.ts

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
+   constructor(message, error?) {
        super({ message, error, statusCode: HttpStatus.BAD_REQUEST }, HttpStatus.BAD_REQUEST)
    }
}
export class ForbiddenException extends HttpException {
    constructor(message, error?) {
        super({ message, error, statusCode: HttpStatus.FORBIDDEN }, HttpStatus.FORBIDDEN)
    }
}
export class BadGateWayException extends HttpException {
    constructor(message, error?) {
        super({ message, error, statusCode: HttpStatus.BAD_GATEWAY }, HttpStatus.BAD_GATEWAY)
    }
}
export class RequestTimeoutException extends HttpException {
    constructor(message, error?) {
        super({ message, error, statusCode: HttpStatus.REQUEST_TIMEOUT }, HttpStatus.REQUEST_TIMEOUT)
    }
}
1.5. index.ts
src/@nestjs/common/index.ts

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
+export * from './pipe-transform.interface';
+export * from './pipes';
1.6. param.decorator.ts
src/@nestjs/common/param.decorator.ts

import 'reflect-metadata';
export const createParamDecorator = (keyOrFactory: String | Function) => {
+   return (data?: any, ...pipes: any[]) => (target: any, propertyKey: string, parameterIndex: number) => {
        const existingParameters = Reflect.getMetadata(`params`, target, propertyKey) ?? [];
        if (keyOrFactory instanceof Function) {
+           existingParameters[parameterIndex] = { parameterIndex, key: 'DecoratorFactory', factory: keyOrFactory, data, pipes };
        } else {
+           existingParameters[parameterIndex] = { parameterIndex, key: keyOrFactory, data, pipes };
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
1.7. nest-application.ts
src/@nestjs/core/nest-application.ts

import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
+import { RequestMethod, PipeTransform } from '@nestjs/common'
import { APP_FILTER } from './constants';
+import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
+import { defineModule } from '../common/module.decorator';
+import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
export class NestApplication {
    private readonly app: Express = express()
    private readonly providerInstances = new Map()
    private readonly globalProviders = new Set()
    private readonly moduleProviers = new Map()
    private readonly middlewares = []
    private readonly excludedRoutes = []
    private readonly defaultGlobalHttpExceptionFilter = new GlobalHttpExectionFilter()
    private readonly globalHttpExceptionFilters = []
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
    async initProviders() {
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
            console.log('module', module);
            console.log('token', injectedTokens[index] ?? param);
            return this.getProviderByToken(injectedTokens[index] ?? param, module);
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
            const controllerFilters = Reflect.getMetadata('filters', Controller) ?? [];
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
                defineModule(this.module, methodFilters);
                if (!httpMethod) continue;
                const routePath = path.posix.join('/', prefix, pathMetadata)
                this.app[httpMethod.toLowerCase()](routePath, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
+                   const host = {
                        switchToHttp: () => ({
                            getRequest: () => req,
                            getResponse: () => res,
                            getNext: () => next,
                        })
                    }
                    try {
+                       const args = await this.resolveParams(controller, methodName, req, res, next, host);
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
    private resolveParams(instance: any, methodName: string, req: ExpressRequest, res: ExpressResponse, next: NextFunction, host) {
        const paramsMetaData = Reflect.getMetadata(`params`, instance, methodName) ?? [];
+       return Promise.all(paramsMetaData.map(async (paramMetaData) => {
+           const { key, data, factory, pipes } = paramMetaData;
+           let value;
            switch (key) {
                case "Request":
                case "Req":
+                   value = req;
+                   break;
                case "Query":
+                   value = data ? req.query[data] : req.query;
+                   break;
                case "Headers":
+                   value = data ? req.headers[data] : req.headers;
+                   break;
+               case "Session":
+                   value = data ? req.session[data] : req.session;
+                   break;
                case 'Ip':
+                   value = req.ip;
+                   break;
                case 'Param':
+                   value = data ? req.params[data] : req.params;
+                   break;
                case 'Body':
+                   value = data ? req.body[data] : req.body;
+                   break;
                case "Response":
                case "Res":
+                   value = res;
+                   break;
                case "Next":
+                   value = next;
+                   break;
                case "DecoratorFactory":
+                   value = factory(data, host);
+                   break;
                default:
+                   value = null;
+                   break;
            }
+           for (const pipe of [...pipes]) {
+               const pipeInstance = await this.resolvePipe(pipe);
+               value = await pipeInstance.transform(value, { type: key, data });
+           }
+           return value;
+       }))
+   }
+   private async resolvePipe(pipe: any): Promise<any> {
+       if (typeof pipe === 'function') {
+           const dependencies = this.resolveDependencies(pipe);
+           return new pipe(...dependencies);
+       }
+       return pipe;
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
    async listen(port) {
        await this.initProviders();
        await this.initMiddlewares();
        await this.initGlobalFilters();
        await this.init();
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:${port}`, 'NestApplication');
        });
    }
}
1.8. app.controller.ts
src/app.controller.ts

+import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common'
@Controller('app')
export class AppController {
+  @Get('number/:id')
+  getNumber(@Param('id', ParseIntPipe) id: number): string {
+     return `The number is ${id}`;
   }
}
1.9. app.module.ts
src/app.module.ts

+import { Module } from "@nestjs/common";
import { AppController } from './app.controller';
@Module({
+   controllers: [AppController],
})
export class AppModule { }
2.ParseFloatPipe
2.1. parse-float.pipe.ts
src/@nestjs/common/pipes/parse-float.pipe.ts

import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseFloatPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = parseFloat(value);
    if (isNaN(val)) {
      throw new BadRequestException(`Validation failed. "${value}" is not a float.`);
    }
    return val;
  }
}
2.2. index.ts
src/@nestjs/common/pipes/index.ts

export * from './parse-int.pipe';
+export * from './parse-float.pipe';
2.3. app.controller.ts
src/app.controller.ts

+import { Controller, Get, Param, ParseIntPipe, ParseFloatPipe } from '@nestjs/common'
@Controller('app')
export class AppController {
   @Get('number/:id')
   getNumber(@Param('id', ParseIntPipe) id: number): string {
      return `The number is ${id}`;
   }
+  @Get('float/:value')
+  getFloat(@Param('value', ParseFloatPipe) value: number): string {
+     return `The float value is ${value}`;
+  }
}
3.ParseBoolPipe
3.1. parse-bool.pipe.ts
src/@nestjs/common/pipes/parse-bool.pipe.ts

import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseBoolPipe implements PipeTransform<string, boolean> {
  transform(value: string): boolean {
    if (value.toLowerCase() === 'true') {
      return true;
    } else if (value.toLowerCase() === 'false') {
      return false;
    } else {
      throw new BadRequestException(`Validation failed. "${value}" is not a boolean.`);
    }
  }
}

3.2. index.ts
src/@nestjs/common/pipes/index.ts

export * from './parse-int.pipe';
export * from './parse-float.pipe';
+export * from './parse-bool.pipe';
3.3. app.controller.ts
src/app.controller.ts

+import { Controller, Get, Param, ParseIntPipe, ParseFloatPipe, ParseBoolPipe } from '@nestjs/common'
@Controller('app')
export class AppController {
   @Get('number/:id')
   getNumber(@Param('id', ParseIntPipe) id: number): string {
      return `The number is ${id}`;
   }
   @Get('float/:value')
   getFloat(@Param('value', ParseFloatPipe) value: number): string {
      return `The float value is ${value}`;
   }
+  @Get('bool/:flag')
+  getBool(@Param('flag', ParseBoolPipe) flag: boolean): string {
+     return `The boolean value is ${flag}`;
+  }
}
4.ParseArrayPipe
4.1. parse-array.pipe.ts
src/@nestjs/common/pipes/parse-array.pipe.ts

import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

interface ParseArrayPipeOptions {
  items: any;
  separator?: string;
}

@Injectable()
export class ParseArrayPipe implements PipeTransform<string, any[]> {
  constructor(private readonly options: ParseArrayPipeOptions) {}

  transform(value: string): any[] {
    if (!value) {
      return [];
    }

    const { items, separator = ',' } = this.options;
    const values = value.split(separator).map(item => {
      if (items === String) {
        return item;
      } else if (items === Number) {
        const val = Number(item);
        if (isNaN(val)) {
          throw new BadRequestException(`Validation failed. "${item}" is not a number.`);
        }
        return val;
      } else if (items === Boolean) {
        if (item.toLowerCase() === 'true') {
          return true;
        } else if (item.toLowerCase() === 'false') {
          return false;
        } else {
          throw new BadRequestException(`Validation failed. "${item}" is not a boolean.`);
        }
      }
    });

    return values;
  }
}

4.2. index.ts
src/@nestjs/common/pipes/index.ts

export * from './parse-int.pipe';
export * from './parse-float.pipe';
export * from './parse-bool.pipe';
+export * from './parse-array.pipe';
4.3. app.controller.ts
src/app.controller.ts

+import { Controller, Get, Param, ParseIntPipe, ParseFloatPipe, ParseBoolPipe, ParseArrayPipe } from '@nestjs/common'
@Controller('app')
export class AppController {
   @Get('number/:id')
   getNumber(@Param('id', ParseIntPipe) id: number): string {
      return `The number is ${id}`;
   }
   @Get('float/:value')
   getFloat(@Param('value', ParseFloatPipe) value: number): string {
      return `The float value is ${value}`;
   }
   @Get('bool/:flag')
   getBool(@Param('flag', ParseBoolPipe) flag: boolean): string {
      return `The boolean value is ${flag}`;
   }
+  @Get('array/:values')
+  getArray(@Param('values', new ParseArrayPipe({ items: String, separator: ',' })) values: string[]): string {
+     return `The array values are ${values.join(', ')}`;
+  }
}
5.ParseUUIDPipe
npm install uuid
5.1. parse-uuid.pipe.ts
src/@nestjs/common/pipes/parse-uuid.pipe.ts

import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { validate as isUUID } from 'uuid';
@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value)) {
      throw new BadRequestException(`Validation failed. "${value}" is not a valid UUID.`);
    }
    return value;
  }
}

5.2. index.ts
src/@nestjs/common/pipes/index.ts

export * from './parse-int.pipe';
export * from './parse-float.pipe';
export * from './parse-bool.pipe';
export * from './parse-array.pipe';
+export * from './parse-uuid.pipe';
5.3. app.controller.ts
src/app.controller.ts

+import { Controller, Get, Param, ParseIntPipe, ParseFloatPipe, ParseBoolPipe, ParseArrayPipe, ParseUUIDPipe } from '@nestjs/common'
@Controller('app')
export class AppController {
   @Get('number/:id')
   getNumber(@Param('id', ParseIntPipe) id: number): string {
      return `The number is ${id}`;
   }
   @Get('float/:value')
   getFloat(@Param('value', ParseFloatPipe) value: number): string {
      return `The float value is ${value}`;
   }
   @Get('bool/:flag')
   getBool(@Param('flag', ParseBoolPipe) flag: boolean): string {
      return `The boolean value is ${flag}`;
   }
   @Get('array/:values')
   getArray(@Param('values', new ParseArrayPipe({ items: String, separator: ',' })) values: string[]): string {
      return `The array values are ${values.join(', ')}`;
   }
+  @Get('uuid/:id')
+  getUuid(@Param('id', ParseUUIDPipe) id: string): string {
+     return `The UUID is ${id}`;
+  }
}
6.ParseEnumPipe
6.1. parse-enum.pipe.ts
src/@nestjs/common/pipes/parse-enum.pipe.ts

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseEnumPipe implements PipeTransform<string, any> {
  constructor(private readonly enumType: any) {}

  transform(value: string): any {
    const enumValues = Object.values(this.enumType);
    if (!enumValues.includes(value)) {
      throw new BadRequestException(`Validation failed. "${value}" is not a valid enum value.`);
    }
    return value;
  }
}

6.2. index.ts
src/@nestjs/common/pipes/index.ts

export * from './parse-int.pipe';
export * from './parse-float.pipe';
export * from './parse-bool.pipe';
export * from './parse-array.pipe';
export * from './parse-uuid.pipe';
+export * from './parse-enum.pipe';
6.3. app.controller.ts
src/app.controller.ts

+import {
+  Controller, Get, Param,
+  ParseIntPipe, ParseFloatPipe, ParseBoolPipe, ParseArrayPipe, ParseUUIDPipe, ParseEnumPipe
+} from '@nestjs/common'
+enum UserRole {
+  Admin = 'Admin',
+  User = 'User',
+}
@Controller('app')
export class AppController {
   @Get('number/:id')
   getNumber(@Param('id', ParseIntPipe) id: number): string {
      return `The number is ${id}`;
   }
   @Get('float/:value')
   getFloat(@Param('value', ParseFloatPipe) value: number): string {
      return `The float value is ${value}`;
   }
   @Get('bool/:flag')
   getBool(@Param('flag', ParseBoolPipe) flag: boolean): string {
      return `The boolean value is ${flag}`;
   }
   @Get('array/:values')
   getArray(@Param('values', new ParseArrayPipe({ items: String, separator: ',' })) values: string[]): string {
      return `The array values are ${values.join(', ')}`;
   }
   @Get('uuid/:id')
   getUuid(@Param('id', ParseUUIDPipe) id: string): string {
      return `The UUID is ${id}`;
   }
+  @Get('role/:role')
+  getRole(@Param('role', new ParseEnumPipe(UserRole)) role: UserRole): string {
+     return `The role is ${role}`;
+  }
}
7.DefaultValuePipe
7.1. default-value.pipe.ts
src/@nestjs/common/pipes/default-value.pipe.ts

import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class DefaultValuePipe implements PipeTransform {
  constructor(private readonly defaultValue: any) {}

  transform(value: any): any {
    return value !== undefined ? value : this.defaultValue;
  }
}
7.2. index.ts
src/@nestjs/common/pipes/index.ts

export * from './parse-int.pipe';
export * from './parse-float.pipe';
export * from './parse-bool.pipe';
export * from './parse-array.pipe';
export * from './parse-uuid.pipe';
export * from './parse-enum.pipe';
+export * from './default-value.pipe';
7.3. app.controller.ts
src/app.controller.ts

import {
+  Controller, Get, Param, Query,
+  ParseIntPipe, ParseFloatPipe, ParseBoolPipe, ParseArrayPipe, ParseUUIDPipe, ParseEnumPipe, DefaultValuePipe
} from '@nestjs/common'
enum UserRole {
   Admin = 'Admin',
   User = 'User',
}
@Controller('app')
export class AppController {
   @Get('number/:id')
   getNumber(@Param('id', ParseIntPipe) id: number): string {
      return `The number is ${id}`;
   }
   @Get('float/:value')
   getFloat(@Param('value', ParseFloatPipe) value: number): string {
      return `The float value is ${value}`;
   }
   @Get('bool/:flag')
   getBool(@Param('flag', ParseBoolPipe) flag: boolean): string {
      return `The boolean value is ${flag}`;
   }
   @Get('array/:values')
   getArray(@Param('values', new ParseArrayPipe({ items: String, separator: ',' })) values: string[]): string {
      return `The array values are ${values.join(', ')}`;
   }
   @Get('uuid/:id')
   getUuid(@Param('id', ParseUUIDPipe) id: string): string {
      return `The UUID is ${id}`;
   }
   @Get('role/:role')
   getRole(@Param('role', new ParseEnumPipe(UserRole)) role: UserRole): string {
      return `The role is ${role}`;
   }
+  @Get('default')
+  getDefault(@Query('name', new DefaultValuePipe('Guest')) name: string): string {
+     return `Hello, ${name}`;
+  }
}
8.自定义管道
8.1. argument-metadata.interface.ts
src/@nestjs/common/argument-metadata.interface.ts

export interface ArgumentMetadata {
    type: 'body' | 'query' | 'param' | 'custom';
    metatype?: new (...args: any[]) => any;
    data?: string;
}

8.2. custom.pipe.ts
src/custom.pipe.ts

import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class CustomPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log(`Value: ${value}, Metadata: ${JSON.stringify(metadata)}`);
    return value;
  }
}

8.3. index.ts
src/@nestjs/common/index.ts

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
+export * from './argument-metadata.interface';
8.4. app.controller.ts
src/app.controller.ts

import {
   Controller, Get, Param, Query,
   ParseIntPipe, ParseFloatPipe, ParseBoolPipe, ParseArrayPipe, ParseUUIDPipe, ParseEnumPipe, DefaultValuePipe
} from '@nestjs/common'
+import { CustomPipe } from './custom.pipe';
enum UserRole {
   Admin = 'Admin',
   User = 'User',
}
@Controller('app')
export class AppController {
   @Get('number/:id')
   getNumber(@Param('id', ParseIntPipe) id: number): string {
      return `The number is ${id}`;
   }
   @Get('float/:value')
   getFloat(@Param('value', ParseFloatPipe) value: number): string {
      return `The float value is ${value}`;
   }
   @Get('bool/:flag')
   getBool(@Param('flag', ParseBoolPipe) flag: boolean): string {
      return `The boolean value is ${flag}`;
   }
   @Get('array/:values')
   getArray(@Param('values', new ParseArrayPipe({ items: String, separator: ',' })) values: string[]): string {
      return `The array values are ${values.join(', ')}`;
   }
   @Get('uuid/:id')
   getUuid(@Param('id', ParseUUIDPipe) id: string): string {
      return `The UUID is ${id}`;
   }
   @Get('role/:role')
   getRole(@Param('role', new ParseEnumPipe(UserRole)) role: UserRole): string {
      return `The role is ${role}`;
   }
   @Get('default')
   getDefault(@Query('name', new DefaultValuePipe('Guest')) name: string): string {
      return `Hello, ${name}`;
   }
+  @Get('custom/:value')
+  getCustom(@Param('value', CustomPipe) value: any): string {
+     return `The custom value is ${value}`;
+  }
}
9.对象架构的验证
npm i --save zod
9.1. use-pipes.decorator.ts
src/@nestjs/common/use-pipes.decorator.ts

import 'reflect-metadata';
import { PipeTransform } from './pipe-transform.interface';
export function UsePipes(...pipes: PipeTransform[]): MethodDecorator & ClassDecorator {
    return (target: object | Function, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<any>) => {
        if (descriptor) {
            Reflect.defineMetadata('pipes', pipes, descriptor.value);
        } else {
            Reflect.defineMetadata('pipes', pipes, target);
        }
    };
}
9.2. create-cat.dto.ts
src/create-cat.dto.ts

// 从 'zod' 库中导入 z 对象
import { z } from 'zod';
// 定义一个名为 createCatSchema 的模式，用于验证猫对象的结构
export const createCatSchema = z
    // 定义一个对象模式
    .object({
        // 定义对象的 name 属性，类型为字符串
        name: z.string(),
        // 定义对象的 age 属性，类型为字符串
        age: z.string()
    })
    // 指定对象中的所有字段都是必填的
    .required();
// 使用 zod 的 infer 方法推导 createCatSchema 的类型，定义一个名为 CreateCatDto 的类型
export type CreateCatDto = z.infer<typeof createCatSchema>;

/**
type CreateCatDto = {
    name: string;
    age: string;
};
 */
9.3. zod-validation.pipe.ts
src/zod-validation.pipe.ts

// 从 '@nestjs/common' 导入 PipeTransform, ArgumentMetadata, 和 BadRequestException
import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
// 从 'zod' 导入 ZodSchema
import { ZodSchema } from 'zod';
// 定义一个 ZodValidationPipe 类，实现 PipeTransform 接口
export class ZodValidationPipe implements PipeTransform {
    // 构造函数，接受一个 ZodSchema 类型的参数并将其存储在私有属性 schema 中
    constructor(private schema: ZodSchema) { }
    // 实现 transform 方法
    // value 是传入的值，metadata 是参数元数据
    transform(value: unknown, metadata: ArgumentMetadata) {
        try {
            // 使用 ZodSchema 进行解析和验证，如果通过则返回解析后的值
            return this.schema.parse(value);
        } catch (error) {
            // 如果解析失败，则抛出 BadRequestException 异常，并显示 'Validation failed' 错误信息
            throw new BadRequestException('Validation failed');
        }
    }
}
9.4. index.ts
src/@nestjs/common/index.ts

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
+export * from './use-pipes.decorator';
9.5. nest-application.ts
src/@nestjs/core/nest-application.ts

import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { PipeTransform, RequestMethod } from '@nestjs/common'
import { APP_FILTER, DECORATOR_FACTORY } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
import { defineModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
export class NestApplication {
    private readonly app: Express = express()
    private readonly providerInstances = new Map()
    private readonly globalProviders = new Set()
    private readonly moduleProviers = new Map()
    private readonly middlewares = []
    private readonly excludedRoutes = []
    private readonly defaultGlobalHttpExceptionFilter = new GlobalHttpExectionFilter()
    private readonly globalHttpExceptionFilters = []
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
    async initProviders() {
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
+           const controllerPipes = Reflect.getMetadata('pipes', Controller) || [];
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
+               const methodPipes = Reflect.getMetadata('pipes', method) || [];
                defineModule(this.module, methodFilters);
+               const pipes = [...controllerPipes, ...methodPipes];
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
                    try {
+                       const args = await this.resolveParams(controller, methodName, req, res, next, host, pipes);
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
+   private async resolveParams(instance: any, methodName: string, req: ExpressRequest, res: ExpressResponse, next: NextFunction, host, pipes: PipeTransform[]) {
        const paramsMetaData = Reflect.getMetadata(`params`, instance, methodName) ?? [];
+       return Promise.all(paramsMetaData.map(async (paramMetaData) => {
            const { key, data, factory, pipes: paramPipes } = paramMetaData;
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
+           for (const pipe of [...pipes, ...paramPipes]) {
                const pipeInstance = this.getPipeInstance(pipe);
                const type = key === DECORATOR_FACTORY ? 'custom' : key.toLowerCase();
                value = await pipeInstance.transform(value, { type, data });
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
    async listen(port) {
        await this.initProviders();
        await this.initMiddlewares();
        await this.initGlobalFilters();
        await this.initController(this.module);
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:3000`);
        });
    }
}

9.6. app.controller.ts
src/app.controller.ts

import {
+  Controller, Get, Param, Query, Body, UsePipes, Post,
   ParseIntPipe,
   ParseFloatPipe,
   ParseBoolPipe,
   ParseArrayPipe,
   ParseUUIDPipe,
   ParseEnumPipe,
   DefaultValuePipe
} from '@nestjs/common';
import { CustomPipe } from './custom.pipe';
+import { CreateCatDto, createCatSchema } from './create-cat.dto';
+import { ZodValidationPipe } from './zod-validation.pipe';
enum Roles {
   Admin = 'Admin',
   VIP = "VIP"
}
@Controller()
export class AppController {
   @Get("number/:id")
   getNumber(@Param('id', ParseIntPipe) id: number) {
      return `The number is ${id}`
   }
   @Get("float/:value")
   getFloat(@Param('value', ParseFloatPipe) value: number) {
      return `The float value is ${value}`
   }
   @Get("bool/:flag")
   getBool(@Param('flag', ParseBoolPipe) flag: boolean) {
      return `The boolean value is ${flag}`
   }
   @Get("array/:values")
   getArray(@Param('values', new ParseArrayPipe({ items: String, separator: '@' })) values: string[]) {
      return `The arra values are ${values}`
   }
   @Get("uuid/:id")
   getUUID(@Param('id', ParseUUIDPipe) id: string) {
      return `The UUID is  ${id}`
   }
   @Get("admin/:role")
   getRole(@Param('role', new ParseEnumPipe(Roles)) role: string) {
      return `The role is  ${role}`
   }
   @Get("default")
   getDefault(@Query('username', new DefaultValuePipe("Guest")) username: string) {
      return `The username is  ${username}`
   }
   @Get("custom/:value")
   getCustom(@Param('value', CustomPipe) value: string, age: number) {
      return `value:  ${value}`
   }
+  @Post('cats')
+  //应用 ZodValidationPipe 管道，使用 createCatSchema 进行数据验证
+  @UsePipes(new ZodValidationPipe(createCatSchema))
+  async createCat(@Body() createCatDto: CreateCatDto): Promise<string> {
+     console.log('Create Cat DTO:', createCatDto);
+     return 'This action adds a new cat';
+  }
}

10.类验证器
npm i --save class-validator class-transformer
10.1. class-validation.pipe.ts
src/class-validation.pipe.ts

// 从nestjs/common中导入所需的装饰器和异常类
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
// 从class-validator中导入验证函数
import { validate } from 'class-validator';
// 从class-transformer中导入plainToInstance函数
import { plainToInstance } from 'class-transformer';
// 将类标记为可注入的依赖项
@Injectable()
export class ClassValidationPipe implements PipeTransform<any> {
    // 实现PipeTransform接口的transform方法
    async transform(value: any, { metatype }: ArgumentMetadata) {
        // 如果没有元数据类型或者不需要验证，则直接返回值
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        // 将普通对象转换为类实例
        const object = plainToInstance(metatype, value);
        // 验证对象
        const errors = await validate(object);
        // 如果有验证错误，抛出BadRequestException
        if (errors.length > 0) {
            throw new BadRequestException('Validation failed');
        }
        // 返回原始值
        return value;
    }
    // 判断是否需要验证
    private toValidate(metatype: Function): boolean {
        // 定义不需要验证的类型数组
        const types: Function[] = [String, Boolean, Number, Array, Object];
        // 如果metatype在types数组中，则不需要验证
        return !types.includes(metatype);
    }
}
10.2. create-user.dto.ts
src/create-user.dto.ts

// 从 'class-validator' 库中导入 IsString 和 IsInt 装饰器
import { IsString, IsInt } from 'class-validator';
// 定义一个名为 CreateUserDto 的类，用于数据传输对象（DTO）
export class CreateUserDto {
    // 使用 IsString 装饰器来验证 name 属性是一个字符串
    @IsString()
    name: string;
    // 使用 IsInt 装饰器来验证 age 属性是一个整数
    @IsInt()
    age: number;
}
10.3. param.decorator.ts
src/@nestjs/common/param.decorator.ts

import 'reflect-metadata';
// 定义一个名为 createParamDecorator 的装饰器工厂函数，接受一个 keyOrFactory 参数
export const createParamDecorator = (keyOrFactory: String | Function) => {
    // 返回一个装饰器函数，接受 data 和可变参数 pipes
    return (data?: any, ...pipes: any[]) => (target: any, propertyKey: string, parameterIndex: number) => {
        // 如果 data 存在且为对象，并且具有 transform 属性，将其作为管道处理
+       if (data && typeof data === 'object' && data.transform) {
+           pipes.unshift(data); // 将 data 插入到 pipes 的最前面
+           data = undefined; // 将 data 置为 undefined
+       }
        // 获取现有的参数元数据，如果不存在则初始化为空数组
        const existingParameters = Reflect.getMetadata(`params`, target, propertyKey) ?? [];
        // 获取参数的元类型
+       const metatype = Reflect.getMetadata('design:paramtypes', target, propertyKey)[parameterIndex];
        // 如果 keyOrFactory 是一个函数，定义装饰器工厂参数
        if (keyOrFactory instanceof Function) {
+           existingParameters[parameterIndex] = { parameterIndex, key: 'DecoratorFactory', factory: keyOrFactory, data, pipes, metatype };
        } else {
            // 否则，定义普通的装饰器参数
+           existingParameters[parameterIndex] = { parameterIndex, key: keyOrFactory, data, pipes, metatype };
        }
        // 将参数元数据定义到目标方法上
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
10.4. nest-application.ts
src/@nestjs/core/nest-application.ts

import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { PipeTransform, RequestMethod } from '@nestjs/common'
import { APP_FILTER, DECORATOR_FACTORY } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
import { defineModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
export class NestApplication {
    private readonly app: Express = express()
    private readonly providerInstances = new Map()
    private readonly globalProviders = new Set()
    private readonly moduleProviers = new Map()
    private readonly middlewares = []
    private readonly excludedRoutes = []
    private readonly defaultGlobalHttpExceptionFilter = new GlobalHttpExectionFilter()
    private readonly globalHttpExceptionFilters = []
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
    async initProviders() {
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
                defineModule(this.module, methodFilters);
                const pipes = [...controllerPipes, ...methodPipes];
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
                    try {
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
+           const { key, data, factory, pipes: paramPipes, metatype } = paramMetaData;
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
            for (const pipe of [...pipes, ...paramPipes]) {
                const pipeInstance = this.getPipeInstance(pipe);
                const type = key === DECORATOR_FACTORY ? 'custom' : key.toLowerCase();
+               value = await pipeInstance.transform(value, { type, data, metatype });
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
    async listen(port) {
        await this.initProviders();
        await this.initMiddlewares();
        await this.initGlobalFilters();
        await this.initController(this.module);
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:3000`);
        });
    }
}

10.5. app.controller.ts
src/app.controller.ts

import {
   Controller, Get, Param, Query, Body, UsePipes, Post,
   ParseIntPipe,
   ParseFloatPipe,
   ParseBoolPipe,
   ParseArrayPipe,
   ParseUUIDPipe,
   ParseEnumPipe,
   DefaultValuePipe
} from '@nestjs/common';
import { CustomPipe } from './custom.pipe';
import { CreateCatDto, createCatSchema } from './create-cat.dto';
import { ZodValidationPipe } from './zod-validation.pipe';
+import { ClassValidationPipe } from './class-validation.pipe';
+import { CreateUserDto } from './create-user.dto';
enum Roles {
   Admin = 'Admin',
   VIP = "VIP"
}
@Controller()
export class AppController {
   @Get("number/:id")
   getNumber(@Param('id', ParseIntPipe) id: number) {
      return `The number is ${id}`
   }
   @Get("float/:value")
   getFloat(@Param('value', ParseFloatPipe) value: number) {
      return `The float value is ${value}`
   }
   @Get("bool/:flag")
   getBool(@Param('flag', ParseBoolPipe) flag: boolean) {
      return `The boolean value is ${flag}`
   }
   @Get("array/:values")
   getArray(@Param('values', new ParseArrayPipe({ items: String, separator: '@' })) values: string[]) {
      return `The arra values are ${values}`
   }
   @Get("uuid/:id")
   getUUID(@Param('id', ParseUUIDPipe) id: string) {
      return `The UUID is  ${id}`
   }
   @Get("admin/:role")
   getRole(@Param('role', new ParseEnumPipe(Roles)) role: string) {
      return `The role is  ${role}`
   }
   @Get("default")
   getDefault(@Query('username', new DefaultValuePipe("Guest")) username: string) {
      return `The username is  ${username}`
   }
   @Get("custom/:value")
   getCustom(@Param('value', CustomPipe) value: string, age: number) {
      return `value:  ${value}`
   }
   @Post('cats')
   @UsePipes(new ZodValidationPipe(createCatSchema))
   async createCat(@Body() createCatDto: CreateCatDto): Promise<string> {
      console.log('Create Cat DTO:', createCatDto);
      return 'This action adds a new cat';
   }
+  @Post('user/create')
+  async userCreate(@Body(new ClassValidationPipe()) createUserDto: CreateUserDto) {
+     console.log('createUserDto', createUserDto);
+     return 'This action adds a new user';
+  }
}
11.全局范围管道
由于 ValidationPipe 被创建为尽可能通用，我们可以通过将其设置为全局范围管道来充分利用其效用，从而将其应用于整个应用程序中的每个路由处理程序。

11.1. validation-pipe.ts
src/@nestjs/common/pipes/validation-pipe.ts

// 从 @nestjs/common 导入 PipeTransform, Injectable, ArgumentMetadata, BadRequestException
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
// 从 class-validator 导入 validate, ValidationError
import { validate, ValidationError } from 'class-validator';
// 从 class-transformer 导入 plainToInstance
import { plainToInstance } from 'class-transformer';
// 声明这个类是一个可注入的服务
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
    // 实现 transform 方法，该方法是管道的核心逻辑
    async transform(value: any, { metatype }: ArgumentMetadata) {
        // 如果没有元类型或者元类型不需要验证，则直接返回值
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        // 将普通对象转换为类实例
        const object = plainToInstance(metatype, value);
        // 验证对象
        const errors = await validate(object);
        // 如果存在验证错误，抛出 BadRequestException 异常
        if (errors.length > 0) {
            throw new BadRequestException(this.formatErrors(errors));
        }
        // 如果验证通过，返回值
        return value;
    }
    // 检查给定的元类型是否需要验证
    private toValidate(metatype: Function): boolean {
        // 需要排除的原生类型
        const types: Function[] = [String, Boolean, Number, Array, Object];
        // 如果元类型在排除列表中，则不需要验证
        return !types.includes(metatype);
    }
    // 格式化验证错误信息
    private formatErrors(errors: ValidationError[]) {
        // 将每个错误信息格式化为字符串，并用逗号分隔
        return errors
            .map(err => {
                for (const property in err.constraints) {
                    return `${err.property} - ${err.constraints[property]}`;
                }
            })
            .join(', ');
    }
}

11.2. index.ts
src/@nestjs/common/pipes/index.ts

export * from './parse-int.pipe';
export * from './parse-float.pipe';
export * from './parse-bool.pipe';
export * from './parse-array.pipe';
export * from './parse-uuid.pipe';
export * from './parse-enum.pipe';
export * from './parse-default.pipe';
+export * from './validation-pipe';
11.3. nest-application.ts
src/@nestjs/core/nest-application.ts

import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { PipeTransform, RequestMethod } from '@nestjs/common'
import { APP_FILTER, DECORATOR_FACTORY } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
import { defineModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
export class NestApplication {
    private readonly app: Express = express()
    private readonly providerInstances = new Map()
    private readonly globalProviders = new Set()
    private readonly moduleProviers = new Map()
    private readonly middlewares = []
    private readonly excludedRoutes = []
    private readonly defaultGlobalHttpExceptionFilter = new GlobalHttpExectionFilter()
    private readonly globalHttpExceptionFilters = []
+   private readonly globalPipes: PipeTransform[] = [];
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
    async initProviders() {
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
                defineModule(this.module, methodFilters);
                const pipes = [...controllerPipes, ...methodPipes];
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
                    try {
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
+           for (const pipe of [...this.globalPipes, ...pipes, ...paramPipes]) {
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
+   useGlobalPipes(...pipes: PipeTransform[]): void {
+       this.globalPipes.push(...pipes);
+   }
    async listen(port) {
        await this.initProviders();
        await this.initMiddlewares();
        await this.initGlobalFilters();
        await this.initController(this.module);
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:3000`);
        });
    }
}

11.4. app.controller.ts
src/app.controller.ts

import {
   Controller, Get, Param, Query, Body, UsePipes, Post,
   ParseIntPipe,
   ParseFloatPipe,
   ParseBoolPipe,
   ParseArrayPipe,
   ParseUUIDPipe,
   ParseEnumPipe,
   DefaultValuePipe
} from '@nestjs/common';
import { CustomPipe } from './custom.pipe';
import { CreateCatDto, createCatSchema } from './create-cat.dto';
import { ZodValidationPipe } from './zod-validation.pipe';
import { ClassValidationPipe } from './class-validation.pipe';
import { CreateUserDto } from './create-user.dto';
enum Roles {
   Admin = 'Admin',
   VIP = "VIP"
}
@Controller()
export class AppController {
   @Get("number/:id")
   getNumber(@Param('id', ParseIntPipe) id: number) {
      return `The number is ${id}`
   }
   @Get("float/:value")
   getFloat(@Param('value', ParseFloatPipe) value: number) {
      return `The float value is ${value}`
   }
   @Get("bool/:flag")
   getBool(@Param('flag', ParseBoolPipe) flag: boolean) {
      return `The boolean value is ${flag}`
   }
   @Get("array/:values")
   getArray(@Param('values', new ParseArrayPipe({ items: String, separator: '@' })) values: string[]) {
      return `The arra values are ${values}`
   }
   @Get("uuid/:id")
   getUUID(@Param('id', ParseUUIDPipe) id: string) {
      return `The UUID is  ${id}`
   }
   @Get("admin/:role")
   getRole(@Param('role', new ParseEnumPipe(Roles)) role: string) {
      return `The role is  ${role}`
   }
   @Get("default")
   getDefault(@Query('username', new DefaultValuePipe("Guest")) username: string) {
      return `The username is  ${username}`
   }
   @Get("custom/:value")
   getCustom(@Param('value', CustomPipe) value: string, age: number) {
      return `value:  ${value}`
   }
   @Post('cats')
   @UsePipes(new ZodValidationPipe(createCatSchema))
   async createCat(@Body() createCatDto: CreateCatDto): Promise<string> {
      console.log('Create Cat DTO:', createCatDto);
      return 'This action adds a new cat';
   }
   @Post('user/create')
   async userCreate(@Body(new ClassValidationPipe()) createUserDto: CreateUserDto) {
      console.log('createUserDto', createUserDto);
      return 'This action adds a new user';
   }
+  @Post('users/create/global')
+  async createGlobalUser(@Body() createUserDto: CreateUserDto): Promise<string> {
+     console.log('Global Create User DTO:', createUserDto);
+     return 'This action adds a new user globally';
+  }
}

11.5. main.ts
src/main.ts

import { NestFactory } from "@nestjs/core";
import { AppModule } from './app.module';
+import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
+   app.useGlobalPipes(new ValidationPipe());
    await app.listen(3000);
}
bootstrap();
12.注入依赖
12.1. constants.ts
src/@nestjs/core/constants.ts

export const APP_FILTER = 'APP_FILTER'
export const DECORATOR_FACTORY = 'DECORATOR_FACTORY';
+export const APP_PIPE = 'APP_PIPE';
12.2. nest-application.ts
src/@nestjs/core/nest-application.ts

import 'reflect-metadata';
import express, { Express, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'
import { Logger } from "./logger";
import path from 'path'
import { PipeTransform, RequestMethod } from '@nestjs/common'
+import { APP_FILTER, DECORATOR_FACTORY, APP_PIPE } from './constants';
import { INJECTED_TOKENS, DESIGN_PARAMTYPES } from '../common/constants';
import { defineModule } from '../common/module.decorator';
import { GlobalHttpExectionFilter } from '../common/http-exception.filter';
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
    async initProviders() {
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
                defineModule(this.module, methodFilters);
                const pipes = [...controllerPipes, ...methodPipes];
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
                    try {
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
+   private initGlobalPipes() {
+       const providers = Reflect.getMetadata('providers', this.module) || [];
+       for (const provider of providers) {
+           if (provider.provide === APP_PIPE) {
+               const instance = this.getProviderByToken(APP_PIPE, this.module);
+               this.useGlobalPipes(instance);
+           }
+       }
+   }
    async listen(port) {
        await this.initProviders();
        await this.initMiddlewares();
        await this.initGlobalFilters();
+       await this.initGlobalPipes();
        await this.initController(this.module);
        this.app.listen(port, () => {
            Logger.log(`Application is running on http://localhost:3000`);
        });
    }
}

12.3. app.module.ts
src/app.module.ts

+import { Module, ValidationPipe } from "@nestjs/common";
import { AppController } from './app.controller';
+import { APP_PIPE } from '@nestjs/core';
@Module({
+   controllers: [AppController],
+   providers: [
+       {
+           provide: APP_PIPE,
+           useClass: ValidationPipe,
+       }
+   ]
})
export class AppModule { }
12.4. main.ts
src/main.ts

import { NestFactory } from "@nestjs/core";
import { AppModule } from './app.module';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
}
bootstrap();
参考
1.zod
Zod 是一个用于 TypeScript 和 JavaScript 的声明式模式验证库，提供了一种简单而灵活的方法来定义和验证数据结构。与其他验证库相比，Zod 的设计更加轻量级和直观。下面是对 Zod 的详细讲解：

1.1 安装
可以使用 npm 或 yarn 安装 Zod：

npm install zod
# or
yarn add zod
1.2 基本用法
Zod 允许你定义模式（schema），然后使用这些模式来验证数据。

1.2.1 定义模式
你可以使用 Zod 的各种方法来定义不同类型的模式。例如：

import { z } from 'zod';

// 定义一个字符串模式
const stringSchema = z.string();

// 定义一个数字模式
const numberSchema = z.number();
1.2.2 验证数据
定义了模式后，可以使用 parse 方法来验证数据。数据验证成功时返回数据本身，否则会抛出错误。

const result1 = stringSchema.parse("hello"); // "hello"
const result2 = numberSchema.parse(42);      // 42

try {
  stringSchema.parse(123); // throws ZodError
} catch (e) {
  console.error(e.errors); // 输出错误信息
}
1.3 复杂模式
Zod 支持定义复杂的嵌套结构，包括对象、数组、联合类型等。

1.3.1 对象模式
const personSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

const person = {
  name: "John",
  age: 30,
  email: "john@example.com",
};

personSchema.parse(person); // 验证通过
1.3.2 数组模式
const numberArraySchema = z.array(z.number());

numberArraySchema.parse([1, 2, 3]); // 验证通过
1.3.3 联合类型
const stringOrNumberSchema = z.union([z.string(), z.number()]);

stringOrNumberSchema.parse("hello"); // 验证通过
stringOrNumberSchema.parse(42);      // 验证通过
1.3.4 枚举类型
const Color = z.enum(["Red", "Green", "Blue"]);

Color.parse("Red"); // 验证通过
1.4 其他功能
1.4.1 可选属性
使用 optional 方法可以定义可选属性：

const optionalStringSchema = z.string().optional();

optionalStringSchema.parse("hello"); // "hello"
optionalStringSchema.parse(undefined); // undefined
1.4.2 默认值
使用 default 方法可以为属性设置默认值：

const defaultStringSchema = z.string().default("default value");

defaultStringSchema.parse(undefined); // "default value"
1.4.3 自定义验证
你可以使用 refine 方法添加自定义验证逻辑：

const positiveNumberSchema = z.number().refine(val => val > 0, {
  message: "必须是正数",
});

positiveNumberSchema.parse(10); // 验证通过
positiveNumberSchema.parse(-5); // throws ZodError
1.5 总结
Zod 是一个功能强大且灵活的模式验证库，适用于 TypeScript 和 JavaScript 项目。它的 API 设计直观，易于使用，并且支持多种数据结构的验证，包括对象、数组、枚举和联合类型等。通过 Zod，你可以轻松定义和验证数据结构，确保数据的完整性和正确性。

2.class-validator
class-validator 是一个用于在 TypeScript 和 JavaScript 中执行对象验证的库。它通常用于验证传入的请求数据，以确保数据格式和内容符合预期。

2.1 主要功能
声明式验证：通过装饰器在类属性上定义验证规则。
内置验证器：提供多种内置验证器，如 IsString、IsInt、IsEmail 等。
自定义验证器：可以创建自定义验证器来满足特定需求。
2.2 常用装饰器
@IsString()：验证值是否为字符串。
@IsInt()：验证值是否为整数。
@IsEmail()：验证值是否为有效的电子邮件地址。
@Length(min, max)：验证字符串长度是否在指定范围内。
2.3 示例代码
import { IsString, IsInt, validate } from 'class-validator';

class CreateUserDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;
}

const user = new CreateUserDto();
user.name = "John";
user.age = 25;

validate(user).then(errors => {
  if (errors.length > 0) {
    console.log("Validation failed. errors: ", errors);
  } else {
    console.log("Validation succeed");
  }
});
3. class-transformer
class-transformer 是一个用于在类和普通对象之间进行转换的库。它通常与 class-validator 一起使用，以便在验证之前将请求数据转换为类实例。

3.1 主要功能
普通对象到类实例的转换：将 JSON 对象转换为指定类的实例。
类实例到普通对象的转换：将类实例转换为普通对象，通常用于序列化输出。
转换装饰器：通过装饰器指定转换规则，如忽略某些属性、重命名属性等。
3.2 常用装饰器
@Type(() => Type)：指定属性的类型，用于对象嵌套转换。
@Exclude()：在转换过程中排除属性。
@Expose()：明确标记属性以便在转换过程中包含。
3.3 示例代码
import { plainToInstance, instanceToPlain } from 'class-transformer';

class User {
  name: string;
  age: number;
}

const plainUser = { name: "John", age: 25 };

// 将普通对象转换为 User 类实例
const user = plainToInstance(User, plainUser);
console.log(user instanceof User); // true

// 将 User 类实例转换为普通对象
const plainObject = instanceToPlain(user);
console.log(plainObject); // { name: 'John', age: 25 }
3.4 综合示例
在 NestJS 中，class-validator 和 class-transformer 通常结合使用来验证和转换请求数据。以下是一个综合示例，展示如何在控制器中使用它们：

DTO 类

import { IsString, IsInt } from 'class-validator';
class CreateUserDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;
}
控制器

import { Controller, Post, Body } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Controller('users')
export class UserController {
  @Post('create')
  async createUser(@Body() createUserDto: any) {
    const user = plainToInstance(CreateUserDto, createUserDto);
    await validateOrReject(user);
    // 如果验证成功，继续处理
    return 'User created';
  }
}
import { IsString, IsInt } from 'class-validator';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';

class CreateUserDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;
}
const createUserDto = { name: "John", age: '2' };
const user = plainToInstance(CreateUserDto, createUserDto);
async function validate() {
    try{
        await validateOrReject(user);
    }catch(error){
        console.log(error);
    }
}
validate();