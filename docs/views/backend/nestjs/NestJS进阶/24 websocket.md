## 1.创建项目
```shell
nest new nest-ws
npm install --save @nestjs/websockets @nestjs/platform-socket.io
```
## 2.客户端连接
### 2.1. message.module.ts
src/message/message.module.ts
```js
// 从 @nestjs/common 导入 Module 装饰器
import { Module } from '@nestjs/common';
// 从本地文件导入 MessageGateway，这个类负责处理 WebSocket 事件
import { MessageGateway } from './message.gateway';
// 使用 @Module 装饰器定义一个模块
@Module({
  // 在 providers 数组中注册 MessageGateway，表示该模块提供 MessageGateway 服务
  providers: [MessageGateway],
})
// 定义并导出 MessageModule 类，代表消息模块
export class MessageModule { }
```
### 2.2. message.gateway.ts
src/message/message.gateway.ts
```js
// 导入 WebSocketGateway 和 WebSocketServer 装饰器，用于声明 WebSocket 网关
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
// 导入 Socket.IO 的 Server 类型，用于定义 server 实例
import { Server } from 'socket.io';
// 使用 @WebSocketGateway 装饰器声明一个 WebSocket 网关类
@WebSocketGateway()
export class MessageGateway {
    // 使用 @WebSocketServer 装饰器来注入 Socket.IO 的 Server 实例
    @WebSocketServer()
    server: Server;  // Server 实例，用于处理 WebSocket 连接和事件
}
```
### 2.3. app.module.ts
src/app.module.ts
```js
import { Module } from '@nestjs/common';
+import { MessageModule } from './message/message.module';
@Module({
+ imports: [MessageModule],
+ controllers: [],
+ providers: [],
})
+export class AppModule { }
```
### 2.4. main.ts
src/main.ts
```js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
+import { NestExpressApplication } from '@nestjs/platform-express';
async function bootstrap() {
+ const app = await NestFactory.create<NestExpressApplication>(AppModule);
+ app.useStaticAssets('public');
  await app.listen(3000);
}
bootstrap();
```
### 2.5. index.html
public/index.html
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>聊天室</title>
    <link href="https://static.docs-hub.com/bootstrapmin_1726934364785.css" rel="stylesheet">
    <script src="https://static.docs-hub.com/jquery360min_1726934373776.js"></script>
    <script src="https://static.docs-hub.com/socketiomin_1726934381484.js"></script>
</head>

<body>
    <script>
        const socket = io('http://localhost:3000');
        socket.on('connect', () => {
            console.log('已连接到服务器');
        });
    </script>
</body>

</html>
```
### 2.6. .eslintrc.js
.eslintrc.js
```js
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
```
## 3.用户登录
### 3.1. message.gateway.ts
src/message/message.gateway.ts
```js
+import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
+import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class MessageGateway {
    @WebSocketServer()
    server: Server;
+
+   @SubscribeMessage('userJoined')
+   handleUserJoined(@MessageBody() data: { username: string }, @ConnectedSocket() client: Socket) {
+       client.data.username = data.username;
+       this.server.emit('userJoined', { username: data.username });
+   }
}
```
### 3.2. index.html
public/index.html
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>聊天室</title>
+   <link href="https://static.docs-hub.com/bootstrapmin_1726934364785.css" rel="stylesheet">
+   <script src="https://static.docs-hub.com/jquery360min_1726934373776.js"></script>
+   <script src="https://static.docs-hub.com/socketiomin_1726934381484.js"></script>
</head>

<body>
+   <div class="container">
+       <h1 class="mt-5 text-center">聊天室</h1>
+       <div id="loginForm" class="my-4">
+           <div class="mb-3">
+               <label for="username" class="form-label">用户名</label>
+               <input type="text" class="form-control" id="username" placeholder="请输入用户名">
+           </div>
+           <button id="loginBtn" class="btn btn-primary">登录</button>
+       </div>
+       <div id="chatWindow" class="d-none">
+           <div class="card">
+               <div class="card-header">
+                   聊天消息
+                   <span class="float-end">
+                       当前用户: <strong id="currentUsername"></strong>
+                   </span>
+               </div>
+               <div class="card-body" id="messages" style="height: 300px; overflow-y: scroll;">
+
+               </div>
+               <div class="card-footer">
+                   <div class="input-group">
+                       <input type="text" class="form-control" id="messageInput" placeholder="输入消息">
+                       <button class="btn btn-primary" id="sendMessageBtn">发送</button>
+                   </div>
+               </div>
+           </div>
+       </div>
+   </div>
    <script>
+       $('#loginBtn').on('click', () => {
+           const username = $('#username').val();
+           if (!username) {
+               alert('请输入用户名');
+               return;
+           }
+           $('#currentUsername').text(username);
+           $('#chatWindow').removeClass('d-none');
+           $('#loginForm').hide();
+           const socket = io();
+           socket.on('userJoined', (data) => {
+               const messageElement = $('<div>').text(`系统消息: ${data.username} 加入了聊天室`);
+               $('#messages').append(messageElement);
+           });
+           socket.on('connect', () => {
+               console.log('已连接到服务器');
+               socket.emit('userJoined', { username });
+           });
        });
    </script>
</body>

</html>
```
## 4.发送消息
### 4.1. message.gateway.ts
src/message/message.gateway.ts
```js
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class MessageGateway {
    @WebSocketServer()
    server: Server;
    @SubscribeMessage('userJoined')
    handleUserJoined(@MessageBody() data: { username: string }, @ConnectedSocket() client: Socket) {
        client.data.username = data.username;
        this.server.emit('userJoined', { username: data.username });
    }
+   @SubscribeMessage('createMessage')
+   handleMessage(@MessageBody() createMessageDto: { username: string, message: string }) {
+       this.server.emit('message', createMessageDto);
+   }
}
```
### 4.2. index.html
public/index.html
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>聊天室</title>
    <link href="https://static.docs-hub.com/bootstrapmin_1726934364785.css" rel="stylesheet">
    <script src="https://static.docs-hub.com/jquery360min_1726934373776.js"></script>
    <script src="https://static.docs-hub.com/socketiomin_1726934381484.js"></script>
</head>

