---

### ✅ 一、PM2 简介

PM2 是一个 Node.js 应用的进程管理器，支持：

- 自动重启崩溃的进程  
- 多进程负载均衡（集群模式）  
- 日志管理与监控  
- 零停机重载（reload）  
- 开机自启等

---

### ✅ 二、安装 PM2

确保你已安装 Node.js 和 npm，然后执行：

```bash
npm install pm2 -g
```

验证安装：

```bash
pm2 -v
```

---

### ✅ 三、基础使用

#### 1. 启动应用

```bash
pm2 start app.js
```

指定名称：

```bash
pm2 start app.js --name my-api
```

#### 2. 查看运行中的应用

```bash
pm2 list
```

#### 3. 停止/重启/删除

```bash
pm2 stop my-api
pm2 restart my-api
pm2 delete my-api
```

#### 4. 查看日志

```bash
pm2 logs my-api
```

---

### ✅ 四、高级功能

#### 1. 集群模式（多核 CPU）

```bash
pm2 start app.js -i max --name api
```

`-i max` 表示使用所有 CPU 核心。

#### 2. 使用配置文件（推荐）

创建 `ecosystem.config.js`：

```js
module.exports = {
  apps: [{
    name: 'api',
    script: './app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

启动：

```bash
pm2 start ecosystem.config.js
```

重载配置（零停机）：

```bash
pm2 reload ecosystem.config.js
```

---

### ✅ 五、常用命令速查

| 功能         | 命令                         |
|--------------|------------------------------|
| 查看列表     | `pm2 list`                   |
| 查看详情     | `pm2 show api`               |
| 查看监控     | `pm2 monit`                  |
| 日志管理     | `pm2 logs api`               |
| 保存当前列表 | `pm2 save`                   |
| 设置开机自启 | `pm2 startup`（需 sudo）     |
| 安装插件     | `pm2 install pm2-logrotate`  |

---

### ✅ 六、日志管理与开机自启

#### 日志轮转（防止磁盘爆满）

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 10
```

#### 设置开机自启（Linux）

```bash
pm2 startup
pm2 save
```

---

### ✅ 七、总结

PM2 是 Node.js 生产部署的利器，尤其适合：

- 单服务器部署  
- 多进程负载均衡  
- 零停机更新  
- 自动重启与日志管理  

如果你还没用 PM2，强烈建议现在就开始！

---

参考资源：

- [PM2 安装与使用教程（博客园）](http://cnblogs.com/keweai/p/18718532)  
- [PM2 使用方法详解（CSDN）](http://blog.csdn.net/qq_42306443/article/details/89386524)  
- [PM2 官方文档](https://pm2.keymetrics.io/)

