## 1.decorator

### 1.1 使用stage3装饰器

- [proposal-decorators](https://github.com/tc39/proposal-decorators)
- [typescript-compiling#\_using-newer-typescript-versions](https://code.visualstudio.com/docs/typescript/typescript-compiling#_using-newer-typescript-versions)
- "experimentalDecorators": false // 或者完全移除此标志
- 安装5.x的typescript
- 指定要用于 IntelliSense 的 TypeScript 安装中的 tsserver 和 lib\*.d.ts 文件的文件夹路径，例如：./node_modules/typescript/lib
  - 当作为用户设置指定时，typescript.tsdk 中的 \`TypeScript 版本会自动替换内置的 TypeScript 版本。
  - 当作为工作区设置指定时，typescript.tsdk 允许你使用 TypeScript: Select TypeScript version 命令切换到该工作区版本的 TypeScript 以用于 IntelliSense。

### 1.2 Stage3的装饰器

在 TypeScript 中，Stage 3 装饰器是符合 TC39 提案的新一代装饰器语法。这些装饰器可以应用于类、类的方法、访问器和字段。Stage 3 装饰器提供了一种更加简洁和类型安全的方式来扩展和修改类及其成员的行为。

### 1.3 参数的含义

调用装饰器时，它们接收两个参数：

- **value**：被装饰的值，对于类字段为 undefined。
- **context**：一个包含有关被装饰值信息的上下文对象。

上下文对象的属性包括：

- **kind**：被装饰值的类型，可以是 "class", "method", "getter", "setter", "field", "accessor" 之一。
- **name**：被装饰值的名称。
- **access**：包含访问值的方法的对象（可选），如 get() 和 set(value)。
- **static**：指示值是否是静态类元素（可选）。
- **private**：指示值是否是私有类元素（可选）。
- **addInitializer**：允许添加额外的初始化逻辑的函数。

### 1.4 类方法装饰器

```ts
type ClassMethodDecorator = (value: Function, context: {
    kind: "method";
    name: string | symbol;
    access: { get(): unknown };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
}) => Function | void;
function logged(value, { kind, name }) {
    if (kind === "method") {
        return function (...args) {
            console.log(`starting ${name} with arguments ${args.join(", ")}`);
            const ret = value.call(this, ...args);
            console.log(`ending ${name}`);
            return ret;
        };
    }
}
class Class {
    @logged
    method(arg) { }
}
new Class().method(1);
```

反糖后的代码：

```ts
class Class {
    method(arg) { }
}
function logged(value, { kind, name }) {
    if (kind === "method") {
        return function (...args) {
            console.log(`starting ${name} with arguments ${args.join(", ")}`);
            const ret = value.call(this, ...args);
            console.log(`ending ${name}`);
            return ret;
        };
    }
}
Class.prototype.method = logged(Class.prototype.method, {
    kind: "method",
    name: "m",
}) ?? Class.prototype.method;
new Class().method(1);
export {}
```

### 1.5 类访问器装饰器

```ts
type ClassGetterDecorator = (value: Function, context: {
    kind: "getter";
    name: string | symbol;
    access: { get(): unknown };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
}) => Function | void;

function logged(value, { kind, name }) {
    if (kind === "getter" || kind === "setter") {
        return function (...args) {
            console.log(`starting ${name} with arguments ${args.join(", ")}`);
            const ret = value.call(this, ...args);
            console.log(`ending ${name}`);
            return ret;
        };
    }
}

class Class {
    @logged
    set x(arg) { }
    @logged
    get x(){return 2}
}

let clazz = new Class();
clazz.x = 1;
console.log(clazz.x);
/**
starting x with arguments 1
ending x
starting x with arguments 
ending x
2
*/
export {}
```

反糖后的代码：

```ts
class Class {
    set x(arg) { }
    get x(){return 2}
}

let { set,get } = Object.getOwnPropertyDescriptor(Class.prototype, "x");
console.log(set,get);
function logged(value, { kind, name }) {
    if (kind === "getter" || kind === "setter") {
        return function (...args) {
            console.log(`starting ${name} with arguments ${args.join(", ")}`);
            const ret = value.call(this, ...args);
            console.log(`ending ${name}`);
            return ret;
        };
    }
}
set = logged(set, {
    kind: "setter",
    name: "x",
}) ?? set;
get = logged(get, {
    kind: "getter",
    name: "x",
}) ?? get;
Object.defineProperty(Class.prototype, "x", { set,get });
let clazz = new Class();
clazz.x = 1;
console.log(clazz.x);
export {}
```

### 1.6 类字段装饰器

```ts
type ClassFieldDecorator = (value: undefined, context: {
    kind: "field";
    name: string | symbol;
    access: { get(): unknown, set(value: unknown): void };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
}) => (initialValue: unknown) => unknown | void;

function logged(value, { kind, name }) {
    if (kind === "field") {
        return function (initialValue) {
            console.log(`initializing ${name} with value ${initialValue}`);
            return initialValue;
        };
    }
}

class Class {
    @logged x = 1;
}

new Class();
// initializing x with value 1
export {}
```

反糖后的代码：

```ts
type ClassFieldDecorator = (value: undefined, context: {
    kind: "field";
    name: string | symbol;
    access: { get(): unknown, set(value: unknown): void };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
}) => (initialValue: unknown) => unknown | void;

function logged(value, { kind, name }) {
    if (kind === "field") {
        return function (initialValue) {
            console.log(`initializing ${name} with value ${initialValue}`);
            return initialValue;
        };
    }
}

let initializeX = logged(undefined, {
    kind: "field",
    name: "x"
})

class Class {
    x = initializeX.call(this, 1);
}
export { }
```

### 1.7 类装饰器

```ts
type ClassDecorator = (value: Function, context: {
    kind: "class";
    name: string | undefined;
    addInitializer(initializer: () => void): void;
}) => Function | void;

function logged(value, { kind, name }) {
    if (kind === "class") {
        return class extends value {
            constructor(...args) {
                super(...args);
                console.log(`constructing an instance of ${name} with arguments ${args.join(", ")}`);
            }
        }
    }
}

@logged
class Class { }

new Class();
// constructing an instance of C with arguments 1
export { }
```

反糖后的代码：

```ts
type ClassDecorator = (value: Function, context: {
    kind: "class";
    name: string | undefined;
    addInitializer(initializer: () => void): void;
}) => Function | void;

function logged(value, { kind, name }) {
    if (kind === "class") {
        return class extends value {
            constructor(...args) {
                super(...args);
                console.log(`constructing an instance of ${name} with arguments ${args.join(", ")}`);
            }
        }
    }
}

class Class {}

let NewClass = logged(Class, {
  kind: "class",
  name: "C",
});

new NewClass(1);
export {}
```

### 1.8 类自动访问器装饰器

**类自动访问器**是一种新的类元素类型，它在类字段前添加 accessor 关键字。自动访问器自动为字段创建 getter 和 setter 方法，并默认将值存储在一个私有槽中。

在使用自动访问器时，TypeScript 会自动生成相应的 getter 和 setter

```ts
class C {
  accessor x = 1;
}
```

这段代码会被转译为：

```ts
class C {
  #x = 1; // 使用私有字段存储值

  get x() {
    return this.#x;
  }

  set x(val) {
    this.#x = val;
  }
}
```

```ts
type ClassAutoAccessorDecorator = (
    value: {
        get: () => unknown;
        set(value: unknown);
    },
    context: {
        kind: "accessor";
        name: string | symbol;
        access: { get(): unknown, set(value: unknown): void };
        static: boolean;
        private: boolean;
        addInitializer(initializer: () => void): void;
    }
) => {
    get?: () => unknown;
    set?: (value: unknown) => void;
    init?: (initialValue: unknown) => unknown;
} | void;

function logged(value, { kind, name }) {
    if (kind === "accessor") {
        let { get, set } = value;
        return {
            get() {
                console.log(`getting ${name}`);
                return get.call(this);
            },
            set(val) {
                console.log(`setting ${name} to ${val}`);
                return set.call(this, val);
            },
            init(initialValue) {
                console.log(`initializing ${name} with value ${initialValue}`);
                return initialValue;
            }
        };
    }
}

class Class {
    @logged accessor x = 1;
}

let clazz = new Class();
// initializing x with value 1
clazz.x;
// getting x
clazz.x = 123;
// setting x to 123
export {}
```

反糖后的代码：

```ts
class Class {
    #x = initializeX.call(this, 1);
    get x() {
        return this.#x;
    }
    set x(val) {
        this.#x = val;
    }
}
let { get: oldGet, set: oldSet } = Object.getOwnPropertyDescriptor(Class.prototype, "x");
function logged(value, { kind, name }) {
    if (kind === "accessor") {
        let { get, set } = value;
        return {
            get() {
                console.log(`getting ${name}`);
                return get.call(this);
            },
            set(val) {
                console.log(`setting ${name} to ${val}`);
                return set.call(this, val);
            },
            init(initialValue) {
                console.log(`initializing ${name} with value ${initialValue}`);
                return initialValue;
            }
        };
    }
}
let {
    get: newGet = oldGet,
    set: newSet = oldSet,
    init: initializeX = (initialValue) => initialValue
} = logged(
    { get: oldGet, set: oldSet },
    {
        kind: "accessor",
        name: "x"
    }
) ?? {};
Object.defineProperty(Class.prototype, "x", { get: newGet, set: newSet });
let clazz = new Class();
// initializing x with value 1
clazz.x;
// getting x
clazz.x = 123;
// setting x to 123
export { }
```

### 1.9 addInitializer

addInitializer 是一个允许在类或类成员完成定义后运行额外初始化逻辑的函数。它是装饰器上下文 (context) 对象的一部分，可以用于添加自定义的初始化逻辑。

addInitializer 主要用于以下情况：

1. **额外初始化逻辑**：在类或类成员被完全定义后运行一些额外的初始化代码。
1. **动态行为注入**：为类实例或类本身注入一些动态行为或属性。

#### 1.9.1 类装饰器

类装饰器 withLogging 使用 addInitializer 添加了一个初始化函数，该函数在类的实例化完成后运行。

```ts
type ClassDecoratorContext = {
    kind: "class";
    name: string | undefined;
    addInitializer(initializer: () => void): void;
};
function withLogging(value: Function, {kind,name,addInitializer}) {
    if (kind === "class") {
        addInitializer(function () {
            console.log(`Class ${name} is initialized.`);
        });
    }
}
@withLogging
class MyClass {
    constructor() {
        console.log("Constructor of MyClass called.");
    }
}
// 输出：
// Constructor of MyClass called.
// Class MyClass is initialized.
export { }
```

```ts
import "reflect-metadata";
//context.addInitializer：这个方法允许我们在类实例化时执行一些自定义的初始化逻辑。在这里，我们利用这个方法来设置类实例的属性值。
function inject(_, context) {
  context.addInitializer(function () {
    console.log('this', this);
    context.access.set(this, 2)
  });
}
class C {
  @inject x = 1;
}
let c = new C();
console.log(c);//x=2
export { };
```

#### 1.9.2 方法装饰器

方法装饰器 loggedMethod 使用 addInitializer 添加了一个初始化函数，该函数在方法被定义后运行。

```ts
type MethodDecoratorContext = {
    kind: "method";
    name: string | symbol;
    access: { get(): unknown };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
};
function loggedMethod(value: Function, { kind, name, addInitializer }) {
    if (kind === "method") {
        addInitializer(function () {
            console.log(`Method ${String(name)} has been defined.`);
        });
    }
}
class MyClass {
    @loggedMethod
    myMethod() {
        console.log("myMethod called.");
    }
}
const instance = new MyClass();
instance.myMethod();
// 输出：
// Method myMethod has been defined.
// myMethod called.
export {}
```

### 1.10 access

context 对象包含了一个 access 属性，它提供了用于访问和操作被装饰成员的方法。 具体来说，access 对象包括 get 和 set 方法，用于获取和设置被装饰成员的值。这些方法在不同的装饰器类型中有不同的表现。

```ts
const INJECTIONS = new Map();
function inject(injectionKey: string, className: string) {
  return function (_: any, context: any) {
    if (context.kind === 'field') {
      const newInjection = { injectionKey, set:context.access.set };
      let injections = INJECTIONS.get(className);
      if (injections) {
        injections.push(newInjection);
      } else {
        INJECTIONS.set(className, [newInjection]);
      }
    }
  };
}
class Container {
  private registry = new Map<string, any>();
  register(injectionKey: string, value: any) {
    this.registry.set(injectionKey, value);
  }
  lookup(injectionKey: string) {
    return this.registry.get(injectionKey);
  }
  create<T>(Class: new () => T): T {
    const instance = new Class();
    const injections = INJECTIONS.get(Class.name) || [];
    for (const { injectionKey, set } of injections) {
      set(instance, this.lookup(injectionKey));
    }
    return instance;
  }
}
class Store {constructor(){}}
class Class {
  @inject('store', 'Class') store: Store
}
const container = new Container();
const store = new Store();
container.register('store', store);
const clazz = container.create(Class);
console.log(clazz.store);
console.log(clazz.store === store);
export {};
```

### 1.11 emitDecoratorMetadata

在 TypeScript 中，emitDecoratorMetadata 生成的元数据主要有以下三种：

1. **design:type**：用于属性的类型元数据。
1. **design:paramtypes**：用于构造函数或方法参数的类型元数据。
1. **design:returntype**：用于方法的返回类型元数据。

```ts
import 'reflect-metadata';
// 类装饰器
function classDecorator(target: any) {

}
// 参数装饰器
function paramDecorator(target: any, propertyKey: string, parameterIndex: number) {

}
// 属性装饰器
function propDecorator(target: any, propertyKey: string) {

}
// 方法装饰器
function methodDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {

}
@classDecorator
class Example {
    @propDecorator
    myProperty: string;
    constructor(@paramDecorator serviceA: string, @paramDecorator serviceB: string) {
        console.log('Example instance created');
    }
    @methodDecorator
    myMethod(): string {
        return 'hello';
    }
}
// 获取属性的类型元数据
const propertyType = Reflect.getMetadata('design:type', Example.prototype, 'myProperty');
console.log('Property type:', propertyType.name);
const paramTypes = Reflect.getMetadata('design:paramtypes', Example);
console.log('Constructor param types:', paramTypes.map((type: any) => type.name));
const returnType = Reflect.getMetadata('design:returntype', Example.prototype, 'myMethod');
console.log('Method return type:', returnType.name);
```

**注意事项**

- design:type 适用于属性类型元数据。
- design:paramtypes 适用于构造函数和方法参数类型元数据。
- design:returntype 适用于方法返回类型元数据。

## 2. SOLID原则

SOLID原则是软件设计的指导原则，有助于编写可维护、可扩展和健壮的代码。 SOLID是五个设计原则的缩写，它们分别是：

1. **单一职责原则**（Single Responsibility Principle, SRP）
1. **开闭原则**（Open/Closed Principle, OCP）
1. **里氏替换原则**（Liskov Substitution Principle, LSP）
1. **接口隔离原则**（Interface Segregation Principle, ISP）
1. **依赖倒置原则**（Dependency Inversion Principle, DIP）

### 2.1 单一职责原则（Single Responsibility Principle, SRP）

单一职责原则要求一个类应该只有一个引起变化的原因。换句话说，一个类应该只有一个职责。

```ts
// Not following SRP
class User {
  constructor(public name: string, public email: string) {}

  save() {
    // Save user to database
  }

  sendEmail() {
    // Send welcome email
  }
}
```

```ts
// Following SRP
class User {
  constructor(public name: string, public email: string) {}
}

class UserRepository {
  save(user: User) {
    // Save user to database
  }
}

class EmailService {
  sendWelcomeEmail(user: User) {
    // Send welcome email
  }
}
```

在Nest.js中，这意味着控制器、服务和模块等应当各自负责不同的职责。例如，控制器负责处理HTTP请求，服务负责业务逻辑，模块负责组织代码。

```ts
// user.controller.ts
import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }
}

