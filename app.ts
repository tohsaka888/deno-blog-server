import { Application, Router } from "https://deno.land/x/oak@v8.0.0/mod.ts";
import {
  searchArticle,
  insertArticle,
  searchUser,
  User,
} from "./mongoConnection.ts";

const app = new Application();
const router = new Router();

// 设置响应头
const responseHeader = new Headers({
  "content-type": "application/json;charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*",
});

console.log("博客服务已经在8085端口启用");

// 路由匹配
router.get("/", (ctx) => {
  ctx.response.headers = responseHeader;
  ctx.response.body = "欢迎来到博客后端系统";
});

router.post("/addArticle", async (ctx) => {
  try {
    const requestBody = await ctx.request.body().value;
    if (requestBody) {
      const id = await insertArticle(requestBody);
      ctx.response.headers = responseHeader;
      ctx.response.status = 200;
      ctx.response.body = { _id: id, message: "插入成功" };
    }
  } catch (error) {
    const errorMsg: string = error.name + error.message;
    ctx.response.status = 300;
    ctx.response.body = { error: errorMsg, message: "插入失败" };
  }
});

router.get("/getArticles", async (ctx) => {
  ctx.response.status = 200;
  ctx.response.headers = responseHeader;
  ctx.response.body = await searchArticle();
});

//处理登陆请求
router.post("/login", async (ctx) => {
  try {
    let message: string;
    ctx.response.status = 200;
    const user: User = JSON.parse(await ctx.request.body().value);
    if (user) {
      const dbStatus: number | undefined = await searchUser(
        user.username,
        user.password
      );
      switch (dbStatus) {
        case 0:
          message = "登陆成功";
          break;
        case 1:
          message = "密码错误";
          break;
        case 2:
          message = "用户不存在";
          break;
        default:
          message = "";
          break;
      }
      ctx.response.headers = responseHeader;
      ctx.response.status = 200;
      ctx.cookies.set("loginUser", user.username, {
        expires: new Date(new Date().getDate() + 7),
      });
      const cookie: string | undefined = ctx.cookies.get("loginUser");
      if (cookie !== undefined) {
        responseHeader.append("set-Cookie", cookie);
      }
      ctx.response.body = {
        message: message,
        code: 200,
        cookie: ctx.cookies.get("loginUser"),
      };
    }
  } catch (error) {
    const errorMsg: string = error.name + error.message;
    ctx.response.status = 300;
    ctx.response.headers = responseHeader;
    ctx.response.body = { error: errorMsg, message: "登陆失败", code: 300 };
  }
});

//获取登陆状态
router.get("/login/status", (ctx) => {
  if (ctx.cookies.get("loginUser")) {
    ctx.response.body = {
      login: true,
      message: `欢迎${ctx.cookies.get("loginUser")}`,
      code: 200,
    };
  }
});

app.use(router.routes());
await app.listen({ port: 8085 });
