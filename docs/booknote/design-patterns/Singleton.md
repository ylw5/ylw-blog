# 单例模式

**单例模式（Singleton）**：又被称为单体模式，是只允许实例化一次的对象类。游时我们也用一个对象来规划一个命名空间，管理对象上的属性和方法。

优点：

- 划分命名空间，减少局部变量
- 增强模块性，把属性和方法放在一个全局变量下，便于维护
- 只会实例化一次

## 静态变量

```javascript
const Conf = (function () {
  // 存放私有变量的单例
  const conf = {
    MAX_NUM: 100,
    MIN_NUM: 1,
  }
  // 返回取值器对象
  return {
    get: function (name) {
      return conf[name]
    }
  }
})()
const max = Conf.get('MAX_NUM')
```

## 惰性单例

单例对象延迟创建

```javascript
const LazySingle = (function () {
  // 单例实例的引用
  let _instance = null
  // 单例
  function Single() {
    return {
      publicMethod: function () { },
      PublicProperty: 100,
    }
  }
  return function () {
    if (!_instance) {
      _instance = Single()
    }
    return _instance
  }
})()
console.log(LazySingle().PublicProperty)
```

