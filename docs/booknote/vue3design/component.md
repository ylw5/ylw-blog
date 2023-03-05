# 组件化

当我们编写比较复杂的页面时，用来描述页面结构的虚拟 DOM 的代码量会变得越来越多，或者说页面模板会变得越来越大。这是，我们需要组件化的能力。有了组件，我们就可以将一个大的页面拆分为多个部分，每一个部分都可以作为单独的组件，它们一起组成完整的页面。

## 组件的实现原理

### 渲染组件

从**用户角度**来看，一个有状态组件就是一个**选项对象**，如下代码所示：

```javascript
// MyComponent 是一个组件，它的值是一个选项对象
const MyComponent = {
	name: 'MyComponent',
  data() {
		return { foo : 1 }
  }
}
```

从**渲染器内部**实现来看，一个组件则是一个**特殊类型的虚拟 DOM 节点**，用虚拟节点的 `vnode.type` 属性存储组件的选项对象，例如：

```javascript
// 该 vnode 用来描述组件，type 属性存储组件的选项对象
const vnode = {
  type: MyComponent
  // ...
}
```

为了让渲染器能够处理组件类型的虚拟节点，需要在 `patch` 函数中对组件类型的虚拟节点进行处理（添加一个分支）：

```javascript
function patch(n1, n2, container, anchor) {
  if (n1 && n1.type !== n2.type) {
    unmount(n1)
    n1 = null
  }
  const { type } = n2
  if (typeof type === 'string') {
   	// 作为普通元素处理
  } else if (typeof type === Text) {
    // 作为文本节点处理
  } else if (typeof type === Fragment) {
    // 作为片段处理
  } else if (typeof type === 'object') { // [!code focus:9]
    // vnode.type 的值是选项对象，作为组件来处理
    if (!n1) {
      // 挂载组件
      mountComponent(n2, container, anchor)
    } else {
      // 更新组件
      patchComponent(n1, n2, anchor)
    }
  }
}
```

下一步要做的是，设计组件在用户层面的接口。

实际上，组件本身是对页面内容的封装，它用来描述页面内容的一部分。因此，**一个组件必须包含一个渲染函数，即 `render` 函数，并且渲染函数的返回值应该是虚拟 DOM**，用来描述组件所渲染的内容，如下代码所示：

```javascript
const MyComponent = {
	name: 'MyComponent',
  data() {
		return { foo : 1 }
  },
  // 渲染函数
  render() {
    // 返回虚拟 DOM
    return {
    	type: 'div',
      children: '我是文本内容'
    }
	}
}
```

有了基本的组件结构之后，渲染器就可以组件的渲染，如下代码所示：

```javascript
// 用来描述组件的 Vnode 对象，type 属性值为组件的选项对象
const compVnode = {
	type: MyComponent
}
// 调用渲染器来渲染组件
render.render(CompVnode, document.querySelector('#app'))
```

挂载组件函数 `mountComponent`：

```javascript
function mountComponent(vnode, container, anchor) {
  // 通过 vnode 获取组件的选型对象，即 vnode.type
  const componentOptions = vnode.type
  // 获取组件的渲染函数 render
  const { render } = componentOptions
  // 执行渲染函数，获取组件要渲染的内容，即 render 函数返回的虚拟 DOM
  const subTree = render()
  // 最后调用 patch 函数来挂载组件所描述的内容
  patch(null, subTree, container, anchor)
}
```

### 组件状态与自更新

我们约定用户必须使用 `data` 函数来定义组件自身的状态，同时可以在渲染函数中通过 `this` 访问由 `data` 函数返回的状态数据，如下代码所示：

```javascript
const MyComponent = {
	name: 'MyComponent',
  // 用 data 函数定义组件自身的状态
  data() {
		return { foo : 1 }
  },
  // 渲染函数
  render() {
    // 返回虚拟 DOM
    return {
    	type: 'div',
      children: `foo 的值是：${this.foo}` // 在渲染函数内使用组件状态
    }
	}
}
```

然后实现组件自身状态的初始化：

1. 通过组件的选项对象取得 `data` 函数并执行，然后调用 `reactive` 函数将 `data` 函数返回的状态包装为响应式对象；
2. 调用 `render` 函数时，将其 `this` 的指向设置为响应式数据 `state` ，同时将 `state` 作为 `render` 函数的第一个参数传递。

代码如下所示：

```javascript
function mountComponent(vnode, container, anchor) {
  const componentOptions = vnode.type
  const { render, data } = componentOptions
  // 调用 data 函数得到原始数据，并调用 reactive 函数将其包装为响应式数据
  const state = reactive(data())
  // 调用 render 函数时，将其 this 设置为 state
  // 从而 render 函数内部可以通过 this 访问组件自身状态数据
  const subTree = render.call(state, state)
  patch(null, subTree, container, anchor)
}
```

当组件自身状态发生变化时，我们需要触发组件更新，即组件的子更新。为此，我们需要将整个渲染任务包装进一个 `effect` 中作为一个副作用函数，一旦组件自身响应式数据发生变化，组件就会自动重新执行渲染函数，如下代码所示：

```javascript
function mountComponent(vnode, container, anchor) {
  const componentOptions = vnode.type
  const { render, data } = componentOptions
  const state = reactive(data())
  // 将组件的 render 函数调用包装到 effect 内
  effect(() => {
    const subTree = render.call(state, state)
    patch(null, subTree, container, anchor)
  })
}
```

但是，由于 `effect` 的执行是同步的，如果多次修改响应式数据的值，将会导致渲染函数执行多次，这实际上是没必要的。因为，我们需要设计渲染机制，无论对响应式数据进行多少次修改，都只会重新渲染一次。。

为此，我们需要实现一个调度器，当副作用函数需要重新执行时，不会立即同步执行，而是将它缓冲进一个微任务队列中，等到执行栈清空后，再将它从微任务队列中取出并执行。有了缓存机制，就可以对任务进行去重，从而避免多次执行副作用函数带来的性能开销。具体实现如下：

```
```



