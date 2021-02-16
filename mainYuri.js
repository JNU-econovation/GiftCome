var http = require("http");
var url = require("url");
var DB = require("./db2");
var template = require("./templateYuri.js");
var dbSQL = require("./dbSQL");
const request = require("request");
const response = require("response");
var qs = require("querystring");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var compression = require("compression");
var helmet = require("helmet");
app.use(helmet());
var session = require("express-session");
var FileStore = require("session-file-store")(session);
var flash = require("connect-flash");
var db = require("./lib/db");
var auth = require("./lib/authSession");
var path = require("path");

app.use(express.static(path.join(__dirname, "public")));
//app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression());
app.use(
  session({
    secret: "asadlfkj!@#!@#dfgasdg",
    resave: false,
    saveUninitialized: true,
    store: new FileStore(),
  })
);

app.use(flash());

var passport = require("./lib/passport")(app);

app.get("*", function (request, response, next) {
  request.list = db.get("topics").value();
  next();
});

var authRouter = require("./login")(passport);
var topicRouter = require("./topicFinal");

app.use("/auth", authRouter);
app.use("/topic", topicRouter);

const option = {
  query: "선물", //검색을 원하는 문자열(필수)
  start: 1, //검색 시작 위치(1~1000)
  display: 40, //검색 결과 출력 건수(10~100)
  sort: "sim", //정렬 유형 (sim:유사도)
};

function page() {
  return new Promise(function (resolve, reject) {
    dbSQL.query(`SELECT * FROM checkbox`, function (error, topics) {
      if (error) {
        throw error;
      }
      dbSQL.query(
        `SELECT age, gender, product FROM checkbox ORDER BY id DESC LIMIT 1`,
        function (error2, checkbox) {
          if (error2) {
            throw error2;
          }

          var search =
            checkbox[0].age + checkbox[0].gender + checkbox[0].product;

          resolve(search);
        }
      );
    });
  });
}

function Option2(search) {
  return new Promise(function (resolve, reject) {
    const option2 = {
      query: search, //검색을 원하는 문자열(필수)
      start: 1, //검색 시작 위치(1~1000)
      display: 20, //검색 결과 출력 건수(10~100)
      sort: "sim", //정렬 유형 (sim:유사도)
    };
    resolve(option2);
  });
}

function create() {
  return new Promise(function (resolve, reject) {
    dbSQL.query(`SELECT * FROM checkbox`, function (error, topics) {
      var create = `
          <form action="/create_process" method="post">
          <div class="check_input">
            <p>상품 종류:<input type="text" name="product" placeholder="상품 종류를 입력하세요"></p>
            <br />
            <p>
            <input type="checkbox" name="age" value='유아' />0~9세
            <input type="checkbox" name="age" value='10대' />10대
            <input type="checkbox" name="age" value='20대' />20대
            <input type="checkbox" name="age" value='30대' />30대
            <input type="checkbox" name="age" value='40대' />40대
            <input type="checkbox" name="age" value='50대' />50대
            <input type="checkbox" name="age" value='60대' />60대
            <input type="checkbox" name="age" value='70대' />70대+
            </p>
            <br />
            <p>
            <input type="checkbox" name="gender" value='여자' />여성
            <input type="checkbox" name="gender" value='남자' />남성
            </p>
            <br />
            <p>희망가격대:<input type="text" name="price1" >원 ~<input type="text" name="price2" >원
            
            </p>
            </div>
            <p>
              <input type="submit" value="확인" class="check_button">
            </p>
          </form>
          `;
      resolve(create);
    });
  });
}
function create_process(request, response) {
  var body = "";
  request.on("data", function (data) {
    body = body + data;
  });
  request.on("end", function () {
    var post = qs.parse(body);
    console.log(post.product);
    dbSQL.query(
      `
            INSERT INTO checkbox (product, age, gender, price1, price2) 
              VALUES(?, ?, ?, ?, ?)`,
      [post.product, post.age, post.gender, post.price1, post.price2],
      function (error, result) {
        if (error) {
          throw error;
        }

        response.writeHead(302, { Location: `/page` });
      }
    );
  });
}

async function order(request, response) {
  try {
    var info = await template.loadProduct(DB, option);
    var lists = await template.createList(info, response);
    var html = await template.HTML(
      lists,
      "인기상품",
      auth.statusUI(request, response)
    );
    return html;
  } catch (err) {
    console.log(err);
  }
}