<body>
    <div class="container">
        <h1 class="mt-5 text-center">聊天室</h1>
        <div id="loginForm" class="my-4">
            <div class="mb-3">
                <label for="username" class="form-label">用户名</label>
                <input type="text" class="form-control" id="username" placeholder="请输入用户名">
            </div>
            <button id="loginBtn" class="btn btn-primary">登录</button>
        </div>
        <div id="chatWindow" class="d-none">
            <div class="card">
                <div class="card-header">
                    聊天消息
                    <span class="float-end">
                        当前用户: <strong id="currentUsername"></strong>
                    </span>
                </div>
                <div class="card-body" id="messages" style="height: 300px; overflow-y: scroll;">

                </div>
                <div class="card-footer">
                    <div class="input-group">
                        <input type="text" class="form-control" id="messageInput" placeholder="输入消息">
                        <button class="btn btn-primary" id="sendMessageBtn">发送</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
+       let username = '';
+       let socket = null;
        $('#loginBtn').on('click', () => {
+           username = $('#username').val();
            if (!username) {
                alert('请输入用户名');
                return;
            }
            $('#currentUsername').text(username);
            $('#chatWindow').removeClass('d-none');
            $('#loginForm').hide();
+           socket = io();
            socket.on('userJoined', (data) => {
                const messageElement = $('<div>').text(`系统消息: ${data.username} 加入了聊天室`);
                $('#messages').append(messageElement);
            });
            socket.on('connect', () => {
                console.log('已连接到服务器');
                socket.emit('userJoined', { username });
            });
+           socket.on('message', (messageData) => {
+               const messageElement = $('<div>').text(`${messageData.username}: ${messageData.message}`);
+               $('#messages').append(messageElement);
+           });
+       });
+       $('#sendMessageBtn').on('click', () => {
+           const message = $('#messageInput').val();
+           if (message && socket && username) {
+               const messageData = { username, message };
+               socket.emit('createMessage', messageData);
+               $('#messageInput').val('');
+           }
        });
    </script>
</body>
</html>
```
## 5.私聊
### 5.1. create-message.dto.ts
src/message/create-message.dto.ts
```js
export class CreateMessageDto {
    username: string
    message: string
    recipient?: string
}
```
### 5.2. message.gateway.ts
src/message/message.gateway.ts
```js
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
+import { CreateMessageDto } from './create-message.dto';

@WebSocketGateway()
export class MessageGateway {
    @WebSocketServer()
    server: Server;
    @SubscribeMessage('userJoined')
    handleUserJoined(@MessageBody() data: { username: string }, @ConnectedSocket() client: Socket) {
        client.data.username = data.username;
        this.server.emit('userJoined', { username: data.username });
    }
    @SubscribeMessage('createMessage')
+   handleMessage(@MessageBody() createMessageDto: CreateMessageDto) {
+       const { username, message, recipient } = createMessageDto;
+       if (recipient) {
+           const recipientSocket = Array.from(this.server.sockets.sockets.values())
+               .find((socket) => socket.data.username === recipient);
+           if (recipientSocket) {
+               recipientSocket.emit('message', { username, message });
+           }
+       } else {
+           this.server.emit('message', createMessageDto);
+       }
    }
}
```
### 5.3. index.html
public/index.html
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>聊天室</title>
    <link href="https://static.docs-hub.com/bootstrapmin_1726934364785.css" rel="stylesheet">
    <script src="https://static.docs-hub.com/jquery360min_1726934373776.js"></script>
    <script src="https://static.docs-hub.com/socketiomin_1726934381484.js"></script>
</head>

<body>
    <div class="container">
        <h1 class="mt-5 text-center">聊天室</h1>
        <div id="loginForm" class="my-4">
            <div class="mb-3">
                <label for="username" class="form-label">用户名</label>
                <input type="text" class="form-control" id="username" placeholder="请输入用户名">
            </div>
            <button id="loginBtn" class="btn btn-primary">登录</button>
        </div>
        <div id="chatWindow" class="d-none">
            <div class="card">
                <div class="card-header">
                    聊天消息
                    <span class="float-end">
                        当前用户: <strong id="currentUsername"></strong>
                    </span>
                </div>
                <div class="card-body" id="messages" style="height: 300px; overflow-y: scroll;">

                </div>
                <div class="card-footer">
                    <div class="input-group">
                        <input type="text" class="form-control" id="messageInput" placeholder="输入消息">
                        <button class="btn btn-primary" id="sendMessageBtn">发送</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        let username = '';
        let socket = null;
        $('#loginBtn').on('click', () => {
            username = $('#username').val();
            if (!username) {
                alert('请输入用户名');
                return;
            }
            $('#currentUsername').text(username);
            $('#chatWindow').removeClass('d-none');
            $('#loginForm').hide();
            socket = io();
            socket.on('userJoined', (data) => {
                const messageElement = $('<div>').text(`系统消息: ${data.username} 加入了聊天室`);
                $('#messages').append(messageElement);
            });
            socket.on('connect', () => {
                console.log('已连接到服务器');
                socket.emit('userJoined', { username });
            });
            socket.on('message', (messageData) => {
                const messageElement = $('<div>').text(`${messageData.username}: ${messageData.message}`);
                $('#messages').append(messageElement);
            });
        });
        $('#sendMessageBtn').on('click', () => {
            const message = $('#messageInput').val();
            if (message && socket && username) {
+               let recipient = null;
+               let actualMessage = message;
+               const atIndex = message.indexOf('@');
+               if (atIndex !== -1) {
+                   const endOfUsername = message.indexOf(' ', atIndex);
+                   const recipient = message.substring(atIndex + 1, endOfUsername);
+                   actualMessage = message.substring(endOfUsername + 1);
+               }
+               socket.emit('createMessage', { username, message: actualMessage, recipient });
                $('#messageInput').val('');
            }
        });
    </script>
</body>
</html>
```
## 6.群聊
### 6.1. create-room.dto.ts
src/message/create-room.dto.ts
```js
export class CreateRoomDto {
    roomName: string;
}
```
### 6.2. join-room.dto.ts
src/message/join-room.dto.ts
```js
export class JoinRoomDto {
    room: string
    username: string
}
```
### 6.3. create-message.dto.ts
src/message/create-message.dto.ts
```js
export class CreateMessageDto {
    username: string
    message: string
    recipient?: string
+   room?: string;
}
```
### 6.4. message.gateway.ts
src/message/message.gateway.ts
```js
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from './create-message.dto';
+import { CreateRoomDto } from './create-room.dto';
+import { JoinRoomDto } from './join-room.dto';
@WebSocketGateway()
export class MessageGateway {
    @WebSocketServer()
    server: Server;
+   private rooms: Set<string> = new Set();
+
    @SubscribeMessage('userJoined')
    handleUserJoined(@MessageBody() data: { username: string }, @ConnectedSocket() client: Socket) {
        client.data.username = data.username;
        this.server.emit('userJoined', { username: data.username });
    }
    @SubscribeMessage('createMessage')
    handleMessage(@MessageBody() createMessageDto: CreateMessageDto) {
+       const { username, message, recipient, room } = createMessageDto;
        if (recipient) {
            const recipientSocket = Array.from(this.server.sockets.sockets.values())
+               .find((socket) => {
+                   return socket.data.username === recipient
+               });
            if (recipientSocket) {
                recipientSocket.emit('message', { username, message });
            }
+       } else if (room) {
+           this.server.to(room).emit('message', { username, message });
        } else {
            this.server.emit('message', createMessageDto);
        }
    }
+
+   @SubscribeMessage('createRoom')
+   handleCreateRoom(@MessageBody() createRoomDto: CreateRoomDto) {
+       const { roomName } = createRoomDto;
+       if (!this.rooms.has(roomName)) {
+           this.rooms.add(roomName);
+           this.server.emit('roomList', Array.from(this.rooms));
+       }
+   }
+   @SubscribeMessage('joinRoom')
+   handleJoinRoom(@MessageBody() data: JoinRoomDto, @ConnectedSocket() client: Socket) {
+       const { room, username } = data;
+       client.join(room);
+       client.data.username = username;
+       this.server.to(room).emit('userJoinedRoom', { username: client.data.username, room });
+   }
+
+   @SubscribeMessage('requestRooms')
+   handleRequestRooms(@ConnectedSocket() client: Socket) {
+       client.emit('roomList', Array.from(this.rooms));
+   }
}
```
### 6.5. index.html
public/index.html
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>聊天室</title>
    <link href="https://static.docs-hub.com/bootstrapmin_1726934364785.css" rel="stylesheet">
    <script src="https://static.docs-hub.com/jquery360min_1726934373776.js"></script>
    <script src="https://static.docs-hub.com/socketiomin_1726934381484.js"></script>
