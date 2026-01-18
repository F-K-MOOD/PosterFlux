// 文生图API代理服务器
// 用于解决浏览器CORS问题

import http from "http";
import https from "https";
import url from "url";

const PORT = 3000;

const server = http.createServer((req, res) => {
  // 允许所有跨域请求
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-DashScope-Async",
  );

  // 处理OPTIONS请求
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // 解析请求URL
  const parsedUrl = url.parse(req.url, true);
  let apiPath = parsedUrl.pathname;

  // 转发请求到阿里云百炼API
  const options = {
    hostname: "dashscope.aliyuncs.com",
    port: 443,
    path: apiPath,
    method: req.method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // 复制请求头
  if (req.headers.authorization) {
    options.headers["Authorization"] = req.headers.authorization;
  }
  if (req.headers["x-dashscope-async"]) {
    options.headers["X-DashScope-Async"] = req.headers["x-dashscope-async"];
  }

  // 处理请求体
  let body = [];
  req
    .on("data", (chunk) => {
      body.push(chunk);
    })
    .on("end", () => {
      body = Buffer.concat(body).toString();

      // 创建HTTPS请求
      const apiReq = https.request(options, (apiRes) => {
        // 复制响应头
        for (let header in apiRes.headers) {
          res.setHeader(header, apiRes.headers[header]);
        }

        // 复制响应状态码
        res.writeHead(apiRes.statusCode);

        // 复制响应体
        apiRes.on("data", (chunk) => {
          res.write(chunk);
        });

        apiRes.on("end", () => {
          res.end();
        });
      });

      // 处理API请求错误
      apiReq.on("error", (e) => {
        console.error(`请求错误: ${e.message}`);
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      });

      // 发送请求体
      if (body) {
        apiReq.write(body);
      }

      apiReq.end();
    });
});

server.listen(PORT, () => {
  console.log(`代理服务器运行在 http://localhost:${PORT}`);
  console.log("使用方法:");
  console.log(
    "  1. 将前端代码中的 API URL 改为: http://localhost:3000/api/v1/services/aigc/text2image/image-synthesis",
  );
  console.log(
    "  2. 轮询任务状态的 URL 改为: http://localhost:3000/api/v1/tasks/{taskId}",
  );
});
