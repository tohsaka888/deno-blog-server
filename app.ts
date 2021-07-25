import { Application, Router } from "https://deno.land/x/oak@v8.0.0/mod.ts";
import { searchArticle, insertArticle } from "./mongoConnection.ts";

const app = new Application();
const router = new Router();

// 设置响应头
const responseHeader = new Headers({
  'content-type': 'application/json;charset=UTF-8'
})

console.log("博客服务已经在8080端口启用");

// 路由匹配
router.get("/", (ctx) => {
  ctx.response.body = "欢迎来到博客后端系统";
});

router.post("/addArticle", async (ctx) => {
  try {
    const requestBody = await ctx.request.body().value;
    if (requestBody) {
      const id = await insertArticle(requestBody);
      ctx.response.headers = responseHeader
      ctx.response.status = 200;
      ctx.response.body = { _id: id, message: "插入成功" };
    }
  } catch (error) {
    const errorMsg:string = error.name + error.message 
    ctx.response.status = 300;
    ctx.response.body = { error: errorMsg, message: "插入失败" };
  }
});

router.get("/getArticles", async (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = await searchArticle();
});

app.use(router.routes());
await app.listen({ port: 8080 });
