---
title: 读书笔记——渲染器
description: Vue.js 渲染器原理
time: 2022-11-02
---



# 读书笔记——渲染器

## 渲染器的设计

>  `renderer` 表示渲染器，`render` 表示渲染（动词），渲染器的作用包括但不限于渲染（例如激活已有元素），其作用是把虚拟 DOM 渲染为特定平台上的真实元素。在浏览器平台上，渲染器会把虚拟 DOM 渲染为真实 DOM 元素。

虚拟 DOM：virtual DOM，简写成 `vdom`，和真实 DOM 一样都是由一个个节点组成的树形结构

虚拟节点：virtual node，简写成 `vnode`。虚拟 DOM 树上的任何一个 `vnode` 节点都可以是一颗子树

挂载：mount，把虚拟 DOM 节点渲染为真实 DOM 节点的过程

容器：container，渲染器需要接收一个挂载点作为参数，用来指定具体的挂载位置

```javascript
// 渲染器
function createRenderer() {
  // 渲染函数
  function render(vnode, container) {
    // ...
  }
  // 其他功能
  return {
    render
  }
}

const renderer = createRenderer()
// 首次渲染
renderer.render(oldVnode, document.querySelector('#app'))
// 第二次渲染
renderer.render(newVnode, document.querySelector('#app'))
```

补丁 / 更新：patch，渲染器使用 `newVnode` 与上次渲染的 `oldVnode` 进行比较，视图找到并更新变更点的过程。挂载可以看作特殊的补丁（`oldVnode` 不存在）

现在假设要渲染普通的元素，例如：

```javascript
const vnode = {
  type: 'h1',
  children: 'hello'
}
```

实现一个最基础的渲染器：

```javascript
// 渲染器
function createRenderer() {
  // 打补丁
  function patch(n1, n2, container) {
    // 如果 n1 不存在，意味着挂载，调用 mountElement 函数完成挂载
    if (!n1) {
      mountElement(n2, container)
    } else {
      // n1 存在，意味着打补丁，暂时省略
    }
  }
  // 挂载函数
  function mountElement(vnode, container) {
    // 创建 DOM 元素
    const el = document.createElement(vnode.type)
    // 处理子节点，如果子节点是字符串，代表元素具有文本节点
    if (typeof vnode.children === 'string') {
      // 因此只需要设置元素的 textContent 属性即可
      el.textContent = vnode.children
    }
    container.appendChild(el)
  }

  // 渲染
  function render(vnode, container) {
    if (vnode) {
      // 新 vnode 存在，将其与旧 vnode 一起传递给 patch 函数，进行打补丁
      patch(container._vnode, vnode, container)
    } else {
      if (container._vnode) {
        // 旧 vnode 存在，且新 vnode 不存在，说明是卸载（unmount）操作
        // 将 DOM 清空，暂时模拟卸载
        container.innerHTML = ''
      }
    }
    container._vnode = vnode
  }
  // 其他功能
  return {
    render
  }
}
```

渲染器目标是一个不依赖浏览器平台的，但以上 `mountElement` 挂载函数中一路来的大量 浏览器的 API 例如：`document.createElement`、`el.textContent` 以及 `appendChild` 等，我们可以将这些操作 DOM 的API 作为配置项，传入 `createRenderer` 函数：

