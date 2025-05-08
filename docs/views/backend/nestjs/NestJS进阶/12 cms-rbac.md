1. 创建项目
nestjs
mysql
navicat-for-mysql
npm i @nestjs/cli -g
nest new cms
2.创建模块
nest generate module admin
nest generate module api
nest generate module shared
2.1. api.module.ts
src/api/api.module.ts

import { Module } from '@nestjs/common';
@Module({})
export class ApiModule {}
2.2. admin.module.ts
src/admin/admin.module.ts

import { Module } from '@nestjs/common';
@Module({})
export class AdminModule {}
2.3. shared.module.ts
src/shared/shared.module.ts

import { Global, Module } from '@nestjs/common';
@Global()
@Module({})
export class SharedModule { }
2.4. app.module.ts
src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
+import { AdminModule } from './admin/admin.module';
+import { ApiModule } from './api/api.module';
+import { SharedModule } from './shared/shared.module';
@Module({
+ imports: [AdminModule, ApiModule, SharedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
2.5. .eslintrc.js
.eslintrc.js

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
+   'linebreak-style': ['error', 'auto'],
  },
};
3. 支持会话
3.1 安装
npm install express-session cookie-parser @nestjs/platform-express
3.2. main.ts
src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
+import * as session from 'express-session';
+import * as cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
+ app.use(cookieParser());
+ app.use(session({
+   secret: 'secret-key',
+   resave: true,
+   saveUninitialized: true,
+   cookie: {
+     maxAge: 1000 * 60 * 60 * 24 * 7,
+   },
+ }));
  await app.listen(3000);
}
bootstrap();
4. 支持模板
Bootstrap
布局类

类名	介绍
container	设置响应式容器，中心对齐并添加填充。
container-fluid	设置响应式全宽容器。
row	设置行的布局样式。
col-md-3	设置中等屏幕及以上时的列宽。
col-md-9	设置中等屏幕及以上时的列宽。
col-lg-2	设置大屏幕及以上时的列宽。
col-lg-10	设置大屏幕及以上时的列宽。
d-flex	设置元素为弹性盒子容器，使子元素可以灵活布局。
align-items-center	设置弹性盒子子元素垂直居中对齐。
d-none	隐藏元素的样式。
mt-4	设置顶部外边距的工具类。
mt-5	设置顶部外边距的工具类。
mb-3	添加底部边距的工具类，通常用于间隔布局元素。
p-3	添加内边距的工具类，通常用于增加内部填充。
me-2	设置右侧外边距的工具类。
me-4	设置右侧外边距的工具类。
ms-4	设置左侧外边距的工具类。
表单类

类名	介绍
form-label	应用于表单标签，设置标签的样式。
form-control-plaintext	设置表单控件为纯文本显示，通常用于展示静态数据。
form-control	设置输入框的样式，使其具有统一的外观。
form-check	设置表单选项容器的样式。
form-check-label	设置表单选项标签的样式。
form-check-input	设置表单选项输入的样式。
form-floating	设置表单浮动标签的样式。
input-group	设置输入组的样式。
input-group-text	设置输入组文本的样式。
按钮类

类名	介绍
btn	按钮基础类，用于设置按钮的样式。
btn-warning	设置按钮为黄色警告样式。
btn-secondary	设置按钮为灰色次要样式。
btn-primary	设置按钮为蓝色主要样式。
btn-success	设置按钮为绿色成功样式。
btn-danger	设置按钮为红色危险样式。
btn-close	设置关闭按钮的样式。
btn-outline-secondary	设置为灰色外边框次要样式。
表格类

类名	介绍
table	设置表格的基础样式，使表格具有Bootstrap样式。
table-responsive	设置表格在小屏幕上水平滚动的样式。
警告和徽章类

类名	介绍
alert	设置警告框的基础样式。
alert-danger	设置红色的危险警告框样式。
badge	设置徽章样式，通常用于标签或指示状态。
bg-primary	设置背景色为主要颜色（通常为蓝色）。
bg-success	设置背景色为成功颜色（通常为绿色）。
bg-info	设置背景色为信息颜色（通常为青色）。
bg-secondary	设置背景色为次要颜色（通常为灰色）。
bg-light	设置背景色为浅色（通常为白色或浅灰色）。
图标类

类名	介绍
bi	引用Bootstrap Icons图标库的基础类。
bi-folder-plus	显示文件夹加号图标。
bi-folder-minus	显示文件夹减号图标。
bi-check-circle-fill	显示填充的勾圈图标。
bi-x-circle-fill	显示填充的叉圈图标。
导航栏和下拉菜单类

类名	介绍
navbar	设置导航栏的基础样式。
navbar-expand-lg	设置导航栏在大屏幕上展开。
navbar-brand	设置导航栏品牌的样式。
navbar-nav	设置导航栏导航项的样式。
nav-item	设置导航项的样式。
nav-link	设置导航链接的样式。
dropdown	设置下拉菜单的样式。
dropdown-toggle	设置下拉菜单切换按钮的样式。
dropdown-menu	设置下拉菜单的样式。
dropdown-item	设置下拉菜单项的样式。
手风琴类

类名	介绍
accordion	设置手风琴组件的基础样式。
accordion-item	设置手风琴项目的样式。
accordion-header	设置手风琴头部的样式。
accordion-button	设置手风琴按钮的样式。
accordion-collapse	设置手风琴折叠部分的样式。
collapse	设置折叠部分的样式。
accordion-body	设置手风琴主体部分的样式。
分页类

类名	介绍
page-item	设置分页项的样式。
page-link	设置分页链接的样式。
active	设置当前活动项的样式。
disabled	设置禁用状态的样式。
模态框类

类名	介绍
modal	设置模态框的基础样式。
modal-dialog	设置模态框对话框的样式。
modal-content	设置模态框内容的样式。
modal-header	设置模态框头部的样式。
modal-title	设置模态框标题的样式。
modal-body	设置模态框主体的样式。
modal-footer	设置模态框底部的样式。
btn-close	设置关闭按钮的样式。
其他类

类名	介绍
border	添加边框样式。
rounded	添加圆角样式。
text-center	设置文本居中对齐。
text-success	设置文本为绿色成功样式。
text-danger	设置文本为红色危险样式。
list-unstyled	移除列表的默认样式，使列表项无圆点或编号。
list-group	设置列表组的样式。
list-group-item	设置列表项的样式。
cursor-pointer	设置鼠标悬停时显示为指针样式。
toggle	自定义类名，用于切换显示子元素。
sort-text	自定义类名，用于排序文本显示。
sort-input	自定义类名，用于排序输入框显示。
方法名	介绍
.on()	用于给一个元素绑定一个或多个事件处理程序。
.html()	获取或设置元素的 HTML 内容。
.data()	存储或获取与元素相关的数据。
.closest()	从当前元素开始，逐级向上级元素查找，直到找到与选择器匹配的元素为止。
.is()	根据选择器检查当前匹配元素集合中的第一个元素是否匹配该选择器。
.nextAll()	获取当前元素之后的所有兄弟元素。
.hide()	隐藏匹配的元素。
.show()	显示匹配的元素。
.each()	为每个匹配的元素执行一个函数。
.addClass()	给匹配的元素添加一个或多个类名。
.removeClass()	移除匹配元素集合中的一个或多个类名。
.focus()	为匹配的元素设置焦点。
.blur()	移除元素的焦点。
.val()	获取或设置匹配元素的值。
.ajax()	通过 HTTP 请求加载远程数据。
.keypress()	为键盘按键事件绑定一个事件处理程序。
.click()	为点击事件绑定一个事件处理程序。
.ready()	在 DOM 加载完成后执行一个函数。
4.1 安装
npm install express-handlebars
4.2 控制器
nest generate controller admin/controllers/dashboard --no-spec --flat
4.3. dashboard.hbs
views/dashboard.hbs

<h1>{{title}}</h1>
4.4. admin.module.ts
src/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
+@Module({
+ controllers: [DashboardController]
+})
+export class AdminModule { }
4.5. dashboard.controller.ts
src/admin/controllers/dashboard.controller.ts

import { Controller, Get, Render } from '@nestjs/common';
@Controller('admin')
export class DashboardController {
    @Get()
    @Render('dashboard')
    dashboard() {
        return { title: 'dashboard' }
    }
}
4.6. header.hbs
views/partials/header.hbs

<!-- 导航栏，使用navbar类来定义基本样式，navbar-expand-lg使其在大屏幕上展开，bg-light设置背景为浅色 -->
<nav class="navbar navbar-expand-lg bg-light">
    <!-- 流体容器，使导航栏在大屏幕上全宽展开 -->
    <div class="container-fluid">
        <!-- 导航栏品牌，链接到首页 -->
        <a class="navbar-brand" href="#">CMS</a>
        <!-- 折叠导航栏内容，navbar-collapse用于折叠和展开导航栏 -->
        <div class="collapse navbar-collapse">
            <!-- 导航栏菜单，使用ms-auto类使其自动右对齐 -->
            <ul class="navbar-nav ms-auto">
                <!-- 导航项，包含下拉菜单 -->
                <li class="nav-item dropdown">
                    <!-- 下拉菜单的触发链接，使用dropdown-toggle类使其具有下拉功能，data-bs-toggle属性用于触发Bootstrap的下拉菜单插件 -->
                    <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                        欢迎
                    </a>
                    <!-- 下拉菜单内容，使用dropdown-menu类定义 -->
                    <ul class="dropdown-menu">
                        <!-- 下拉菜单项，使用dropdown-item类定义 -->
                        <li><a class="dropdown-item">退出登录</a></li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>
4.7. main.hbs
views/layouts/main.hbs

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMS后台管理页面</title>
    <link href="/css/bootstrap.min.css" rel="stylesheet" />
    <link href="/css/bootstrap-icons/font/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
</head>
<body>
    {{> header}}
    <div class="container-fluid">
        <div class="row">
            {{> sidebar}}
            <!-- 右侧管理页面 -->
            <div class="col-md-9 col-lg-10">
                <div class="container mt-4">
                    {{{body}}}
                </div>
            </div>
        </div>
    </div>
</body>
</html>
4.8. sidebar.hbs
views/partials/sidebar.hbs

<!-- 定义一个列，宽度在中等屏幕及以上为3，在大屏幕及以上为2，并且没有内边距 -->
<div class="col-md-3 col-lg-2 p-0">
    <!-- 定义一个手风琴组件，id为sidebarMenu -->
    <div class="accordion" id="sidebarMenu">
        <!-- 定义一个手风琴项目 -->
        <div class="accordion-item">
            <!-- 定义手风琴的头部，id为动态生成 -->
            <h2 class="accordion-header" id="heading{{id}}">
                <!-- 定义一个按钮，点击时折叠或展开手风琴内容 -->
                <button class="accordion-button" type="button" data-bs-toggle="collapse"
                    data-bs-target="#collapse{{id}}">
                    <!-- 按钮文本内容 -->
                    权限管理
                </button>
            </h2>
            <!-- 定义手风琴的折叠内容，id为动态生成 -->
            <div id="collapse{{id}}" class="accordion-collapse collapse">
                <!-- 定义手风琴的主体内容 -->
                <div class="accordion-body">
                    <!-- 定义一个列表组 -->
                    <ul class="list-group">
                        <!-- 定义一个列表项 -->
                        <li class="list-group-item">
                            <!-- 定义一个链接 -->
                            <a href="">用户管理</a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
4.9. main.ts
src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';
+import { NestExpressApplication } from '@nestjs/platform-express';
+import { join } from 'path';
+import { engine } from 'express-handlebars';
async function bootstrap() {
+ // 使用 NestFactory 创建一个 NestExpressApplication 实例
+ const app = await NestFactory.create<NestExpressApplication>(AppModule);
+ // 配置静态资源目录
+ app.useStaticAssets(join(__dirname, '..', 'public'));
+ // 设置视图文件的基本目录
+ app.setBaseViewsDir(join(__dirname, '..', 'views'));
+ // 设置视图引擎为 hbs（Handlebars）
+ app.set('view engine', 'hbs');
+ // 配置 Handlebars 引擎
+ app.engine('hbs', engine({
+   // 设置文件扩展名为 .hbs
+   extname: '.hbs',
+   // 配置运行时选项
+   runtimeOptions: {
+       // 允许默认情况下访问原型属性
+       allowProtoPropertiesByDefault: true,
+       // 允许默认情况下访问原型方法
+       allowProtoMethodsByDefault: true,
+   },
+ }));
  app.use(cookieParser());
  app.use(session({
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }));
  await app.listen(3000);
}
bootstrap();
5.连接数据库
5.1 安装
npm install @nestjs/config @nestjs/typeorm mysql2
5.2. app.module.ts
src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
+import { SharedModule } from './shared/shared.module';
import { AdminModule } from './admin/admin.module';
import { ApiModule } from './api/api.module';
@Module({
+ imports: [SharedModule, AdminModule, ApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
5.3. user.entity.ts
src/shared/entities/user.entity.ts

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true })
    username: string;

    @Column()
    password: string;

    @Column({ length: 15, nullable: true })
    mobile: string;

    @Column({ length: 100, nullable: true })
    email: string;

    @Column({ default: 1 })
    status: number;

    @Column({ default: false })
    is_super: boolean;

    @Column({ default: 100 })
    sort: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
5.4. shared.module.ts
src/shared/shared.module.ts

import { Global, Module } from '@nestjs/common';
+import { ConfigModule } from '@nestjs/config';
+import { TypeOrmModule } from '@nestjs/typeorm';
+import { ConfigurationService } from './services/configuration.service';
+import { User } from './entities/user.entity';
@Global()
+@Module({
+   imports: [
+       ConfigModule.forRoot({ isGlobal: true }),
+       TypeOrmModule.forRootAsync({
+           inject: [ConfigurationService],
+           useFactory: (configurationService: ConfigurationService) => ({
+               type: 'mysql',
+               ...configurationService.mysqlConfig,
+               autoLoadEntities: true,
+               synchronize: true,
+               logging: false,
+           }),
+       }),
+       TypeOrmModule.forFeature([User]),
+   ],
+   providers: [ConfigurationService],
+   exports: [ConfigurationService]
+})
export class SharedModule { }
5.5. configuration.service.ts
src/shared/services/configuration.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class ConfigurationService {
    constructor(private configService: ConfigService) { }
    get mysqlHost(): string {
        return this.configService.get<string>('MYSQL_HOST');
    }
    get mysqlPort(): number {
        return this.configService.get<number>('MYSQL_PORT');
    }
    get mysqlDb(): string {
        return this.configService.get<string>('MYSQL_DB');
    }
    get mysqlUser(): string {
        return this.configService.get<string>('MYSQL_USER');
    }
    get mysqlPass(): string {
        return this.configService.get<string>('MYSQL_PASS');
    }
    get mysqlConfig() {
        return {
            host: this.mysqlHost,
            port: this.mysqlPort,
            database: this.mysqlDb,
            username: this.mysqlUser,
            password: this.mysqlPass,
        };
    }
}
5.6 .env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=cms
MYSQL_USER=root
MYSQL_PASSWORD=root

MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DB=cms
MONGO_USER=
MONGO_PASS=

JWT_SECRET=secret-key
JWT_EXPIRES_IN=7d
6.用户接口
6.1 生成控制器
nest generate service share/services/user --no-spec --flat
nest generate controller admin/controllers/user --no-spec --flat
6.2. admin.module.ts
src/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
+import { UserController } from './controllers/user.controller';
@Module({
+ controllers: [DashboardController, UserController]
})
export class AdminModule { }
6.3. user.controller.ts
src/admin/controllers/user.controller.ts

import { Get, Controller } from '@nestjs/common';
import { UserService } from 'src/shared/services/user.service';
@Controller('admin/users')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }
    @Get()
    async findAll() {
        const users = await this.userService.findAll();
        return { users };
    }
}
6.4. user.service.ts
src/shared/services/user.service.ts

import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { MySQLBaseService } from './mysql-base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
@Injectable()
export class UserService extends MySQLBaseService<User> {
    constructor(
        @InjectRepository(User)
        protected repository: Repository<User>
    ) {
        super(repository);
    }
}
6.5. mysql-base.service.ts
src/shared/services/mysql-base.service.ts

import { Repository, FindOneOptions } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { DeepPartial } from 'typeorm/common/DeepPartial';
export abstract class MySQLBaseService<T> {
    constructor(
        protected repository: Repository<T>
    ) {
    }
    async findAll(): Promise<T[]> {
        return this.repository.find();
    }
    async findOne(options: FindOneOptions<T>): Promise<T> {
        return this.repository.findOne(options);
    }
    async create(createDto: DeepPartial<T>): Promise<T | T[]> {
        const entity = this.repository.create(createDto);
        return this.repository.save(entity);
    }
    async update(id: number, updateDto: QueryDeepPartialEntity<T>) {
        return await this.repository.update(id, updateDto);
    }
    async delete(id: number) {
        return await this.repository.delete(id);
    }
}

6.6. shared.module.ts
src/shared/shared.module.ts

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationService } from './services/configuration.service';
import { User } from './entities/user.entity';
+import { UserService } from './services/user.service';
@Global()
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            }),
        }),
        TypeOrmModule.forFeature([User]),
    ],
+   providers: [ConfigurationService, UserService],
+   exports: [ConfigurationService, UserService]
})
export class SharedModule { }
7.用户CRUD
7.1 参考
7.1.1 安装
npm i class-validator  class-transformer
7.1.2 class-validator
装饰器方法名	介绍
@IsString()	验证属性是否为字符串类型。
@IsInt()	验证属性是否为整数类型。
@IsBoolean()	验证属性是否为布尔值类型。
@IsNumber()	验证属性是否为数字类型，可以指定选项，如整数、浮点数等。
@IsArray()	验证属性是否为数组类型。
@IsEmail()	验证属性是否为合法的电子邮件地址。
@IsEnum()	验证属性是否为指定枚举类型中的值。
@IsDate()	验证属性是否为日期类型。
@IsOptional()	如果属性存在则进行验证，否则跳过此验证。
@IsNotEmpty()	验证属性是否不为空（不为 null 或 undefined 且不为空字符串）。
@IsEmpty()	验证属性是否为空（null 或 undefined 或为空字符串）。
@IsDefined()	验证属性是否已定义（不为 undefined）。
@Min()	验证属性的值是否大于或等于指定的最小值。
@Max()	验证属性的值是否小于或等于指定的最大值。
@MinLength()	验证字符串属性的长度是否大于或等于指定的最小长度。
@MaxLength()	验证字符串属性的长度是否小于或等于指定的最大长度。
@Length()	验证字符串属性的长度是否在指定的范围内。
@Matches()	验证字符串属性是否符合指定的正则表达式。
@IsUUID()	验证属性是否为合法的 UUID 格式。
@IsUrl()	验证属性是否为合法的 URL 格式。
@IsIn()	验证属性是否为给定值数组中的一个。
@IsNotIn()	验证属性是否不在给定值数组中。
@IsPositive()	验证数字属性是否为正数。
@IsNegative()	验证数字属性是否为负数。
@IsLatitude()	验证属性是否为合法的纬度值（范围：-90 到 90）。
@IsLongitude()	验证属性是否为合法的经度值（范围：-180 到 180）。
@IsPhoneNumber()	验证属性是否为合法的电话号码，支持不同国家的格式。
@IsCreditCard()	验证属性是否为有效的信用卡号。
@IsISO8601()	验证属性是否为合法的 ISO 8601 日期格式。
@IsJSON()	验证属性是否为合法的 JSON 字符串。
@IsIP()	验证属性是否为合法的 IP 地址，可以指定版本（IPv4 或 IPv6）。
@IsPostalCode()	验证属性是否为合法的邮政编码，支持不同国家的格式。
@IsHexColor()	验证属性是否为合法的十六进制颜色代码。
@IsCurrency()	验证属性是否为合法的货币金额格式。
@IsAlphanumeric()	验证属性是否仅包含字母和数字。
@IsAlpha()	验证属性是否仅包含字母。
@IsLowercase()	验证属性是否全部为小写字母。
@IsUppercase()	验证属性是否全部为大写字母。
@IsBase64()	验证属性是否为合法的 Base64 编码字符串。
@IsDateString()	验证属性是否为合法的日期字符串。
@IsFQDN()	验证属性是否为合法的完全合格域名（FQDN）。
@IsMilitaryTime()	验证属性是否为合法的 24 小时时间格式（军事时间）。
@IsMongoId()	验证属性是否为合法的 MongoDB ObjectId。
@IsPort()	验证属性是否为合法的端口号（范围：0 到 65535）。
@IsISBN()	验证属性是否为合法的 ISBN 格式。
@IsISSN()	验证属性是否为合法的 ISSN 格式。
@IsRFC3339()	验证属性是否为合法的 RFC 3339 日期格式。
@IsBIC()	验证属性是否为合法的银行标识代码（BIC）。
@IsJWT()	验证属性是否为合法的 JSON Web Token（JWT）。
@IsEAN()	验证属性是否为合法的欧洲商品编号（EAN）。
@IsMACAddress()	验证属性是否为合法的 MAC 地址。
@IsHexadecimal()	验证属性是否为合法的十六进制数值。
@IsTimeZone()	验证属性是否为合法的时区名称。
@IsStrongPassword()	验证属性是否为强密码，支持自定义验证条件（如长度、字符类型）。
@IsISO31661Alpha2()	验证属性是否为合法的 ISO 3166-1 Alpha-2 国家代码。
@IsISO31661Alpha3()	验证属性是否为合法的 ISO 3166-1 Alpha-3 国家代码。
@IsEAN13()	验证属性是否为合法的 EAN-13 格式。
@IsEAN8()	验证属性是否为合法的 EAN-8 格式。
@IsISRC()	验证属性是否为合法的国际标准录音代码（ISRC）。
@IsISO4217()	验证属性是否为合法的 ISO 4217 货币代码。
@IsIBAN()	验证属性是否为合法的国际银行帐号（IBAN）。
@IsRFC4180()	验证属性是否为合法的 RFC 4180 CSV 格式。
@IsISO6391()	验证属性是否为合法的 ISO 639-1 语言代码。
@IsISIN()	验证属性是否为合法的国际证券识别码（ISIN）。
名称	介绍
ValidatorConstraint	装饰器，用于定义自定义验证器。可以指定验证器名称和是否为异步。
ValidatorConstraintInterface	接口，用于实现自定义验证器的逻辑。需要实现 validate 和 defaultMessage 方法。
ValidationArguments	类，用于传递给验证器的参数信息，包括当前被验证的对象、属性、约束和目标对象等。
registerDecorator	函数，用于注册自定义装饰器，可以指定目标对象、属性、验证器和其他选项。
ValidationOptions	接口，用于指定验证选项，如消息、组、每个属性的条件等。
7.1.3 @nestjs/mapped-types
方法名	介绍
PartialType	用于将给定类型的所有属性设置为可选属性，通常用于更新操作。
PickType	用于从给定类型中选择特定的属性来构建一个新类型，只包含选中的属性。
OmitType	用于从给定类型中排除特定的属性来构建一个新类型，排除指定的属性。
IntersectionType	用于将多个类型合并成一个新类型，包含所有类型的属性。
MappedType	是一个抽象类型，允许对 DTO 进行进一步扩展或自定义。通常与其他工具一起使用，直接使用较少。
7.1.4 @nestjs/swagger
装饰器名称	介绍
@ApiTags	用于给控制器或模块添加标签，用于对 API 进行分类。
@ApiOperation	用于描述单个操作的目的和功能，通常用于描述控制器中的方法。
@ApiResponse	用于指定 API 响应的状态码及其描述，支持定义多个响应。
@ApiParam	用于描述路径参数，包括名称、类型和描述。
@ApiQuery	用于描述查询参数（即 URL 中的 ?key=value 部分），包括名称、类型和描述。
@ApiBody	用于描述请求体的结构，通常用于 POST 和 PUT 请求。
@ApiHeader	用于描述 HTTP 头信息，包括名称、类型和描述。
@ApiBearerAuth	用于描述使用 Bearer Token 的身份验证方式。
@ApiCookieAuth	用于描述基于 Cookie 的身份验证方式。
@ApiBasicAuth	用于描述基本身份验证方式。
@ApiExcludeEndpoint	用于从 Swagger 文档中排除某个特定的控制器方法。
@ApiProduces	用于指定 API 方法返回的数据格式，如 application/json。
@ApiConsumes	用于指定 API 方法可以消费的数据格式，如 application/json。
@ApiExtraModels	用于引入额外的模型类，通常用于复杂的响应或嵌套对象。
@ApiHideProperty	用于从模型类中排除某些属性，使其不在 Swagger 文档中显示。
@ApiSecurity	用于为控制器方法指定安全机制，如 OAuth2。
@ApiExcludeController	用于从 Swagger 文档中排除整个控制器。
@ApiImplicitParam	（已弃用）用于描述隐式的路径参数，建议使用 @ApiParam 代替。
@ApiImplicitQuery	（已弃用）用于描述隐式的查询参数，建议使用 @ApiQuery 代替。
@ApiImplicitHeader	（已弃用）用于描述隐式的头信息，建议使用 @ApiHeader 代替。
@ApiImplicitBody	（已弃用）用于描述隐式的请求体，建议使用 @ApiBody 代替。
7.1.5 class-transformer
装饰器名称	介绍
@Exclude()	将目标属性从序列化输出中排除，使其不被包含在最终的序列化结果中。
@Expose()	将目标属性包括在序列化输出中，或者重命名序列化结果中的属性。
@Transform()	提供自定义的转换逻辑，可以在序列化或反序列化过程中对属性进行转换。
@Type()	显式指定属性的类型，通常用于在序列化或反序列化过程中确保正确的类型转换，尤其是在数组或对象中。
@TransformPlainToClass()	将普通对象转换为类实例，使用此装饰器可以自动执行该转换。
@TransformClassToPlain()	将类实例转换为普通对象，使用此装饰器可以自动执行该转换。
@TransformClassToClass()	将一个类实例转换为另一个类实例，通常用于创建副本并在转换过程中应用特定规则。
7.1.6 ClassSerializerInterceptor
ClassSerializerInterceptor 是一个内置的拦截器，用于在数据响应之前对数据进行序列化处理。它利用了 class-transformer 库，能够根据类定义中的装饰器（例如 @Exclude 和 @Expose）来自动转换类实例。这对确保敏感数据不会在 API 响应中暴露非常有用。

