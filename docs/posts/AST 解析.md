---
title: AST 解析
date: 2023-8-30
---

## 词法分析

分词（Tokenize）：将整个代码字符串分割成最小语法单元数组。

以下面这行代码为例：

```javascript
let foo = function() {}
```

可以通过定义几个词法规则来囊括代码中所有的词：

- 关键字 Let（'let'）
- 等号 Assign（'='）
- 函数 Function（'function'）
- 左圆括 LeftParen（'('）
- 右圆括号 RightParen（')'）
- 左大括号 LeftCurly（'{'）
- 右大括号 RightCurly（'}'）
- 标识符 Idendifier（其他字符串）

然后逐个字符扫描，匹配词法，进行分组，并记录位置信息（开始和结束索引），最终生成 token 数组，结果如下所示：

```javascript
const result = [
  { type: 'Let', start: 0, end: 3, value: 'let' }, 
  { type: 'Identifier', start: 4, end: 7, value: 'foo' }, 
  { type: 'Assign', start: 8, end: 9, value: '=' }, 
  { type: 'Function', start: 10, end: 18, value: 'function' }, 
  { type: 'LeftParen', start: 18, end: 19, value: '(' }, 
  { type: 'RightParen', start: 19, end: 20, value: ')' }, 
  { type: 'LeftCurly', start: 21, end: 22, value: '{' }, 
  { type: 'RightCurly', start: 22, end: 23, value: '}' } 
]
```

## 语法分析

将上面的 token 数组转换成 AST 数据（**抽象语法树**）：

> 抽象语法树（Abstract Syntax Tree，简称AST）是源代码的抽象语法结构在计算机内存中的表现形式。它是编译器或解释器在处理源代码时所使用的一种中间表示形式。AST在编译和代码生成过程中起着关键作用。

总的来说，ast 就是描述源代码的抽象语法结构，作为中间形式，使得后续的分析或操作提供便利，可使用 [astexplorer](https://astexplorer.net/)更好理解。

同样以上述那行代码为例，其生成 AST 结构如下（包含关键信息）：


![[ast-example.png]]

完整的 ast 代码（以 acorn-8.7.0 为 parser）：

```JSON
{ 
  "type": "Program", 
  "start": 0, 
  "end": 23, 
  "body": [ 
    { 
      "type": "VariableDeclaration", 
      "start": 0, 
      "end": 23, 
      "declarations": [ 
        { 
          "type": "VariableDeclarator", 
          "start": 4, 
          "end": 23, 
          "id": { 
            "type": "Identifier", 
            "start": 4, 
            "end": 7, 
            "name": "foo" 
         	}, 
          "init": { 
            "type": "FunctionExpression", 
            "start": 10, 
            "end": 23, 
            "id": null, 
            "expression": false, 
            "generator": false, 
            "async": false, 
            "params": [], 
            "body": { 
              "type": "BlockStatement", 
              "start": 21, 
              "end": 23, 
              "body": [] 
            } 
          } 
        } 
      ], 
      "kind": "let" 
    } 
  ], 
  "sourceType": "module" 
}
```

ast 生成流程大致如下：

语法树从根节点 Program 开始构造，开始扫描 token 数组，第一个 token 是 Let 关键词，说明该语句是一个变量声明语句，开始构造 VariableDeclaration（变量声明）节点。

变量声明语句由多个“变量名 = 变量值”组成，一个“变量名 = 变量值”的组合可看作一个 VariableDeclarator 节点，变量名对应 id 属性，变量值对应 init 属性，接下来准备构造 VariableDeclarator 节点。

这时候我们期望下一个节点是个变量名，继续扫描 token，正好第二个 token 是 Identifier（标识符 ‘foo’ ），于是可构造出 Identifier 节点，该节点作为 VariableDeclarator 的 id 属性。

有了变量名，我们期望一个等号，继续扫描，第三个 token 正好是 Assign（‘=’）。

这时候我们期望一个变量值，向后扫描，第四个 token 是 Function（‘function’），说明接下来是个函数表达式，开始构造 FunctionExpression（函数表达）节点。

后续不再赘述，简单来说，就是不断**遍历 token，根据语法规则，递归构造语法树节点**。