1.密码登录
1.1. global.d.ts
src/global.d.ts

declare namespace Express {
    interface Multer {
        File: Express.Multer.File
    }
+   interface Request {
+       session: {
+           user: any;
+       };
+       user: any;
+   }
}
1.2. api.module.ts
src/api/api.module.ts

import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
+import { JwtModule } from '@nestjs/jwt';
+import { AuthController } from './controllers/auth.controller';
@Module({
+ imports: [
+   JwtModule.register({
+     global: true,
+     signOptions: { expiresIn: '7d' }
+   }),
+ ],
+ controllers: [UserController, AuthController]
})
export class ApiModule { }

1.3. index.html
front/index.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMS首页</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
    <script src="/js/handlebars.min.js"></script>
    <script src="/js/client-side-templates.js"></script>
</head>

<body>
    Home
</body>

</html>
1.4. auth.controller.ts
src/api/controllers/auth.controller.ts

// 导入所需的装饰器、模块和服务
import { Controller, Post, Body, Res, Request, Get, UseGuards, Query } from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { UserService } from 'src/shared/services/user.service';
import { UtilityService } from 'src/shared/services/utility.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigurationService } from 'src/shared/services/configuration.service';
// 声明控制器，路由前缀为 'api/auth'
@Controller('api/auth')
export class AuthController {
    // 构造函数，注入服务类
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService,
        private readonly jwtService: JwtService,
        private readonly configurationService: ConfigurationService,
    ) { }
    // 定义一个 POST 请求处理器，路径为 'login'
    @Post('login')
    async login(@Body() body, @Res() res: Response) {
        // 从请求体中获取用户名和密码
        const { username, password } = body;
        // 验证用户
        const user = await this.validateUser(username, password);
        // 如果用户验证通过
        if (user) {
            // 创建 JWT 令牌
            const tokens = this.createJwtTokens(user);
            // 返回成功响应，包含令牌信息
            return res.json({ success: true, ...tokens });
        }
        // 如果验证失败，返回 401 状态码和错误信息
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    // 验证用户的私有方法
    private async validateUser(username: string, password: string) {
        // 查找用户，并获取其关联的角色和权限
        const user = await this.userService.findOne({ where: { username }, relations: ['roles', 'roles.accesses'] });
        // 如果用户存在并且密码匹配
        if (user && await this.utilityService.comparePassword(password, user.password)) {
            // 返回用户信息
            return user;
        }
        // 否则返回 null
        return null;
    }
    // 创建 JWT 令牌的私有方法
    private createJwtTokens(user: any) {
        // 创建访问令牌，设置过期时间为 30 分钟
        const access_token = this.jwtService.sign({ id: user.id, username: user.username }, {
            secret: this.configurationService.jwtSecret,
            expiresIn: '30m',
        });
        // 返回令牌信息
        return { access_token };
    }
}
1.5. main.ts
src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { I18nValidationPipe, I18nValidationExceptionFilter } from 'nestjs-i18n';
import { useContainer } from 'class-validator';
import * as helpers from 'src/shared/helpers'
import RedisStore from 'connect-redis';
import { RedisService } from './shared/services/redis.service';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useStaticAssets(join(__dirname, '..', 'public'));
+ app.useStaticAssets(join(__dirname, '..', 'front'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.engine('hbs', engine({
    extname: '.hbs',
    helpers,
    runtimeOptions: {
      allowProtoMethodsByDefault: true,
      allowProtoPropertiesByDefault: true
    }
  }));
  app.set('view engine', 'hbs');
  app.use(cookieParser());
  const redisService = app.get(RedisService);
  const redisClient = redisService.getClient();
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  }));
  app.useGlobalPipes(new I18nValidationPipe({ transform: true }));
  app.useGlobalFilters(new I18nValidationExceptionFilter({ detailedErrors: true }));
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

1.6. configuration.service.ts
src/shared/services/configuration.service.ts

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class ConfigurationService {
    constructor(private configService: ConfigService) { }
    get mysqlHost(): string {
        return this.configService.get<string>('MYSQL_HOST');
    }
    get mysqlPort(): number {
        return this.configService.get<number>('MYSQL_PORT');
    }
    get mysqlDB(): string {
        return this.configService.get<string>('MYSQL_DB');
    }
    get mysqlUser(): string {
        return this.configService.get<string>('MYSQL_USER');
    }
    get mysqlPassword(): string {
        return this.configService.get<string>('MYSQL_PASSWORD');
    }
    get mysqlConfig() {
        return {
            host: this.mysqlHost,
            port: this.mysqlPort,
            database: this.mysqlDB,
            username: this.mysqlUser,
            password: this.mysqlPassword
        }
    }
    get cosSecretId(): string {
        return this.configService.get<string>('COS_SECRET_ID');
    }
    get cosSecretKey(): string {
        return this.configService.get<string>('COS_SECRET_KEY');
    }
    get cosBucket(): string {
        return this.configService.get<string>('COS_BUCKET');
    }
    get cosRegion(): string {
        return this.configService.get<string>('COS_REGION');
    }
    get smtpHost(): string {
        return this.configService.get<string>('SMTP_HOST');
    }
    get smtpPort(): string {
        return this.configService.get<string>('SMTP_PORT');
    }
    get smtpUser(): string {
        return this.configService.get<string>('SMTP_USER');
    }
    get smtpPass(): string {
        return this.configService.get<string>('SMTP_PASS');
    }
    get mongodbHost(): string {
        return this.configService.get<string>('MONGO_HOST');
    }
    get mongodbPort(): string {
        return this.configService.get<string>('MONGO_PORT');
    }
    get mongodbDB(): string {
        return this.configService.get<string>('MONGO_DB');
    }
    get mongodbUser(): string {
        return this.configService.get<string>('MONGO_USER');
    }
    get mongodbPassword(): string {
        return this.configService.get<string>('MONGO_PASSWORD');
    }
    get mongodbConfig() {
        return {
            uri: `mongodb://${this.mongodbHost}:${this.mongodbPort}/${this.mongodbDB}`
        }
    }
    get ipApiUrl(): string {
        return this.configService.get<string>('IP_API_URL');
    }
    get weatherApiKey(): string {
        return this.configService.get<string>('WEATHER_API_KEY');
    }
    get weatherApiUrl(): string {
        return this.configService.get<string>('WEATHER_API_URL');
    }
    get redisHost(): string {
        return this.configService.get<string>('REDIS_HOST');
    }
    get redisPort(): number {
        return this.configService.get<number>('REDIS_PORT');
    }
    get redisPassword(): string {
        return this.configService.get<string>('REDIS_PASSWORD');
    }
+   get jwtSecret(): string {
+       return this.configService.get<string>('JWT_SECRET');
+   }
+   get expiresIn(): string {
+       return this.configService.get<string>('JWT_EXPIRES_IN');
+   }
}
1.7. login.html
front/login.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
</head>

<body>
    <div class="container">
        <h2 class="mt-5">登录</h2>
        <ul class="nav nav-tabs" id="loginTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <a class="nav-link active" id="password-login-tab" data-bs-toggle="tab" href="#password-login"
                    role="tab" aria-controls="password-login" aria-selected="true">密码登录</a>
            </li>
        </ul>
        <div class="tab-content" id="loginTabContent">
            <div class="tab-pane fade show active" id="password-login" role="tabpanel"
                aria-labelledby="password-login-tab">
                <div class="mt-3">
                    <label for="username" class="form-label">用户名</label>
                    <input type="text" class="form-control" id="username" name="username" required>
                </div>
                <div class="mt-3">
                    <label for="password" class="form-label">密码</label>
                    <input type="password" class="form-control" id="password" name="password" required>
                </div>
                <button id="passwordLoginButton" class="btn btn-primary mt-3" hx-post="/api/auth/login"
                    hx-trigger="click" hx-include="#username,#password" hx-swap="none">登录</button>
            </div>
        </div>
        <div id="errorMessage" class="alert alert-danger d-none mt-3"></div>
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div id="toastMessage" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">提示</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body" id="toastBody"></div>
            </div>
        </div>
    </div>
    <script>
        //显示提示信息的函数
        function showToast(message) {
            // 设置提示框的文本内容
            $('#toastBody').text(message);
            // 创建 Bootstrap Toast 实例
            const toast = new bootstrap.Toast(document.getElementById('toastMessage'));
            // 显示提示框
            toast.show();
        }
        // 处理登录响应的函数
        function handleLoginResponse(event) {
            // 解析 AJAX 请求的响应内容
            const result = JSON.parse(event.detail.xhr.responseText);
            // 如果登录成功
            if (result.success) {
                // 将 access_token 和 refresh_token 存储到本地存储中
                localStorage.setItem('access_token', result.access_token);
                // 重定向到首页
                window.location.href = '/';
            } else {
                // 如果登录失败，显示错误信息
                showToast(result.message);
            }
        }
        // 处理发送验证码响应的函数
        function handleSendCodeResponse(event) {
            // 解析 AJAX 请求的响应内容
            const result = JSON.parse(event.detail.xhr.responseText);
            // 显示响应信息
            showToast(result.message);
        }
        // jQuery 文档就绪函数
        $(function () {
            // 为登录按钮绑定事件，当 AJAX 请求完成后调用 handleLoginResponse 函数
            $('#passwordLoginButton').on('htmx:afterRequest', handleLoginResponse);
        });
    </script>
</body>
</html>
2.获取用户信息
2.1. index.html
front/index.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMS首页</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
    <script src="/js/handlebars.min.js"></script>
    <script src="/js/client-side-templates.js"></script>
</head>

<body>
+   <header class="navbar navbar-expand-lg navbar-light bg-light">
+       <div class="container-fluid">
+           <a class="navbar-brand" href="#">CMS首页</a>
+           <div class="d-flex" hx-get="/api/auth/profile" hx-trigger="load" hx-ext="client-side-templates"
+               handlebars-template="profile-template" hx-swap="outerHTML">
+           </div>
+       </div>
+   </header>
+   <script id="profile-template" type="text/x-handlebars-template">
+       <span>欢迎, {{user.username}}</span>
+   </script>
+   <script>
+       $('body').on('htmx:configRequest', function (event) {
+           const accessToken = localStorage.getItem('access_token');
+           if (accessToken) {
+               event.detail.headers['Authorization'] = `Bearer ${accessToken}`;
+           }
+       }); 
+   </script>
</body>

</html>
2.2. auth.guard.ts
src/api/guards/auth.guard.ts

// 导入所需的装饰器、模块和服务
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/shared/services/user.service';
import { ConfigurationService } from 'src/shared/services/configuration.service';
import { Request } from 'express';

// 使用 @Injectable() 装饰器将此类标记为可注入的服务
@Injectable()
export class AuthGuard implements CanActivate {
    // 构造函数，注入所需的服务
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configurationService: ConfigurationService,
    ) { }
    // 实现 CanActivate 接口的 canActivate 方法，用于进行身份验证
    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        // 获取 HTTP 请求对象
        const request = context.switchToHttp().getRequest<Request>();
        // 从请求头中提取令牌
        const token = this.extractTokenFromHeader(request);

        // 如果没有令牌，抛出未授权异常
        if (!token) {
            throw new UnauthorizedException('Token not provided');
        }
        try {
            // 验证令牌并获取解码后的数据
            const decoded = this.jwtService.verify(token, { secret: this.configurationService.jwtSecret });
            // 查找用户并获取其关联的角色和权限
            const user = await this.userService.findOne({ where: { id: decoded.id }, relations: ['roles', 'roles.accesses'] });
            // 如果找到用户
            if (user) {
                // 删除用户密码，防止暴露敏感信息
                delete user.password;
                // 将用户信息附加到请求对象
                request.user = user;
                // 返回 true，表示通过身份验证
                return true;
            } else {
                // 如果用户不存在，抛出未授权异常
                throw new UnauthorizedException('User not found');
            }
        } catch (error) {
            // 捕获令牌验证错误并抛出未授权异常
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
    // 从请求头中提取令牌的私有方法
    private extractTokenFromHeader(request: Request): string | undefined {
        // 从请求头中获取授权信息，并按照空格分隔为类型和令牌
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        // 如果类型为 'Bearer'，则返回令牌，否则返回 undefined
        return type === 'Bearer' ? token : undefined;
    }
}
2.3. auth.controller.ts
src/api/controllers/auth.controller.ts

