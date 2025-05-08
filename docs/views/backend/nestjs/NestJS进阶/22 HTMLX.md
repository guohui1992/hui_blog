1.HTMLX
htmx 让你可以直接在 HTML 中使用 AJAX、CSS 过渡、WebSockets 和 服务器推送事件，通过 属性 构建 现代用户界面，结合 简单性 和 超文本的强大功能。

htmx 体积小（~14k min.gz'd），无依赖，可扩展，并且与 react 相比，减少 了 67% 的代码量。

1.1 使用HTMLX的优势
简化AJAX操作：开发者可以通过简单的HTML属性实现复杂的AJAX请求，无需手写大量JavaScript代码。
提高代码可读性：由于大部分逻辑都在HTML中定义，代码的意图更加明确，易于阅读和维护。
增强交互性：HTMLX可以轻松地将页面变得更加动态和交互，而无需引入复杂的前端框架。
1.2 典型的应用场景
表单提交：通过HTMLX，可以轻松地实现表单的异步提交，并根据服务器响应更新页面内容。
动态内容加载：可以根据用户操作动态加载内容，而无需刷新整个页面。
实时更新：例如，使用HTMLX可以实现数据的实时更新和展示。
HTMLX特别适合那些希望保持页面轻量且可维护性高的项目。对于希望快速开发出交互式和动态网页的开发者来说，它是一个非常有用的工具。

2.项目准备
2.1 安装
npm install express
2.2 package.json
package.json

{
  "scripts": {
    "start:dev": "nodemon app.js"
  },
}
2.3 app.js
app.js

const express = require('express');
const path = require("path");
const fs = require('fs');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/', (req, res) => {
    const directoryPath = path.join(__dirname, 'public');
    fs.readdir(directoryPath, (err, files) => {
        const fileLinks = files.map(file => {
            return `<li><a href="${file}">${file}</a></li>`;
        }).join('');
        res.send(`<ul>${fileLinks} </ul>`);
    });
});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
2.4 index.html
public\index.html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    hello
</body>
</html>
3.发送GET请求
功能: hx-get 用于向服务器发送 GET 请求，并将返回的数据加载到指定的目标元素中。GET 请求通常用于从服务器获取数据或页面内容，而不是发送数据。
使用场景: 当你需要从服务器获取信息并将其展示在页面上时，使用 hx-get 是非常合适的选择。例如，加载部分页面内容、获取数据进行展示等。
3.1. index.html
public/1.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="/htmx.min.js"></script>
</head>

<body>
    <button type="button" hx-get="/">
        发送GET请求
    </button>
</body>

</html>
3.2. app.js
app.js

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
+app.get('/', (req, res) => {
+   res.send('GET请求响应');
+});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
4.发送GET请求
ajax
4.1. index.html
public/1.get.html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="/htmx.min.js"></script>
</head>
<body>
    <button type="button" hx-get="/get">
        发送GET请求
    </button>
</body>

</html>
4.2. app.js
app.js

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
+app.get('/get', (req, res) => {
+    res.send('GET请求响应');
+});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
5.发送POST请求
功能: hx-post 用于向服务器发送 POST 请求。POST 请求通常用于将数据提交给服务器，例如表单数据、用户输入的数据等。与 GET 请求不同，POST 请求通常用于提交数据，而不是获取数据。
使用场景: 在需要将用户数据提交到服务器进行处理时，使用 hx-post 是更合适的选择。POST 请求的内容不会显示在 URL 中，因此更适合提交敏感数据。
5.1. index.html
public/2.post.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>

<body>
    <button type="button" hx-post="/post">
        发送POST请求
    </button>
</body>

</html>
5.2. app.js
app.js

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/get', (req, res) => {
    res.send('GET请求响应');
});
+app.post('/post', (req, res) => {
+   res.send('POST请求响应');
+});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
6.触发器修饰符
触发器是 htmx 中非常强大的功能，它定义了在特定事件发生时，何时发送请求。触发器可以根据用户的行为、时间间隔、页面加载等事件来触发请求，提供了灵活的交互方式。

功能: mouseenter 触发器会在鼠标移入元素时触发请求。once 确保该请求仅触发一次，即使鼠标多次移入元素，也只会发送一次请求。
使用场景: 这个触发器适用于用户与页面某个元素进行首次交互时，希望加载内容或执行某些操作的场景。例如，用户第一次将鼠标移到某个区域时，动态加载数据或展示内容。

功能: 这个触发器组合了多个事件和一个延迟器。keyup 在键盘按键抬起时触发，changed 在输入内容变化时触发，delay:500ms 意味着事件触发后会延迟500毫秒再发送请求。

使用场景: 常用于搜索框或需要动态获取数据的输入框中。在用户输入搜索内容时，避免每次按键都立即触发请求，而是等待用户停止输入后再发送请求，从而减少服务器请求次数，优化用户体验。
6.1. index.html
public/3.trigger.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>

<body>
    <button type="button" hx-get="/time" hx-trigger="mouseenter once">
        mouseenter
    </button>
    <input type="text" name="q" hx-get="/trigger_delay" hx-trigger="keyup changed delay:500ms"
        hx-target="#search-results" placeholder="搜索...">
    <div id="search-results"></div>
</body>

</html>
6.2. app.js
app.js

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/get', (req, res) => {
    res.send('GET请求响应');
});
app.post('/post', (req, res) => {
    res.send('POST请求响应');
});
+app.get('/time', (req, res) => {
+   res.send(new Date().toLocaleString());
+});
+app.get('/trigger_delay', (req, res) => {
+   res.send(req.query.q);
+});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
7.触发器过滤器
trigger-filters

功能: 触发器还可以基于条件触发，click[条件] 语法允许你在点击事件发生时根据特定条件判断是否发送请求。例如，可以根据某个表达式的结果来决定是否触发请求。

使用场景: 适用于需要条件判断的场景，例如只在某些特定情况下（如用户按住 Ctrl 键时）才发送请求。
7.1. index.html
public/4.filter.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>

<body>
    <div hx-get="/time" hx-trigger="click[1==1]">
        Control Click Me
    </div>
    <div hx-get="/time" hx-trigger="click[1==2]">
        Control Click Me
    </div>
    <div hx-get="/time" hx-trigger="click[ctrlKey]">
        Control Click Me
    </div>
</body>

</html>
8.特殊事件
special-events

功能: load 触发器会在页面或元素加载完成时触发请求。它用于自动加载内容，而无需用户交互。

使用场景: 常用于需要在页面加载时自动获取内容的场景，如加载页面初始数据、内容自动刷新等。
8.1. index.html
public/5.special.html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <style>
        #revealed {
            height: 400px;
            background-color: green;
            margin-top: 150vh;
        }
        #intersect {
            height: 400px;
            background-color: green;
            margin-top: 200vh;
        }
    </style>
    <script src="/htmx.min.js"></script>
</head>
<body>
    <div hx-get="/time" hx-trigger="load">
        load
    </div>
    <div hx-get="/time" hx-trigger="revealed" id="revealed">
    </div>
    <div hx-get="/time" hx-trigger="intersect threshold:.5" id="intersect">
    </div>
</body>
</html>
9.轮询
polling

功能: every 1s 触发器会每隔1秒触发一次请求。这是一个循环触发器，通常用于实时更新的场景。

使用场景: 适用于需要定时刷新数据的场景，如实时数据显示、定时更新某个部分内容等。
9.1. index.html
public/6.pool.html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>
<body>
    <div hx-get="/time" hx-trigger="every 1s"></div>
    <div hx-get="/load_polling" hx-trigger="load delay:1s" hx-swap="outerHTML"></div>
</body>
</html>
9.2. app.js
app.js

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/get', (req, res) => {
    res.send('GET请求响应');
});
app.post('/post', (req, res) => {
    res.send('POST请求响应');
});
app.get('/time', (req, res) => {
    res.send(new Date().toLocaleString());
});
app.get('/trigger_delay', (req, res) => {
    res.send(req.query.q);
});
+let timer = 1;
+app.get('/load_polling', (req, res) => {
+   if (timer++ < 6) {
+       res.send(`<div hx-get="/load_polling" hx-trigger="load delay:1s" hx-swap="outerHTML">${".".repeat(timer)}</div>`);
+   }
+   else { 
+       res.send('加载完成');
+   }
+});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
10.请求指示器
功能: hx-indicator 属性允许你指定一个自定义的加载指示器元素。与 htmx-indicator 类类似，但它更灵活，因为你可以明确指定哪个元素应作为加载指示器。
使用场景: 适用于需要将加载指示器与触发请求的元素分离，或者希望使用不同样式和位置的加载指示器的情况。
10.1. index.html
public/7.indicator.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>