```javascript
// 渲染器
function createRenderer(options) {
  // 通过 options 得到操作 DOM 的 API
  const {  // [!code ++]
    createElement,  // [!code ++]
    insert,  // [!code ++]
    setElementText  // [!code ++]
  } = options  // [!code ++]
  // 打补丁
  function patch(n1, n2, container) {
    // 如果 n1 不存在，意味着挂载，调用 mountElement 函数完成挂载
    if (!n1) {
      mountElement(n2, container)
    } else {
      // n1 存在，意味着打补丁，暂时省略
    }
  }
  // 挂载函数
  function mountElement(vnode, container) {
    // 创建 DOM 元素
    const el = createElement(vnode.type) // [!code hl]
    // 处理子节点，如果子节点是字符串，代表元素具有文本节点
    if (typeof vnode.children === 'string') {
      // 因此只需要设置元素的 textContent 属性即可
      setElementText(el, vnode.children) // [!code hl]
    }
    // 调用 insert 函数将元素插入到容器内
    insert(el, container) // [!code hl]
  }

  // 渲染
  function render(vnode, container) {
    if (vnode) {
      patch(container._vnode, vnode, container)
    } else {
      if (container._vnode) {
        container.innerHTML = ''
      }
    }
    container._vnode = vnode
  }
  // 其他功能
  return {
    render
  }
}

const renderer = createRenderer({
  // 用于创建元素
  createElement(tag) {  // [!code ++]
    return document.createElement(tag)  // [!code ++]
  },  // [!code ++]
  // 用于设置元素的文本节点
  setElementText(el, text) {  // [!code ++]
    el.textContent = text  // [!code ++]
  },  // [!code ++]
  // 用于在给定的 parent 下添加指定元素，若锚点 anchor 存在，插入到 anchor 前
  insert(el, parent, anchor = null) {  // [!code ++]
    parent.insertBefore(el, anchor)  // [!code ++]
  }  // [!code ++]
})
```

## 挂载子节点

一个元素出了既有文本子节点外，还可以包含很多子节点，此时 `vnode.children` 定义为一个数组。

修改 `mountElement` 函数：

```javascript
function mountElement(vnode, container) {
  const el = createElement(vnode.type)
  // 如果子节点是字符串，代表元素具有文本节点
  if (typeof vnode.children === 'string') {
    // 因此只需要设置元素的 textContent 属性即可
    setElementText(el, vnode.children)
  } else if (Array.isArray(vnode.children)) { // [!code ++]
    // 如果 children 是数组，则遍历每一个子节点，并调用 patch 函数打补丁
    vnode.children.forEach(child => { // [!code ++]
      // 第一个参数是 null，函数执行时递归调用 mountElement挂载
      // 传递刚创建的元素作为挂载点
      patch(null, child, el) // [!code ++]
    })
  }
  insert(el, container)
}
```

## 设置元素属性

为了描述元素的属性，我们需要为虚拟 DOM 定义新的 `vnode.props` 字段：

```javascript
const vnode = {
  type: 'div',
  // 使用 props 描述一个元素的属性
  props: {
    id: 'foo'
	},
  children: [
    {
      type: 'p',
      children: 'hello'
		}
  ]
}
```

但这里不能简单地直接设置  `el[key] = vnode.props[key]`，因为这设计两个概念：HTML Attributes 和 DOM properties。

### HTML Attributes 和 DOM properties

以如下 HTML 代码为例：

```html
<input id="my-input" type="text" value="foo" />
```

HTML Attributes 指的是定义在 **HTML 标签**上的属性，这里指的就是 `id="my-input"`、`type="text"`、`value="foo"`

 DOM properties 指的是这个 **DOM 对象**上包含的属性

二者关系：

- 很多 HTML Attributes 在 DOM 对象上有与之同名的  DOM properties，但不总是一摸一样
- 并不是所有 HTML Attributes 都有与之对应的 DOM properties
- 并不是所有 DOM properties 都有与之对应的 HTML Attributes
- 一个 HTML Attributes 可能关联多个 DOM properties
- **HTML Attributes 的作用是设置与之对应的 DOM properties 的初始值**

对于普通 HTML 文件来说，浏览器解析 HTML 代码后，会自动分析 HTML Attribute 并设置合适的 DOM Properties。现在框架需要完成这部分工作。

### DOM Properties 优先

以禁用的按钮为例，如下 HTML 代码所示：

```html
<button disabled>Button</button>
```

浏览器解析这段代码时，发现这个按钮存在叫用 `disable` 的 HTML Attributes，于是会将按钮设置为禁用状态，并将它的 `el.diabled` 这个 DOM properties 的值设置为 `true`。

但是在 Vue.js 模板中，它会被编译为 `vnode`，等价于：

```javascript
const button = {
  type: 'button',
  props:{
		disabled: '' // 空字符串
  }
}
```

如果这时掉用 `setAttribute` 函数设置属性，相当于 `el.setAttribute('diabled', '')`，这样没问题，按钮会被禁用。但如果考虑如下模板：