import { Controller, Post, Body, Res, Request, Get, UseGuards, Query } from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { UserService } from 'src/shared/services/user.service';
import { UtilityService } from 'src/shared/services/utility.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigurationService } from 'src/shared/services/configuration.service';
+import { AuthGuard } from '../guards/auth.guard';
@Controller('api/auth')
export class AuthController {
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService,
        private readonly jwtService: JwtService,
        private readonly configurationService: ConfigurationService,
    ) { }

    @Post('login')
    async login(@Body() body, @Res() res: Response) {
        const { username, password } = body;
        const user = await this.validateUser(username, password);
        if (user) {
            const tokens = this.createJwtTokens(user);
            return res.json({ success: true, ...tokens });
        }
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    private async validateUser(username: string, password: string) {
        const user = await this.userService.findOne({ where: { username }, relations: ['roles', 'roles.accesses'] });
        if (user && await this.utilityService.comparePassword(password, user.password)) {
            return user;
        }
        return null;
    }
    private createJwtTokens(user: any) {
        const access_token = this.jwtService.sign({ id: user.id, username: user.username }, {
            secret: this.configurationService.jwtSecret,
            expiresIn: '30m',
        });
+       return { access_token };
+   }
+   @UseGuards(AuthGuard)
+   @Get('profile')
+   getProfile(@Request() req: ExpressRequest, @Res() res: Response) {
+       return res.json({ user: req.user });
    }
}
3.refresh_token
3.1. auth.controller.ts
src/api/controllers/auth.controller.ts

import { Controller, Post, Body, Res, Request, Get, UseGuards, Query } from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { UserService } from 'src/shared/services/user.service';
import { UtilityService } from 'src/shared/services/utility.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigurationService } from 'src/shared/services/configuration.service';
import { AuthGuard } from '../guards/auth.guard';
@Controller('api/auth')
export class AuthController {
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService,
        private readonly jwtService: JwtService,
        private readonly configurationService: ConfigurationService,
    ) { }

    @Post('login')
    async login(@Body() body, @Res() res: Response) {
        const { username, password } = body;
        const user = await this.validateUser(username, password);
        if (user) {
            const tokens = this.createJwtTokens(user);
            return res.json({ success: true, ...tokens });
        }
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    private async validateUser(username: string, password: string) {
        const user = await this.userService.findOne({ where: { username }, relations: ['roles', 'roles.accesses'] });
        if (user && await this.utilityService.comparePassword(password, user.password)) {
            return user;
        }
        return null;
    }
    private createJwtTokens(user: any) {
        const access_token = this.jwtService.sign({ id: user.id, username: user.username }, {
            secret: this.configurationService.jwtSecret,
            expiresIn: '30m',
        });
+       const refresh_token = this.jwtService.sign({ id: user.id, username: user.username }, {
+           secret: this.configurationService.jwtSecret,
+           expiresIn: '7d',
+       });
+       return { access_token, refresh_token };
    }
    @UseGuards(AuthGuard)
    @Get('profile')
    getProfile(@Request() req: ExpressRequest, @Res() res: Response) {
        return res.json({ user: req.user });
    }

+   @Post('refresh-token')
+   async refreshToken(@Body() body, @Res() res: Response) {
+       const { refresh_token } = body;
+       try {
+           const decoded = this.jwtService.verify(refresh_token, { secret: this.configurationService.jwtSecret });
+           const tokens = this.createJwtTokens(decoded);
+           return res.json({ success: true, ...tokens });
+       } catch (error) {
+           return res.status(401).json({ success: false, message: 'Refresh token无效或已过期' });
+       }
+   }
}

3.2. login.html
front/login.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
</head>

<body>
    <div class="container">
        <h2 class="mt-5">登录</h2>
        <ul class="nav nav-tabs" id="loginTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <a class="nav-link active" id="password-login-tab" data-bs-toggle="tab" href="#password-login"
                    role="tab" aria-controls="password-login" aria-selected="true">密码登录</a>
            </li>
        </ul>
        <div class="tab-content" id="loginTabContent">
            <div class="tab-pane fade show active" id="password-login" role="tabpanel"
                aria-labelledby="password-login-tab">
                <div class="mt-3">
                    <label for="username" class="form-label">用户名</label>
                    <input type="text" class="form-control" id="username" name="username" required>
                </div>
                <div class="mt-3">
                    <label for="password" class="form-label">密码</label>
                    <input type="password" class="form-control" id="password" name="password" required>
                </div>
                <button id="passwordLoginButton" class="btn btn-primary mt-3" hx-post="/api/auth/login"
                    hx-trigger="click" hx-include="#username,#password" hx-swap="none">登录</button>
            </div>
        </div>
        <div id="errorMessage" class="alert alert-danger d-none mt-3"></div>
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div id="toastMessage" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">提示</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body" id="toastBody"></div>
            </div>
        </div>
    </div>
    <script>
        function showToast(message) {
            $('#toastBody').text(message);
            const toast = new bootstrap.Toast(document.getElementById('toastMessage'));
            toast.show();
        }
        function handleLoginResponse(event) {
            const result = JSON.parse(event.detail.xhr.responseText);
            if (result.success) {
                localStorage.setItem('access_token', result.access_token);
+               localStorage.setItem('refresh_token', result.refresh_token);
                window.location.href = '/';
            } else {
                showToast(result.message);
            }
        }
        function handleSendCodeResponse(event) {
            const result = JSON.parse(event.detail.xhr.responseText);
            showToast(result.message);
        }
        $(function () {
            $('#passwordLoginButton').on('htmx:afterRequest', handleLoginResponse);
        });
    </script>

</body>

</html>
3.3. index.html
front/index.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMS首页</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
    <script src="/js/handlebars.min.js"></script>
    <script src="/js/client-side-templates.js"></script>
</head>

<body>
    <header class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">CMS首页</a>
+           <div id="profile-container" class="d-flex" hx-get="/api/auth/profile" hx-trigger="load"
+               hx-ext="client-side-templates" handlebars-template="profile-template" hx-swap="innerHTML">
            </div>
        </div>
    </header>
    <script id="profile-template" type="text/x-handlebars-template">
        <span>欢迎, {{user.username}}</span>
    </script>
    <script>
+       async function refreshAccessToken() {
+           try {
+               const response = await fetch(' /api/auth/refresh-token', {
+                   method: 'POST',
+                   headers: { 'Content-Type': 'application/json' },
+                   body: JSON.stringify({
+                       refresh_token: localStorage.getItem('refresh_token')
+                   })
+               });
+               const data = await response.json(); if (data.success) {
+                   localStorage.setItem('access_token', data.access_token);
+                   localStorage.setItem('refresh_token', data.refresh_token);
+               } else {
+                   console.error('刷新access_token失败');
+                   window.location.href = '/login.html';
+                   return false;
+               }
+               return true;
+           } catch (error) {
+               console.error('刷新access_token时出错', error);
+               window.location.href = '/login.html';
+               return false;
+           }
+       }
        $('body').on('htmx:configRequest', function (event) {
            const accessToken = localStorage.getItem('access_token');
            if (accessToken) {
                event.detail.headers['Authorization'] = `Bearer ${accessToken}`;
            }
+       });
+       $('#profile-container').on('htmx:afterOnLoad', async function (event) {
+           if (event.detail.xhr.status === 401) {
+               const success = await refreshAccessToken();
+               if (success) {
+                   const accessToken = localStorage.getItem('access_token');
+                   fetch(`/api/auth/profile`, { headers: { Authorization: `Bearer ${accessToken}` } })
+                       .then(response => response.json())
+                       .then(data => {
+                           const templateSource = document.getElementById('profile-template').innerHTML;
+                           const template = Handlebars.compile(templateSource);
+                           const html = template({
+                               user: data.user
+                           });
+                           $('#profile-container').html(html);
+                           htmx.process(document.getElementById('profile-container'));
+                       })
+                       .catch(error => console.error('Error fetching profile:', error));
+               }
+           }
+       });
    </script>
</body>

</html>
4.并发请求
4.1. index.html
front/index.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMS首页</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
    <script src="/js/handlebars.min.js"></script>
    <script src="/js/client-side-templates.js"></script>
</head>

<body>
    <header class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">CMS首页</a>
            <div id="profile-container" class="d-flex" hx-get="/api/auth/profile" hx-trigger="load"
                hx-ext="client-side-templates" handlebars-template="profile-template" hx-swap="innerHTML">
            </div>
        </div>
    </header>
    <script id="profile-template" type="text/x-handlebars-template">
        <span>欢迎, {{user.username}}</span>
    </script>
    <script>
+       let isRefreshingAccessToken = false;
+       let refreshSubscribers = [];
+       function onRefreshed(newAccessToken) {
+           refreshSubscribers.forEach(callback => callback(newAccessToken));
+           refreshSubscribers = [];
+       }
+       function subscribeTokenRefresh(callback) {
+           refreshSubscribers.push(callback);
+       }
        async function refreshAccessToken() {
+           if (!isRefreshingAccessToken) {
+               isRefreshingAccessToken = true;
+               try {
+                   const response = await fetch(' /api/auth/refresh-token', {
+                       method: 'POST',
+                       headers: { 'Content-Type': 'application/json' },
+                       body: JSON.stringify({
+                           refresh_token: localStorage.getItem('refresh_token')
+                       })
+                   });
+                   const data = await response.json(); if (data.success) {
+                       localStorage.setItem('access_token', data.access_token);
+                       localStorage.setItem('refresh_token', data.refresh_token);
+                       onRefreshed(data.access_token); return true;
+                   } else {
+                       console.error('刷新access_token失败');
+                       window.location.href = '/login.html';
+                       return false;
+                   }
+                   return true;
+               } catch (error) {
+                   console.error('刷新access_token时出错', error);
                    window.location.href = '/login.html';
                    return false;
+               } finally {
+                   isRefreshingAccessToken = false;
                }
            }
        }
        $('body').on('htmx:configRequest', function (event) {
            const accessToken = localStorage.getItem('access_token');
            if (accessToken) {
                event.detail.headers['Authorization'] = `Bearer ${accessToken}`;
            }
        });
        $('#profile-container').on('htmx:afterOnLoad', async function (event) {
            if (event.detail.xhr.status === 401) {
+               if (!isRefreshingAccessToken) {
+                   const success = await refreshAccessToken();
+                   if (success) {
+                       const accessToken = localStorage.getItem('access_token');
+                       fetch(`/api/auth/profile`, { headers: { Authorization: `Bearer ${accessToken}` } })
+                           .then(response => response.json())
+                           .then(data => {
+                               const templateSource = document.getElementById('profile-template').innerHTML;
+                               const template = Handlebars.compile(templateSource);
+                               const html = template({
+                                   user: data.user
+                               });
+                               $('#profile-container').html(html);
+                               htmx.process(document.getElementById('profile-container'));
+                           })
+                           .catch(error => console.error('Error fetching profile:', error));
+                   }
+               } else {
+                   subscribeTokenRefresh((newAccessToken) => {
+                       event.detail.headers['Authorization'] = `Bearer ${newAccessToken}`;
+                       htmx.ajax('GET', event.detail.path, event.target);
+                   });
                }
            }
        });
    </script>
</body>

</html>
5.邮箱登录
5.1. auth.controller.ts
src/api/controllers/auth.controller.ts

