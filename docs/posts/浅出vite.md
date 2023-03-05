## Esbuild

### 预构建

作用：

- 模块格式兼容问题，第三方库没有 ES 版本的产物
- 打包第三方库文件，合并代码，减少 HTTP 请求数量

缺点：

- 不支持降级到 ES5，可能不兼容低端浏览器
- 不支持 const、enum等语法
- 不提供操作打包产物的接口
- 不支持自定义代码分割 code splitting 接口，缺乏拆包灵活性

### 编译 TS 和 JSX

Esbuild 转译 TS 或 JSX 的 Transformer 能力通过 Vite 插件提供

优点：

- 快

缺点：

- 没有实现 TS 的类型系统，编译文件时仅仅抹掉了类型相关的代码，没有类型检查

### 代码压缩（生产环境）

优点：

- 快，效率高

原因：

- 在构建流程中尽可能复用一份 AST，减少了重复解析和内存浪费
- 使用 Golang 原生语言，适合压缩这种 CPU 密集型的工作

## Rollup

### 打包（生产环境）

优点：

- CSS 代码分割。自动抽离异步模块引入的 CSS 代码，提高线上产物的缓存复用率
- 自动预加载。Vite 自动为入口 chunk 的依赖自动生成预加载标签 `<link rel="modulepreload">`

- 异步 Chunk 加载优化。？？？？

### 成熟的插件机制

Vite 根植于 Rollup 的插件机制和生态，Vite 的插件写法基本兼容 Rollup。

如何实现？？？？pluginContainer

## tree-shaking

