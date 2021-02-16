const fetch = require("node-fetch");
const withQuery = require("with-query").default;
var auth = require("./lib/authSession");
var dbSQL = require("./dbSQL");
var qs = require("querystring");
var url = require("url");
const request = require("request");
const response = require("response");
var path = require("path");
var express = require("express");
var app = express();
app.use(express.static(path.join(__dirname, "public")));

exports.loadProduct = function (DB, option) {
  return new Promise((resolve, reject) => {
    fetch(withQuery("https://openapi.naver.com/v1/search/shop", option), {
      method: "GET",
      headers: {
        "X-Naver-Client-Id": DB.NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": DB.NAVER_CLIENT_SECRET,
      },
    })
      .then((res) =>
        res.json().then((json) => {
          var info = new Array(option.display);
          for (var i = 0; i < info.length; i++) {
            info[i] = [
              json.items[i].title.replace(/<(\/b|b)([^>]*)>/gi, ""),
              json.items[i].link,
              json.items[i].image,
              json.items[i].lprice,
            ];
          }
          resolve(info);
        })
      )
      .catch((err) => console.error(err));
  });
};

exports.createList = function (info) {
  return new Promise((resolve, reject) => {
    var list = ``;
    var i = 0;
    while (i < info.length) {
      list =
        list +
        `
        <div class="item">
          <div class="thumbnail">
            <a href="${info[i][1]}"><img src="${
          info[i][2]
        }" style="width:167px; height:167px;" title="클릭하면 구매 링크로 넘어갑니다."/></a>
          </div>
          <div class="description">
            <p><a href="${info[i][1]}">${info[i][0]}</a></p>
            <br>
            <strong>${Number(info[i][3]).toLocaleString("en")}원</strong>
            <form action="/myPage/jjim_process" method="post">
            <input type="hidden" name="title" value="${info[i][0]}">
            <input type="hidden" name="link" value="${info[i][1]}">
            <input type="hidden" name="image" value="${info[i][2]}">
            <input type="hidden" name="lprice" value="${info[i][3]}">
            <input type="submit" value="찜하기" title="클릭하면 찜한 상품들 페이지로 넘어갑니다." class="jjim">
            </form>
          </div>
        </div>
        `;
      if (i != 0 && i % 5 === 4) {
        list = list + `<hr>`;
      }
      i = i + 1;
    }
    resolve(list);
  });
};