import { Controller, Post, Body, Res, Request, Get, UseGuards, Query } from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { UserService } from 'src/shared/services/user.service';
import { UtilityService } from 'src/shared/services/utility.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigurationService } from 'src/shared/services/configuration.service';
import { AuthGuard } from '../guards/auth.guard';
+import { MailService } from 'src/shared/services/mail.service';
+import { RedisService } from 'src/shared/services/redis.service';
@Controller('api/auth')
export class AuthController {
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService,
        private readonly jwtService: JwtService,
        private readonly configurationService: ConfigurationService,
+       private readonly redisService: RedisService,
+       private readonly mailService: MailService,
    ) { }

    @Post('login')
    async login(@Body() body, @Res() res: Response) {
        const { username, password } = body;
        const user = await this.validateUser(username, password);
        if (user) {
            const tokens = this.createJwtTokens(user);
            return res.json({ success: true, ...tokens });
        }
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    private async validateUser(username: string, password: string) {
        const user = await this.userService.findOne({ where: { username }, relations: ['roles', 'roles.accesses'] });
        if (user && await this.utilityService.comparePassword(password, user.password)) {
            return user;
        }
        return null;
    }
    private createJwtTokens(user: any) {
        const access_token = this.jwtService.sign({ id: user.id, username: user.username }, {
            secret: this.configurationService.jwtSecret,
            expiresIn: '30m',
        });
        const refresh_token = this.jwtService.sign({ id: user.id, username: user.username }, {
            secret: this.configurationService.jwtSecret,
            expiresIn: '7d',
        });
        return { access_token, refresh_token };
    }
    @UseGuards(AuthGuard)
    @Get('profile')
    getProfile(@Request() req: ExpressRequest, @Res() res: Response) {
        return res.json({ user: req.user });
    }

    @Post('refresh-token')
    async refreshToken(@Body() body, @Res() res: Response) {
        const { refresh_token } = body;
        try {
            const decoded = this.jwtService.verify(refresh_token, { secret: this.configurationService.jwtSecret });
            const tokens = this.createJwtTokens(decoded);
            return res.json({ success: true, ...tokens });
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Refresh token无效或已过期' });
        }
    }
+   @Post('send-email-code')
+   async sendEmailCode(@Body() body, @Res() res: Response) {
+       const { email } = body;
+       const code = Math.floor(100000 + Math.random() * 900000).toString();
+       await this.redisService.set(email, code, 300);
+       await this.mailService.sendEmail(email, '邮件登录验证码', `您的邮件验证码是 ${code}`, `您的邮件验证码是 <b>${code}</b>`);
+       return res.json({ success: true, message: '邮件验证码已发送' });
+   }
+
+   @Post('login-email-code')
+   async loginWithEmailCode(@Body() body, @Res() res: Response) {
+       const { email, code } = body;
+       const storedCode = await this.redisService.get(email);
+       if (storedCode === code) {
+           const user = await this.userService.findOne({ where: { email }, relations: ['roles', 'roles.accesses'] });
+           if (user) {
+               const tokens = this.createJwtTokens(user);
+               return res.json({ success: true, ...tokens });
+           }
+           return res.status(404).json({ success: false, message: '用户不存在' });
+       }
+       return res.status(400).json({ success: false, message: '邮件验证码错误' });
+   }
}

5.2. login.html
front/login.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
</head>

<body>
    <div class="container">
        <h2 class="mt-5">登录</h2>
        <ul class="nav nav-tabs" id="loginTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <a class="nav-link active" id="password-login-tab" data-bs-toggle="tab" href="#password-login"
                    role="tab" aria-controls="password-login" aria-selected="true">密码登录</a>
            </li>
+           <li class="nav-item" role="presentation">
+               <a class="nav-link" id="email-login-tab" data-bs-toggle="tab" href="#email-login" role="tab"
+                   aria-controls="email-login" aria-selected="false">邮件验证码登录</a>
+           </li>
        </ul>
        <div class="tab-content" id="loginTabContent">
            <div class="tab-pane fade show active" id="password-login" role="tabpanel"
                aria-labelledby="password-login-tab">
                <div class="mt-3">
                    <label for="username" class="form-label">用户名</label>
                    <input type="text" class="form-control" id="username" name="username" required>
                </div>
                <div class="mt-3">
                    <label for="password" class="form-label">密码</label>
                    <input type="password" class="form-control" id="password" name="password" required>
                </div>
                <button id="passwordLoginButton" class="btn btn-primary mt-3" hx-post="/api/auth/login"
                    hx-trigger="click" hx-include="#username,#password" hx-swap="none">登录</button>
            </div>
+           <div class="tab-pane fade" id="email-login" role="tabpanel" aria-labelledby="email-login-tab">
+               <div class="mt-3">
+                   <label for="email" class="form-label">邮箱</label>
+                   <input type="email" class="form-control" id="email" name="email" required>
+               </div>
+               <div class="mt-3">
+                   <button class="btn btn-secondary" id="sendEmailCodeButton" hx-post="/api/auth/send-email-code"
+                       hx-trigger="click" hx-include="#email" hx-swap="none">发送验证码</button>
+               </div>
+               <div class="mt-3">
+                   <label for="code" class="form-label">验证码</label>
+                   <input type="text" class="form-control" id="code" name="code" required>
+               </div>
+               <button id="emailLoginButton" class="btn btn-primary mt-3" hx-post="/api/auth/login-email-code"
+                   hx-trigger="click" hx-include="#email,#code" hx-swap="none">邮件验证码登录</button>
+           </div>
        </div>
        <div id="errorMessage" class="alert alert-danger d-none mt-3"></div>
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div id="toastMessage" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">提示</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body" id="toastBody"></div>
            </div>
        </div>
    </div>
    <script>
        function showToast(message) {
            $('#toastBody').text(message);
            const toast = new bootstrap.Toast(document.getElementById('toastMessage'));
            toast.show();
        }
        function handleLoginResponse(event) {
            const result = JSON.parse(event.detail.xhr.responseText);
            if (result.success) {
                localStorage.setItem('access_token', result.access_token);
                localStorage.setItem('refresh_token', result.refresh_token);
                window.location.href = '/';
            } else {
                showToast(result.message);
            }
        }
        function handleSendCodeResponse(event) {
            const result = JSON.parse(event.detail.xhr.responseText);
            showToast(result.message);
        }
        $(function () {
            $('#passwordLoginButton').on('htmx:afterRequest', handleLoginResponse);
+           $('#sendEmailCodeButton').on('htmx:afterRequest', handleSendCodeResponse);
+           $('#emailLoginButton').on('htmx:afterRequest', handleLoginResponse);
        });
    </script>

</body>

</html>
6.手机号登录
6.1. phone.service.ts
src/shared/services/phone.service.ts

import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigurationService } from './configuration.service';
const tencentcloud = require("tencentcloud-sdk-nodejs")
@Injectable()
export class PhoneService {
    private smsClient: any;

    constructor(
        private readonly redisService: RedisService,
        private readonly configurationService: ConfigurationService
    ) {
        this.smsClient = new tencentcloud.sms.v20210111.Client({
            credential: {
                secretId: this.configurationService.tencentCloudSecretId,
                secretKey: this.configurationService.tencentCloudSecretKey,
            },
            region: this.configurationService.tencentCloudSmsRegion,
        })

    }

    async sendVerificationCode(phone: string): Promise<string> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redisService.set(phone, code, 300);
        const params = {
            SmsSdkAppId: this.configurationService.tencentCloudSmsSdkAppId,
            SignName: this.configurationService.tencentCloudSmsSignName,
            TemplateId: this.configurationService.tencentCloudSmsTemplateId,
            TemplateParamSet: [code, '5'],
            PhoneNumberSet: [`+86${phone}`]
        };
        try {
            const result = await this.smsClient.SendSms(params);
            result.SendStatusSet.forEach((status) => {
                console.log(status);
                if (status.Code !== 'Ok') {
                    throw new Error(`短信发送失败: ${status.Message}`);
                }
            });
            console.log('短信发送成功:', result);
        } catch (error) {
            console.error('发送短信失败:', error);
            throw new Error('发送短信失败');
        }
        return code;
    }

    async verifyCode(phone: string, code: string): Promise<boolean> {
        const storedCode = await this.redisService.get(phone);
        return storedCode === code;
    }
}

6.2. shared.module.ts
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
import { Access } from "./entities/access.entity";
import { AccessService } from "./services/access.service";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { Article } from "./entities/article.entity";
import { ArticleService } from "./services/article.service";
import { Category } from "./entities/category.entity";
import { CategoryService } from "./services/category.service";
import { CosService } from './services/cos.service';
import { NotificationService } from './services/notification.service';
import { MailService } from './services/mail.service';
import { WordExportService } from './services/word-export.service';
import { PptExportService } from './services/ppt-export.service';
import { ExcelExportService } from './services/excel-export.service';
import { SettingService } from './services/setting.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Setting, SettingSchema } from './schemas/setting.schema';
import { DashboardService } from './services/dashboard.service';
import { WeatherService } from './services/weather.service';
import { SystemService } from './services/system.service';
import { RedisService } from './services/redis.service';
+import { PhoneService } from './services/phone.service';
@Global()
@Module({
    providers: [
        IsUsernameUniqueConstraint, ConfigurationService, UtilityService,
        UserService, RoleService, AccessService, TagService, ArticleService,
        CategoryService, CosService, NotificationService, MailService,
        WordExportService, PptExportService, ExcelExportService, SettingService,
+       DashboardService, WeatherService, SystemService, RedisService, PhoneService],
    exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService,
        UserService, RoleService, AccessService, TagService, ArticleService,
        CategoryService, CosService, NotificationService, MailService,
        WordExportService, PptExportService, ExcelExportService, SettingService, DashboardService,
+       WeatherService, SystemService, RedisService, PhoneService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                uri: configurationService.mongodbConfig.uri
            })
        }),
        MongooseModule.forFeature([
            { name: Setting.name, schema: SettingSchema }
        ]),
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
        TypeOrmModule.forFeature([User, Role, Access, Tag, Article, Category])
    ],
})
export class SharedModule {
}

6.3. configuration.service.ts
src/shared/services/configuration.service.ts

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class ConfigurationService {
    constructor(private configService: ConfigService) { }
    get mysqlHost(): string {
        return this.configService.get<string>('MYSQL_HOST');
    }
    get mysqlPort(): number {
        return this.configService.get<number>('MYSQL_PORT');
    }
    get mysqlDB(): string {
        return this.configService.get<string>('MYSQL_DB');
    }
    get mysqlUser(): string {
        return this.configService.get<string>('MYSQL_USER');
    }
    get mysqlPassword(): string {
        return this.configService.get<string>('MYSQL_PASSWORD');
    }
    get mysqlConfig() {
        return {
            host: this.mysqlHost,
            port: this.mysqlPort,
            database: this.mysqlDB,
            username: this.mysqlUser,
            password: this.mysqlPassword
        }
    }
    get cosSecretId(): string {
        return this.configService.get<string>('COS_SECRET_ID');
    }
    get cosSecretKey(): string {
        return this.configService.get<string>('COS_SECRET_KEY');
    }
    get cosBucket(): string {
        return this.configService.get<string>('COS_BUCKET');
    }
    get cosRegion(): string {
        return this.configService.get<string>('COS_REGION');
    }
    get smtpHost(): string {
        return this.configService.get<string>('SMTP_HOST');
    }
    get smtpPort(): string {
        return this.configService.get<string>('SMTP_PORT');
    }
    get smtpUser(): string {
        return this.configService.get<string>('SMTP_USER');
    }
    get smtpPass(): string {
        return this.configService.get<string>('SMTP_PASS');
    }
    get mongodbHost(): string {
        return this.configService.get<string>('MONGO_HOST');
    }
    get mongodbPort(): string {
        return this.configService.get<string>('MONGO_PORT');
    }
    get mongodbDB(): string {
        return this.configService.get<string>('MONGO_DB');
    }
    get mongodbUser(): string {
        return this.configService.get<string>('MONGO_USER');
    }
    get mongodbPassword(): string {
        return this.configService.get<string>('MONGO_PASSWORD');
    }
    get mongodbConfig() {
        return {
            uri: `mongodb://${this.mongodbHost}:${this.mongodbPort}/${this.mongodbDB}`
        }
    }
    get ipApiUrl(): string {
        return this.configService.get<string>('IP_API_URL');
    }
    get weatherApiKey(): string {
        return this.configService.get<string>('WEATHER_API_KEY');
    }
    get weatherApiUrl(): string {
        return this.configService.get<string>('WEATHER_API_URL');
    }
    get redisHost(): string {
        return this.configService.get<string>('REDIS_HOST');
    }
    get redisPort(): number {
        return this.configService.get<number>('REDIS_PORT');
    }
    get redisPassword(): string {
        return this.configService.get<string>('REDIS_PASSWORD');
    }
    get jwtSecret(): string {
        return this.configService.get<string>('JWT_SECRET');
    }
    get expiresIn(): string {
        return this.configService.get<string>('JWT_EXPIRES_IN');
    }
+   get tencentCloudSecretId(): string {
+       return this.configService.get<string>('TENCENTCLOUD_SECRET_ID');
+   }
+   get tencentCloudSecretKey(): string {
+       return this.configService.get<string>('TENCENTCLOUD_SECRET_KEY');
+   }
+   get tencentCloudSmsRegion(): string {
+       return this.configService.get<string>('TENCENTCLOUD_SMS_REGION');
+   }
+   get tencentCloudSmsSdkAppId(): string {
+       return this.configService.get<string>('TENCENTCLOUD_SMS_SDK_APP_ID');
+   }
+   get tencentCloudSmsSignName(): string {
+       return this.configService.get<string>('TENCENTCLOUD_SMS_SIGN_NAME');
+   }
+   get tencentCloudSmsTemplateId(): string {
+       return this.configService.get<string>('TENCENTCLOUD_SMS_TEMPLATE_ID');
+   }
}
6.4. auth.controller.ts
src/api/controllers/auth.controller.ts

