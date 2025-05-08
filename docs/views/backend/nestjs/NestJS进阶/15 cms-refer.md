1.Bootstrap
Bootstrap 5 是一款流行的前端框架，帮助开发者快速构建响应式和现代化的网页应用。以下是对 Bootstrap 5 的详细讲解：

1.1 基础介绍
什么是 Bootstrap？ Bootstrap 是由 Twitter 团队开发的开源前端框架，提供了预定义的 HTML、CSS 和 JavaScript 组件，帮助开发者快速搭建美观且响应式的网页。Bootstrap 5 是最新版本，去除了对 jQuery 的依赖，改进了响应式布局系统，并增加了新的组件和实用工具。

安装和使用 你可以通过以下几种方式引入 Bootstrap 5：

CDN:

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
NPM:

npm install bootstrap
下载源码: 从 Bootstrap 官网 下载源码，然后手动引入。

网格系统

Bootstrap 5 的网格系统基于 flexbox 布局，可以创建复杂的响应式布局。网格系统包括容器（containers）、行（rows）和列（columns）。

容器 容器是用来包裹内容和网格系统的基本布局元素。容器有两种类型：固定宽度容器和流体容器。

固定宽度容器:

<div class="container">
  <!-- 内容 -->
</div>
流体容器:

<div class="container-fluid">
  <!-- 内容 -->
</div>
行和列 使用 .row 类定义行，使用 .col 类定义列。列必须放在行内。

基础用法:

<div class="container">
  <div class="row">
    <div class="col">列1</div>
    <div class="col">列2</div>
    <div class="col">列3</div>
  </div>
</div>
响应式列:

<div class="row">
  <div class="col-sm">小屏幕及以上</div>
  <div class="col-md">中等屏幕及以上</div>
  <div class="col-lg">大屏幕及以上</div>
  <div class="col-xl">超大屏幕</div>
</div>
1.2. 组件
Bootstrap 5 提供了丰富的组件库，帮助开发者快速构建用户界面。常用组件包括：

导航栏（Navbar）：

<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <a class="navbar-brand" href="#">Navbar</a>
  <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
  </button>
  <div class="collapse navbar-collapse" id="navbarNav">
    <ul class="navbar-nav">
      <li class="nav-item">
        <a class="nav-link active" href="#">Home</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#">Features</a>
      </li>
    </ul>
  </div>
</nav>
按钮（Buttons）：

<button type="button" class="btn btn-primary">Primary</button>
<button type="button" class="btn btn-secondary">Secondary</button>
表单（Forms）：

<form>
  <div class="mb-3">
    <label for="exampleInputEmail1" class="form-label">Email address</label>
    <input type="email" class="form-control" id="exampleInputEmail1">
  </div>
  <div class="mb-3">
    <label for="exampleInputPassword1" class="form-label">Password</label>
    <input type="password" class="form-control" id="exampleInputPassword1">
  </div>
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
模态框（Modals）：

<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
  Launch demo modal
</button>

<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        ...
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>
1.3. 实用工具类
Bootstrap 5 提供了许多实用工具类，用于快速添加常见的样式。这些工具类包括边距（margin）、填充（padding）、文本对齐（text alignment）、背景色（background color）等。

边距和填充：

<div class="mt-3">上边距3</div>
<div class="mb-3">下边距3</div>
<div class="pt-3">上填充3</div>
<div class="pb-3">下填充3</div>
文本对齐：

<div class="text-start">左对齐</div>
<div class="text-center">居中对齐</div>
<div class="text-end">右对齐</div>
背景色：

<div class="bg-primary text-white">蓝色背景，白色文本</div>
<div class="bg-secondary text-white">灰色背景，白色文本</div>
<div class="bg-success text-white">绿色背景，白色文本</div>
1.4. 图标
Bootstrap 5 引入了 Bootstrap Icons，这是一个独立的图标库，提供了数百个图标，开发者可以直接在项目中使用这些图标。

引入图标库：

<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css" rel="stylesheet">
使用图标：

<i class="bi bi-alarm"></i>
<i class="bi bi-calendar"></i>
1.5. 自定义和扩展
Bootstrap 5 允许开发者通过 SCSS 变量和混入（mixins）进行自定义。你可以覆盖默认变量值以满足特定需求。

覆盖变量：
$primary: #ff6347; // 修改主色调为番茄红
@import "bootstrap/scss/bootstrap";
1.6. 移除 jQuery 依赖
Bootstrap 5 移除了对 jQuery 的依赖，所有 JavaScript 插件都使用原生 JavaScript 编写，这使得框架更轻量、更高效。

2.jQuery
jQuery 是一个快速、小巧且功能丰富的 JavaScript 库，简化了 HTML 文档遍历与操作、事件处理、动画和 Ajax 的复杂性。jQuery 3 是 jQuery 的最新版本之一，提供了许多新特性和改进。以下是 jQuery 3 的主要特性和常用功能的讲解。