</head>

<body>
    <div class="container">
        <h1 class="mt-5 text-center">聊天室</h1>
        <div id="loginForm" class="my-4">
            <div class="mb-3">
                <label for="username" class="form-label">用户名</label>
                <input type="text" class="form-control" id="username" placeholder="请输入用户名">
            </div>
            <button id="loginBtn" class="btn btn-primary">登录</button>
        </div>
+       <div id="roomSection" class="d-none">
+           <h3>房间列表</h3>
+           <ul id="roomList" class="list-group mb-3">
+           </ul>
+           <div class="mb-3">
+               <label for="roomName" class="form-label">创建房间</label>
+               <input type="text" class="form-control" id="roomName" placeholder="请输入房间名">
+           </div>
+           <button id="createRoomBtn" class="btn btn-success">创建房间</button>
+       </div>
        <div id="chatWindow" class="d-none">
            <div class="card">
                <div class="card-header">
                    聊天消息
                    <span class="float-end">
                        当前用户: <strong id="currentUsername"></strong>
+                       <span id="currentRoomInfo"> | 房间: <strong id="currentRoom"></strong></span>
                    </span>
                </div>
                <div class="card-body" id="messages" style="height: 300px; overflow-y: scroll;">

                </div>
                <div class="card-footer">
                    <div class="input-group">
                        <input type="text" class="form-control" id="messageInput" placeholder="输入消息">
                        <button class="btn btn-primary" id="sendMessageBtn">发送</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        let username = '';
        let socket = null;
+       let room = '';
        $('#loginBtn').on('click', () => {
            username = $('#username').val();
            if (!username) {
                alert('请输入用户名');
                return;
            }
            $('#currentUsername').text(username);
+           $('#roomSection').removeClass('d-none');
            $('#loginForm').hide();
+           socket = io('http://localhost:3000');
            socket.on('userJoined', (data) => {
                const messageElement = $('<div>').text(`系统消息: ${data.username} 加入了聊天室`);
                $('#messages').append(messageElement);
            });
            socket.on('connect', () => {
                console.log('已连接到服务器');
+               socket.emit('requestRooms');
                socket.emit('userJoined', { username });
            });
            socket.on('message', (messageData) => {
+               console.log('messageData', messageData);
                const messageElement = $('<div>').text(`${messageData.username}: ${messageData.message}`);
                $('#messages').append(messageElement);
            });
+           socket.on('roomList', (rooms) => {
+               $('#roomList').empty();
+               rooms.forEach((room) => {
+                   const roomElement = $('<li>').addClass('list-group-item').text(room);
+                   roomElement.on('click', () => joinRoom(room));
+                   $('#roomList').append(roomElement);
+               });
+           });
        });
+       function joinRoom(roomName) {
+           room = roomName;
+           $('#roomSection').addClass('d-none');
+           $('#chatWindow').removeClass('d-none');
+           $('#currentRoom').text(roomName);
+           $('#currentRoomInfo').show();
+           socket.emit('joinRoom', { room, username });
+       }
        $('#sendMessageBtn').on('click', () => {
            const message = $('#messageInput').val();
+           if (!room) {
+               alert('请先加入房间');
+               return;
+           }
+           if (message && socket && username && room) {
                let recipient = null;
                let actualMessage = message;
                const atIndex = message.indexOf('@');
                if (atIndex !== -1) {
                    const endOfUsername = message.indexOf(' ', atIndex);
+                   recipient = message.substring(atIndex + 1, endOfUsername);
                    actualMessage = message.substring(endOfUsername + 1);
                }
+               console.log({ username, message: actualMessage, recipient, room });
+               socket.emit('createMessage', { username, message: actualMessage, recipient, room });
                $('#messageInput').val('');
            }
        });
+       $('#createRoomBtn').on('click', () => {
+           const roomName = $('#roomName').val();
+           if (roomName) {
+               socket.emit('createRoom', { roomName });
+               $('#roomName').val('');
+           }
+       });
+       window.addEventListener('beforeunload', () => {
+           if (socket) {
+               socket.disconnect();
+           }
+       });
    </script>
