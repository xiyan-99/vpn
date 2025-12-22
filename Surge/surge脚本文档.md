脚本
您可以使用JavaScript来扩展Surge的功能。

剧本部分
[Script]
script1 = type=http-response,pattern=^http://www.example.com/test,script-path=test.js,max-size=16384,debug=true
script2 = type=cron,cronexp="* * * * *",script-path=fired.js
script3 = type=http-request,pattern=^http://httpbin.org,script-path=http-request.js,max-size=16384,debug=true,requires-body=true
script4 = type=dns,script-path=dns.js,debug=true
每行包含两个组件：脚本名和参数。 常见参数：

type：文字类型：， ， ， ， ， ， 。http-requesthttp-responsecroneventdnsrulegeneric
script-path脚本的路径可以是配置文件的相对路径、绝对路径或URL。
script-update-interval：使用URL作为脚本路径时的更新间隔，以秒为单位。
debug： 启用调试模式，该模式具有多个效果：
脚本每次都会从文件系统加载出来，然后再进行评估。（仅限Surge Mac）
对于脚本，当你用来记录消息时，消息也会显示在请求的备忘录中。http-requesthttp-responseconsole.log()
timeout：剧本中最长的片长。默认数值是5秒。
argument：脚本可以取取 。$argument
engine：请参阅本文后半部分。
和 的参数：http-requesthttp-response

pattern： 正则表达式模式以匹配 URL。

requires-body： 这允许脚本修改请求/响应主体。默认值为假。这种行为代价高昂。只有在必要时才启用。

max-size请求/响应体的最大允许大小。默认值为131072（128KB）。

binary-body-mode仅在iOS 15和macOS上提供。原始二进制体数据会传递给 Uint8Array 中的脚本，而不是字符串值。

脚本编写需要Surge将整个响应体数据加载到内存中。庞大的响应体可能导致Surge iOS崩溃，因为iOS系统限制了网络扩展能占用的最大内存。

请仅启用必要的URL脚本。

如果响应体大小超过该值，Surge 会退回到直通模式，跳过该请求的脚本。max-size

基本约束
脚本允许异步作。$done（值）) should be invoked to indicate completion, even for the scripts which don't require a result. Otherwise, the script gets a warning because of a timeout.

演出
你不用担心脚本的表现。JavaScript核心尤为有效。

公共API
基本信息
$network
该对象包含网络环境的详细信息。

$script

$script.name<String>：正在评估的剧本名称。
$script.startTime<Date>：当前剧本开始的时间。
$script.type<String>：当前剧本的类型。
$environment

$environment.system<String>：iOS 或 macOS。
$environment.surge-build<String>：Surge的组装编号。
$environment.surge-version<String>：《Surge》的简短版本编号。
$environment.language<String>：Surge当前的用户界面语言。
$environment.device-model<String>：当前的设备型号。iOS 5.9.0+ Mac 5.5.0+
持久存储
$persistentStore.write(data<String>, [key<String>])
永久保存数据。只允许使用一根弦。如果成功，请返回真。

$persistentStore.read([key<String>])
获取保存的数据。返回字符串或 Null。

如果密钥未定义，具有相同脚本路径的脚本将共享存储池。使用密钥时，数据可以在不同脚本之间共享。

提示：Surge Mac 会把$persistentStore数据写入目录。你可以直接编辑这里的文件以便调试。~/Library/Application Support/com.nssurge.surge-mac/SGJSVMPersistentStore/

控制浪涌
$httpAPI(method<String>, path<String>, body<Object>, callback<Function>(result<Object>))
你可以用$httpAPI调用所有HTTP API来控制Surge的功能。无需认证参数。请参阅HTTP API部分了解可用的功能。

$httpClient
$httpClient.post(URL<String> or options<Object>, callback<Function>)
发起HTTP POST请求。第一个参数可以是URL或对象。一个示例物体可能长这样。

{
  url: "http://www.example.com/",
  headers: {
    Content-Type: "application/json"
    },
  body: "{}",
  timeout: 5
}
当使用一个对象作为选项列表时，这是必须的。如果该字段存在，它会覆盖所有现有的头字段。 可以是字符串或对象。在呈现一个对象时，它被编码为 JSON 字符串，并将“Content-Type”设置为 。urlheadersbodyapplication/json

回应
回调：回调（错误、响应、数据）