功能和用途：

自动序列化：拦截控制器方法的返回值，并将类实例序列化为普通对象。
属性控制：通过使用 class-transformer 装饰器（如 @Exclude、@Expose），可以精细控制哪些属性会被序列化和暴露。
安全性：能够防止敏感数据（如密码）在 API 响应中被不小心暴露。
嵌套处理：能够处理嵌套的对象和数组，保证整个数据结构的序列化规则一致。
7.1.7 SerializeOptions
SerializeOptions 是一个装饰器，通常与 ClassSerializerInterceptor 一起使用。它允许你为整个控制器或特定的控制器方法设置序列化选项，进一步定制序列化行为。

功能和用途：

定制化策略：你可以为序列化设置不同的策略，例如 exposeAll 或 excludeAll，来决定默认情况下是包含还是排除类的所有属性。
分组控制：可以为不同的序列化场景设置不同的组（groups），使得同一个类在不同场景下可以以不同的方式序列化。
7.2. api.module.ts
src/api/api.module.ts

import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
+@Module({
+   controllers: [UserController]
+})
+export class ApiModule { }
7.3 alidation-and-transform.decorators.ts
src\shared\decorators\validation-and-transform.decorators.ts

import { applyDecorators } from '@nestjs/common';
import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
// 可选的字符串装饰器
export function IsOptionalString() {
    return applyDecorators(IsOptional(), IsString());
}
// 可选的邮箱装饰器
export function IsOptionalEmail() {
    return applyDecorators(IsOptional(), IsEmail());
}
// 可选的数字装饰器，并转换类型为 Number
export function IsOptionalNumber() {
    return applyDecorators(IsOptional(), IsNumber(), Type(() => Number));
}
// 可选的布尔值装饰器，并转换类型为 Boolean
export function IsOptionalBoolean() {
    return applyDecorators(IsOptional(), IsBoolean(), Type(() => Boolean));
}
7.4. user.dto.ts
src/shared/dtos/user.dto.ts

import { IsString, Validate } from 'class-validator';
import { IsOptionalString, IsOptionalEmail, IsOptionalNumber, IsOptionalBoolean } from '../decorators/validation-and-transform.decorators';
import { IsUsernameUnique, StartsWith, StartsWithConstraint } from '../validators/user-validators';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ description: '用户名，必须唯一且以指定前缀开头', example: 'user_john_doe' })
    @IsString()
    @Validate(StartsWithConstraint, ['user_'], {
        message: `Username must start with "user_".`,
    })
    @StartsWith('user_', { message: '用户名必须以 "user_" 开头' })
    @IsUsernameUnique({ message: '用户名已存在' })
    readonly username: string;

    @ApiProperty({ description: '密码', example: 'securePassword123' })
    @IsString()
    readonly password: string;

    @ApiPropertyOptional({ description: '手机号', example: '1234567890' })
    @IsOptionalString()
    readonly mobile?: string;

    @ApiPropertyOptional({ description: '邮箱地址', example: 'john.doe@example.com' })
    @IsOptionalEmail()
    readonly email?: string;

    @ApiPropertyOptional({ description: '用户状态', example: 1 })
    @IsOptionalNumber()
    readonly status?: number;

    @ApiPropertyOptional({ description: '是否为超级管理员', example: true })
    @IsOptionalBoolean()
    readonly is_super?: boolean;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiProperty({ description: '用户ID', example: 1 })
    @IsOptionalNumber()
    readonly id: number;
}
7.5 user-validators.ts
src\shared\validators\user-validators.ts

// 从 'class-validator' 导入验证相关的类和装饰器
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';
// 从 '@nestjs/common' 导入 Injectable 装饰器
import { Injectable } from '@nestjs/common';
// 定义一个自定义验证器，名为 'startsWith'，不需要异步验证
@ValidatorConstraint({ name: 'startsWith', async: false })
// 使用 Injectable 装饰器使这个类可被依赖注入
@Injectable()
// 定义 StartsWithConstraint 类并实现 ValidatorConstraintInterface 接口
export class StartsWithConstraint implements ValidatorConstraintInterface {
    // 定义验证逻辑，检查值是否以指定的前缀开头
    validate(value: any, args: ValidationArguments) {
        const [prefix] = args.constraints; // 从参数中获取前缀
        return typeof value === 'string' && value.startsWith(prefix); // 返回值是否以指定前缀开头
    }
    // 定义验证失败时的默认错误消息
    defaultMessage(args: ValidationArguments) {
        const [prefix] = args.constraints; // 从参数中获取前缀
        return `Username must start with "${prefix}".`; // 返回错误消息，提示用户名必须以指定前缀开头
    }
}
// 定义一个自定义验证器，名为 'isUsernameUnique'，需要异步验证
@ValidatorConstraint({ name: 'isUsernameUnique', async: true })
// 使用 Injectable 装饰器使这个类可被依赖注入
@Injectable()
// 定义 IsUsernameUniqueConstraint 类并实现 ValidatorConstraintInterface 接口
export class IsUsernameUniqueConstraint implements ValidatorConstraintInterface {
    // 定义异步验证逻辑，检查用户名是否唯一
    async validate(value: any, args: ValidationArguments) {
        const existingUsernames = ['ADMIN', 'USER', 'GUEST']; // 模拟已存在的用户名列表
        return !existingUsernames.includes(value); // 检查用户名是否在已有列表中
    }
    // 定义验证失败时的默认错误消息
    defaultMessage(args: ValidationArguments) {
        return 'Username ($value) is already taken!'; // 返回错误消息，提示用户名已存在
    }
}
// 创建 StartsWith 装饰器工厂函数，用于给属性添加 'startsWith' 验证逻辑
export function StartsWith(prefix: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor, // 目标类
            propertyName: propertyName, // 目标属性名
            options: validationOptions, // 验证选项
            constraints: [prefix], // 传递给验证器的参数，如前缀
            validator: StartsWithConstraint, // 指定使用的验证器类
        });
    };
}
// 创建 IsUsernameUnique 装饰器工厂函数，用于给属性添加 'isUsernameUnique' 验证逻辑
export function IsUsernameUnique(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor, // 目标类
            propertyName: propertyName, // 目标属性名
            options: validationOptions, // 验证选项
            constraints: [], // 传递给验证器的参数，这里不需要
            validator: IsUsernameUniqueConstraint, // 指定使用的验证器类
        });
    };
}
7.6 user.controller.ts
src/api/controllers/user.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseInterceptors, SerializeOptions, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from 'src/shared/services/user.service';
import { CreateUserDto, UpdateUserDto } from 'src/shared/dtos/user.dto';
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiTags, ApiCookieAuth, ApiBearerAuth } from '@nestjs/swagger';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { User } from 'src/shared/entities/user.entity';
import { Result } from 'src/shared/vo/result';
@ApiTags('api/users')
@SerializeOptions({ strategy: 'exposeAll' })
@UseInterceptors(ClassSerializerInterceptor)
@Controller('api/users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    @ApiOperation({ summary: '获取所有用户列表' })
    @ApiResponse({ status: 200, description: '成功返回用户列表', type: [User] })
    async findAll() {
        return this.userService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: '根据ID获取用户信息' })
    @ApiParam({ name: 'id', description: '用户ID', type: Number })
    @ApiResponse({ status: 200, description: '成功返回用户信息', type: User })
    @ApiResponse({ status: 404, description: '用户未找到' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOne({ where: { id } });
    }

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: '创建新用户' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({ status: 201, description: '用户成功创建', type: User })
    @ApiResponse({ status: 400, description: '请求参数错误' })
    async create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    @Put(':id')
    @ApiOperation({ summary: '更新用户信息' })
    @ApiParam({ name: 'id', description: '用户ID', type: Number })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({ status: 200, description: '用户信息更新成功', type: Result })
    @ApiResponse({ status: 400, description: '请求参数错误' })
    @ApiResponse({ status: 404, description: '用户未找到' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
        const updateResult = await this.userService.update(id, updateUserDto);
        if (!updateResult.affected) {
            throw new HttpException('用户未找到', HttpStatus.NOT_FOUND);
        }
        return Result.success('用户信息更新成功');
    }

    @Delete(':id')
    @ApiOperation({ summary: '删除用户' })
    @ApiParam({ name: 'id', description: '用户ID', type: Number })
    @ApiResponse({ status: 200, description: '用户删除成功', type: Result })
    @ApiResponse({ status: 404, description: '用户未找到' })
    async delete(@Param('id', ParseIntPipe) id: number) {
        const deleteResult = await this.userService.delete(id);
        if (!deleteResult.affected) {
            throw new HttpException('用户未找到', HttpStatus.NOT_FOUND);
        }
        return Result.success('用户删除成功');
    }
}

7.7 main.ts
src\main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.engine('hbs', engine({
    extname: '.hbs',
    runtimeOptions: {
      allowProtoMethodsByDefault: true,
      allowProtoPropertiesByDefault: true
    }
  }));
  app.set('view engine', 'hbs');
  app.use(cookieParser());
  app.use(session({
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  }));
+ app.useGlobalPipes(new ValidationPipe({ transform: true }));
+ // 创建一个新的 DocumentBuilder 实例，用于配置 Swagger 文档
+ const config = new DocumentBuilder()
+   // 设置 API 的标题
+   .setTitle('CMS API')
+   // 设置 API 的描述
+   .setDescription('The CMS API description')
+   // 设置 API 的版本
+   .setVersion('1.0')
+   // 添加一个标签，用于对 API 进行分类
+   .addTag('CMS')
+   // 添加 Cookie 认证方式，名称为 'connect.sid'
+   .addCookieAuth('connect.sid')
+   // 添加 Bearer 认证方式，类型为 'http'，认证方案为 'bearer'
+   .addBearerAuth({
+     type: 'http',
+     scheme: 'bearer'
+   })
+   // 构建并生成最终的配置对象
+   .build();
+   // 使用配置对象创建 Swagger 文档
+ const document = SwaggerModule.createDocument(app, config);
+ // 设置 Swagger 模块的路径和文档对象，将 Swagger UI 绑定到 '/api-doc' 路径上
+ SwaggerModule.setup('api-doc', app, document);
  await app.listen(3000);
}
bootstrap();

7.8 dashboard.controller.ts
src\admin\controllers\dashboard.controller.ts

import { Controller, Get, Render } from '@nestjs/common';
+import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
+@ApiTags('admin/dashboard')
@Controller('dashboard')
export class DashboardController {
    @Get()
+   @ApiCookieAuth()
+   @ApiOperation({ summary: '渲染仪表盘页面' })
+   @ApiResponse({ status: 200, description: '成功返回仪表盘页面' })
    @Render('dashboard')
    dashboard() {
        return { title: 'dashboard' };
    }
}
7.9 user.controller.ts
src\admin\controllers\user.controller.ts

import { Controller, Get, Render } from '@nestjs/common';
import { UserService } from 'src/shared/services/user.service';
+import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
+@ApiTags('admin/users')
@Controller('admin/users')
export class UserController {
    constructor(private readonly userService: UserService) { }
    @Get()
+   @ApiOperation({ summary: '获取所有用户列表（管理后台）' })
+   @ApiResponse({ status: 200, description: '成功返回用户列表' })
    async findAll() {
        const users = await this.userService.findAll();
        return { users };
    }
}
7.10 user.entity.ts
src\shared\entities\user.entity.ts

+import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
+import { Exclude, Expose, Transform } from 'class-transformer';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity()
export class User {
    @PrimaryGeneratedColumn()
+   @ApiProperty({ description: '用户ID', example: 1 })
    id: number;

    @Column({ length: 50, unique: true })
+   @ApiProperty({ description: '用户名', example: 'john_doe' })
    username: string;

    @Column()
+   @Exclude()
+   @ApiHideProperty() // 隐藏密码字段，不在Swagger文档中显示
    password: string;

    @Column({ length: 15, nullable: true })
+   @ApiPropertyOptional({ description: '手机号', example: '1234567890', format: '手机号码会被部分隐藏' })
+   @Transform(({ value }) => value ? value.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3') : value)
    mobile: string;

    @Column({ length: 100, nullable: true })
+   @ApiPropertyOptional({ description: '邮箱地址', example: 'john.doe@example.com' })
    email: string;

+   @Expose()
+   @ApiProperty({ description: '联系方式', example: 'mobile:123****7890, email:john.doe@example.com' })
+   get contact(): string {
+       return `mobile:${this.mobile}, email:${this.email}`;
+   }

    @Column({ default: 1 })
+   @ApiProperty({ description: '用户状态', example: 1 })
    status: number;

    @Column({ default: false })
+   @ApiProperty({ description: '是否为超级管理员', example: false })
    is_super: boolean;

    @Column({ default: 100 })
+   @ApiProperty({ description: '排序编号', example: 100 })
    sort: number;

    @CreateDateColumn()
+   @ApiProperty({ description: '创建时间', example: '2024-01-01T00:00:00Z' })
    createdAt: Date;

    @UpdateDateColumn()
+   @ApiProperty({ description: '更新时间', example: '2024-01-02T00:00:00Z' })
    updatedAt: Date;
}
7.11 result.ts
src\shared\vo\result.ts

import { ApiProperty } from '@nestjs/swagger';
export class Result {
    @ApiProperty({ description: '操作是否成功', example: true })
    public success: boolean;
    @ApiProperty({ description: '操作的消息或错误信息', example: '操作成功' })
    public message: string;
    constructor(success: boolean, message?: string) {
        this.success = success;
        this.message = message;
    }
    static success(message: string) {
        return new Result(true, message);
    }
    static fail(message: string) {
        return new Result(false, message);
    }
}
8.用户列表
8.1. app.module.ts
src/app.module.ts

import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { ApiModule } from './api/api.module';
import { SharedModule } from './shared/shared.module';

@Module({
+ imports: [SharedModule, AdminModule, ApiModule],
  controllers: [],
  providers: [],
})
+export class AppModule { }

8.2. user-list.hbs
views/user/user-list.hbs

<h1>用户列表</h1>
<table class="table">
    <thead>
        <tr>
            <th>用户名</th>
            <th>邮箱</th>
        </tr>
    </thead>
    <tbody>
        {{#each users}}
        <tr>
            <td>{{this.username}}</td>
            <td>{{this.email}}</td>
        </tr>
        {{/each}}
    </tbody>
</table>
<script>
</script>
8.3. user.controller.ts
src/admin/controllers/user.controller.ts

+import { Controller, Get, Render } from '@nestjs/common';
import { UserService } from 'src/shared/services/user.service';

@Controller('admin/users')
export class UserController {
+   constructor(private readonly userService: UserService) {

    }
    @Get()
+   @Render('user/user-list')
+   async findAll() {
        const users = await this.userService.findAll();
+       return { users };
    }
}
9.添加用户
简化IsUsernameUniqueConstraint并支持依赖注入
实现添加用户的功能
添加用户失败跳转到错误页
9.1 安装
npm install bcrypt
9.2. error.hbs
views/error.hbs

<h1>发生错误</h1>
<p>{{message}}</p>
<p>3秒后将自动跳转回上一个页面...</p>
<script>
    setTimeout(function () {
        window.history.back();
    }, 3000);
</script>
9.3. utility.service.ts
src/shared/services/utility.service.ts

// 导入 Injectable 装饰器，用于标记服务类
import { Injectable } from '@nestjs/common';
// 导入 bcrypt 库，用于处理密码哈希和验证
import * as bcrypt from 'bcrypt';
// 使用 Injectable 装饰器将类标记为可注入的服务
@Injectable()
export class UtilityService {
    // 定义一个异步方法，用于生成密码的哈希值
    async hashPassword(password: string): Promise<string> {
        // 生成一个盐值，用于增强哈希的安全性
        const salt = await bcrypt.genSalt();
        // 使用生成的盐值对密码进行哈希，并返回哈希结果
        return bcrypt.hash(password, salt);
    }
    // 定义一个异步方法，用于比较输入的密码和存储的哈希值是否匹配
    async comparePassword(password: string, hash: string): Promise<boolean> {
        // 使用 bcrypt 的 compare 方法比较密码和哈希值，返回比较结果（true 或 false）
        return bcrypt.compare(password, hash);
    }
}
9.4. admin.module.ts
src/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { UserController } from './controllers/user.controller';
+import { AdminExceptionFilter } from './filters/admin-exception.filter';
@Module({
 controllers: [DashboardController, UserController],
+ providers: [
+   {
+     provide: 'APP_FILTER',
+     useClass: AdminExceptionFilter,
+   },
+ ]
+})
export class AdminModule { }
9.5. user-form.hbs
views/user/user-form.hbs

<h1>添加用户</h1>
<form action="/admin/users" method="POST">
    <div class="mb-3">
        <label for="username" class="form-label">用户名</label>
        <input type="text" class="form-control" id="username" name="username" value="">
    </div>
    <div class="mb-3">
        <label for="username" class="form-label">密码</label>
        <input type="text" class="form-control" id="password" name="password" value="">
    </div>
    <div class="mb-3">
        <label for="email" class="form-label">邮箱</label>
        <input type="email" class="form-control" id="email" name="email" value="">
    </div>
    <div class="mb-3">
        <label for="status" class="form-label">状态</label>
        <select class="form-control" id="status" name="status">
            <option value="1">激活</option>
            <option value="0">未激活</option>
        </select>
    </div>
    <button type="submit" class="btn btn-primary">保存</button>
</form>
9.6. user.controller.ts
src/admin/controllers/user.controller.ts

import { Get, Post, Controller, Render, Redirect, Body } from '@nestjs/common';
import { UserService } from 'src/shared/services/user.service';
import { CreateUserDto } from 'src/shared/dto/user.dto';
import { UtilityService } from 'src/shared/services/utility.service';
@Controller('admin/users')
+export class UserController {
+   constructor(
+       private readonly userService: UserService,
+       private readonly utilityService: UtilityService
+   ) { }
+   @Get()
+   @Render('user/user-list')
+   async findAll() {
+       const users = await this.userService.findAll();
+       return { users };
+   }
+   @Get('create')
+   @Render('user/user-form')
+   createForm() {
+       return { user: {} };
+   }
+   @Post()
+   @Redirect('/admin/users')
+   async create(@Body() createUserDto: CreateUserDto) {
+       createUserDto.password = await this.utilityService.hashPassword(createUserDto.password);
+       await this.userService.create(createUserDto);
+       return { success: true };
+   }
+}
+
9.7. admin-exception.filter.ts
src/admin/filters/admin-exception.filter.ts

// 导入 ExceptionFilter、Catch 装饰器、ArgumentsHost、HttpException 和 BadRequestException 模块
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, BadRequestException } from '@nestjs/common';
// 导入 express 的 Response 对象，用于构建 HTTP 响应
import { Response } from 'express';
// 使用 @Catch 装饰器捕获所有 HttpException 异常
@Catch(HttpException)
export class AdminExceptionFilter implements ExceptionFilter {
    // 实现 catch 方法，用于处理捕获的异常
    catch(exception: HttpException, host: ArgumentsHost) {
        // 获取当前 HTTP 请求上下文
        const ctx = host.switchToHttp();
        // 获取 HTTP 响应对象
        const response = ctx.getResponse<Response>();
        // 获取异常的 HTTP 状态码
        const status = exception.getStatus();
        // 初始化错误信息，默认为异常的消息
        let errorMessage = exception.message;
        // 如果异常是 BadRequestException 类型，进一步处理错误信息
        if (exception instanceof BadRequestException) {
            // 获取异常的响应体
            const responseBody: any = exception.getResponse();
            // 检查响应体是否是对象并且包含 message 属性
            if (typeof responseBody === 'object' && responseBody.message) {
                // 如果 message 是数组，则将其拼接成字符串，否则直接使用 message
                errorMessage = Array.isArray(responseBody.message)
                    ? responseBody.message.join(', ')
                    : responseBody.message;
            }
        }
        // 使用响应对象构建并发送错误页面，包含错误信息和重定向 URL
        response.status(status).render('error', {
            message: errorMessage,
            redirectUrl: ctx.getRequest().url,
        });
    }
}
9.8. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
+import { UtilityService } from './services/utility.service';
+import { IsUsernameUniqueConstraint } from './validators/user-validator';
@Global()
@Module({
    providers: [
+       IsUsernameUniqueConstraint,
        ConfigurationService,
        UserService,
+       UtilityService
    ],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UserService, UtilityService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: true,
            })
        }),
        TypeOrmModule.forFeature([User])
    ],
})
export class SharedModule { }
9.9. user-validator.ts
src/shared/validators/user-validator.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, useContainer } from "class-validator";
import { User } from "../entities/user.entity";
import { Repository } from 'typeorm';
@Injectable()
@ValidatorConstraint({ name: 'startsWith', async: false })
export class StartsWithConstraint implements ValidatorConstraintInterface {
    validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        const { constraints } = validationArguments;
        return value.startsWith(constraints[0]);
    }
    defaultMessage?(validationArguments?: ValidationArguments): string {
        const { property, constraints } = validationArguments;
        return `${property} must start with ${constraints[0]}`
    }
}
@Injectable()
@ValidatorConstraint({ name: 'IsUsernameUnique', async: true })
export class IsUsernameUniqueConstraint implements ValidatorConstraintInterface {
    constructor(
       @InjectRepository(User) private readonly repository: Repository<User>
   ) { }

