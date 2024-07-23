---
title: 第1章 Promise的理解和使用
date: 2024-04-20
tags:
   - Promise从入门到精通
categories:
   - Promise从入门到精通
isShowComments: false
---

<Boxx/>

[[toc]]

# Promise是什么
## 理解
1.抽象表达：

- Promise是一门ES6规范的新技术
- Promise是js中进行异步编程的新解决方案【旧方案：单纯使用回调函数】

2.具体表达

- 语法：Promise 是一个构造函数
- 功能：Promise对象用来封装一个异步操作并可以获取其成功/失败的结果值
## Promise的状态改变

1. pending变为resolved
2. pending变为rejected

说明：

- 只有这2种，且一个Promise对象**只能改变一次**
- 无论变为成功还是失败，都会有一个结果数据
- 成功的结果数据一般成为value，失败的结果数据一般称为reason
## Promise的基本流程
![image.png](https://cdn.nlark.com/yuque/0/2024/png/444894/1705234555500-ed6fa5cd-298a-440e-be0f-b4d816dd245b.png#averageHue=%23f9f8f8&clientId=ubc1cdad3-d968-4&from=paste&height=251&id=ub9de50e8&originHeight=251&originWidth=1125&originalType=binary&ratio=1&rotation=0&showTitle=false&size=58991&status=done&style=none&taskId=ue55a803a-b1ec-4d1b-9b90-fd8a7238774&title=&width=1125)
## Promise的基本使用

- 使用1：基本编码流程
```javascript
// 1.创建promise对象（pending状态），指定执行器函数
const p = new Promise ((resolve, reject) => {
  // 2.在执行器函数中启动异步任务
  setTimeout(()=>{
    const time = Date.now();
    // 3.根据结果做不同处理
    // 3.1如果成功了，调用resolve()，指定成功的value，变为resolved状态
    if (time % 2 === 1){
      resolve('成功的值:'+time);
    }else{
      // 3.2 如果失败了，调用reject()，指定失败的reason，变为rejected状态
      reject('失败的原因:'+time);
    }
  }, 2000)
})
// 4.能promise指定成功或失败的回调函数来获取成功的value或失败的reason
p.then(
  value => {
    // 成功的回调函数 onResolved,得到成功的value
    console.log('成功的value：',value);
  },
  reason => {
    // 失败的回调函数 onRejected,得到失败的reason
    console.log('失败的reason：',reason);
  }
)
```

- 使用2：使用promise封装基于定时器的异步
```javascript
function doDelay(time) {
  // 1.创建Promise对象
  return new Promise((resolve, reject) => {
    // 2.启动异步任务
    console.log("启动异步任务");
    setTimeout(() => {
      console.log("延迟任务开始执行...");
      // 假设：时间为奇数代表成功，为偶数代表失败
      const time = Date.now();
      if (time % 2 === 1) {
        //成功了
        // 3.1 如果成功了，调用resolve()并传入成功的value
        resolve("成功的数据:" + time);
      } else {
        //失败了
        // 3.2 如果失败了，调用reject()并传入失败的reason
        reject("失败的数据:" + time);
      }
    }, time);
  });
}

const promise = doDelay(2000);
promise.then(
  (value) => {
    console.log("成功的value", value);
  },
  (reason) => {
    console.log("失败的reason", reason);
    }
)
```

- 使用3：使用promise封装ajax异步请求
```javascript
// 可复用的发ajax请求的函数：xhr+promise
function promiseAjax(url){
    return new Promise((reolve, reject)=>{
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = ()=>{
            if(xhr.readyState!==4){
                return
            }
            const {status, response} = xhr;
            // 请求成功，调用resolve(value)
            if(status>=200 && status<300){
                resolve(JSON.parse(response))
            }else{
                // 请求失败，调用reject(reason)
                reject(new Error('请求失败:status:'+ status))
            }
        }
        xhr.open("GET", url);
        xhr.send();
    })
}
promiseAjax('http://localhost:3000/data').then(data=>{
    console.log("显示成功数据",data);
}, error=>{
    alert(error.message)
})
```
# 为什么要用Promise
## 指定回调函数的方式更加灵活

- 旧的：必须在启动异步任务前指定
- promise：启动异步任务 => 返回promise对象 => 给promise对象绑定回调函数（甚至可以在异步任务结束后指定多个）
## 支持链式调用，可以解决回调地狱问题

- 什么是回调地狱

回调地狱嵌套使用，外部的回调函数一步执行的结果是嵌套的回调函数执行的条件
![回调地狱.jpg](https://cdn.nlark.com/yuque/0/2024/jpeg/444894/1705236247747-6686db43-ba41-4e0f-a75a-c99b1224153f.jpeg#averageHue=%232b2f38&clientId=ubc1cdad3-d968-4&from=paste&height=300&id=u53d51fd9&originHeight=300&originWidth=995&originalType=binary&ratio=1&rotation=0&showTitle=false&size=13795&status=done&style=none&taskId=uc202002a-2fd1-4536-bc90-0236c0aecc7&title=&width=995)

- 回调地狱的缺点
   - 不便于阅读
   - 不便于异常处理
- 解决方案

promise链式调用

- 终极解决方案

async/await
```javascript
// 回调地狱
doSometing(function (result) {
  doSometingElse(
    result,
    function (newResult) {
      doThirdThing(
        newResult,
        function (finalResult) {
          console.log("Got the final result:" + finalResult);
        },
        failureCallback
      );
    },
    failureCallback
  );
}, failureCallback);

// 使用promise的链式调用解决回调地狱

doSometing().then(function(result){
    return doSometingElse(result);
}).then(function(newResult){
    return doThirdThing(newResult);
}).then(function(finalResult){
    console.log("Got the final result:" + finalResult);
}).catch(failureCallback);


// 使用async/await回调地狱终极解决方案
async function request() {
    try {
        const result = await doSometing();
        const newResult = await doSometingElse(result);
        const finalResult = await doThirdThing(newResult);
        console.log("Got the final result:"+finalResult);
    }catch(error){
        failureCallback(error);
    }
}
```
# 如何使用Promise
## API

- Promise构造函数：Promise(executor){}
   - executor 函数：执行器 （resolve, reject）=>{}
   - resolve函数：内部定义成功时调用的函数 value=>{}
   - reject函数:内部定义失败时调用的函数 reason=>{}

说明：**executor** 会在Promise内部立即**同步调用**，异步操作在执行器中执行


