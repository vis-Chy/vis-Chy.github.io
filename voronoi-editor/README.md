# Voronoi 编辑器

### /voronoi.html

可编辑基础voronoi图。目前支持本地上传csv数据，数据表构建格式如下：

| id   | name | value | color   |
| ---- | ---- | ----- | ------- |
| 1    | aaa  | 11    | #ffffff |
| 2    | bbb  | 22    | #6a6a6a |
| 3    | ccc  | 33    | #000000 |

**color**字段为自选字段，可指定颜色，颜色描述需采用16进制颜色代码。

### /voronoiHierarchy.html

可编辑多层级voronoi treemap。目前支持本地上传json数据、csv数据。

由于基于[d3-voronoi-treemap](https://github.com/Kcnarf/d3-voronoi-treemap)编写，层次voronoi的生成严格依赖于[d3-hierarchy](https://github.com/d3/d3-hierarchy#hierarchy)，因此json、csv文件需严格按照标准格式构造。

###### json文件格式如下：

```javascript
{
  "name": "world",
  "children": [
    {
      "name": "Asia",
      "color": "#f58321",
      "children": [
        {"name": "China", "weight": 14.84, "code": "CN"},
        {"name": "Japan", "weight": 5.91, "code": "JP"},
        {"name": "India", "weight": 2.83, "code": "IN"}
          
    },
    {
      "name": "North America",
      "color": "#ef1621",
      "children": [
        {"name": "United States", "weight": 24.32, "code": "US"},
        {"name": "Canada", "weight": 2.09, "code": "CA"},
        {"name": "Mexico", "weight": 1.54, "code": "MX"}
      ]
    },
  ]
}
```

其中必须包含name和weight，name记录唯一名称，weight记录数据值。

###### csv数据表结构如下：

| name     | weight | parent   |
| -------- | ------ | -------- |
| ancestor |        |          |
| father   |        | ancestor |
| mother   |        | ancestor |
| child1   | 11     | father   |
| child2   | 22     | father   |
| child3   | 33     | mother   |
| child4   | 44     | mother   |

三个字段都为必须字段，name记录唯一名称；weight记录数据值，只有叶子节点需要有数据值；parent记录该节点的父级名称。表中所有节点最终需收敛于唯一一个父级节点。

### Bugs
1. 还没考虑兼容Firefox;
2. 导出svg被hover图层覆盖；


------

#### 参考：

https://bl.ocks.org/Kcnarf/fa95aa7b076f537c00aed614c29bb568

https://bl.ocks.org/Kcnarf/238fa136f763f5ad908271a170ef60e2

https://irv.swayable.com/
