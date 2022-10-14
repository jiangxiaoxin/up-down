const Koa = require("koa");
const router = require("koa-router")();
const koaBody = require("koa-body");
const fs = require("fs");
const path = require("path");
const cors = require("koa-cors");
const koaRange = require("koa-range")
const koaStatic = require("koa-static");



const app = new Koa();


app.use(koaRange)

app.use(koaStatic(path.resolve(__dirname, "./public")));

// 将文件上传转到指定地址
app.use(koaBody({ multipart: true, formidable: {
  uploadDir: path.resolve(__dirname, './public/upload'),
  keepExtensions: true
} }));


app.use(cors());

app.use(async (ctx, next) => {
  console.log("url==", ctx.url);
  await next();
});

router.post("/send/formdata", async (ctx) => {
  // console.log(ctx.request)

  console.log(Object.keys(ctx.request))

  console.log("body", ctx.request.body);

  
  /**
   * ctx.body 下是json数据
   * ctx.request.files 是个对象，下面跟着的是文件
   *                   - copy
   *                   - file
   */


  ctx.body = {
    msg: "收到了",
    code: 0
  }
})

router.post("/upload/formdata", async (ctx) => {
  // fs.ReadStream(ctx.request.files.file.filepath).pipe(fs.WriteStream(ctx.request.files.file.originalFilename))
  // 上传时参数的key要是 file, 这里才能 ctx.request.files.file访问

  // console.log(ctx.request.files.file)

  console.log(ctx.request)
  // 如果formdata里，append时，只用了file 1次，那就files.file直接就是文件对象。
  // 如果用了多次，那file就会是个数组，里面时上传的文件
  console.log(ctx.request.files.file)
  console.log(ctx.req.body)
  ctx.body = {
    msg: "上传成功",
    code: 0,
    url: `${ctx.origin}/upload/${ctx.request.files.file.newFilename}`, // 保存到服务器之后会改名
  };
});


router.post("/upload/multi", async (ctx) => {
  console.log(ctx.request.files.file.length)
  ctx.body = {
    msg: "上传成功",
    code: 0,
  };
});



app.use(router.routes());

app.listen(3000, () => {
  console.log("listening 3000");
});
