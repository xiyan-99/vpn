信息面板仅限iOS 4.9.3+
Surge iOS 4.9.3 增加了一项实验性功能，允许用户自定义一个或多个信息面板以显示相关信息。

要使用此功能，用户需持有有效订阅，且该订阅将在2021年9月22日后到期。如果订阅到期且面板配置文件部分仍被配置，面板不会显示，但不会影响其他功能的正常使用。 示例：

[Panel]
PanelA = title="Panel Title",content="Panel Content\nSecondLine",style=info
支持的样式参数有 good、info、alert、error。

PanelA 是信息面板的名称，这个参数会在脚本模式下传递给脚本。

静态模式
上述配置生成的面板是静态的，可用于管理配置文件或企业配置文件，在更新配置文件时更新面板内容，并为终端用户提供作指南。

动态模式
面板内容可以通过脚本更新。

[Panel]
PanelB = title="Panel Title",content="Panel Content\nSecondLine",style=info,script-name=panel

[Script]
panel = script-path=panel.js,type=generic
新版本还引入了通用类型的脚本。当用户点击刷新按钮时，脚本将被评估为参数

$input ： { 目的：“面板”， 立场：“政策选择”， 面板名称：“面板B” }, $trigger：“按钮” // 或“自动音程”

脚本应返回标题、内容和样式字段，$done（）。

在脚本首次评估前，评审小组会在定义行中使用静态内容。运行后，Surge会自动缓存最后脚本返回的结果，并在执行刷新前始终显示该脚本的结果。

示例剧本：

$httpClient.get("https://api.my-ip.io/ip", function(error, response, data){
    $done({
        title: "External IP Address",
        content: data,
    });
});
另外，你可以指定“更新间隔”参数，使面板自动更新。

[Panel]
PanelB = title="Panel Title",content="Panel Content\nSecondLine",style=info,script-name=panel,update-interval=60
只有当用户切换到策略选择视图时，才会自动更新。所以你可以在这里指定一个小时间（比如1）来让面板每次都自动更新。

更多自定义
当样式字段未被传递时，卡片不会显示图标，只显示文本
当样式字段未被传递时，可以输入图标字段，以自定义任何有效的SF符号名称，如bolt.horizontal.circle.fill。
使用图标字段时，输入图标颜色字段以控制图标颜色，值为颜色的HEX码。