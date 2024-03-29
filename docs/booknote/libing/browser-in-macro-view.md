## Chrome 架构

并行：同一时刻处理多个任务

进程：一个程序的实例（操作系统为该程序创建的一块内存）

多线程可以并行处理任务，进程启动和管理线程

四个关系：

- 进程中的任意线程出错都会导致整个进程崩溃
- 线程之间共享进程中的数据
- 当一个线程关闭之后，操作系统会回收进程所占用的内存
- 进程之间相互隔离（进程间通信 IPC）

Chrome 多进程架构：

- 浏览器进程：主要负责浏览器界面显示、用户交互、紫荆城管理、存储等功能。
- 渲染进程：核心是将 HTML、CSS 和 JavaScript 转换成用户可以与之交互的网页。默认情况下，会为每个 Tab 标签创建一个渲染进程。
- GPU 进程：浏览器 UI 和部分网页 UI 的绘制
- 网络进程：页面的网络资源加载
- 插件进程

带来的问题：

- 更高的资源占用：每个进程都包含公共基础结构的副本（如 JavaScript 运行环境）
- 更复杂的体系架构：各模块之间耦合性高、扩展性差等问题

## TCP 协议

>  面向连接的、可靠的、基于字节流的传输层通信协议。

互联网中的数据通过数据包来传输，IP 负责把数据包送达目的主机，UDP / TCP 负责把数据包送达具体应用（端口）。

而相对于 UDP，TCP 的两个特点：

- 对于数据包丢失的情况，TCP 提供重传机制
- TCP 引入数据包排序机制，用于保证把乱序的数据包组合成一个完整的文件

和 UDP 头一样，TCP 头出了包含了目标端口和本机端口号外，还提供了用于排序的序列号，以便接收端通过序号来重排数据包

