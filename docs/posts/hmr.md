---
title: Vite HMR 
time: 2023-01-13
---



HMR （Hot Module Replace），即热插拔或模块热更新。

实现局部刷新和状态保存

Vite 接收更新（hot.accept）的三个策略：

- 接收自身模块更新
- 接收依赖模块的更新
- 接收多个子模块的更新

条件守卫 `if(import.meta.hot)` ：`import.meta.hot` 对象只有在开发阶段才会被注入到全局，生产环境访问不到；打包时如果条件不成立，TreeShaking，优化资源体积

其他 API ？？？

原理

1. 利用服务器中间件创建模块依赖图 ModuleGraph

   其中定义若干 Map 来记录模块信息 
   
   - 原始请求 url 到模块节点的映射 
   
     `urlToModuleMap = new Map<string, ModuleNode>()`
   
   - 模块 id 到模块节点的映射（id 为经过 resolveId 钩子解析后的结果）
   
     `idToModuleMap = new Map<string, ModuleNode>()`
   
   - 文件到模块节点的映射（单文件可能存在多个模块依赖）
   
     `fileToModulesMap = new Map<string, Set<ModuleNode>>()`
   
   模块节点 ModuleNode 的具体信息如下：
   
   ```javascript
   class ModuleNode {
     // 原始请求 url
     url: string
     // 文件绝对路径 + query
     id: string | null = null
     // 文件绝对路径
     file: string | null = null
     type: 'js' | 'css'
     // ...
     // 该模块的引用方
     importers = new Set<ModuleNode>()
     // 该模块所依赖的模块
     importedModules = new Set<ModuleNode>()
     // 接受更新的模块
     acceptedHmrDeps = new Set<ModuleNode>()
     // 是否为`接受自身模块`的更新
     isSelfAccepting = false
     // 经过 transform 钩子后的编译结果
     transformResult: TransformResult | null = null
     // ...
     // 上一次热更新的时间戳
     lastHMRTimestamp = 0
   
     constructor(url: string) {
       this.url = url
       this.type = isDirectCSSRequest(url) ? 'css' : 'js'
     }
   }
   ```
   
   
   
   开发服务器（Vite Dev Server）transform 中间件得到请求的 url，从 moduleGraph 中查找对应模块节点 ModuleNode，如果没有缓存，则调用插件容器的 resolveId 和 load 钩子进行模块加载，创建新的 ModuleNode 模块节点对象，并记录到 urlToModuleMap、idToModuleMap、fileToModulesMap 这三张映射表中。
   
2. 绑定各节点依赖关系

在 vite:import-analysis 插件中，transform 钩子会对模块代码的 import 语句进行分析，得到如下信息：

- `importedUrls`：当前模块的依赖模块 url 集合
- `acceptedUrls`：当前模块中通过 `import.meta.hot.accept` 声明的依赖模块url 集合
- `isSelfAccepting`：分析 `import.meta.hot.accept` 的用法，标记是否为接收自身更新类型

根据以上信息即可对模块进行关系绑定（更新自身以及依赖模块的 ModuleNode 信息 isSelfAccepting、importers、importedModules、acceptedHmrDeps）。

随着所有模块经过 vite:import-analysis 的 transform 钩子处理，所有模块之间的依赖关系被记录下来，整个依赖图信息被补充完整。





在服务启动时监听文件变化（chokidar），向服务端发送消息