// user.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  findAll() {
    // 业务逻辑
    return [{ id: 1, name: 'John Doe' }];
  }
}
```

### 2.2. 开闭原则（Open/Closed Principle, OCP）

开闭原则要求软件实体（类、模块、函数等）应该对扩展开放，对修改关闭。也就是说，应通过扩展已有代码的方式来实现新的功能，而不是修改已有的代码。

```ts
// Not following OCP
class Rectangle {
  constructor(public width: number, public height: number) {}
}

class AreaCalculator {
  calculateArea(shape: any) {
    if (shape instanceof Rectangle) {
      return shape.width * shape.height;
    }
    // Add other shapes here...
  }
}
```

```ts
// Following OCP
interface Shape {
  calculateArea(): number;
}

class Rectangle implements Shape {
  constructor(public width: number, public height: number) {}
  calculateArea(): number {
    return this.width * this.height;
  }
}

class Circle implements Shape {
  constructor(public radius: number) {}
  calculateArea(): number {
    return Math.PI * this.radius * this.radius;
  }
}

class AreaCalculator {
  calculateArea(shape: Shape): number {
    return shape.calculateArea();
  }
}
```

在Nest.js中，可以通过继承、装饰器和依赖注入来实现对已有功能的扩展。

```ts
// base.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseService {
  findAll() {
    return ['base item'];
  }
}

