import { Application, Router } from "https://deno.land/x/oak@v8.0.0/mod.ts";
import {
  create,
  verify,
  getNumericDate,
  Header,
} from "https://deno.land/x/djwt@v2.2/mod.ts";
import {
  searchArticle,
  insertArticle,
  searchUser,
  User,
} from "./mongoConnection.ts";

const app = new Application();
const router = new Router();

type LoginStatus = {
  token: string;
};

// 设置响应头 处理跨域
const responseHeader = new Headers({
  "content-type": "application/json;charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*",
});

const tokenHeader: Header = { alg: "HS512", typ: "JWT" };
const expiresDate: number = getNumericDate(60 * 60 * 24 * 15); // 设置15天后过期

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
    let token: string;
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

          // 接受三个参数 Header Payload Signature
          token = await create(
            tokenHeader, // 算法加密方式和类型
            { username: user.username, exp: expiresDate }, // token包含的数据
            "secret"
          );
          ctx.response.status = 200;
          ctx.response.headers = responseHeader;
          ctx.response.body = {
            message: message,
            code: 200,
            token: token,
          };
          break;
        case 1:
          message = "密码错误";
          ctx.response.status = 200;
          ctx.response.headers = responseHeader;
          ctx.response.body = {
            message: message,
            code: 200,
            token: "",
          };
          break;
        case 2:
          message = "用户不存在";
          ctx.response.status = 200;
          ctx.response.headers = responseHeader;
          ctx.response.body = {
            message: message,
            code: 200,
            token: "",
          };
          break;
        default:
          message = "";
          break;
      }
    }
  } catch (error) {
    const errorMsg: string = error.name + error.message;
    ctx.response.status = 300;
    ctx.response.headers = responseHeader;
    ctx.response.body = { error: errorMsg, message: "登陆失败", code: 300 };
  }
});

//获取登陆状态
router.post("/login/status", async (ctx) => {
  try {
    const requestBody: LoginStatus = JSON.parse(await ctx.request.body().value);
    const token: string = requestBody.token;
    const payload = await verify(token, "secret", "HS512");
    // 判断token是否过期
    if (payload.exp) {
      if (payload.exp > getNumericDate(new Date())) {
        ctx.response.status = 200;
        ctx.response.headers = responseHeader;
        ctx.response.body = { code: 200, username: payload.username };
      } else {
        ctx.response.status = 200;
        ctx.response.headers = responseHeader;
        ctx.response.body = { code: 300, errmsg: "登陆状态过期" };
      }
    }
  } catch (error) {
    const errorMsg: string = error.name + error.message;
    ctx.response.status = 300;
    ctx.response.headers = responseHeader;
    ctx.response.body = { code: 300, errmsg: errorMsg };
  }
});

app.use(router.routes());
await app.listen({ port: 8085 });