- 修改文件

  对该文件的模块节点进行清除缓存（删除节点中存储的的编译结果）

  HMR 收集更新阶段

  - 配置文件和环境变量声明文件的改动

    Vite 会直接重启服务器

  - 客户端注入文件（vite / dist / client / client.mjs）改动

    向客户端发送 full-reload 信号（websocket），使之刷新页面

    ```javascript
    ws.send({
    	type: 'full-reload',
      path: '*'
    })
    ```

  - 普通文件变动

    1. 根据文件获得需要更新的模块

       ```javascript
       const mods = moduleGraph.getModulesByFile(file)
       ```

    2. 初始化 HMR 上下文对象（存储当前文件的 HMR 信息）

       ```javascript
       const timeStamp = Date.now()
       const hmrContext = {
       	file,
         timestamp,
         modules: mods ? [...mods] :[],
         read: () => readModifiedFile(file),
         server
       }
       ```

    3. 执行插件的 handleHotUpdate 钩子，得到处理后的 HMR 模块

       ```javascript
       const filteredModules = await plugin.handleHotUpdate(hmrContext)
       if (fileteredModules) {
         hmrContext.modules = filteredModules
       }
       ```

    4. 获取热更新边界信息，将模块更新的信息传到客户端
    
       遍历第三步得到的需要热更新的模块，初始化热更新边界集合
    
       ```typescript
       const boundaries = new Set<{
         boundary: ModuleNode
         acceptedVia: ModuleNode
       }>
       ```
    
       调用函数收集热更新边界（返回值是判断是否需要刷新页面）
    
       ```javascript
       const hasDeadEnd = propagateUpdate(mod, boundaries)
       ```
    
       记录热更新边界信息
    
       ```typescript
       const updates: Update[] = []
       updates.push(
         ...[...boundaries].map(({ boundary, acceptedVia }) => ({
           type: `${boundary.type}-update` as Update['type'],
           timestamp,
           path: boundary.url,
           acceptedPath: acceptedVia.url
         }))
       )
       ```
    
       ::: details propagateUpdate 函数具体实现：根据模块上的引用方 importer 和引用方模块上的 acceptedHmrDeps 信息绑定边界信息，并递归调用
    
       ```typescript
       function propagateUpdate(
         node: ModuleNode,
         boundaries: Set<{
           boundary: ModuleNode
           acceptedVia: ModuleNode
         }>,
         currentChain: ModuleNode[] = [node]
       ) {
         // ...
         for (const importer of node.importers) {
           const subChain = currentChain.concat(importer)
           if (importer.acceptedHmrDeps.has(node)) {
             boundaries.add({
               boundary: importer,
               acceptedVia: node
             })
             continue
           }
           if (currentChain.include(importer)) {
             // 出现循环依赖，需要强制刷新页面
             return true
           }
           // 递归向更上层的引用方寻找热更新边界
           if (propagateUpdate(importer, boundaries, subChain)) {
             return true
           }
         }
         // ...
       }
       ```
    
       :::
    
       

- 新增和删除文件

  



> Vite 在开发阶段会默认在 HTML 中注入一段客户端脚本 `<script type="module" src="/@vite/client"></script>`，与 Vite Dev Server 建立双向连接，接收服务端传来的更新信息



客户端通过 WebSocket 接收更新信息



case update

```json
{
  type: "update",
  update: [
    {
      // 更新类型，也可能是 `css-update`
      type: "js-update",
      // 更新时间戳
      timestamp: 1650702020986,
      // 热更模块路径
      path: "/src/main.ts",
      // 接受的子模块路径
      acceptedPath: "/src/render.ts"
    }
  ]
}
// 或者 full-reload 信号
{
  type: "full-reload"
}
```

进入热更新主要逻辑

```javascript
fetchUpdate({path, acceptedPath, timestamp})
```

获取当前热更新边界模块信息：

```javascript
const mode = hotModuleMap.get(path)
```

其中包含了边界模块接收（import.meta.hot.accept）过的模块和对应绑定的更新回调函数。

::: info hotModuleMap 由来

Vite 给每个热更新边界模块注入工具代码：

- 注入 import.meta.hot 对象的实现
- 将当前模块 accept 过的模块和更新回调函数记录到 hotModuleMap 表中

```typescript
const hotModulesMap = new Map<string, HotModule>()
interface HotModule {
  id: string // 当前边界模块路径
  callbacks: { // 更新回调
    deps: string[], 
    callback: () => {}
  }[]
}
```

:::

1. 整理需要更新的模块集合

   ```javascript
   const modulesToUpdate = new Set<string>()
   ```

   - 接收自身更新

     ```javascript
     const isSelfUpdate = path === acceptPath
     if(isSelfUpdate){
     	modulesToUpdate.add(path)
     }
     ```

   - 接收子模块更新

     ```javascript
     for(const {deps} of mod.callbacks) {
       deps.forEach((dep) => {
         if(acceptedPath === dep){
           modulesToUpdate.add(dep)
         }
       })
     }
     ```

     

2. 整理需要执行的更新回调函数

   ```javascript
   const qualifiedCallbacks = mod.callbacks.filter(({ deps }) => {
     return deps.some((dep) => modulesToUpdate.has(dep))
   })
   ```

   

3. 对将要更新的模块进行失活操作，并动态 import 拉取最新的模块信息

   什么是失活？？？？

   怎么样动态 import 拉取？？？

4. 调度执行所有更新回调

case 'connected'

case 'full-reload'



## 总结

创建依赖图：

当发服务器收到请求时，在中间件中加载模块，创建模块节点。

利用 vite 插件的 transform 钩子对模块代码的 import 语句进行分析，绑定模块依赖关系。



监听文件变化，当文件发生改变，向客户端发送变更信息。



客户端根据变更信息分析出所有需要更新的模块，进行失活操作并动态 import 拉取最新模块信息，最后调度执行更新回调。

