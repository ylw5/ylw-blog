# 非原始值的响应式方案

实际上，实现响应式数据并不是像上一章讲述的那样，单纯地拦截 `get/set` 操作即可。如何支持 for...in、集合类型如 `Map`、`Set` 等。

## 理解 Proxy 和 Reflect

Proxy：可以创建一个代理对象，它能够实现对**其他对象**的**代理**。

> 代理：对一个对象**基本语义**的代理
>
> 基本语义：即基本操作，类似属性值的读取设置、函数调用
>
> 非基本操作：即复合操作，例如 `obj.fn()`

Reflect 是一个全局对象，其身上的方法和 Proxy 对象的方法一一对应。为什么需要呢？

举个例子：

```javascript
const obj = {
  foo: 1,
  get bar() {
		return this.foo
  }
}
const p = new Proxy(obj, {
  get(target, key) {
		track(target, key)
    return target[key]
  },
  // 省略
})

// 副作用函数访问代理对象的 bar 属性
effect(() => {
	console.log(p.bar) // 1
})
```

当我们在副作用函数中通过代理对象 p 访问 bar 属性时，理论上当尝试修改 `p.foo` 的值时，能够触发响应，当实则不能。

因为在 get 拦截函数内，通过 `target[key]` 返回属性值，所以 **bar 属性的 getter 函数内的 this 指向 target，而 target 原始对象**，最终等价于 `obj.foo`，所以无法建立响应联系。

使用 `Reflect.get` 函数，**能接收第三个参数指定接收者 receiver**，即 this。

```javascript
const p = new Proxy(obj, {
  // 拦截读取操作，接收第三个参数 receiver
  get(target, key, receiver) {
		track(target, key)
		// 使用 Reflect.get 返回读取到的属性值
    return Reflect.get(target, key, receiver)
  },
  // 省略
})
```

此时，当我们使用代理对象 p 访问 bar 属性时，receiver 就是 p，访问器属性 bar 的 getter 函数内的 this 就指向代理对象 p，能成功建立响应联系。

## JavaScript 对象及 Proxy 的工作原理

**内部方法**：当我们对一个对象进行操作时在引擎内部调用的方法，这些方法对于使用者来说不可见。在 ECMAScript 规范中使用 [[xxx]] 来代表内部方法或内部槽。

> 引擎内部会调用 [[Get]] 这个内部方法来读取属性值
>
> 函数对象会部署内部方法 [[Call]]，而普通对象不会
>
> 内部方法具有多态性：不同类型的对象可能部署了相同的内部方法，却具有不同的逻辑

在 JavaScript 中有两种对象：

- **常规对象**

  略（对于一些内部方法必须使用 ECMA 规范给出的定义实现）

- **异质对象**

  不满足常规对象的要求。

## 如何代理 Object

所有可能的读取操作：

- 访问属性：`obj.foo`

  通过 get 拦截函数实现

- 判断对象上或原型上是否存在给定的 key：`key in obj`

  通过 has 拦截函数实现

- 使用 `for...in` 循环遍历对象：`for(const key in obj){}`

  使用 ownKeys 拦截函数实现