const fetch = require("node-fetch");
const withQuery = require("with-query").default;
var auth = require("./lib/authSession");
var dbSQL = require("./dbSQL");
var qs = require("querystring");
var url = require("url");
const request = require("request");
const response = require("response");

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

exports.createList = function (info, response) {
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
        }" style="width:167px; height:167px;"/></a>
          </div>
          <div class="description">
            <p><a href="${info[i][1]}">${info[i][0]}</a></p>
            <br>
            <strong>${Number(info[i][3]).toLocaleString("en")}원 </strong> 
            <form action="/myPage/jjim_process" method="post">
            <input type="hidden" name="title" value="${info[i][0]}">
            <input type="hidden" name="link" value="${info[i][1]}">
            <input type="hidden" name="image" value="${info[i][2]}">
            <input type="hidden" name="lprice" value="${info[i][3]}">
            <input type="submit" value="찜하기" class="jjim">
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

exports.HTML = function (productList, search, authStatusUI = ``) {
  return new Promise(function (resolve, reject) {
    var html = `<!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8" />
            <title>GiftCome - 선물 추천 웹사이트</title>
            <style>
              * {
                margin: 0;
                padding: 0;
              }
              body {
                font-family: "나눔스퀘어OTF_ac", sans-serif;
              }
              li {
                list-style: none;
              }
              a {
                color: black;
                text-decoration: none;
              }
              img {
                border: 0;
              }
              #main_header {
                width: 960px;
                margin: 0 auto;
                height: 300px;
                position: relative;
              }
              #main_header > #title {
                position: absolute;
                left: 410px;
                top: 100px;
              }
              #main_header > #main_gnb {
                position: absolute;
                right: 0;
                top: 0;
              }
              #main_header > #main_selectOption {
                position: absolute;
                top: 200px;
                left: 0;
                bottom: 10px;
              }
              #content > hr {
                border-color:#D6AF7C;
              }
              #title {
              }
              #main_gnb > ul {
                overflow: hidden;
              }
              #main_gnb > ul > li {
                float: left;
              }
              #main_gnb > ul > li > a {
                display: block;
                padding: 2px 10px;
                border: 1px solid #D6AF7C;
              }
              #main_gnb > ul > li > a:hover {
                background: #D6AF7C;
                color: white;
              }
              #main_gnb > ul > li:first-child > a {
                border-radius: 10px 0 0 10px;
              }
              #main_gnb > ul > li:last-child > a {
                border-radius: 0 10px 10px 0;
              }
              #main_selectOption > ul {
                overflow: hidden;
              }
              #main_selectOption > ul > li {
                float: left;
              }
              #main_selectOption > ul > li > a {
                display: block;
                padding: 30px 440px 30px 440px;
                border: 1px solid #D6AF7C;
                border-radius: 10px;
                font-size: 20px;
              }
              #main_selectOption > ul > li > a:hover {
                background: #D6AF7C;
                color: white;
              }
              #content {
                width: 960px;
                margin: 0 auto;
                overflow: hidden;
              }
              #content > p {
                font-size: 20px;
                padding-bottom: 10px;
              }
              #main_section > article.main_article {
                margin-bottom: 10px;
                padding: 20px;
                border: 1px solid black;
              }
              section.buttons {
                overflow: hidden;
              }
              .item {
                display: inline-block;
                overflow: hidden;
                padding: 10px;
                border-top: none;
                width: 167px;
                height: 400px;
              }
              .thumbnail {
                float: left;
              }
              .description {
                float: left;
                margin: 5px;
              }
              .description > p {
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2; 
                -webkit-box-orient: vertical;
              }
              .description > strong {
                display: block;
                width: 120px;
                white-space: nowrap;
                overflow: hidden;
                
              }
              #main_footer {
                width: 960px;
                margin: 0 auto;
                margin-bottom: 10px;
                box-sizing: border-box;
                padding: 10px;
                border: 1px solid black;
                text-align: center;
              }
              .jjim{

                position: absolute;
                float: left;
                text-align: center;
                font-family: "나눔스퀘어OTF_ac", sans-serif;
                display: inline-block;
                margin: 1px;
                text-decoration: none;
                border: 1.5px solid #D6AF7C;
                border-radius: 4px;
                padding: 2px 2px;
                color: #D6AF7C;
                width: 50px;
                height: 30px;

              }
              
               .jjim:hover {
                background: #D6AF7C;
                color: white;
              }
              .check_button{
                position: absolute;
                display: inline-block;
              
                text-align: center;
                font-family: "나눔스퀘어OTF_ac", sans-serif;
               float:left;
                margin: 10px;
                text-decoration: none;
                border: 1.5px solid #D6AF7C;
                border-radius: 4px;
                padding: 2px 2px;
                color: #D6AF7C;
                width: 50px;
                height: 30px;
              }
              .check_button:hover {
                background: #D6AF7C;
                color: white;
              }
              .check_input{
                display: inline-block;
                padding: 10px 10px 10px 10px;
              }
            </style>
        </head>
        <body>
          <a href="javascript:popupOpen()">팝업</a>
          <header id="main_header">
            <div id="title">
              <h1><a href="/">GiftCome</a></h1>
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
            <h2>${search}</h2>
            <br>
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
exports.HTML2 = function (productList, search, authStatusUI = ``) {
  var html = `<!DOCTYPE html>
    <html lang="ko">
        <head>
            <meta charset="utf-8" />
            <title>GiftCome - 선물 추천 웹사이트</title>
            <style>
              * {
                margin: 0;
                padding: 0;
              }
              body {
                font-family: "나눔스퀘어OTF_ac", sans-serif;
              }
              li {
                list-style: none;
              }
              a {
                color: black;
                text-decoration: none;
              }
              img {
                border: 0;
              }
              #main_header {
                width: 960px;
                margin: 0 auto;
                height: 300px;
                position: relative;
              }
              #main_header > #title {
                position: absolute;
                left: 410px;
                top: 100px;
              }
              #main_header > #main_gnb {
                position: absolute;
                right: 0;
                top: 0;
              }
              #main_header > #main_selectOption {
                position: absolute;
                top: 200px;
                left: 0;
                bottom: 10px;
              }
              #content > hr {
                border-color:#D6AF7C;
              }
              #title {
              }
              #main_gnb > ul {
                overflow: hidden;
              }
              #main_gnb > ul > li {
                float: left;
              }
              #main_gnb > ul > li > a {
                display: block;
                padding: 2px 10px;
                border: 1px solid #D6AF7C;
              }
              #main_gnb > ul > li > a:hover {
                background: #D6AF7C;
                color: white;
              }
              #main_gnb > ul > li:first-child > a {
                border-radius: 10px 0 0 10px;
              }
              #main_gnb > ul > li:last-child > a {
                border-radius: 0 10px 10px 0;
              }
              #main_selectOption > ul {
                overflow: hidden;
              }
              #main_selectOption > ul > li {
                float: left;
              }
              #main_selectOption > ul > li > a {
                display: block;
                padding: 30px 440px 30px 440px;
                border: 1px solid #D6AF7C;
                border-radius: 10px;
                font-size: 20px;
              }
              #main_selectOption > ul > li > a:hover {
                background: #D6AF7C;
                color: white;
              }
              #content {
                width: 960px;
                margin: 0 auto;
                overflow: hidden;
              }
              #content > p {
                font-size: 20px;
                padding-bottom: 10px;
              }
              #main_section > article.main_article {
                margin-bottom: 10px;
                padding: 20px;
                border: 1px solid black;
              }
              section.buttons {
                overflow: hidden;
              }
              .item {
                display: inline-block;
                overflow: hidden;
                padding: 10px;
                border-top: none;
                width: 167px;
                height: 400px;
              }
              .thumbnail {
                float: left;
              }
              .description {
                float: left;
                margin: 5px;
              }
              .description > p {
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2; 
                -webkit-box-orient: vertical;
              }
              .description > strong {
                display: block;
                width: 120px;
                white-space: nowrap;
                overflow: hidden;
                
              }
              #main_footer {
                width: 960px;
                margin: 0 auto;
                margin-bottom: 10px;
                box-sizing: border-box;
                padding: 10px;
                border: 1px solid black;
                text-align: center;
              }
  
              .login{
                display: inline-block;
                padding: 10px 440px 10px 440px;
              }
              .login_input{
                float: left;
                padding: 20px 10px 10px 370px;
              }
              .login_button{
                float: left;
                padding: 10px 0px 10px 10px;
              }
              .register_input{
                display: inline-block;
                padding: 10px 440px 10px 400px;
              }
              .register_button{
                display: inline-block;
                padding: 10px 440px 10px 440px;
              }
              .button {
                position: absolute;
                float: left;
                text-align: center;
                font-family: "나눔스퀘어OTF_ac", sans-serif;
                display: inline-block;
                margin: 1px;
                text-decoration: none;
                border: 1.5px solid #D6AF7C;
                border-radius: 4px;
                padding: 3px 3px;
                color: #D6AF7C;
                width: 60px;
                height: 30px;

              }
              
               .button:hover {
                background: #D6AF7C;
                color: white;
              }
              
            </style>
        </head>
        <body>
          <a href="javascript:popupOpen()">팝업</a>
          <header id="main_header">
            <div id="title">
              <h1><a href="/">GiftCome</a></h1>
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
            <h2>${search}</h2>
            <br>
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
  return html;
};

exports.list = function (filelist) {
  var list = "<ul>";
  var i = 0;
  while (i < filelist.length) {
    list =
      list +
      `<li><a href="/topic/${filelist[i].id}">${filelist[i].title}</a></li>`;
    i = i + 1;
  }
  list = list + "</ul>";
  return list;
};
