# Webpack Dll打包

## webpack.DllPlugin & webpack.DllReferencePlugin

    说白了，就是把项目里面依赖的第三方库，比如react, vue, echarts, moment 这些不会经常变动
的包，提前打包好。
    然后在webpack构建中，引入这些提前打包好的bundle的依赖（mainfest.json），这样在项目构建
时候，就不用每次都重复编译这些不经常变动的库，从而提高webpack的打包速度。

## How to use

