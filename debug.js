// 用于调试频道创建问题的脚本
import axios from "axios";

// 模拟用户请求数据
const requestData = {
  name: "weixin",
  workId: "72d27c00-66f0-47e0-a668-50fde829bb32",
  status: 1,
  id: "4d8cc366-4ecf-4549-91ad-02f5cbf5dde6",
};

// 发送请求到后端API
axios
  .post("http://localhost:7001/api/channel", requestData, {
    headers: {
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc4MmVjYzFlMzcyMjY5M2E4M2JhMWYiLCJ1c2VybmFtZSI6InRlc3QiLCJleHAiOjE3NDIzMjU5ODN9.tKm32fUUe7h9H2eDSMmAli7tJbWXDjKjpjyxv-r8xHI",
      "Content-Type": "application/json",
    },
  })
  .then((response) => {
    console.log("Response:", response.data);
  })
  .catch((error) => {
    console.error("Error:", error.response.data);
  });
