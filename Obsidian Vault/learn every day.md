## 7.24

### 模块化规范
https://www.modb.pro/db/335862

- CommonJS
- AMD（Asynchronous Module Definition）（RequireJS）
- CMD（Common Module Definition）（SeaJS）
- UMD（AMD + CommonJS）
- ESM

### 模块联邦

## 7.25

### 协程

协程是基于线程，但是轻量很多，可以理解为在用户层模拟线程操作。

协程都会有一个内核态线程动态绑定，用户态下实现调度、切换，真正执行任务的合适内核线程。

协程的上下文切换，完全由用户控制，避免了大量的中断参与，减少了线程上下文切换与调度的消耗。

线程是操作系统层面的概念，协程是语言层面的概念。线程是被动挂起恢复的（抢占式），协程是主动挂起恢复的。

### 小林计网

[初始序列号是如何随机产生的](https://www.xiaolincoding.com/network/3_tcp/tcp_interview.html#%E5%88%9D%E5%A7%8B%E5%BA%8F%E5%88%97%E5%8F%B7-isn-%E6%98%AF%E5%A6%82%E4%BD%95%E9%9A%8F%E6%9C%BA%E4%BA%A7%E7%94%9F%E7%9A%84)

## 7.26

### 任务调度 api

- requestAnimationFrame
- requestIdleCallback
- setTimeout
- MessageChannel
- 微任务
	- MutationObserver
	- Promise