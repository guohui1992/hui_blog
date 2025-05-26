# 基于 mcp-go、AnythingLLM 链接本地 LLM

* * *

## MCP、LLM、Go 简介

 **我理解的 MCP 是“让本地数据与 LLM 集成的协议”。**  
它允许我连接某些 LLM，使之能处理诸如“现在圣保罗天气如何”这样的问题。MCP 作为中间接口，能将这些请求格式化后转发给 API（或本地执行操作，比如列出本地文件系统），最后把结构化结果返回给 LLM，供它后续处理和格式化。

简单说，MCP 就是让开发者可以像实现 API 一样实现实时查询接口，LLM 实时调用，响应基于实际 API 结果。

* * *

## 技术选型

我们这里用 Go SDK，因为对它最熟悉。  
MCP 官网有多种语言的实例和官方 SDK（如 Python、NodeJS 等），你可以选自己喜欢的。

由于调用 Claude（Anthropic 的产品）太贵，我选择了 AnythingLLM，它能执行本地模型，并且支持 MCP 协议。

本文用到的代码也已上传到 GitHub（原文未给出链接，实际可见 mcp-go）。

* * *

## 关键概念

  *  **MCP Server（Agent AI）** ：我们自己实现、用来响应请求的“服务器”。
  *  **MCP Client** ：会调用 MCP Server 的客户端。这里用 AnythingLLM。
  *  **Resources（资源）** ：MCP Server 消费的 API 响应、文件等，最终作为响应返回 MCP Client。
  *  **Tools（工具）** ：MCP Client 可调用的方法，如 `getForecast()`（获取天气）。



* * *

## 前置条件

  * 安装 AnythingLLM 并加载模型（如 Llama 3.2 3B）。AnythingLLM 支持切换不同本地模型。
  * 本文以天气预报 API 为例，仅实现 forecast 查询，alert 可自行尝试。



API 定义见 Weather MCP 示例。

* * *

## 开始实践

  1.  **创建 Go 项目并引入 mcp-go：**
    
         go mod init weather-go  
    go get github.com/mark3labs/mcp-go  
    

  2.  **定义 API 响应结构体**
    
         // /points/latitude,longitude 响应，主要关心 Forecast 字段  
    type WeatherPoints struct {  
        Properties struct {  
            Forecast string`json:"forecast"`  
        } `json:"properties"`  
    }  
    // /gridpoints/.../forecast 响应结构  
    type Forecast struct {  
        Properties struct {  
            Periods []struct {  
                Name             string`json:"name,omitempty"`  
                Temperature      int    `json:"temperature,omitempty"`  
                TemperatureUnit  string`json:"temperatureUnit,omitempty"`  
                WindSpeed        string`json:"windSpeed,omitempty"`  
                WindDirection    string`json:"windDirection,omitempty"`  
                ShortForecast    string`json:"shortForecast,omitempty"`  
                DetailedForecast string`json:"detailedForecast,omitempty"`  
            } `json:"periods,omitempty"`  
        } `json:"properties,omitempty"`  
    }  
    




* * *

## 构建 Forecast 工具

Forecast 工具定义了 MCP Client 如何调用天气查询——包括参数（如城市、经纬度）和方法。
    
    
    import (  
        "github.com/mark3labs/mcp-go/mcp"  
    )  
    // 添加 forecast 工具  
    func getForecast() mcp.Tool {  
        weatherTool := mcp.NewTool("get_forecast",  
            mcp.WithDescription("获取某地天气预报"),  
            mcp.WithNumber("latitude",  
                mcp.Required(),  
                mcp.Description("地点的纬度"),  
            ),  
            mcp.WithNumber("longitude",  
                mcp.Required(),  
                mcp.Description("地点的经度"),  
            ),  
        )  
        return weatherTool  
    }  
    

MCP Server 向 MCP Client 暴露 `get_forecast` 工具，需要填写经纬度参数。

* * *

## 调用 NWS API

编写 API 调用函数：
    
    
    const (  
        nws_api_base = "https://api.weather.gov"  
        user_agent   = "weather-app/1.0"  
    )  
    func makeNWSRequest(requrl string) ([]byte, error) {  
        client := &http.Client{}  
        req, err := http.NewRequest(http.MethodGet, requrl, nil)  
        if err != nil {  
            returnnil, err  
        }  
        req.Header.Set("User-Agent", user_agent)  
        req.Header.Set("Accept", "application/geo+json")  
      
        resp, err := client.Do(req)  
        if err != nil {  
            returnnil, err  
        }  
        defer resp.Body.Close()  
        body, err := io.ReadAll(resp.Body)  
        if err != nil {  
            returnnil, err  
        }  
        return body, nil  
    }  
    

* * *