    async validate(value: any, validationArguments?: ValidationArguments) {
       const user = await this.repository.findOne({ where: { username: value } });
       return !user;
    }

    defaultMessage?(validationArguments?: ValidationArguments): string {
        const { property, value } = validationArguments;
       return `${property} ${value} 已经被使用！`;
    }
}
9.10. main.ts
src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
+import { useContainer } from 'class-validator';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
+ useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.engine('hbs', engine({
    extname: '.hbs',
    runtimeOptions: {
      allowProtoMethodsByDefault: true,
      allowProtoPropertiesByDefault: true
    }
  }));
  app.set('view engine', 'hbs');
  app.use(cookieParser());
  app.use(session({
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  }));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const config = new DocumentBuilder()
    .setTitle('CMS API')
    .setDescription('CMS API 描述')
    .setVersion("1.0")
    .addTag('CMS')
    .addCookieAuth('connect.sid')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer'
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, document);
  await app.listen(3000);
}
bootstrap();
9.11. user.dto.ts
src/shared/dto/user.dto.ts

import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, MinLength, MaxLength, Validate, } from 'class-validator';
import { IsUsernameUniqueConstraint, StartsWithConstraint } from 'src/shared/validators/user-validator';
export class CreateUserDto {
+  @Validate(StartsWithConstraint, ['user_'])
+  @Validate(IsUsernameUniqueConstraint)
   @ApiProperty({ description: '用户名', example: 'nick' })
   username: string;
   @PasswordValidators()
   @ApiProperty({ description: '密码', example: '666666' })
   password: string;
   @MobileValidators()
   @ApiProperty({ description: '手机号', example: '15788888888' })
   @ApiPropertyOptional()
   mobile: string;
   @EmailValidators()
   @ApiProperty({ description: '邮件', example: 'nick@qq.com' })
   email: string;
   @StatusValidators()
   @ApiProperty({ description: '状态', example: 1 })
   status: number;
   @IsSuperValidators()
   @ApiProperty({ description: '是否超级管理员', example: true })
   is_super: boolean;
   @SortValidators()
   @ApiProperty({ description: '排序号', example: 100 })
   sort: number;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {
   @ApiProperty({ description: '用户ID', example: 1 })
   @IsOptional()
   @IsNumber()
   id: number;
}
function PasswordValidators() {
   return applyDecorators(IsString(), MinLength(6), MaxLength(8))
}
function EmailValidators() {
   return applyDecorators(IsEmail(), IsOptional())
}
function MobileValidators() {
   return applyDecorators(IsString(), IsOptional())
}
function StatusValidators() {
   return applyDecorators(IsNumber(), IsOptional(), Type(() => Number))
}
function IsSuperValidators() {
   return applyDecorators(IsBoolean(), IsOptional(), Type(() => Boolean))
}
function SortValidators() {
   return applyDecorators(IsNumber(), IsOptional(), Type(() => Number))
}
10.国际化
10.1 安装
npm install nestjs-i18n
10.2. greeting.json
src/i18n/zh/greeting.json

{
    "hello": "你好,{name}!"
}
10.3. greeting.json
src/i18n/en/greeting.json

{
    "hello": "hello,{name}!"
}
10.4. validation.json
src/i18n/zh/validation.json

{
    "minLength": "{field}至少要有{length}个字符。",
    "maxLength": "{field}不能超过{length}个字符。"
}
10.5. validation.json
src/i18n/en/validation.json

{
    "minLength": "The {field} must be at least {length} characters.",
    "maxLength": "The {field} must not exceed {length} characters."
}
10.6. nest-cli.json
nest-cli.json

{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
+   "deleteOutDir": true,
+   "assets": [
+     {
+       "include": "i18n/**/*",
+       "watchAssets": true
+     }
+   ]
  }
+}
10.7. app.module.ts
src/app.module.ts

import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { ApiModule } from './api/api.module';
import { SharedModule } from './shared/shared.module';
+import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
+import * as path from 'path';
@Module({
+ imports: [
+   I18nModule.forRoot({
+     fallbackLanguage: 'en',
+     loaderOptions: {
+       path: path.join(__dirname, '/i18n/'),
+       watch: true,
+     },
+     resolvers: [
+       { use: QueryResolver, options: ['lang'] },
+       AcceptLanguageResolver,// Accept-Language=zh-CN
+       new HeaderResolver(['x-lang']),
+     ],
+   }),
+   SharedModule, AdminModule, ApiModule],
  controllers: [],
  providers: [],
})
export class AppModule { }

10.8. main.ts
src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
+import { I18nValidationPipe, I18nValidationExceptionFilter } from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.engine('hbs', engine({
    extname: '.hbs',
    runtimeOptions: {
      allowProtoMethodsByDefault: true,
      allowProtoPropertiesByDefault: true
    }
  }));
  app.set('view engine', 'hbs');
  app.use(cookieParser());
  app.use(session({
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  }));
+ app.useGlobalPipes(new I18nValidationPipe({ transform: true }));
+ app.useGlobalFilters(new I18nValidationExceptionFilter({ detailedErrors: false }));
  const config = new DocumentBuilder()
    .setTitle('CMS API')
    .setDescription('CMS API 描述')
    .setVersion("1.0")
    .addTag('CMS')
    .addCookieAuth('connect.sid')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer'
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, document);
  await app.listen(3000);
}
bootstrap();

10.9. user.dto.ts
src/shared/dto/user.dto.ts

import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, MinLength, MaxLength, Validate, } from 'class-validator';
+import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUsernameUniqueConstraint, StartsWithConstraint } from 'src/shared/validators/user-validator';
export class CreateUserDto {
    @Validate(StartsWithConstraint, ['user_'])
    @Validate(IsUsernameUniqueConstraint)
    @ApiProperty({ description: '用户名', example: 'nick' })
    username: string;
    @PasswordValidators()
    @ApiProperty({ description: '密码', example: '666666' })
    password: string;
    @MobileValidators()
    @ApiProperty({ description: '手机号', example: '15788888888' })
    @ApiPropertyOptional()
    mobile: string;
    @EmailValidators()
    @ApiProperty({ description: '邮件', example: 'nick@qq.com' })
    email: string;
    @StatusValidators()
    @ApiProperty({ description: '状态', example: 1 })
    status: number;
    @IsSuperValidators()
    @ApiProperty({ description: '是否超级管理员', example: true })
    is_super: boolean;
    @SortValidators()
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiProperty({ description: '用户ID', example: 1 })
    @IsOptional()
    @IsNumber()
    id: number;
}
function PasswordValidators() {
+   return applyDecorators(IsString(),
+       MinLength(6, { message: i18nValidationMessage('validation.minLength', { field: 'password', length: 6 }) }),
+       MaxLength(8, { message: i18nValidationMessage('validation.maxLength', { field: 'password', length: 8 }) }),)
}
function EmailValidators() {
    return applyDecorators(IsEmail(), IsOptional())
}
function MobileValidators() {
    return applyDecorators(IsString(), IsOptional())
}
function StatusValidators() {
    return applyDecorators(IsNumber(), IsOptional(), Type(() => Number))
}
function IsSuperValidators() {
    return applyDecorators(IsBoolean(), IsOptional(), Type(() => Boolean))
}
function SortValidators() {
    return applyDecorators(IsNumber(), IsOptional(), Type(() => Number))
}

10.10. user.controller.ts
src/api/controllers/user.controller.ts

import { applyDecorators, Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseIntPipe, Post, Put, SerializeOptions, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from 'src/shared/dto/user.dto';
import { User } from 'src/shared/entities/user.entity';
import { UserService } from 'src/shared/services/user.service';
import { Result } from 'src/shared/vo/result';
+import { I18n, I18nContext } from 'nestjs-i18n';
@Controller('api/users')
@SerializeOptions({
    strategy: 'exposeAll'
})
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('api/users')
export class UserController {
+   constructor(
+       private readonly userService: UserService
+   ) { }
+   @Get('hello')
+   async getHello(@I18n() i18n: I18nContext) {
+       return await i18n.t('greeting.hello', {
+           args: { name: 'UserController' }
+       });
+   }
    @Get()
    @ApiFindAll()
    async findAll() {
        return this.userService.findAll();
    }
    @Get(":id")
    @ApiFindOne()
    async findOne(@Param("id", ParseIntPipe) id: number) {
        const result = await this.userService.findOne({ where: { id } });
        if (result) {
            return result;
        } else {
            throw new HttpException('用户未找到', HttpStatus.NOT_FOUND)
        }
    }
    @Post()
    @ApiCreate()
    async create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }
    @Put(":id")
    @ApiUpdate()
    async update(@Param("id", ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
        const result = await this.userService.update(id, updateUserDto);
        if (result.affected) {
            return Result.success('更新用户成功');
        } else {
            throw new HttpException('用户未找到', HttpStatus.NOT_FOUND)
        }
    }
    @Delete(":id")
    @ApiDelete()
    async delete(@Param("id", ParseIntPipe) id: number) {
        const result = await this.userService.delete(id);
        if (result.affected) {
            return Result.success('删除用户成功');
        } else {
            throw new HttpException('用户未找到', HttpStatus.NOT_FOUND)
        }
    }
}
function ApiFindAll() {
    return applyDecorators(
        ApiOperation({ summary: '获取所有的用户列表' }),
        ApiResponse({ status: 200, description: '成功返回用户列表', type: [User] })
    );
}
function ApiFindOne() {
    return applyDecorators(ApiOperation({ summary: '根据ID获取某个用户信息' }),
        ApiParam({ name: 'id', description: '用户ID', type: Number }),
        ApiResponse({ status: 200, description: '成功返回用户信息', type: User }),
        ApiResponse({ status: 404, description: '用户未找到' }))
}
function ApiCreate() {
    return applyDecorators(
        ApiOperation({ summary: '创建新用户' }),
        ApiBearerAuth(),
        ApiBody({ type: CreateUserDto }),
        ApiResponse({ status: 201, description: '用户创建成功', type: User }),
        ApiResponse({ status: 400, description: '请求参数错误' })
    );
}
function ApiUpdate() {
    return applyDecorators(
        ApiOperation({ summary: '更新用户信息' }),
        ApiBody({ type: UpdateUserDto }),
        ApiResponse({ status: 200, description: '用户信息更新成功', type: Result }),
        ApiResponse({ status: 400, description: '请求参数错误' }),
        ApiResponse({ status: 404, description: '用户未找到' })
    );
}
function ApiDelete() {
    return applyDecorators(
        ApiOperation({ summary: '根据ID删除用户' }),
        ApiParam({ name: 'id', description: '用户ID', type: Number }),
        ApiResponse({ status: 200, description: '用户删除成功', type: Result }),
        ApiResponse({ status: 404, description: '用户未找到' })
    );
}
11.修改用户
11.1. method-override.ts
src/shared/middlewares/method-override.ts

import { Request, Response, NextFunction } from 'express';
function methodOverride(req: Request, res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        req.method = req.body._method.toUpperCase();
        delete req.body._method;
    }
    next();
}
export default methodOverride;
11.2. user-list.hbs
views/user/user-list.hbs

<h1>用户列表</h1>
<a href="/admin/users/create" class="btn btn-success mb-3">添加用户</a>
<table class="table">
    <thead>
        <tr>
            <th>用户名</th>
            <th>邮箱</th>
+           <th>操作</th>
        </tr>
    </thead>
    <tbody>
        {{#each users}}
        <tr>
            <td>{{this.username}}</td>
            <td>{{this.email}}</td>
+           <td>
+               <a href="/admin/users/{{this.id}}/edit" class="btn btn-warning btn-sm">编辑</a>
+           </td>
        </tr>
        {{/each}}
    </tbody>
</table>
<script>
</script>
11.3. app.module.ts
src/app.module.ts

+import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { ApiModule } from './api/api.module';
import { SharedModule } from './shared/shared.module';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
+import methodOverride from 'src/shared/middlewares/method-override';
import * as path from 'path';
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
        new HeaderResolver(['x-lang']),
      ],
    }),
    SharedModule, AdminModule, ApiModule],
  controllers: [],
  providers: [],
})
+export class AppModule implements NestModule {
+ configure(consumer: MiddlewareConsumer) {
+   consumer
+     .apply(methodOverride).forRoutes('*');
+ }
+}
+

11.4. user-form.hbs
views/user/user-form.hbs

