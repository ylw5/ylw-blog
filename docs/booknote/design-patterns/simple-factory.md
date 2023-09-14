# 简单工厂模式

**简单工厂模式（Simple Factory）**，又叫做静态工厂模式，由一个工厂对象决定创建某一种产品对象类的实例。

```javascript
class Basketball {
}
class Football {
}
class Tennis {
}
const SportsFactory = function (name) {
  switch (name) {
    case 'NBA':
      return new Basketball()
    case 'worldCup':
      return new Football()
    case 'FrenchOpen':
      return new Tennis()
  }
}
// 为世界杯创建一个足球
const football = SportsFactory('worldCup')
```

简单工厂模式与类的异同？