</body>
</html>
```
## 1. WebSocket
### 什么是 WebSocket？
`WebSocket` 是一种全双工的通信协议，允许客户端和服务器之间建立持久连接，以实现实时、低延迟的双向数据传输。与传统的 HTTP 请求-响应模型不同，WebSocket 使得客户端和服务器都可以随时发送和接收数据，而无需反复建立和关闭连接。

### 1.1 WebSocket 的工作原理
+ **连接建立**：

+ WebSocket 连接是通过一个初始的 HTTP 请求（称为“握手”请求）建立的。客户端通过发送一个带有特殊头部的 HTTP 请求来请求 WebSocket 连接。
+ 服务器收到请求后，如果同意建立 WebSocket 连接，会返回一个 101 状态码，表示协议切换成功。之后，这个 HTTP 连接会被升级为 WebSocket 连接，客户端和服务器可以进行双向通信。
+ **双向通信**：

+ 在 WebSocket 连接建立后，客户端和服务器之间的通信不再遵循传统的 HTTP 请求-响应模式。服务器和客户端可以在任意时间向对方发送数据，且数据是即时传输的。
+ **持续连接**：

+ WebSocket 连接是持续的，除非客户端或服务器主动断开，否则这个连接会一直保持有效。这种持续的双向通信非常适合需要频繁数据更新的应用场景，如聊天、在线游戏、股票行情等。
+ **数据格式**：

+ WebSocket 发送的数据可以是文本数据（通常为 JSON 格式）或二进制数据（如 ArrayBuffer、Blob 等）。
+ WebSocket 协议支持轻量的帧（frame）结构，在传输数据时不需要每次都携带完整的 HTTP 头部信息，这使得它比传统的长轮询（long polling）等技术更加高效。
### 1.2 WebSocket 的优势
+ **全双工通信**：客户端和服务器可以同时发送和接收消息，无需等待对方响应。

+ **低延迟**：由于 WebSocket 是持久连接，一旦连接建立，数据可以即时传输，无需每次都建立新的连接，避免了 HTTP 请求的开销。

+ **减少带宽消耗**：WebSocket 数据帧的头部非常小，相比于每次都发送完整的 HTTP 请求和响应，WebSocket 协议的开销更低。

+ **实时性强**：WebSocket 允许实时通信，特别适合需要实时更新的应用，如聊天应用、在线游戏、股票行情推送等。

### 1.3 WebSocket 和 HTTP 的区别
| 特性 | WebSocket | HTTP |
|------|-----------|-----|
| 通信方式 | 双向（全双工） | 单向（请求-响应） |
| 连接方式 | 持久连接 | 短连接，每次请求重新建立 |
| 数据帧开销 | 轻量，头部较小 | 每次请求需携带完整的 HTTP 头部 |
| 适用场景 | 实时通信、低延迟场景 | 适用于一次性请求-响应的场景 |
| 数据发送方向 | 客户端和服务器都可以主动发送数据 | 服务器只能响应客户端的请求 |

### 1.4 WebSocket 的应用场景
+ **即时通讯**：如聊天应用（WhatsApp、微信）、支持多人在线的聊天室。
+ **在线游戏**：游戏客户端和服务器需要频繁交换实时数据，比如多人在线游戏中的玩家动作、状态更新等。
+ **实时金融数据**：如股票、加密货币交易平台，可以通过 WebSocket 实时推送价格变化、订单成交等数据。
+ **协作工具**：如多人在线文档编辑，所有用户的操作实时同步。
+ **物联网（IoT）**：传感器和服务器之间的实时数据交换，如智能家居系统。
+ **视频流媒体**：虽然 WebSocket 通常不直接用于传输大规模的视频数据，但在控制视频播放、实时聊天和互动等场景中非常有用。
### 1.5 WebSocket 客户端和服务器的示例
#### 1.5.1 客户端（浏览器端）的 WebSocket 示例
```js
// 创建 WebSocket 连接
const socket = new WebSocket('ws://localhost:8080');

// 连接成功时的回调
socket.onopen = function (event) {
  console.log('WebSocket 连接已打开');
  // 发送消息到服务器
  socket.send('Hello Server');
};

// 收到服务器消息时的回调
socket.onmessage = function (event) {
  console.log('服务器消息:', event.data);
};

// 连接关闭时的回调
socket.onclose = function (event) {
  console.log('WebSocket 连接已关闭');
};

// 连接出错时的回调
socket.onerror = function (error) {
  console.log('WebSocket 错误:', error);
};
```
#### 1.5.2 服务器端的 WebSocket 示例（基于 Node.js 和 ws 库）
```js
const WebSocket = require('ws');

// 创建 WebSocket 服务器，监听端口 8080
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('客户端已连接');

  // 监听客户端发送的消息
  ws.on('message', (message) => {
    console.log('收到客户端消息:', message);

    // 发送消息给客户端
    ws.send('Hello Client');
  });

  // 监听连接关闭事件
  ws.on('close', () => {
    console.log('客户端已断开连接');
  });
});
```
### 1.6 WebSocket 与其他技术的对比
+ **与 HTTP 长轮询**：

+ 长轮询是一种模拟“实时”通信的技术，客户端通过定期发送 HTTP 请求来获取服务器的更新。相比之下，WebSocket 是真正的实时双向通信，不需要频繁发送请求，效率更高。
+ **与 Server-Sent Events (SSE)**：

+ SSE 只支持服务器向客户端的单向推送，无法实现客户端向服务器的双向通信。而 WebSocket 支持双向通信，适用于更多场景。
### 1.7 小结
WebSocket 是一种强大的通信协议，适用于需要实时、低延迟的应用场景。它提供了全双工的通信模型，并且能够显著减少网络通信的开销，是现代网络应用（如在线游戏、实时聊天、金融市场等）中不可或缺的技术。

## 2.Socket.IO
`Socket.IO `是一个基于事件驱动的实时双向通信库，常用于实现服务器与客户端之间的实时数据传输。它通常用于像聊天室、实时数据更新、在线游戏等需要即时通信的场景。

### 2.1 主要特点：
+ **实时双向通信**：客户端和服务器之间可以进行双向通信，服务器可以主动向客户端发送消息，客户端也可以向服务器发送数据。

+ **跨平台支持**：Socket.IO 支持各种平台（浏览器、Node.js、Android、iOS 等）之间的通信，且自动处理不同的传输协议。

+ **自动降级**：当浏览器不支持 WebSocket 时，Socket.IO 会自动降级到其他传输方式（如长轮询）。

+ **基于事件的模型**：通信是通过事件触发机制完成的，用户可以自定义事件来处理特定的逻辑。例如，客户端可以监听 message 事件，服务器可以触发这个事件并发送消息。

+ **房间和命名空间**：支持房间（Rooms）和命名空间（Namespaces），可以实现复杂的通信逻辑，比如将用户分配到不同的房间，实现组播功能。

### 2.2 使用流程：
+ 服务器端（Node.js）和 客户端（浏览器或移动设备）都需要安装并引入 `Socket.IO`。
+ 服务器和客户端之间建立连接后，双方可以互相发送和接收消息，处理各种事件。
### 2.3 示例：
```js
// 服务器端 (Node.js)
const io = require('socket.io')(3000);
io.on('connection', (socket) => {
  console.log('用户连接了');
  socket.on('message', (data) => {
    console.log('接收到消息:', data);
    io.emit('message', data); // 广播消息给所有客户端
  });
});

