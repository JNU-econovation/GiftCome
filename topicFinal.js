var express = require("express");
var router = express.Router();
var path = require("path");
var fs = require("fs");
var sanitizeHtml = require("sanitize-html");
var template = require("./templateFinal.js");
var auth = require("./lib/authSession");
var db = require("./lib/db");
var shortid = require("shortid");

router.get("/list", function (request, response) {
  var list = template.list(request.list);
  var html = template.HTML2(
    `게시판`,
    `<a href="/topic/create" id="write">글 작성하기</a>
     ${list}`,
    auth.statusUI(request, response)
  );
  response.send(html);
});
router.get("/create", function (request, response) {
  if (!auth.isOwner(request, response)) {
    response.redirect("/");
    return false;
  }
  var html = template.HTML2(
    ``,
    ` <a href="/topic/list" id="write">목록보기</a>
      <form action="/topic/create_process" method="post">
        <p><input type="text" name="title" placeholder="title" id="postTitle"></p>
        <p>
          <textarea name="description" placeholder="description" id="postDesc"></textarea>
        </p>
        <p>
          <input type="submit" value="등록" id="submitPost">
        </p>
      </form>   `,
    auth.statusUI(request, response)
  );
  response.send(html);
});

router.post("/create_process", function (request, response) {
  if (!auth.isOwner(request, response)) {
    response.redirect("/");
    return false;
  }
  var post = request.body;
  var title = post.title;
  var description = post.description;
  var id = shortid.generate();
  db.get("topics")
    .push({
      id: id,
      title: title,
      description: description,
      user_id: request.user.id,
    })
    .write();
  response.redirect(`/topic/${id}`);
});

router.get("/update/:pageId", function (request, response) {
  if (!auth.isOwner(request, response)) {
    response.redirect("/");
    return false;
  }
  var topic = db.get("topics").find({ id: request.params.pageId }).value();
  request.flash("error", "Not yours!");
  if (topic.user_id !== request.user.id) {
    request.flash("error", "Not yours!");
    return response.redirect("/topic/list");
  }
  var title = topic.title;
  var description = topic.description;
  var list = template.list(request.list);
  var html = template.HTML2(
    ``,
    `
    <div class="postMenu">
      <a href="/topic/create">글쓰기</a> 
      <a href="/topic/update/${topic.id}">수정하기</a>
      <a href="/topic/list">목록보기</a>
    </div>
    <form action="/topic/update_process" method="post">
      <input type="hidden" name="id" value="${topic.id}">
      <p><input type="text" name="title" placeholder="title" value="${title}" id="postTitle"></p>
      <p>
        <textarea name="description" placeholder="description" id="postDesc">${description}</textarea>
      </p>
      <p>
        <input type="submit" value="수정" id="submitPost">
      </p>
    </form>
    `,
    auth.statusUI(request, response)
  );
  response.send(html);
});

router.post("/update_process", function (request, response) {
  if (!auth.isOwner(request, response)) {
    response.redirect("/");
    return false;
  }
  var post = request.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  var topic = db.get("topics").find({ id: id }).value();
  if (topic.user_id !== request.user.id) {
    request.flash("error", "Not yours!");
    return response.redirect("/topic/list");
  }
  db.get("topics")
    .find({ id: id })
    .assign({
      title: title,
      description: description,
    })
    .write();
  response.redirect(`/topic/${topic.id}`);
});

router.post("/delete_process", function (request, response) {
  if (!auth.isOwner(request, response)) {
    response.redirect("/");
    return false;
  }
  var post = request.body;
  var id = post.id;
  var topic = db.get("topics").find({ id: id }).value();
  if (topic.user_id !== request.user.id) {
    request.flash("error", "Not yours!");
    return response.redirect("/topic/list");
  }
  db.get("topics").remove({ id: id }).write();
  response.redirect("/topic/list");
});

router.get("/:pageId", function (request, response, next) {
  var topic = db
    .get("topics")
    .find({
      id: request.params.pageId,
    })
    .value();
  var user = db
    .get("users")
    .find({
      id: topic.user_id,
    })
    .value();
  var sanitizedTitle = sanitizeHtml(topic.title);
  var sanitizedDescription = sanitizeHtml(topic.description);
  var list = template.list(request.list);
  var html = template.HTML2(
    ``,
    ` <div class="postMenu">
        <a href="/topic/create">글 작성하기</a>
        <a href="/topic/list">목록보기</a>
        <a href="/topic/update/${topic.id}">수정</a>
      </div>  
      <div class="posting">
        <p>${sanitizedTitle}</p>
        <p>${sanitizedDescription}</p>
        <p id="writer">작성자 ${user.displayName}</p>
      </div>
      <div class="editPost">
        <form action="/topic/delete_process" method="post" id="deletePost">
          <input type="hidden" name="id" value="${topic.id}">
          <input type="submit" value="삭제">
        </form>
      </div>
    `,

    auth.statusUI(request, response)
  );
  response.send(html);
});
module.exports = router;