![简化的TCP网络四层传输模型](https://static001.geekbang.org/resource/image/94/32/943ac29f7d5b45a8861b0cde5da99032.png?wh=1142*798)

![一个TCP连接的生命周期](https://static001.geekbang.org/resource/image/44/44/440ee50de56edc27c6b3c992b3a25844.png?wh=1142*408)

## HTTP 请求流程

> HTTP 是一种允许浏览器向服务器获取资源的应用层协议，是 Web 的基础，用来封装请求的信息（建立在 TCP 连接基础之上）

![HTTP请求示意图](https://static001.geekbang.org/resource/image/1b/6c/1b49976aca2c700883d48d927f48986c.png?wh=1142*423)

1. 构建请求

   浏览器构建请求行信息，准备发起网络请求

   ```
   GET /index.html HTTP1.1
   ```

2. 查找缓存

   真正发起网络请求之前，浏览器会在浏览器缓存中查询是否有请求的文件。如果发现请求的资源已经在浏览器缓存中存在副本，它会拦截请求，返回该资源的副本。

   （强缓存、协商缓存）

   好处：

   - 缓解服务端压力
   - 快速加载资源

3. 准备 IP 地址和端口

   HTTP 的内容是通过 TCP 的传输数据阶段来实现，所以建立 TCP 连接前需要获取 IP 地址和端口号。

   现在只有一个 URL 地址，所以需要使用 DNS（域名系统） 服务，它负责把域名和 IP 地址做一一映射关系（DNS 也有缓存机制）。

   通常情况下，如果 URL 没有特别指明端口号，HTTP 协议默认 80 端口。

4. 等待 TCP 队列

   Chrome 机制，同域名同时最多建立 6 个 TCP 连接（HTTP/1.1）。

   如果当前请求数少于 6，进入下一步建立 TCP 连接。

5. 建立 TCP 连接

   三次握手

6. 发送 HTTP 请求

   ![HTTP请求数据格式](https://static001.geekbang.org/resource/image/b8/d7/b8993c73f7b60feb9b8bd147545c47d7.png?wh=1142*656)

   浏览器会向服务器发送：

   - 请求行

     包含请求方法、请求 URI 和 HTTP 版本协议

   - 请求头

     浏览器的一些基础信息，包含了浏览器所使用的操作系统、浏览器内核等信息，以及当前请求的域名信息、浏览器端的 Cookie 信息，等等

   - 请求体

     如果请求方法是 POST 或其他，浏览器还要准备数据给服务器

7. 服务端返回请求

   ![服务器响应的数据格式](https://static001.geekbang.org/resource/image/3e/76/3e30476a4bbda49fd7cd4fd0ea09f076.png?wh=1142*651)

   服务端向浏览器发送：

   - 响应行

     包含协议版本和状态码（告诉浏览器请求的处理结果）。

   - 响应头

     包含服务器自身的一些信息，比如服务器生成返回数据的时间、数据类型，以及服务器要在客户端保存的 Cookie 信息。

   - 响应体

8. 断开连接

   通常情况下，一旦服务器向客户端返回了请求数据，就要关闭 TCP 连接了——四次挥手。

   除非浏览器或者服务器在头信息中加入了：

   ```
   Connection:Keep-Alive
   ```

9. 重定向（非必然）

   如果相应行返回的状态码是 301，就告诉浏览器需要重定向到另一个网址（重定向的网址包含在响应头的 Location 字段中）

## 导航流程：从输入 URL 到页面展示

1. 用户输入 URL 并回车

2. 浏览器进程检查 URL，组装协议构成完整规范的 URL

3. 浏览器进程通过进程间通信把 URL 请求发送给网络进程

4. 发起 HTTP 请求

   上节内容

5. 网络进程解析响应

   检查状态码：

   - 301 / 302，需要重定向，从 Location 字段中读取地址重复以上步骤
   - 200，检查响应类型 Content-Type。
     - 如果是字节流，则将请求提交给下载管理器，导航结束
     - 如果是 html，通知浏览器进程准备开启渲染进程进行渲染。

6. 准备渲染进程

   - 检查当前 URL 是否和之前打开的渲染进程根域名相同，如果相同则复用渲染进程；否则，开启新的渲染进程。

7. 传输数据、更新状态

   1. 渲染进程准备好后，浏览器向渲染进程发起“提交文档”的消息，渲染进程接收到消息后和网络进程建立数据传输“管道”，网络进程将数据传输给渲染进程。
   2. 渲染进程接收完数据后，向浏览器进程发送“确认提交”消息。
   3. 浏览器进程接收到消息后更新浏览器界面状态：安全、地址栏 URL、历史状态、更新页面（空白页）。

8. 开始渲染

## 渲染流程

![img](https://static001.geekbang.org/resource/image/97/37/975fcbf7f83cc20d216f3d68a85d0f37.png?wh=1142*745)

1. 构建 DOM 树

2. 样式计算 Style

   计算出每个 DOM 树中每个元素的具体样式

   1. 把 CSS 转换为样式表数据结构

      渲染引擎接收到 CSS 文本时，会将 CSS 文本转换为浏览器可以理解的结构——**StyleSheets**，该结构同时具备了查询和修改功能。

   2. 标准化样式表中的属性值

      CSS 文本中的很多属性值，如 2em、blue、bold，需要将所有值转换为渲染引擎容易理解的、标准化的计算值。

   3. 计算出 DOM 树中每个节点的具体样式

      基于 CSS 的继承和层叠两个规则。最终输出的内容时每个 DOM 节点的样式，保存在 ComputedStyle 的结构内。

3. 布局 Layout

   计算出 DOM 树中可见元素的几何位置。

   1. 构建布局树

      DOM 树可能包含很多不可见的元素，如 link 标签、display:none 属性的元素，在显示之前要额外构建以可**只包含可见元素**的**布局树**。

   2. 布局计算

      计算布局树中节点的坐标位置，并将结果重新写回布局树。

4. 分层 Layer

   渲染引擎为特定的节点生成专用的图层，并生成以可对应的**图层树**。

   满足以下条件的元素可以被提升为单独的一个图层：

   - 拥有层叠上下文属性
   - 需要被剪裁

5. 图层绘制 Paint

   把一个图层的绘制拆分成很多小的绘制指令，然后把这些指令按照顺序组成一个**待绘制列表**

6. 栅格化 Raster

   实际上**绘制操作是由渲染引擎中的合成线程来完成的**。

   ![img](https://static001.geekbang.org/resource/image/46/41/46d33b6e5fca889ecbfab4516c80a441.png?wh=1142*464)

   当图层的绘制列表准备好后，主线程会把绘制列表提交给合成线程。

   有些情况页面很大，但用户看到的部分（视口）占很小部分，这时要绘制出所有图层内容的话开销太大。

   基于此，合成线程会将图层划分为**图块（tiles）**。

   ![img](https://static001.geekbang.org/resource/image/bc/52/bcc7f6983d5ece8e2dd716f431d0e052.png?wh=1142*995)

   然后合成线程会按照视口附近的图块来优先成成位图。**所谓栅格化，是指将图块转换为位图**。

   合成线程提交图块给栅格化线程池执行，会使用 GPU 来加速生成位图（快速栅格化或 GPU 栅格化）。

   渲染进程将生成图块的指令发送给 GPU 进程，然后再 GPU 中执行指令生成位图后返回渲染进程的合成线程。（先放在 GPU 内存？？这里不确定）

7. 合成与显示 Diaplay

   所有图块都被栅格化后，合成线程执行合成图层操作。合成的图层被提交给浏览器进程，浏览器进程将其所有图层合成可以显示的页面图片，最终显示在屏幕上。

   

   

   

​			