+<h1>{{#if user.id}}编辑用户{{else}}添加用户{{/if}}</h1>
+<form action="/admin/users{{#if user.id}}/{{user.id}}{{/if}}" method="POST">
+   {{#if user.id}}
+   <input type="hidden" name="_method" value="PUT">
+   {{/if}}
    <div class="mb-3">
        <label for="username" class="form-label">用户名</label>
+       <input type="text" class="form-control" id="username" name="username" value="{{user.username}}">
    </div>
    <div class="mb-3">
        <label for="username" class="form-label">密码</label>
        <input type="text" class="form-control" id="password" name="password" value="">
    </div>
    <div class="mb-3">
        <label for="email" class="form-label">邮箱</label>
+       <input type="email" class="form-control" id="email" name="email" value="{{user.email}}">
    </div>
    <div class="mb-3">
        <label for="status" class="form-label">状态</label>
        <select class="form-control" id="status" name="status">
+           <option value="1" {{#if user.status}}selected{{/if}}>激活</option>
+           <option value="0" {{#unless user.status}}selected{{/unless}}>未激活</option>
        </select>
    </div>
    <button type="submit" class="btn btn-primary">保存</button>
</form>
11.5. user.controller.ts
src/admin/controllers/user.controller.ts

+import { Get, Post, Controller, Render, Redirect, Body, Param, ParseIntPipe, Put, Res } from '@nestjs/common';
import { UserService } from 'src/shared/services/user.service';
+import { CreateUserDto, UpdateUserDto } from 'src/shared/dto/user.dto';
import { UtilityService } from 'src/shared/services/utility.service';
+import { Response } from 'express';
@Controller('admin/users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService
    ) { }
    @Get()
    @Render('user/user-list')
    async findAll() {
        const users = await this.userService.findAll();
        return { users };
    }
    @Get('create')
    @Render('user/user-form')
    createForm() {
        return { user: {} };
    }
    @Post()
    @Redirect('/admin/users')
    async create(@Body() createUserDto: CreateUserDto) {
        createUserDto.password = await this.utilityService.hashPassword(createUserDto.password);
        await this.userService.create(createUserDto);
        return { success: true };
    }
+   @Get(':id/edit')
+   @Render('user/user-form')
+   async editForm(@Param('id', ParseIntPipe) id: number) {
+       const user = await this.userService.findOne({ where: { id } });
+       if (!user) throw new Error('User not found');
+       return { user };
+   }
+
+   @Put(':id')
+   async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @Res() res: Response) {
+       if (updateUserDto.password) {
+           updateUserDto.password = await this.utilityService.hashPassword(updateUserDto.password);
+       } else {
+           delete updateUserDto.password;
+       }
+       await this.userService.update(id, updateUserDto);
+       return res.redirect('/admin/users');
+   }
}
12.查看用户
12.1. validation.json
src/i18n/zh/validation.json

{
    "minLength": "{field}至少要有{length}个字符。",
+   "maxLength": "{field}不能超过{length}个字符。",
+   "isNotEmpty": "{field}不能为空。"
}
12.2. validation.json
src/i18n/en/validation.json

{
    "minLength": "The {field} must be at least {length} characters.",
+   "maxLength": "The {field} must not exceed {length} characters.",
+   "isNotEmpty": "The {field} field is required."
}
12.3. user-detail.hbs
views/user/user-detail.hbs

<h1>用户详情</h1>
<div class="mb-3">
    <label class="form-label">用户名:</label>
    <p class="form-control-plaintext">{{user.username}}</p>
</div>
<div class="mb-3">
    <label class="form-label">邮箱:</label>
    <p class="form-control-plaintext">{{user.email}}</p>
</div>
<div class="mb-3">
    <label class="form-label">状态:</label>
    <p class="form-control-plaintext">{{#if user.status}}激活{{else}}未激活{{/if}}</p>
</div>
<a href="/admin/users/{{user.id}}/edit" class="btn btn-warning">编辑</a>
<a href="/admin/users" class="btn btn-secondary">返回列表</a>
12.4. user-list.hbs
views/user/user-list.hbs

<h1>用户列表</h1>
<a href="/admin/users/create" class="btn btn-success mb-3">添加用户</a>
<table class="table">
    <thead>
        <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>操作</th>
        </tr>
    </thead>
    <tbody>
        {{#each users}}
        <tr>
            <td>{{this.username}}</td>
            <td>{{this.email}}</td>
            <td>
+               <a href="/admin/users/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
                <a href="/admin/users/{{this.id}}/edit" class="btn btn-warning btn-sm">编辑</a>
            </td>
        </tr>
        {{/each}}
    </tbody>
</table>
<script>
</script>
12.5. main.ts
src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { I18nValidationPipe, I18nValidationExceptionFilter } from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.engine('hbs', engine({
    extname: '.hbs',
    runtimeOptions: {
      allowProtoMethodsByDefault: true,
      allowProtoPropertiesByDefault: true
    }
  }));
  app.set('view engine', 'hbs');
  app.use(cookieParser());
  app.use(session({
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  }));
  app.useGlobalPipes(new I18nValidationPipe({ transform: true }));
+ //app.useGlobalFilters(new I18nValidationExceptionFilter({ detailedErrors: false }));
  const config = new DocumentBuilder()
    .setTitle('CMS API')
    .setDescription('CMS API 描述')
    .setVersion("1.0")
    .addTag('CMS')
    .addCookieAuth('connect.sid')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer'
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, document);
  await app.listen(3000);
}
bootstrap();

12.6. user.controller.ts
src/admin/controllers/user.controller.ts

+import { Get, Post, Controller, Render, Redirect, Body, Param, ParseIntPipe, Put, Res, Query } from '@nestjs/common';
import { UserService } from 'src/shared/services/user.service';
import { CreateUserDto, UpdateUserDto } from 'src/shared/dto/user.dto';
import { UtilityService } from 'src/shared/services/utility.service';
import { Response } from 'express';
@Controller('admin/users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService
    ) { }
    @Get()
    @Render('user/user-list')
    async findAll() {
        const users = await this.userService.findAll();
        return { users };
    }
    @Get('create')
    @Render('user/user-form')
    createForm() {
        return { user: {} };
    }
    @Post()
    @Redirect('/admin/users')
    async create(@Body() createUserDto: CreateUserDto) {
        createUserDto.password = await this.utilityService.hashPassword(createUserDto.password);
        await this.userService.create(createUserDto);
        return { success: true };
    }
    @Get(':id/edit')
    @Render('user/user-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.findOne({ where: { id } });
        if (!user) throw new Error('User not found');
        return { user };
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @Res() res: Response) {
        if (updateUserDto.password) {
            updateUserDto.password = await this.utilityService.hashPassword(updateUserDto.password);
        } else {
            delete updateUserDto.password;
        }
        await this.userService.update(id, updateUserDto);
        return res.redirect('/admin/users');
    }
+   @Get(':id')
+   @Render('user/user-detail')
+   async findOne(@Param('id', ParseIntPipe) id: number, @Query('type') type: string, @Res() res: Response) {
+       const user = await this.userService.findOne({ where: { id } });
+       if (!user) throw new Error('User not found');
+       return { user };
+   }
}

12.7. admin-exception.filter.ts
src/admin/filters/admin-exception.filter.ts

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
+import { I18nValidationException, I18nService } from 'nestjs-i18n';
@Catch(HttpException)
export class AdminExceptionFilter implements ExceptionFilter {
+   constructor(private readonly i18n: I18nService) { }
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();

        let errorMessage = exception.message;
        if (exception instanceof BadRequestException) {
            const responseBody: any = exception.getResponse();
            if (typeof responseBody === 'object' && responseBody.message) {
                errorMessage = Array.isArray(responseBody.message)
                    ? responseBody.message.join(', ')
                    : responseBody.message;
            }
+       } else if (exception instanceof I18nValidationException) {
+           errorMessage = exception.errors
+               .map(error => {
+                   return this.formatSingleErrorMessage(Object.values(error.constraints).join(', '), ctx.getRequest().i18nLang);
+               })
+               .join(', ');
        }
        response.status(status).render('error', {
            message: errorMessage,
            redirectUrl: ctx.getRequest().url,
        });
    }
+   private formatSingleErrorMessage(message: string, lang: string): string {
+       const formattedMessages = message.split(', ').map(msg => {
+           const [key, params] = msg.split('|');
+           if (params) {
+               try {
+                   const parsedParams = JSON.parse(params);
+                   return this.i18n.translate(key, {
+                       lang,
+                       args: parsedParams,
+                   });
+               } catch (error) {
+                   return msg;
+               }
+           }
+           return msg;
+       });
+       return formattedMessages.join(', ');
+   }
}
+/**
+[
+ {
+   property: 'username',
+   value: 'user_66',
+   constraints: { IsUsernameUnique: 'username user_66 已经被使用！' }
+ },
+ {
+   property: 'password',
+   value: '',
+   constraints: {
+     minLength: 'validation.minLength|{"value":"","constraints":[6],"field":"password","length":6}'
+   }
+ }
+]
+*/
12.8. user.dto.ts
src/shared/dto/user.dto.ts

import { applyDecorators } from '@nestjs/common';
+import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
+import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, MinLength, MaxLength, Validate, IsNotEmpty, } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUsernameUniqueConstraint, StartsWithConstraint } from 'src/shared/validators/user-validator';
+import { PartialType, OmitType } from '@nestjs/mapped-types'
export class CreateUserDto {
    @Validate(StartsWithConstraint, ['user_'])
    @Validate(IsUsernameUniqueConstraint)
    @ApiProperty({ description: '用户名', example: 'nick' })
    username: string;
+
    @PasswordValidators()
    @ApiProperty({ description: '密码', example: '666666' })
    password: string;
    @MobileValidators()
    @ApiProperty({ description: '手机号', example: '15788888888' })
    @ApiPropertyOptional()
    mobile: string;
    @EmailValidators()
    @ApiProperty({ description: '邮件', example: 'nick@qq.com' })
    email: string;
    @StatusValidators()
    @ApiProperty({ description: '状态', example: 1 })
    status: number;
    @IsSuperValidators()
    @ApiProperty({ description: '是否超级管理员', example: true })
    is_super: boolean;
    @SortValidators()
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;
}
+export class UpdateUserDto extends OmitType(PartialType(CreateUserDto), ['username', 'password']) {
    @ApiProperty({ description: '用户ID', example: 1 })
    @IsOptional()
    @IsNumber()
    id: number;
+
+   @IsString()
+   @ApiProperty({ description: '用户名', example: 'nick' })
+   @IsOptional()
+   username: string;
+
+   @IsString()
+   @IsOptional()
+   @ApiProperty({ description: '密码', example: '666666' })
+   password: string;
+
}
function PasswordValidators() {
+   return applyDecorators(
+       IsString(),
+       IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty', { field: 'password' }) }),
        MinLength(6, { message: i18nValidationMessage('validation.minLength', { field: 'password', length: 6 }) }),
        MaxLength(8, { message: i18nValidationMessage('validation.maxLength', { field: 'password', length: 8 }) }),)
}
function EmailValidators() {
    return applyDecorators(IsEmail(), IsOptional())
}
function MobileValidators() {
    return applyDecorators(IsString(), IsOptional())
}
function StatusValidators() {
    return applyDecorators(IsNumber(), IsOptional(), Type(() => Number))
}
function IsSuperValidators() {
    return applyDecorators(IsBoolean(), IsOptional(), Type(() => Boolean))
}
function SortValidators() {
    return applyDecorators(IsNumber(), IsOptional(), Type(() => Number))
}
13.删除用户
jquery
13.1. main.hbs
views/layouts/main.hbs

<!doctype html>
<html lang="en">

<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1">
 <title>Bootstrap demo</title>
 <link href="/style/bootstrap.min.css" rel="stylesheet">
</head>

<body>
 {{> header }}
 <div class="container-fluid">
   <div class="row">
     {{> sidebar}}
     <div class="col-md-9 col-lg-10">
       <div class="container mt-4">
         {{{body}}}
        </div>
     </div>
    </div>
 </div>
 <script src="/js/bootstrap.bundle.min.js"></script>
+<script src="/js/jquery-3.7.1.min.js"></script>
</body>
</html>
13.2. user-list.hbs
views/user/user-list.hbs

<h1>用户列表</h1>
<a href="/admin/users/create" class="btn btn-success mb-3">添加用户</a>
<table class="table">
    <thead>
        <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>操作</th>
        </tr>
    </thead>
    <tbody>
        {{#each users}}
        <tr>
            <td>{{this.username}}</td>
            <td>{{this.email}}</td>
            <td>
                <a href="/admin/users/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
                <a href="/admin/users/{{this.id}}/edit" class="btn btn-warning btn-sm">编辑</a>
+               <button class="btn btn-danger btn-sm" onclick="deleteUser({{this.id}})">删除</button>
            </td>
        </tr>
        {{/each}}
    </tbody>
</table>
<script>
+   function deleteUser(id) {
+       if (confirm('确定删除吗？')) {
+           $.ajax({
+               url: `/admin/users/${id}`,
+               type: 'DELETE',
+               success: function (data) {
+                   if (data.success) {
+                       location.reload();
+                   }
+               }
+           });
+       }
+   }
</script>
13.3. user.controller.ts
src/admin/controllers/user.controller.ts

+import { Get, Post, Controller, Render, Redirect, Body, Param, ParseIntPipe, Put, Res, Query, Delete } from '@nestjs/common';
import { UserService } from 'src/shared/services/user.service';
import { CreateUserDto, UpdateUserDto } from 'src/shared/dto/user.dto';
import { UtilityService } from 'src/shared/services/utility.service';
import { Response } from 'express';
@Controller('admin/users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService
    ) { }
    @Get()
    @Render('user/user-list')
    async findAll() {
        const users = await this.userService.findAll();
        return { users };
    }
    @Get('create')
    @Render('user/user-form')
    createForm() {
        return { user: {} };
    }
    @Post()
    @Redirect('/admin/users')
    async create(@Body() createUserDto: CreateUserDto) {
        createUserDto.password = await this.utilityService.hashPassword(createUserDto.password);
        await this.userService.create(createUserDto);
        return { success: true };
    }
    @Get(':id/edit')
    @Render('user/user-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.findOne({ where: { id } });
        if (!user) throw new Error('User not found');
        return { user };
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @Res() res: Response) {
        if (updateUserDto.password) {
            updateUserDto.password = await this.utilityService.hashPassword(updateUserDto.password);
        } else {
            delete updateUserDto.password;
        }
        await this.userService.update(id, updateUserDto);
        return res.redirect('/admin/users');
    }
    @Get(':id')
    @Render('user/user-detail')
    async findOne(@Param('id', ParseIntPipe) id: number, @Query('type') type: string, @Res() res: Response) {
        const user = await this.userService.findOne({ where: { id } });
        if (!user) throw new Error('User not found');
        return { user };
    }
+   @Delete(':id')
+   async delete(@Param('id', ParseIntPipe) id: number) {
+       await this.userService.delete(id);
+       return { success: true };
+   }
}
14.切换状态
bootstrap-icons
jQuery.ajax
public
14.1. main.hbs
views/layouts/main.hbs

<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bootstrap demo</title>
  <link href="/style/bootstrap.min.css" rel="stylesheet">
+ <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
+ <script src="/js/jquery.min.js"></script>
</head>

<body>
  {{> header }}
  <div class="container-fluid">
    <div class="row">
      {{> sidebar}}
      <div class="col-md-9 col-lg-10">
        <div class="container mt-4">
          {{{body}}}
        </div>
      </div>
    </div>
  </div>
  <script src="/js/bootstrap.bundle.min.js"></script>
</body>

</html>
14.2. main.ts
src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
+import { I18nValidationPipe } from 'nestjs-i18n';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.engine('hbs', engine({
    extname: '.hbs',
    runtimeOptions: {
      allowProtoMethodsByDefault: true,
      allowProtoPropertiesByDefault: true
    }
  }));
  app.set('view engine', 'hbs');
  app.use(cookieParser());
  app.use(session({
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  }));
+ app.useGlobalPipes(new I18nValidationPipe({ transform: true }));
+ //app.useGlobalFilters(new I18nValidationExceptionFilter({ detailedErrors: false }));
  const config = new DocumentBuilder()
    .setTitle('CMS API')
    .setDescription('CMS API 描述')
    .setVersion("1.0")
    .addTag('CMS')
    .addCookieAuth('connect.sid')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer'
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, document);
  await app.listen(3000);
}
bootstrap();
14.3. user.controller.ts
src/admin/controllers/user.controller.ts

+import { Get, Post, Controller, Render, Redirect, Body, Param, ParseIntPipe, Put, Res, Query, Delete, UseFilters, Headers } from '@nestjs/common';
import { UserService } from 'src/shared/services/user.service';
import { CreateUserDto, UpdateUserDto } from 'src/shared/dto/user.dto';
import { UtilityService } from 'src/shared/services/utility.service';
import { Response } from 'express';
+import { AdminExceptionFilter } from '../filters/admin-exception.filter';
+@UseFilters(AdminExceptionFilter)
@Controller('admin/users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService
    ) { }
    @Get()
    @Render('user/user-list')
    async findAll() {
        const users = await this.userService.findAll();
        return { users };
    }
    @Get('create')
    @Render('user/user-form')
    createForm() {
        return { user: {} };
    }
    @Post()
    @Redirect('/admin/users')
    async create(@Body() createUserDto: CreateUserDto) {
        createUserDto.password = await this.utilityService.hashPassword(createUserDto.password);
        await this.userService.create(createUserDto);
        return { success: true };
    }
    @Get(':id/edit')
    @Render('user/user-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.findOne({ where: { id } });
        if (!user) throw new Error('User not found');
        return { user };
    }

    @Put(':id')
+   async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @Res() res: Response, @Headers('accept') accept: string) {
        if (updateUserDto.password) {
            updateUserDto.password = await this.utilityService.hashPassword(updateUserDto.password);
        } else {
            delete updateUserDto.password;
        }
        await this.userService.update(id, updateUserDto);
+       if (accept === 'application/json') {
+           return res.json({ success: true });
+       } else {
+           return res.redirect('/admin/users');
+       }
    }
    @Get(':id')
    @Render('user/user-detail')
    async findOne(@Param('id', ParseIntPipe) id: number, @Query('type') type: string, @Res() res: Response) {
        const user = await this.userService.findOne({ where: { id } });
        if (!user) throw new Error('User not found');
        return { user };
    }
    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.userService.delete(id);
        return { success: true };
    }
}
14.4. user-list.hbs
views/user/user-list.hbs

<h1>用户列表</h1>
<a href="/admin/users/create" class="btn btn-success mb-3">添加用户</a>
<table class="table">
    <thead>
        <tr>
            <th>用户名</th>
            <th>邮箱</th>