async function order2(request, response) {
  try {
    var Page = await page();
    var option2 = await Option2(Page);
    var information = await template.loadProduct(DB, option2);
    var lists = await template.createList(information, response);
    var html2 = await template.HTML(
      lists,
      Page,
      auth.statusUI(request, response)
    );
    return html2;
  } catch (err) {
    console.log(err);
  }
}

async function order3(request, response) {
  try {
    var Create = await create();
    var html = await template.HTML(
      Create,
      `검색하기`,
      auth.statusUI(request, response)
    );
    return html;
  } catch (err) {
    console.log(err);
  }
}
async function order4(request, response) {
  try {
    console.log(2);
    var process = await create_process(request, response);
    return process;
  } catch (err) {
    console.log(err);
  }
}

app.post("/myPage/jjim_process", function (req, res) {
  var title = req.body.title;
  var link = req.body.link;
  var image = req.body.image;
  var lprice = req.body.lprice;

  dbSQL.query(
    `
    INSERT INTO giftlist (title, link, image, lprice) 
    VALUES(?, ?, ? ,?)`,
    [title, link, image, lprice],
    function (error, result) {
      if (error) {
        throw error;
      }
      res.redirect(302, "/myPage/gift");
      // res.writeHead(302, { Location: `/page` });
    }
  );
});

app.get("/myPage/gift", async function (request, response) {
  response.send(await orderjjim(request, response));
});

async function orderjjim(request, response) {
  try {
    var infor = await jjimGet();

    var lists = await template.createList(infor, response);
    var html2 = await template.HTML(
      lists,
      ``,
      auth.statusUI(request, response)
    );
    return html2;
  } catch (err) {
    console.log(err);
  }
}

app.get("/m", function (request, response) {
  example();
});

function example() {
  dbSQL.query(`SELECT * FROM giftlist`, function (error, topics) {
    if (error) {
      throw error;
    }
    var info = new Array(6);

    dbSQL.query(`SELECT * FROM giftlist where id >210`, function (
      error2,
      giftlist
    ) {
      if (error2) {
        throw error2;
      }
      for (var i = 0; i < 6; i++) {
        info[i] = [
          giftlist[i].title.replace(/<(\/b|b)([^>]*)>/gi, ""),
          giftlist[i].link,
          giftlist[i].image,
          giftlist[i].lprice,
        ];
        console.log(info[i][0]);
      }
    });
  });
}

function jjimGet() {
  return new Promise(function (resolve, reject) {
    dbSQL.query(`SELECT * FROM giftlist`, function (error, topics) {
      if (error) {
        throw error;
      }
      var info = new Array(10);

      dbSQL.query(`SELECT * FROM giftlist where id >210`, function (
        error2,
        giftlist
      ) {
        if (error2) {
          throw error2;
        }
        console.log(giftlist);
        for (var i = 0; i < 10; i++) {
          info[i] = [
            giftlist[i].title.replace(/<(\/b|b)([^>]*)>/gi, ""),
            giftlist[i].link,
            giftlist[i].image,
            giftlist[i].lprice,
          ];
          console.log(info[i][0]);
        }
        resolve(info);
      });
    });
  });
}

app.listen(3000, () => console.log("Example app listening on port 3000!"));
app.get("/", async function (request, response) {
  response.send(await order(request, response));
});
app.get("/page", async function (request, response) {
  response.send(await order2(request, response));
});
app.get("/create", async function (request, response) {
  response.send(await order3(request, response));
});

app.post("/create_process", function (req, res) {
  var product = req.body.product;
  var age = req.body.age;
  var gender = req.body.gender;
  var price1 = req.body.price1;
  var price2 = req.body.price2;
  dbSQL.query(
    `
        INSERT INTO checkbox (product, age, gender, price1, price2) 
          VALUES(?, ?, ?, ?, ?)`,
    [product, age, gender, price1, price2],
    function (error, result) {
      if (error) {
        throw error;
      }
      res.redirect(302, "/page");
      // res.writeHead(302, { Location: `/page` });
    }
  );
});