成功时，错误为空，响应对象包含和属性。statusheaders

类似功能：$httpClient.get、$httpClient.put、$httpClient.delete、$httpClient.head、$httpClient.options、$httpClient.patch。

选项
timeout：默认超时时间为5秒。你可以用这个选项覆盖它。
insecure： 如果该选项设置为 true，https 请求将不会验证服务器证书。iOS 5.9.0+ Mac 5.5.0+
auto-cookie： 控制是否自动处理并存储与Cookie相关的字段，默认启用。如果关闭，Cookie 头会作为普通字段传递。iOS 5.9.0+ Mac 5.5.0+
auto-redirect： 控制在遇到30个HTTP状态码时是否自动重定向请求，默认启用。iOS 5.9.0+ Mac 5.5.0+
政策
您可以指定一个策略来执行请求：

policy：使用已有的保单名称。
policy-descriptor：使用带有完整描述符的临时政策。
二进制数据iOS 5.4.1+ Mac 5.0.1+
你可以将TypedArray对象传递为一个实体。

另外，你也可以用参数让Surge在TypedArray中返回响应数据，而不是String。binary-mode

{
  url: "http://www.example.com/",
  binary-mode: true
}
公用事业
console.log(message<String>)
登录到Surge日志文件。

setTimeout(function[, delay])
和浏览器里的setTimeout一样。

$utils.geoip(ip<String>)
进行GeoIP查询。结果显示在ISO 3166规范中。

$utils.ipasn(ip<String>)
查一下IP地址的ASN。

$utils.ipaso(ip<String>)
查查IP地址的ASO。

$utils.ungzip(binary<Uint8Array>)
解压 gzip 数据。结果也是一个Uint8Array。

$notification.post(title<String>, subtitle<String>, body<String>[, options<Object>])
发布通知。

可选方案：iOS 5.11.0+ Mac 5.7.0+

action：点击通知打开Surge后的作。

open-url：打开一个URL，具体URL由参数提供。url

clipboard：将内容复制到剪贴板（需用户确认），内容通过参数传递。text

media-url：为通知提供媒体内容，如图片。内容应是有效的网址。

media-base64：功能与上述相同，但内容由base64直接提供。它需要提供内容的MIME类型和参数。media-base64-mime

auto-dismiss：在指定时间（秒数）后自动关闭此通知，默认为0，意味着该通知会无限期持续。

sound弹出通知时使用默认推送音效。

手动触发
你可以在 Surge iOS 上长按脚本或使用系统的快捷方式应用手动触发脚本。

如果你用快捷方式触发脚本，可以选择性地将参数传递给脚本并用 来获取它。$intent.parameter

脚本引擎iOS 5.9.0+ Mac 5.5.0+
Surge 目前包含两个 JavaScript 脚本评估引擎。

JavaScriptCore （engine=jsc)
优势：
引擎初始化很快，调用时的开销很低（低延迟）。
缺点：
由于 JSC 运行于 NE 进程中，它会导致 Surge NE 进程的内存使用显著增加，可能导致系统因内存限制超出而终止。
WebView（engine=webview)
优势：

由于WebView的实际运行环境是另一个独立进程，脚本的执行几乎不会影响NE进程的内存使用，也不会因内存使用问题导致Surge NE进程被终止。
WebView 的 JS 执行环境可以使用 JIT，这大大提高了复杂或 CPU 密集型脚本的执行效率。
可以使用WebAPI。
缺点：

发动机的初始化时间开销略高一些
当需要在脚本和Surge之间传输大量数据时，由于跨进程通信，效率较低，这在使用二进制体模式处理较大请求时更为明显。
使用建议
对于小型、频繁调用的简单脚本，如 Rule、DNS 类脚本，建议使用 JSC。
对于复杂且高内存的脚本（例如解析MB级HTTP正文的JSON），建议使用WebView。
配置方法
在脚本配置行中添加参数：，该参数可配置为 ， ， 。engineautojscwebview

默认为 ，始终在可用时使用 WebView。auto
如果脚本中使用了WebAPI，应明确配置，使得当脚本在不支持WebView的环境中执行时，用户会被提示。webview
发动机供应情况
iOS：JSC与WebView
macOS
macOS 10.15及以下版本：仅支持JSC
macOS 11.0及以上版本：JSC和WebView
tvOS：仅限JSC