```html
<button :disabled="false">Button</button>
```

 相当于 `el.setAttribute('diabled', false)`，但是浏览器运行这句代码时等价于 `el.setAttribute('diabled', 'false')`

，因为 `setAttribute` 函数设置的值总是会被字符化，所以按钮仍然被禁用，虽然用户希望不禁用按钮。

对于按钮而言，他的 `el.disabled` 的属性值时布尔类型，并且只要  HTML Attributes 的 `diabled` 属性存在，按钮就会被禁用。

要解决以上问题，我们需要特殊处理：优先设置元素的 DOM properties，但当值为空字符串时，要手动将值矫正为 `true`。

```javascript
function shouldSetAsProps(el, key, value) { // [!code focus:6]
  // 特殊处理，例如只读的 DOM properties,以下其中只说明一种特殊情况
  if (key === 'form' && el.tagName === 'INPUT') return false
  
  return key in el
}
// 挂载函数
function mountElement(vnode, container) {
  // 创建 DOM 元素
  const el = createElement(vnode.type)
  // 省略子节点 children 的处理

  if (vnode.props) { // [!code focus:16]
    for (const key in vnode.props) {
      const value = vnode.props[key]
      // 优先使用 shouldSetAsProps 函数判断是否应该作为 DOM properties 设置
      if (shouldSetAsProps(el, key, value)) {
        const type = typeof el[key]
        if (type === 'boolean' && value === '') {
          el[key] = true
        } else {
          el[key] = value
        }
      } else {
        el.setAttribute(key, value)
      }
    }
  }
  
  insert(el, container)
}
```

最后需要把属性的设置也变成与平台无关，把属性设置相关操作封装成一个函数 `patchProps`。

```javascript
const renderer = createRenderer({
  createElement(tag) {
    return document.createElement(tag)
  },
  setElementText(el, text) {
    el.textContent = text
  },
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor)
  },
  // 将属性设置相关操作封装到 patchProps 函数中，并作为渲染器选项传递 // [!code focus:14]
  // preValue、nextValue参数两个 value 参数是为了将来新旧节点的更新操作
  patchProps(el, key, preValue, nextValue) { 
    if (shouldSetAsProps(el, key, nextValue)) { 
      const type = typeof el[key]
      if (type === 'boolean' && nextValue === '') { 
        el[key] = true 
      } else {
        el[key] = nextValue 
      } 
    } else { 
      el.setAttribute(key, nextValue) 
    } 
  } 
})
```

在 `mountElement` 函数中只需调用 `patchProps` 函数，并为其传递相关参数。

```javascript
function mountElement(vnode, container) {
  const el = createElement(vnode.type)

  if (typeof vnode.children === 'string') {
    setElementText(el, vnode.children)
  } else if (Array.isArray(vnode.children)) {
    vnode.children.forEach(child => {
      patch(null, child, el)
    })
  }

  if (vnode.props) {
    for (const key in vnode.props) {
      // 调用 patchProps 函数即可
      patchProps(el, key, null, vnode.props[key]) // [!code ++]
    }
  }
  // 调用 insert 函数将元素插入到容器内
  insert(el, container)
}
```

## Class 的处理

在 Vue.js 中为元素设置类名有以下几种方式

1. `class` 为字符串

   ```html
   <p class="foo bar"></p>
   ```

   对应 `vnode` 是：

   ```javascript
   const vnode = {
   	type: 'p',
     props: {
       class: 'foo bar'
     }
   }
   ```

2. `class` 为一个对象值

   ```html
   <p :class="cls"></p>
   ```

   对应 `vnode` 是：

   ```javascript
   const cls = {foo: true, bar: false}
   const vnode = {
   	type: 'p',
     props: {
       class: {foo: true, bar: false}
     }
   }
   ```

3. `class` 是包含上述两种类型的数组

   ```html
   <p :class="arr"></p>
   ```

   对应 `vnode` 是：

   ```javascript
   const arr = [
     // 字符串
     'foo bar',
     // 对象
     {
       baz: true
     }
   ]
   const vnode = {
   	type: 'p',
     props: {
       class: [
         'foo bar',
         { baz: ture }
       ]
     }
   }
   ```