// extended.service.ts
import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';

@Injectable()
export class ExtendedService extends BaseService {
  findAll() {
    const items = super.findAll();
    return [...items, 'extended item'];
  }
}
```

### 2.3. 里氏替换原则（Liskov Substitution Principle, LSP）

里氏替换原则要求子类必须能够替换掉它们的基类。这意味着子类应当可以在程序的任何地方替换其父类，并且不会导致程序的错误或行为异常。

```ts
// Not following LSP
class Bird {
  fly() {
    // Bird can fly
  }
}

class Penguin extends Bird {
  fly() {
    throw new Error('Penguins cannot fly');
  }
}
```

```ts
// Following LSP
class Bird {
  move() {
    // Bird can move
  }
}

class FlyingBird extends Bird {
  fly() {
    // Bird can fly
  }
}

class Penguin extends Bird {
  move() {
    // Penguins can move
  }
}
```

在Nest.js中，通过接口和抽象类可以实现里氏替换原则。例如，可以定义一个接口或抽象类，然后在不同的实现类中遵循这个接口或抽象类的契约。

```ts
// logger.interface.ts
export interface Logger {
  log(message: string): void;
}

// console.logger.ts
import { Logger } from './logger.interface';

export class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }
}

// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConsoleLogger } from './console.logger';

