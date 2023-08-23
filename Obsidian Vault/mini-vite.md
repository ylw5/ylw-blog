url -> id  -> file -> module

## Esbuild 预构建 

- 转译 ts 但是没有做类型检查
- 将其他格式（CommonJs、UMD）产物转换为 Vite 可用的 ESM 格式，使其能在浏览器通过 `<script type=""module">` 的方式加载。
- 打包合并第三方库，减少 HTTP 请求数量，优化性能


依赖标记：onResolve 解析依赖路径时收集需要构建的依赖 id

代理模块：onLoad 加载模块，返回相应的模块内容

cjs 和 esm 导出内容的区别，export * 不会导出默认导出

调用 build api 进行打包

namespace 命名空间

## 开发服务器与 Rollup 插件

在浏览器解析到 import 后会发送请求，服务器需要给浏览器返回正确的内容。在开发环境下，如何解析路径、找到对应文件，如何加载、处理内容为浏览器可运行数据，这些都需要 Vite 创建的开发服务器来解决。

Rollup 在提供基础的打包服务之上，提供相应插件钩子，可以灵活地解析路径、加载内容、转换内容等，所以可以在开发环境（非打包、为浏览器服务）下模拟这种能力，在解决问题的同时，也能抹平生产环境和开发环境的构建差异。

设定多个 Vite 插件钩子（大多与 Rollup 同构），然后建立一个插件容器，用于注册插件，并且可以模拟 Rollup 对插件钩子进行调度。

主要使用以下三个钩子，对应三个步骤

- resolve

  解析路径。获取引入模块在文件系统中的真实路径或*虚拟路径*，让模块在 load 钩子中能够正常加载。

- load

  加载内容

- transform

  内容转换（例如 JS/TS/JSX/TSX 转换成浏览器可以识别的 JS 语法）
  
  React 17 后使用了[新的 jsx 编译方式](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)，开启新版本的编译策略，需要添加 automatic 选项（这里使用了 esbuild 的 transform api）
  
  ```javascript
  transform(code, {
    jsx: 'automatic',
    loader: extname as 'js' | 'jsx' | 'ts' | 'tsx'
  })
  ```

最后只需要增加服务器中间件，在收到请求 id 时，利用插件容器对这些钩子调度执行，最终获得结果。

主要流程：

TODO？？？？

钩子内部的上下文对象

url：原始请求路径

id：模块唯一标识，为 url 经过 resolveId 钩子解析后的结果



## 静态资源处理

将 css、图片等静态资源都作为 js 模块可导入，可被浏览器识别。



### CSS

使用：

```javascript
import './index.css'
```

后在 transfrom 钩子中包装成 js 模块返回，浏览器执行这段 js 后就会挂载一个对应的 style 元素，将 css 加载到网页中。

```javascript
if (id.endsWith(".css")) {
  // 包装成 JS 模块
  const jsContent = `
    const css = "${code.replace(/\n/g, "")}";
    const style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.innerHTML = css;
    document.head.appendChild(style);
    export default css;
`.trim()
  return {
    code: jsContent,
  };
```



### 图片

先看静态资源的使用：

```javascript
import logo from "./logo.svg";
function App() {
  return (
    <img src={logo} alt="" />
  )
}
```

引入静态资源可分为两步（两次请求）：

1. import 请求模块。该静态资源模块会返回正确的 url（资源路径）
2. 资源内容请求。如浏览器会根据 img src 属性中的 url 请求具体的资源内容

首先在转换 jsx/js 文件中的模块路径时需要给静态资源的引入打上标识（加上 “?import“ 后缀），使得在第一次请求时知道这是一个静态资源：

```javascript
import logo from "/Users/xxx/logo.svg?import"
```

服务器获取请求后在 load 钩子中加载该资源时，将其转换为 js 模块：

```javascript
async load(id) {
	const resolvedId = doSomething(id)
	// 这里仅处理 svg
	if (cleanedId.endsWith(".svg")) {
  	return {
    	code: `export default "${resolvedId}"`,
  	}
  }
}
```

简单来说就是默认导出该资源的路径。

该路径被用在 img src 属性或其他地方的时候，浏览器发送第二次请求，获取具体资源内容。可以直接使用 [sirv](https://github.com/lukeed/sirv/tree/master/packages/sirv)，一个加载静态资源的中间件，它会根据请求资源地址获取具体内容，然后根据内容添加 Content-Length、Content-Type 等响应头信息，也会对资源进行缓存处理。



## HMR 热更新

[HMR基本流程](https://juejin.cn/post/7096103959563075597)

### 服务端

在监听到文件改动时，需要确定要更新哪些模块，也就是确定热更新边界。

> HMR 边界：“接受”热更新到模块。（通过静态分析源码中的 `import.meta.hot.accept(` 语句确定是否支持）
>
> Vite 的 HMR 实际上并不替换最初导入的模块：如果 HMR 边界模块从某个依赖重新导出其导入，则它应负责更新这些重新导出的模块（这些导出必须使用 `let`）。此外，从边界模块向上的导入者将不会收到更新

所以在服务端解析文件时，就需要顺便构建模块依赖图，记录模块间的依赖关系，模块引用了谁，被谁引用（在 build 模式下直接由 Rollup 构建）。

实现方式：使用插件在 transform 钩子中对 import 语句进行分析时即可，在处理浏览器请求文件的同时模块依赖图也随之建立。

[Vite 是如何记录项目中所有模块的依赖关系的](https://cloud.tencent.com/developer/article/2204875)

创建 WebSocket 服务器，在文件变化（新增/修改/删除）时，获取该文件对应的模块，然后根据模块依赖图，给需要更新的模块失活（清除服务端 transform 缓存），最后找到热更新边界，收集所有需要更新的模块，最后构造完整更新信息向客户端发送。

### 客户端

客户端需要接收服务端发来的热更新信息，需要在页面中注入 Websocket 客户端代码。

实现：在 transformIndexHtml 钩子时插入 script 标签引入脚本。

同时对于能接受自身更新的模块注入客户端热更新上下文，其中包含了相关工具函数，可用于注册回调函数，在热更新的不同阶段执行，例如：

- `hot.accept(cb)`

   接受模块自身，拿到自身已更新模块后执行，比如重新执行新模块的渲染函数

  ```javascript
  if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
      if (newModule) {
        console.log('updated: count is now ', newModule.count)
      }
    })
  }
  ```

- `hot.despose(cb)`

  热更新前执行清理副作用

当客户端在接受到更新信息后，动态拉取 `const newModule = await import(path)` 更新模块，浏览器会执行新文件并拿到新模块内容，在这过程中执行已注册的回调。



## TreeShaking




## 问题

- 预构建生成的文件，两个chunk，和官方有差异
- 

- 在 rollup 构建时启动 react 开发模式，需引入 jsx-dev-runtime.js，如何开启开发模式

- 在下载vite后会自动声明module "*.svg"等，内部怎么做的