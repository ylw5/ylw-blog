动态语言：运行过程中需要检查数据类型的语言

静态语言：使用之前就需要确认其变量数据类型

弱类型语言：支持隐式类型转换

强类型语言：不支持隐式类型转化

Boolean Null Undefined Number BigInt String Symbol 7种原始类型，对象为引用类型

JavaScript 的执行过程种，主要由三种类型内存空间：

- 代码空间

- 栈空间

  调用栈，存储执行上下文

- 堆空间

  如果是引用类型，JavaScript 引擎将它分配到堆空间，分配后该对象有一个在堆种的地址，然后再将该数据的地址作为变量值写到栈中

  ![img](https://static001.geekbang.org/resource/image/22/bc/22100df5c75fb51037d7a929777c57bc.png?wh=1142*551)

原始类型数据的值直接保存在“栈”中，引用类型数据的值保存在“堆”中（不确定？？？

https://docs.google.com/document/d/11T2CRex9hXxoJwbYqVQ32yIPMh0uouUZLdyrtmMoL44/edit#

https://developer.chrome.com/docs/devtools/memory-problems/memory-101/#javascript_object_representation

）

通常情况下栈空间不会设置太大，主要存放一些原始类型的小数据；堆空间大，能存放很多大的数据，缺点是分配和回收内存时间长

> JavaScript 引擎需要用栈来维护程序执行期间上下文的状态，如果栈空间大了话，所有的数据都存放在栈空间里面，那么会影响到上下文切换的效率，进而又影响到整个程序的执行效率

原始类型的赋值会完整复制变量值，而引用类型的赋值是复制引用地址



编译型语言：在执行之前需要经过编译器的编译过程，并且编译之后直接保留机器能读懂的二进制文件。这样每次运行程序时，都可以直接运行该二进制文件，不需要重新编译

解释型语言：每次运行时都需要通过解释器对程序进行动态解释和执行

![编译器和解释器“翻译”代码](https://static001.geekbang.org/resource/image/4e/81/4e196603ecb78188e99e963e251b9781.png?wh=1142*510)

![V8执行一段代码流程图](https://static001.geekbang.org/resource/image/1a/ae/1af282bdc4036096c03074da53eb84ae.png?wh=1142*522)

1. 生成抽象语法树 AST 和执行上下文

   AST 是一种数据结构，可以看作代码的结构化表示，编译器或者解释器后续工作都依赖于 AST

   1. tokenize 词法分析

      将一行行源码拆解成一个个 token

   2. 解析 parse 语法分析

      将上一步生成的 tokne 根据语法规则转为 AST

2. 生成字节码

   字节码介于 AST 和机器码之间的一种代码。与特定类型的机器码无关，需要通过解释器将其转为机器码后才能执行。

   ![img](https://static001.geekbang.org/resource/image/87/ff/87d1ab147d1dc4b78488e2443d58a3ff.png?wh=1142*314)

3. 执行代码

   解释器逐条解释执行字节码。

   如果发现由热点代码（HotSpot），比如一段代码被重复执行多次，那么后台编译器就会把该段热点代码编译为机器码，当之后再次执行这段代码时，只需要执行编译后的机器码，大大提升代码的执行效率。

   这种字节码配合解释器和编译器的技术成为即使编译 JIT。

   ![img](https://static001.geekbang.org/resource/image/66/8a/662413313149f66fe0880113cb6ab98a.png?wh=766*912)