// 客户端 (浏览器)
const socket = io('http://localhost:3000');
socket.on('connect', () => {
  console.log('已连接到服务器');
});
socket.on('message', (data) => {
  console.log('收到消息:', data);
});
Socket.IO 提供了便捷的 API 来处理实时通信，使开发者可以轻松地构建实时应用。
```
## 3.@nestjs/websockets
`@nestjs/websockets` 是 NestJS 框架提供的一个用于构建基于 WebSocket 的实时通信应用的模块。NestJS 是一个基于 Node.js 的框架，受 Angular 的启发，使用 TypeScript 开发，结构化、模块化程度较高，非常适合构建服务器端应用程序。

通过 `@nestjs/websockets`，你可以轻松地将 WebSocket 集成到 NestJS 应用中，并创建具备实时数据传输能力的应用程序。

### 3.1. 安装依赖
在使用 `@nestjs/websockets `之前，需要确保已经安装了相应的依赖：
```shell
npm install --save @nestjs/websockets @nestjs/platform-socket.io
@nestjs/platform-socket.io 是 WebSocket 的 Socket.IO 适配器，用于在 NestJS 中使用 Socket.IO。
```
### 3.2. 创建 WebSocket 网关（Gateway）
在 NestJS 中，WebSocket 通过 "网关" (Gateway) 进行处理。网关是监听和响应 WebSocket 客户端请求的核心组件。

示例代码：
```js
import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { WebSocketServer } from 'ws';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer() server;

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string): void {
    this.server.emit('message', data); // 将消息广播给所有客户端
  }
}
@WebSocketGateway()：这个装饰器用来标识一个类为 WebSocket 网关。
@WebSocketServer()：用于注入 WebSocket 服务器的实例，通常是 Socket.IO 或 ws。
@SubscribeMessage('message')：订阅特定事件，例如 message，当客户端发送对应事件时，这个方法会被触发。
handleMessage()：处理接收到的消息，并可以根据需要将其广播给其他客户端。
```
### 3.3. 使用 Socket.IO 适配器
虽然 `@nestjs/websockets` 可以直接与 ws (WebSocket 库) 集成，但在实际应用中，NestJS 通常通过 Socket.IO 来处理 WebSocket 通信。Socket.IO 提供了更高层次的功能，如房间（rooms）、命名空间（`namespaces`）等。

示例：
```js
@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway {
  @WebSocketServer() server;

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string): void {
    this.server.to('some-room').emit('message', data); // 向特定房间广播消息
  }
}
namespace: 'chat' 指定了一个命名空间，客户端连接时可以选择不同的命名空间来隔离事件和通信。
this.server.to('some-room') 可以将消息发送给特定房间的客户端。
```
### 3.4. WebSocket 与 HTTP 的结合
NestJS 是一个强大的全栈框架，允许将 HTTP 与 WebSocket 无缝结合在一起。例如，你可以在同一个服务中处理 HTTP 请求和 WebSocket 消息，复用服务和逻辑。

### 3.5. 生命周期钩子
NestJS 允许你通过 WebSocket 生命周期钩子来处理客户端的连接和断开事件。

+ **@WebSocketGateway()**：装饰类，声明一个 WebSocket 网关。
+ **handleConnection(client: Socket)**：当客户端成功连接时触发。
+ **handleDisconnect(client: Socket)**：当客户端断开连接时触发。
示例：
```js
@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer() server;

  handleConnection(client: any, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
```
### 3.6. 总结
+ **实时通信**：`@nestjs/websockets` 提供了便捷的接口，使你能够快速构建实时通信应用。
+ **可扩展性**：通过 Socket.IO，提供了更丰富的功能，如房间、命名空间等，帮助你实现更复杂的 WebSocket 逻辑。
+ **NestJS 整合**：得益于 NestJS 框架的模块化设计，WebSocket 可以轻松与其他服务、模块整合，比如用户认证、数据库服务等。
这使得 `@nestjs/websockets` 成为一个功能强大且灵活的工具，适合构建实时聊天、游戏、在线协作等需要高效实时通信的应用程序。

## 4.@WebSocketGateway
`@WebSocketGateway` 是 NestJS 提供的一个装饰器，用于创建 WebSocket 网关。它允许我们在 NestJS 应用中轻松集成和管理 WebSocket 通信功能。

### 4.1 主要功能：
`@WebSocketGateway` 装饰器用于声明一个类为 WebSocket 网关，NestJS 会将其转换为能够处理 WebSocket 事件的类。通过它，你可以处理客户端的连接、消息传输和断开连接等事件。

### 4.2 基本用法：
```js
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway() // 声明这是一个 WebSocket 网关
export class MyGateway {
  @WebSocketServer()
  server: Server; // 引用 Socket.IO 的 Server 实例

  // 监听 'message' 事件
  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log('收到消息：', data);
    this.server.emit('message', data); // 广播消息给所有连接的客户端
  }

  // 处理客户端连接
  handleConnection(client: Socket) {
    console.log('客户端已连接', client.id);
  }

  // 处理客户端断开连接
  handleDisconnect(client: Socket) {
    console.log('客户端断开连接', client.id);
  }
}
```
### 4.3关键概念：
+ `@WebSocketGateway()`：

+ 装饰类，用于声明这个类是一个 WebSocket 网关。
+ 你可以通过传递参数来指定自定义的配置，例如端口号或协议：
```js
@WebSocketGateway(3001, { namespace: '/chat' }) // 在 /chat 命名空间上监听端口 3001
```
+ `@WebSocketServer`：

使用 `@WebSocketServer` 装饰一个类属性来引用 Socket.IO 的 Server 实例。通过它可以直接与所有连接的客户端进行交互，例如广播消息、管理连接等。
+ `@SubscribeMessage()`：

+ 用于处理来自客户端的特定事件消息。@SubscribeMessage('event_name') 会监听来自客户端名为 'event_name' 的事件，并处理相关逻辑。
+ 事件处理函数会接受 @MessageBody() 和 @ConnectedSocket() 等参数：
    + @MessageBody()：获取消息内容。
    + @ConnectedSocket()：获取当前连接的客户端 Socket 实例。
+ **生命周期钩子方法**：

+ `handleConnection(client: Socket)`：当客户端连接时触发，通常用于初始化或发送欢迎消息。
+ `handleDisconnect(client: Socket)`：当客户端断开连接时触发，通常用于清理资源或记录日志。
### 4.4 配置选项：
`@WebSocketGateway()` 支持多种配置，如下：
```js
@WebSocketGateway({
  namespace: '/chat',  // 设置命名空间
  cors: {              // 配置跨域
    origin: '*',
  },
})
```
+ `namespace`：指定命名空间，允许将 WebSocket 通信分为不同的区域，客户端连接时必须通过指定的命名空间。
+ `cors`：配置跨域资源共享（CORS），允许跨域访问。
### 4.5 应用场景：
+ **实时聊天应用**：多个客户端之间能够通过 WebSocket 连接实时发送和接收消息。
+ **在线通知系统**：当某些事件发生时，立即通过 WebSocket 向客户端推送消息。
+ **多人在线游戏**：游戏状态的实时更新和广播。
+ **实时数据流**：如股票市场、社交媒体更新等，需要推送实时数据的场景。
通过 `@WebSocketGateway`，NestJS 提供了一种简单而强大的方式来处理 WebSocket 通信，使得开发者可以很容易地构建实时应用。

## 5.@WebSocketServer
`@WebSocketServer` 是 NestJS 提供的一个装饰器，用于在 WebSocket 网关中注入 Socket.IO 的 Server 实例。它允许你直接访问并控制 WebSocket 服务器，进而可以与所有连接的客户端进行通信，如广播消息、发送私信、管理房间等。

### 5.1 主要功能：
+ **访问 `Socket.IO` 的 `Server` 实例**：通过 @WebSocketServer 装饰器，你可以在网关类中访问 Socket.IO 的核心 Server 实例，从而控制连接的客户端和 WebSocket 事件。
+ **广播消息**：你可以通过 Server 实例将消息发送给所有连接的客户端或特定的客户端。
+ **管理房间和命名空间**：你可以使用 Server 实例来创建房间或命名空间，并在这些房间或命名空间中进行消息广播或管理连接。
### 5.2 基本用法：
```js
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  server: Server;  // 注入 Socket.IO 的 Server 实例

  // 广播消息给所有客户端
  broadcastMessage(message: string) {
    this.server.emit('message', { text: message });
  }
}
```
### 5.3 关键点：
+ **注入 Server 实例**： @WebSocketServer 装饰器会将 Socket.IO 的 Server 实例注入到类的属性中。这个实例允许你控制整个 WebSocket 服务器，比如向所有客户端广播消息或向特定房间发送消息。

+ **消息广播**： 使用 this.server.emit() 方法可以向所有连接的客户端发送消息。例如，你可以将某个事件的数据广播给所有用户：
```js
this.server.emit('event_name', data);
这会向所有连接的客户端发送名为 event_name 的事件和数据。

