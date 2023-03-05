## 变量提升

创建一个变量：声明、初始化和赋值

所谓变量提升，是指 JavaScript 代码执行过程中，JavaScript 引擎把变量的声明部分和函数的声明部分提升到代码开头的行为（变量被提升后，会给变量初始化默认值——`undefined`）。

var：创建和初始化被提升，赋值不会被提升

let：创建被提升，初始化和赋值不会被提升（暂时性死区，不能访问未被初始化的变量，v）

function：创建、初始化、赋值均会被提升

函数提升比变量提升优先级更高，且不会被变量声明覆盖，但是会别变量赋值之后覆盖

![模拟变量提升示意图](https://static001.geekbang.org/resource/image/ce/d5/cefe564dbff729e735a834fd9e3bd0d5.png?wh=1142*528)

![img](https://static001.geekbang.org/resource/image/64/1e/649c6e3b5509ffd40e13ce9c91b3d91e.png?wh=1142*203)

![img](https://static001.geekbang.org/resource/image/06/13/0655d18ec347a95dfbf843969a921a13.png?wh=1142*634)

一段代码（全局、调用函数、eval）经过编译后会生成两部分内容：

- 执行上下文

  JavaScript 代码执行时的运行环境。

  - 变量环境

    保存了变量提升的内容（变量名与属性值或内存指针的映射）

    ```
    VariableEnvironment: 
    	myname -> undefined, 
    	showName ->function : {console.log(myname)
    ```

  - 词法环境

    保存块级作用域中声明（let 或 const）的内容，

    栈结构，进入一个块作用域后，就会把该作用域块内部的变量压到栈顶；当作用域执行完成之后，该作用域的内容就会从栈顶弹出

- 可执行代码

  在执行阶段按照顺序一行一行执行

## 调用栈

在执行 JavaScript 时，可能会产生多个执行上下文，那么 JavaScript 引擎通过**调用栈（执行上下文栈）**来管理这些执行上下文。每产生一个执行上下文就压入栈中，执行完后从栈顶弹出。

所以调用栈时 JavaScript 引擎追踪函数执行的一个机制。

当入栈的执行上下文超过一定数目，JavaScript 引擎就会报错，这种错误叫做**栈溢出**。

## 作用域

控制着变量和函数的可见性和生命周期

ES6 之前：

- 全局作用域

  里面的对象在代码的任何地方都能访问，其生命周期伴随着页面的生命周期。

- 函数作用域

  函数内部定义的变量或函数，只能在该函数内部访问。函数执行结束后内部变量会被销毁。

- 其他。。。。

ES6 有了 let 和 const 后：

- 块级作用域

  大括号包裹的一段代码。该代码块中的代码执行完成后，在其中定义的变量或函数会被销毁。

## 作用域链

每个执行上下文中都有一个外部引用 outer（在变量环境中），他指向**定义的时候**所在的执行上下文。outer将不同的执行上下文串联起来，形成作用域链。

在当前变量环境中查找不到变量时，JavaScript 引擎会继续在 outer 所指向的执行上下文中查找。

```javascript
function bar() {
    console.log(myName)
}
function foo() {
    var myName = "极客邦"
    bar()
}
var myName = "极客时间"
foo()
```

![img](https://static001.geekbang.org/resource/image/20/a7/20a832656434264db47c93e657e346a7.png?wh=1142*797)

作用域链是由词法作用域决定的。

词法作用域是指由代码中函数声明的位置来决定的作用域链，在代码编译阶段就决定好的，是静态的，通过它可以预测代码在执行过程中如何查找标识符。

![img](https://static001.geekbang.org/resource/image/21/39/216433d2d0c64149a731d84ba1a07739.png?wh=1142*864)

## 闭包

由于词法作用域规则，内部函数总是可以访问外部函数中声明的变量，所以即使外部函数已经执行结束，但是内部函数引用外部函数的变量依然保存在内存中，这些变量的集合可以看成内部函数的专属背包 Closure。当之后内部函数执行时，会根据 Local --> Closure --> 的作用域链查找变量

1. 外部 bar 内部 foo，JavaScript 引擎执行到 bar 时，先编译，并创建一个空执行上下文。
2. 在编译过程中发现内部函数 foo，引擎对内部函数做一个快速的词法扫描，发现它引用了外部 bar 函数中的变量；由于内部函数引用了外部函数的变量，所以 JavaScript 引擎判断这是一个闭包，于是在堆空间创建了一个 Closure(bar) 对象，用来保存被引用的变量，并且内部函数 foo 建立了对 Closure(bar) 的引用。

产生闭包核心：

- 预扫描内部函数
- 把内部函数引用的外部变量保存在堆中

![img](https://static001.geekbang.org/resource/image/f9/db/f9dd29ff5371c247e10546393c904edb.png?wh=1142*564)

## this

每个执行上下文都由一个 this

默认情况下调用一个函数，其 this 指向 window 对象（非严格模式）。

使用对象来调用其内部的一个方法，该方法的 this 指向对象本身。

call、apply、bind

嵌套函数中的 this 不会继承外层函数的 this 值，不同与作用域链

ES6 箭头函数中 this 指向外部 this（不会创建其自身的执行上下文）