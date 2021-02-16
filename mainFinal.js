var http = require("http");
var url = require("url");
var DB = require("./db2");
var template = require("./templateFinal.js");
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

app.use(express.static("public"));
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

function Option2(search, n) {
  return new Promise(function (resolve, reject) {
    const option2 = {
      query: search, //검색을 원하는 문자열(필수)
      start: n, //검색 시작 위치(1~1000)
      display: 40, //검색 결과 출력 건수(10~100)
      sort: "sim", //정렬 유형 (sim:유사도)
    };
    resolve(option2);
  });
}

//검색 시작 위치를 인자로 임의 설정 가능
function Option3(startPoint) {
  return new Promise(function (resolve, reject) {
    const option3 = {
      query: "선물", //검색을 원하는 문자열(필수)
      start: startPoint, //검색 시작 위치(1~1000)
      display: 40, //검색 결과 출력 건수(10~100)
      sort: "sim", //정렬 유형 (sim:유사도)
    };
    resolve(option3);
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

//메인 페이지(첫 페이지)
async function order(request, response) {
  try {
    var info = await template.loadProduct(DB, option);
    var lists = await template.createList(info, response);
    var html = await template.HTML_popup(
      lists,
      "인기상품",

      auth.statusUI(request, response)
    );
    return html;
  } catch (err) {
    console.log(err);
  }
}

//메인 페이지(첫 페이지 이후의 페이지들)
async function order1(n, request, response) {
  try {
    var option1 = await Option3(n);
    var info = await template.loadProduct(DB, option1);
    var lists = await template.createList(info);
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

async function order2(n, request, response) {
  try {
    var Page = await page();
    var option2 = await Option2(Page, n);
    var information = await template.loadProduct(DB, option2);
    var lists = await template.createList(information, response);
    var html2 = await template.HTML_option(
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
    var html = await template.HTML2(
      "검색하기",
      Create,
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
    `INSERT INTO giftlist(title, link, image,lprice) VALUES(?,?,?,?)`,
    [title, link, image, lprice],
    function (error, result) {
      if (error) {
        throw error;
      }
      res.redirect(302, "/myPage/gift");
    }
  );
});

app.get("/myPage/gift", async function (request, response) {
  response.send(await orderjjim(request, response));
});
async function orderjjim(request, response) {
  try {
    var jjimm = await jjimGet();
    var lists = await template.createList(jjimm, response);
    var html2 = await template.HTML_nopaging(
      lists,
      `찜하기`,
      auth.statusUI(request, response)
    );
    return html2;
  } catch (err) {
    console.log(err);
  }
}

function jjimGet() {
  return new Promise(function (resolve, reject) {
    dbSQL.query(`SELECT * FROM giftlist`, function (error, topics) {
      if (error) {
        throw error;
      }
      var info = new Array(3);

      dbSQL.query(`SELECT * FROM giftlist where id >228`, function (
        error2,
        giftlist
      ) {
        if (error2) {
          throw error2;
        }
        console.log(giftlist);
        for (var i = 0; i < 3; i++) {
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

//메인 페이지 - 1~40번 /null, 41~80번 /2, 81~120번 /3, 121~160번 /4, 161~200번 /5
//null은 order(), 나머지 추가 페이지는 order1()을 따른다
app.listen(3000, () => console.log("Example app listening on port 3000!"));
app.get("/", async function (request, response) {
  response.send(await order(request, response));
});
app.get("/2", async function (request, response) {
  response.send(await order1(41, request, response));
});
app.get("/3", async function (request, response) {
  response.send(await order1(81, request, response));
});
app.get("/4", async function (request, response) {
  response.send(await order1(121, request, response));
});
app.get("/5", async function (request, response) {
  response.send(await order1(161, request, response));
});

app.get("/page", async function (request, response) {
  response.send(await order2(1, request, response));
});
app.get("/page/2", async function (request, response) {
  response.send(await order2(41, request, response));
});
app.get("/page/3", async function (request, response) {
  response.send(await order2(81, request, response));
});
app.get("/page/4", async function (request, response) {
  response.send(await order2(121, request, response));
});
app.get("/page/5", async function (request, response) {
  response.send(await order2(161, request, response));
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
    }
  );
});

app.get("/myPage", function (req, res) {
  dbSQL.query(`SELECT * FROM topic`, function (error, topics) {
    dbSQL.query(`SELECT * FROM author`, function (error2, authors) {
      var html = template.HTML2(
        `마이페이지`,
        `
        <div id="mypage">
          <div><a href="/myPage/gift">내가 찜한 선물<br>보러가기</a></div>
          <div><a href="/myPage/create">나의 WishList<br>작성하기</a></div>
          <div><a href="/myPage/friend">친구들의 WishList<br>보러가기</a></div>
        </div>
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
        `WistList 추가`,
        `
        <div id="manageWish">
          <div id="wishList">
              <p>나의 WishList</p>
              ${authorSelect(authors, req, res)}
          </div>
          <div id="addWish">
            <p id="askWish">자신이 갖고 싶은 선물을 입력하세요.</p>
            <form action="/myPage/create_process" method="post">
              <p>
                  <textarea name="profile" placeholder="description" id="insertWish"></textarea>
              </p>
              <p>
                  <input type="submit" id="submitWish" value="확인">
              </p>
            </form>
          </div>
        </div>  
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
      res.redirect(302, "/myPage/create");
    }
  );
});

app.get("/myPage/friend", function (req, res) {
  dbSQL.query(`SELECT * FROM topic`, function (error, topics) {
    dbSQL.query(`SELECT * FROM author`, function (error2, authors) {
      var html = template.HTML2(
        `WishList Board`,
        `${authorTable(authors)}`,
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
    }
  );
});
function authorSelect(authors, req, res) {
  var tag = "<table class=authorSelect>";
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
  var tag = "<table class=authorTable>";
  var i = 0;
  while (i < authors.length) {
    tag += `
            <tr>
                <td id="friendName">${authors[i].name}</td>
                <td id="friendWish">${authors[i].profile}</td>
            </tr>
            `;
    i++;
  }
  tag += "</table>";
  return tag;
}

async function popupList(keyword) {
  try {
    var option2 = await Option2(keyword);
    var information = await template.loadProduct(DB, option2);
    var lists = await template.createList(information);
    var html2 = await template.HTML_nopaging(lists, "인기상품");
    return html2;
  } catch (err) {
    console.log(err);
  }
}
app.get("/pop/1", async function (request, response) {
  response.send(await popupList("향수"));
});
app.get("/pop/2", async function (request, response) {
  response.send(await popupList("쥬얼리"));
});
app.get("/pop/3", async function (request, response) {
  response.send(await popupList("서류가방"));
});
app.get("/pop/4", async function (request, response) {
  response.send(await popupList("핸드백"));
});
app.get("/pop/5", async function (request, response) {
  response.send(await popupList("텀블러"));
});
app.get("/pop/6", async function (request, response) {
  response.send(await popupList("벨트"));
});
app.get("/pop/7", async function (request, response) {
  response.send(await popupList("구두"));
});
app.get("/pop/8", async function (request, response) {
  response.send(await popupList("손목시계"));
});
app.get("/pop/9", async function (request, response) {
  response.send(await popupList("꽃다발"));
});