向特定客户端发送消息： 如果你想向特定的客户端发送消息，可以通过 Socket 实例中的 id 来定位客户端：

this.server.to(socketId).emit('event_name', data);
这样只会向特定的客户端发送消息。

房间和命名空间： @WebSocketServer 允许你管理房间（Rooms）和命名空间（Namespaces）：

房间：房间是一组客户端连接，房间中的消息只会广播给特定组内的客户端。使用 join() 和 leave() 可以让客户端加入或离开房间。

// 客户端加入房间
client.join('room1');

// 向房间内所有客户端广播消息
this.server.to('room1').emit('message', { text: 'Hello Room 1' });
命名空间：命名空间用于分隔 WebSocket 的事件处理逻辑，可以为每个命名空间指定特定的路由或逻辑。

@WebSocketGateway({ namespace: '/chat' })
```
### 5.4 示例：广播和房间管理
```js
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  // 处理用户连接
  handleConnection(client: Socket) {
    console.log(`用户 ${client.id} 已连接`);
  }

  // 处理用户断开连接
  handleDisconnect(client: Socket) {
    console.log(`用户 ${client.id} 已断开`);
  }

  // 监听 "message" 事件
  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: string, @ConnectedSocket() client: Socket) {
    // 向所有客户端广播消息
    this.server.emit('message', { user: client.id, text: message });
  }

  // 客户端加入房间
  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);
    this.server.to(room).emit('message', { user: '系统', text: `用户 ${client.id} 加入了房间 ${room}` });
  }

  // 客户端离开房间
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.leave(room);
    this.server.to(room).emit('message', { user: '系统', text: `用户 ${client.id} 离开了房间 ${room}` });
  }
}
```
### 5.5 解释：
+ `@WebSocketServer()`：将 Socket.IO 的 Server 实例注入到 server 属性。你可以使用这个实例来广播消息、管理房间等。
+ `this.server.emit()`：用于向所有连接的客户端广播消息。
+ `client.join(room)` 和 `this.server.to(room).emit()`：用于将客户端加入某个房间，并向该房间内的所有客户端发送消息。
### 5.6 适用场景：
+ **实时聊天**：你可以使用 @WebSocketServer 来管理多个聊天房间，广播消息给房间内的所有用户。
+ **游戏**：多人在线游戏中，可以用房间来分组玩家，并且用 Server 实例管理实时的游戏状态。
+ **通知系统**：可以向所有用户或者特定用户组广播重要通知。
通过 `@WebSocketServer`，NestJS 为你提供了强大的控制权来管理 `WebSocket` 连接、房间和消息广播，使得构建复杂的实时应用变得更加简单和高效。

## 6.@SubscribeMessage
`@SubscribeMessage` 是 NestJS 中用于 `WebSocket` 的一个装饰器，它专门用来监听和处理来自客户端的特定事件。当客户端发送某个特定事件时，带有 @SubscribeMessage 装饰器的方法会被触发并处理该事件。

### 6.1 主要功能：
`@SubscribeMessage` 可以用来监听客户端发送的自定义事件，并根据接收到的数据执行相应的逻辑操作。事件的处理逻辑通常包括接收消息内容、对消息进行处理，然后再通过 WebSocket 发送响应回客户端。

### 6.2 基本用法：
```js
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {

  // 使用 @SubscribeMessage 监听 'message' 事件
  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket): string {
    console.log(`收到的消息内容: ${data}`);
    return `服务器响应: ${data}`;
  }
}
```
### 6.3 详细解释：
+ `@SubscribeMe+ssage('事件名')`：

    + 装饰一个方法来监听特定的 WebSocket 事件，例如 message。
    + 当客户端发送该事件时，方法会被自动调用并处理事件数据。
+  `@MessageBody()`：

    + 使用 @MessageBody() 可以从客户端传来的消息中提取数据。在上面的例子中，它提取了 data，这是客户端发送的消息内容。
    + 这个参数通常是消息的主体数据。
+ `@ConnectedSocket()`：

    + 通过 @ConnectedSocket() 可以获取到当前连接的 Socket 实例，它代表了当前的客户端连接。
    + 可以通过 Socket 实例向特定客户端发送消息、加入房间等操作。
### 6.4 方法的返回值：
`@SubscribeMessage` 装饰的方法可以返回一个值，这个值会被自动发送回发起事件的客户端。这个过程是异步的，你也可以通过 Observable 或 Promise 的形式返回异步数据。
例如，如果方法返回字符串，服务器会将这个字符串直接作为响应发送给客户端。
### 6.5 示例：处理房间内的消息
```js
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class RoomGateway {

  // 监听 'joinRoom' 事件，客户端请求加入房间时触发
  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room); // 客户端加入指定的房间
    client.emit('joinedRoom', `你已加入房间 ${room}`);
  }

  // 监听 'sendMessage' 事件，客户端发送消息时触发
  @SubscribeMessage('sendMessage')
  handleSendMessage(@MessageBody() data: { room: string, message: string }, @ConnectedSocket() client: Socket) {
    const { room, message } = data;
    // 向特定房间内的所有客户端广播消息
    client.to(room).emit('receiveMessage', message);
  }
}
```
### 6.6 解释：
+ `handleJoinRoom`：当客户端发送 `joinRoom` 事件时，服务器端接收到房间名并将该客户端加入指定的房间。之后，服务器会给该客户端发送一条确认信息，告诉它已经成功加入房间。
+ `handleSendMessage`：当客户端在房间内发送消息时，服务器会监听 sendMessage 事件，并将消息广播到该房间内的所有客户端。
### 6.7 应用场景：
+ **聊天系统**：当客户端发送某条消息时，服务器通过` @SubscribeMessage` 来处理这些消息，并将它们广播到其他客户端。
+ **游戏系统**：当客户端发起特定的游戏操作时，可以通过 `@SubscribeMessage` 处理并响应这些操作。
+ **实时通知**：可以通过该装饰器处理客户端的事件，并向客户端发送实时的通知消息。
### 6.8 小结：
+ `@SubscribeMessage` 用于监听客户端通过 WebSocket 发送的特定事件。
+ 它可以和 `@MessageBody()`、`@ConnectedSocket()` 一起使用，方便提取事件数据和管理客户端连接。
+ 处理逻辑可以是同步的，也可以返回异步结果，并自动将返回值发送回客户端。
这个装饰器非常适合实时应用场景，如聊天、在线游戏等需要频繁通信的应用。

## 7.@MessageBody
`@MessageBody` 是 NestJS 提供的一个参数装饰器，专门用于从 WebSocket 事件中提取消息主体（即客户端发送的数据）。当客户端通过 WebSocket 向服务器发送事件时，服务器可以通过 @MessageBody 获取这次事件携带的数据内容。

### 7.1 主要功能：
`@MessageBody` 允许你从客户端发来的 WebSocket 消息中直接获取传递的数据。在事件处理函数中，使用该装饰器能够轻松获取消息内容并进行处理。

### 7.2 基本用法：
```js
import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';