//첫 페이지 + 팝업창
exports.HTML_popup = function (productList, search, authStatusUI = "") {
  return new Promise(function (resolve, reject) {
    var html = `<!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8" />
            <title>GiftCome - 선물 추천 웹사이트</title>
            <link rel='stylesheet' href='/style.css' />
            <script>
              window.open("./popup.html", "졸업식 선물 추천", "width=370, height=330, left=20, top=50"); 
            </script>
        </head>
        <body>
          <header id="main_header">
            <div id="title">
              <h1><a href="/"><img src="/logo.png" alt="GiftCome"></a></h1>
            </div>
            <nav id="main_gnb">
              <ul>
                <li><a href="/myPage">마이페이지</a></li>
                <li><a href="/topic/list">게시판</a></li>
                <li><a href="/auth/login">로그인</a></li>
                ${authStatusUI}
              </ul> 
            </nav>
            <nav id="main_selectOption">
              <ul>
                <li><a href="/create">선물하기</a></li>
              </ul>
            </nav>
          </header>
          <div id ="content">
            <br>
            <p>${search}</p>
            <hr></hr>
            <br>
            <section id="main_section">
              ${productList}
            </section>
          </div>
          <div id="paging">
            <p><a href="/">1</a></p>
            <p><a href="/2">2</a></p>
            <p><a href="/3">3</a></p>
            <p><a href="/4">4</a></p>
            <p><a href="/5">5</a></p>
          </div>
          <footer class="main_footer">
            <h3>GiftCome</h3>
            <address>선물 추천 웹사이트</address>
          </footer>
        </body>
    </html>
    `;
    //gnb(global navigation bar)
    resolve(html);
  });
};
//팝업창 없음+메인페이지
exports.HTML = function (productList, search, authStatusUI = "") {
  return new Promise(function (resolve, reject) {
    var html = `<!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8" />
            <title>GiftCome - 선물 추천 웹사이트</title>
            <link rel='stylesheet' href='/style.css' />
        </head>
        <body>
          <header id="main_header">
            <div id="title">
              <h1><a href="/"><img src="/logo.png" alt="GiftCome"></a></h1>
            </div>
            <nav id="main_gnb">
              <ul>
                <li><a href="/myPage">마이페이지</a></li>
                <li><a href="/topic/list">게시판</a></li>
                <li><a href="/auth/login">로그인</a></li>
                ${authStatusUI}
              </ul>
            </nav>
            <nav id="main_selectOption">
              <ul>
                <li><a href="/create">선물하기</a></li>
              </ul>
            </nav>
          </header>
          <div id ="content">
            <br>
            <p>${search}</p>
            <hr></hr>
            <br>
            <section id="main_section">
              ${productList}
            </section>
          </div>
          <div id="paging">
            <p><a href="/">1</a></p>
            <p><a href="/2">2</a></p>
            <p><a href="/3">3</a></p>
            <p><a href="/4">4</a></p>
            <p><a href="/5">5</a></p>
          </div>
          <footer class="main_footer">
            <h3>GiftCome</h3>
            <address>선물 추천 웹사이트</address>
          </footer>
        </body>
    </html>
    `;
    //gnb(global navigation bar)
    resolve(html);
  });
};
//팝업창 없음+옵션 선택 결과 페이지
exports.HTML_option = function (productList, search, authStatusUI = "") {
  return new Promise(function (resolve, reject) {
    var html = `<!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8" />
            <title>GiftCome - 선물 추천 웹사이트</title>
            <link rel='stylesheet' href='/style.css' />
        </head>
        <body>
          <header id="main_header">
            <div id="title">
              <h1><a href="/"><img src="/logo.png" alt="GiftCome"></a></h1>
            </div>
            <nav id="main_gnb">
              <ul>
                <li><a href="/myPage">마이페이지</a></li>
                <li><a href="/topic/list">게시판</a></li>
                <li><a href="/auth/login">로그인</a></li>
                ${authStatusUI}
              </ul>
            </nav>
            <nav id="main_selectOption">
              <ul>
                <li><a href="/create">선물하기</a></li>
              </ul>
            </nav>
          </header>
          <div id ="content">
            <br>
            <p>${search}</p>
            <hr></hr>
            <br>
            <section id="main_section">
              ${productList}
            </section>
          </div>
          <div id="paging">
            <p><a href="/page">1</a></p>
            <p><a href="/page/2">2</a></p>
            <p><a href="/page/3">3</a></p>
            <p><a href="/page/4">4</a></p>
            <p><a href="/page/5">5</a></p>
          </div>
          <footer class="main_footer">
            <h3>GiftCome</h3>
            <address>선물 추천 웹사이트</address>
          </footer>
        </body>
    </html>
    `;
    //gnb(global navigation bar)
    resolve(html);
  });
};
//페이징 없음
exports.HTML_nopaging = function (productList, search, authStatusUI = "") {
  return new Promise(function (resolve, reject) {
    var html = `<!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8" />
            <title>GiftCome - 선물 추천 웹사이트</title>
            <link rel='stylesheet' href='/style.css' />
        </head>
        <body>
          <header id="main_header">
            <div id="title">
              <h1><a href="/"><img src="/logo.png" alt="GiftCome"></a></h1>
            </div>
            <nav id="main_gnb">
              <ul>
                <li><a href="/myPage">마이페이지</a></li>
                <li><a href="/topic/list">게시판</a></li>
                <li><a href="/auth/login">로그인</a></li>
                ${authStatusUI}          
              </ul>
            </nav>
            <nav id="main_selectOption">
              <ul>
                <li><a href="/create">선물하기</a></li>
              </ul>
            </nav>
          </header>
          <div id ="content">
            <br>
            <p>${search}</p>
            <hr></hr>
            <br>
            <section id="main_section">
              ${productList}
            </section>
          </div>
          <footer class="main_footer">
            <h3>GiftCome</h3>
            <address>선물 추천 웹사이트</address>
          </footer>
        </body>
    </html>
    `;
    //gnb(global navigation bar)
    resolve(html);
  });
};

//마이페이지(/myPage), 내 위시리스트(/myPage/create),
//옵션 선택 창(/create), 친구 위시리스트(/myPage/friend),
//게시판 메인(/list), 게시판 글쓰기(/create),
//게시글 수정(/update/:pageId)
exports.HTML2 = function (menuName, content, authStatusUI = "") {
  var html = `<!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8" />
            <title>GiftCome - 선물 추천 웹사이트</title>
            <link rel='stylesheet' href='/style.css' />
        </head>
        <body>
          <header id="main_header">
            <div id="title">
              <h1><a href="/"><img src="/logo.png" alt="GiftCome"></a></h1>
            </div>
            <nav id="main_gnb">
              <ul>
                <li><a href="/myPage">마이페이지</a></li>
                <li><a href="/topic/list">게시판</a></li>
                <li><a href="/auth/login">로그인</a></li>
                ${authStatusUI}
              </ul>
            </nav>
            <nav id="main_selectOption">
              <ul>
                <li><a href="/create">선물하기</a></li>
              </ul>
            </nav>
          </header>
          <div id ="content">
            <br>
            <li>${menuName}</li>
            <hr></hr>
            ${content}
            <hr></hr>
          </div>
          <footer class="main_footer">
            <h3>GiftCome</h3>
            <address>선물 추천 웹사이트</address>
          </footer>
        </body>
    </html>
    `;
  //gnb(global navigation bar)
  return html;
};

exports.list = function (filelist) {
  var list = "<table class=board>";
  var i = 0;
  while (i < filelist.length) {
    list =
      list +
      `<tr>
        <td><a href="/topic/${filelist[i].id}">${filelist[i].title}</a></td>
      </tr>`;
    i = i + 1;
  }
  list = list + "</table>";
  return list;
};
