let ChunkSize = 1024 * 1024 * 6; // 每次下载2m
let ChunkLimit = 3; // 同时最多下载3段

let VIDEO = "video/mp4";
let JPG = "image/jpeg";
let PNG = "image/png";

let o1 = {
  url: "http://127.0.0.1:3000/download/alps.jpg", // 3.x mb
  type: JPG,
  name: "alps.jpg",
};

let o2 = {
  url: "http://127.0.0.1:3000/download/a.mp4", // 通过 koa-range支持range操作
  // url: 'https://vodm0pihssv.vod.126.net/edu-video/nos/mp4/2017/10/10/1007299069_2cddd54a92e344639ad9669a2e0109ed_sd.mp4', // 这个链接支持range，可以分片下载
  type: VIDEO,
  name: "aaa.mp4",
};

$("#download1").click(function () {
  downloadFile(o1);
});

$("#download2").click(function () {
  downloadFile(o2);
});

// $("#download3").click(function() {
//   window.open(o2.url)
// })

function downloadFile(file) {
  let xhr = new XMLHttpRequest();

  xhr.open("HEAD", file.url, true);

  xhr.addEventListener("error", (e) => {
    console.log("err", e);
  });

  xhr.addEventListener("load", (e) => {
    // console.log("load", e.target);

    let size = e.target.getResponseHeader("Content-length");
    console.log("文件大小：", size);

    let count = Math.ceil(size / ChunkSize);

    console.log("切片数量：", count);

    let chunks = [];

    for (let i = 0; i < count; i++) {
      let start = i * ChunkSize;
      let end = Math.min(start + ChunkSize - 1, size - 1);
      // 每个段是1000，则第1段应该是0-999，end应该是start+1000-1才对.
      chunks.push({
        start,
        end,
        index: i,
        status: "",
        data: null,
        length: end - start + 1,
      });
    }

    console.log('---chunks', chunks);

    if (count <= ChunkLimit) {
      // 需要分的片还没到并行的上限，可以直接一起下载
      downloadDirect(chunks, file);
    } else {
      downloadAsync(chunks, file);
    }
  });

  xhr.send(null);
}

let xhrPromises = [];
const downloadAsync = (chunks, file) => {
  for (let i = 0; i < ChunkLimit; i++) {
    let chunk = chunks[i];
    downloadChunk(chunk, file, chunks);
  }
};

const checkContinue = (chunks, file) => {
  let target = chunks.find((item) => item.status == "");
  if (target) {
    // 找一个还没有下载的
    console.log("--还有没下载完的，继续下载");
    downloadChunk(target, file, chunks);
  } else {
    let undone = chunks.find((item) => item.status != "done");
    if (!undone) {
      console.log("---都下载完了，去合并");
      concatBuffers(chunks, file);
    }
  }
};

const downloadChunk = (chunk, file, chunks) => {
  let xhr = new XMLHttpRequest();

  xhr.open("GET", file.url, true);
  xhr.setRequestHeader("range", `bytes=${chunk.start}-${chunk.end}`);
  chunk.status = "uploading";
  xhr.responseType = "blob";
  xhr.addEventListener("load", (e) => {
    xhr.response.arrayBuffer().then((res) => {
      chunk.status = "done";
      chunk.data = res; // res = array buffer
      console.log('--chunk done', res.byteLength)
      checkContinue(chunks, file);
    });
  });

  xhr.send(null);
};

const downloadDirect = (chunks, file) => {
  let promises = [];
  let count = chunks.length;
  for (let i = 0; i < count; i++) {
    let promise = new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      let chunk = chunks[i];

      xhr.open("GET", file.url, true);
      xhr.setRequestHeader("range", `bytes=${chunk.start}-${chunk.end}`);
      chunk.status = "uploading";
      xhr.responseType = "blob";
      xhr.addEventListener("load", (e) => {
        // code 必须是206，particial content，才代表只下载了部分数据
        xhr.response.arrayBuffer().then((res) => {
          chunk.status = "done";
          chunk.data = res; // res = array buffer
          resolve && resolve(chunk);
        });
      });

      xhr.send(null);
    });

    promises.push(promise);
  }

  Promise.all(promises).then((res) => {
    console.log("done", res);
    concatBuffers(res, file);
  });
};

// 合并最后的buffer
function concatBuffers(chunks, file) {
  let _uints = chunks
    .sort((a, b) => {
      return a.index - b.index;
    })
    .map((item) => new Uint8Array(item.data));

  let count = _uints.length;
  let totalLength = 0;
  for (let i = 0; i < count; i++) {
    totalLength += _uints[i].length;
  }

  console.log("--totalLength", totalLength);

  let result = new Uint8Array(totalLength);

  let offset = 0;
  for (let i = 0; i < count; i++) {
    let uint = _uints[i];
    result.set(uint, offset);
    offset += uint.length;
  }

  // uint8 就是将所有的数据合并之后得到的最终文件的buffer视图

  // type 可以描述以什么格式使用这些二进制数据
  // 如果不填，windows 默认会以 txt来存。但可以在保存的时候自己写[名称+后缀]，保存后同样可以查看文件

  let blob = new Blob([result], { type: file.type });

  saveBlob(blob, file.name);
}

function saveBlob(blob, name) {
  console.log("--保存的name", name);

  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");

  a.download = name;
  a.href = url;
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

// let p1 = new Promise((resolve, reject) => {
//   setTimeout(() => {
//     resolve(1)
//   }, 1000);
// })

// let p2 = new Promise((resolve, reject) => {
//   setTimeout(() => {
//     resolve(2)
//   }, 2000);
// })
//
//
//
// let ps = [p1, p2]
//
// Promise.race(ps).then(res => {
//   console.log("race", res);
// })
//
// Promise.all(ps).then(res => {
//   console.log("all", res)
// })
