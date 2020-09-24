# 😃😃 react-crx

基于React+Antd开发Chrome Extension的项目Demo

❤️❤️ 本项目架构实现了以下功能：

- 集成Stylus
- 集成React+Ant Design
- 集成mock.js
- 集成react-router-dom
- 解决Ant Design全局样式污染问题
- 实现Ant Design按需加载
- 将popup、content、background目录互相独立，便于团队协作开发维护
- 按照Chrome Extension最终生成目录要求配置webpack
- 封装axios，可以将API请求委托给background script执行，从而实现跨域请求
- 设置.env.development环境变量，便于在开发环境下禁止委托background script发起请求
- 实现了popup、content、background简单Demo

## 开发调试

即可在开发环境预览调试popup页面

如果需要在开发环境预览调试content script，

修改src/popup/index.js

引入content script
```
    import React, { Fragment } from 'react'
    import { HashRouter, Route, Switch, Redirect } from 'react-router-dom'
    import Login from './pages/login'
    import Home from './pages/home'
    import './popup.styl'
+   import '@/content'
```

## build项目

执行：
```
yarn build
```

即可生成最终Chrome Extension文件。

## 精简最终build文件

build生成的最终文件，对于插件来说，有很多是不必要的。

可删除以下文件：
```
    ├─ /images
    ├─ /static
    |  ├─ /css
    |  |  ├─ content.css
-   |  |  ├─ content.css.map
    |  |  ├─ main.css
-   |  |  └─ main.css.map
    |  ├─ /js
    |  |  ├─ background.js
-   |  |  ├─ background.js.LICENSE.txt
-   |  |  ├─ background.js.map
    |  |  ├─ content.js
-   |  |  ├─ content.js.LICENSE.txt
-   |  |  ├─ content.js.map
    |  |  ├─ main.js
-   |  |  ├─ main.js.LICENSE.txt
-   |  |  └─ main.js.map
    |  ├─ /media
-   ├─ asset-manifest.json
    ├─ favicon.ico
    ├─ index.html
    ├─ insert.js
    ├─ manifest.json
-   ├─ precache-manifest.xxxxxxx.js
-   ├─ service-worker.js
```