`class` 是多种类型的，所以在设置元素的 `class` 前要将值统一为字符串形式

```javascript
const vnode = {
	type: 'p',
  props: {
    // 使用 normalizeClass 函数对值进行序列化
    class: normalizeClass([
      'foo bar',
      { baz: ture }
    ])
  }
}
```

调整 `patchProps` 函数：

```javascript
const renderer = createRenderer({
  // 省略其他选项
  
  patchProps(el, key, preValue, nextValue) {
    if (key === 'class') { // [!code ++]
      // el.className 设置 class 的方式性能最好 // [!code ++]
      el.className = nextValue // [!code ++]
    } else if (shouldSetAsProps(el, key, nextValue)) {
      const type = typeof el[key]
      if (type === 'boolean' && nextValue === '') {
        el[key] = true
      } else { 
        el[key] = nextValue 
      }
    } else { 
      el.setAttribute(key, nextValue) 
    }
  } 
})

```

除了 `class` 属性之外，也需要对 `style` 做类似处理。

## 卸载操作

前文中我们使用 `container.innerHTML = ''` 模拟卸载，但这无法移除绑定在 DOM 元素上的事件处理函数，也无法执行响应的生命周期函数和指令钩子函数。

正确的卸载方式：根据 `vnode` 对象获取与其相关联的真实 DOM 元素，然后使用原生 DOM 操作方法将该 DOM 元素移除。

为此，需要在 `vnode` 与真实 DOM 元素之间建立联系。修改 `mountElement` 函数：

```javascript
function mountElement(vnode, container) {
  // 创建 DOM 元素
  const el = createElement(vnode.type)
  // 让 vnode.el 引用真实 DOM
  vnode.el = el // [!code ++]

  if (typeof vnode.children === 'string') {
    setElementText(el, vnode.children)
  } else if (Array.isArray(vnode.children)) {
    vnode.children.forEach(child => {
      patch(null, child, el)
    })
  }
```

创建真实 DOM 时，把真实 DOM 元素赋值给 `vnode.el` 属性，我们可以通过 `vnode.el` 来获取该虚拟节点对应的真实 DOM 元素。

卸载时，只需要根据虚拟节点对象 `vnode.el` 获得真实 DOM 元素，再将其从父元素中移除即可：

```javascript
// 卸载函数
function unmount(vnode) {
  const parent = vnode.el.parentNode
  if (parent) {
    parent.removeChild(vnode.el)
  }
}

// 渲染函数
function render(vnode, container) {
  if (vnode) {
    patch(container._vnode, vnode, container)
  } else {
    if (container._vnode) {
      container.innerHTML = '' // [!code --]
      unmount(container._vnode) // [!code ++]
    }
  }
  container._vnode = vnode
}
```

- 在 `unmount` 函数内，我们有机会嗲用绑定在 DOM 元素上的指令钩子函数
- 在 `unmount` 函数执行时，我们有机会检测虚拟节点 `vnode` 的类型。如果是组件，可以调用组件相关生命周期函数

## 区分 vnode 的类型

**在补丁操作 `patch` 之前，我们需要保证新旧 `vnode` 所描述的内容相同**。

假设初次渲染的 `vnode` 是一个 `p` 元素，后续又渲染了一个 `input` 元素，这就会造成新旧 `vnode` 所描述的内容不同，即 `vnode.type` 属性的值不同，他们之间不存在打补丁的意义。在这种情况下，应该先将 `p` 元素卸载，再将 `input` 元素挂载到容器中：

```javascript
function patch(n1, n2, container) {
  if (n1 && n1.type !== n2.type) { // [!code ++]
    unmount(n1) // [!code ++]
    n1 = null // [!code ++]
  }
  if (!n1) {
    mountElement(n2, container)
  } else {
    // n1 存在，意味着打补丁，暂时省略
  }
}
```

`vnode` 可以用来描述普通标签，也可以用来描述组件，还可以用来描述 Fragment 等。所以 即使新旧 `vnode` 描述的内容相同，我们对于不同类型的 `vnode`，我们需要提供不同的挂载或打补丁的处理方式：