2.1.主要特性
跨浏览器兼容性：jQuery 提供了跨浏览器的解决方案，确保在不同浏览器中一致地运行。
简化的 DOM 操作：提供了方便的 API 来操作 DOM 元素。
事件处理：提供了简洁的事件绑定和处理方法。
动画和效果：内置多种动画效果，简化了复杂动画的实现。
Ajax 支持：简化了与服务器的异步通信。
插件系统：丰富的插件库，能够扩展 jQuery 的功能。
2.2.常用功能示例
2.2.1. 选择器
jQuery 的选择器允许你轻松地选择和操作 DOM 元素。

// 选择所有段落元素
$('p').css('color', 'blue');

// 选择具有特定类的元素
$('.myClass').hide();

// 选择具有特定 ID 的元素
$('#myId').show();
2.2.2. 事件处理
jQuery 提供了便捷的方法来绑定和处理事件。

// 绑定点击事件
$('#myButton').on('click', function() {
    alert('Button clicked!');
});

// 解绑点击事件
$('#myButton').off('click');
2.2.3. DOM 操作
jQuery 提供了简洁的 API 来操作 DOM 元素的属性、内容和样式。

// 改变元素的文本内容
$('#myElement').text('New text');

// 改变元素的 HTML 内容
$('#myElement').html('<strong>Bold text</strong>');

// 改变元素的属性
$('#myInput').attr('placeholder', 'Enter your name');
2.2.4. 动画和效果
jQuery 提供了多种内置动画和效果，简化了复杂动画的实现。

// 淡入效果
$('#myElement').fadeIn();

// 淡出效果
$('#myElement').fadeOut();

// 滑动效果
$('#myElement').slideDown();
$('#myElement').slideUp();
2.2.5. Ajax
jQuery 提供了便捷的 Ajax 方法，用于与服务器进行异步通信。

// 使用 $.ajax 方法
$.ajax({
    url: 'https://api.example.com/data',
    method: 'GET',
    success: function(data) {
        console.log(data);
    },
    error: function(error) {
        console.error(error);
    }
});

// 使用 $.get 方法
$.get('https://api.example.com/data', function(data) {
    console.log(data);
});

// 使用 $.post 方法
$.post('https://api.example.com/data', { key: 'value' }, function(response) {
    console.log(response);
});
2.2.6. 链式调用
jQuery 支持链式调用，使代码更加简洁和可读。