## 实现 forecast 工具的处理函数
    
    
    const (  
        maxForecastPeriods = 5// 只返回5个预报时段  
    )  
    func forecastCall(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {  
        latitude := request.Params.Arguments["latitude"].(float64)  
        longitude := request.Params.Arguments["longitude"].(float64)  
      
        // 第一次请求 points API  
        pointsURL := fmt.Sprintf("%s/points/%.4f,%.4f", nws_api_base, latitude, longitude)  
        points, err := makeNWSRequest(pointsURL)  
        if err != nil {  
            returnnil, fmt.Errorf("调用 points API 错误: %w", err)  
        }  
        pointsData := &WeatherPoints{}  
        if err := json.Unmarshal(points, pointsData); err != nil {  
            returnnil, fmt.Errorf("解析 points 响应错误: %w", err)  
        }  
        if pointsData == nil || pointsData.Properties.Forecast == "" {  
            returnnil, fmt.Errorf("points 响应中没有 forecast url")  
        }  
      
        // 第二次请求 forecast API  
        forecastReq, err := makeNWSRequest(pointsData.Properties.Forecast)  
        if err != nil {  
            returnnil, fmt.Errorf("获取 forecast 数据错误")  
        }  
        forecastData := &Forecast{}  
        if err := json.Unmarshal(forecastReq, forecastData); err != nil {  
            returnnil, fmt.Errorf("解析 forecast 响应错误: %w", err)  
        }  
      
        type ForecastResult struct {  
            Name        string`json:"Name"`  
            Temperature string`json:"Temperature"`  
            Wind        string`json:"Wind"`  
            Forecast    string`json:"Forecast"`  
        }  
      
        // 整理前5个预报时段  
        forecast := make([]ForecastResult, maxForecastPeriods)  
        for i, period := range forecastData.Properties.Periods {  
            forecast[i] = ForecastResult{  
                Name:        period.Name,  
                Temperature: fmt.Sprintf("%d°%s", period.Temperature, period.TemperatureUnit),  
                Wind:        fmt.Sprintf("%s %s", period.WindSpeed, period.WindDirection),  
                Forecast:    period.DetailedForecast,  
            }  
            if i >= maxForecastPeriods-1 {  
                break  
            }  
        }  
      
        forecastResponse, err := json.Marshal(&forecast)  
        if err != nil {  
            returnnil, fmt.Errorf("序列化 forecast 错误: %w", err)  
        }  
        return mcp.NewToolResultText(string(forecastResponse)), nil  
    }  
    

* * *

## 服务器主程序

将工具和处理逻辑添加到 MCP Server 并启动：
    
    
    import (  
        "github.com/mark3labs/mcp-go/server"  
    )  
    func main() {  
        // 创建 MCP 服务  
        s := server.NewMCPServer(  
            "Weather Demo",  
            "1.0.0",  
            server.WithResourceCapabilities(true, true),  
            server.WithLogging(),  
            server.WithRecovery(),  
        )  
      
        // 添加 forecast 工具及其处理函数  
        s.AddTool(getForecast(), forecastCall)  
      
        // 启动服务（STDIO模式）  
        if err := server.ServeStdio(s); err != nil {  
            fmt.Printf("Server error: %v\n", err)  
        }  
    }  
    

编译并运行：
    
    
    go build -o forecast .  
    ./forecast  
    

* * *

## 与 AnythingLLM 集成

AnythingLLM 通过配置 JSON 文件调用 MCP Server。  
在 MacOS 上配置路径一般为：  
`~/Library/Application\ Support/anythingllm-desktop/storage/plugins/anythingllm_mcp_servers.json`

配置示例：
    
    
    {  
        "mcpServers": {  
            "weather": {  
                "command": "/Users/rkatz/codes/mcp/weather-go/forecast"  
            }  
        }  
    }  
    

配置好后，在 AnythingLLM UI 检查是否正常工作。

* * *

## 测试用例

直接在对话框输入：
    
    
    @agent what's the forecast for Atlanta?  
    

注意： **必须以` @agent` 开头，AnythingLLM 才会将请求转发给 MCP Server。**

* * *

## 调试建议

  * 最常见的问题是 AnythingLLM 的 MCP 配置命令不对。
  * 如果 Agent/MCP Server 返回错误，可以让 LLM 打印详细错误信息，比如
    
        Can you print the full error or can you print the Json response from Server  
    

  * 这样可以快速定位问题。

  


* * *

 **推荐阅读**  


  * [4种革新性AI Agent工作流设计模式全解析-文末福利](https://mp.weixin.qq.com/s?__biz=MzAxMTA4Njc0OQ==&mid=2651455166&idx=1&sn=0791bcf535c6cdcdb2f0d84065393e0a&scene=21#wechat_redirect)




  


 **福利**  
我为大家整理了一份从入门到进阶的Go学习资料礼包，包含学习建议：入门看什么，进阶看什么。关注公众号 「polarisxu」，回复 **ebook** 获取；还可以回复「 **进群** 」，和数万 Gopher 交流学习。