+           <th>状态</th>
            <th>操作</th>
        </tr>
    </thead>
    <tbody>
        {{#each users}}
        <tr>
            <td>{{this.username}}</td>
            <td>{{this.email}}</td>
+           <td>
+               <span class="status-toggle" data-id="{{this.id}}" data-status="{{this.status}}">
+                   {{#if this.status}}
+                   <i class="bi bi-check-circle-fill text-success"></i>
+                   {{else}}
+                   <i class="bi bi-x-circle-fill text-danger"></i>
+                   {{/if}}
+               </span>
+           </td>
            <td>
                <a href="/admin/users/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
                <a href="/admin/users/{{this.id}}/edit" class="btn btn-warning btn-sm">编辑</a>
                <button class="btn btn-danger btn-sm" onclick="deleteUser({{this.id}})">删除</button>
            </td>
        </tr>
        {{/each}}
    </tbody>
</table>
<script>
+   $(function () {
+       $('.status-toggle').on('click', function () {
+           const $this = $(this);
+           const userId = $this.data('id');
+           const currentStatus = $this.data('status');
+           const newStatus = currentStatus === 1 ? 0 : 1;
+           $.ajax({
+               url: `/admin/users/${userId}`,
+               type: 'PUT',
+               contentType: 'application/json',
+               headers: {
+                   'accept': 'application/json'
+               },
+               data: JSON.stringify({ status: newStatus }),
+               success: function (response) {
+                   if (response.success) {
+                       $this.data('status', newStatus);
+                       $this.html(`<i class="bi ${newStatus ? "bi-check-circle-fill" : "bi-x-circle-fill"} ${newStatus ? "text-success" : "text-danger"}"></i>`);
+                   }
+               },
+               error: function (error) {
+                   const { responseJSON } = error;
+                   alert(responseJSON.message);
+               }
+           });
+       });
+   });
    function deleteUser(id) {
        if (confirm('确定删除吗？')) {
            $.ajax({
                url: `/admin/users/${id}`,
                type: 'DELETE',
                success: function (data) {
                    if (data.success) {
                        location.reload();
                    }
                }
            });
        }
    }
</script>
14.5. admin-exception.filter.ts
src/admin/filters/admin-exception.filter.ts

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { I18nValidationException, I18nService } from 'nestjs-i18n';
@Catch(HttpException)
export class AdminExceptionFilter implements ExceptionFilter {
    constructor(private readonly i18n: I18nService) { }
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
+       const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();

        let errorMessage = exception.message;
        if (exception instanceof BadRequestException) {
            const responseBody: any = exception.getResponse();
            if (typeof responseBody === 'object' && responseBody.message) {
                errorMessage = Array.isArray(responseBody.message)
                    ? responseBody.message.join(', ')
                    : responseBody.message;
            }
        } else if (exception instanceof I18nValidationException) {
            errorMessage = exception.errors
                .map(error => {
                    return this.formatSingleErrorMessage(Object.values(error.constraints).join(', '), ctx.getRequest().i18nLang);
                })
                .join(', ');
        }
+       if (request.headers['accept'] === 'application/json') {
+           response.status(status).json({
+               statusCode: status,
+               message: errorMessage
+           });
+       } else {
+           response.status(status).render('error', {
+               message: errorMessage,
+               redirectUrl: ctx.getRequest().url,
+           });
+       }
    }
    private formatSingleErrorMessage(message: string, lang: string): string {
        const formattedMessages = message.split(', ').map(msg => {
            const [key, params] = msg.split('|');
            if (params) {
                try {
                    const parsedParams = JSON.parse(params);
                    return this.i18n.translate(key, {
                        lang,
                        args: parsedParams,
                    });
                } catch (error) {
                    return msg;
                }
            }
            return msg;
        });
        return formattedMessages.join(', ');
    }
}
/**
[
  {
    property: 'username',
    value: 'user_66',
    constraints: { IsUsernameUnique: 'username user_66 已经被使用！' }
  },
  {
    property: 'password',
    value: '',
    constraints: {
      minLength: 'validation.minLength|{"value":"","constraints":[6],"field":"password","length":6}'
    }
  }
]
 */
15.修改排序字段
15.1. user-list.hbs
views/user/user-list.hbs

<h1>用户列表</h1>
<a href="/admin/users/create" class="btn btn-success mb-3">添加用户</a>
<table class="table">
    <thead>
        <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>状态</th>
+           <th>排序</th>
            <th>操作</th>
        </tr>
    </thead>
    <tbody>
        {{#each users}}
        <tr>
            <td>{{this.username}}</td>
            <td>{{this.email}}</td>
            <td>
                <span class="status-toggle" data-id="{{this.id}}" data-status="{{this.status}}">
                    {{#if this.status}}
                    <i class="bi bi-check-circle-fill text-success"></i>
                    {{else}}
                    <i class="bi bi-x-circle-fill text-danger"></i>
                    {{/if}}
                </span>
            </td>
+           <td>
+               <span class="sort-text" data-id="{{this.id}}">{{this.sort}}</span>
+               <input type="number" class="form-control sort-input d-none" style="width:80px" data-id="{{this.id}}"
+                   value="{{this.sort}}">
+           </td>
            <td>
                <a href="/admin/users/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
                <a href="/admin/users/{{this.id}}/edit" class="btn btn-warning btn-sm">编辑</a>
                <button class="btn btn-danger btn-sm" onclick="deleteUser({{this.id}})">删除</button>
            </td>
        </tr>
        {{/each}}
    </tbody>
</table>
<script>
    $(function () {
+       $('.sort-text').on('dblclick', function () {
+           const userId = $(this).data('id');
+           $(this).addClass('d-none');
+           $(`.sort-input[data-id="${userId}"]`).removeClass('d-none').focus();
+       });
+
+       $('.sort-input').on('blur', function () {
+           const userId = $(this).data('id');
+           const newSort = $(this).val();
+           $(this).addClass('d-none');
+           $(`.sort-text[data-id="${userId}"]`).removeClass('d-none').text(newSort);
+           $.ajax({
+               url: `/admin/users/${userId}`,
+               type: 'PUT',
+               contentType: 'application/json',
+               headers: {
+                   'accept': 'application/json'
+               },
+               data: JSON.stringify({ sort: newSort }),
+               success: function (response) {
+                   if (response.success) {
+                       $(`.sort-text[data-id="${userId}"]`).text(newSort);
+                   }
+               }
+           });
+       });
+
+       $('.sort-input').on('keypress', function (e) {
+           if (e.which == 13) {
+               $(this).blur();
+           }
+       });
        $('.status-toggle').on('click', function () {
            const $this = $(this);
            const userId = $this.data('id');
            const currentStatus = $this.data('status');
            const newStatus = currentStatus === 1 ? 0 : 1;
            $.ajax({
                url: `/admin/users/${userId}`,
                type: 'PUT',
                contentType: 'application/json',
                headers: {
                    'accept': 'application/json'
                },
                data: JSON.stringify({ status: newStatus }),
                success: function (response) {
                    if (response.success) {
                        $this.data('status', newStatus);
                        $this.html(`<i class="bi ${newStatus ? "bi-check-circle-fill" : "bi-x-circle-fill"} ${newStatus ? "text-success" : "text-danger"}"></i>`);
                    }
                },
                error: function (error) {
                    const { responseJSON } = error;
                    alert(responseJSON.message);
                }
            });
        });
    });
    function deleteUser(id) {
        if (confirm('确定删除吗？')) {
            $.ajax({
                url: `/admin/users/${id}`,
                type: 'DELETE',
                success: function (data) {
                    if (data.success) {
                        location.reload();
                    }
                }
            });
        }
    }
</script>
16.搜索用户
16.1. user.service.ts
src/shared/services/user.service.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
+import { Repository, Like } from 'typeorm';
import { MySQLBaseService } from "./mysql-base.service";
@Injectable()
export class UserService extends MySQLBaseService<User> {
  constructor(
    @InjectRepository(User) protected repository: Repository<User>
  ) {
    super(repository);
  }
+ async findAll(search: string = ''): Promise<User[]> {
+   const where = search ? [
+     { username: Like(`%${search}%`) },
+     { email: Like(`%${search}%`) }
+   ] : {};
+
+   const users = await this.repository.find({
+     where
+   });
+   return users;
+ }
}
16.2. user.controller.ts
src/admin/controllers/user.controller.ts

import { Get, Post, Controller, Render, Redirect, Body, Param, ParseIntPipe, Put, Res, Query, Delete, UseFilters, Headers } from '@nestjs/common';
import { UserService } from 'src/shared/services/user.service';
import { CreateUserDto, UpdateUserDto } from 'src/shared/dto/user.dto';
import { UtilityService } from 'src/shared/services/utility.service';
import { Response } from 'express';
import { AdminExceptionFilter } from '../filters/admin-exception.filter';
@UseFilters(AdminExceptionFilter)
@Controller('admin/users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService
    ) { }
    @Get()
    @Render('user/user-list')
+   async findAll(@Query('search') search: string = '') {
+       const users = await this.userService.findAll(search);
        return { users };
    }
    @Get('create')
    @Render('user/user-form')
    createForm() {
        return { user: {} };
    }
    @Post()
    @Redirect('/admin/users')
    async create(@Body() createUserDto: CreateUserDto) {
        createUserDto.password = await this.utilityService.hashPassword(createUserDto.password);
        await this.userService.create(createUserDto);
        return { success: true };
    }
    @Get(':id/edit')
    @Render('user/user-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.findOne({ where: { id } });
        if (!user) throw new Error('User not found');
        return { user };
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @Res() res: Response, @Headers('accept') accept: string) {
        if (updateUserDto.password) {
            updateUserDto.password = await this.utilityService.hashPassword(updateUserDto.password);
        } else {
            delete updateUserDto.password;
        }
        await this.userService.update(id, updateUserDto);
        if (accept === 'application/json') {
            return res.json({ success: true });
        } else {
            return res.redirect('/admin/users');
        }
    }
    @Get(':id')
    @Render('user/user-detail')
    async findOne(@Param('id', ParseIntPipe) id: number, @Query('type') type: string, @Res() res: Response) {
        const user = await this.userService.findOne({ where: { id } });
        if (!user) throw new Error('User not found');
        return { user };
    }
    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.userService.delete(id);
        return { success: true };
    }
}

16.3. user-list.hbs
views/user/user-list.hbs

<h1>用户列表</h1>
<a href="/admin/users/create" class="btn btn-success mb-3">添加用户</a>
+<form method="GET" action="/admin/users" class="mb-3">
+   <div class="input-group">
+       <input type="text" name="search" class="form-control" placeholder="搜索用户名或邮箱" value="{{search}}">
+       <button class="btn btn-outline-secondary" type="submit">搜索</button>
+   </div>
+</form>
<table class="table">
    <thead>
        <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>状态</th>
            <th>排序</th>
            <th>操作</th>
        </tr>
    </thead>
    <tbody>
        {{#each users}}
        <tr>
            <td>{{this.username}}</td>
            <td>{{this.email}}</td>
            <td>
                <span class="status-toggle" data-id="{{this.id}}" data-status="{{this.status}}">
                    {{#if this.status}}
                    <i class="bi bi-check-circle-fill text-success"></i>
                    {{else}}
                    <i class="bi bi-x-circle-fill text-danger"></i>
                    {{/if}}
                </span>
            </td>
            <td>
                <span class="sort-text" data-id="{{this.id}}">{{this.sort}}</span>
                <input type="number" class="form-control sort-input d-none" style="width:80px" data-id="{{this.id}}"
                    value="{{this.sort}}">
            </td>
            <td>
                <a href="/admin/users/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
                <a href="/admin/users/{{this.id}}/edit" class="btn btn-warning btn-sm">编辑</a>
                <button class="btn btn-danger btn-sm" onclick="deleteUser({{this.id}})">删除</button>
            </td>
        </tr>
        {{/each}}
    </tbody>
</table>
<script>
    $(function () {
        $('.sort-text').on('dblclick', function () {
            const userId = $(this).data('id');
            $(this).addClass('d-none');
            $(`.sort-input[data-id="${userId}"]`).removeClass('d-none').focus();
        });

        $('.sort-input').on('blur', function () {
            const userId = $(this).data('id');
            const newSort = $(this).val();
            $(this).addClass('d-none');
            $(`.sort-text[data-id="${userId}"]`).removeClass('d-none').text(newSort);
            $.ajax({
                url: `/admin/users/${userId}`,
                type: 'PUT',
                contentType: 'application/json',
                headers: {
                    'accept': 'application/json'
                },
                data: JSON.stringify({ sort: newSort }),
                success: function (response) {
                    if (response.success) {
                        $(`.sort-text[data-id="${userId}"]`).text(newSort);
                    }
                }
            });
        });

        $('.sort-input').on('keypress', function (e) {
            if (e.which == 13) {
                $(this).blur();
            }
        });
        $('.status-toggle').on('click', function () {
            const $this = $(this);
            const userId = $this.data('id');
            const currentStatus = $this.data('status');
            const newStatus = currentStatus === 1 ? 0 : 1;
            $.ajax({
                url: `/admin/users/${userId}`,
                type: 'PUT',
                contentType: 'application/json',
                headers: {
                    'accept': 'application/json'
                },
                data: JSON.stringify({ status: newStatus }),
                success: function (response) {
                    if (response.success) {
                        $this.data('status', newStatus);
                        $this.html(`<i class="bi ${newStatus ? "bi-check-circle-fill" : "bi-x-circle-fill"} ${newStatus ? "text-success" : "text-danger"}"></i>`);
                    }
                },
                error: function (error) {
                    const { responseJSON } = error;
                    alert(responseJSON.message);
                }
            });
        });
    });
    function deleteUser(id) {
        if (confirm('确定删除吗？')) {
            $.ajax({
                url: `/admin/users/${id}`,
                type: 'DELETE',
                success: function (data) {
                    if (data.success) {
                        location.reload();
                    }
                }
            });
        }
    }
</script>
17.用户分页
17.1. eq.ts
src/shared/helpers/eq.ts

export function eq(a, b) {
    return a === b;
};
17.2. dec.ts
src/shared/helpers/dec.ts

export function dec(value) {
    return value - 1;
};
17.3. inc.ts
src/shared/helpers/inc.ts

export function inc(value) {
    return Number(value) + 1;
};
17.4. index.ts
src/shared/helpers/index.ts

export * from './eq';
export * from './inc';
export * from './dec';
export * from './range';
17.5. range.ts
src/shared/helpers/range.ts

export function range(start, end) {
    let result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
};
17.6. parse-optional-int.pipe.ts
src/shared/pipes/parse-optional-int.pipe.ts

import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
@Injectable()
export class ParseOptionalIntPipe implements PipeTransform<string, number> {
    constructor(private readonly defaultValue: number) { }
    transform(value: string, metadata: ArgumentMetadata): number {
        if (!value) {
            return this.defaultValue;
        }
        const parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue)) {
            throw new BadRequestException(`Validation failed. "${value}" is not an integer.`);
        }
        return parsedValue;
    }
}
17.7. user.service.ts
src/shared/services/user.service.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository, Like } from 'typeorm';
import { MySQLBaseService } from "./mysql-base.service";
@Injectable()
export class UserService extends MySQLBaseService<User> {
  constructor(
    @InjectRepository(User) protected repository: Repository<User>
  ) {
    super(repository);
  }
  async findAll(search: string = ''): Promise<User[]> {
    const where = search ? [
      { username: Like(`%${search}%`) },
      { email: Like(`%${search}%`) }
    ] : {};

    const users = await this.repository.find({
      where
    });
    return users;
  }
+ async findAllWithPagination(page: number = 1, limit: number = 10, search: string = ''): Promise<{ users: User[], total: number }> {
+   const where = search ? [
+     { username: Like(`%${search}%`) },
+     { email: Like(`%${search}%`) }
+   ] : {};
+
+   const [users, total] = await this.repository.findAndCount({
+     where,
+     skip: (page - 1) * limit,
+     take: limit,
+   });
+   return { users, total };
+ }
}
17.8. main.ts
src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { I18nValidationPipe } from 'nestjs-i18n';
+import * as helpers from 'src/shared/helpers';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.engine('hbs', engine({
    extname: '.hbs',
+   helpers,
    runtimeOptions: {
      allowProtoMethodsByDefault: true,
      allowProtoPropertiesByDefault: true
    }
  }));
  app.set('view engine', 'hbs');
  app.use(cookieParser());
  app.use(session({
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  }));
  app.useGlobalPipes(new I18nValidationPipe({ transform: true }));
  //app.useGlobalFilters(new I18nValidationExceptionFilter({ detailedErrors: false }));
  const config = new DocumentBuilder()
    .setTitle('CMS API')
    .setDescription('CMS API 描述')
    .setVersion("1.0")
    .addTag('CMS')
    .addCookieAuth('connect.sid')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer'
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, document);
  await app.listen(3000);
}
bootstrap();

17.9. user.controller.ts
src/admin/controllers/user.controller.ts

import { Get, Post, Controller, Render, Redirect, Body, Param, ParseIntPipe, Put, Res, Query, Delete, UseFilters, Headers } from '@nestjs/common';
import { UserService } from 'src/shared/services/user.service';
import { CreateUserDto, UpdateUserDto } from 'src/shared/dto/user.dto';
import { UtilityService } from 'src/shared/services/utility.service';
import { Response } from 'express';
import { AdminExceptionFilter } from '../filters/admin-exception.filter';
+import { ParseOptionalIntPipe } from 'src/shared/pipes/parse-optional-int.pipe';
@UseFilters(AdminExceptionFilter)
@Controller('admin/users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService
    ) { }
    @Get()
    @Render('user/user-list')
+   async findAll(@Query('search') search: string = '', @Query('page', new ParseOptionalIntPipe(1)) page: number, @Query('limit', new ParseOptionalIntPipe(10)) limit: number) {
+       const { users, total } = await this.userService.findAllWithPagination(page, limit, search);
+       const pageCount = Math.ceil(total / limit);
+       return { users, search, page, limit, pageCount };
    }
    @Get('create')
    @Render('user/user-form')
    createForm() {
        return { user: {} };
    }
    @Post()
    @Redirect('/admin/users')
    async create(@Body() createUserDto: CreateUserDto) {
        createUserDto.password = await this.utilityService.hashPassword(createUserDto.password);
        await this.userService.create(createUserDto);
        return { success: true };
    }
    @Get(':id/edit')
    @Render('user/user-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.findOne({ where: { id } });
        if (!user) throw new Error('User not found');
        return { user };
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @Res() res: Response, @Headers('accept') accept: string) {
        if (updateUserDto.password) {
            updateUserDto.password = await this.utilityService.hashPassword(updateUserDto.password);
        } else {
            delete updateUserDto.password;
        }
        await this.userService.update(id, updateUserDto);
        if (accept === 'application/json') {
            return res.json({ success: true });
        } else {
            return res.redirect('/admin/users');
        }
    }
    @Get(':id')
    @Render('user/user-detail')
    async findOne(@Param('id', ParseIntPipe) id: number, @Query('type') type: string, @Res() res: Response) {
        const user = await this.userService.findOne({ where: { id } });
        if (!user) throw new Error('User not found');
        return { user };
    }
    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.userService.delete(id);
        return { success: true };
    }
}

17.10. user-list.hbs
views/user/user-list.hbs

<h1>用户列表</h1>
<a href="/admin/users/create" class="btn btn-success mb-3">添加用户</a>
<form method="GET" action="/admin/users" class="mb-3">
    <div class="input-group">
        <input type="text" name="search" class="form-control" placeholder="搜索用户名或邮箱" value="{{search}}">
        <button class="btn btn-outline-secondary" type="submit">搜索</button>
    </div>
</form>
<table class="table">
    <thead>
        <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>状态</th>
            <th>排序</th>
            <th>操作</th>
        </tr>
    </thead>
    <tbody>
        {{#each users}}
        <tr>
            <td>{{this.username}}</td>
            <td>{{this.email}}</td>
            <td>
                <span class="status-toggle" data-id="{{this.id}}" data-status="{{this.status}}">
                    {{#if this.status}}
                    <i class="bi bi-check-circle-fill text-success"></i>
                    {{else}}
                    <i class="bi bi-x-circle-fill text-danger"></i>
                    {{/if}}
                </span>
            </td>
            <td>
                <span class="sort-text" data-id="{{this.id}}">{{this.sort}}</span>
                <input type="number" class="form-control sort-input d-none" style="width:80px" data-id="{{this.id}}"
                    value="{{this.sort}}">
            </td>
            <td>
                <a href="/admin/users/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
                <a href="/admin/users/{{this.id}}/edit" class="btn btn-warning btn-sm">编辑</a>
                <button class="btn btn-danger btn-sm" onclick="deleteUser({{this.id}})">删除</button>
            </td>
        </tr>
        {{/each}}
    </tbody>
</table>
+<nav>
+   <ul class="pagination">
+       <li class="page-item {{#if (eq page 1)}}disabled{{/if}}">
+           <a class="page-link" href="?page={{dec page}}&search={{search}}&limit={{limit}}">上一页</a>
+       </li>
+       {{#each (range 1 pageCount)}}
+       <li class="page-item {{#if (eq this ../page)}}active{{/if}}">
+           <a class="page-link" href="?page={{this}}&search={{../search}}&limit={{../limit}}">{{this}}</a>
+       </li>
+       {{/each}}
+       <li class="page-item {{#if (eq page pageCount)}}disabled{{/if}}">
+           <a class="page-link" href="?page={{inc page}}&search={{search}}&limit={{limit}}">下一页</a>
+       </li>
+       <li class="page-item">
+           <form method="GET" action="/admin/users" class="d-inline-block ms-3">
+               <input type="hidden" name="search" value="{{search}}">
+               <input type="hidden" name="page" value="{{page}}">
+               <div class="input-group">
+                   <input type="number" name="limit" class="form-control" placeholder="每页条数" value="{{limit}}" min="1">
+                   <button class="btn btn-outline-secondary" type="submit">设置</button>
+               </div>
+           </form>
+       </li>
+   </ul>
+</nav>
<script>
    $(function () {
        $('.sort-text').on('dblclick', function () {
            const userId = $(this).data('id');
            $(this).addClass('d-none');
            $(`.sort-input[data-id="${userId}"]`).removeClass('d-none').focus();
        });

        $('.sort-input').on('blur', function () {
            const userId = $(this).data('id');
            const newSort = $(this).val();
            $(this).addClass('d-none');
            $(`.sort-text[data-id="${userId}"]`).removeClass('d-none').text(newSort);
            $.ajax({
                url: `/admin/users/${userId}`,
                type: 'PUT',
                contentType: 'application/json',
                headers: {
                    'accept': 'application/json'
                },
                data: JSON.stringify({ sort: newSort }),
                success: function (response) {
                    if (response.success) {
                        $(`.sort-text[data-id="${userId}"]`).text(newSort);
                    }
                }
            });
        });

        $('.sort-input').on('keypress', function (e) {
            if (e.which == 13) {
                $(this).blur();
            }
        });
        $('.status-toggle').on('click', function () {
            const $this = $(this);
            const userId = $this.data('id');
            const currentStatus = $this.data('status');
            const newStatus = currentStatus === 1 ? 0 : 1;
            $.ajax({
                url: `/admin/users/${userId}`,
                type: 'PUT',
                contentType: 'application/json',
                headers: {
                    'accept': 'application/json'
                },
                data: JSON.stringify({ status: newStatus }),
                success: function (response) {
                    if (response.success) {
                        $this.data('status', newStatus);
                        $this.html(`<i class="bi ${newStatus ? "bi-check-circle-fill" : "bi-x-circle-fill"} ${newStatus ? "text-success" : "text-danger"}"></i>`);
                    }
                },
                error: function (error) {
                    const { responseJSON } = error;
                    alert(responseJSON.message);
                }
            });
        });
    });
    function deleteUser(id) {
        if (confirm('确定删除吗？')) {
            $.ajax({
                url: `/admin/users/${id}`,
                type: 'DELETE',
                success: function (data) {
                    if (data.success) {
                        location.reload();
                    }
                }
            });
        }
    }
</script>
18.重构代码
18.1. dto.decorator.ts
src/shared/decorators/dto.decorator.ts

import { applyDecorators } from "@nestjs/common"
import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsOptional, IsNumber } from "class-validator"

export function IdValidators() {
    return applyDecorators(ApiProperty({ description: 'ID', example: 1 }), IsOptional(), IsNumber())
}
export function StatusValidators() {
    return applyDecorators(IsNumber(), IsOptional(), Type(() => Number))
}
export function SortValidators() {
    return applyDecorators(IsNumber(), IsOptional(), Type(() => Number))
}
18.2. user.entity.ts
src/shared/entities/user.entity.ts

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
+import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    @ApiProperty({ description: '用户ID', example: 1 })
    id: number

    @Column({ length: 50, unique: true })
    @ApiProperty({ description: '用户名', example: 'nick' })
    username: string

    @Column()
    @Exclude()
    @ApiHideProperty()
    password: string

    @Column({ length: 15, nullable: true })
    @Transform(({ value }) => {
        return value ? value.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3') : value;
    })
    @ApiProperty({ description: '手机号', example: '15788888888' })
    mobile: string

    @Expose()
    @ApiProperty({ description: '联系方式', example: '邮箱:nick@qq.com' })
    get contact(): string {
        return `邮件:${this.email}`
    }
    @Column({ length: 100, nullable: true })
    @ApiProperty({ description: '邮件', example: 'nick@qq.com' })
    email: string

    @Column({ default: 1 })
    @ApiProperty({ description: '生效状态', example: 1 })
    status: number

    @Column({ default: false })
    @ApiProperty({ description: '是否超级管理员', example: true })
    is_super: boolean

    @Column({ default: 100 })
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number

+   @CreateDateColumn()
    @ApiProperty({ description: '创建时间', example: '2024年8月11日16:49:22' })
    createdAt: Date

+   @UpdateDateColumn()
    @ApiProperty({ description: '更新时间', example: '2024年8月11日16:49:22' })
    updatedAt: Date
}
18.3. user.dto.ts
src/shared/dto/user.dto.ts

import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, MinLength, MaxLength, Validate, IsNotEmpty, } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUsernameUniqueConstraint, StartsWithConstraint } from 'src/shared/validators/user-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types'
+import { IdValidators, SortValidators, StatusValidators } from '../decorators/dto.decorator';
export class CreateUserDto {
    @Validate(StartsWithConstraint, ['user_'])
    @Validate(IsUsernameUniqueConstraint)
    @ApiProperty({ description: '用户名', example: 'nick' })
    username: string;

    @PasswordValidators()
    @ApiProperty({ description: '密码', example: '666666' })
    password: string;
    @MobileValidators()
    @ApiProperty({ description: '手机号', example: '15788888888' })
    @ApiPropertyOptional()
    mobile: string;
    @EmailValidators()
    @ApiProperty({ description: '邮件', example: 'nick@qq.com' })
    email: string;
    @StatusValidators()
    @ApiProperty({ description: '状态', example: 1 })
    status: number;
    @IsSuperValidators()
    @ApiProperty({ description: '是否超级管理员', example: true })
    is_super: boolean;
    @SortValidators()
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;
}
export class UpdateUserDto extends OmitType(PartialType(CreateUserDto), ['username', 'password']) {
+   @IdValidators()
    id: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: '用户名', example: 'nick' })
    username: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: '密码', example: '666666' })
    password: string;

}
function PasswordValidators() {
    return applyDecorators(
        IsString(),
        IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty', { field: 'password' }) }),
        MinLength(6, { message: i18nValidationMessage('validation.minLength', { field: 'password', length: 6 }) }),
        MaxLength(8, { message: i18nValidationMessage('validation.maxLength', { field: 'password', length: 8 }) }),)
}
function EmailValidators() {
    return applyDecorators(IsEmail(), IsOptional())
}
function MobileValidators() {
    return applyDecorators(IsString(), IsOptional())
}
function IsSuperValidators() {
    return applyDecorators(IsBoolean(), IsOptional(), Type(() => Boolean))
}
19.角色管理
nest g cms-gen role 角色 --collection=D:/aprepare/nest/cms-gen
19.1. admin.module.ts
src/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { UserController } from './controllers/user.controller';
import { RoleController } from "./controllers/role.controller";
@Module({
+   controllers: [DashboardController, UserController, RoleController]
+})
+export class AdminModule {
+}
+
19.2. role-detail.hbs
views/role/role-detail.hbs

<h1>
    角色详情
</h1>
<div class="mb-3">
    <label class="form-label">名称:</label>
    <p class="form-control-plaintext">{{role.name}}</p>