@Module({
  controllers: [AppController],
  providers: [
    {
      provide: 'Logger',
      useClass: ConsoleLogger,
    },
  ],
})
export class AppModule {}
```

### 2.4. 接口隔离原则（Interface Segregation Principle, ISP）

接口隔离原则要求类之间的依赖关系应该建立在最小接口上。也就是说，不应该强迫一个类依赖于它不使用的方法。

**示例**：

```ts
// Not following ISP
interface Animal {
  eat(): void;
  fly(): void;
}

class Dog implements Animal {
  eat() {
    // Dog can eat
  }
  fly() {
    // Dog cannot fly, but forced to implement
  }
}
```

```ts
// Following ISP
interface Eater {
  eat(): void;
}

interface Flyer {
  fly(): void;
}

class Dog implements Eater {
  eat() {
    // Dog can eat
  }
}

class Bird implements Eater, Flyer {
  eat() {
    // Bird can eat
  }
  fly() {
    // Bird can fly
  }
}
```

在Nest.js中，通过定义小而专用的接口，可以实现接口隔离原则。

```ts
// auth.interface.ts
export interface AuthService {
  login(username: string, password: string): boolean;
  register(username: string, password: string): boolean;
}

// auth.service.ts
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.interface';

@Injectable()
export class AuthServiceImpl implements AuthService {
  login(username: string, password: string): boolean {
    // 登录逻辑
    return true;
  }
  register(username: string, password: string): boolean {
    // 注册逻辑
    return true;
  }
}
```

### 2.5. 依赖倒置原则（Dependency Inversion Principle, DIP）

依赖倒置原则要求高层模块不应该依赖低层模块，二者都应该依赖于抽象（接口或抽象类）。换句话说，依赖关系应该是通过抽象来实现的，而不是通过具体实现。

示例：

```ts
// Not following DIP
class MySQLDatabase {
  connect() {
    // Connect to MySQL database
  }
}

