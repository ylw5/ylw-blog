
> 文中代码以展示只要思想为主，尽量简化，不必深究，且只考虑对 ES Module 的处理

打包最基础也是最核心的功能就是把多个文件合并成一个文件（代码合并），以 [rollup](https://rollupjs.org/) 为例：

```javascript
// util.js
export const a = 1

// index.js
import { a } from './util.js'
console.log(a)
```

执行命令 `rollup index.js --file bundle.js`，输出结果：

```javascript
// bundle.js
const a = 1
console.log(a)
```

显而易见，因为多个文件合并成一个了，所以导入导出语句就不需要了，直接把变量声明语句放到引用变量的语句前就可以了。这就是代码合并的主要原理，要做到这个，首先就必须要确定各模块之间的依赖关系。


## 模块依赖图

一个模块会引用其他模块，也会导出成员被其他模块引用，所以可以将这样的依赖关系转换为[图](https://zh.wikipedia.org/wiki/%E5%9B%BE_(%E6%95%B0%E5%AD%A6))结构，称之为模块依赖图。

什么是 module、chunk、bundle

1. 从入口开始获取模块
   
   ```javascript
   class Graph {
	   async build() {
		   // 从入口开始解析
		   const entryModule = awiat this.moduleLoader.fetchModule(this.entryPath, null)
	   }
   }
   ```
   
   ```javascript
   class ModuleLoader {
	   async fetchModule(id: string, importer: string) {
		   const path = this.resolveId(id, importer) // 解析文件路径
		   const code = await readFile(path)
		   const module = new Module({path, code}) // 创建模块
	   }
   }
   ```
   
2. 对模块进行 AST 解析，获取模块 AST，并拆分为多个 Statement（语句）
   
   关于 AST和具体解析流程，详情可看 [[AST 解析]]
   
   ```javascript
   class Module {
	   constructor({path, code}) {
		   const ast = parse(code) // AST 解析
		   const nodes = ast.body
		   // 以语句维度拆分模块
		   this.statements = nodes.map((node) => {
			   const str = this.magicString.snip(node.start, node.end)
			   return new Statement(node, str, this) // 创建语句类
		   })
		   // 对 AST 语法信息进行分析
		   this.analyzeAst()
	   }
   }
   ```
   
   在实例化 Statement（语句）节点时，通过 ast 节点类型即可判断是否是导入或导出语句，并存储在成员变量中。

   ```javascript
   class Statement {
	   isImportDeclaration: boolean
	   isExportDeclaration: boolean
	   constructor(node) {
		   this.node = node
		   this.isImportDeclaration = isImportDeclaration(node) // 判断是否是导入语句
		   this.isExportDeclaration = isExportDeclaration(node) // 判断是否是导出语句
	   }
   }
   function isImportDeclaration(node) {
	   return node.Type === NodeType.ImportDeclaration
   }
   function isExportDeclaration(node) {
	   return /^Export/.test(node.type)
   }
   ```

3. 对模块 AST 进行分析，记录导入和导出
   
   逐语句进行遍历，如果是导入/导出语句，则记录导入/导出源，例如语句节点 `import { foo } from './mod.js'`  或 `export { foo } from './mod.js'`，说明该模块引用了 mod 模块，通过访问该 ast 节点的 `source` 属性即可读取到依赖模块的 id —— `./mod.js`，将其添加到成员变量 dependencies 中
   
   ```javascript
   class Module {
	   dependencies = new Set()
	   analyzeAst() {
		   // 以语句为最小单位分析
		   this.statement.forEach((statement) => {
			   if (statement.isImportDeclaration) {
				   this.addImports(statement)
			   }
			   else if (statement.isExportDeclaration) {
				   this.addExport(statement)
			   }
		   })
	   }
	   addImport(statement) {
		   const node = statement.node
		   const source = node.source
		   if (source) this._addDependencySource(source)
	   }
	   _addDependencySource(source) {
		   dependencies.add(source)
	   }
   }
   ```
   
4. 模块解析完毕，继续其解析依赖模块，不断递归
   
   ```javascript
   class ModuleLoader {
	   async fetchModule(id: string, importer: string) {
		   // 解析当前模块
		   // ...
		   const module = new Module({...})
		   this.bundle.addModule(module)
		   this.fetchAllDependencies(module)
	   }
	   async fetchAllDependencies(module) {
		   await Promise.all(
			   module.dependencies.map(async (dep) => {
				   return this.fetchModule(dep, module.path)
			   })
		   )
	   }
   }
   ```

5. 相互绑定依赖关系，建立模块依赖图
   
   ```javascript
   class Graph {
	   async build() {
		   // 1. 获取并解析模块信息
		   // ...
		   // 2. 绑定模块依赖
		   this.modules.forEach(module => module.bind())
	   }
   }
   ```
   
   根据上一步中存储在 dependencies 中的模块 source，根据当前所在模块 path 解析为正确 id，找到对应的模块（ModuleLoader 类在解析一个模块后都会根据 id 缓存），并且将自身添加到依赖模块的引用列表中。
 
   ```javascript
   class Module {
	   // 依赖的模块
	   dependencyModules = []
	   // 被依赖的模块
	   referencedModules = []
	   bind() {
		   // 根据收集的导入/导出源的id标识符进行互相绑定
		   this.bindDependencies()
	   }
	   bindDependencies() {
		   this.dependencyModules = this.dependencies.map(
			   this._getModuleBySource.bind(this)
		   )
		   this.dependencyModule.forEach(module => module.referencedModules.push(this))
	   }
   }
   ```
   
## 模块拓扑排序

模块依赖图建立后，我们在此基础上对模块进行拓扑排序，使得在合并时，按照顺序生成代码，让每个模块的代码被放在恰当的位置，程序能够正常运行。

比如说变量 a 在模块 A 中定义，在模块 B 中被引入和使用，那么模块 A 生成的代码就应该在模块 B 的前面了，不然就找不到这个变量了。

![[module-sort.png]]

上图中 A 依赖 B、C，B 和 C 依赖 D，D 依赖 E，最后拓扑排序的结果就是 E、D、B、C、A，保证引用方在前，依赖方在后，对依赖图进行**后序遍历**即可。

```javascript
class Graph {
	async build() {
		// 1. 获取并解析模块信息
		// 2. 构造依赖关系图
		// 3. 模块拓扑排序
		this.orderedModules = this.sortModules(entryModule)
	}
	sortModules(entryModule) {
		// 拓扑排序模块数组
		const orderedModules = []
		// 记录已经分析过的模块
		const analysedModules = new Set()
		// 排序核心逻辑，基于依赖图进行后序遍历
		function analyseModule(module) {
			if (analysedModules.has(module)) return
			for (const dep of module.dependencyModule) {
				analyseModule(dep)
			}
			orderedModules.push(module)
			analysedModules.add(module)
		}
		// 从入口模块开始
		analyseModule(entryModule)
		return orderedModules
	}
}
```

当然，遍历依赖图时会出现循环依赖的情况。如下图中 B、D、E 形成了循环：

![[circular-module.png]]


> 关于模块的循环加载，可以看[JavaScript 模块的循环加载](https://www.ruanyifeng.com/blog/2015/11/circular-dependency.html)这篇文章了解。

循环加载在 ES Module 中一般不会出现问题，但是在打包过程中，为了避免模块代码被重复生成、拓扑排序进入死循环，需要在排序时做一些一些特殊处理。

以上图为例，当从 A 沿着依赖链遍历到 E 时，因为是后序遍历，此时 B 还没有分析结束，B 作为 E 的依赖，又再次递归进入 B 节点，造成了死循环，所以应该及时避免从 E 进入 B。

```javascript
class Graph {
	sortModules(entryModule) {
		// ...
		const parent = new Map()
		// 记录循环依赖
		const cyclePaths = []
		// 回溯，定位循环依赖位置
		function getCyclePath(module, parentModule) {
			
		}
		function analyseModule(module) {
			if (analysedModules.has(module)) return
			for (const dep of module.dependencyModules) {
				// 已经开始分析
				if (parent.has(dep)) {
					// 还没有被分析完
					if (!analysedModules.has(dep)) {
						cyclePaths.push(getCyclePath(dep, module))
					}
					continue
				}
				parent.set(depModule, module)
				analysedModule(dep)
			}
			analysedModules.add(module)
			// ...
		}
		// 打印循环依赖
		cyclePaths.forEach(paths => console.log(paths))
		// ...
	}
}
```

创建了一个 parent 变量，用于记录依赖模块和引用模块的映射，当进入一个模块依赖节点，就设置映射关系，说明该模块的分析已经开始了。当所有它的所有依赖分析完毕，将它添加到 analysedModules 中，说明自身分析结束。

我们根据两点判断是否出现循环依赖：

- 该依赖已经开始分析
  parent 映射中已经记录该依赖
- 该依赖还没有分析结束
  analysedModules 中不含有该依赖


## 代码生成

以上解析模块、构建模块依赖图、模块拓扑排序，都是为代码生成铺垫，万事俱备，只欠东风。

在开头提到，代码生成的主要任务就是按照拓扑排序顺序将模块转换为字符串，在此过程中，重写引用位置的变量名，

在 Module 对象中定义 render 方法，用来讲模块渲染成字符串：



## TreeShaking