<body>
    <button hx-get="/delay">
        delay1
        <p class="htmx-indicator">loading.......</p>
    </button>
    <button hx-get="/delay" hx-indicator="#my-indicator">
        delay2
    </button>
    <p class="htmx-indicator" id="my-indicator">loading.......</p>
</body>

</html>
10.2. app.js
app.js

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/get', (req, res) => {
    res.send('GET请求响应');
});
app.post('/post', (req, res) => {
    res.send('POST请求响应');
});
app.get('/time', (req, res) => {
    res.send(new Date().toLocaleString());
});
app.get('/trigger_delay', (req, res) => {
    res.send(req.query.q);
});
let timer = 1;
app.get('/load_polling', (req, res) => {
    if (timer++ < 6) {
        res.send(`<div hx-get="/load_polling" hx-trigger="load delay:1s" hx-swap="outerHTML">${".".repeat(timer)}</div>`);
    }
+   else {
        res.send('加载完成');
    }
});
+app.get('/delay', (req, res) => {
+   setTimeout(() => {
+       res.send('延迟响应');
+   }, 3000);
+});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
11.发送数据
功能: hx-vals 属性允许你在发送请求时附加额外的数据。你可以指定一个 JSON 对象或 JavaScript 表达式，用于动态生成请求数据。
使用场景: 适用于需要动态添加或修改请求数据的场景，如根据用户输入生成 JSON 数据并发送到服务器。
11.1. send.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>
<body>
    <form>
        <input type="text" name="name" placeholder="Name">
        <input type="email" name="email" placeholder="Email">
        <button hx-post="/payload" hx-trigger="click" hx-target="#result">Send</button>
    </form>
    <div id="result"></div>
</body> 
</html>
11.2 include.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
    <script>
        function getEmail() {
            return document.querySelector('input[type="email"]').value;
        }
    </script>
</head>
<body>
    <input type="email" />
    <button hx-post="/payload" hx-target="#result" hx-vals='{"name":"name","email":"email"}'>发送json数据</button>
    <button hx-post="/payload" hx-target="#result" hx-vals='js:{"name":"name","email":getEmail()}'  hx-confirm="确认要发送吗?">发送js数据</button>
    <div id="result"></div>
</body>
</html>
11.3. sendjson.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
    <script>
        function getEmail() {
            return document.querySelector('input[type="email"]').value;
        }
    </script>
</head>
<body>
    <input type="email" id="my-email" name="email" />
    <input type="text" id="my-name" name="name" />
    <button hx-post="/payload" hx-target="#result" hx-vals='{"name":"name","email":"email"}'>发送json数据</button>
    <button hx-post="/payload" hx-target="#result" hx-vals='js:{"name":"name","email":getEmail()}'>发送js数据</button>
    <button hx-post="/payload" hx-target="#result" hx-include="#my-name,#my-email"  hx-confirm="确认要发送吗?">发送include数据</button>
    <div id="result"></div>
</body>
</html>
11.4. app.js
app.js

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/get', (req, res) => {
    res.send('GET请求响应');
});
app.post('/post', (req, res) => {
    res.send('POST请求响应');
});
app.get('/time', (req, res) => {
    res.send(new Date().toLocaleString());
});
app.get('/trigger_delay', (req, res) => {
    res.send(req.query.q);
});
let timer = 1;
app.get('/load_polling', (req, res) => {
    if (timer++ < 6) {
        res.send(`<div hx-get="/load_polling" hx-trigger="load delay:1s" hx-swap="outerHTML">${".".repeat(timer)}</div>`);
    }
    else {
        res.send('加载完成');
    }
});
app.get('/delay', (req, res) => {
    setTimeout(() => {
        res.send('延迟响应');
    }, 3000);
});
+app.post('/payload', (req, res) => {
+   const user = req.body;
+   user.id = Date.now();
+   res.send(`
+   <p>用户信息：</p>
+   <p>用户名：${user.name}</p>
+   <p>邮箱：${user.email}</p>
+   `);
+});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
12.上传文件
功能: hx-encoding 属性用于指定请求的编码类型。multipart/form-data 是常用于文件上传的编码类型，允许表单数据与文件一起上传。
使用场景: 适用于需要上传文件的表单，例如图片上传、文档上传等。
12.1. index.html
public/11.upload.html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>
<body>
    <form hx-post="/upload" hx-encoding="multipart/form-data">
        <input type="file" name="file">
        <button>上传</button>
    </form>
   <ul hx-get="/files" hx-trigger="load"></ul>
</body>
</html>
12.2. app.js
app.js

const express = require('express');
const app = express();
const multer = require("multer");
const path = require("path");
+const fs = require('fs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
+app.use(express.static('public'));
+app.use(express.static('uploads'));
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, './uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });
app.get('/get', (req, res) => {
    res.send('GET请求响应');
});
app.post('/post', (req, res) => {
    res.send('POST请求响应');
});
app.get('/time', (req, res) => {
    res.send(new Date().toLocaleString());
});
app.get('/trigger_delay', (req, res) => {
    res.send(req.query.q);
});
let timer = 1;
app.get('/load_polling', (req, res) => {
    if (timer++ < 6) {
        res.send(`<div hx-get="/load_polling" hx-trigger="load delay:1s" hx-swap="outerHTML">${".".repeat(timer)}</div>`);
    }
    else {
        res.send('加载完成');
    }
});
app.get('/delay', (req, res) => {
    setTimeout(() => {
        res.send('延迟响应');
    }, 3000);
});
app.post('/payload', (req, res) => {
    const user = req.body;
    user.id = Date.now();
    res.send(`
    <p>用户信息：</p>
    <p>用户名：${user.name}</p>
    <p>邮箱：${user.email}</p>
    `);
});
app.post("/upload", upload.single("file"), async (req, res) => {
    const filePath = req.file.path;
    console.log(filePath);
    res.send(`<b> 上传成功</b>: ${filePath}`);
})
+app.get('/files', (req, res) => {
+   fs.readdir('./uploads', (err, files) => {
+       console.log(files);
+       if (err) {
+           res.send('读取文件失败');
+       } else {
+           res.send(files.map(file => (`<li><a href="/${file}">${file}</a></li>`)).join(''));
+       }
+   });
+});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
13.序列化请求
synchronization
功能: hx-sync 属性用于控制多个请求之间的同步方式。你可以定义请求是应当被丢弃（drop）、替换（replace）、还是排队等待（queue）。
使用场景: 适用于需要协调多个异步请求的场景，例如一个请求尚未完成时，决定如何处理后续请求。
13.1. validate.html
public/13.validate.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>

<body>
    <form hx-post="/store">
        <input id="title" name="title" type="text" hx-post="/validate" hx-trigger="change" hx-sync="closest form:abort">
        <button type="submit">Submit</button>
    </form>
</body>

</html>
13.2. sync.html
public/12.sync.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>

<body>
    <button id="firstRequest" hx-get="/firstRequest" hx-target="#result1">
        First Request
    </button>
    <button id="secondRequest" hx-get="/secondRequest" hx-target="#result2" hx-sync="#firstRequest:drop">
        Second Request drop
    </button>
    <button id="secondRequest" hx-get="/secondRequest" hx-target="#result2" hx-sync="#firstRequest:replace">
        Second Request replace
    </button>
    <button id="secondRequest" hx-get="/secondRequest" hx-target="#result2" hx-sync="#firstRequest:queue">
        Second Request queue
    </button>
    <div id="result1">
    </div>
    <div id="result2">
    </div>
</body>

</html>
13.3. app.js
app.js

const express = require('express');
const app = express();
const multer = require("multer");
const path = require("path");
const fs = require('fs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('uploads'));
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, './uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });
app.get('/get', (req, res) => {
    res.send('GET请求响应');
});
app.post('/post', (req, res) => {
    res.send('POST请求响应');
});
app.get('/time', (req, res) => {
    res.send(new Date().toLocaleString());
});
app.get('/trigger_delay', (req, res) => {
    res.send(req.query.q);
});
let timer = 1;
app.get('/load_polling', (req, res) => {
    if (timer++ < 6) {
        res.send(`<div hx-get="/load_polling" hx-trigger="load delay:1s" hx-swap="outerHTML">${".".repeat(timer)}</div>`);
    }
    else {
        res.send('加载完成');
    }
});
app.get('/delay', (req, res) => {
    setTimeout(() => {
        res.send('延迟响应');
    }, 3000);
});
app.post('/payload', (req, res) => {
    const user = req.body;
    user.id = Date.now();
    res.send(`
    <p>用户信息：</p>
    <p>用户名：${user.name}</p>
    <p>邮箱：${user.email}</p>
    `);
});
app.post("/upload", upload.single("file"), async (req, res) => {
    const filePath = req.file.path;
    console.log(filePath);
    res.send(`<b> 上传成功</b>: ${filePath}`);
})
app.get('/files', (req, res) => {
    fs.readdir('./uploads', (err, files) => {
        console.log(files);
        if (err) {
            res.send('读取文件失败');
        } else {
            res.send(files.map(file => (`<li><a href="/${file}">${file}</a></li>`)).join(''));
        }
    });
});
+app.get('/firstRequest', (req, res) => {
+   setTimeout(() => {
+       res.send('firstRequestResponse');
+   }, 6000);
+});
+app.get('/secondRequest', (req, res) => {
+   setTimeout(() => {
+       res.send('secondRequestResponse');
+   }, 3000);
+});
+app.post('/validate', (req, res) => {
+   setTimeout(() => {
+       res.send('验证通过');
+   }, 6000);
+});
+
+app.post('/store', (req, res) => {
+   setTimeout(() => {
+       res.send('成功保存');
+   }, 3000);
+});
+
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
14.取消请求
功能: htmx:abort 事件用于中止正在进行的请求。当你需要取消一个正在进行的异步请求时，可以使用这个事件。
使用场景: 适用于需要用户能够主动取消长时间运行的请求的场景，例如取消数据加载或上传。
14.1. index.html
public/14.cancel.html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>
<body>
    <button type="button" id="requestButton" hx-get="/delay">
        发送请求
    </button>
    <button type="button" onclick="htmx.trigger('#requestButton', 'htmx:abort')">
        取消请求
    </button>
</body>
</html>
15.替换
交换类型（Swap）是 htmx 中用于控制服务器响应内容如何插入到 DOM 中的机制。通过指定不同的交换类型，你可以精确控制服务器返回的数据如何与现有的页面元素进行融合、替换、或删除。

htmx 提供了几种将返回的 HTML 替换到 DOM 中的方式。默认情况下，内容会替换目标元素的 innerHTML。你可以使用 swapping 属性，并设置以下任意值来修改这种行为：

名称	描述
innerHTML	默认值，将内容放入目标元素内部
outerHTML	用返回的内容替换整个目标元素
afterbegin	在目标内部的第一个子元素之前添加内容
beforebegin	在目标的父元素中，目标元素之前添加内容
beforeend	在目标内部的最后一个子元素之后添加内容
afterend	在目标的父元素中，目标元素之后添加内容
delete	无论响应如何，删除目标元素
none	不从响应中添加内容（带外替换和响应头仍然会被处理）
15.1. index.html
public/16.target.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
    <style>
        #targetParent {
            border: 5px solid red;
            padding: 10px;
        }

        #target {
            border: 5px solid blue;
            padding: 10px;
        }

        #targetChild1 {
            border: 5px solid green;
            padding: 10px;
        }

        #targetChild2 {
            border: 5px solid green;
            padding: 10px;
        }
    </style>