</div>
<div class="mb-3">
    <label class="form-label">状态:</label>
    <p class="form-control-plaintext">{{#if role.status}}激活{{else}}未激活{{/if}}</p>
</div>
<a href="/admin/roles/{{role.id}}/edit" class="btn btn-warning btn-sm">修改</a>
<a href="/admin/roles" class="btn btn-secondary btn-sm">返回列表</a>
19.3. main.hbs
views/layouts/main.hbs

<!doctype html>
<html lang="en">
+
+<head>
+ <meta charset="utf-8">
+ <meta name="viewport" content="width=device-width, initial-scale=1">
+ <title>CMS</title>
+ <link href="/style/bootstrap.min.css" rel="stylesheet">
+ <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
+ <script src="/js/jquery.min.js"></script>
+ <script src="/js/bootstrap.bundle.min.js"></script>
+</head>
+
+<body>
+ {{> header }}
+ <div class="container-fluid">
+   <div class="row">
+     {{> sidebar}}
+     <div class="col-md-9 col-lg-10">
+       <div class="container mt-4">
+         {{{body}}}
        </div>
+     </div>
    </div>
+ </div>
+
+</body>
+
</html>
19.4. role-form.hbs
views/role/role-form.hbs

<h1>{{#if role.id}}编辑角色{{else}}添加角色{{/if}}</h1>
<form action="/admin/roles{{#if role.id}}/{{role.id}}{{/if}}" method="POST">
    {{#if role.id}}<input type="hidden" name="_method" value="PUT">{{/if}}
    <div class="mb-3">
        <label for="name" class="form-label">名称</label>
        <input type="text" class="form-control" id="name" name="name" value="{{role.name}}">
    </div>
    <div class="mb-3">
        <label for="status" class="form-label">状态</label>
        <select class="form-control" id="status" name="status">
            <option value="1" {{#if role.status}}selected{{/if}}>激活</option>
            <option value="0" {{#unless role.status}}selected{{/unless}}>未激活</option>
        </select>
    </div>
    <button type="submit" class="btn btn-primary">保存</button>
</form>
19.5. role.entity.ts
src/shared/entities/role.entity.ts

import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Role {
    @PrimaryGeneratedColumn()
    @ApiProperty({ description: 'ID', example: 1 })
    id: number;

    @Column({ length: 50, unique: true })
    @ApiProperty({ description: '名称', example: 'name' })
    name: string;

    @Column({ default: 1 })
    @ApiProperty({ description: '生效状态', example: 1 })
    status: number;

    @Column({ default: 100 })
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;

    @CreateDateColumn()
    @ApiProperty({ description: '创建时间', example: '2024年8月11日16:49:22' })
    createdAt: Date;

    @UpdateDateColumn()
    @ApiProperty({ description: '更新时间', example: '2024年8月11日16:49:22' })
    updatedAt: Date;
}

19.6. role.service.ts
src/shared/services/role.service.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Role } from "../entities/role.entity";
import { Repository, Like } from 'typeorm';
import { MySQLBaseService } from "./mysql-base.service";

@Injectable()
export class RoleService extends MySQLBaseService<Role> {
  constructor(
    @InjectRepository(Role) protected repository: Repository<Role>
  ) {
    super(repository);
  }

  async findAll(keyword?: string) {
    const where = keyword ? [
      { name: Like(`%${keyword}%`) }
    ] : {};
    return this.repository.find({ where });
  }

  async findAllWithPagination(page: number, limit: number, keyword?: string) {
    const where = keyword ? [
      { name: Like(`%${keyword}%`) }
    ] : {};
    const [roles, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit
    });
    return { roles, total };
  }
}

19.7. role.dto.ts
src/shared/dto/role.dto.ts

import { ApiProperty, PartialType as PartialTypeFromSwagger } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { IdValidators, StatusValidators, SortValidators } from '../decorators/dto.decorator';

export class CreateRoleDto {
    @IsString()
    @ApiProperty({ description: '名称', example: 'name' })
    name: string;

    @StatusValidators()
    @ApiProperty({ description: '状态', example: 1 })
    status: number;

    @SortValidators()
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;
}

export class UpdateRoleDto extends PartialTypeFromSwagger(PartialType(CreateRoleDto)) {
    @IdValidators()
    id: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: '用户名', example: 'nick' })
    username: string;

    @ApiProperty({ description: '密码', example: '666666' })
    @IsOptional()
    password: string;
}

19.8. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
+import { Role } from "./entities/role.entity";
+import { RoleService } from "./services/role.service";
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
+       TypeOrmModule.forFeature([User, Role, Role])
    ],
})
export class SharedModule {
}

19.9. role.controller.ts
src/admin/controllers/role.controller.ts

import { Controller, Get, Render, Post, Redirect, Body, UseFilters, HttpException, Param, ParseIntPipe, Put, Delete, Headers, Res, Query } from '@nestjs/common';
import { CreateRoleDto, UpdateRoleDto } from 'src/shared/dto/role.dto';
import { RoleService } from 'src/shared/services/role.service';
import { AdminExceptionFilter } from '../filters/admin-exception-filter';
import { UtilityService } from 'src/shared/services/utility.service';
import { Response } from 'express';
import { ParseOptionalIntPipe } from 'src/shared/pipes/parse-optional-int.pipe';

@UseFilters(AdminExceptionFilter)
@Controller('admin/roles')
export class RoleController {
    constructor(
        private readonly roleService: RoleService,
        private readonly utilityService: UtilityService
    ) { }

    @Get()
    @Render('role/role-list')
    async findAll(@Query('keyword') keyword: string = '',
        @Query('page', new ParseOptionalIntPipe(1)) page: number,
        @Query('limit', new ParseOptionalIntPipe(10)) limit: number) {
        const { roles, total } = await this.roleService.findAllWithPagination(page, limit, keyword);
        const pageCount = Math.ceil(total / limit);
        return { roles, keyword, page, limit, pageCount };
    }

    @Get('create')
    @Render('role/role-form')
    createForm() {
        return { role: {} }
    }

    @Post()
    @Redirect('/admin/roles')
    async create(@Body() createRoleDto: CreateRoleDto) {
        await this.roleService.create(createRoleDto);
        return { success: true }
    }

    @Get(':id/edit')
    @Render('role/role-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
        const role = await this.roleService.findOne({ where: { id } });
        if (!role) throw new HttpException('Role not Found', 404);
        return { role };
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto, @Res({ passthrough: true }) res: Response, @Headers('accept') accept: string) {
        if (updateRoleDto.password) {
            updateRoleDto.password = await this.utilityService.hashPassword(updateRoleDto.password);
        } else {
            delete updateRoleDto.password;
        }
        await this.roleService.update(id, updateRoleDto);
        if (accept === 'application/json') {
            return { success: true };
        } else {
            return res.redirect(`/admin/roles`);
        }
    }

    @Delete(":id")
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.roleService.delete(id);
        return { success: true }
    }

    @Get(':id')
    @Render('role/role-detail')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const role = await this.roleService.findOne({ where: { id } });
        if (!role) throw new HttpException('Role not Found', 404);
        return { role };
    }
}

19.10. role-list.hbs
views/role/role-list.hbs

<h1>
  角色列表
</h1>
<a href="/admin/roles/create" class="btn btn-success mb-3">添加角色</a>
<form method="GET" action="/admin/roles" class="mb-3">
  <div class="input-group">
    <input type="text" name="keyword" class="form-control" placeholder="请输入搜索关键字" value="{{keyword}}">
    <button class="btn btn-outline-secondary">搜索</button>
  </div>
</form>
<table class="table">
  <thead>
    <tr>
      <td>名称</td>
      <td>状态</td>
      <td>排序</td>
      <td>操作</td>
    </tr>
  </thead>
  <tbody>
    {{#each roles}}
    <tr>
      <td>{{this.name}}</td>
      <td>
        <span class="status-toggle" data-id="{{this.id}}" data-status="{{this.status}}">
          {{#if this.status}}
          <i class="bi bi-check-circle-fill text-success"></i>
          {{else}}
          <i class="bi bi-x-circle-fill text-danger"></i>
          {{/if}}
        </span>
      </td>
      <td>
        <span class="sort-text" data-id="{{this.id}}">{{this.sort}}</span>
        <input type="number" class="form-control sort-input d-none" style="width:50%" data-id="{{this.id}}"
          value="{{this.sort}}">
      </td>
      <td>
        <a href="/admin/roles/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
        <a href="/admin/roles/{{this.id}}/edit" class="btn btn-warning btn-sm">修改</a>
        <a class="btn btn-danger btn-sm" onclick="deleteRole({{this.id}})">删除</a>
      </td>
    </tr>
    {{/each}}
  </tbody>
</table>
<nav>
  <ul class="pagination">
    <li class="page-item {{#if (eq page 1)}}disabled{{/if}}">
      <a class="page-link" href="?page={{dec page}}&keyword={{keyword}}&limit={{limit}}">上一页</a>
    </li>
    {{#each (range 1 pageCount)}}
    <li class="page-item {{#if (eq this ../page)}}active{{/if}}">
      <a class="page-link" href="?page={{this}}&keyword={{../keyword}}&limit={{../limit}}">{{this}}</a>
    </li>
    {{/each}}

    <li class="page-item {{#if (eq page pageCount)}}disabled{{/if}}">
      <a class="page-link" href="?page={{inc page}}&keyword={{keyword}}&limit={{limit}}">下一页</a>
    </li>
    <li class="page-item">
      <form method="GET" action="/admin/roles" class="d-inline-block ms-3">
        <input type="hidden" name="keyword" value="{{keyword}}">
        <input type="hidden" name="page" value="{{page}}">
        <div class="input-group">
          <input type="number" name="limit" class="form-control" placeholder="每页条数" value="{{limit}}" min="1">
          <button class="btn btn-outline-secondary" type="submit">设置每页的条数</button>
        </div>
      </form>
    </li>
  </ul>
</nav>
<script>
  function deleteRole(id) {
    if (confirm('确定要删除吗?')) {
      $.ajax({
        url: `/admin/roles/${id}`,
        type: 'DELETE',
        success: function (data) {
          if (data.success) {
            const params = new URLSearchParams(window.location.search);
            params.delete('page');
            params.append('page', 1)
            const query = params.toString();
            window.location = window.location.pathname + '?' + query;
          }
        }
      })
    }
  }
  $(function () {
    $('.sort-text').on('dblclick', function () {
      const $this = $(this);
      const id = $this.data('id');
      $this.addClass('d-none');
      $(`.sort-input[data-id="${id}"]`).removeClass('d-none').focus();
    });
    $('.sort-input').on('blur', function () {
      const $this = $(this);
      const id = $this.data('id');
      const newSort = $this.val();
      $this.addClass('d-none');
      $.ajax({
        url: `/admin/roles/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ sort: newSort }),
        success: function (data) {
          if (data.success) {
            $(`.sort-text[data-id="${id}"]`).removeClass('d-none').text(newSort);
          }
        }
      })
    });
    $('.status-toggle').on('click', function () {
      const $this = $(this);
      const id = $this.data('id');
      const currentStatus = $this.data('status');
      const newStatus = currentStatus == 1 ? 0 : 1;
      $.ajax({
        url: `/admin/roles/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ status: newStatus }),
        success: function (data) {
          if (data.success) {
            $this.data('status', newStatus);
            $this.html(` <i class="bi ${newStatus ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} ${newStatus ? 'text-success' : 'text-danger'}"></i>`);
          }
        }
      })
    });
  });
</script>
20.资源管理
nest g cms-gen access 资源 --collection=D:/aprepare/nest/cms-gen
20.1. admin.module.ts
src/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { UserController } from './controllers/user.controller';
import { RoleController } from "./controllers/role.controller";
+import { AccessController } from "./controllers/access.controller";
@Module({
+   controllers: [DashboardController, UserController, RoleController, AccessController]
})
export class AdminModule {
}

20.2. access-detail.hbs
views/access/access-detail.hbs

<h1>
    资源详情
</h1>
<div class="mb-3">
    <label class="form-label">名称:</label>
    <p class="form-control-plaintext">{{access.name}}</p>
</div>
<div class="mb-3">
    <label class="form-label">状态:</label>
    <p class="form-control-plaintext">{{#if access.status}}激活{{else}}未激活{{/if}}</p>
</div>
<a href="/admin/accesses/{{access.id}}/edit"
    class="btn btn-warning btn-sm">修改</a>
<a href="/admin/accesses" class="btn btn-secondary btn-sm">返回列表</a>
20.3. access.entity.ts
src/shared/entities/access.entity.ts

import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Access {
    @PrimaryGeneratedColumn()
    @ApiProperty({ description: 'ID', example: 1 })
    id: number;

    @Column({ length: 50, unique: true })
    @ApiProperty({ description: '名称', example: 'name' })
    name: string;

    @Column({ default: 1 })
    @ApiProperty({ description: '生效状态', example: 1 })
    status: number;

    @Column({ default: 100 })
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;

    @CreateDateColumn()
    @ApiProperty({ description: '创建时间', example: '2024年8月11日16:49:22' })
    createdAt: Date;

    @UpdateDateColumn()
    @ApiProperty({ description: '更新时间', example: '2024年8月11日16:49:22' })
    updatedAt: Date;
}

20.4. access-form.hbs
views/access/access-form.hbs

<h1>{{#if access.id}}编辑资源{{else}}添加资源{{/if}}</h1>
<form
    action="/admin/accesses{{#if access.id}}/{{access.id}}{{/if}}"
    method="POST">
    {{#if access.id}}<input type="hidden" name="_method" value="PUT">{{/if}}
        <div class="mb-3">
            <label for="name" class="form-label">名称</label>
            <input type="text" class="form-control" id="name" name="name" value="{{access.name}}">
        </div>
        <div class="mb-3">
            <label for="status" class="form-label">状态</label>
            <select class="form-control" id="status" name="status">
                <option value="1" {{#if access.status}}selected{{/if}}>激活</option>
                <option value="0" {{#unless access.status}}selected{{/unless}}>未激活</option>
            </select>
        </div>
        <button type="submit" class="btn btn-primary">保存</button>
</form>
20.5. access.service.ts
src/shared/services/access.service.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Access } from "../entities/access.entity";
import { Repository, Like } from 'typeorm';
import { MySQLBaseService } from "./mysql-base.service";

@Injectable()
export class AccessService extends MySQLBaseService<Access> {
  constructor(
    @InjectRepository(Access) protected repository: Repository<Access>
  ) {
    super(repository);
  }

  async findAll(keyword?: string) {
    const where = keyword ? [
      { name: Like(`%${keyword}%`) }
    ] : {};
    return this.repository.find({ where });
  }

  async findAllWithPagination(page: number, limit: number, keyword?: string) {
    const where = keyword ? [
      { name: Like(`%${keyword}%`) }
    ] : {};
    const [accesses, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit
    });
    return { accesses, total };
  }
}

20.6. access.dto.ts
src/shared/dto/access.dto.ts

import { ApiProperty, PartialType as PartialTypeFromSwagger } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { IdValidators, StatusValidators, SortValidators } from '../decorators/dto.decorator';

export class CreateAccessDto {
    @IsString()
    @ApiProperty({ description: '名称', example: 'name' })
    name: string;

    @StatusValidators()
    @ApiProperty({ description: '状态', example: 1 })
    status: number;

    @SortValidators()
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;
}

export class UpdateAccessDto extends PartialTypeFromSwagger(PartialType(CreateAccessDto)) {
    @IdValidators()
    id: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: '用户名', example: 'nick' })
    username: string;

    @ApiProperty({ description: '密码', example: '666666' })
    @IsOptional()
    password: string;
}

20.7. sidebar.hbs
views/partials/sidebar.hbs

<div class="col-md-3 col-lg-2 p-0">
+   <div class="accordion" id="sidebarMenu">
        <div class="accordion-item">
            <h2 class="accordion-header" id="heading">
+               <button class="accordion-button" type="button" data-bs-toggle="collapse"
+                   data-bs-target="#collapse1">权限管理</button>
            </h2>
            <div class="accordion-collapse collapse" id="collapse1">
                <div class="accordion-body">
                    <ul class="list-group">
                        <li class="list-group-item">
                            <a href="/admin/users">用户管理</a>
                        </li>
                        <li class="list-group-item">
                            <a href="/admin/roles">角色管理</a>
                        </li>
+                       <li class="list-group-item">
+                           <a href="/admin/accesses">资源管理</a>
+                       </li>
                    </ul>
                </div>
            </div>
        </div>
+   </div>
</div>
20.8. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
import { Role } from "./entities/role.entity";
import { RoleService } from "./services/role.service";
+import { Access } from "./entities/access.entity";
+import { AccessService } from "./services/access.service";
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
+       TypeOrmModule.forFeature([User, Role, Role, Access])
    ],
})
export class SharedModule {
}

20.9. access.controller.ts
src/admin/controllers/access.controller.ts

import { Controller, Get, Render, Post, Redirect, Body, UseFilters, HttpException, Param, ParseIntPipe, Put, Delete, Headers, Res, Query } from '@nestjs/common';
import { CreateAccessDto, UpdateAccessDto } from 'src/shared/dto/access.dto';
import { AccessService } from 'src/shared/services/access.service';
import { AdminExceptionFilter } from '../filters/admin-exception-filter';
import { UtilityService } from 'src/shared/services/utility.service';
import { Response } from 'express';
import { ParseOptionalIntPipe } from 'src/shared/pipes/parse-optional-int.pipe';

@UseFilters(AdminExceptionFilter)
@Controller('admin/accesses')
export class AccessController {
    constructor(
        private readonly accessService: AccessService,
        private readonly utilityService: UtilityService
    ) { }

    @Get()
    @Render('access/access-list')
    async findAll(@Query('keyword') keyword: string = '',
        @Query('page', new ParseOptionalIntPipe(1)) page: number,
        @Query('limit', new ParseOptionalIntPipe(10)) limit: number) {
        const { accesses, total } = await this.accessService.findAllWithPagination(page, limit, keyword);
        const pageCount = Math.ceil(total / limit);
        return { accesses, keyword, page, limit, pageCount };
    }

    @Get('create')
    @Render('access/access-form')
    createForm() {
        return { access: {} }
    }

    @Post()
    @Redirect('/admin/accesses')
    async create(@Body() createAccessDto: CreateAccessDto) {
        await this.accessService.create(createAccessDto);
        return { success: true }
    }

    @Get(':id/edit')
    @Render('access/access-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
        const access = await this.accessService.findOne({ where: { id } });
        if (!access) throw new HttpException('Access not Found', 404);
        return { access };
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateAccessDto: UpdateAccessDto, @Res({ passthrough: true }) res: Response, @Headers('accept') accept: string) {
        if (updateAccessDto.password) {
            updateAccessDto.password = await this.utilityService.hashPassword(updateAccessDto.password);
        } else {
            delete updateAccessDto.password;
        }
        await this.accessService.update(id, updateAccessDto);
        if (accept === 'application/json') {
            return { success: true };
        } else {
            return res.redirect(`/admin/accesses`);
        }
    }

    @Delete(":id")
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.accessService.delete(id);
        return { success: true }
    }

    @Get(':id')
    @Render('access/access-detail')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const access = await this.accessService.findOne({ where: { id } });
        if (!access) throw new HttpException('Access not Found', 404);
        return { access };
    }
}

20.10. access-list.hbs
views/access/access-list.hbs

<h1>
  资源列表
</h1>
<a href="/admin/accesses/create" class="btn btn-success mb-3">添加资源</a>
<form method="GET" action="/admin/accesses" class="mb-3">
  <div class="input-group">
    <input type="text" name="keyword" class="form-control" placeholder="请输入搜索关键字" value="{{keyword}}">
    <button class="btn btn-outline-secondary">搜索</button>
  </div>
</form>
<table class="table">
  <thead>
    <tr>
      <td>名称</td>
      <td>状态</td>
      <td>排序</td>
      <td>操作</td>
    </tr>
  </thead>
  <tbody>
    {{#each accesses}}
      <tr>
        <td>{{this.name}}</td>
        <td>
          <span class="status-toggle" data-id="{{this.id}}" data-status="{{this.status}}">
            {{#if this.status}}
            <i class="bi bi-check-circle-fill text-success"></i>
            {{else}}
            <i class="bi bi-x-circle-fill text-danger"></i>
            {{/if}}
          </span>
        </td>
        <td>
          <span class="sort-text" data-id="{{this.id}}">{{this.sort}}</span>
          <input type="number" class="form-control sort-input d-none" style="width:50%" data-id="{{this.id}}"
            value="{{this.sort}}">
        </td>
        <td>
          <a href="/admin/accesses/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
          <a href="/admin/accesses/{{this.id}}/edit" class="btn btn-warning btn-sm">修改</a>
          <a class="btn btn-danger btn-sm" onclick="deleteAccess({{this.id}})">删除</a>
        </td>
      </tr>
      {{/each}}
  </tbody>
</table>
<nav>
  <ul class="pagination">
    <li class="page-item {{#if (eq page 1)}}disabled{{/if}}">
      <a class="page-link" href="?page={{dec page}}&keyword={{keyword}}&limit={{limit}}">上一页</a>
    </li>
    {{#each (range 1 pageCount)}}
    <li class="page-item {{#if (eq this ../page)}}active{{/if}}">
      <a class="page-link" href="?page={{this}}&keyword={{../keyword}}&limit={{../limit}}">{{this}}</a>
    </li>
    {{/each}}

    <li class="page-item {{#if (eq page pageCount)}}disabled{{/if}}">
      <a class="page-link" href="?page={{inc page}}&keyword={{keyword}}&limit={{limit}}">下一页</a>
    </li>
    <li class="page-item">
      <form method="GET" action="/admin/accesses" class="d-inline-block ms-3">
        <input type="hidden" name="keyword" value="{{keyword}}">
        <input type="hidden" name="page" value="{{page}}">
        <div class="input-group">
          <input type="number" name="limit" class="form-control" placeholder="每页条数" value="{{limit}}" min="1">
          <button class="btn btn-outline-secondary" type="submit">设置每页的条数</button>
        </div>
      </form>
    </li>
  </ul>
</nav>
<script>
  function deleteAccess (id) {
    if (confirm('确定要删除吗?')) {
      $.ajax({
        url: `/admin/accesses/${id}`,
        type: 'DELETE',
        success: function (data) {
          if (data.success) {
            const params = new URLSearchParams(window.location.search);
            params.delete('page');
            params.append('page', 1)
            const query = params.toString();
            window.location = window.location.pathname + '?' + query;
          }
        }
      })
    }
  }
  $(function () {
    $('.sort-text').on('dblclick', function () {
      const $this = $(this);
      const id = $this.data('id');
      $this.addClass('d-none');
      $(`.sort-input[data-id="${id}"]`).removeClass('d-none').focus();
    });
    $('.sort-input').on('blur', function () {
      const $this = $(this);
      const id = $this.data('id');
      const newSort = $this.val();
      $this.addClass('d-none');
      $.ajax({
        url: `/admin/accesses/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ sort: newSort }),
        success: function (data) {
          if (data.success) {
            $(`.sort-text[data-id="${id}"]`).removeClass('d-none').text(newSort);
          }
        }
      })
    });
    $('.status-toggle').on('click', function () {
      const $this = $(this);
      const id = $this.data('id');
      const currentStatus = $this.data('status');
      const newStatus = currentStatus == 1 ? 0 : 1;
      $.ajax({
        url: `/admin/accesses/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ status: newStatus }),
        success: function (data) {
          if (data.success) {
            $this.data('status', newStatus);
            $this.html(` <i class="bi ${newStatus ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} ${newStatus ? 'text-success' : 'text-danger'}"></i>`);
          }
        }
      })
    });
  });
</script>
21.资源树
21.1. json.ts
src/shared/helpers/json.ts

export function json(value) {
    return JSON.stringify(value);
};
21.2. def.ts
src/shared/helpers/def.ts

export function def(value) {
    return value ? '"' + value + '"' : '""';
};
21.3. index.ts
src/shared/helpers/index.ts

export * from './eq';
export * from './range';
export * from './inc';
export * from './dec';
export * from './json';
+export * from './def';
+export * from './multiply';
21.4. multiply.ts
src/shared/helpers/multiply.ts

export function multiply(a, b) {
    const numA = Number(a);
    const numB = Number(b);
    if (isNaN(numA) || isNaN(numB)) {
        return 0;
    }
    return numA * numB;
}
21.5. access-detail.hbs
views/access/access-detail.hbs

<h1>
    资源详情
</h1>
<div class="mb-3">
    <label class="form-label">名称:</label>
    <p class="form-control-plaintext">{{access.name}}</p>
</div>
+<div class="mb-3">
+   <label class="form-label">url:</label>
+   <p class="form-control-plaintext">{{access.url}}</p>
+</div>
+<div class="mb-3">
+   <label class="form-label">描述:</label>
+   <p class="form-control-plaintext">{{access.description}}</p>
+</div>
+<div class="mb-3">
+   <label class="form-label">类型:</label>
+   <p class="form-control-plaintext">{{access.type}}</p>
+</div>
<div class="mb-3">
    <label class="form-label">状态:</label>
    <p class="form-control-plaintext">{{#if access.status}}激活{{else}}未激活{{/if}}</p>
</div>
+<a href="/admin/accesses/{{access.id}}/edit" class="btn btn-warning btn-sm">修改</a>
<a href="/admin/accesses" class="btn btn-secondary btn-sm">返回列表</a>
21.6. mysql-base.service.ts
src/shared/services/mysql-base.service.ts

import { Injectable } from "@nestjs/common";;
import { Repository, FindOneOptions } from 'typeorm';
import { DeepPartial } from 'typeorm/common/DeepPartial'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
@Injectable()
+export abstract class MySQLBaseService<T> {
+ constructor(protected repository: Repository<T>) { }
+ async findAll() {
+   return this.repository.find();
+ }
+ async findOne(options: FindOneOptions<T>) {
+   return this.repository.findOne(options);
+ }
+ async create(createDto: DeepPartial<T>) {
+   const entity = this.repository.create(createDto);
+   return await this.repository.save(entity);
+ }
+ async update(id: number, updateDto: QueryDeepPartialEntity<T>) {
+   return this.repository.update(id, updateDto);
+ }
+ async delete(id: number) {
+   return this.repository.delete(id);
+ }
+}
+
21.7. access.entity.ts
src/shared/entities/access.entity.ts

import { ApiProperty } from '@nestjs/swagger';
+import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Tree, TreeChildren, TreeParent } from 'typeorm';
+import { AccessType } from '../dto/access.dto';

@Entity()
+@Tree("materialized-path")
export class Access {
    @PrimaryGeneratedColumn()
    @ApiProperty({ description: 'ID', example: 1 })
    id: number;

    @Column({ length: 50, unique: true })
    @ApiProperty({ description: '名称', example: 'name' })
    name: string;

+   @Column({ type: 'enum', enum: AccessType })
+   type: AccessType;
+
+   @Column({ length: 200, nullable: true })
+   url: string;
+
+   @Column({ length: 200, nullable: true })
+   description: string;
+
+   @TreeChildren()
+   children: Access[];
+
+   @TreeParent()
+   parent: Access;
+
    @Column({ default: 1 })
    @ApiProperty({ description: '生效状态', example: 1 })
    status: number;

    @Column({ default: 100 })
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;

    @CreateDateColumn()
    @ApiProperty({ description: '创建时间', example: '2024年8月11日16:49:22' })
    createdAt: Date;

    @UpdateDateColumn()
    @ApiProperty({ description: '更新时间', example: '2024年8月11日16:49:22' })
    updatedAt: Date;
}

21.8. access.dto.ts
src/shared/dto/access.dto.ts

import { ApiProperty, PartialType as PartialTypeFromSwagger } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { IdValidators, StatusValidators, SortValidators } from '../decorators/dto.decorator';
+export enum AccessType {
+   MODULE = 'module',
+   MENU = 'menu',
+   FEATURE = 'feature',
+}
export class CreateAccessDto {
    @IsString()
    @ApiProperty({ description: '名称', example: 'name' })
    name: string;

+   @ApiProperty({ description: '类型', example: 'module' })
+   type?: AccessType;
+
+   @ApiProperty({ description: 'url地址', example: '/admin/users' })
+   url?: string;
+
+   @ApiProperty({ description: '父权限ID', example: '1' })
+   parentId?: number;
+
+   @ApiProperty({ description: '描述', example: '用户管理' })
+   description?: string;
+
    @StatusValidators()
    @ApiProperty({ description: '状态', example: 1 })
    status: number;

    @SortValidators()
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;
}

export class UpdateAccessDto extends PartialTypeFromSwagger(PartialType(CreateAccessDto)) {
    @IdValidators()
    id: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: '用户名', example: 'nick' })
    username: string;

    @ApiProperty({ description: '密码', example: '666666' })
    @IsOptional()
    password: string;
}

21.9. access-node.hbs
views/partials/access-node.hbs

<tr data-id="{{id}}" data-parent="{{parent.id}}">
    <td style="padding-left: {{multiply depth 20}}px;">
        <span class="toggle cursor-pointer" data-id="{{id}}">
            {{#if children.length}}
            <i class="bi bi-folder-minus"></i>
            {{/if}}
        </span>
        {{name}}
    </td>
    <td>{{url}}</td>
    <td>
        {{#if (eq type 'module')}}
        <span class="badge bg-primary">模块</span>
        {{else if (eq type 'menu')}}
        <span class="badge bg-success">菜单</span>
        {{else if (eq type 'feature')}}
        <span class="badge bg-info">功能</span>
        {{/if}}
    </td>
    <td>
        <span class="status-toggle" data-id="{{id}}" data-status="{{status}}">
            {{#if status}}
            <i class="bi bi-check-circle-fill text-success"></i>
            {{else}}
            <i class="bi bi-x-circle-fill text-danger"></i>
            {{/if}}
        </span>
    </td>
    <td>
        <span class="sort-text" data-id="{{id}}">{{sort}}</span>
        <input type="number" class="form-control sort-input d-none" style="width:80px" data-id="{{id}}"
            value="{{sort}}">
    </td>
    <td>
        <a href="/admin/accesses/{{id}}" class="btn btn-primary btn-sm">查看</a>
        <a href="/admin/accesses/{{id}}/edit" class="btn btn-warning btn-sm">编辑</a>
        <button class="btn btn-danger btn-sm" onclick="deleteAccess({{id}})">删除</button>
    </td>
</tr>
{{#each children}}
{{> access-node this depth=(inc ../depth)}}
{{/each}}
21.10. access.service.ts
src/shared/services/access.service.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Access } from "../entities/access.entity";
import { MySQLBaseService } from "./mysql-base.service";
+import { CreateAccessDto, UpdateAccessDto } from '../dto/access.dto';
+import { TreeRepository, UpdateResult } from 'typeorm';
@Injectable()
export class AccessService extends MySQLBaseService<Access> {
  constructor(
+   @InjectRepository(Access) protected repository: TreeRepository<Access>
  ) {
    super(repository);
  }

+ async findAll(): Promise<Access[]> {
+   const accessTree = await this.repository.findTrees({ relations: ['children', 'parent'] });
+   return accessTree.filter(access => !access.parent);
  }
+ async create(createAccessDto: CreateAccessDto): Promise<Access> {
+   const { parentId, ...dto } = createAccessDto;
+   const access = this.repository.create(dto);
+   if (parentId) {
+     access.parent = await this.repository.findOneBy({ id: parentId });
+   }
+   await this.repository.save(access);
+   return this.findOne({ where: { id: access.id } });
+ }
+ async update(id: number, updateAccessDto: UpdateAccessDto) {
+   const { parentId, ...dto } = updateAccessDto;
+   const access = await this.repository.findOneBy({ id });
+   if (!access) throw new Error('Access not found');
+   Object.assign(access, dto);
+   if (parentId) {
+     access.parent = await this.repository.findOneBy({ id: parentId });
+   }
+   await this.repository.save(access);
+   return UpdateResult.from({ raw: [], affected: 1, records: [] });
  }
}

21.11. access.controller.ts
src/admin/controllers/access.controller.ts

+import { Controller, Get, Render, Post, Redirect, Body, UseFilters, HttpException, Param, ParseIntPipe, Put, Delete, Headers, Res, Query, NotFoundException } from '@nestjs/common';
import { CreateAccessDto, UpdateAccessDto } from 'src/shared/dto/access.dto';
import { AccessService } from 'src/shared/services/access.service';
import { AdminExceptionFilter } from '../filters/admin-exception-filter';
import { Response } from 'express';

@UseFilters(AdminExceptionFilter)
@Controller('admin/accesses')
export class AccessController {
+   constructor(private readonly accessService: AccessService) { }

    @Get()
    @Render('access/access-list')
+   async findAll() {
+       const accessTree = await this.accessService.findAll();
+       return { accessTree };
    }

    @Get('create')
    @Render('access/access-form')
+   async createForm() {
+       const accessTree = await this.accessService.findAll();
+       return { access: {}, accessTree };
    }

    @Post()
    @Redirect('/admin/accesses')
    async create(@Body() createAccessDto: CreateAccessDto) {
        await this.accessService.create(createAccessDto);
        return { success: true }
    }

    @Get(':id/edit')
    @Render('access/access-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
+       const access = await this.accessService.findOne({ where: { id }, relations: ['children', 'parent'] });;
+       if (!access) throw new NotFoundException('Access not found');
+       const accessTree = await this.accessService.findAll();
+       return { access, accessTree };
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateAccessDto: UpdateAccessDto, @Res({ passthrough: true }) res: Response, @Headers('accept') accept: string) {
        await this.accessService.update(id, updateAccessDto);
        if (accept === 'application/json') {
            return { success: true };
        } else {
            return res.redirect(`/admin/accesses`);
        }
    }

    @Delete(":id")
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.accessService.delete(id);
        return { success: true }
    }

    @Get(':id')
    @Render('access/access-detail')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const access = await this.accessService.findOne({ where: { id } });
        if (!access) throw new HttpException('Access not Found', 404);
        return { access };
    }
}

21.12. access-list.hbs
views/access/access-list.hbs

<h1>
  资源列表
</h1>
<a href="/admin/accesses/create" class="btn btn-success mb-3">添加资源</a>
<form method="GET" action="/admin/accesses" class="mb-3">
  <div class="input-group">
    <input type="text" name="keyword" class="form-control" placeholder="请输入搜索关键字" value="{{keyword}}">
    <button class="btn btn-outline-secondary">搜索</button>
  </div>
</form>
<table class="table">
  <thead>
    <tr>
      <td>名称</td>
      <td>状态</td>
+     <th>url</th>
+     <th>类型</th>
      <td>排序</td>
      <td>操作</td>
    </tr>
  </thead>
+ <tbody id="accessTreeTable">
+   {{#each accessTree}}
+   {{> access-node this depth=0}}
+   {{/each}}
  </tbody>
</table>
<script>
+ function deleteAccess(id) {
    if (confirm('确定要删除吗?')) {
      $.ajax({
        url: `/admin/accesses/${id}`,
        type: 'DELETE',
        success: function (data) {
          if (data.success) {
            const params = new URLSearchParams(window.location.search);
            params.delete('page');
            params.append('page', 1)
            const query = params.toString();
            window.location = window.location.pathname + '?' + query;
          }
        }
      })
    }
  }
  $(function () {
+   $('#accessTreeTable').on('click', '.toggle', function () {
+     const $toggle = $(this);
+     const id = $toggle.data('id');
+     const $tr = $toggle.closest('tr');
+     if ($tr.nextAll('tr[data-parent="' + id + '"]').is(':visible')) {
+       hideChildren($tr, id);
+       $toggle.html('<i class="bi bi-folder-plus"></i>');
+     } else {
+       $tr.nextAll('tr[data-parent="' + id + '"]').show();
+       $toggle.html('<i class="bi bi-folder-minus"></i>');
+     }
+   });
+   function hideChildren($tr, id) {
+     const $children = $tr.nextAll('tr[data-parent="' + id + '"]');
+     $children.each(function () {
+       const childId = $(this).data('id');
+       hideChildren($(this), childId);
+     });
+     $children.hide();
+   }
    $('.sort-text').on('dblclick', function () {
      const $this = $(this);
      const id = $this.data('id');
      $this.addClass('d-none');
      $(`.sort-input[data-id="${id}"]`).removeClass('d-none').focus();
    });
    $('.sort-input').on('blur', function () {
      const $this = $(this);
      const id = $this.data('id');
      const newSort = $this.val();
      $this.addClass('d-none');
      $.ajax({
        url: `/admin/accesses/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ sort: newSort }),
        success: function (data) {
          if (data.success) {
            $(`.sort-text[data-id="${id}"]`).removeClass('d-none').text(newSort);
          }
        }
      })
    });
    $('.status-toggle').on('click', function () {
      const $this = $(this);
      const id = $this.data('id');
      const currentStatus = $this.data('status');
      const newStatus = currentStatus == 1 ? 0 : 1;
      $.ajax({
        url: `/admin/accesses/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ status: newStatus }),
        success: function (data) {
          if (data.success) {
            $this.data('status', newStatus);
            $this.html(` <i class="bi ${newStatus ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} ${newStatus ? 'text-success' : 'text-danger'}"></i>`);
          }
        }
      })
    });
  });
</script>
21.13. access-form.hbs
views/access/access-form.hbs

<h1>{{#if access.id}}编辑资源{{else}}添加资源{{/if}}</h1>
+<form action="/admin/accesses{{#if access.id}}/{{access.id}}{{/if}}" method="POST">
    {{#if access.id}}<input type="hidden" name="_method" value="PUT">{{/if}}
    <div class="mb-3">
+       <label for="name" class="form-label">名称</label>
+       <input type="text" class="form-control" id="name" name="name" value="{{access.name}}">
+   </div>
+   <div class="mb-3">
+       <label for="description" class="form-label">url</label>
+       <input type="text" class="form-control" id="url" name="url" value="{{access.url}}">
+   </div>
+   <div class="mb-3">
+       <label for="description" class="form-label">描述</label>
+       <input type="text" class="form-control" id="description" name="description" value="{{access.description}}">
+   </div>
+   <div class="mb-3">
+       <label for="type" class="form-label">类型</label>
+       <select class="form-control" id="type" name="type">
+           <option value="module" {{#if (eq access.type "module" )}}selected{{/if}}>模块</option>
+           <option value="menu" {{#if (eq access.type "menu" )}}selected{{/if}}>菜单</option>
+           <option value="function" {{#if (eq access.type "function" )}}selected{{/if}}>功能</option>
+       </select>
+   </div>
+   <div class="mb-3">
+       <label for="parentId" class="form-label">父权限</label>
+       <div id="parentTree" class="border rounded p-3"></div>
+   </div>
+   <div class="mb-3">
+       <label for="status" class="form-label">状态</label>
+       <select class="form-control" id="status" name="status">
+           <option value="1" {{#if access.status}}selected{{/if}}>激活</option>
+           <option value="0" {{#unless access.status}}selected{{/unless}}>未激活</option>
+       </select>
+   </div>
+   <button type="submit" class="btn btn-primary">保存</button>
+</form>
+<script>
+   const accessTree = {{{ json accessTree }}};
+   const selectedParentId = {{{ def access.parent.id }}};
+   const accessId = {{{ def access.id }}};
+   function renderTree(accesses) {
+       let html = '<ul class="list-unstyled">';
+       accesses.forEach(function (access) {
+           if (access.id == accessId) {
+               return;
+           }
+           html += `
+           <li class="mb-2">
+               <div class="d-flex align-items-center">
+                   ${access.children?.length > 0 ? '<span class="toggle me-2 cursor-pointer"><i class="bi bi-folder-plus"></i></span>' : '<span class="me-4"></span>'}
+                   <label class="form-check-label">
+                       <input type="radio" class="form-check-input" name="parentId" value="${access.id}" ${access.id == selectedParentId ? 'checked' : ''}>
+                       ${access.name}
+                   </label>
+               </div>
+               ${access.children?.length > 0 ? `<div class="children ms-4" >${renderTree(access.children)}</div>` : ''}
+           </li>`;
+       });
+       html += '</ul>';
+       return html;
+   }
+   $(function () {
+       $('#parentTree').html(renderTree(accessTree));
+       $('body').on('click', '.toggle', function () {
+           const childrenContainer = $(this).parent().siblings('.children');
+           if (childrenContainer.is(':visible')) {
+               childrenContainer.hide();
+               $(this).html('<i class="bi bi-folder-plus"></i>');
+           } else {
+               childrenContainer.show();
+               $(this).html('<i class="bi bi-folder-minus"></i>');
+           }
+       });
+   });
+</script>
22.为用户分配角色
22.1. user.service.ts
src/shared/services/user.service.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
+import { Repository, Like, In } from 'typeorm';
import { MySQLBaseService } from "./mysql-base.service";
+import { UpdateUserRolesDto } from '../dto/user.dto';
+import { Role } from '../entities/role.entity';
@Injectable()
export class UserService extends MySQLBaseService<User> {
  constructor(
+   @InjectRepository(User) protected repository: Repository<User>,
+   @InjectRepository(Role) private readonly roleRepository: Repository<Role>
  ) {
    super(repository);
  }
  async findAll(keyword?: string) {
    const where = keyword ? [
      { username: Like(`%${keyword}%`) },
      { email: Like(`%${keyword}%`) }
    ] : {}
    return this.repository.find({ where });
  }
  async findAllWithPagination(page: number, limit: number, keyword?: string) {
    const where = keyword ? [
      { username: Like(`%${keyword}%`) },
      { email: Like(`%${keyword}%`) }
    ] : {}
    const [users, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit
    });
    return { users, total }
  }
+ async updateRoles(id: number, updateUserRolesDto: UpdateUserRolesDto) {
+   const user = await this.repository.findOneBy({ id });
+   user.roles = await this.roleRepository.findBy({ id: In(updateUserRolesDto.roleIds) });
+   await this.repository.save(user);
+ }
}
22.2. user.entity.ts
src/shared/entities/user.entity.ts

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
+import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
+import { Role } from './role.entity';
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    @ApiProperty({ description: '用户ID', example: 1 })
    id: number
    @Column({ length: 50, unique: true })
    @ApiProperty({ description: '用户名', example: 'nick' })
    username: string
    @Column()
    @Exclude()
    @ApiHideProperty()
    password: string
    @Column({ length: 15, nullable: true })
    @Transform(({ value }) => {
        return value ? value.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3') : value;
    })
    @ApiProperty({ description: '手机号', example: '15788888888' })
    mobile: string
    @Expose()
    @ApiProperty({ description: '联系方式', example: '邮箱:nick@qq.com' })
    get contact(): string {
        return `邮件:${this.email}`
    }
    @Column({ length: 100, nullable: true })
    @ApiProperty({ description: '邮件', example: 'nick@qq.com' })
    email: string
+
+   @ManyToMany(() => Role)
+   @JoinTable()
+   roles: Role[];
+
    @Column({ default: 1 })
    @ApiProperty({ description: '生效状态', example: 1 })
    status: number
    @Column({ default: false })
    @ApiProperty({ description: '是否超级管理员', example: true })
    is_super: boolean
    @Column({ default: 100 })
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number
    @CreateDateColumn()
    @ApiProperty({ description: '创建时间', example: '2024年8月11日16:49:22' })
    createdAt: Date
    @UpdateDateColumn()
    @ApiProperty({ description: '更新时间', example: '2024年8月11日16:49:22' })
    updatedAt: Date
}
22.3. user.dto.ts
src/shared/dto/user.dto.ts

import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, PartialType as PartialTypeFromSwagger } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsEmail, MinLength, MaxLength, Validate, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
+import { IsUsernameUniqueConstraint } from '../validators/user-validator';
+import { PartialType, OmitType } from '@nestjs/mapped-types'
+import { IdValidators, StatusValidators, SortValidators } from '../decorators/dto.decorator';
+export class CreateUserDto {
+   @IsString()
+   @ApiProperty({ description: '用户名', example: 'nick' })
+   @Validate(IsUsernameUniqueConstraint, [], {
+       message: i18nValidationMessage('validation.usernameIsNotUnique')
+   })
+   username: string;
+   @PasswordValidators()
+   @ApiProperty({ description: '密码', example: '666666' })
+   password: string;
+   @MobileValidators()
+   @ApiProperty({ description: '手机号', example: '15788888888' })
+   @ApiPropertyOptional()
+   mobile: string;
+   @EmailValidators()
+   @ApiProperty({ description: '邮件', example: 'nick@qq.com' })
+   email: string;
+   @StatusValidators()
+   @ApiProperty({ description: '状态', example: 1 })
+   status: number;
+   @IsSuperValidators()
+   @ApiProperty({ description: '是否超级管理员', example: true })
+   is_super: boolean;
+   @SortValidators()
+   @ApiProperty({ description: '排序号', example: 100 })
+   sort: number;
+}
+export class UpdateUserDto extends PartialTypeFromSwagger(OmitType(PartialType(CreateUserDto), ['username', 'password'])) {
+   @IdValidators()
+   id: number;
+   @IsString()
+   @IsOptional()
+   @ApiProperty({ description: '用户名', example: 'nick' })
+   username: string;
+   @ApiProperty({ description: '密码', example: '666666' })
+   @IsOptional()
+   password: string;
+}
+function PasswordValidators() {
+   return applyDecorators(
+       IsString(),
+       IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty', { field: 'password' }) }),
+       MinLength(6, { message: i18nValidationMessage('validation.minLength', { field: 'password', length: 6 }) }),
+       MaxLength(8, { message: i18nValidationMessage('validation.maxLength', { field: 'password', length: 8 }) }))
+}
+function EmailValidators() {
+   return applyDecorators(
+       IsEmail(),
+       IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty', { field: 'email' }) })
+   )
+}
+function MobileValidators() {
+   return applyDecorators(IsString(), IsOptional())
+}
+function IsSuperValidators() {
+   return applyDecorators(IsBoolean(), IsOptional(), Type(() => Boolean))
+}
+export class UpdateUserRolesDto {
+   readonly roleIds: number[];
+}
22.4. user.controller.ts
src/admin/controllers/user.controller.ts

import { Controller, Get, Render, Post, Redirect, Body, UseFilters, HttpException, Param, ParseIntPipe, Put, Delete, Headers, Res, Query } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, UpdateUserRolesDto } from 'src/shared/dto/user.dto';
import { UserService } from 'src/shared/services/user.service';
import { AdminExceptionFilter } from '../filters/admin-exception-filter';
import { UtilityService } from 'src/shared/services/utility.service';
+import { Response } from 'express';
+import { ParseOptionalIntPipe } from 'src/shared/pipes/parse-optional-int.pipe'
+import { RoleService } from 'src/shared/services/role.service';
+@UseFilters(AdminExceptionFilter)
+@Controller('admin/users')
+export class UserController {
+   constructor(
+       private readonly userService: UserService,
+       private readonly utilityService: UtilityService,
+       private readonly roleService: RoleService,
+   ) { }
+   @Get()
+   @Render('user/user-list')
+   async findAll(@Query('keyword') keyword: string = '',
+       @Query('page', new ParseOptionalIntPipe(1)) page: number,
+       @Query('limit', new ParseOptionalIntPipe(10)) limit: number) {
+       const { users, total } = await this.userService.findAllWithPagination(page, limit, keyword);
+       const pageCount = Math.ceil(total / limit);
+       const roles = await this.roleService.findAll();
+       return { users, keyword, page, limit, pageCount, roles };
+   }
+   @Get('create')
+   @Render('user/user-form')
+   createForm() {
+       return { user: {} }
+   }
+   @Post()
+   @Redirect('/admin/users')
+   async create(@Body() createUserDto: CreateUserDto) {
+       if (createUserDto.password) {
+           createUserDto.password = await this.utilityService.hashPassword(createUserDto.password);
+       }
+       await this.userService.create(createUserDto);
+       return { success: true }
+   }
+   @Get(':id/edit')
+   @Render('user/user-form')
+   async editForm(@Param('id', ParseIntPipe) id: number) {
+       const user = await this.userService.findOne({ where: { id } });
+       if (!user) throw new HttpException('User not Found', 404)
+       return { user }
+   }
+   @Put(':id')
+   async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @Res({ passthrough: true }) res: Response, @Headers('accept') accept: string) {
+       if (updateUserDto.password) {
+           updateUserDto.password = await this.utilityService.hashPassword(updateUserDto.password);
+       } else {
+           delete updateUserDto.password;
+       }
+       await this.userService.update(id, updateUserDto);
+       if (accept === 'application/json') {
+           return { success: true };
+       } else {
+           return res.redirect('/admin/users');
+       }
+   }
+   @Delete(":id")
+   async delete(@Param('id', ParseIntPipe) id: number) {
+       await this.userService.delete(id);
+       return { success: true }
+   }
+   @Get(':id')
+   @Render('user/user-detail')
+   async findOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response, @Headers('accept') accept: string) {
+       const user = await this.userService.findOne({ where: { id }, relations: ['roles'] });
+       if (!user) throw new HttpException('User not Found', 404)
+       if (accept === 'application/json') {
+           return res.json(user);
+       } else {
+           res.render('user/user-detail', { user });
+       }
+   }
+   @Put(':id/roles')
+   async updateRoles(@Param('id', ParseIntPipe) id: number, @Body() updateUserRolesDto: UpdateUserRolesDto) {
+       await this.userService.updateRoles(id, updateUserRolesDto);
+       return { success: true };
+   }
+}
+
22.5. user-list.hbs
views/user/user-list.hbs

<h1>用户列表</h1>
<a href="/admin/users/create" class="btn btn-success mb-3">添加用户</a>
<form method="GET" action="/admin/users" class="mb-3">
  <div class="input-group">
    <input type="text" name="keyword" class="form-control" placeholder="请输入搜索关键字" value="{{keyword}}">
    <button class="btn btn-outline-secondary">搜索</button>
  </div>
</form>
<table class="table">
  <thead>
    <tr>
      <td>用户名</td>
      <td>邮箱</td>
      <td>状态</td>
      <td>排序</td>
      <td>操作</td>
    </tr>
  </thead>
  <tbody>
    {{#each users}}
    <tr>
      <td>{{this.username}}</td>
      <td>{{this.email}}</td>
      <td>
        <span class="status-toggle" data-id="{{this.id}}" data-status="{{this.status}}">
          {{#if this.status}}
          <i class="bi bi-check-circle-fill text-success"></i>
          {{else}}
          <i class="bi bi-x-circle-fill text-danger"></i>
          {{/if}}
        </span>
      </td>
      <td>
        <span class="sort-text" data-id="{{this.id}}">{{this.sort}}</span>
        <input type="number" class="form-control sort-input d-none" style="width:50%" data-id="{{this.id}}"
          value="{{this.sort}}">
      </td>
      <td>
        <a href="/admin/users/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
        <a href="/admin/users/{{this.id}}/edit" class="btn btn-warning btn-sm">修改</a>
        <a class="btn btn-danger btn-sm" onclick="deleteUser({{this.id}})">删除</a>
+       <button class="btn btn-info btn-sm" onclick="assignRoles({{this.id}})">分配角色</button>
      </td>
    </tr>
    {{/each}}
  </tbody>
</table>
<nav>
  <ul class="pagination">
+   <li class="page-item {{#if (eq page 1)}}disabled{{/if}}">
      <a class="page-link" href="?page={{dec page}}&keyword={{keyword}}&limit={{limit}}">上一页</a>
    </li>
    {{#each (range 1 pageCount)}}
    <li class="page-item {{#if (eq this ../page)}}active{{/if}}">
      <a class="page-link" href="?page={{this}}&keyword={{../keyword}}&limit={{../limit}}">{{this}}</a>
    </li>
    {{/each}}

    <li class="page-item {{#if (eq page pageCount)}}disabled{{/if}}">
      <a class="page-link" href="?page={{inc page}}&keyword={{keyword}}&limit={{limit}}">下一页</a>
    </li>
    <li class="page-item">
      <form method="GET" action="/admin/users" class="d-inline-block ms-3">
        <input type="hidden" name="keyword" value="{{keyword}}">
+       <input type="hidden" name="page" value="{{page}}">
        <div class="input-group">
          <input type="number" name="limit" class="form-control" placeholder="每页条数" value="{{limit}}" min="1">
          <button class="btn btn-outline-secondary" type="submit">设置每页的条数</button>
        </div>
      </form>
    </li>
  </ul>
</nav>
+<div class="modal fade" id="roleModal" tabindex="-1">
+ <div class="modal-dialog">
+   <div class="modal-content">
+     <div class="modal-header">
+       <h5 class="modal-title" id="roleModalLabel">分配角色</h5>
+       <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
+     </div>
+     <div class="modal-body">
+       <form id="roleForm">
+         {{#each roles}}
+         <div class="form-check">
+           <input class="form-check-input" type="checkbox" value="{{this.id}}" id="role{{this.id}}">
+           <label class="form-check-label" for="role{{this.id}}">
+             {{this.name}}
+           </label>
+         </div>
+         {{/each}}
+       </form>
+     </div>
+     <div class="modal-footer">
+       <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
+       <button type="button" class="btn btn-primary" id="saveRoles">保存</button>
+     </div>
+   </div>
+ </div>
+</div>
<script>
+ let selectedUserId;
+ function assignRoles(userId) {
+   selectedUserId = userId;
+   $.ajax({
+     url: `/admin/users/${userId}`,
+     type: 'GET',
+     headers: {
+       'accept': 'application/json'
+     },
+     success: function (user) {
+       const roles = user.roles.map(role => role.id);
+       $('#roleForm input[type="checkbox"]').each(function () {
+         $(this).prop('checked', roles.includes(parseInt($(this).val())));
+       });
+       $('#roleModal').modal('show');
+     }
+   });
+
+ }
+ $('#saveRoles').on('click', function () {
+   const roleIds = $('#roleForm input[type="checkbox"]:checked').map(function () {
+     return $(this).val();
+   }).get();
+   $.ajax({
+     url: `/admin/users/${selectedUserId}/roles`,
+     type: 'PUT',
+     headers: {
+       'accept': 'application/json'
+     },
+     contentType: 'application/json',
+     data: JSON.stringify({ roleIds }),
+     success: function (response) {
+       $('#roleModal').modal('hide');
+       location.reload();
+     },
+     error: function (error) {
+       const { responseJSON } = error;
+       alert(responseJSON.message);
+     }
+   });
+ });
  function deleteUser(id) {
    if (confirm('确定要删除吗?')) {
      $.ajax({
        url: `/admin/users/${id}`,
        type: 'DELETE',
        success: function (data) {
          if (data.success) {
            const params = new URLSearchParams(window.location.search);
            params.delete('page');
            params.append('page', 1)
+           const query = params.toString();
+           window.location = window.location.pathname + '?' + query;
          }
        }
      })
    }
  }
  $(function () {
    $('.sort-text').on('dblclick', function () {
      const $this = $(this);
      const id = $this.data('id');
      $this.addClass('d-none');
      $(`.sort-input[data-id="${id}"]`).removeClass('d-none').focus();
    });
    $('.sort-input').on('blur', function () {
      const $this = $(this);
      const id = $this.data('id');
      const newSort = $this.val();
      $this.addClass('d-none');
      $.ajax({
        url: `/admin/users/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ sort: newSort }),
        success: function (data) {
          if (data.success) {
            $(`.sort-text[data-id="${id}"]`).removeClass('d-none').text(newSort);
          }
        }
      })
    });
    $('.status-toggle').on('click', function () {
      const $this = $(this);
      const id = $this.data('id');
      const currentStatus = $this.data('status');
      const newStatus = currentStatus == 1 ? 0 : 1;
      $.ajax({
        url: `/admin/users/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ status: newStatus }),
        success: function (data) {
          if (data.success) {
            $this.data('status', newStatus);
            $this.html(` <i class="bi ${newStatus ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} ${newStatus ? 'text-success' : 'text-danger'}"></i>`);
          }
        }
      })
    });
  });
</script>
23.为角色分配资源
23.1. role.entity.ts
src/shared/entities/role.entity.ts

import { ApiProperty } from '@nestjs/swagger';
+import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
+import { Access } from './access.entity';
@Entity()
export class Role {
    @PrimaryGeneratedColumn()
    @ApiProperty({ description: 'ID', example: 1 })
    id: number;

    @Column({ length: 50, unique: true })
    @ApiProperty({ description: '名称', example: 'name' })
    name: string;

    @Column({ default: 1 })
    @ApiProperty({ description: '生效状态', example: 1 })
    status: number;

    @Column({ default: 100 })
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;

+   @ManyToMany(() => Access)
+   @JoinTable()
+   accesses: Access[];
+
    @CreateDateColumn()
    @ApiProperty({ description: '创建时间', example: '2024年8月11日16:49:22' })
    createdAt: Date;

    @UpdateDateColumn()
    @ApiProperty({ description: '更新时间', example: '2024年8月11日16:49:22' })
    updatedAt: Date;
}

23.2. role.dto.ts
src/shared/dto/role.dto.ts

import { ApiProperty, PartialType as PartialTypeFromSwagger } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { IdValidators, StatusValidators, SortValidators } from '../decorators/dto.decorator';

export class CreateRoleDto {
    @IsString()
    @ApiProperty({ description: '名称', example: 'name' })
    name: string;

    @StatusValidators()
    @ApiProperty({ description: '状态', example: 1 })
    status: number;

    @SortValidators()
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;
}

export class UpdateRoleDto extends PartialTypeFromSwagger(PartialType(CreateRoleDto)) {
    @IdValidators()
    id: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: '用户名', example: 'nick' })
    username: string;

    @ApiProperty({ description: '密码', example: '666666' })
    @IsOptional()
    password: string;
}
+export class UpdateRoleAccessesDto {
+   readonly accessIds: number[];
+}
23.3. role.service.ts
src/shared/services/role.service.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Role } from "../entities/role.entity";
+import { Repository, Like, In } from 'typeorm';
import { MySQLBaseService } from "./mysql-base.service";
+import { Access } from "../entities/access.entity";
+import { UpdateRoleAccessesDto } from "../dto/role.dto";
@Injectable()
export class RoleService extends MySQLBaseService<Role> {
  constructor(
+   @InjectRepository(Role) protected repository: Repository<Role>,
+   @InjectRepository(Access) private readonly accessRepository: Repository<Access>
  ) {
    super(repository);
  }

  async findAll(keyword?: string) {
    const where = keyword ? [
      { name: Like(`%${keyword}%`) }
    ] : {};
    return this.repository.find({ where });
  }

  async findAllWithPagination(page: number, limit: number, keyword?: string) {
    const where = keyword ? [
      { name: Like(`%${keyword}%`) }
    ] : {};
    const [roles, total] = await this.repository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit
    });
    return { roles, total };
  }
+ async updateAccesses(id: number, updateRoleAccessesDto: UpdateRoleAccessesDto) {
+   const role = await this.repository.findOneBy({ id });
+   if (!role) throw new Error('Role not found');
+   role.accesses = await this.accessRepository.findBy({ id: In(updateRoleAccessesDto.accessIds) });
+   await this.repository.save(role);
+ }
}

23.4. role.controller.ts
src/admin/controllers/role.controller.ts

import { Controller, Get, Render, Post, Redirect, Body, UseFilters, HttpException, Param, ParseIntPipe, Put, Delete, Headers, Res, Query } from '@nestjs/common';
+import { CreateRoleDto, UpdateRoleDto, UpdateRoleAccessesDto } from 'src/shared/dto/role.dto';
import { RoleService } from 'src/shared/services/role.service';
import { AdminExceptionFilter } from '../filters/admin-exception-filter';
import { Response } from 'express';
import { ParseOptionalIntPipe } from 'src/shared/pipes/parse-optional-int.pipe';
+import { AccessService } from 'src/shared/services/access.service';
@UseFilters(AdminExceptionFilter)
@Controller('admin/roles')
export class RoleController {
    constructor(
        private readonly roleService: RoleService,
+       private readonly accessService: AccessService
    ) { }

    @Get()
    @Render('role/role-list')
    async findAll(@Query('keyword') keyword: string = '',
        @Query('page', new ParseOptionalIntPipe(1)) page: number,
        @Query('limit', new ParseOptionalIntPipe(10)) limit: number) {
        const { roles, total } = await this.roleService.findAllWithPagination(page, limit, keyword);
        const pageCount = Math.ceil(total / limit);
+       const accessTree = await this.accessService.findAll();
+       return { keyword, page, limit, roles, pageCount, accessTree };
    }

    @Get('create')
    @Render('role/role-form')
    createForm() {
        return { role: {} }
    }

    @Post()
    @Redirect('/admin/roles')
    async create(@Body() createRoleDto: CreateRoleDto) {
        await this.roleService.create(createRoleDto);
        return { success: true }
    }

    @Get(':id/edit')
    @Render('role/role-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
+       const role = await this.roleService.findOne({ where: { id }, relations: ['accesses'] });
        if (!role) throw new HttpException('Role not Found', 404);
        return { role };
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto, @Res({ passthrough: true }) res: Response, @Headers('accept') accept: string) {
        await this.roleService.update(id, updateRoleDto);
        if (accept === 'application/json') {
            return { success: true };
        } else {
            return res.redirect(`/admin/roles`);
        }
    }

    @Delete(":id")
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.roleService.delete(id);
        return { success: true }
    }

    @Get(':id')
    @Render('role/role-detail')
+   async findOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response, @Headers('accept') accept: string) {
+       const role = await this.roleService.findOne({ where: { id }, relations: ['accesses'] });
        if (!role) throw new HttpException('Role not Found', 404);
+       if (accept === 'application/json') {
+           return res.json(role);
+       } else {
+           res.render('role/role-detail', { role });
+       }
+   }
+   @Put(':id/accesses')
+   async updateAccesses(@Param('id', ParseIntPipe) id: number, @Body() updateRoleAccessesDto: UpdateRoleAccessesDto) {
+       await this.roleService.updateAccesses(id, updateRoleAccessesDto);
+       return { success: true };
    }
}

23.5. role-list.hbs
views/role/role-list.hbs

<h1>
  角色列表
</h1>
<a href="/admin/roles/create" class="btn btn-success mb-3">添加角色</a>
<form method="GET" action="/admin/roles" class="mb-3">
  <div class="input-group">
    <input type="text" name="keyword" class="form-control" placeholder="请输入搜索关键字" value="{{keyword}}">
    <button class="btn btn-outline-secondary">搜索</button>
  </div>
</form>
<table class="table">
  <thead>
    <tr>
      <td>名称</td>
      <td>状态</td>
      <td>排序</td>
      <td>操作</td>
    </tr>
  </thead>
  <tbody>
    {{#each roles}}
    <tr>
      <td>{{this.name}}</td>
      <td>
        <span class="status-toggle" data-id="{{this.id}}" data-status="{{this.status}}">
          {{#if this.status}}
          <i class="bi bi-check-circle-fill text-success"></i>
          {{else}}
          <i class="bi bi-x-circle-fill text-danger"></i>
          {{/if}}
        </span>
      </td>
      <td>
        <span class="sort-text" data-id="{{this.id}}">{{this.sort}}</span>
        <input type="number" class="form-control sort-input d-none" style="width:50%" data-id="{{this.id}}"
          value="{{this.sort}}">
      </td>
      <td>
        <a href="/admin/roles/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
        <a href="/admin/roles/{{this.id}}/edit" class="btn btn-warning btn-sm">修改</a>
        <a class="btn btn-danger btn-sm" onclick="deleteRole({{this.id}})">删除</a>
+       <button class="btn btn-info btn-sm" onclick="assignAccesses({{this.id}})">分配权限</button>
      </td>
    </tr>
    {{/each}}
  </tbody>
</table>
<nav>
  <ul class="pagination">
    <li class="page-item {{#if (eq page 1)}}disabled{{/if}}">
      <a class="page-link" href="?page={{dec page}}&keyword={{keyword}}&limit={{limit}}">上一页</a>
    </li>
    {{#each (range 1 pageCount)}}
    <li class="page-item {{#if (eq this ../page)}}active{{/if}}">
      <a class="page-link" href="?page={{this}}&keyword={{../keyword}}&limit={{../limit}}">{{this}}</a>
    </li>
    {{/each}}

    <li class="page-item {{#if (eq page pageCount)}}disabled{{/if}}">
      <a class="page-link" href="?page={{inc page}}&keyword={{keyword}}&limit={{limit}}">下一页</a>
    </li>
    <li class="page-item">
      <form method="GET" action="/admin/roles" class="d-inline-block ms-3">
        <input type="hidden" name="keyword" value="{{keyword}}">
        <input type="hidden" name="page" value="{{page}}">
        <div class="input-group">
          <input type="number" name="limit" class="form-control" placeholder="每页条数" value="{{limit}}" min="1">
          <button class="btn btn-outline-secondary" type="submit">设置每页的条数</button>
        </div>
      </form>
    </li>
  </ul>
</nav>
+<div class="modal fade" id="accessModal" tabindex="-1">
+ <div class="modal-dialog">
+   <div class="modal-content">
+     <div class="modal-header">
+       <h5 class="modal-title" id="accessModalLabel">分配权限</h5>
+       <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
+     </div>
+     <div class="modal-body">
+       <form id="accessForm">
+         <div id="accessTree" class="border rounded p-3"></div>
+       </form>
+     </div>
+     <div class="modal-footer">
+       <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
+       <button type="button" class="btn btn-primary" id="saveAccesses">保存</button>
+     </div>
+   </div>
+ </div>
+</div>
<script>
+ const accessTree = {{{ json accessTree }}};
+ let selectedRoleId;
+ function assignAccesses(roleId) {
+   selectedRoleId = roleId;
+   $.ajax({
+     url: `/admin/roles/${roleId}`,
+     type: 'GET',
+     headers: {
+       'accept': 'application/json'
+     },
+     success: function (role) {
+       const accesses = role.accesses.map(access => access.id);
+       $('#accessForm input[type="checkbox"]').each(function () {
+         $(this).prop('checked', accesses.includes(parseInt($(this).val())));
+       });
+       $('#accessModal').modal('show');
+     },
+     error: function (error) {
+       const { responseJSON } = error;
+       alert(responseJSON.message);
+     }
+   });
+ }
+
+ function renderTree(accesses) {
+   let html = '<ul class="list-unstyled">';
+   accesses.forEach(function (access) {
+     html += `
+           <li class="mb-2">
+               <div class="d-flex align-items-center">
+                   ${access.children?.length > 0 ? '<span class="toggle me-2 cursor-pointer"><i class="bi bi-folder-minus"></i></span>' : '<span class="me-4"></span>'}
+                   <label class="form-check-label">
+                       <input type="checkbox" class="form-check-input parent-checkbox" data-id="${access.id}" value="${access.id}">
+                       ${access.name}
+                   </label>
+               </div>
+               ${access.children?.length > 0 ? `<div class="children ms-4">${renderTree(access.children)}</div>` : ''}
+           </li>`;
+   });
+   html += '</ul>';
+   return html;
+ }
+ function closeAllNodes() {
+   $('#accessTree .children').hide();
+   $('#accessTree .toggle').html('<i class="bi bi-folder-plus"></i>');
+ }
  function deleteRole(id) {
    if (confirm('确定要删除吗?')) {
      $.ajax({
        url: `/admin/roles/${id}`,
        type: 'DELETE',
        success: function (data) {
          if (data.success) {
            const params = new URLSearchParams(window.location.search);
            params.delete('page');
            params.append('page', 1)
            const query = params.toString();
            window.location = window.location.pathname + '?' + query;
          }
        }
      })
    }
  }
  $(function () {
+   $('#accessTree').html(renderTree(accessTree));
+   $('body').on('click', '.toggle', function () {
+     const childrenContainer = $(this).parent().siblings('.children');
+     if (childrenContainer.is(':visible')) {
+       childrenContainer.hide();
+       $(this).html('<i class="bi bi-folder-plus"></i>');
+     } else {
+       childrenContainer.show();
+       $(this).html('<i class="bi bi-folder-minus"></i>');
+     }
+   });
+   $('body').on('change', '.parent-checkbox', function () {
+     const isChecked = $(this).is(':checked');
+     $(this).closest('li').find('.children input[type="checkbox"]').prop('checked', isChecked);
+   });
+   $('#saveAccesses').on('click', function () {
+     const accessIds = $('#accessForm input[type="checkbox"]:checked').map(function () {
+       return $(this).val();
+     }).get();
+     $.ajax({
+       url: `/admin/roles/${selectedRoleId}/accesses`,
+       type: 'PUT',
+       contentType: 'application/json',
+       data: JSON.stringify({ accessIds }),
+       success: function (response) {
+         $('#accessModal').modal('hide');
+         location.reload();
+       }
+     });
+   });
    $('.sort-text').on('dblclick', function () {
      const $this = $(this);
      const id = $this.data('id');
      $this.addClass('d-none');
      $(`.sort-input[data-id="${id}"]`).removeClass('d-none').focus();
    });
    $('.sort-input').on('blur', function () {
      const $this = $(this);
      const id = $this.data('id');
      const newSort = $this.val();
      $this.addClass('d-none');
      $.ajax({
        url: `/admin/roles/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ sort: newSort }),
        success: function (data) {
          if (data.success) {
            $(`.sort-text[data-id="${id}"]`).removeClass('d-none').text(newSort);
          }
        }
      })
    });
    $('.status-toggle').on('click', function () {
      const $this = $(this);
      const id = $this.data('id');
      const currentStatus = $this.data('status');
      const newStatus = currentStatus == 1 ? 0 : 1;
      $.ajax({
        url: `/admin/roles/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ status: newStatus }),
        success: function (data) {
          if (data.success) {
            $this.data('status', newStatus);
            $this.html(` <i class="bi ${newStatus ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} ${newStatus ? 'text-success' : 'text-danger'}"></i>`);
          }
        }
      })
    });
  });
</script>