// 链式调用示例
$('#myElement').css('color', 'red').slideUp().slideDown();
3.Handlebars
Handlebars 是一个简单但功能强大的模板引擎，用于生成 HTML 代码。它是基于 Mustache 模板语言的扩展，提供了更为强大的功能，如条件判断和循环。
3.1.基本使用
Handlebars 的基本语法非常简单。它使用双大括号 {{}} 来包裹变量名和表达式
在渲染模板时，{{variableName}} 将被替换为上下文中 variableName 的值。
Handlebars 的模板渲染依赖于上下文（Context）。上下文是一个包含数据的对象。在渲染模板时，Handlebars 会用上下文中的数据来替换模板中的变量。例如：
const Handlebars = require('handlebars');
// 模板源
const source = "<p>Hello, {{name}}!</p>";
// 编译模板
const template = Handlebars.compile(source);
// 上下文
const context = { name: "Nick" };
// 渲染模板
const result = template(context);
console.log(result);  // 输出: <p>Hello, Nick!</p>
3.2. 条件判断
Handlebars 支持条件判断，可以使用 {{#if}} 和 {{#unless}} 块来实现。例如：

const Handlebars = require('handlebars');
const source = `
{{#if isAdmin}}
  <p>Welcome, admin!</p>
{{else}}
  <p>Welcome, user!</p>
{{/if}}
`;
const template = Handlebars.compile(source);
const context = { isAdmin: true };
const result = template(context);
console.log(result);
如果上下文中 isAdmin 的值为 true，则渲染 Welcome, admin!，否则渲染 Welcome, user!。

3.3. 循环
可以使用 {{#each}} 块来遍历数组。例如：

const Handlebars = require('handlebars');
const source = `
<ul>
  {{#each items}}
    <li>{{this}}</li>
  {{/each}}
</ul>
`;
const template = Handlebars.compile(source);
const context = { items: ["Item 1", "Item 2", "Item 3"] };
const result = template(context);
console.log(result);
3.4. 自定义帮助器
可以定义自己的帮助器来扩展 Handlebars 的功能。例如：

const Handlebars = require('handlebars');
Handlebars.registerHelper('uppercase', function (str) {
    return str.toUpperCase();
});
const source = `{{uppercase name}}`;
const template = Handlebars.compile(source);
const context = { name: 'Nick' };
const result = template(context);
console.log(result);
4.express-handlebars
4.1.基本使用
4.1.1 home.handlebars
views/home.handlebars

<p>Welcome to the Home Page!</p>
4.1.2. header.handlebars
views/partials/header.handlebars

<header>
    <h1>{{uppercase title}}</h1>
</header>
4.1.3. main.handlebars
views/layouts/main.handlebars

<!DOCTYPE html>
<html>
<head>
    <title>{{title}}</title>
</head>
<body>
    {{> header}}
    {{{body}}}
</body>
</html>
4.1.4. index.js
index.js

const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
+const hbs = exphbs.create({
+   helpers: {
+       uppercase: function (str) {
+           return str.toUpperCase();
+       }
+   }
+});
+
+app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');
app.get('/', (req, res) => {
+   res.render('home', { title: 'Home Page', layout: 'main' });
});
+const PORT = 3600;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
4.2.树
在 Handlebars 中，部分模板（partial）可以通过传递参数来定制其渲染。传递参数的方法
上下文对象：this 或其他上下文对象表示当前的上下文数据。
命名参数：使用 key=value 形式传递参数，这些参数可以在部分模板中使用。
在 Handlebars 中，../ 表示访问当前上下文对象的父级上下文。
4.2.1 tree.handlebars
views/tree.handlebars

<div>
    {{#each accessTree}}
    {{> treeNode this depth=1}}
    {{/each}}
</div>
4.2.2 treeNode.handlebars
views/partials/treeNode.handlebars

<div>
    {{name}}
    {{#if children}}
    <div style="padding-left: {{multiply depth 20}}px;">
        {{#each children}}
        {{> treeNode this depth=(inc ../depth)}}
        {{/each}}
    </div>
    {{/if}}
</div>
4.2.3 index.js
index.js

const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const hbs = exphbs.create({
    helpers: {
        uppercase: function (str) {
            return str.toUpperCase();
+       },
+       inc: function (value) {
+           return parseInt(value) + 1;
+       },
+       multiply: function (a, b) {
+           return a * b;
+       },
    }
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');
+const accessTree = [
+   {
+       name: 'child1',
+       children: [
+           {
+               name: 'child1.1',
+               children: [
+                   {
+                       name: 'child1.1.1',
+                       children: []
+                   }
+               ]
+           },
+           {
+               name: 'child1.2',
+               children: [
+                   {
+                       name: 'child1.2.1',
+                       children: []
+                   }
+               ]
+           }
+       ]
+   }
+];
+app.get('/tree', (req, res) => {
+   res.render('tree', { title: 'Tree', accessTree });
});
const PORT = 3600;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
5.bcrypt
bcrypt 是一个用于密码哈希和验证的库，在 Node.js 应用中广泛用于处理用户密码的存储和验证。bcrypt 基于 Blowfish 加密算法，可以对密码进行加密，并通过生成的哈希来验证密码。其主要目的是提高密码存储的安全性，避免明文存储密码或使用简单的哈希算法导致的安全隐患。

5.1 为什么要使用 bcrypt？
安全性：bcrypt 通过生成盐值并结合哈希算法来处理密码，使得相同的密码每次生成的哈希值都不同，增强了密码的安全性。
防止彩虹表攻击：bcrypt 使用的盐值使得预先计算好的哈希表（如彩虹表）无法直接破解哈希值。
哈希强度：bcrypt 允许配置哈希强度（cost factor），使得生成哈希的计算时间更长，进一步增加破解难度。
5.2 如何使用 bcrypt？
要使用 bcrypt，首先需要安装这个 npm 包。

5.2.1 安装
npm install bcrypt
在代码中，你可以使用 bcrypt 来对密码进行哈希和验证。以下是一些常见的用法：

5.2.2 生成哈希
在用户注册或密码设置时，可以使用 bcrypt 生成密码的哈希值，然后将哈希值存储在数据库中。

const bcrypt = require('bcrypt');

// 生成哈希的示例
async function hashPassword(password) {
  const saltRounds = 10;  // 盐的轮次，越高计算时间越长，安全性越高
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

// 使用示例
const plainPassword = 'myPlainPassword';
hashPassword(plainPassword).then(hash => {
  console.log('Hashed password:', hash);
});
5.2.3 验证密码
在用户登录时，可以使用 bcrypt 来比较用户输入的明文密码与数据库中存储的哈希值。

const bcrypt = require('bcrypt');
// 验证密码的示例
async function verifyPassword(plainPassword, hashedPassword) {
  const match = await bcrypt.compare(plainPassword, hashedPassword);
  return match;
}
// 使用示例
const plainPassword = 'myPlainPassword';
const hashedPassword = '$2b$10$2b.qiYdCOOgr9WqlX/IVLueucF.xMe/LyeuLwNnIFQlkbS4ySPUti';  // 示例哈希
verifyPassword(plainPassword, hashedPassword).then(match => {
  if (match) {
    console.log('Password is valid!');
  } else {
    console.log('Password is invalid.');
  }
});
5.2.4 调整哈希强度（salt rounds）
bcrypt 允许你通过调整 salt rounds 来控制哈希的计算成本。salt rounds 越高，生成哈希所需的时间就越长，安全性也越高。

const bcrypt = require('bcrypt');
const saltRounds = 12;  // 你可以调整这个数值
const password = 'examplePassword';
bcrypt.hash(password, saltRounds, function(err, hash) {
  // 保存哈希到数据库中
  console.log('Hashed password with higher salt rounds:', hash);
});