import { Controller, Post, Body, Res, Request, Get, UseGuards, Query } from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { UserService } from 'src/shared/services/user.service';
import { UtilityService } from 'src/shared/services/utility.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigurationService } from 'src/shared/services/configuration.service';
import { AuthGuard } from '../guards/auth.guard';
import { MailService } from 'src/shared/services/mail.service';
import { RedisService } from 'src/shared/services/redis.service';
+import { PhoneService } from 'src/shared/services/phone.service';
@Controller('api/auth')
export class AuthController {
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService,
        private readonly jwtService: JwtService,
        private readonly configurationService: ConfigurationService,
        private readonly redisService: RedisService,
        private readonly mailService: MailService,
+       private readonly phoneService: PhoneService
    ) { }

    @Post('login')
    async login(@Body() body, @Res() res: Response) {
        const { username, password } = body;
        const user = await this.validateUser(username, password);
        if (user) {
            const tokens = this.createJwtTokens(user);
            return res.json({ success: true, ...tokens });
        }
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    private async validateUser(username: string, password: string) {
        const user = await this.userService.findOne({ where: { username }, relations: ['roles', 'roles.accesses'] });
        if (user && await this.utilityService.comparePassword(password, user.password)) {
            return user;
        }
        return null;
    }
    private createJwtTokens(user: any) {
        const access_token = this.jwtService.sign({ id: user.id, username: user.username }, {
            secret: this.configurationService.jwtSecret,
            expiresIn: '30m',
        });
        const refresh_token = this.jwtService.sign({ id: user.id, username: user.username }, {
            secret: this.configurationService.jwtSecret,
            expiresIn: '7d',
        });
        return { access_token, refresh_token };
    }
    @UseGuards(AuthGuard)
    @Get('profile')
    getProfile(@Request() req: ExpressRequest, @Res() res: Response) {
        return res.json({ user: req.user });
    }

    @Post('refresh-token')
    async refreshToken(@Body() body, @Res() res: Response) {
        const { refresh_token } = body;
        try {
            const decoded = this.jwtService.verify(refresh_token, { secret: this.configurationService.jwtSecret });
            const tokens = this.createJwtTokens(decoded);
            return res.json({ success: true, ...tokens });
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Refresh token无效或已过期' });
        }
    }
    @Post('send-email-code')
    async sendEmailCode(@Body() body, @Res() res: Response) {
        const { email } = body;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redisService.set(email, code, 300);
        await this.mailService.sendEmail(email, '邮件登录验证码', `您的邮件验证码是 ${code}`, `您的邮件验证码是 <b>${code}</b>`);
        return res.json({ success: true, message: '邮件验证码已发送' });
    }

    @Post('login-email-code')
    async loginWithEmailCode(@Body() body, @Res() res: Response) {
        const { email, code } = body;
        const storedCode = await this.redisService.get(email);
        if (storedCode === code) {
            const user = await this.userService.findOne({ where: { email }, relations: ['roles', 'roles.accesses'] });
            if (user) {
                const tokens = this.createJwtTokens(user);
                return res.json({ success: true, ...tokens });
            }
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        return res.status(400).json({ success: false, message: '邮件验证码错误' });
    }
+
+   @Post('send-phone-code')
+   async sendPhoneCode(@Body() body, @Res() res: Response) {
+       const { phone } = body;
+       try {
+           await this.phoneService.sendVerificationCode(phone);
+           return res.json({ success: true, message: '手机验证码已发送' });
+       } catch (error) {
+           return res.status(500).json({ success: false, message: '发送手机验证码失败' });
+       }
+   }
+
+   @Post('login-phone-code')
+   async loginWithPhoneCode(@Body() body, @Res() res: Response) {
+       const { phone, phoneCode } = body;
+       const isCodeValid = await this.phoneService.verifyCode(phone, phoneCode);
+       if (isCodeValid) {
+           const user = await this.userService.findOne({ where: { mobile: phone }, relations: ['roles', 'roles.accesses'] });
+           if (user) {
+               const tokens = this.createJwtTokens(user);
+               return res.json({ success: true, ...tokens });
+           }
+           return res.status(404).json({ success: false, message: '用户不存在' });
+       }
+       return res.status(400).json({ success: false, message: '手机验证码错误' });
+   }
+
}

6.5. login.html
front/login.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
</head>

<body>
    <div class="container">
        <h2 class="mt-5">登录</h2>
        <ul class="nav nav-tabs" id="loginTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <a class="nav-link active" id="password-login-tab" data-bs-toggle="tab" href="#password-login"
                    role="tab" aria-controls="password-login" aria-selected="true">密码登录</a>
            </li>
            <li class="nav-item" role="presentation">
                <a class="nav-link" id="email-login-tab" data-bs-toggle="tab" href="#email-login" role="tab"
                    aria-controls="email-login" aria-selected="false">邮件验证码登录</a>
            </li>
+           <li class="nav-item" role="presentation">
+               <a class="nav-link" id="phone-login-tab" data-bs-toggle="tab" href="#phone-login" role="tab"
+                   aria-controls="phone-login" aria-selected="false">手机验证码登录</a>
+           </li>
        </ul>
        <div class="tab-content" id="loginTabContent">
            <div class="tab-pane fade show active" id="password-login" role="tabpanel"
                aria-labelledby="password-login-tab">
                <div class="mt-3">
                    <label for="username" class="form-label">用户名</label>
                    <input type="text" class="form-control" id="username" name="username" required>
                </div>
                <div class="mt-3">
                    <label for="password" class="form-label">密码</label>
                    <input type="password" class="form-control" id="password" name="password" required>
                </div>
                <button id="passwordLoginButton" class="btn btn-primary mt-3" hx-post="/api/auth/login"
                    hx-trigger="click" hx-include="#username,#password" hx-swap="none">登录</button>
            </div>
            <div class="tab-pane fade" id="email-login" role="tabpanel" aria-labelledby="email-login-tab">
                <div class="mt-3">
                    <label for="email" class="form-label">邮箱</label>
                    <input type="email" class="form-control" id="email" name="email" required>
                </div>
                <div class="mt-3">
                    <button class="btn btn-secondary" id="sendEmailCodeButton" hx-post="/api/auth/send-email-code"
                        hx-trigger="click" hx-include="#email" hx-swap="none">发送验证码</button>
                </div>
                <div class="mt-3">
                    <label for="code" class="form-label">验证码</label>
                    <input type="text" class="form-control" id="code" name="code" required>
                </div>
                <button id="emailLoginButton" class="btn btn-primary mt-3" hx-post="/api/auth/login-email-code"
                    hx-trigger="click" hx-include="#email,#code" hx-swap="none">邮件验证码登录</button>
            </div>
+           <div class="tab-pane fade" id="phone-login" role="tabpanel" aria-labelledby="phone-login-tab">
+               <div class="mt-3">
+                   <label for="phone" class="form-label">手机号码</label>
+                   <input type="text" class="form-control" id="phone" name="phone" required>
+               </div>
+               <div class="mt-3">
+                   <button class="btn btn-secondary" id="sendPhoneCodeButton" hx-post="/api/auth/send-phone-code"
+                       hx-trigger="click" hx-include="#phone" hx-swap="none">发送验证码</button>
+               </div>
+               <div class="mt-3">
+                   <label for="phoneCode" class="form-label">验证码</label>
+                   <input type="text" class="form-control" id="phoneCode" name="phoneCode" required>
+               </div>
+               <button id="phoneLoginButton" class="btn btn-primary mt-3" hx-post="/api/auth/login-phone-code"
+                   hx-trigger="click" hx-include="#phone,#phoneCode" hx-swap="none">手机验证码登录</button>
+           </div>
        </div>
        <div id="errorMessage" class="alert alert-danger d-none mt-3"></div>
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div id="toastMessage" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">提示</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body" id="toastBody"></div>
            </div>
        </div>
    </div>
    <script>
        function showToast(message) {
            $('#toastBody').text(message);
            const toast = new bootstrap.Toast(document.getElementById('toastMessage'));
            toast.show();
        }
        function handleLoginResponse(event) {
            const result = JSON.parse(event.detail.xhr.responseText);
            if (result.success) {
                localStorage.setItem('access_token', result.access_token);
                localStorage.setItem('refresh_token', result.refresh_token);
                window.location.href = '/';
            } else {
                showToast(result.message);
            }
        }
        function handleSendCodeResponse(event) {
            const result = JSON.parse(event.detail.xhr.responseText);
            showToast(result.message);
        }
        $(function () {
            $('#passwordLoginButton').on('htmx:afterRequest', handleLoginResponse);
            $('#sendEmailCodeButton').on('htmx:afterRequest', handleSendCodeResponse);
            $('#emailLoginButton').on('htmx:afterRequest', handleLoginResponse);
+           $('#sendPhoneCodeButton').on('htmx:afterRequest', handleSendCodeResponse);
+           $('#phoneLoginButton').on('htmx:afterRequest', handleLoginResponse);
        });
    </script>
</body>
</html>
7.扫码登录
7.1. qrcode-status.enum.ts
src/shared/enums/qrcode-status.enum.ts

export enum QrCodeStatusEnum {
    SCANNED = 'scanned',
    AUTHORIZED = 'authorized',
    DENIED = 'denied',
    EXPIRED = 'expired',
    PENDING = 'pending',
}
7.2. utility.service.ts
src/shared/services/utility.service.ts

import { Injectable } from "@nestjs/common";
import * as bcrypt from 'bcrypt'
import * as svgCaptcha from 'svg-captcha';
+import * as os from 'os';
@Injectable()
export class UtilityService {
    async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt();
        return bcrypt.hash(password, salt);
    }
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash)
    }
    generateCaptcha(options) {
        return svgCaptcha.create(options);
    }
+   generateRandomString(length: number = 32): string {
+       const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
+       let result = '';
+       for (let i = 0; i < length; i++) {
+           const randomIndex = Math.floor(Math.random() * chars.length);
+           result += chars[randomIndex];
+       }
+       return result;
+   }
+   getLocalIPAddress() {
+       const networkInterfaces = os.networkInterfaces();
+       for (const interfaceName in networkInterfaces) {
+           const addresses = networkInterfaces[interfaceName];
+           for (const address of addresses) {
+               if (address.family === 'IPv4' && !address.internal) {
+                   return address.address;
+               }
+           }
+       }
+       return '127.0.0.1';
+   }
}
7.3. app_login.html
front/app_login.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App登录</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
</head>

<body>
    <div class="container">
        <h2 class="mt-5">登录</h2>
        <div class="mt-3">
            <label for="username" class="form-label">用户名</label>
            <input type="text" class="form-control" id="username" name="username" required>
        </div>
        <div class="mt-3">
            <label for="password" class="form-label">密码</label>
            <input type="password" class="form-control" id="password" name="password" required>
        </div>
        <button id="loginButton" class="btn btn-primary mt-3" hx-post="/api/auth/login" hx-trigger="click"
            hx-include="#username,#password" hx-target="#errorMessage" hx-swap="innerHTML">登录</button>
        <div id="errorMessage" class="alert alert-danger d-none mt-3"></div>
    </div>
    <script>
        $(function () {
            function handleLoginResponse(event) {
                const result = JSON.parse(event.detail.xhr.responseText);
                if (result.success) {
                    localStorage.setItem('app_access_token', result.access_token);
                    localStorage.setItem('app_refresh_token', result.refresh_token);
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/';
                    window.location.href = redirectUrl;
                } else {
                    $('#errorMessage').removeClass('d-none').text(result.message);
                }
            }
            $('#loginButton').on('htmx:afterRequest', handleLoginResponse);
        });
    </script>
