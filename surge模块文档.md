模块
模块是一组用于覆盖当前配置文件的设置。你可以使用模块来：

调整不可编辑配置文件中的设置，比如托管配置文件和企业配置文件。
只需轻触即可更改部分设置。例如，你可以用模块为所有主机名启用中间人，并临时调整过滤器。
使用他人编写的模块来完成特定任务。例如，你的同事可能会和你分享一个模块，重写测试服务器的API请求。
当你在设备间共享一个配置文件时，有些设置可能需要根据不同场景进行修改。模块的启用状态不会同步到其他设备，所以你可以用某个模块来实现。
基本概念
模块就像当前配置文件的补丁。模块的设置优先级高于配置文件的设置。

模块分为三种类型：

内部模块：由Surge自行提供。
本地模块：.sgmodule 文件放置在配置文件目录中。
已安装模块：带有URL安装的模块。
编写模块
模块的语法与配置文件相同。你可以覆盖以下部分：

通用、复制、中间人

覆盖：key = value
附加到原始数值后：key = %APPEND% value
在原始数值的前方插入：key = %INSERT% value

你只能在中间人（MITM）部分作“hostname”、“skip-server-cert-verify”和“tcp-connection”字段。

规则、脚本、URL 重写、头部重写、主机

新行将插入原内容顶部。

模块中的规则只能使用内部策略：DIRECT、REJECT 和 REJECT-TINYGIF。

元数据

你可以在模块文件中添加元数据：

  #!name=Name Here
  #!desc=Description Here
你可以将模块限制在指定的平台上。（可选）

  #!system=mac
示例：
#!name=MitM All Hostnames
#!desc=Perform MitM on all hostnames with port 443, except those to Apple and other common sites which can't be inspected. You still need to configure a CA certificate and enable the main switch of MitM.

[MITM]
hostname = -*.apple.com, -*.icloud.com, -*.mzstatic.com, -*.crashlytics.com, -*.facebook.com, -*.instagram.com, *
#!name=Game Console SNAT
#!desc=Let Surge handle SNAT conversation properly for PlayStation, Xbox, and Nintendo Switch. Only useful if Surge Mac acts the router for these devices.
#!system=mac
[General]
always-real-ip = %APPEND% *.srv.nintendo.net, *.stun.playstation.net, xbox.*.microsoft.com, *.xboxlive.com
要求iOS 5.10.0+ Mac 5.6.0+
该模块增加了描述，允许更复杂的使用条件限制。例如，如果模块使用新加入的 Body Rewrite 功能，则需要限制 Surge 核心的版本。#!requirement=

#!requirement=CORE_VERSION>=20

它还支持逻辑表达式，如 CORE_VERSION>=20 && （SYSTEM = 'iOS' ||SYSTEM = 'tvOS'）。

可用于判断的变量如下：

CORE_VERSION：数字，例如20
系统：字符串，例如 ， ，macOSiOStvOS
SYSTEM_VERSION：字符串，例如Version 17.4.1 (Build 21E236)
DEVICE_MODEL：字符串，例如Mac15,8
语言：字符串，例如zh-Hans