@WebSocketGateway()
export class ChatGateway {

  // 监听 'message' 事件，并通过 @MessageBody 获取消息内容
  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string): string {
    console.log(`接收到的消息: ${data}`);
    return `服务器收到: ${data}`; // 返回数据给客户端
  }
}
```
### 7.3 解释：
+ `@SubscribeMessage('message')`：

    + 监听客户端发送的名为 `message` 的事件。
    + 当客户端通过 `WebSocket` 发送 `message` 事件时，服务器端的 `handleMessage` 方法会被调用。
+ `@MessageBody()`：

    + `@MessageBody()` 用来提取客户端发送的消息内容。比如，客户端发送了 message: 'Hello'，@MessageBody() 就会将 'Hello' 提取出来并作为参数传递给 handleMessage 方法。
    + 在上面的例子中，data 变量包含了客户端发送的消息。
### 7.4 客户端发送数据示例：
```js
// 客户端通过 WebSocket 发送消息
socket.emit('message', 'Hello Server');
```
### 7.5 复杂数据处理：
除了简单的字符串，`@MessageBody()` 也可以处理复杂的数据类型，比如对象、数组等。在实际应用中，通常会通过对象结构发送消息数据。

#### 7.5.1 示例：处理对象数据
```js
import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';

@WebSocketGateway()
export class ChatGateway {

  // 处理带有对象数据的事件
  @SubscribeMessage('sendMessage')
  handleSendMessage(@MessageBody() data: { username: string, message: string }): string {
    console.log(`用户 ${data.username} 发送了消息: ${data.message}`);
    return `服务器已收到来自 ${data.username} 的消息`;
  }
}
```
#### 7.5.2 客户端发送对象数据：
```js
// 客户端发送带有对象数据的消息
socket.emit('sendMessage', { username: 'Alice', message: 'Hello!' });
在上面的例子中：

@MessageBody() 将客户端发送的对象 { username: 'Alice', message: 'Hello!' } 提取出来，并传递给 handleSendMessage 方法中的 data 参数。
```
通过 `data.username` 和 `data.message` 可以访问具体的内容。
### 7.6 使用 @MessageBody() 结合 DTO：
为了确保传入的数据结构符合预期，可以结合 DTO（数据传输对象）来使用 `@MessageBody()`，从而保证数据类型的安全性和一致性。

#### 7.6.1 示例：使用 DTO
```js
import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { IsString } from 'class-validator';