class UserRepository {
  private database: MySQLDatabase;

  constructor() {
    this.database = new MySQLDatabase();
  }

  save(user: any) {
    this.database.connect();
    // Save user to database
  }
}
```

```ts
// Following DIP
interface Database {
  connect(): void;
}

class MySQLDatabase implements Database {
  connect() {
    // Connect to MySQL database
  }
}

class UserRepository {
  private database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  save(user: any) {
    this.database.connect();
    // Save user to database
  }
}
```

在Nest.js中，通过依赖注入机制可以实现依赖倒置原则。例如，通过在构造函数中注入接口或抽象类，而不是具体实现类。

```ts
// app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.interface';

@Controller('auth')
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  login() {
    return this.authService.login('user', 'pass');
  }
}

// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthServiceImpl } from './auth.service';

@Module({
  controllers: [AppController],
  providers: [
    {
      provide: 'AuthService',
      useClass: AuthServiceImpl,
    },
  ],
})
export class AppModule {}
```

## 3.IOC 和 DI

### 3.1 什么是IOC

IOC（控制反转）Inversion of Control） 是一种设计原则，用于减少代码之间的耦合。传统的编程方式中，程序直接控制其所依赖的对象的创建和管理，而使用 IOC 时，对象的创建和管理权被反转给了容器或框架。程序不再主动创建对象，而是被动接收由容器或框架注入的对象。

### 3.2 什么是 DI

DI（依赖注入）（Dependency Injection）是实现 IOC 的一种手段。通过 DI，我们可以将类的依赖项（即它所需要的对象）注入到类中，而不是在类内部创建这些依赖项。这样可以使得类更加易于测试、维护和扩展。

### 3.3 IOC 和 DI 的关系

IOC 是一个概念，描述的是一种设计原则，而 DI 是实现这个概念的一种方式。通过 DI，可以实现 IOC。

### 3.4 没有使用 IOC 和 DI

在没有使用 IOC 和 DI 的情况下，我们的类直接创建它所依赖的对象：

```ts
class Engine {
  start() {
    console.log('Engine started');
  }
}

