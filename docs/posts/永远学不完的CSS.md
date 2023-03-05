---
title: 永远学不完CSS😒
time: 2022-09-10
---

## 处理元素中的空白 

[white-space](https://developer.mozilla.org/zh-CN/docs/Web/CSS/white-space )

|                | 换行符 | 空格和制表符 | 文字换行 | 行尾空格 |
| -------------- | :----- | :----------- | :------- | :------- |
| `normal`       | 合并   | 合并         | 换行     | 删除     |
| `nowrap`       | 合并   | 合并         | 不换行   | 删除     |
| `pre`          | 保留   | 保留         | 不换行   | 保留     |
| `pre-wrap`     | 保留   | 保留         | 换行     | 挂起     |
| `pre-line`     | 保留   | 合并         | 换行     | 删除     |
| `break-spaces` | 保留   | 保留         | 换行     | 换行     |

## div 文本居中

垂直：父元素 `text-align: center`

水平：父元素 `line-hight` 跟高度	一样

## 绝对元素居中

## flex+sitcky 两栏布局

使用 `algin-self: start`

[我的位置：使用flexbox时，粘性元素不粘性 (qastack.cn)](https://qastack.cn/programming/44446671/my-position-sticky-element-isnt-sticky-when-using-flexbox)

## 文本与 svg 图标对齐

### 方法一

```css
.icon,
.text {
  vertical-align: middle;
  display: inline-block;
}
```