// 定义 DTO 来约束消息结构
export class SendMessageDto {
  @IsString()
  username: string;

  @IsString()
  message: string;
}

@WebSocketGateway()
export class ChatGateway {

  // 监听事件并使用 DTO 验证数据
  @SubscribeMessage('sendMessage')
  handleSendMessage(@MessageBody() data: SendMessageDto): string {
    console.log(`用户 ${data.username} 发送了消息: ${data.message}`);
    return `服务器已收到来自 ${data.username} 的消息`;
  }
}
```
在这种情况下，`@MessageBody()` 会将客户端发来的数据绑定到 `SendMessageDto` 类型的对象中，从而确保数据符合预期的格式。

### 7.7 使用场景：
+ **聊天应用**：当客户端发送消息时，服务器可以使用 @MessageBody 提取消息的内容，并在服务器上做处理或存储。
+ **在线游戏**：服务器可以通过 @MessageBody 接收玩家的操作指令，并在游戏逻辑中做出相应的响应。
+ **实时通知系统**：当用户发起操作时，服务器可以通过 @MessageBody 接收相关的请求数据，并触发相关的通知。
### 7.8 小结：
+ `@MessageBody` 用于从 `WebSocket` 事件中提取消息的主体数据。
+ 适合处理简单的消息内容（如字符串、对象），也可以结合 DTO 进行复杂数据的验证。
+ 它极大地简化了从客户端事件中获取数据的过程，并确保服务器端能够处理和响应这些数据。
## 8.@ConnectedSocket
`@ConnectedSocket` 是 NestJS 提供的一个参数装饰器，用于在 WebSocket 网关中获取当前连接的客户端 Socket 实例。通过这个装饰器，服务器可以访问客户端的连接信息，从而执行与该客户端相关的操作，比如向特定客户端发送消息、管理房间、处理断开连接等操作。

### 8.1 主要功能：
+ **获取客户端的 `Socket` 实例**：通过 @ConnectedSocket，你可以获取当前连接的客户端 Socket，并利用它执行与该客户端相关的操作，如发送消息、获取客户端的 ID 等。
+ **管理客户端连接**：你可以通过 Socket 实例来管理客户端连接的状态，比如加入或离开房间、断开连接等。
+ **访问客户端的唯一 ID**：每个客户端的 Socket 实例都有一个唯一的 id，可以通过它来识别不同的客户端。
## 8.2 基本用法：
```js
import { WebSocketGateway, SubscribeMessage, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {

  // 监听 'message' 事件，并获取客户端的 Socket 实例
  @SubscribeMessage('message')
  handleMessage(@ConnectedSocket() client: Socket): string {
    console.log(`客户端 ID: ${client.id}`); // 输出客户端的 ID
    return `你好，客户端 ${client.id}`;  // 返回消息给客户端
  }
}
```
### 8.3 解释：

+ `@SubscribeMessage('message')`：监听来自客户端的 message 事件。
+ `@ConnectedSocket()`：装饰 client 参数，用于获取当前发送 message 事件的客户端的 Socket 实例。在 client 中，你可以访问与该客户端连接相关的所有信息。
+ `client.id`：每个客户端连接时都会分配一个唯一的 id，可以通过 client.id 访问该客户端的标识符。
### 8.4 Socket 实例的常见用法：
+ **获取客户端的唯一 ID**：
```js
console.log(`客户端的 ID: ${client.id}`);
```
+ **向特定客户端发送消息**：
```js
client.emit('event', '消息内容');
```
+ **将客户端加入房间**：
```js
client.join('room1');
```
+ **将客户端从房间中移除**：
```js
client.leave('room1');
```
+ **断开客户端连接**：
```js
client.disconnect();
```
### 8.5 结合 @ConnectedSocket 和 @MessageBody 使用：
通常，`@ConnectedSocket` 和 `@MessageBody` 会一起使用，前者用于获取当前客户端的连接信息，后者用于获取客户端发送的消息内容。

#### 8.5.1 示例：处理房间中的消息
```js
import { WebSocketGateway, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class RoomGateway {

  // 客户端加入房间
  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);  // 将客户端加入指定的房间
    client.emit('joinedRoom', `你已加入房间 ${room}`);
  }

  // 处理房间内的消息
  @SubscribeMessage('sendMessage')
  handleSendMessage(@MessageBody() message: string, @ConnectedSocket() client: Socket) {
    const rooms = Object.keys(client.rooms);  // 获取客户端所在的房间
    const room = rooms[1]; // 默认房间在第二个位置（第一个是自身连接 ID）

    if (room) {
      client.to(room).emit('receiveMessage', message);  // 广播消息到房间
    } else {
      client.emit('error', '你尚未加入任何房间');
    }
  }
}
```
### 8.6 解释：
+ `handleJoinRoom`：

  + 通过 `@MessageBody()` 获取客户端请求加入的房间名，通过 `@ConnectedSocket()` 获取客户端 Socket 实例。
  + 使用 `client.join(room)` 将客户端加入指定的房间，并返回确认消息给客户端。
+ `handleSendMessage`：

+ 使用 `@MessageBody()` 获取客户端发送的消息，通过 `@ConnectedSocket()` 获取客户端的 Socket 实例。
+ 通过 `client.rooms` 获取该客户端当前所在的所有房间。
+ 将消息广播给同一房间内的所有其他客户端。
### 8.7 应用场景：
+ **私信功能**：可以通过 Socket 实例向某个特定客户端发送消息，从而实现私聊。
```js
client.emit('privateMessage', { message: 'Hello!' });
```
+ **房间管理**：使用 Socket 实例将客户端加入或移出房间，实现多人聊天或游戏房间功能。
```js
client.join('gameRoom1');
client.leave('gameRoom1');
```
+ **断开连接**：服务器可以主动断开某个客户端的连接。
```js
client.disconnect();
```
### 8.8 小结：
+ `@ConnectedSocket` 用于获取当前与服务器建立连接的客户端的 `Socket` 实例。
+ 通过 `Socket` 实例，可以实现与客户端的实时双向交互，如发送消息、加入房间、断开连接等。
+ 它通常与 `@MessageBody` 一起使用，前者处理客户端连接，后者提取客户端发送的数据。