class Car {
  private engine: Engine;

  constructor() {
    this.engine = new Engine();
  }

  drive() {
    this.engine.start();
    console.log('Car is driving');
  }
}

// 使用 Car 类
const car = new Car();
car.drive();
```

在这个例子中，Car 类直接依赖 Engine 类，并在构造函数中创建 Engine 的实例。这种方式的问题在于 Car 类和 Engine 类紧耦合，难以进行单元测试和扩展。

### 2.5 构造函数注入

通过构造函数注入，我们可以将 Engine 实例作为参数传递给 Car 类，从而实现依赖注入：

```ts
class Engine {
  start() {
    console.log('Engine started');
  }
}

class Car {
  private engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  drive() {
    this.engine.start();
    console.log('Car is driving');
  }
}

// 使用 Car 类，并注入 Engine 实例
const engine = new Engine();
const car = new Car(engine);
car.drive();
```

通过这种方式，Car 类不再直接创建 Engine 实例，而是接收一个 Engine 实例作为依赖项。这使得 Car 类和 Engine 类之间的耦合度降低。

### 3.6 依赖注入容器

![alt text](image-2.png)
![alt text](image-3.png)

#### 3.6.1 安装

```ts
npm install @types/node  reflect-metadata 
ts-node main.ts
```

#### 3.6.2 main.ts

main.ts

```ts
// 导入 reflect-metadata 库以启用元数据反射
import "reflect-metadata";
// 定义一个 Injectable 装饰器，用于标记可注入的类
function Injectable(): ClassDecorator {
    return (target: Function) => {
        // 这个装饰器不需要执行任何操作，仅用于元数据生成
    };
}
// 使用 Injectable 装饰器标记 Engine 类为可注入
@Injectable()
class Engine {
    // 定义 start 方法，模拟引擎启动
    start() {
        console.log('Engine started');
    }
}
// 使用 Injectable 装饰器标记 Car 类为可注入
@Injectable()
class Car {
    // 通过构造函数注入 Engine 实例
    constructor(private engine: Engine) { }
    // 定义 drive 方法，调用引擎的 start 方法并打印信息
    drive() {
        this.engine.start();
        console.log('Car is driving');
    }
}
// 定义一个依赖注入容器类 DIContainer
class DIContainer {
    // 存储服务的 Map 对象
    private services = new Map<string, any>();
    // 注册服务的方法，将服务的名称和实现类保存到 Map 中
    register<T>(name: string, implementation: new (...args: any[]) => T): void {
        this.services.set(name, implementation);
    }
    // 解析服务的方法，根据名称返回服务的实例
    resolve<T>(name: string): T {
        // 获取服务的实现类
        const implementation = this.services.get(name);
        if (!implementation) {
            throw new Error(`Service ${name} not found`);
        }
        // 获取实现类的构造函数参数类型
        const dependencies = Reflect.getMetadata('design:paramtypes', implementation) || [];
        // 递归解析所有依赖项
        const injections = dependencies.map((dep: any) => this.resolve(dep.name));
        // 创建并返回实现类的实例
        return new implementation(...injections);
    }
}
// 创建依赖注入容器的实例
const container = new DIContainer();
// 注册 Engine 和 Car 服务
container.register('Engine', Engine);
container.register('Car', Car);
// 解析 Car 服务并调用其 drive 方法
const car = container.resolve<Car>('Car');
car.drive();
```

#### 3.6.3 tsconfig.json

tsconfig.json

```ts
{
    "compilerOptions": {
      "emitDecoratorMetadata": true,
      "experimentalDecorators": true,  
    }
}
```

## 参考

### 1.IntelliSense

**IntelliSense** 是 Visual Studio Code（VSCode）中的一项智能代码补全功能。它可以在编写代码时提供各种辅助功能，包括：

1. **代码补全**：在输入代码时，IntelliSense 会根据上下文提供自动补全建议，包括变量、函数、类、模块等。
1. **参数信息**：在调用函数时，IntelliSense 会显示该函数的参数信息，包括参数名称和类型。
1. **快速信息**：悬停在代码元素上时，IntelliSense 会显示相关信息，包括类型、文档注释等。
1. **错误检查**：IntelliSense 会实时检查代码中的语法和类型错误，并提供相应的错误信息和修复建议。

### 2.tsserver

tsserver 是 TypeScript 的一个服务器，它为编辑器提供 TypeScript 和 JavaScript 语言服务。它通过与编辑器通信，提供语法分析、类型检查、代码补全等功能。tsserver 的主要职责包括：

1. **语法和类型分析**：实时分析代码的语法和类型，提供错误检查和代码提示。
1. **项目管理**：管理 TypeScript 项目，包括编译选项、模块解析等。
1. **与编辑器集成**：通过与编辑器（如 VSCode）通信，提供代码补全、参数提示、快速信息等功能。

### 3.typescript.tsdk

typescript.tsdk 是 VSCode 中一个设置选项，它指定了要用于 IntelliSense 的 TypeScript 安装路径。通过配置 typescript.tsdk，可以自定义使用不同版本的 TypeScript。以下是 typescript.tsdk 的两种主要配置方式：

1. **用户设置**：在用户设置中指定 typescript.tsdk 时，VSCode 将使用指定路径下的 TypeScript 版本替换内置的 TypeScript 版本。用户设置适用于所有工作区。
1. **工作区设置**：在工作区设置中指定 typescript.tsdk 时，可以使用 VSCode 的 TypeScript: Select TypeScript version 命令在当前工作区内切换到指定路径下的 TypeScript 版本。工作区设置仅对当前工作区有效。
   配置示例：

```ts
{
  "typescript.tsdk": "./node_modules/typescript/lib"
}
```

通过这种配置，可以确保 VSCode 使用项目中安装的 TypeScript 版本，而不是默认的全局 TypeScript 版本，从而提高代码一致性和开发效率。

## 4. stage

[TC39 过程文档](https://tc39.es/process-document/)
[ECMAScript 提案](https://github.com/tc39/proposals)

ECMAScript 提案阶段

ECMAScript 提案是为了引入 JavaScript 新特性而经过的一系列严格审核和改进的过程。这一过程分为五个阶段，从 0 到 4。每个阶段代表了特性的成熟度和共识程度。以下是每个阶段的详细说明：

### 4.1 阶段 0：设想（Strawman）

- 目的：这是提案的初始阶段，提案只是一个想法。
- 标准：任何人都可以创建提案并向 TC39（负责推动 JavaScript 发展的委员会）展示。
- 示例：新的语法或 API 的想法，开发者或小组认为会对语言有益。
- 目标：收集委员会的初步反馈和兴趣。

### 4.2 阶段 1：提案（Proposal）

- 目的：将想法正式化为更具体的提案。
- 标准：需要一个 TC39 成员支持提案，并且委员会认为该提案值得探索。
- 交付物：
  - 语法和语义的正式描述。
  - 使用示例。
  - 高级 API 和使用场景。
- 目标：确保有足够的兴趣来投入更多的时间和资源。

### 4.3 阶段 2：草案（Draft）

- 目的：提案被细化并发展为一个正式草案。
- 标准：提案必须有完整的规范文本。
- 交付物：
  - 用 ECMAScript 规范语言编写的正式规范文本。
  - 识别潜在问题并考虑边缘情况。
- 目标：验证提案的可行性并细化细节。

### 4.4 阶段 3：候选（Candidate）

- 目的：提案几乎完成，准备实现和测试。
- 标准：提案必须有完整且详细的规范，并且至少有两个实验性实现（例如在浏览器或 Node.js 中）。
- 交付物：
  - 完整的规范文本，由 ECMA 的技术编辑审阅。
  - 实现和来自实际使用的反馈。
  - 将测试用例添加到 Test262 测试套件（JavaScript 合规性测试套件）。
- 目标：确保提案实用、有用，并且不会引入重大问题。

### 4.5 阶段 4：完成（Finished）

- 目的：提案最终确定，可以包含在 ECMAScript 标准中。
- 标准：提案必须由至少两个主要 JavaScript 引擎实现，所有重大问题必须解决。
- 交付物：
  - 最终规范文本。
  - 成功通过 Test262 测试。
- 目标：将提案集成到 ECMAScript 规范中，作为新版本的一部分。

### 4.6 示例：类字段

- 阶段 0：有人建议类中的私有字段可以提高封装性。
- 阶段 1：一个 TC39 成员支持这个想法，并写出详细的提案，包括示例和高级 API。
- 阶段 2：提案包括正式规范，并考虑了边缘情况，例如私有字段与继承的交互。
- 阶段 3：浏览器供应商在他们的引擎中实现私有字段，提案经过实际使用和测试的完善。
- 阶段 4：提案通过所有测试并包含在 ECMAScript 标准中。