```javascript
function patch(n1, n2, container) {
  if (n1 && n1.type !== n2.type) {
    unmount(n1)
    n1 = null
  }
  const { type } = n2 // [!code ++]
  // 如果 n2.type 的值是字符串类型，则它描述的是普通标签元素
  if (typeof type === 'string') { // [!code ++]
    if (!n1) {
      mountElement(n2, container)
    } else {
      // 给普通标签元素打补丁
      patchElement(n1, n2)
    }
  } else if (typeof type === 'object') { // [!code ++]
    // 如果 n2.type 的值的类型是对象，则它描述的是组件
  } else if (typeof type === 'xxx') { // [!code ++]
    // 处理其他类型的 vnode
  }
}
```

## 事件处理

事件可以视为一种特殊的属性。我们约定，在 `vnode.props` 对象中，凡是以字符串 `on` 开头的属性都视作事件。例如：

```javascript
const vnode = {
	type: 'p',
  props: {
    // 使用 onXxx 描述事件
    onClick: () => {
			alert('clicked')
    }
  },
  children: 'text'
}
```

只需在 `patchProps` 中调用 `addEventListener` 和 `removeEventListener` 跟新事件：

```javascript
patchProps(el, key, preValue, nextValue) {
  if (/^on/.text(key)) { // [!code focus:8]
    // 根据属性名称得到对应的事件类型/名称，例如 onClick --> click
    const type = key.slice(2).toLowerCase()
    // 移除上一次绑定的事件处理函数
    preValue && el.removeEventListener(type, preValue)
    // 绑定事件，nextValue 为事件处理函数
    el.addEventListener(type, nextValue)
  }
  else if (key === 'class') {
    // 省略代码
  } else if (shouldSetAsProps(el, key, nextValue)) {
    // 省略代码
  } else {
    // 省略代码
  }
}
})
```

这样能按照预期工作，但还有一种性能更优的方式。我们可以绑定一个伪造的处理函数 `invoker`，然后把真正的事件处理函数设置为 `invoker.value` 属性的值，在 `invoker` 中调用 `invoker.value`。这样当更新事件时，我们将不再需要调用 `removeEventListener` 函数来移除上一次绑定的事件，只需更新 `invoker.value` 的值即可（闭包）。由于事件种类很多，防止事件覆盖，设计 `el._vei` 对象（vue_event_invoker 的首字母缩写），存储不同种类的伪处理函数，它的键是事件名称，值是其对应的伪事件处理函数。

```javascript
patchProps(el, key, preValue, nextValue) {
  if (/^on/.text(key)){  // [!code focus:24]
    // 定义 el.vei 为一个对象，存在事件名称到事件处理函数的映射
    const invokers = el._vei || (el._vei = {})
    // 根据事件名称获取对应伪处理函数 invoker
    let invoker = invokers[key]
    const type = key.slice(2).toLowerCase()
    if (nextValue) {
      if (!invoker) {
        // 将事件处理函数缓存到 el.vei[key] 下，避免覆盖
        invoker = el._vei[key] = (e) => {
          // 利用闭包
          invoker.value(e)
        }
        invoker.value = nextValue
        // 绑定事件
        el.addEventListener(type, invoker)
      } else {
        // 更新事件
        invoker.value = nextValue
      }
    } else if (invoker) {
      // 移除事件
      el.removeEventListener(type, invoker)
    } 
  } else if (key === 'class') {
    // 省略代码
  } else if (shouldSetAsProps(el, key, nextValue)) {
    // 省略代码
  } else {
    // 省略代码
  }
}
```

另外一个元素不仅可以绑定多种类型事件，对于同一类型的事件，还可以绑定多个事件处理函数，所以此时 `vnode.props` 对象中的事件是一个数组：

```javascript
const vnode = {
	type: 'p',
  props: {
    // 使用 onXxx 描述事件
    onClick: [
      // 第一个事件处理函数
      () => { alert('clicked 1') },
      // 第二个事件处理函数
      () => { alert('clicked 2') }
    ]
  },
  children: 'text'
}
```

修改 `patchProps` 函数中事件处理相关代码：

