# JS Interview

## 

1. 例举3种强制类型转换和2种隐式类型转换?
强制（parseInt,parseFloat,number）
隐式（== ===）

隐式转换规则
    转成string类型： + (字符串连接符)
    转成number类型：++/--(自增自减运算符) + - * / %(算术运算符) > < >= <= == != === !=== (关系运算符)
    转成boolean类型：!(逻辑非运算符) 

2. (1)闭包是什么，有什么特性，对页面有什么影响; (2) 闭包的好处
答案：
(1) 闭包是指有权访问另一个函数作用域中变量的函数,使得函数不被GC回收，如果过多使用闭包，容易导致内存泄露
(2) 希望一个变量长期驻扎在内存当中(不被垃圾回收机制回收)
    避免全局变量的污染
    私有成员的存在
    安全性提高

3. (1)如何阻止事件冒泡 (2)如何阻止默认事件
答案:(1) ie:阻止冒泡ev.cancelBubble = true;非IE ev.stopPropagation();
    (2) return false；ev.preventDefault();

4. 对作用域上下文和this的理解，看下列代码：
    var User = {
    count: 1,
    getCount: function() {
    return this.count;
    }
    };
    console.log(User.getCount()); // what?
    var func = User.getCount;
    console.log(func()); // what?

问两处console输出什么? 为什么?
答案:是1和undefined。
　　func是在window的上下文中被执行的，所以不会访问到count属性。

5. 看下面代码，给出输出结果。
    for(var i = 1; i <= 3; i++){  //建议使用let 可正常输出i的值
    setTimeout(function(){
        console.log(i);   
    },0); 
    };
答案：4 4 4。
原因：Javascript事件处理器在线程空闲之前不会运行。

6. 什么是虚拟dom
React为啥这么大？因为它实现了一个虚拟DOM（Virtual DOM）。虚拟DOM是干什么的？这就要从浏览器本身讲起

如我们所知，在浏览器渲染网页的过程中，加载到HTML文档后，会将文档解析并构建DOM树，然后将其与解析CSS生成的CSSOM树一起结合产生爱的结晶——RenderObject树，然后将RenderObject树渲染成页面（当然中间可能会有一些优化，比如RenderLayer树）。这些过程都存在与渲染引擎之中，渲染引擎在浏览器中是于JavaScript引擎（JavaScriptCore也好V8也好）分离开的，但为了方便JS操作DOM结构，渲染引擎会暴露一些接口供JavaScript调用。由于这两块相互分离，通信是需要付出代价的，因此JavaScript调用DOM提供的接口性能不咋地。各种性能优化的最佳实践也都在尽可能的减少DOM操作次数。

而虚拟DOM干了什么？它直接用JavaScript实现了DOM树（大致上）。组件的HTML结构并不会直接生成DOM，而是映射生成虚拟的JavaScript DOM结构，React又通过在这个虚拟DOM上实现了一个 diff 算法找出最小变更，再把这些变更写入实际的DOM中。这个虚拟DOM以JS结构的形式存在，计算性能会比较好，而且由于减少了实际DOM操作次数，性能会有较大提升

7. 程序中捕获异常的方法？
try{
 
}catch(e){
 
}finally{
 
}

8. http的cache机制，以及200状态下怎么实现 from cache(表示接触最多的就是304的from cache)含义
(1)定义：浏览器缓存（Browser Caching）是为了加速浏览，浏览器在用户磁盘上对最近请求过的文档进行存储，当访问者再次请求这个页面时，浏览器就可以从本地磁盘显示文档，这样就可以加速页面的阅览。

(2)cache的作用：
1、减少延迟，让你的网站更快，提高用户体验。
2、避免网络拥塞，减少请求量，减少输出带宽。

(3)实现手段
Cache-Control中的max-age是实现内容cache的主要手段，共有3种常用策略：max-age和Last-Modified（If-Modified-Since）的组合、仅max-age、max-age和ETag的组合。

(4) 对于强制缓存，服务器通知浏览器一个缓存时间，在缓存时间内，下次请求，直接用缓存，不在时间内，执行比较缓存策略。
    对于比较缓存，将缓存信息中的Etag和Last-Modified通过请求发送给服务器，由服务器校验，返回304状态码时，浏览器直接使用缓存。

9. 跨域相关
只要协议、域名、端口有不同，则视为不同的域。（域名和域名对应的IP也是跨域）

1.CORS: Cross-Origin Resource Sharing
基于服务器支持的跨域，服务器设置Access-Control-Allow-Origin响应头，浏览器可允许跨域

2.设置domain
能从子域设到主域，如a.b.c.com—>b.c.com—>c.com
具体情况：在页面中用iframe打开了另一个页面（前提：两个页面主域是相同的）
利用frameElement.contentWindow.document.domain设置frame子页面的主域，document.domain设置主页面的主域，之后就能互相获取dom中的数据。
缺点是只能用于不同子域间的交互。

10. Git:
git fetch & git pull区别
git pull自动完成了fetch最新远程版本，并且和本地进行merge
git fetch获得远程分支，要继续手动merge合并

git使用过程中，如果你在开发着业务，突然另一个分支有一个bug要改，你怎么办
git stash //将本次修改存到暂存区（紧急切换分支时）
git stash pop //将所有暂存区的内容取出来