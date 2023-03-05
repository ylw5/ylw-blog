# SVG 播放器

由来：

在写文章或记录笔记时经常要绘制流程图，并且这些流程图是相互关联的，图片数量过多将会导致不易阅读，有什么办法能将这些流程图串联成动画，同时又能每张图片单独放映？

预期：

制作一个组件，输入多张图片（.svg）的路径或内容，会自动生成相邻图片之间的补间动画，同时具备轮播图放映和播放完整动画的功能。

思路

1. 找出相邻 SVG 上的可复用元素
   
   绘图工具 的导出 svg 中的容器上没有标识符？？？？（tldraw老版本有，新版本没有，但是导出json类型就有）（excaildraw 导出没有）
   
   - 手动标记 id
   - 根据 json，比较 json 记录变化状态，在渲染处真实 svg dom 时添加动画
     - 需要找到 tldraw 源码中关于 json 转换的原理，这东西是 react 写的我没学过啊！！
   
2. 比较可复用元素的不同（设计一种 diff 算法比较 svg 元素）

   - 属性不同

     Element.attributes 属性

   - 新增子元素

   - 移除子元素

3. 创建旧元素到新元素的动画（修正不同）

   - 相同容器
     - 位置不同，需要移动
     - 样式属性变化
   - 新增容器
     - 单向箭头，双向箭头，依据 path 元素的 d 属性规划路径
     - 其他容器的展现？？？

   - 移除容器

如何改变 SVG 元素：

- css 修改，只能改 fill stroke 之类样式

- 修改内联样式 style
- 使用 gsap 工具

如何生成动画：

- gsap 动画库
- motion canvas

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 96" width="168" height="96" style="background-color: transparent;"><defs><style>@import url('https://fonts.googleapis.com/css2?family=Caveat+Brush&amp;family=Source+Code+Pro&amp;family=Source+Sans+Pro&amp;family=Crimson+Pro&amp;display=block');</style></defs><g text-align="center" text-anchor="middle" transform="translate(16.00, 16.00) rotate(0.00, 68.00, 32.00)"><g id="6edb83af-b274-49b5-18f4-c6f20c5ca9e5_svg" class="tl-centered-g"><path d="M41.24,64.55 Q27.93,64.79 19.55,64.91 T7.08,63.30 1.79,57.92 0.34,50.38 0.03,42.59 -0.12,34.80 -0.41,27.01 -0.77,19.21 -1.12,11.35 0.55,4.36 9.89,0.54 26.04,-0.36 43.64,-0.44 61.65,-0.46 79.77,-0.63 97.91,-0.88 116.08,-1.13 129.46,0.50 134.88,5.89 136.15,13.43 136.20,21.22 136.08,29.00 136.09,36.79 136.17,44.59 136.23,52.44 134.39,59.39 125.11,63.20 109.18,64.10 91.85,64.19 74.12,64.22 56.28,64.39 35.36,64.67 23.14,64.77 22.69,64.62 22.32,64.34 22.06,63.95 21.93,63.50 21.95,63.04 22.12,62.60 22.43,62.25 22.83,62.00 23.28,61.90 23.75,61.95 24.17,62.14 24.51,62.46 24.73,62.88 24.81,63.34 24.74,63.80 24.52,64.21 24.18,64.54 23.76,64.73 23.29,64.79 22.84,64.69 22.43,64.45 22.13,64.09 21.96,63.66 21.93,63.19 22.05,62.74 22.31,62.35 22.68,62.07 23.13,61.92 23.36,61.88 35.35,61.92 56.27,62.02 74.10,62.03 91.81,61.82 109.01,61.37 124.07,60.57 131.87,58.08 133.15,52.28 133.43,44.55 133.71,36.76 133.90,28.99 133.83,21.29 133.47,13.89 132.48,7.39 128.44,3.25 116.05,1.98 97.92,1.86 79.78,1.74 61.66,1.72 43.68,1.93 26.21,2.37 10.92,3.17 3.06,5.63 1.96,11.41 1.97,19.15 1.96,26.95 2.06,34.73 2.40,42.44 3.02,49.86 4.17,56.37 8.10,60.52 19.59,61.81 34.57,61.93 41.39,62.01 41.68,62.08 41.95,62.23 42.18,62.43 42.36,62.68 42.47,62.96 42.51,63.27 42.47,63.57 42.36,63.86 42.19,64.11 41.96,64.31 41.69,64.46 41.40,64.53 Z" fill="#cecece" stroke="#cecece" stroke-width="2" pointer-events="none"/></g><text font-size="28px" font-family="Caveat Brush" font-weight="normal" line-height="28px" letter-spacing="-0.03em" text-align="center" dominant-baseline="mathematical" alignment-baseline="mathematical" text-anchor="middle" transform="translate(25.5, 13)" fill="#cecece" transform-origin="center center"><tspan y="14px" x="42.5">square 1
</tspan></text></g></svg>