```javascript
patchProps(el, key, preValue, nextValue) {
  if (/^on/.text(key)){  // [!code focus:27]
    // 定义 el.vei 为一个对象，存在事件名称到事件处理函数的映射
    const invokers = el._vei || (el._vei = {})
    let invoker = invokers[key]
    const type = key.slice(2).toLowerCase()
    if (nextValue) {
      if (!invoker) {
        invoker = el._vei[key] = (e) => {
          // 如果 invoker.value 是数组，则遍历它并逐个调用事件处理函数
          if (Array.isArray(invoker.value)) { // [!code ++]
            invoker.value.forEach(fn => fn(e)) // [!code ++]
          } else { // [!code ++]
            // 否则直接函数调用
            invoker.value(e) // [!code ++]
          }
        }
        invoker.value = nextValue
        // 绑定事件
        el.addEventListener(type, invoker)
      } else {
        // 更新事件
        invoker.value = nextValue
      }
    } else if (invoker) {
      // 移除事件
      el.removeEventListener(type, invoker)
    } 
  } else if (key === 'class') {
    // 省略代码
  } else if (shouldSetAsProps(el, key, nextValue)) {
    // 省略代码
  } else {
    // 省略代码
  }
}
```

## 事件冒泡与更新时机问题

例子：

```javascript
const bol = ref(false)
effect(() => {
	const vnode = {
		type: 'div',
    props: bol.value ? {
			onClick: () => {
        alert('父元素 clicked')
      }
    } : {},
    children: [
      {
				type: 'p',
        props: {
					onClick: () => {
            bol.value = true
          }
        },
        children: 'text'
      }
    ]
  }
  renderer.render(vnode, document.querySelector('#app'))
})
```

父元素的点击事件是由响应式数据 `bol` 决定的，初始状态 `bol = false`，父元素没有绑定事件。当点击子元素，我们希望触发除了修改 `bol` 什么都不会发生，但是事实上会发现父元素的 `click` 事件也触发了。

原因是：**为元素绑定事件处理函数发生在事件冒泡之前。**

即使把绑定事件的动作放到微任务中，也无法避免这个问题，因为**微任务会穿插在由事件冒泡触发的多个事件处理函数之间被执行**。

解决方式：**屏蔽所有绑定时间晚于事件触发时间的事件处理函数的执行**

调整 `patchProps` 函数中关于事件的代码：

```javascript
patchProps(el, key, preValue, nextValue) {
  if (/^on/.text(key)) {
    const invokers = el._vei || (el._vei = {})
    let invoker = invokers[key]
    const type = key.slice(2).toLowerCase()
    
    if (nextValue) {
      if (!invoker) {
        invoker = el._vei[key] = (e) => {
          // e.timeStamp 是事件发生的事件
          // 如果事件发生的时间早于事件处理函数绑定的时间，则不执行事件处理函数
          if (e.timeStamp < invoker.attached) return // [!code ++]
          if (Array.isArray(invoker.value)) {
            invoker.value.forEach(fn => fn(e))
          } else {
            invoker.value(e)
          }
        }
        invoker.value = nextValue
        // 绑定事件
        // 添加 invoker.attached 属性，存储事件处理函数被绑定的事件
        invoker.attached = performance.now() // [!code ++]
        el.addEventListener(type, invoker)
      } else {
        invoker.value = nextValue
      }
    } else if (invoker) {
      el.removeEventListener(type, invoker)
    }
  }
  else if (key === 'class') {
    // 省略
  } else if (shouldSetAsProps(el, key, nextValue)) {
    // 省略
  } else {
    // 省略
  }
}
```

## 更新子节点

对于一个元素来说，子节点分三种情况：

- 没有子节点，`vnode.children` 的值为 `null`
- 具有文本子节点，`vnode.children` 的值为字符串，代表文本内容
- 其他情况，单个元素子节点或多个子节点，都可以用数组表示

根据新旧子节点的三种情况分点讨论即可：