</body>

</html>
7.4. app_authorize.html
front/app_authorize.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>扫码登录确认</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
</head>

<body>
    <div class="container">
        <h2 class="mt-5">当前账号正在尝试登录CMS网页端</h2>
        <div id="authSection" class="mt-3 d-none">
            <p>您是否授权本次登录请求？</p>
            <button id="authorizeButton" class="btn btn-success">授权登录</button>
            <button id="denyButton" class="btn btn-danger">取消</button>
        </div>
        <div id="errorMessage" class="alert alert-danger d-none mt-3"></div>
    </div>
    <script>
        function done(result) {
            if (result.success) {
                window.history.back();
            } else {
                $('#errorMessage').removeClass('d-none').text(result.message);
            }
        }
        function fail(result) {
            $('#errorMessage').removeClass('d-none').text(result.responseJSON.message);
            if (result.responseJSON.message === 'Unauthorized') {
                window.location.href = `/app_login.html?redirect=${encodeURIComponent(window.location.href)}`;
            }
        }
        $(function () {
            const accessToken = localStorage.getItem('app_access_token');
            const token = new URLSearchParams(window.location.search).get('token');
            if (!accessToken) {
                fail();
            } else {
                $('#authSection').removeClass('d-none');
            }
            $('#authorizeButton').click(function () {
                $.post(`/api/auth/qrcode-authorize?token=${token}`, { accessToken })
                    .done(done)
                    .fail(fail);
            });
            $('#denyButton').click(function () {
                $.post(`/api/auth/qrcode-deny?token=${token}`)
                    .done(done)
                    .fail(fail);
            });
        });
    </script>
</body>

</html>
7.5. auth.controller.ts
src/api/controllers/auth.controller.ts

import { Controller, Post, Body, Res, Request, Get, UseGuards, Query } from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { UserService } from 'src/shared/services/user.service';
import { UtilityService } from 'src/shared/services/utility.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigurationService } from 'src/shared/services/configuration.service';
import { AuthGuard } from '../guards/auth.guard';
import { MailService } from 'src/shared/services/mail.service';
import { RedisService } from 'src/shared/services/redis.service';
import { PhoneService } from 'src/shared/services/phone.service';
+import { QrCodeStatusEnum } from 'src/shared/enums/qrcode-status.enum';
+import * as qrcode from 'qrcode';
@Controller('api/auth')
export class AuthController {
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService,
        private readonly jwtService: JwtService,
        private readonly configurationService: ConfigurationService,
        private readonly redisService: RedisService,
        private readonly mailService: MailService,
        private readonly phoneService: PhoneService
    ) { }

    @Post('login')
    async login(@Body() body, @Res() res: Response) {
        const { username, password } = body;
        const user = await this.validateUser(username, password);
        if (user) {
            const tokens = this.createJwtTokens(user);
            return res.json({ success: true, ...tokens });
        }
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    private async validateUser(username: string, password: string) {
        const user = await this.userService.findOne({ where: { username }, relations: ['roles', 'roles.accesses'] });
        if (user && await this.utilityService.comparePassword(password, user.password)) {
            return user;
        }
        return null;
    }
    private createJwtTokens(user: any) {
        const access_token = this.jwtService.sign({ id: user.id, username: user.username }, {
            secret: this.configurationService.jwtSecret,
            expiresIn: '30m',
        });
        const refresh_token = this.jwtService.sign({ id: user.id, username: user.username }, {
            secret: this.configurationService.jwtSecret,
            expiresIn: '7d',
        });
        return { access_token, refresh_token };
    }
    @UseGuards(AuthGuard)
    @Get('profile')
    getProfile(@Request() req: ExpressRequest, @Res() res: Response) {
        return res.json({ user: req.user });
    }

    @Post('refresh-token')
    async refreshToken(@Body() body, @Res() res: Response) {
        const { refresh_token } = body;
        try {
            const decoded = this.jwtService.verify(refresh_token, { secret: this.configurationService.jwtSecret });
            const tokens = this.createJwtTokens(decoded);
            return res.json({ success: true, ...tokens });
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Refresh token无效或已过期' });
        }
    }
    @Post('send-email-code')
    async sendEmailCode(@Body() body, @Res() res: Response) {
        const { email } = body;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redisService.set(email, code, 300);
        await this.mailService.sendEmail(email, '邮件登录验证码', `您的邮件验证码是 ${code}`, `您的邮件验证码是 <b>${code}</b>`);
        return res.json({ success: true, message: '邮件验证码已发送' });
    }

    @Post('login-email-code')
    async loginWithEmailCode(@Body() body, @Res() res: Response) {
        const { email, code } = body;
        const storedCode = await this.redisService.get(email);
        if (storedCode === code) {
            const user = await this.userService.findOne({ where: { email }, relations: ['roles', 'roles.accesses'] });
            if (user) {
                const tokens = this.createJwtTokens(user);
                return res.json({ success: true, ...tokens });
            }
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        return res.status(400).json({ success: false, message: '邮件验证码错误' });
    }

    @Post('send-phone-code')
    async sendPhoneCode(@Body() body, @Res() res: Response) {
        const { phone } = body;
        try {
            await this.phoneService.sendVerificationCode(phone);
            return res.json({ success: true, message: '手机验证码已发送' });
        } catch (error) {
            return res.status(500).json({ success: false, message: '发送手机验证码失败' });
        }
    }

    @Post('login-phone-code')
    async loginWithPhoneCode(@Body() body, @Res() res: Response) {
        const { phone, phoneCode } = body;
        const isCodeValid = await this.phoneService.verifyCode(phone, phoneCode);
        if (isCodeValid) {
            const user = await this.userService.findOne({ where: { mobile: phone }, relations: ['roles', 'roles.accesses'] });
            if (user) {
                const tokens = this.createJwtTokens(user);
                return res.json({ success: true, ...tokens });
            }
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        return res.status(400).json({ success: false, message: '手机验证码错误' });
    }
+   @Get('qrcode')
+   async generateQrCode(@Res() res: Response) {
+       const token = this.utilityService.generateRandomString();
+       await this.redisService.set(`qrcode_login:${token}`, QrCodeStatusEnum.PENDING, 300);
+       const qrCodeUrl = `http://${this.utilityService.getLocalIPAddress()}:3000/api/auth/qrcode-scan?token=${token}`;
+       console.log(qrCodeUrl);
+       const qrCode = await qrcode.toDataURL(qrCodeUrl);
+       return res.json({ qrCode, token });
+   }
+
+   @Get('qrcode-scan')
+   async handleQrCodeScan(@Query('token') token: string, @Res() res: Response) {
+       await this.redisService.set(`qrcode_login:${token}`, QrCodeStatusEnum.SCANNED, 300);
+       return res.redirect(`/app_authorize.html?token=${token}`);
+   }
+
+   @Post('qrcode-authorize')
+   async authorizeQrCode(@Query('token') token: string, @Body('accessToken') accessToken: string, @Res() res: Response) {
+       const currentStatus = await this.redisService.get(`qrcode_login:${token}`);
+       if (currentStatus !== QrCodeStatusEnum.SCANNED) {
+           return res.status(400).json({ success: false, message: '二维码未被扫描或已过期，无法授权' });
+       }
+       if (!accessToken) {
+           return res.status(400).json({ success: false, message: 'Token未提供' });
+       }
+       try {
+           const decodedUser = this.jwtService.verify(accessToken, { secret: this.configurationService.jwtSecret });
+           await this.redisService.set(`qrcode_login:${token}`, QrCodeStatusEnum.AUTHORIZED, 300);
+           await this.redisService.set(`qrcode_login_user:${token}`, decodedUser.id, 300);
+           return res.json({ success: true, message: '授权成功' });
+       } catch (error) {
+           return res.status(400).json({ success: false, message: 'Unauthorized' });
+       }
+   }
+
+   @Post('qrcode-deny')
+   async denyQrCode(@Query('token') token: string, @Res() res: Response) {
+       await this.redisService.set(`qrcode_login:${token}`, QrCodeStatusEnum.DENIED, 300);
+       return res.json({ success: true, message: '授权已拒绝' });
+   }
+
+   @Get('check-qrcode-status')
+   async checkQrCodeStatus(@Query('token') token: string, @Res() res: Response) {
+       const status = await this.redisService.get(`qrcode_login:${token}`);
+       if (!status) {
+           return res.json({ status: QrCodeStatusEnum.EXPIRED });
+       }
+       if (status === QrCodeStatusEnum.AUTHORIZED) {
+           const userId = await this.redisService.get(`qrcode_login_user:${token}`);
+           const user = await this.userService.findOne({ where: { id: Number(userId) } });
+           if (!user) {
+               return res.status(404).json({ status: 'error', message: '用户不存在' });
+           }
+           const tokens = this.createJwtTokens(user);
+           return res.json({ status: QrCodeStatusEnum.AUTHORIZED, ...tokens });
+       }
+       return res.json({ status });
+   }

}

7.6. login.html
front/login.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
</head>

<body>
    <div class="container">
        <h2 class="mt-5">登录</h2>
        <ul class="nav nav-tabs" id="loginTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <a class="nav-link active" id="password-login-tab" data-bs-toggle="tab" href="#password-login"
                    role="tab" aria-controls="password-login" aria-selected="true">密码登录</a>
            </li>
            <li class="nav-item" role="presentation">
                <a class="nav-link" id="email-login-tab" data-bs-toggle="tab" href="#email-login" role="tab"
                    aria-controls="email-login" aria-selected="false">邮件验证码登录</a>
            </li>
            <li class="nav-item" role="presentation">
                <a class="nav-link" id="phone-login-tab" data-bs-toggle="tab" href="#phone-login" role="tab"
                    aria-controls="phone-login" aria-selected="false">手机验证码登录</a>
            </li>
+           <li class="nav-item" role="presentation">
+               <a class="nav-link" id="qrcode-login-tab" data-bs-toggle="tab" href="#qrcode-login" role="tab"
+                   aria-controls="qrcode-login" aria-selected="false">扫码登录</a>
+           </li>
        </ul>
        <div class="tab-content" id="loginTabContent">
            <div class="tab-pane fade show active" id="password-login" role="tabpanel"
                aria-labelledby="password-login-tab">
                <div class="mt-3">
                    <label for="username" class="form-label">用户名</label>
                    <input type="text" class="form-control" id="username" name="username" required>
                </div>
                <div class="mt-3">
                    <label for="password" class="form-label">密码</label>
                    <input type="password" class="form-control" id="password" name="password" required>
                </div>
                <button id="passwordLoginButton" class="btn btn-primary mt-3" hx-post="/api/auth/login"
                    hx-trigger="click" hx-include="#username,#password" hx-swap="none">登录</button>
            </div>
            <div class="tab-pane fade" id="email-login" role="tabpanel" aria-labelledby="email-login-tab">
                <div class="mt-3">
                    <label for="email" class="form-label">邮箱</label>
                    <input type="email" class="form-control" id="email" name="email" required>
                </div>
                <div class="mt-3">
                    <button class="btn btn-secondary" id="sendEmailCodeButton" hx-post="/api/auth/send-email-code"
                        hx-trigger="click" hx-include="#email" hx-swap="none">发送验证码</button>
                </div>
                <div class="mt-3">
                    <label for="code" class="form-label">验证码</label>
                    <input type="text" class="form-control" id="code" name="code" required>
                </div>
                <button id="emailLoginButton" class="btn btn-primary mt-3" hx-post="/api/auth/login-email-code"
                    hx-trigger="click" hx-include="#email,#code" hx-swap="none">邮件验证码登录</button>
            </div>
            <div class="tab-pane fade" id="phone-login" role="tabpanel" aria-labelledby="phone-login-tab">
                <div class="mt-3">
                    <label for="phone" class="form-label">手机号码</label>
                    <input type="text" class="form-control" id="phone" name="phone" required>
                </div>
                <div class="mt-3">
                    <button class="btn btn-secondary" id="sendPhoneCodeButton" hx-post="/api/auth/send-phone-code"
                        hx-trigger="click" hx-include="#phone" hx-swap="none">发送验证码</button>
                </div>
                <div class="mt-3">
                    <label for="phoneCode" class="form-label">验证码</label>
                    <input type="text" class="form-control" id="phoneCode" name="phoneCode" required>
                </div>
                <button id="phoneLoginButton" class="btn btn-primary mt-3" hx-post="/api/auth/login-phone-code"
                    hx-trigger="click" hx-include="#phone,#phoneCode" hx-swap="none">手机验证码登录</button>
            </div>
+           <div class="tab-pane fade" id="qrcode-login" role="tabpanel" aria-labelledby="qrcode-login-tab">
+               <div class="mt-3 text-center">
+                   <p>请使用手机扫码登录</p>
+                   <div class="mt-3 text-center position-relative"
+                       style="width: 200px; height: 200px; margin: 0 auto; cursor: pointer;">
+                       <img id="qrcode" src="" alt="QR Code" style="width: 100%; height: 100%;">
+                       <p id="qrcodeStatus" class="position-absolute top-50 start-50 translate-middle"></p>
+                   </div>
+               </div>
+           </div>
        </div>
        <div id="errorMessage" class="alert alert-danger d-none mt-3"></div>
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div id="toastMessage" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">提示</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body" id="toastBody"></div>
            </div>
        </div>
    </div>
    <script>
        function showToast(message) {
            $('#toastBody').text(message);
            const toast = new bootstrap.Toast(document.getElementById('toastMessage'));
            toast.show();
        }
        function handleLoginResponse(event) {
            const result = JSON.parse(event.detail.xhr.responseText);
            if (result.success) {
                localStorage.setItem('access_token', result.access_token);
                localStorage.setItem('refresh_token', result.refresh_token);
                window.location.href = '/';
            } else {
                showToast(result.message);
            }
        }
        function handleSendCodeResponse(event) {
            const result = JSON.parse(event.detail.xhr.responseText);
            showToast(result.message);
        }
        $(function () {
            $('#passwordLoginButton').on('htmx:afterRequest', handleLoginResponse);
            $('#sendEmailCodeButton').on('htmx:afterRequest', handleSendCodeResponse);
            $('#emailLoginButton').on('htmx:afterRequest', handleLoginResponse);
            $('#sendPhoneCodeButton').on('htmx:afterRequest', handleSendCodeResponse);
            $('#phoneLoginButton').on('htmx:afterRequest', handleLoginResponse);
        });
    </script>
+   <script>
+       $(function () {
+           let interval;
+
+           function fetchQrCode() {
+               if (interval) clearInterval(interval);
+               $.get('/api/auth/qrcode', function (data) {
+                   $('#qrcode').attr('src', data.qrCode).css('opacity', 1);
+                   $('#qrcodeStatus').text('');
+                   pollLoginStatus(data.token);
+               });
+           }
+
+           function pollLoginStatus(token) {
+               interval = setInterval(function () {
+                   $.get(`/api/auth/check-qrcode-status?token=${token}`, handleQrCodeResponse);
+               }, 1000);
+           }

+           function handleQrCodeResponse({ status, access_token, refresh_token }) {
+               const statusMessages = {
+                   'scanned': '已扫描，等待确认',
+                   'authorized': '登录成功',
+                   'denied': '取消授权',
+                   'expired': '二维码已过期, 点击刷新',
+               };
+               $('#qrcodeStatus').text(statusMessages[status] || '');
+               if (status !== 'pending') $('#qrcode').css('opacity', .1);
+               if (status === 'authorized') {
+                   localStorage.setItem('access_token', access_token);
+                   localStorage.setItem('refresh_token', refresh_token);
+                   clearInterval(interval);
+               } else if (['expired', 'denied'].includes(status)) {
+                   clearInterval(interval);
+               }
+           }
+
+           $('#qrcode-login-tab').on('shown.bs.tab', fetchQrCode);
+           $('#qrcode').click(fetchQrCode);
+       });
+   </script>
</body>

</html>
8.分类和文章
8.1. category.controller.ts
src/api/controllers/category.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from 'src/shared/services/category.service';

@Controller('api/categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Get()
    async getCategories(@Query('selectedCategory') selectedCategory: string = '') {
        const categories = await this.categoryService.findList();
        return { categories, selectedCategory };
    }
}

8.2. api.module.ts
src/api/api.module.ts

import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
+import { CategoryController } from './controllers/category.controller';
+import { ArticleController } from './controllers/article.controller';
@Module({
  imports: [
    JwtModule.register({
      global: true,
      signOptions: { expiresIn: '7d' }
    }),
  ],
+ controllers: [UserController, AuthController, CategoryController, ArticleController]
})
export class ApiModule { }

8.3. article.controller.ts
src/api/controllers/article.controller.ts

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ArticleService } from 'src/shared/services/article.service';

@Controller('api/articles')
export class ArticleController {
    constructor(
        private readonly articleService: ArticleService,
    ) { }

    @Get()
    async getArticles(
        @Query('categoryId') categoryId: string = '',
        @Query('tagId') tagId: string = '',
        @Query('keyword') keyword: string = '',
    ) {
        const articles = await this.articleService.findList(
            keyword,
            categoryId,
            tagId
        );
        return {
            keyword,
            categoryId,
            tagId,
            articles
        };
    }
}

8.4. category.service.ts
src/shared/services/category.service.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "../entities/category.entity";
import { Repository, Like } from 'typeorm';
import { MySQLBaseService } from "./mysql-base.service";
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { TreeRepository, UpdateResult } from 'typeorm';
@Injectable()
export class CategoryService extends MySQLBaseService<Category> {
  constructor(
    @InjectRepository(Category) protected repository: TreeRepository<Category>
  ) {
    super(repository);
  }
+ async findList() {
+   const categories = await this.repository.find({ relations: ['children', 'parent'] });
+   return categories;
+ }
  async findAll() {
    const categoryTree = await this.repository.findTrees({ relations: ['children', 'parent'] });
    return categoryTree.filter(category => !category.parent);
  }
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { parentId, ...dto } = createCategoryDto;
    const category = this.repository.create(dto);
    if (parentId) {
      category.parent = await this.repository.findOneBy({ id: parentId });
    }
    await this.repository.save(category);
    return this.findOne({ where: { id: category.id } });
  }
  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const { parentId, ...dto } = updateCategoryDto;
    const category = await this.repository.findOneBy({ id });
    if (!category) throw new Error('Category not found');
    Object.assign(category, dto);
    if (parentId) {
      category.parent = await this.repository.findOneBy({ id: parentId });
    }
    await this.repository.save(category);
    return UpdateResult.from({ raw: [], affected: 1, records: [] });
  }
}

