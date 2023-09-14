# 工厂方法模式

**工厂方法模式（Factory Method）**：通过对产品类的抽象使其创建业务主要负责用于创建多类产品的实例。

在简单工厂中，每多一个类，就要在工厂函数中多加一个case（共修改两处），使用工厂方法模式只需添加这个类即可。·

可以把工厂方法看作是一个实例化对象的工厂类。

优点：

- 适用于创建多类对象，避免了使用者与对象类之间的耦合，用户不必关系创建该对象的具体类，只需调用工厂即可。

```javascript
class Factory{
  constructor(type, content){
    this[type](content)
  }
  Java(content){
    this.content = content
    // ...
  }
  JavaScript(content){
    this.content = content
    // ...
  }
}
const factory = new Factory('Java', 'hello')
```