```
interface RootObject {
  type: string;
  shapes: Shape[];
  bindings: Binding[];
  assets: any[];
}

interface Binding {
  id: string;
  type: string;
  fromId: string;
  toId: string;
  handleId: string;
  point: number[];
  distance: number;
}

interface Shape {
  id: string;
  type: string;
  name: string;
  parentId: string;
  childIndex: number;
  point: number[];
  size?: number[];
  rotation: number;
  style: Style;
  label?: string;
  labelPoint?: number[];
  bend?: number;
  handles?: Handles;
  decorations?: Decorations;
  text?: string;
}

interface Decorations {
  end: string;
}

interface Handles {
  start: Start;
  end: Start;
  bend: Bend;
}

interface Bend {
  id: string;
  index: number;
  point: number[];
}

interface Start {
  id: string;
  index: number;
  point: number[];
  canBind: boolean;
  bindingId: string;
}

interface Style {
  color: string;
  size: string;
  isFilled: boolean;
  dash: string;
  scale: number;
  font: string;
  textAlign: string;
}
```

```json
{
  "type": "tldr/clipboard",
  "shapes": [
    {
      "id": "6edb83af-b274-49b5-18f4-c6f20c5ca9e5",
      "type": "rectangle",
      "name": "Rectangle",
      "parentId": "currentPageId",
      "childIndex": 4,
      "point": [
        1416,
        1024
      ],
      "size": [
        136,
        64
      ],
      "rotation": 0,
      "style": {
        "color": "white",
        "size": "small",
        "isFilled": false,
        "dash": "draw",
        "scale": 1,
        "font": "script",
        "textAlign": "justify"
      },
      "label": "square 1",
      "labelPoint": [
        0.5,
        0.5
      ]
    },
    {
      "id": "5d0e7c46-efd2-46f6-24dd-fbd4bf20d8be",
      "type": "rectangle",
      "name": "Rectangle",
      "parentId": "currentPageId",
      "childIndex": 5,
      "point": [
        1720,
        1024
      ],
      "size": [
        136,
        64
      ],
      "rotation": 0,
      "style": {
        "color": "white",
        "size": "small",
        "isFilled": false,
        "dash": "draw",
        "scale": 1,
        "font": "script",
        "textAlign": "justify"
      },
      "label": "square 2",
      "labelPoint": [
        0.5,
        0.5
      ]
    },
    {
      "id": "da782622-6618-4f01-1a27-6ec90e2aa012",
      "type": "arrow",
      "name": "Arrow",
      "parentId": "currentPageId",
      "childIndex": 6,
      "point": [
        1552,
        1056
      ],
      "rotation": 0,
      "bend": 0,
      "handles": {
        "start": {
          "id": "start",
          "index": 0,
          "point": [
            0,
            0
          ],
          "canBind": true,
          "bindingId": "eb24109c-60a4-4c9d-0c1e-5fe06732c4fa"
        },
        "end": {
          "id": "end",
          "index": 1,
          "point": [
            152,
            0
          ],
          "canBind": true,
          "bindingId": "77e47698-80a8-48bf-2503-4d9875e425a9"
        },
        "bend": {
          "id": "bend",
          "index": 2,
          "point": [
            76,
            0
          ]
        }
      },
      "decorations": {
        "end": "arrow"
      },
      "style": {
        "color": "white",
        "size": "small",
        "isFilled": false,
        "dash": "draw",
        "scale": 1,
        "font": "script",
        "textAlign": "justify"
      },
      "label": "link",
      "labelPoint": [
        0.5,
        0.5
      ]
    },
    {
      "id": "89938c8d-dba9-4eab-07ab-639e0345cc06",
      "type": "text",
      "name": "Text",
      "parentId": "currentPageId",
      "childIndex": 7,
      "point": [
        1616.5,
        1149
      ],
      "rotation": 0,
      "text": "single text",
      "style": {
        "color": "white",
        "size": "small",
        "isFilled": false,
        "dash": "draw",
        "scale": 1,
        "font": "script",
        "textAlign": "justify"
      }
    }
  ],
  "bindings": [
    {
      "id": "eb24109c-60a4-4c9d-0c1e-5fe06732c4fa",
      "type": "arrow",
      "fromId": "da782622-6618-4f01-1a27-6ec90e2aa012",
      "toId": "6edb83af-b274-49b5-18f4-c6f20c5ca9e5",
      "handleId": "start",
      "point": [
        0.5,
        0.5
      ],
      "distance": 16
    },
    {
      "id": "77e47698-80a8-48bf-2503-4d9875e425a9",
      "type": "arrow",
      "fromId": "da782622-6618-4f01-1a27-6ec90e2aa012",
      "toId": "5d0e7c46-efd2-46f6-24dd-fbd4bf20d8be",
      "handleId": "end",
      "point": [
        0.5,
        0.5
      ],
      "distance": 16
    }
  ],
  "assets": []
}
```





# 使用 navigation 新 API 写一个简单vue-router





