
## 大纲
react 源码解析，聚焦于下面的几个话题：

1⃣️ 为什么在 react 中，不应该定义闭包函数式组件。

2⃣️ bailout、eager bailout 是什么？

3⃣️ react 中，再也不需要写 memo。react compiler (原名 react forget) 的使用。

注：每个代码片段都有标记出处：GitHub url 和 代码行号。方便读者跳转到完整的源码位置。

## 观前提示 (看不懂可以直接跳到前言)
> 本文源自于给 react 发的 PR，官方 CI 大测试，只有 prettier 没过。
单元测试通过，证明了理论上的可行性。
https://github.com/facebook/react/pull/34116

React 并不优秀，只是使用的人多。

前端，redux 因为诞生得早，使用广泛，实际上并不好用。

Pinia 借助底层的响应式数据，实现了相同的功能，且语法更漂亮和简洁。

---
React 底层架构设计的缺陷，导致了其很多复杂性。

如 react 的异步特性 （startTransition concurrent scheduler），是因为其内部缺少响应式系统、静态模板编译优化而诞生的。

react 数据（状态）改变时，react 无法直接找出被改变的组件，必须得 re-render 全部组件，这样的 re-render 导致了性能问题。

react 为了向后兼容以及降低复杂性，只能用 memo 和 异步渲染 来解决这个问题。

我们可以大胆幻想下，如果直接在 useState 上添加响应式数据，因为 useState 返回的是值，而不是对象，这会导致无法用 proxy 设置 getter，无法记录依赖。

如果新创建一个 useProxy hook，是可行的。只不过 react 核心团队的理念是 “少做少错，多做多错”，一周上三天，就连 react 内部的 scheduler，从2019 年开发到现在 2025，接口都还不稳定。他们效率太低。

他们的状态估计是跟当年占据 90％ 市场份额的 IE 差不多，我实在无法想明白 IE 为什么不继续维护了。我能想到模糊的解释就是: 不思进取、开发重心转变、大企业的办公室政治。

希望墙倒众人推，希望 react 走向时代的尘埃。混杂着个人恩怨，我是不打算继续在个人项目中使用 react 了。
## 前言

本来想尝试 将文章写成更通俗易懂，由浅入深地讲解整个 react 代码架构，但我发现这是一个天真的想法。

想要讲清整个 react 的机理，至少需要一本书的篇幅，以及大量图文。市面上暂时没有中文书，可以做到。

如果把巨量的信息，压缩到一篇文章内，势必会导致巨量的信息丢失，文字碎片化，阅读体验非常跳跃，晦涩难懂，估计只会变成只有作者才能读懂的忍者符号。

所以本文更多的不是教学向的入门教程，而是源码简化、索引、整理。源码的 GitHub URL 地址，我都会标记清楚，方便你直接跳转，查看完整源码。

如果你想学习框架源码，通过 Vue 上手框架源码将会是更好的选择。

Vue 模块划分清晰，而且还有霍春阳老师编写的《Vuejs设计与实现》。

霍春阳老师写作水平超一流，叙事由浅入深，由简单的小概念验证，一步步完善边界情况，将代码变成一个小框架。

Vue 和 React 有很多概念有重合，如 虚拟 DOM (通过 JS 对象表示 DOM 节点)，和基于虚拟 DOM 的 diff 算法 (对比新旧虚拟 DOM，找出变动的地方)。

所以学习了 Vue 源码，React 很多问题也是可以想明白的。

## 用 Vue 思维解决 React 问题
> 这里假设你已经阅读完了 《Vuejs设计与实现》

题: React 为什么在函数式组件内部，不应该再定义函数式组件，也就是闭包函数式组件?
```js
import React, { useState } from 'react';

export function App(props) {
  return <Child />;
}

function Child(props) {
  const [sliderRange, setSliderRange] = useState(0);

  return <Slider />;
  function Slider() {
    return (
      <input
        value={sliderRange}
        onChange={e => setSliderRange(e.target.value)}
        type='range'
        min='0'
        max='20'
      />
    );
  }
}
```
这里的 Slider 拖动起来, 并不顺畅, 拖动了一下后, 就拖不动了, 得点击后, 重新拖动, 如此往复.

如果直接问豆包 AI, AI 会回复 "性能问题", 实际上牛头不对马嘴, 这里的不是性能问题.

答: 因为函数式组件 虚拟 DOM 的 tag 属性 (虚拟 DOM 是一个 js 对象，这个对象有个属性 tag) 为函数式组件本身。

而在“单元素 diff 算法”过程中，如果判断到新旧 tag 不一致，diff 算法会认为不应该复用原来的真实 dom。

渲染器 (它会根据虚拟DOM，createElement，并把新建元素添加到页面中，这个过程叫“渲染”)会根据 diff 算法的指示执行渲染任务。

在这个例子中，渲染器会把原来的真实 dom remove 掉，然后重新创建真实 dom。

所以会导致 "拖动不连续" 的问题.

闲谈结束，下面开始完整的源码解析，通过源码解释下面问题:

1) 刚刚提到的闭包组件，diff 算法问题。
2) bailout、eager bailout
3) 再也不用写 memo 了，react compiler (原名 react forget) 的使用

这些都是操作性非常强知识，文章的重点不会聚焦于各种离谱、讳莫如深、望穿秋水都看不透的算法，而是一个问题，对应一个源码知识。

空谈误国，实干兴邦。柴静曾经说过，“事实自有万钧之力”，coderwhy 说过 “只有知道真相，才能获得真正的自由”。

源码就是真相，源码就是事实，源码作为客观存在，是我们理论的依据。我们不会像三流博客一样胡说八道，这里只有真相。

## 章回一: 组件嵌套图方便，单点更新成梦魇
> 我们分析的源码版本为: https://github.com/facebook/react/releases/tag/v19.1.1
### 概念: 虚拟 DOM
虚拟 DOM 就是用 JS 对象表示真实 DOM。也就是给真实 DOM 建模。

使用 JS 对象表示真实 DOM 的好处，就是 JS 对象比真实 DOM 更轻量，成员属性和方法更少。

同时虚拟 DOM 也方便 "跨平台", 在浏览器环境下, 可以渲染为真实 DOM.

在 SSR，也就是 NODE 环境下，可以将虚拟 DOM 渲染为字符串。

React 的虚拟 DOM 就是 ReactElememt 和 fiber。

### React 的虚拟 DOM
React 代码经过 babel 编译后的结果，如下面的代码片段所示
在线地址: https://babeljs.io/repl
```js
function App() {
    return <Child/>
}

function Child() {
    return <div>hello!</div>
}
```
```js
import { jsx as _jsx } from "react/jsx-runtime";
function App() {
  return /*#__PURE__*/_jsx(Child, {}); // 这里我们关注第一个参数, 可以发现是 Child 函数组件本身
}
function Child() {
  return /*#__PURE__*/_jsx("div", {
    children: "hello!"
  });
}
```
上面代码片段中, _jsx 函数的作用为生成一个 ReactElement 对象.

ReactElement 的类型定义如下所示:
```js
// packages/shared/ReactElementType.js
// https://github.com/facebook/react/blob/v19.1.1/packages/shared/ReactElementType.js
// 第 12 行

export type ReactElement = {
  $$typeof: any,
  type: any, // 关注这里
  key: any,
  ref: any,
  props: any,
  // __DEV__ ...
};
```
```js
// 顺着 react/jsx-runtime 一路追踪过去, _jsx 最终会调用 jsxProd
// packages/react/src/jsx/ReactJSXElement.js
// https://github.com/facebook/react/blob/v19.1.1/packages/react/src/jsx/ReactJSXElement.js

// 第 306 行
/*
    https://github.com/reactjs/rfcs/pull/107

    在上面例子中:
    function App() {
      return _jsx(Child, {}); 
    }
    这里的 type 参数的值为 Child
*/
export function jsxProd(type, config, _) {
  // ...

  // 第 366 行
  return ReactElement(
    type,
    key,
    undefined,
    undefined,
    getOwner(),
    props,
    undefined,
    undefined,
  );
}

```
```js
// 顺着 react/jsx-runtime 一路追踪过去, _jsx 最终会调用 jsxProd
// packages/react/src/jsx/ReactJSXElement.js
// https://github.com/facebook/react/blob/v19.1.1/packages/react/src/jsx/ReactJSXElement.js

/**
 * 第 157行
 * Factory method to create a new React element
...
 *
 * @param {*} type
 * @param {*} props
...
 */
function ReactElement(
  type, /* 在上面的 jsx 中, 这里为 Child */
  key,
  // ...
  props,
  // ...
) {
  const refProp = props.ref;
  //...

  // 第 203 行 & 第 241 行
  element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type, /* 在上面例子中, App 的 _jsx(Child, {}), 这里的 type 为 Child */
    key,
    ref,

    props,
  };

  //...

  return element;
}
```
React Element 可以为 函数式组件的实例.

也就是说, 当一个 React Element 对应一个函数式组件. 也就是 一个 React Element 为一个函数式组件的实例.

那么这个 React Element 的 type 属性等于函数式组件.

---
上面滑块案例经过 babel 编译后的产物:
```js
import React, { useState } from 'react';
import { jsx as _jsx } from "react/jsx-runtime";
export function App(props) {
  return /*#__PURE__*/_jsx(Child, {});
}
function Child(props) {
  const [sliderRange, setSliderRange] = useState(0);

  return /*#__PURE__*/_jsx(Slider, {});

  function Slider() {
    return /*#__PURE__*/_jsx("input", {
      value: sliderRange,
      onChange: e => setSliderRange(e.target.value),
      type: "range",
      min: "0",
      max: "20"
    });
  }
}
```
我们可以发现, 每次 Child 执行时, 其内部的闭包函数式组件都会重新生成.

也就是 新旧 Silder 的地址值不一致.

也就会导致其闭包函数式组件 (Slider) 对应的 新旧 ReactElement 的 type 会不一样.