```javascript
// 更新元素
function patchElement(n1, n2) {
  const el = n2.el = n1.el
  const oldProps = n1.props, newProps = n2.props
  // 第一步，更新 props
  for (const key in newProps) {
    if (newProps[key] !== oldProps[key]) {
      patchProps(el, key, oldProps[key], newProps[key])
    }
  }
  for (const key in oldProps) {
    if (!(key in newProps)) {
      patchProps(el, key, oldProps[key], null)
    }
  }
  // 第二步，更新 children
  patchChildren(n1, n2, el)
}

// 更新子节点
function patchChildren(n1, n2, container) {
  // 当新子节点是文本节点类型
  if (typeof n2.children === 'string') {
    // 旧子节点的类型有三种可能：没有子节点、文本子节点、一组子节点
    // 只有当旧子节点为一组子节点时，才需要逐个卸载，其他情况下什么都不需要做
    if (Array.isArray(n1.children)) {
      n1.children.forEach(c => unmount(c))
    }
    // 最后将新的文本节点内容设置给容器元素
    setElementText(container, n2.children)
  } else if (Array.isArray(n2.children)) {
    // 当新子节点是一组子节点
    // 判断旧子节点是否也是一组子节点
    if (Array.isArray(n1.children)) {
      // 说明新旧子节点都是一组子节点，这里涉及核心的 diff 算法
    } else {
      // 此时旧子节点要么是文本子节点，要么不存在
      // 只需将容器清空，然后新的一组子节点挂载上去
      setElementText(container, '')
      n2.children.forEach(c => patch(null, c, container))
    }
  } else {
    // 新子节点不存在
    // 旧子节点是一组子节点，只需逐个卸载
    if (Array.isArray(n1.children)) {
      n1.children.forEach(c => unmount(c))
    } else if (typeof n1.children === 'string') {
      // 旧子节点是文本子节点，清空内容即可
      setElementText(container, '')
    }
    // 旧子节点也不存在，什么都不做
  }
}
```

## 文本节点和注释节点

文本节点与注释节点不同于普通标签节点，不具有标签名称，所以需要认为创造一些唯一标识作为节点的 `type` 属性：

```javascript
// 文本节点的 type 标识
const Text = Symbol()
const newVnode = {
  // 描述文本节点
  type: Text,
  children: '我是文本内容'
}

// 注释节点的 type 标识
const Comment  = Symbol()
const newVnode = {
  // 描述注释节点
  type: Comment,
  children: '我是注释内容'
}
```

在 `patch` 根据中根据节点的 `type` 属性值添加新的分支分别处理文本和注释节点的情况，略

## Fragment

> `Fragment` （片断）是 Vue.js 3 中新增的一个 `vnode` 类型

Vue.js 3 使用 `Fragment` 支持多根节点模板。对于 `Fragment` 类型的 `vnode` 来说，它的 `children` 存储的内容就是模板中所有根节点。

```html
<!-- Items.vue -->
<template>
	<li>1</li>
  <li>2</li>
  <li>3</li>
</template>
```

这段模板对应的虚拟节点是：

```javascript
const Fragment = Symbol()
const vnode = {
  type：Fragment,
  children: [
    {type: 'li', children: '1'},
    {type: 'li', children: '2'},
    {type: 'li', children: '3'},
  ]
}
```

当渲染器渲染 `Fragment` 类型的虚拟节点时，只会渲染它的子节点，代码如下：

```javascript
function patch(n1, n2, container) {
  if (n1 && n1.type !== n2.type) {
    unmount(n1)
    n1 = null
  }
  const { type } = n2
  if (typeof type === 'string') {
    // 省略
  } else if (typeof type === Text) {
    // 省略
  } else if (typeof type === Fragment) { // [!code focus:8]
    if (!n1) {
      // 如果旧 vnode 不存在，则只需要将 Fragment 的 children 逐个挂载即可
      n2.children.forEach(c => patch(null, c, container))
    } else {
      // 如果旧 vnode 存在，则只需要更新 Fragment 的 children 即可
      patchChildren(n1, n2, container)
    }
  }
```

​	`unmount` 函数也需要至此 `Fragment` 类型的虚拟节点的卸载：

```javascript
function unmount(vnode) {
  if (vnode.type = Fragment) {
    vnode.children.forEach(c => unmount(c))
  }
  const parent = vnode.el.parentNode
  if (parent) {
    parent.removeChild(vnode.el)
  }
}
```



