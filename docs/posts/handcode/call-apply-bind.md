---
title: call / apply / bind
time: 2022-10-10
---
# 手撕 call / apply / bind

## call

[Function.prototype.call()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/call)

语法：

```javascript
function.call(thisArg, arg1, arg2, ...)
```

基本思路：

- 将函数设为 `thisArg` 对象上的方法
- 方法调用 `thisArg.fn`
- 删除对象上的方法

```javascript
Function.prototype.myCall = function (thisArg, ...args) {
  thisArg = thisArg || window // 没有参数,null或undefined则赋予全局作用域
  const fn = Symbol()
  thisArg[fn] = this // 这里的this指向调用myCall的函数
  // 三元表达式针对无效thisArg
  const res = thisArg[fn] ? thisArg[fn](...args) : this(...args)
  delete thisArg[fn]
  return res
}
```

## apply

和 `call` 的区别时第二个参数时一个数组或者类数组对象

```javascript
Function.prototype.myApply = function (thisArg, argsArray) {
  thisArg = thisArg || window // 没有参数,null或undefined则赋予全局作用域
  argsArray = Array.from(argsArray) // 将类数组转换为数组
  const fn = Symbol()
  thisArg[fn] = this // 这里的this指向调用myapply的函数
  // 三元表达式针对无效thisArg
  const res = thisArg[fn] ? thisArg[fn](...argsArray) : this(...argsArray)
  delete thisArg[fn]
  return res
}
```

## bind

[Function.prototype.bind()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

语法：

```javascript
function.bind(thisArg[, arg1[, arg2[, ...]]])
```

返回值：

返回一个原函数的拷贝，并拥有指定的 **`this`** 值和初始参数。

基本思路：

同 `call` 一样，在绑定对象 `thisArg` 上创建函数方法 `fn` ，但是返回一个新的函数，在其中调用绑定的方法（闭包）

```javascript
Function.prototype.myBind = function (thisArg, ...innerArgs) {
  thisArg = thisArg || window
  const fn = Symbol()
  thisArg[fn] = this
  return function (...outerArgs) {
    // 三元表达式针对无效thisArg
    thisArg[fn] ? thisArg[fn](...innerArgs,...outerArgs) : this(...innerArgs,...outerArgs)
  }
}
```