也就是每一次 Child 执行时, 生成的 React Element _jsx(Slider, {}).type 不等于 下一次 Child 执行时的 _jsx(Slider, {}).type

这也就会导致前言中描述的问题.
```js
function Foo() {
    return inner;

    function inner() {

    }
}

const inner01 = Foo();
const inner02 = Foo();

console.log(inner01 === inner02) // false
```
```js
function Foo() {
    return {};
}

const inner01 = Foo();
const inner02 = Foo();

console.log(inner01 === inner02) // false
```
```js
function Foo() {
    return new Object();
}

const inner01 = Foo();
const inner02 = Foo();

console.log(inner01 === inner02) // false
```
在大多数语言中, new 每次都会申请新的内存空间, 类似 C 的 malloc .

---
继续分析 React 源码

React Element 转 fiber node:
```js
// packages/react-reconciler/src/ReactInternalTypes.js
// https://github.com/facebook/react/blob/v19.1.1/packages/react-reconciler/src/ReactInternalTypes.js
// 第 88 行

// 虚拟 DOM 节点, 类似 React.Element
export type Fiber = {
  // ...

  // 虚拟 DOM 节点的唯一标识
  key: null | string,

  // The value of element.type which is used to preserve the identity during
  // reconciliation of this child.
  // 这里其实就是 React element 的 type, 见下方的 createFiberFromTypeAndProps
  elementType: any,

  // ...
}
```
```js
// packages/react-reconciler/src/ReactFiber.js
// https://github.com/facebook/react/blob/v19.1.1/packages/react-reconciler/src/ReactFiber.js

// 第 737 行
export function createFiberFromElement(
  element: ReactElement,
  mode: TypeOfMode,
  lanes: Lanes,
): Fiber {
  // ...

  const type = element.type;
  const key = element.key;
  const pendingProps = element.props;

  // 第 749 行
  const fiber = createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    _,
    mode,
    lanes,
  );

  // ...
  return fiber;
}

// 第 546 行
// 这个函数的作用是把 React Element 转化为 Fiber 节点
export function createFiberFromTypeAndProps(
  type: any, // React$ElementType
  key: null | string,
  // ...
): Fiber {

  // ...

  // 第 725 行
  const fiber = createFiber(_, _, key, _);
  fiber.elementType = type; // 重点, 这里把 fiber 对应的 React Element 的type 赋值给了 fiber 的 elementType

  // ...

  return fiber;
}
```
```js
// packages/react-reconciler/src/ReactChildFiber.js
// https://github.com/facebook/react/blob/v19.1.1/packages/react-reconciler/src/ReactChildFiber.js
// 第 1622 行

  function reconcileSingleElement(
    // 父 虚拟 DOM 节点
    returnFiber: Fiber,
    // 旧的 虚拟 DOM 节点, 这里是 FiberNode, 跟 React Element 差不多
    currentFirstChild: Fiber | null,
    // 新建的 react element 节点
    element: ReactElement,
    _,
  ): Fiber {
    const key = element.key;
    let child = currentFirstChild;

    while (child !== null) {
      // 单节点 diff 的第一个条件, 新旧虚拟 DOM 的 key 必须相同
      if (child.key === key /* element.key 新 react element 节点的 key */) {
        const elementType = element.type;
        if (elementType === REACT_FRAGMENT_TYPE) {
          // 当新建元素为 fragment 的逻辑, 忽略
        } else {
          if (
            // 单节点 diff 的第二个条件, 新旧虚拟 DOM 的 elementType 必须相同
            // elementType 可以为 'p' 'div' 这些标签字符串
            // 可以为函数式组件
            child.elementType === elementType /* ReactElement.type */
            // 忽略
          ) {
            // ...
            // 复用元素
            const existing = useFiber(child, element.props);
            // ...
            // 这里复用后便 return 了, 结束函数逻辑
            return existing;
          }
        }
        // ...
        break;
      } else {
        // 如果上面的复用逻辑都不满足, 则删除旧 DOM
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    // 如果上面的复用逻辑都不满足, 则到达这里
    if (element.type === REACT_FRAGMENT_TYPE) {
      // ...fragment
    } else {
      // 相当于创建新的节点
      const created = createFiberFromElement(element, returnFiber.mode, lanes);
      // ...
      return created;
    }
  }
}
```
通过对这个 reconcileSingleElement 函数 执行逻辑的分析, 我们便找出了本章回问题的答案.

如果 新旧虚拟 DOM 的 key 或elementType 不同, 则不会复用真实 dom, 这里会直接把真实 DOM 卸载掉

这种逻辑在大多数场景下, 都是合理的.

如 <p></p> 变成 <p class="new-classname"></p>

React 渲染器只用使用 setAttribute 修改 props就好 .

但如果是 <p></p>变成`

, 这时候就需要把旧的真实 DOM 卸载掉, 然后创建一个div`作为新的真实 DOM, 并挂载上去.
fiber node 的 elementType 可能为标签名, 也可能为函数式组件.
## 第二章: bailout、eager bailout

## 参考
https://bbs.tampermonkey.net.cn/thread-9466-1-1.html