app.get("/myPage", function (req, res) {
  dbSQL.query(`SELECT * FROM topic`, function (error, topics) {
    dbSQL.query(`SELECT * FROM author`, function (error2, authors) {
      var html = template.HTML2(
        `<a href="/myPage/gift">내가 찜한 선물들 보러 가기</a>`,
        `<p>
        <나의 WishList>
            ${authorSelect(authors, req, res)}</p>
            <style>
                table{
                    border-collapse: collapse;
                }
                td{
                    border:1px solid black;
                }
            </style>
            <form action="/myPage/create_process" method="post">
         
               
            <p>본인이 갖고 싶은 선물을 입력하세요.</p>
            <br />
            <p>
                <textarea name="profile" placeholder="description"></textarea>
            </p>
            <p>
                <input type="submit"  value="확인">
            </p>
        </form>
            <br />
            <br />
            <a href="/myPage/friend">친구들의 WishList 보러가기</a>
            `,
        auth.statusUI(req, res)
      );

      res.send(html);
    });
  });
});

app.get("/myPage/create", function (req, res) {
  dbSQL.query(`SELECT * FROM topic`, function (error, topics) {
    dbSQL.query(`SELECT * FROM author`, function (error2, authors) {
      var html = template.HTML2(
        ``,
        `
            <form action="/myPage/create_process" method="post">
         
               
                <p>본인이 갖고 싶은 선물을 입력하세요.</p>
                <br />
                <p>
                    <textarea name="profile" placeholder="description"></textarea>
                </p>
                <p>
                    <input type="submit"  value="확인">
                </p>
            </form>
            `,
        auth.statusUI(req, res)
      );
      res.send(html);
    });
  });
});

app.post("/myPage/create_process", function (req, res) {
  var product = req.body.profile;

  dbSQL.query(
    `
        INSERT INTO author (name,profile) 
          VALUES(?, ?)`,
    [auth.nickname(req, res), product],
    function (error, result) {
      if (error) {
        throw error;
      }
      res.redirect(302, "/myPage");
      // res.writeHead(302, { Location: `/page` });
    }
  );
});

app.get("/myPage/friend", function (req, res) {
  dbSQL.query(`SELECT * FROM topic`, function (error, topics) {
    dbSQL.query(`SELECT * FROM author`, function (error2, authors) {
      var html = template.HTML2(
        ``,
        `<p>
        WishList Board
        ${authorTable(authors)}</p>
            <style>
                table{
                    border-collapse: collapse;
                }
                td{
                    border:1px solid black;
                }
            </style>
            
            `,
        auth.statusUI(req, res)
      );

      res.send(html);
    });
  });
});
app.post("/myPage/delete_process", function (req, res) {
  var product = req.body;

  dbSQL.query(
    `
                  DELETE FROM author WHERE id=?`,
    [product.id],
    function (error2, result2) {
      if (error2) {
        throw error2;
      }
      res.redirect(302, "/myPage");
      // res.writeHead(302, { Location: `/page` });
    }
  );
});

function authorSelect(authors, req, res) {
  var tag = "<table>";
  var i = 0;
  while (i < authors.length) {
    if (authors[i].name === auth.nickname(req, res)) {
      tag += `
      <tr>
          <td>${authors[i].name}</td>
          <td>${authors[i].profile}</td>
          <td>
          <form action="/myPage/delete_process" method="post">
          <input type="hidden" name="id" value="${authors[i].id}">
          <input type="submit" value="delete">
          </form>
          </td>
      </tr>
      `;
    }
    i++;
  }
  tag += "</table>";
  return tag;
}

function authorTable(authors) {
  var tag = "<table>";
  var i = 0;
  while (i < authors.length) {
    tag += `
            <tr>
                <td>${authors[i].name}</td>
                <td>${authors[i].profile}</td>
               
            </tr>
            `;
    i++;
  }
  tag += "</table>";
  return tag;
}

/*var apps = http.createServer(async function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if (pathname === "/") {
    if (queryData.id === undefined) {
      response.writeHead(200);
      response.send(await order());
    } else {
      response.writeHead(200);
      response.end(await order2());
    }
  } else if (pathname === "/create") {
    response.writeHead(200);
    response.end(await order3());
  } else if (pathname === "/create_process") {
    await order4(request, response);
    response.end();
  } else if (pathname === "/auth/login") {
    await authRouter.login(request, response);
  }
});*/
