## JavaScript 如何构建 DOM 树

DOM 三个层面的作用：

- 生成页面的基础数据结构
- 提供给 JavaScript 脚本操作的接口
- 一道安全防线，在解析阶段过滤一些不安全内容

HTML 字节流 --> DOM 结构

HTML 解析器并不是等整个文档加载完成之后在解析，而是网络进程加载了多少数据，HTML 解析器变解析多少数据（管道接水）

1. 分词器 tokenize

   ![img](https://static001.geekbang.org/resource/image/b1/ac/b16d2fbb77e12e376ac0d7edec20ceac.png?wh=1142*151)

2. 将 Token 解析为 DOM 节点并添加到 DOM 树上

   解析器维护 Token 栈结构，比如 startTag 入栈，endTag 出栈，不断解析

解析到 script 标签时解析器停止工作。内嵌脚本，JavaScript 引擎介入，执行脚本。如果是引入的 JavaScript 文件，需要先下载。

浏览器优化策略：预解析。渲染引擎收到字节流之后会开启一个预解析线程，用来分析 HTML 文件中包含的 JavaScript、CSS 等文件，提前下载

CDN 加速

async 或 defer 标记