</head>

<body>
    <button hx-get="/time" hx-target="#target" hx-swap="beforebegin">beforebegin</button>
    <button hx-get="/time" hx-target="#target" hx-swap="afterbegin">afterbegin</button>
    <button hx-get="/time" hx-target="#target" hx-swap="beforeend">beforeend</button>
    <button hx-get="/time" hx-target="#target" hx-swap="afterend">afterend</button>
    <button hx-get="/time" hx-target="#target" hx-swap="delete">delete</button>
    <button hx-get="/time" hx-target="#target" hx-swap="none">none</button>
    <div id="targetParent">
        <!-- beforeBegin -->
        <div id="target">
            <!-- afterBegin -->
            <div id="targetChild1">targetChild1</div>
            <div id="targetChild2">targetChild2</div>
            <!-- beforeEnd -->
        </div>
        <!-- afterEnd -->
    </div>
</body>

</html>
15.3. app.js
app.js

const express = require('express');
const app = express();
const multer = require("multer");
const path = require("path");
const fs = require('fs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('uploads'));
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, './uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });
+app.get('/', (req, res) => {
+   const directoryPath = path.join(__dirname, 'public');
+   fs.readdir(directoryPath, (err, files) => {
+       const fileLinks = files.map(file => {
+           return `<li><a href="${file}">${file}</a></li>`;
+       }).join('');
+       res.send(`<ul>${fileLinks} </ul>`);
+   });
+});
app.get('/get', (req, res) => {
    res.send('GET请求响应');
});
app.post('/post', (req, res) => {
    res.send('POST请求响应');
});
app.get('/time', (req, res) => {
+   res.send(`<span>${new Date().toLocaleString()}</span>`);
});
app.get('/trigger_delay', (req, res) => {
    res.send(req.query.q);
});
let timer = 1;
app.get('/load_polling', (req, res) => {
    if (timer++ < 6) {
        res.send(`<div hx-get="/load_polling" hx-trigger="load delay:1s" hx-swap="outerHTML">${".".repeat(timer)}</div>`);
    }
    else {
        res.send('加载完成');
    }
});
app.get('/delay', (req, res) => {
    setTimeout(() => {
        res.send('延迟响应');
    }, 3000);
});
app.post('/payload', (req, res) => {
    const user = req.body;
    user.id = Date.now();
    res.send(`
    <p>用户信息：</p>
    <p>用户名：${user.name}</p>
    <p>邮箱：${user.email}</p>
    `);
});
app.post("/upload", upload.single("file"), async (req, res) => {
    const filePath = req.file.path;
    console.log(filePath);
    res.send(`<b> 上传成功</b>: ${filePath}`);
})
app.get('/files', (req, res) => {
    fs.readdir('./uploads', (err, files) => {
        console.log(files);
        if (err) {
            res.send('读取文件失败');
        } else {
            res.send(files.map(file => (`<li><a href="/${file}">${file}</a></li>`)).join(''));
        }
    });
});
app.get('/firstRequest', (req, res) => {
    setTimeout(() => {
        res.send('firstRequestResponse');
    }, 6000);
});
app.get('/secondRequest', (req, res) => {
    setTimeout(() => {
        res.send('secondRequestResponse');
    }, 3000);
});
app.post('/validate', (req, res) => {
    setTimeout(() => {
        res.send('验证通过');
    }, 6000);
});

app.post('/store', (req, res) => {
    setTimeout(() => {
        res.send('成功保存');
    }, 3000);
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
16.越界替换
如果你想通过使用 id 属性直接将响应内容替换到 DOM 中，你可以在 响应 HTML 中使用 hx-swap-oob 属性

hx-swap-oob 是 htmx 提供的一个特殊功能，用于实现“带外”内容交换。这意味着当服务器返回内容时，该内容可以被插入到页面上与触发请求的元素无关的任何位置，而不是按照常规的方式替换或插入到触发请求的元素或指定的目标元素中。

hx-swap-oob 允许服务器响应包含多个独立片段，这些片段可以根据其自身的 hx-swap-oob 属性直接插入到页面的其他部分。这种机制特别适合复杂页面的部分更新操作，在单次请求中实现多个区域的同时更新。

16.1. index.html
public/17.oob.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>

</head>

<body>
    <button hx-get="/oob" hx-target="#mainTarget">
        加载内容
    </button>
    <div id="mainTarget">
        主要目标
    </div>
    <div id="otherTarget">
    </div>
</body>

</html>
16.2. app.js
app.js

const express = require('express');
const app = express();
const multer = require("multer");
const path = require("path");
const fs = require('fs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('uploads'));
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, './uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });
app.get('/', (req, res) => {
    const directoryPath = path.join(__dirname, 'public');
    fs.readdir(directoryPath, (err, files) => {
        const fileLinks = files.map(file => {
            return `<li><a href="${file}">${file}</a></li>`;
        }).join('');
        res.send(`<ul>${fileLinks} </ul>`);
    });
});
app.get('/get', (req, res) => {
    res.send('GET请求响应');
});
app.post('/post', (req, res) => {
    res.send('POST请求响应');
});
app.get('/time', (req, res) => {
    res.send(`<span>${new Date().toLocaleString()}</span>`);
});
app.get('/trigger_delay', (req, res) => {
    res.send(req.query.q);
});
let timer = 1;
app.get('/load_polling', (req, res) => {
    if (timer++ < 6) {
        res.send(`<div hx-get="/load_polling" hx-trigger="load delay:1s" hx-swap="outerHTML">${".".repeat(timer)}</div>`);
    }
    else {
        res.send('加载完成');
    }
});
app.get('/delay', (req, res) => {
    setTimeout(() => {
        res.send('延迟响应');
    }, 3000);
});
app.post('/payload', (req, res) => {
    const user = req.body;
    user.id = Date.now();
    res.send(`
    <p>用户信息：</p>
    <p>用户名：${user.name}</p>
    <p>邮箱：${user.email}</p>
    `);
});
app.post("/upload", upload.single("file"), async (req, res) => {
    const filePath = req.file.path;
    console.log(filePath);
    res.send(`<b> 上传成功</b>: ${filePath}`);
})
app.get('/files', (req, res) => {
    fs.readdir('./uploads', (err, files) => {
        console.log(files);
        if (err) {
            res.send('读取文件失败');
        } else {
            res.send(files.map(file => (`<li><a href="/${file}">${file}</a></li>`)).join(''));
        }
    });
});
app.get('/firstRequest', (req, res) => {
    setTimeout(() => {
        res.send('firstRequestResponse');
    }, 6000);
});
app.get('/secondRequest', (req, res) => {
    setTimeout(() => {
        res.send('secondRequestResponse');
    }, 3000);
});
app.post('/validate', (req, res) => {
    setTimeout(() => {
        res.send('验证通过');
    }, 6000);
});

app.post('/store', (req, res) => {
    setTimeout(() => {
        res.send('成功保存');
    }, 3000);
});
+app.get('/oob', (req, res) => {
+   res.send(`
+       <span>主要的内容</span>
+       <div id="otherTarget" hx-swap-oob="true">其它内容</div>
+`);
+});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
17.选择替换内容
如果你想选择响应 HTML 的一个子集替换到目标中，可以使用 hx-select属性，该属性接受一个 CSS 选择器并选择响应中匹配的元素。

功能: hx-select 属性允许你从服务器响应中选择特定部分内容进行插入，而不是插入整个响应内容。你可以使用 CSS 选择器指定需要插入的部分。
使用场景: 适用于服务器响应包含多个部分，但你只想插入其中一部分内容的情况。例如，从复杂的响应中提取特定的内容片段。
17.1. index.html
public/18.select.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>

</head>

<body>
    <button hx-get="/select" hx-target="#mainTarget" hx-select="#otherTarget">
        加载内容
    </button>
    <div id="mainTarget">
        主要目标
    </div>
</body>

</html>
17.2. app.js
app.js

const express = require('express');
const app = express();
const multer = require("multer");
const path = require("path");
const fs = require('fs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('uploads'));
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, './uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });
app.get('/', (req, res) => {
    const directoryPath = path.join(__dirname, 'public');
    fs.readdir(directoryPath, (err, files) => {
        const fileLinks = files.map(file => {
            return `<li><a href="${file}">${file}</a></li>`;
        }).join('');
        res.send(`<ul>${fileLinks} </ul>`);
    });
});
app.get('/get', (req, res) => {
    res.send('GET请求响应');
});
app.post('/post', (req, res) => {
    res.send('POST请求响应');
});
app.get('/time', (req, res) => {
    res.send(`<span>${new Date().toLocaleString()}</span>`);
});
app.get('/trigger_delay', (req, res) => {
    res.send(req.query.q);
});
let timer = 1;
app.get('/load_polling', (req, res) => {
    if (timer++ < 6) {
        res.send(`<div hx-get="/load_polling" hx-trigger="load delay:1s" hx-swap="outerHTML">${".".repeat(timer)}</div>`);
    }
    else {
        res.send('加载完成');
    }
});
app.get('/delay', (req, res) => {
    setTimeout(() => {
        res.send('延迟响应');
    }, 3000);
});
app.post('/payload', (req, res) => {
    const user = req.body;
    user.id = Date.now();
    res.send(`
    <p>用户信息：</p>
    <p>用户名：${user.name}</p>
    <p>邮箱：${user.email}</p>
    `);
});
app.post("/upload", upload.single("file"), async (req, res) => {
    const filePath = req.file.path;
    console.log(filePath);
    res.send(`<b> 上传成功</b>: ${filePath}`);
})
app.get('/files', (req, res) => {
    fs.readdir('./uploads', (err, files) => {
        console.log(files);
        if (err) {
            res.send('读取文件失败');
        } else {
            res.send(files.map(file => (`<li><a href="/${file}">${file}</a></li>`)).join(''));
        }
    });
});
app.get('/firstRequest', (req, res) => {
    setTimeout(() => {
        res.send('firstRequestResponse');
    }, 6000);
});
app.get('/secondRequest', (req, res) => {
    setTimeout(() => {
        res.send('secondRequestResponse');
    }, 3000);
});
app.post('/validate', (req, res) => {
    setTimeout(() => {
        res.send('验证通过');
    }, 6000);
});

app.post('/store', (req, res) => {
    setTimeout(() => {
        res.send('成功保存');
    }, 3000);
});
app.get('/oob', (req, res) => {
    res.send(`
+       主要的内容
        <div id="otherTarget" hx-swap-oob="true">其它内容</div>
`);
});
+app.get('/select', (req, res) => {
+   res.send(`
+       <span>主要的内容</span>
+       <div id="otherTarget">其它内容</div>
+`);
+});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
18.动画
htmx 允许您仅使用 HTML 和 CSS 在许多情况下使用 CSS 过渡。

18.1. index.html
public/19.animation.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
    <style>
        .circle {
            border-radius: 50%;
            background-color: red;
            transition: all 1s ease-in;
        }
    </style>
</head>

<body>
    <div id="circle" class="circle" hx-get="/bigger" hx-swap="outerHTML" style="width:100px;height:100px;">

    </div>
</body>

</html>
18.2. app.js
app.js

const express = require('express');
const app = express();
const multer = require("multer");
const path = require("path");
const fs = require('fs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('uploads'));
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, './uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });
app.get('/', (req, res) => {
    const directoryPath = path.join(__dirname, 'public');
    fs.readdir(directoryPath, (err, files) => {
        const fileLinks = files.map(file => {
            return `<li><a href="${file}">${file}</a></li>`;
        }).join('');
        res.send(`<ul>${fileLinks} </ul>`);
    });
});
app.get('/get', (req, res) => {
    res.send('GET请求响应');
});
app.post('/post', (req, res) => {
    res.send('POST请求响应');
});
app.get('/time', (req, res) => {
    res.send(`<span>${new Date().toLocaleString()}</span>`);
});
app.get('/trigger_delay', (req, res) => {
    res.send(req.query.q);
});
let timer = 1;
app.get('/load_polling', (req, res) => {
    if (timer++ < 6) {
        res.send(`<div hx-get="/load_polling" hx-trigger="load delay:1s" hx-swap="outerHTML">${".".repeat(timer)}</div>`);
    }
    else {
        res.send('加载完成');
    }
});
app.get('/delay', (req, res) => {
    setTimeout(() => {
        res.send('延迟响应');
    }, 3000);
});
app.post('/payload', (req, res) => {
    const user = req.body;
    user.id = Date.now();
    res.send(`
    <p>用户信息：</p>
    <p>用户名：${user.name}</p>
    <p>邮箱：${user.email}</p>
    `);
});
app.post("/upload", upload.single("file"), async (req, res) => {
    const filePath = req.file.path;
    console.log(filePath);
    res.send(`<b> 上传成功</b>: ${filePath}`);
})
app.get('/files', (req, res) => {
    fs.readdir('./uploads', (err, files) => {
        console.log(files);
        if (err) {
            res.send('读取文件失败');
        } else {
            res.send(files.map(file => (`<li><a href="/${file}">${file}</a></li>`)).join(''));
        }
    });
});
app.get('/firstRequest', (req, res) => {
    setTimeout(() => {
        res.send('firstRequestResponse');
    }, 6000);
});
app.get('/secondRequest', (req, res) => {
    setTimeout(() => {
        res.send('secondRequestResponse');
    }, 3000);
});
app.post('/validate', (req, res) => {
    setTimeout(() => {
        res.send('验证通过');
    }, 6000);
});

app.post('/store', (req, res) => {
    setTimeout(() => {
        res.send('成功保存');
    }, 3000);
});
app.get('/oob', (req, res) => {
    res.send(`
        主要的内容
        <div id="otherTarget" hx-swap-oob="true">其它内容</div>
`);
});
app.get('/select', (req, res) => {
    res.send(`
        <span>主要的内容</span>
        <div id="otherTarget">其它内容</div>
`);
});
+app.get('/bigger', (req, res) => {
+   res.send(`
+     <div id="circle" class="circle" hx-get="http://localhost:1330/bigger" hx-swap="outerHTML" style="width:200px;height:200px;">
+
+   </div>
+`);
+});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
19.htmx:load
events
events

功能: htmx.onLoad 是一个用于在新内容加载并插入 DOM 后执行自定义逻辑的事件处理器。这类似于前面提到的 htmx:load 事件，但更直接，适合在需要对新内容进行初始化或进一步处理时使用。

使用场景: 适用于需要在新内容加载后立即执行操作的场景，比如绑定事件处理程序、初始化插件等。
19.1. index.html
public/20.load.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>

</head>

<body>
    <script>
        document.body.addEventListener('htmx:load', function (event) {
            console.log('htmx:load', event);
        });
        htmx.on("htmx:load", function (event) {
            console.log('htmx.on("htmx:load")', event);
        });
        htmx.onLoad((target) => {
            console.log('htmx.onLoad', event);
        })
    </script>
</body>

</html>
20.使用事件修改交换行为
modifying_swapping_behavior_with_events

功能: htmx:beforeSwap 事件在服务器返回的数据即将被插入到页面之前触发。你可以在这里检查或修改即将插入的内容，甚至可以取消交换。
使用场景: 适用于在内容替换前进行最后的检查或操作，如确认是否替换内容、修改内容或处理动画效果等。
20.1. index.html
public/21.swap.html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>
<body>
    <script>
        htmx.on("htmx:beforeSwap", (evt) => {
            console.log("开始Swap");
            console.log(evt.detail.elt);
        })
        htmx.on("htmx:afterSwap", (evt) => {
            console.log("Swap完成");
        })
    </script>
    <button hx-get="/time" hx-target="#target">
        获取时间
    </button>
    <div id="target"></div>
</body>
</html>
21.请求事件
21.1. index.html
public/22.请求事件.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>

<body>
    <script>
        htmx.on("htmx:beforeRequest", (evt) => {
            console.log("htmx:beforeRequest", evt.detail.requestConfig.headers);
        })
        htmx.on("htmx:afterRequest", (evt) => {
            console.log("htmx:afterRequest", evt.detail.xhr.response);
        })
    </script>
    <button hx-get="/time" hx-target="#target">
        获取时间
    </button>
    <div id="target"></div>
</body>

</html>
22.请求失败
功能: htmx:responseError 事件在请求失败时触发，通常是服务器返回非 2xx 状态码时。你可以在这里处理错误，比如显示错误消息或执行重试逻辑。
使用场景: 适用于需要对请求失败进行用户通知或日志记录的情况，确保用户了解请求失败的原因。
22.1. index.html
public/23.请求失败.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>

<body>
    <script>
        htmx.on("htmx:responseError", (evt) => {
            console.log(evt);
            alert("请求失败");
        });
    </script>
    <button hx-get="/times" hx-target="#target">
        获取时间
    </button>
    <div id="target"></div>
</body>

</html>
23.请求拦截器
功能: htmx:configRequest 事件在请求配置阶段触发，允许你动态修改请求的配置，如设置请求头或添加参数。
使用场景: 适用于在请求发送前需要动态添加认证信息或其他自定义配置的场景。
23.1. index.html
public/24.请求拦截器.html

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTMX</title>
    <script src="/htmx.min.js"></script>
</head>

<body>
    <button hx-get="/params" hx-target="#target">
        params
    </button>
    <div id="target"></div>
    <script>
        htmx.on("htmx:configRequest", (evt) => {
            evt.detail.headers["Authorization"] = "Bearer token";
            evt.detail.parameters["version"] = "1.0";
        })
        htmx.logger = function (elt, event, data) {
             console.log(event, data, elt);
        }
    </script>
</body>

</html>
23.2. app.js
app.js

const express = require('express');
const app = express();
const multer = require("multer");
const path = require("path");
const fs = require('fs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('uploads'));
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, './uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });
app.get('/', (req, res) => {
    const directoryPath = path.join(__dirname, 'public');
    fs.readdir(directoryPath, (err, files) => {
        const fileLinks = files.map(file => {
            return `<li><a href="${file}">${file}</a></li>`;
        }).join('');
        res.send(`<ul>${fileLinks} </ul>`);
    });
});
app.get('/get', (req, res) => {
    res.send('GET请求响应');
});
app.post('/post', (req, res) => {
    res.send('POST请求响应');
});
app.get('/time', (req, res) => {
    res.send(`<span>${new Date().toLocaleString()}</span>`);
});
app.get('/trigger_delay', (req, res) => {
    res.send(req.query.q);
});
let timer = 1;
app.get('/load_polling', (req, res) => {
    if (timer++ < 6) {
        res.send(`<div hx-get="/load_polling" hx-trigger="load delay:1s" hx-swap="outerHTML">${".".repeat(timer)}</div>`);
    }
    else {
        res.send('加载完成');
    }
});
app.get('/delay', (req, res) => {
    setTimeout(() => {
        res.send('延迟响应');
    }, 3000);
});
app.post('/payload', (req, res) => {
    const user = req.body;
    user.id = Date.now();
    res.send(`
    <p>用户信息：</p>
    <p>用户名：${user.name}</p>
    <p>邮箱：${user.email}</p>
    `);
});
app.post("/upload", upload.single("file"), async (req, res) => {
    const filePath = req.file.path;
    console.log(filePath);
    res.send(`<b> 上传成功</b>: ${filePath}`);
})
app.get('/files', (req, res) => {
    fs.readdir('./uploads', (err, files) => {
        console.log(files);
        if (err) {
            res.send('读取文件失败');
        } else {
            res.send(files.map(file => (`<li><a href="/${file}">${file}</a></li>`)).join(''));
        }
    });
});
app.get('/firstRequest', (req, res) => {
    setTimeout(() => {
        res.send('firstRequestResponse');
    }, 6000);
});
app.get('/secondRequest', (req, res) => {
    setTimeout(() => {
        res.send('secondRequestResponse');
    }, 3000);
});
app.post('/validate', (req, res) => {
    setTimeout(() => {
        res.send('验证通过');
    }, 6000);
});

app.post('/store', (req, res) => {
    setTimeout(() => {
        res.send('成功保存');
    }, 3000);
});
app.get('/oob', (req, res) => {
    res.send(`
        主要的内容
        <div id="otherTarget" hx-swap-oob="true">其它内容</div>
`);
});
app.get('/select', (req, res) => {
    res.send(`
        <span>主要的内容</span>
        <div id="otherTarget">其它内容</div>
`);
});
app.get('/bigger', (req, res) => {
    res.send(`
      <div id="circle" class="circle" hx-get="http://localhost:1330/bigger" hx-swap="outerHTML" style="width:200px;height:200px;">

    </div>
`);
});

+app.get('/params', (req, res) => {
+   const authorization = req.headers['authorization'];
+   const version = req.query.version;
+   res.send(`authorization: ${authorization}, version: ${version}`);
+});
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
HTMX
htmx 请求类型

hx-get：用于发送 GET 请求。
hx-post：用于发送 POST 请求。
触发器 (Triggers)

hx-trigger="mouseenter once"：在鼠标进入元素时触发，并且只触发一次。
hx-trigger="keyup changed delay:500ms"：在键盘按键抬起或输入变化时触发，且有500毫秒的延迟。
hx-trigger="click[条件]"：基于条件触发（如 click[1==1]，click[ctrlKey]）。
hx-trigger="load"：在页面加载时触发。
hx-trigger="revealed"：当元素在视口中被显示时触发。
hx-trigger="intersect threshold:.5"：当元素与视口相交超过50%时触发。
hx-trigger="every 1s"：每隔1秒触发一次请求。
hx-trigger="load delay:1s"：页面加载后延迟1秒触发请求。
交换类型 (Swap)

hx-swap="outerHTML"：替换整个元素的 HTML。
hx-swap="beforebegin"：在目标元素前插入内容。
hx-swap="afterbegin"：在目标元素内部的第一个子元素之前插入内容。
hx-swap="beforeend"：在目标元素内部的最后一个子元素之后插入内容。
hx-swap="afterend"：在目标元素后插入内容。
hx-swap="delete"：删除目标元素。
hx-swap="none"：不交换内容。
加载指示器 (Indicators)

htmx-indicator：用于显示加载状态的指示器。
hx-indicator：指定自定义的加载指示器元素。
请求配置 (Request Configuration)

hx-encoding="multipart/form-data"：指定请求的编码类型（用于文件上传）。
hx-vals：用于指定发送的数据（可以是 JSON 字符串或 JavaScript 对象）。
hx-include：指定附加的元素数据一起发送。
hx-confirm：在发送请求前显示确认对话框。
hx-sync：控制请求的同步方式（drop、replace、queue）。
事件 (Events)

htmx:beforeRequest：请求发送前触发的事件。
htmx:afterRequest：请求发送后触发的事件。
htmx:beforeSwap：内容交换前触发的事件。
htmx:afterSwap：内容交换后触发的事件。
htmx:responseError：响应错误时触发的事件。
htmx:load：内容加载完成时触发的事件。
htmx:configRequest：配置请求时触发的事件（用于修改请求的 headers 和参数）。
htmx:abort：用于中止请求的事件。
其他功能

hx-target：指定交换内容的目标元素。
hx-select：从响应中选择要替换的内容。
hx-oob（Out of Band）：从响应中替换非目标元素的内容。
htmx.onLoad：在内容加载后执行自定义逻辑。
htmx.trigger：手动触发 htmx 事件（如 htmx:abort 用于取消请求）。
1. htmx 请求类型
1.1 hx-get
功能: hx-get 用于向服务器发送 GET 请求，并将返回的数据加载到指定的目标元素中。GET 请求通常用于从服务器获取数据或页面内容，而不是发送数据。
使用场景: 当你需要从服务器获取信息并将其展示在页面上时，使用 hx-get 是非常合适的选择。例如，加载部分页面内容、获取数据进行展示等。

示例:

<button hx-get="/get">发送GET请求</button>
这段代码创建了一个按钮，点击该按钮时会向 /get 发送一个 GET 请求。服务器返回的响应会被插入到默认目标元素中（通常是按钮所在的元素）。

1.2 hx-post
功能: hx-post 用于向服务器发送 POST 请求。POST 请求通常用于将数据提交给服务器，例如表单数据、用户输入的数据等。与 GET 请求不同，POST 请求通常用于提交数据，而不是获取数据。
使用场景: 在需要将用户数据提交到服务器进行处理时，使用 hx-post 是更合适的选择。POST 请求的内容不会显示在 URL 中，因此更适合提交敏感数据。

示例:

<button hx-post="/post">发送POST请求</button>
这段代码创建了一个按钮，点击时会向 /post 发送一个 POST 请求。服务器的响应将被加载到默认目标元素中。

2. 触发器 (Triggers)
触发器是 htmx 中非常强大的功能，它定义了在特定事件发生时，何时发送请求。触发器可以根据用户的行为、时间间隔、页面加载等事件来触发请求，提供了灵活的交互方式。

2.1 hx-trigger=mouseenter once
功能: mouseenter 触发器会在鼠标移入元素时触发请求。once 确保该请求仅触发一次，即使鼠标多次移入元素，也只会发送一次请求。
使用场景: 这个触发器适用于用户与页面某个元素进行首次交互时，希望加载内容或执行某些操作的场景。例如，用户第一次将鼠标移到某个区域时，动态加载数据或展示内容。

示例:

<button hx-get="/time" hx-trigger="mouseenter once">鼠标移入</button>
当用户第一次将鼠标移入该按钮时，会向 /time 发送一个 GET 请求，且仅触发一次。

2.2 hx-trigger=keyup changed delay:500ms
功能: 这个触发器组合了多个事件和一个延迟器。keyup 在键盘按键抬起时触发，changed 在输入内容变化时触发，delay:500ms 意味着事件触发后会延迟500毫秒再发送请求。
使用场景: 常用于搜索框或需要动态获取数据的输入框中。在用户输入搜索内容时，避免每次按键都立即触发请求，而是等待用户停止输入后再发送请求，从而减少服务器请求次数，优化用户体验。

示例:

<input type="text" name="q" hx-get="/trigger_delay" hx-trigger="keyup changed delay:500ms"
    hx-target="#search-results" placeholder="搜索...">
<div id="search-results"></div>
用户在输入框中键入内容时，系统会等待500毫秒，如果内容发生了变化（用户停止输入），将会发送 GET 请求到 /trigger_delay，并将结果显示在 #search-results 中。

2.3 hx-trigger=click[条件]
功能: 触发器还可以基于条件触发，click[条件] 语法允许你在点击事件发生时根据特定条件判断是否发送请求。例如，可以根据某个表达式的结果来决定是否触发请求。
使用场景: 适用于需要条件判断的场景，例如只在某些特定情况下（如用户按住 Ctrl 键时）才发送请求。

示例:

<div hx-get="/time" hx-trigger="click[1==1]">始终触发请求</div>
<div hx-get="/time" hx-trigger="click[1==2]">永不触发请求</div>
<div hx-get="/time" hx-trigger="click[ctrlKey]">按住Ctrl键点击触发请求</div>
第一个示例始终会触发请求，第二个示例永远不会触发请求，第三个示例只有在按住 Ctrl 键点击时才会触发请求。

2.4 hx-trigger=load
功能: load 触发器会在页面或元素加载完成时触发请求。它用于自动加载内容，而无需用户交互。
使用场景: 常用于需要在页面加载时自动获取内容的场景，如加载页面初始数据、内容自动刷新等。

示例:

<div hx-get="/time" hx-trigger="load">页面加载时触发请求</div>
页面加载时会向 /time 发送一个 GET 请求，将返回的内容插入到该 div 中。

2.5 hx-trigger=revealed
功能: revealed 触发器会在元素进入视口（即元素变得可见）时触发请求。这是基于用户滚动页面时，元素是否被显示来触发的事件。
使用场景: 适用于惰性加载内容的场景，如用户滚动到页面底部时加载更多内容，或者某些元素在用户看到它们时才加载内容。

示例:

<div hx-get="/time" hx-trigger="revealed">当元素被显示时触发请求</div>
当用户滚动页面，直到这个 div 元素出现在视口中时，将会发送 GET 请求并加载内容。

2.6 hx-trigger=intersect threshold:.5
功能: intersect 触发器与 revealed 类似，但它允许更精细的控制。threshold:.5 表示当元素有50%进入视口时触发请求。
使用场景: 在需要基于元素部分可见程度触发请求的场景中使用，例如只有当用户确实关注某个部分时才加载内容。

示例:

<div hx-get="/time" hx-trigger="intersect threshold:.5">当元素50%可见时触发请求</div>
当这个 div 元素有一半可见时，将会触发请求。

2.7 hx-trigger=every 1s
功能: every 1s 触发器会每隔1秒触发一次请求。这是一个循环触发器，通常用于实时更新的场景。
使用场景: 适用于需要定时刷新数据的场景，如实时数据显示、定时更新某个部分内容等。

示例:

<div hx-get="/time" hx-trigger="every 1s">每秒刷新一次内容</div>
这段代码将每隔1秒向 /time 发送 GET 请求，并更新该 div 的内容。

2.8 hx-trigger=load delay:1s
功能: load 触发器与 delay 结合，表示页面加载完成后延迟1秒再触发请求。
使用场景: 在希望延迟加载内容的场景中使用，例如页面加载后稍等一会儿再加载非关键性内容。

示例:

<div hx-get="/load_polling" hx-trigger="load delay:1s" hx-swap="outerHTML">延迟加载内容</div>
这段代码将在页面加载1秒后发送 GET 请求，并将返回内容替换整个 div。

3. 交换类型 (Swap)
交换类型（Swap）是 htmx 中用于控制服务器响应内容如何插入到 DOM 中的机制。通过指定不同的交换类型，你可以精确控制服务器返回的数据如何与现有的页面元素进行融合、替换、或删除。

3.1 hx-swap=outerHTML
功能: outerHTML 交换类型将整个目标元素替换为服务器返回的内容。与 innerHTML 不同，它不仅替换目标元素的内容，还包括目标元素本身。
使用场景: 当你需要彻底替换某个元素及其内容时，使用 outerHTML 是最佳选择。例如，更新整个 div，而不仅是它的内部内容。

示例:

<div hx-get="/time" hx-swap="outerHTML">
    <p>当前内容</p>
</div>
发送 GET 请求后，整个 div 和它的内容都会被替换为服务器返回的新内容。

3.2 hx-swap=beforebegin
功能: beforebegin 交换类型将在目标元素之前插入服务器返回的内容，而目标元素本身不会被替换或移除。
使用场景: 当你需要在现有元素前插入新的内容时，这种交换类型非常有用。

示例:

<div id="target">
    <p>目标元素内容</p>
</div>
<button hx-get="/time" hx-target="#target" hx-swap="beforebegin">在目标元素前插入内容</button>
点击按钮后，新内容会在 #target 元素之前插入。

3.3 hx-swap=afterbegin
功能: afterbegin 交换类型将在目标元素的第一个子元素之前插入服务器返回的内容。这意味着新内容会成为目标元素的第一个子元素。
使用场景: 适用于需要在某个容器（如 div）的开头插入新内容的情况。

示例:

<div id="target">
    <p>目标元素内容</p>
</div>
<button hx-get="/time" hx-target="#target" hx-swap="afterbegin">在目标元素内部的开始处插入内容</button>
点击按钮后，新内容会在 #target 的现有内容之前插入。

3.4 hx-swap=beforeend
功能: beforeend 交换类型将在目标元素的最后一个子元素之后插入服务器返回的内容。这意味着新内容会被添加到目标元素的末尾，但仍在元素内部。
使用场景: 当你希望在某个容器的结尾追加内容时，这种交换类型非常有用。

示例:

<div id="target">
    <p>目标元素内容</p>
</div>
<button hx-get="/time" hx-target="#target" hx-swap="beforeend">在目标元素内部的结尾处插入内容</button>
点击按钮后，新内容会被插入到 #target 的现有内容之后。

3.5 hx-swap=afterend
功能: afterend 交换类型将在目标元素之后插入服务器返回的内容，而目标元素本身不会被替换或移除。
使用场景: 当你需要在现有元素后插入新的内容时，使用 afterend 是理想的选择。

示例:

<div id="target">
    <p>目标元素内容</p>
</div>
<button hx-get="/time" hx-target="#target" hx-swap="afterend">在目标元素后插入内容</button>
点击按钮后，新内容会在 #target 元素之后插入。

3.6 hx-swap=delete
功能: delete 交换类型会删除目标元素，而不会插入任何新的内容。这是一种简洁的方式来从页面中移除元素。
使用场景: 当你需要在用户交互后从页面中移除某个元素时使用，比如删除通知、消息或其他内容。

示例:

<div id="target">
    <p>目标元素内容</p>
</div>
<button hx-get="/time" hx-target="#target" hx-swap="delete">删除目标元素</button>
点击按钮后，#target 元素会被删除。

3.7 hx-swap=none
功能: none 交换类型指示 htmx 不对 DOM 进行任何修改。尽管请求仍然会发送，但服务器返回的内容不会被插入到页面中。
使用场景: 在需要请求服务器，但不希望修改页面内容时使用，比如在后台进行记录或触发其他服务器端动作。

示例:

<button hx-get="/time" hx-swap="none">发送请求但不改变页面内容</button>
点击按钮后，虽然请求会发送，但页面内容不会改变。

3.8 hx-swap-oob
功能

hx-swap-oob 是 htmx 提供的一个特殊功能，用于实现“带外”内容交换。这意味着当服务器返回内容时，该内容可以被插入到页面上与触发请求的元素无关的任何位置，而不是按照常规的方式替换或插入到触发请求的元素或指定的目标元素中。

hx-swap-oob 允许服务器响应包含多个独立片段，这些片段可以根据其自身的 hx-swap-oob 属性直接插入到页面的其他部分。这种机制特别适合复杂页面的部分更新操作，在单次请求中实现多个区域的同时更新。

使用场景

复杂页面更新: 当你需要在一个请求中更新页面的多个部分时，hx-swap-oob 非常有用。例如，用户提交表单后，你可能希望同时更新导航栏、侧边栏和内容区域。
响应中的条件渲染: 服务器可以根据某些条件返回不同的片段，然后将这些片段插入到页面的不同位置，而无需在前端进行大量逻辑判断。
工作原理

在服务器响应中，任何具有 hx-swap-oob 属性的元素都会被解析，并插入到页面上的指定位置，而不需要依赖于触发请求的元素。

示例

假设我们有以下页面结构：

<button hx-get="/update" hx-target="#mainContent">更新内容</button>
<div id="mainContent">
    主内容区域
</div>
<div id="sideBar">
    侧边栏内容
</div>
服务器返回的响应可能是这样：

<div hx-swap-oob="true" id="mainContent">
    更新后的主内容区域
</div>
<div hx-swap-oob="true" id="sideBar">
    更新后的侧边栏内容
</div>
在这个响应中：

hx-swap-oob="true" 表示这个元素应该被插入到页面上，按照其 id 指定的位置（即 mainContent 和 sideBar）。
即使原始请求目标是 #mainContent，响应中带有 hx-swap-oob 的 #sideBar 也会更新页面上的 #sideBar 区域。
使用示例

HTML 代码:

<button hx-get="/update" hx-target="#mainContent">更新内容</button>
<div id="mainContent">
    主内容区域
</div>
<div id="sideBar">
    侧边栏内容
</div>
服务器返回的响应:

<div hx-swap-oob="true" id="mainContent">
    更新后的主内容区域
</div>
<div hx-swap-oob="true" id="sideBar">
    更新后的侧边栏内容
</div>
当用户点击按钮时，页面的主内容区域和侧边栏内容都会同时更新，即使只有一个请求被发出。

总结

hx-swap-oob 是一种非常强大的技术，允许你在不直接依赖于请求触发元素或其指定目标的情况下，更新页面的多个部分。它简化了复杂的页面更新逻辑，特别是在服务器端渲染返回多个独立的内容片段时。通过 hx-swap-oob，你可以实现更复杂、更细粒度的页面更新操作，增强用户体验。

4. 加载指示器 (Indicators)
加载指示器是 htmx 中用来表示正在进行网络请求的元素。它通常用于向用户展示请求的状态（例如“加载中...”），从而提升用户体验，特别是在请求需要较长时间处理的情况下。

4.1 htmx-indicator
功能: htmx-indicator 是一个特殊的 CSS 类，当与元素一起使用时，该元素会在 htmx 发送请求时自动显示，并在请求完成后隐藏。这个类可以用来创建一个简单的加载指示器，比如一个“加载中...”的消息或动画。
使用场景: 常用于按钮或其他触发请求的元素，显示请求正在处理中。

示例:

<button hx-get="/delay">
    发送请求
    <p class="htmx-indicator">加载中...</p>
</button>
在这个示例中，点击按钮后，<p> 元素中的“加载中...”文本会显示，直到请求完成。

4.2 hx-indicator
功能: hx-indicator 属性允许你指定一个自定义的加载指示器元素。与 htmx-indicator 类类似，但它更灵活，因为你可以明确指定哪个元素应作为加载指示器。
使用场景: 适用于需要将加载指示器与触发请求的元素分离，或者希望使用不同样式和位置的加载指示器的情况。

示例:

<button hx-get="/delay" hx-indicator="#my-indicator">
    发送请求
</button>
<p id="my-indicator" class="htmx-indicator">加载中...</p>
在这个示例中，#my-indicator 元素将作为加载指示器，在请求过程中显示“加载中...”文本。

这些指示器有助于用户了解请求的处理状态，避免用户因没有视觉反馈而感到困惑或反复点击按钮。

5. 请求配置 (Request Configuration)
请求配置涉及到如何定制和管理 htmx 发送的请求。通过配置不同的属性，你可以控制请求的数据格式、附加的数据、以及在请求前后的处理方式。

5.1 hx-encoding
功能: hx-encoding 属性用于指定请求的编码类型。multipart/form-data 是常用于文件上传的编码类型，允许表单数据与文件一起上传。
使用场景: 适用于需要上传文件的表单，例如图片上传、文档上传等。

示例:

<form hx-post="/upload" hx-encoding="multipart/form-data">
    <input type="file" name="file">
    <button>上传</button>
</form>
这个表单使用 POST 请求上传文件，并通过 multipart/form-data 进行编码，以确保文件和其他表单字段正确传输到服务器。

5.2 hx-vals
功能: hx-vals 属性允许你在发送请求时附加额外的数据。你可以指定一个 JSON 对象或 JavaScript 表达式，用于动态生成请求数据。
使用场景: 适用于需要动态添加或修改请求数据的场景，如根据用户输入生成 JSON 数据并发送到服务器。

示例:

<button hx-post="/payload" hx-target="#result" hx-vals='{"name":"name","email":"email"}'>发送JSON数据</button>
在这个示例中，hx-vals 指定了一个 JSON 对象，其中包含 name 和 email 两个字段，这些数据将与请求一起发送。

使用 JavaScript 生成数据:

<button hx-post="/payload" hx-target="#result" hx-vals='js:{"name":"name","email":getEmail()}'>发送JS数据</button>
在这个示例中，hx-vals 使用 js: 前缀来执行 JavaScript 代码，将 getEmail() 的返回值作为 email 字段发送。

5.3 hx-include
功能: hx-include 属性允许你指定一个或多个额外的表单元素或 DOM 元素的数据，添加到当前请求中。这些数据可以来自于与当前触发事件的元素无关的其他元素。
使用场景: 适用于在提交请求时需要包括额外的数据源，比如在表单中提交多个字段的数据或从多个输入元素中收集数据。

示例:

<button hx-post="/payload" hx-target="#result" hx-include="#my-name,#my-email">发送包含数据</button>
在这个示例中，按钮点击后，#my-name 和 #my-email 中的数据将会与按钮一起发送到服务器。

5.4 hx-confirm
功能: hx-confirm 属性用于在请求发送之前显示一个确认对话框。用户必须确认操作后，才能实际发送请求。这是一种很好的方式来防止意外操作。
使用场景: 适用于可能产生重要影响的操作，例如删除数据、提交敏感信息等。

示例:

<button hx-post="/payload" hx-confirm="确认要发送吗?">发送数据</button>
当用户点击按钮时，会弹出一个确认对话框，询问用户是否要发送请求。如果用户确认，才会实际发送请求。

5.5 hx-sync
功能: hx-sync 属性用于控制多个请求之间的同步方式。你可以定义请求是应当被丢弃（drop）、替换（replace）、还是排队等待（queue）。
使用场景: 适用于需要协调多个异步请求的场景，例如一个请求尚未完成时，决定如何处理后续请求。

示例:

<button id="firstRequest" hx-get="/firstRequest" hx-target="#result1">第一个请求</button>
<button hx-get="/secondRequest" hx-target="#result2" hx-sync="#firstRequest:queue">队列中的第二个请求</button>
在这个示例中，hx-sync 确保第二个请求在第一个请求完成后才会发送。请求被排队等待，而不是立即发送。

6. 事件 (Events)
htmx 提供了丰富的事件系统，允许你在请求的不同阶段进行自定义处理。这些事件让你能够在请求发送前、响应接收后以及内容交换前后执行特定的逻辑，从而实现更精细的控制。

6.1 htmx:beforeRequest
功能: htmx:beforeRequest 事件在请求发送前触发，允许你在请求发送之前对请求进行最后的修改或检查。
使用场景: 适用于在请求发送前动态修改请求参数或头信息，或者执行一些验证逻辑。

示例:

htmx.on("htmx:beforeRequest", (evt) => {
    console.log("htmx:beforeRequest", evt.detail.requestConfig.headers);
});
这个事件处理程序会在请求发送前打印出请求的头信息，允许你检查或修改这些信息。

6.2 htmx:afterRequest
功能: htmx:afterRequest 事件在请求完成后触发，无论请求成功还是失败。它允许你在收到响应后进行处理，例如记录响应数据、更新页面元素等。
使用场景: 适用于在请求完成后对响应进行处理，比如解析返回的数据、更新页面、或者进行后续操作。

示例:

htmx.on("htmx:afterRequest", (evt) => {
    console.log("htmx:afterRequest", evt.detail.xhr.response);
});
这个事件处理程序会在请求完成后打印出服务器的响应内容，允许你根据返回的数据进行进一步的操作。

6.3 htmx:beforeSwap
功能: htmx:beforeSwap 事件在服务器返回的数据即将被插入到页面之前触发。你可以在这里检查或修改即将插入的内容，甚至可以取消交换。
使用场景: 适用于在内容替换前进行最后的检查或操作，如确认是否替换内容、修改内容或处理动画效果等。

示例:

htmx.on("htmx:beforeSwap", (evt) => {
    console.log("即将开始Swap");
    console.log(evt.detail.elt); // 即将被替换的元素
});
在这个示例中，htmx:beforeSwap 事件触发时，你可以看到即将被替换的元素，并可以根据需要进行修改或取消替换。

6.4 htmx:afterSwap
功能: htmx:afterSwap 事件在内容成功插入或替换到页面后触发。你可以在这里执行后续的操作，比如更新 UI 或触发其他事件。
使用场景: 适用于在内容替换完成后进行后续处理，如启动动画、更新其他相关部分的内容或记录日志。

示例:

htmx.on("htmx:afterSwap", (evt) => {
    console.log("Swap完成");
    console.log(evt.detail.elt); // 新插入或替换的元素
});
这个示例展示了如何在内容替换完成后获取并处理新插入的元素。

6.5 htmx:responseError
功能: htmx:responseError 事件在请求失败时触发，通常是服务器返回非 2xx 状态码时。你可以在这里处理错误，比如显示错误消息或执行重试逻辑。
使用场景: 适用于需要对请求失败进行用户通知或日志记录的情况，确保用户了解请求失败的原因。

示例:

htmx.on("htmx:responseError", (evt) => {
    console.log("请求失败", evt);
    alert("请求失败，请稍后重试。");
});
当请求失败时，这个事件处理程序会弹出一个警告框，通知用户请求未成功。

6.6 htmx:load
功能: htmx:load 事件在新内容加载并插入 DOM 后触发。它允许你在新内容可用时执行操作，如初始化新的交互或绑定事件。
使用场景: 适用于需要在新内容加载后进行初始化操作的场景，例如绑定事件处理程序或应用新的样式。

示例:

htmx.on("htmx:load", (event) => {
    console.log('新内容已加载', event);
});
在这个示例中，每当 htmx 加载并插入新内容时，事件处理程序会打印出一条消息。

6.7 htmx:configRequest
功能: htmx:configRequest 事件在请求配置阶段触发，允许你动态修改请求的配置，如设置请求头或添加参数。
使用场景: 适用于在请求发送前需要动态添加认证信息或其他自定义配置的场景。

示例:

htmx.on("htmx:configRequest", (evt) => {
    evt.detail.headers["Authorization"] = "Bearer token";
    evt.detail.parameters["version"] = "1.0";
});
这个示例展示了如何在请求发送前动态添加 Authorization 头和 version 参数。

6.8 htmx:abort
功能: htmx:abort 事件用于中止正在进行的请求。当你需要取消一个正在进行的异步请求时，可以使用这个事件。
使用场景: 适用于需要用户能够主动取消长时间运行的请求的场景，例如取消数据加载或上传。

示例:

<button type="button" id="requestButton" hx-get="/delay">发送请求</button>
<button type="button" onclick="htmx.trigger('#requestButton', 'htmx:abort')">取消请求</button>
在这个示例中，点击“取消请求”按钮时，会中止通过 #requestButton 触发的请求。

7. 其他功能 (Other Features)
htmx 除了前面提到的核心功能，还提供了一些其他有用的特性，这些特性可以帮助你实现更复杂的交互和行为。

7.1 hx-target
功能: hx-target 属性用于指定服务器响应内容的插入位置。默认情况下，htmx 会将响应内容插入触发请求的元素中，而使用 hx-target 你可以指定其他元素作为目标。
使用场景: 适用于希望将响应内容插入到特定的 DOM 元素中，而不是触发请求的元素本身的情况。例如，使用按钮触发请求，并将结果显示在不同的位置。

示例:

<button hx-get="/time" hx-target="#result">获取时间</button>
<div id="result"></div>
点击按钮时，hx-get 会触发请求，响应内容会插入到 #result 元素中，而不是按钮自身。

7.2 hx-select
功能: hx-select 属性允许你从服务器响应中选择特定部分内容进行插入，而不是插入整个响应内容。你可以使用 CSS 选择器指定需要插入的部分。
使用场景: 适用于服务器响应包含多个部分，但你只想插入其中一部分内容的情况。例如，从复杂的响应中提取特定的内容片段。

示例:

<button hx-get="/select" hx-target="#mainTarget" hx-select="#otherTarget">加载特定内容</button>
<div id="mainTarget">主要目标</div>
<div id="otherTarget">次要目标</div>
这个示例中，hx-select 指定了 #otherTarget 作为插入的内容，即服务器响应中的 #otherTarget 元素内容将被插入到 #mainTarget 中。

7.3 hx-oob (Out of Band)
功能: hx-oob 属性允许你从服务器响应中插入内容到非目标元素（即触发请求的元素或其指定的 hx-target 之外的元素）。这种“带外”插入方式非常灵活，适合在需要更新多个页面部分时使用。
使用场景: 适用于一个请求需要同时更新多个部分的页面内容。例如，一个请求返回多个片段，分别更新不同的区域。

示例:

<button hx-get="/oob" hx-target="#mainTarget">加载内容</button>
<div id="mainTarget">主要目标</div>
<div id="otherTarget" hx-oob></div>
在这个示例中，响应可能包含一个 hx-oob 标记的片段，虽然 hx-target 指向 #mainTarget，但 hx-oob 可以让内容插入 #otherTarget。

7.4 htmx.onLoad
功能: htmx.onLoad 是一个用于在新内容加载并插入 DOM 后执行自定义逻辑的事件处理器。这类似于前面提到的 htmx:load 事件，但更直接，适合在需要对新内容进行初始化或进一步处理时使用。
使用场景: 适用于需要在新内容加载后立即执行操作的场景，比如绑定事件处理程序、初始化插件等。

示例:

htmx.onLoad((target) => {
    console.log('新内容已加载', target);
});
这个示例展示了如何在新内容加载到 DOM 后执行操作，target 是新插入的元素。

7.5 htmx.trigger
功能: htmx.trigger 允许你手动触发一个 htmx 事件。这对于需要程序化地触发事件（例如中止请求、手动执行特定操作）非常有用。
使用场景: 适用于需要在用户操作之外的场景中触发 htmx 行为，如自动化测试或根据其他逻辑触发请求。

示例:

<button type="button" id="requestButton" hx-get="/delay">发送请求</button>
<button type="button" onclick="htmx.trigger('#requestButton', 'htmx:abort')">取消请求</button>
在这个示例中，通过点击第二个按钮，htmx.trigger 手动触发 htmx:abort 事件，从而取消第一个按钮的请求。