8.5. article.service.ts
src/shared/services/article.service.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Article } from "../entities/article.entity";
import { Repository, Like, In, UpdateResult } from 'typeorm';
import { MySQLBaseService } from "./mysql-base.service";
import { CreateArticleDto, UpdateArticleDto } from "../dto/article.dto";
import { Category } from "../entities/category.entity";
import { Tag } from "../entities/tag.entity";
import { ArticleStateEnum } from "../enums/article.enum";
@Injectable()
export class ArticleService extends MySQLBaseService<Article> {
  constructor(
    @InjectRepository(Article) protected repository: Repository<Article>,
    @InjectRepository(Category) protected categoryRepository: Repository<Category>,
    @InjectRepository(Tag) protected tagRepository: Repository<Tag>,
  ) {
    super(repository);
  }
+ async findList(keyword?: string, categoryId?: string, tagId?: string) {
+   const queryBuilder = this.repository.createQueryBuilder('article')
+     .leftJoinAndSelect('article.categories', 'category')
+     .leftJoinAndSelect('article.tags', 'tag');
+   if (keyword) {
+     queryBuilder.where('article.title LIKE :keyword', { keyword: `%${keyword}%` });
+   }
+   if (categoryId) {
+     queryBuilder.andWhere('category.id = :categoryId', { categoryId: Number(categoryId) });
+   }
+   if (tagId) {
+     queryBuilder.andWhere('tag.id = :tagId', { tagId: Number(tagId) });
+   }
+   const articles = await queryBuilder.getMany();
+   return articles;
+
+   const where = keyword ? [
+     { title: Like(`%${keyword}%`) },
+     { content: Like(`%${keyword}%`) }
+   ] : {};
+   return this.repository.find({ where, relations: ['categories', 'tags'], });
+ }
  async findAll(keyword?: string) {
    const where = keyword ? [
      { title: Like(`%${keyword}%`) },
      { content: Like(`%${keyword}%`) }
    ] : {};
    return this.repository.find({ where, relations: ['categories', 'tags'], });
  }
  async findAllWithPagination(page: number, limit: number, keyword?: string) {
    const where = keyword ? [
      { title: Like(`%${keyword}%`) },
      { content: Like(`%${keyword}%`) }
    ] : {};
    const [articles, total] = await this.repository.findAndCount({
      where,
      relations: ['categories', 'tags'],
      skip: (page - 1) * limit,
      take: limit
    });
    return { articles, total };
  }
  async create(createArticleDto: CreateArticleDto) {
    createArticleDto.state = ArticleStateEnum.DRAFT;
    const { categoryIds, tagIds, ...articleDto } = createArticleDto;
    const article = this.repository.create(articleDto);
    if (categoryIds) {
      article.categories = await this.categoryRepository.findBy({ id: In(categoryIds) })
    }
    if (tagIds) {
      article.tags = await this.tagRepository.findBy({ id: In(tagIds) })
    }
    return await this.repository.save(article);
  }
  async update(id: number, updateArticleDto: UpdateArticleDto) {
    const { categoryIds, tagIds, ...articleDto } = updateArticleDto;
    const article = await this.repository.findOne({ where: { id }, relations: ['categories', 'tags'] });
    if (article.state === ArticleStateEnum.REJECTED || article.state === ArticleStateEnum.WITHDRAWN) {
      article.state = ArticleStateEnum.DRAFT;
    }
    if (!article) throw new NotFoundException('Article not Found');
    Object.assign(article, articleDto);
    if (categoryIds) {
      article.categories = await this.categoryRepository.findBy({ id: In(categoryIds) })
    }
    if (tagIds) {
      article.tags = await this.tagRepository.findBy({ id: In(tagIds) })
    }
    await this.repository.save(article);
    return UpdateResult.from({ affected: 1, records: [], raw: [] });
  }
}

8.6. index.html
front/index.html

+<!doctype html>
<html lang="en">

<head>
+   <meta charset="UTF-8" />
+   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CMS首页</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
+   <link href="/style/bootstrap-icons.min.css" rel="stylesheet" />
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
    <script src="/js/handlebars.min.js"></script>
    <script src="/js/client-side-templates.js"></script>
</head>

<body>
    <header class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">CMS首页</a>
            <div id="profile-container" class="d-flex" hx-get="/api/auth/profile" hx-trigger="load"
+               hx-ext="client-side-templates" handlebars-template="profile-template" hx-swap="innerHTML"></div>
        </div>
    </header>
+   <div id="categories-container" class="container mb-3" hx-get="/api/categories" hx-trigger="load"
+       hx-ext="client-side-templates" handlebars-template="categories-template" hx-swap="innerHTML"
+       hx-vals="javascript:{selectedCategory:localStorage.getItem('selectedCategory')??''}"></div>
+   <div class="container" id="article-list" hx-trigger="load" hx-get="/api/articles" hx-ext="client-side-templates"
+       handlebars-template="article-list-template" hx-swap="innerHTML"></div>
    <script id="profile-template" type="text/x-handlebars-template">
