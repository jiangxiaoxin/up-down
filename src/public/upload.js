$("#btn1").click(function() {
  let input = $("#input1")
  let file = input[0].files[0]
  

  let xhr = new XMLHttpRequest()

  

  xhr.open("post", "http://localhost:3000/send/formdata", true)

  // 必须open之后才能设置。

  xhr.addEventListener("error", (e) => {
    console.log('err', e);
  })

  xhr.addEventListener("load", (e) => {
    console.log("load", e);
  })

  xhr.upload.addEventListener("progress", (e) => {
    console.log("progress", e);
  })

// koa-body 会自动解出来，哪些是数据，哪些是文件
// 里面通过 formidable 能解出来哪些是数据，哪些是文件

  let data = new FormData()
  data.append("name", "helloca")
  data.append("age", 18)
  data.append("file", file)

  data.append("copy", file)

  xhr.send(data)



  // xhr.send(file) //  File本身就是个Blob，可以直接发
})


$("#btn2").click(function() {
  let input = $("#input2")
  let file = input[0].files[0]

  console.log(file);
  

  let xhr = new XMLHttpRequest()

  xhr.open("POST", "http://localhost:3000/upload/formdata")

  xhr.addEventListener("error", (e) => {
    console.log('err', e);
  })

  xhr.addEventListener("load", (e) => {
    console.log("load", e);
    alert("上传成功")
  })

  xhr.upload.addEventListener("progress", (e) => {
    console.log("progress", e);
  })

  let data = new FormData()
  data.append("file", file)

  xhr.send(data)
})



$("#btn3").click(function() {
  let input = $("#input3")
  let files = input[0].files

  console.log(files);

  let formdata = new FormData()

  for(let i=0;i<files.length;i++) {
    formdata.append("file", files[i], files[i].name)
  }

  let xhr = new XMLHttpRequest()

  xhr.open("POST", '/upload/multi', true)

  xhr.addEventListener("load", (e) => {
    console.log("load", e);
  })

  xhr.addEventListener("error", (e) => {
    console.log("error", e);
  })

  xhr.upload.addEventListener("progress", (e) => {
    console.log("progress", e);
  })

  xhr.send(formdata)


})