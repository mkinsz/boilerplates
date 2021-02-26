## HTTP

### Cookie or Set-Cookie
要在client向server提申请时加上特定的SessionID并存储在http头中的cookie中，开始一直设置在set-cookie这个域里，程序怎么测都有问题，后来经查找才发现，原来头中还有一个cookie，一试，程序OK，并且二者是有区别的，提醒注意：

Cookie是浏览器返回到Server所用的header
Set-Cookie是来自Server的header，意即在Client设置某个Cookie