+     <span>欢迎, {{user.username}}</span>
+   </script>
+   <script id="categories-template" type="text/x-handlebars-template">
+     <ul class="nav nav-pills">
+         <li class="nav-item">
+             <a onclick="setSelectedCategory('')"
+             class="nav-link {{#if (eq selectedCategory '')}}active{{/if}}"
+             href="#" hx-get="/api/articles?categoryId="
+             hx-target="#article-list"
+             hx-ext="client-side-templates"
+             handlebars-template="article-list-template"
+             hx-swap="innerHTML">全部</a>
+         </li>
+         {{#each categories}}
+             <li class="nav-item">
+                 <a onclick="setSelectedCategory('{{id}}')"  class="nav-link {{#if (eq ../selectedCategory this.id)}}active{{/if}}" href="#" hx-get="/api/articles?categoryId={{id}}" hx-target="#article-list"  hx-ext="client-side-templates" handlebars-template="article-list-template" hx-swap="innerHTML">{{name}}</a>
+             </li>
+         {{/each}}
+     </ul>
+   </script>
+   <script id="article-list-template" type="text/x-handlebars-template">
+     <ul class='list-group'>
+       {{#each articles}}
+         <li class='list-group-item'>
+           <h5><a href='/article.html?id={{id}}'>{{title}}</a></h5>
+           <p>分类:
+             {{#each categories}}
+               <a
+                 onclick="setSelectedCategory('{{id}}')"
+                 href='#'
+                 hx-get='/api/articles?categoryId={{id}}'
+                 hx-vals="javascript:{keyword:document.getElementById('search-keyword').value}"
+                 hx-target='#article-list'
+               >{{name}}</a>
+             {{/each}}
+           </p>
+           <p>标签:
+             {{#each tags}}
+               <a
+                 onclick="setSelectedTag('{{id}}')"
+                 href='#'
+                 hx-get='/api/articles?tagId={{id}}'
+                 hx-vals="javascript:{keyword:document.getElementById('search-keyword').value}"
+                 hx-target='#article-list'
+               >{{name}}</a>
+             {{/each}}
+           </p>
+         </li>
+       {{/each}}
+     </ul>
+   </script>
+   <script>
+       Handlebars.registerHelper('eq', function (a, b) {
+           return a == b;
+       });
+       function setSelectedCategory(categoryId) {
+           localStorage.setItem('selectedCategory', categoryId);
+           fetch(`/api/categories?selectedCategory=${categoryId}`)
+               .then((response) => response.json())
+               .then((data) => {
+                   const templateSource = document.getElementById(
+                       'categories-template',
+                   ).innerHTML;
+                   const template = Handlebars.compile(templateSource);
+                   const html = template({
+                       categories: data.categories,
+                       selectedCategory: categoryId,
+                   });
+                   document.getElementById('categories-container').innerHTML = html;
+                   htmx.process(document.getElementById('categories-container'));
+               })
+               .catch((error) => console.error('Error fetching categories:', error));
+       }
    </script>
    <script>
        let isRefreshingAccessToken = false;
        let refreshSubscribers = [];
        function onRefreshed(newAccessToken) {
+           refreshSubscribers.forEach((callback) => callback(newAccessToken));
            refreshSubscribers = [];
        }
        function subscribeTokenRefresh(callback) {
            refreshSubscribers.push(callback);
        }
        async function refreshAccessToken() {
            if (!isRefreshingAccessToken) {
                isRefreshingAccessToken = true;
                try {
                    const response = await fetch(' /api/auth/refresh-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
+                           refresh_token: localStorage.getItem('refresh_token'),
+                       }),
                    });
+                   const data = await response.json();
+                   if (data.success) {
                        localStorage.setItem('access_token', data.access_token);
                        localStorage.setItem('refresh_token', data.refresh_token);
+                       onRefreshed(data.access_token);
+                       return true;
                    } else {
                        console.error('刷新access_token失败');
                        window.location.href = '/login.html';
                        return false;
                    }
                    return true;
                } catch (error) {
                    console.error('刷新access_token时出错', error);
                    window.location.href = '/login.html';
                    return false;
                } finally {
                    isRefreshingAccessToken = false;
                }
            }
        }
        $('body').on('htmx:configRequest', function (event) {
            const accessToken = localStorage.getItem('access_token');
            if (accessToken) {
                event.detail.headers['Authorization'] = `Bearer ${accessToken}`;
            }
        });
        $('#profile-container').on('htmx:afterOnLoad', async function (event) {
            if (event.detail.xhr.status === 401) {
                if (!isRefreshingAccessToken) {
                    const success = await refreshAccessToken();
                    if (success) {
                        const accessToken = localStorage.getItem('access_token');
+                       fetch(`/api/auth/profile`, {
+                           headers: { Authorization: `Bearer ${accessToken}` },
+                       })
+                           .then((response) => response.json())
+                           .then((data) => {
+                               const templateSource =
+                                   document.getElementById('profile-template').innerHTML;
                                const template = Handlebars.compile(templateSource);
                                const html = template({
+                                   user: data.user,
                                });
                                $('#profile-container').html(html);
                                htmx.process(document.getElementById('profile-container'));
                            })
+                           .catch((error) =>
+                               console.error('Error fetching profile:', error),
+                           );
                    }
                } else {
                    subscribeTokenRefresh((newAccessToken) => {
+                       event.detail.headers['Authorization'] =
+                           `Bearer ${newAccessToken}`;
                        htmx.ajax('GET', event.detail.path, event.target);
                    });
                }
            }
        });
    </script>
</body>

</html>
9.标签和搜索
9.1. tag.controller.ts
src/api/controllers/tag.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { TagService } from 'src/shared/services/tag.service';

@Controller('api/tags')
export class TagController {
    constructor(private readonly tagService: TagService) { }

    @Get()
    async getTags(@Query('selectedTag') selectedTag: string = '') {
        const tags = await this.tagService.findAll();
        return { tags, selectedTag };
    }
}

9.2. api.module.ts
src/api/api.module.ts

import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { CategoryController } from './controllers/category.controller';
import { ArticleController } from './controllers/article.controller';
+import { TagController } from './controllers/tag.controller';
@Module({
  imports: [
    JwtModule.register({
      global: true,
      signOptions: { expiresIn: '7d' }
    }),
  ],
+ controllers: [UserController, AuthController, CategoryController, ArticleController, TagController]
})
export class ApiModule { }

9.3. index.html
front/index.html

<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CMS首页</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet" />
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
    <script src="/js/handlebars.min.js"></script>
    <script src="/js/client-side-templates.js"></script>
</head>

<body>
    <header class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">CMS首页</a>
            <div id="profile-container" class="d-flex" hx-get="/api/auth/profile" hx-trigger="load"
                hx-ext="client-side-templates" handlebars-template="profile-template" hx-swap="innerHTML"></div>
        </div>
    </header>
    <div id="categories-container" class="container mb-3" hx-get="/api/categories" hx-trigger="load"
        hx-ext="client-side-templates" handlebars-template="categories-template" hx-swap="innerHTML"
        hx-vals="javascript:{selectedCategory:localStorage.getItem('selectedCategory')??''}"></div>
+   <div id="tags" class="container mb-3" hx-get="/api/tags" hx-trigger="load" hx-ext="client-side-templates"
+       handlebars-template="tags-template" hx-swap="innerHTML"
+       hx-vals="javascript:{selectedTag:localStorage.getItem('selectedTag')??''}"></div>
+   <div class="container mb-3">
+       <input id="search-keyword" class="form-control" placeholder="搜索文章..." hx-get="/api/articles"
+           hx-target="#article-list" hx-trigger="keyup"
+           hx-vals="javascript:{keyword:document.getElementById('search-keyword').value}"
+           hx-ext="client-side-templates" handlebars-template="article-list-template" hx-swap="innerHTML">
+   </div>
    <div class="container" id="article-list" hx-trigger="load" hx-get="/api/articles" hx-ext="client-side-templates"
        handlebars-template="article-list-template" hx-swap="innerHTML"></div>
    <script id="profile-template" type="text/x-handlebars-template">
      <span>欢迎, {{user.username}}</span>
    </script>
    <script id="categories-template" type="text/x-handlebars-template">
      <ul class="nav nav-pills">
          <li class="nav-item">
              <a onclick="setSelectedCategory('')"
              class="nav-link {{#if (eq selectedCategory '')}}active{{/if}}"
              href="#" hx-get="/api/articles?categoryId="
              hx-target="#article-list"
              hx-ext="client-side-templates"
              handlebars-template="article-list-template"
+             hx-vals="javascript:{keyword:document.getElementById('search-keyword').value}"
              hx-swap="innerHTML">全部</a>
          </li>
          {{#each categories}}
              <li class="nav-item">
+                 <a onclick="setSelectedCategory('{{id}}')" 
+                  hx-vals="javascript:{keyword:document.getElementById('search-keyword').value}"
+                  class="nav-link {{#if (eq ../selectedCategory this.id)}}active{{/if}}" href="#" hx-get="/api/articles?categoryId={{id}}" hx-target="#article-list"  hx-ext="client-side-templates" handlebars-template="article-list-template" hx-swap="innerHTML">{{name}}</a>
              </li>
          {{/each}}
      </ul>
    </script>
+   <script id="tags-template" type="text/x-handlebars-template">
+               <ul class="nav nav-pills">
+                   <li class="nav-item">
+                       <a onclick="setSelectedTag('')" class="nav-link {{#if (eq selectedTag '')}}active{{/if}}" href="#" hx-get="/api/articles?tagId=" hx-target="#article-list" hx-vals="javascript:{keyword:document.getElementById('search-keyword').value}" hx-ext="client-side-templates" handlebars-template="article-list-template" hx-swap="innerHTML">全部</a>
+                   </li>
+                   {{#each tags}}
+                       <li class="nav-item">
+                           <a onclick="setSelectedTag('{{id}}')" class="nav-link {{#if (eq ../selectedTag this.id)}}active{{/if}}" href="#" hx-get="/api/articles?tagId={{id}}" hx-target="#article-list" hx-vals="javascript:{keyword:document.getElementById('search-keyword').value}" hx-ext="client-side-templates" handlebars-template="article-list-template" hx-swap="innerHTML">{{name}}</a>
+                       </li>
+                   {{/each}}
+               </ul>
+           </script>
    <script id="article-list-template" type="text/x-handlebars-template">
      <ul class='list-group'>
        {{#each articles}}
          <li class='list-group-item'>
            <h5><a href='/article.html?id={{id}}'>{{title}}</a></h5>
            <p>分类:
              {{#each categories}}
                <a
                  onclick="setSelectedCategory('{{id}}')"
                  href='#'
                  hx-get='/api/articles?categoryId={{id}}'
                  hx-vals="javascript:{keyword:document.getElementById('search-keyword').value}"
                  hx-target='#article-list'
                >{{name}}</a>
              {{/each}}
            </p>
            <p>标签:
              {{#each tags}}
                <a
                  onclick="setSelectedTag('{{id}}')"
                  href='#'
                  hx-get='/api/articles?tagId={{id}}'
                  hx-vals="javascript:{keyword:document.getElementById('search-keyword').value}"
                  hx-target='#article-list'
                >{{name}}</a>
              {{/each}}
            </p>
          </li>
        {{/each}}
      </ul>
    </script>
    <script>
        Handlebars.registerHelper('eq', function (a, b) {
            return a == b;
        });
        function setSelectedCategory(categoryId) {
            localStorage.setItem('selectedCategory', categoryId);
            fetch(`/api/categories?selectedCategory=${categoryId}`)
                .then((response) => response.json())
                .then((data) => {
                    const templateSource = document.getElementById(
                        'categories-template',
                    ).innerHTML;
                    const template = Handlebars.compile(templateSource);
                    const html = template({
                        categories: data.categories,
                        selectedCategory: categoryId,
                    });
                    document.getElementById('categories-container').innerHTML = html;
                    htmx.process(document.getElementById('categories-container'));
                })
                .catch((error) => console.error('Error fetching categories:', error));
        }
+       function setSelectedTag(tagId) {
+           localStorage.setItem('selectedTag', tagId);
+           fetch(`/api/tags?selectedTag=${tagId}`)
+               .then(response => response.json())
+               .then(data => {
+                   const templateSource = document.getElementById('tags-template').innerHTML;
+                   const template = Handlebars.compile(templateSource);
+                   const html = template({
+                       tags: data.tags,
+                       selectedTag: tagId
+                   });
+                   document.getElementById('tags').innerHTML = html;
+                   htmx.process(document.getElementById('tags'));
+               })
+               .catch(error => console.error('Error fetching tags:', error));
+       }
    </script>
    <script>
        let isRefreshingAccessToken = false;
        let refreshSubscribers = [];
        function onRefreshed(newAccessToken) {
            refreshSubscribers.forEach((callback) => callback(newAccessToken));
            refreshSubscribers = [];
        }
        function subscribeTokenRefresh(callback) {
            refreshSubscribers.push(callback);
        }
        async function refreshAccessToken() {
            if (!isRefreshingAccessToken) {
                isRefreshingAccessToken = true;
                try {
                    const response = await fetch(' /api/auth/refresh-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            refresh_token: localStorage.getItem('refresh_token'),
                        }),
                    });
                    const data = await response.json();
                    if (data.success) {
                        localStorage.setItem('access_token', data.access_token);
                        localStorage.setItem('refresh_token', data.refresh_token);
                        onRefreshed(data.access_token);
                        return true;
                    } else {
                        console.error('刷新access_token失败');
                        window.location.href = '/login.html';
                        return false;
                    }
                    return true;
                } catch (error) {
                    console.error('刷新access_token时出错', error);
                    window.location.href = '/login.html';
                    return false;
                } finally {
                    isRefreshingAccessToken = false;
                }
            }
        }
        $('body').on('htmx:configRequest', function (event) {
            const accessToken = localStorage.getItem('access_token');
            if (accessToken) {
                event.detail.headers['Authorization'] = `Bearer ${accessToken}`;
            }
        });
        $('#profile-container').on('htmx:afterOnLoad', async function (event) {
            if (event.detail.xhr.status === 401) {
                if (!isRefreshingAccessToken) {
                    const success = await refreshAccessToken();
                    if (success) {
                        const accessToken = localStorage.getItem('access_token');
                        fetch(`/api/auth/profile`, {
                            headers: { Authorization: `Bearer ${accessToken}` },
                        })
                            .then((response) => response.json())
                            .then((data) => {
                                const templateSource =
                                    document.getElementById('profile-template').innerHTML;
                                const template = Handlebars.compile(templateSource);
                                const html = template({
                                    user: data.user,
                                });
                                $('#profile-container').html(html);
                                htmx.process(document.getElementById('profile-container'));
                            })
                            .catch((error) =>
                                console.error('Error fetching profile:', error),
                            );
                    }
                } else {
                    subscribeTokenRefresh((newAccessToken) => {
                        event.detail.headers['Authorization'] =
                            `Bearer ${newAccessToken}`;
                        htmx.ajax('GET', event.detail.path, event.target);
                    });
                }
            }
        });
    </script>
</body>

</html>
10.文章详情
10.1. article.controller.ts
src/api/controllers/article.controller.ts

+import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ArticleService } from 'src/shared/services/article.service';

@Controller('api/articles')
export class ArticleController {
    constructor(
        private readonly articleService: ArticleService,
    ) { }

    @Get()
    async getArticles(
        @Query('categoryId') categoryId: string = '',
        @Query('tagId') tagId: string = '',
        @Query('keyword') keyword: string = '',
    ) {
        const articles = await this.articleService.findList(
            keyword,
            categoryId,
            tagId
        );
        return {
            keyword,
            categoryId,
            tagId,
            articles
        };
    }
+   @Get(':id')
+   async getArticleById(@Param('id') id: number) {
+       const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
+       if (!article) {
+           throw new NotFoundException('Article not found');
+       }
+       return article;
+   }
}

10.2. article.html
front/article.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文章详情</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <link href="/style/bootstrap-icons.min.css" rel="stylesheet">
    <script src="/js/jquery.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/htmx.min.js"></script>
    <script src="/js/handlebars.min.js"></script>
</head>

<body>
    <header class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
            <a class="navbar-brand" href="/">CMS首页</a>
        </div>
    </header>

    <div class="container mt-4" id="article-detail"></div>

    <script id="article-detail-template" type="text/x-handlebars-template">
        <div class="article">
            <h1>{{title}}</h1>
            <p><strong>分类:</strong> 
                {{#each categories}}
                    <span>{{name}}</span>
                {{/each}}
            </p>
            <p><strong>标签:</strong> 
                {{#each tags}}
                    <span>{{name}}</span>
                {{/each}}
            </p>
            <hr/>
            <div class="content">
                {{{content}}}
            </div>
        </div>
    </script>

    <script>
        const articleId = new URLSearchParams(window.location.search).get('id');
        fetch(`/api/articles/${articleId}`)
            .then(response => response.json())
            .then(data => {
                const templateSource = document.getElementById('article-detail-template').innerHTML;
                const template = Handlebars.compile(templateSource);
                const html = template({
                    title: data.title,
                    categories: data.categories,
                    tags: data.tags,
                    content: data.content
                });
                document.getElementById('article-detail').innerHTML = html;
                htmx.process(document.getElementById('article-detail'));
            })
            .catch(error => console.error('Error fetching tags:', error));
    </script>
</body>

</html>
11.布署
11.1 命令
docker-compose up -d
docker-compose down --rmi local -v
11.2. nginx.conf
nginx.conf

# 配置全局事件块
events {
    # 设置每个工作进程的最大连接数为 1024
    worker_connections 1024;
}
# 配置 HTTP 服务
http {
    # 配置服务器块
    server {
        # 监听 80 端口
        listen 80;
        # 配置请求路径为 '/' 的位置块
        location / {
            # 将请求代理到运行在 http://node:3000 的 Node.js 应用
            proxy_pass http://node:3000;
            # 设置主机头信息
            proxy_set_header Host $host;
            # 设置客户端的真实 IP 地址
            proxy_set_header X-Real-IP $remote_addr;
            # 设置用于转发的客户端 IP 地址
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            # 设置请求的协议（http 或 https）
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
11.3. Dockerfile
Dockerfile

# 使用最新的 Node.js 官方镜像作为构建阶段的基础镜像
FROM node:latest AS build

# 设置工作目录为 /app
WORKDIR /app

# 复制 package.json 和 package-lock.json 到容器的当前工作目录
COPY package.json package-lock.json ./

# 使用 npm ci 安装项目依赖
RUN npm ci

# 将本地目录下的所有文件复制到容器的工作目录
COPY . .

# 运行构建命令，构建项目
RUN npm run build

# 使用最新的 Node.js 官方镜像作为生产环境的基础镜像
FROM node:latest

# 设置工作目录为 /app
WORKDIR /app

# 从构建阶段复制生成的 dist 目录到当前工作目录
COPY --from=build /app/dist ./dist
# 从构建阶段复制 public 目录到当前工作目录
COPY --from=build /app/public ./public
# 从构建阶段复制 views 目录到当前工作目录
COPY --from=build /app/views ./views
# 从构建阶段复制 front 目录到当前工作目录
COPY --from=build /app/front ./front

# 复制 package.json 和 package-lock.json 到容器的当前工作目录
COPY package.json package-lock.json ./

# 使用 npm ci 安装生产环境所需的依赖
RUN npm ci --only=production

# 暴露应用的 3000 端口
EXPOSE 3000

# 指定容器启动时执行的命令，运行应用
CMD ["node", "dist/main.js"]
11.4. docker-compose.yml
docker-compose.yml

services:
  # 定义 Node.js 服务
  node:
    # 构建 Node.js 服务的 Docker 镜像
    build:
      # 设置构建上下文为当前目录
      context: .
      # 使用 Dockerfile 文件进行构建
      dockerfile: Dockerfile
    # 加载环境变量文件 .env
    env_file:
      - .env
    # 设置服务依赖，确保在启动该服务前，以下服务已经运行
    depends_on:
      - mysql
      - redis
      - mongodb
    # 指定服务连接到的网络
    networks:
      - cms-network

  # 定义 Nginx 服务
  nginx:
    # 使用最新的官方 Nginx 镜像
    image: nginx:latest
    # 挂载本地的 nginx.conf 配置文件到容器内
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    # 将容器的 80 端口映射到主机的 80 端口
    ports:
      - '80:80'
    # 设置服务依赖，确保在启动该服务前，Node.js 服务已经运行
    depends_on:
      - node
    # 指定服务连接到的网络
    networks:
      - cms-network

  # 定义 MySQL 服务
  mysql:
    # 使用官方 MySQL 8.0 镜像
    image: mysql:8.0
    # 挂载卷来持久化数据库数据
    volumes:
      - mysql-data:/var/lib/mysql
      # 挂载本地的 init.sql 文件到容器内，用于数据库初始化
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    # 设置环境变量，包括 MySQL 的 root 用户密码和默认数据库名称
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: cms
    # 指定服务连接到的网络
    networks:
      - cms-network

  # 定义 Redis 服务
  redis:
    # 使用官方 Redis 6.2 镜像
    image: redis:6.2
    # 挂载卷来持久化 Redis 数据
    volumes:
      - redis-data:/data
    # 指定服务连接到的网络
    networks:
      - cms-network

  # 定义 MongoDB 服务
  mongodb:  
    # 使用官方 MongoDB 5.0 镜像
    image: mongo:5.0  
    # 挂载卷来持久化 MongoDB 数据
    volumes:
      - mongodb-data:/data/db
    # 设置环境变量，指定 MongoDB 初始化时创建的数据库名称
    environment:
      MONGO_INITDB_DATABASE: cms  
    # 指定服务连接到的网络
    networks:
      - cms-network

# 定义数据卷，用于持久化数据
volumes:
  mysql-data:
  redis-data:
  mongodb-data:  

# 定义网络，用于各服务之间的通信
networks:
  cms-network:
    driver: bridge
12.Docker 命令
1. 查看 Docker 版本
docker --version
2. 拉取镜像
docker pull nginx:latest
3. 列出本地所有镜像
docker images
4. 构建镜像
docker build -t my-app:1.0 .
-t：为构建的镜像指定名称和标签。
.：指定构建上下文为当前目录。
5. 运行容器
docker run -d -p 80:80 --name my-nginx nginx:latest
-d：以后台方式运行容器。
-p：将主机的端口映射到容器的端口。
--name：为容器指定名称。
6. 查看运行中的容器
docker ps
查看所有容器（包括停止的容器）：
docker ps -a
7. 停止容器
docker stop my-nginx
8. 启动容器
docker start my-nginx
9. 删除容器
docker rm my-nginx
强制删除正在运行的容器：
docker rm -f my-nginx
10. 删除镜像
docker rmi my-app:1.0
11. 查看容器日志
docker logs my-nginx
实时查看容器日志：
docker logs -f my-nginx
12. 进入正在运行的容器
docker exec -it my-nginx /bin/bash
-it：以交互模式运行，使用终端访问容器。
13. 查看容器资源使用情况
docker stats
14. 列出容器端口映射
docker port my-nginx
15. 导出容器为镜像
docker commit my-nginx my-nginx-image
16. 将容器文件拷贝到主机
docker cp my-nginx:/usr/share/nginx/html /path/on/host
17. 查看 Docker 网络
docker network ls
18. 创建 Docker 网络
docker network create my-network
19. 连接容器到指定网络
docker network connect my-network my-nginx
20. 清理未使用的镜像、容器、网络和卷
docker system prune
仅删除未使用的镜像：
docker image prune
21. 运行带环境变量的容器
docker run -d -p 8080:80 --name my-app -e ENV_VAR=value my-app:1.0
-e：传递环境变量给容器。
13.docker-compose
1. 启动服务：
   docker-compose up
启动 docker-compose.yml 文件中定义的所有服务，并输出日志信息。

docker-compose up -d
后台运行服务，不输出日志。
2. 停止服务：
   docker-compose down
停止并删除由 docker-compose up 启动的容器和网络。
3. 重新启动服务：
   docker-compose restart
重新启动 docker-compose.yml 文件中定义的所有服务。
4. 查看服务状态：
   docker-compose ps
显示所有由 docker-compose 管理的服务的状态。
5. 查看服务日志：
   docker-compose logs
显示所有服务的日志。

docker-compose logs <service_name>
显示指定服务的日志，例如 docker-compose logs node。
6. 构建服务镜像：
   docker-compose build
构建或重新构建服务镜像。

docker-compose build <service_name>
构建指定服务的镜像，例如 docker-compose build node。
7. 列出容器：
   docker-compose ps
列出当前项目的容器。
8. 运行单个服务命令：
   docker-compose run <service_name> <command>
在指定的服务容器中运行命令，例如：
docker-compose run node npm install
9. 进入正在运行的容器：
   docker-compose exec <service_name> /bin/bash
进入指定服务的正在运行的容器，例如：
docker-compose exec node /bin/bash
10. 删除所有容器、网络和卷：
```bash
docker-compose down -v
```
- 停止服务并删除数据卷（慎用，此操作会清除容器中的数据）。
11. 仅构建而不启动容器：
```bash
docker-compose build
```
- 构建所有服务的镜像而不启动容器。
12. 拉取服务所需的镜像：
```bash
docker-compose pull
```
- 拉取 `docker-compose.yml` 文件中定义的服务所需的镜像。