1. Parse HTMl
	- Evaluate Script
		1. Compile Script
			- Compile Code
		2. install Timer
		3. setTimeout
		4. requestAnimationFrame
		5. requestIdleCallback
			-  Run Microtasks
				- Compile Code
		6. Cache Script Code
1. Event: readystatechange
2. Event: DOMContentLoaded
3. Recalculate Style
------------DCL----------------
5. Event: readystatechange
6. Event: load
--------------------L---------------
7. Event: pageshow
8. Layout
9. Animation Frame Fired
	- Function Call
		1. Compile Code
		2. anonymous
10. Pre-Paint
11. Paint
12. Layerize
13. Commit
14. Timer Fired
	- Funciton call
		- Compile Code
1. Fire Idle Callback
	- Fcuntion Call
		- Compile Code



渲染进程：
- GUI 渲染线程
  负责渲染界面
- JS 引擎线程
  负责解析和运行 JS 代码
- 事件触发线程
  负责监听网页事件、定时时间、IO 事件，并把时间回调放入（宏）任务队列
- 定时器触发线程
  负责计时，计时结束会被事件触发线程监听到
- 异步 http 线程
  负责发送 http 请求，请求结束会被事件触发线程监听到

W3C 规范的异步任务（宏任务）：setTImeout、setInterval、Ajax/Fetch
ES6 规范的异步任务（微任务）：Promise、async/await

微任务队列检查点：
- 宏任务结束之后
- 回调触发后没有其他 JS 代码在执行中（调用栈为空）


## 事件循环

[Vue源码详解之nextTick：MutationObserver只是浮云，microtask才是核心！](https://segmentfault.com/a/1190000008589736)


多任务队列：
优先级不一样，保持任务顺序的前提下，保证高优先级的响应，例如鼠标和键盘事件。

1. 从多个 task queue 中的一个 queue 里，调处一个最老的 task
2. 执行 task
3. 检查微任务队列，执行并清空微任务队列
4. 判断是否需要渲染：
   渲染间隔：根据屏幕刷新率、页面性能、页面是否在后台运行共同决定
   不需要渲染：
   - 浏览器判断更新渲染不会带来视觉上的变化
   - 帧动画回调为空
对于需要渲染的文档（document）
5. 如果窗口发生变化，执行 resize 方法
6. 如果页面发生滚动，执行 scroll 方法
7. 执行帧动画回调，requestAnimationFrame
8. 执行 IntersectionObserver 回调
9. 重新渲染界面
10. 判断 task 和 microtask 队列是否为空，如果是，则进行 Idle 空闲周期算法，判断是否要执行 requestIdleCallback 的回调函数



延时队列？定时线程？

what why how
初始化基础环境

生成 ast 抽象语法树和作用域

解释器 Ignition 
根据 ast 生成字节码

为什么是字节码而不是直接转换成机器吗？
机器码内存占用高（运行在小内存手机上有问题），字节码内存介于 ast 和机器码

解释执行

预编译：


JIT：逐条解释执行，如果遇到热点代码（HotSpot 比如一段代码被重复执行多次），编译器就把该段热点字节码编译为高效的机器码，再次执行时，只需要执行编译后的机器码。



