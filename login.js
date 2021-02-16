var express = require("express");
var router = express.Router();
var path = require("path");
var fs = require("fs");
var sanitizeHtml = require("sanitize-html");
var template = require("./templateFinal.js");
var shortid = require("shortid");
var auth = require("./lib/authSession");

var db = require("./lib/db");

module.exports = function (passport) {
  router.get("/login", function (request, response) {
    var fmsg = request.flash();
    var feedback = "";
    if (fmsg.error) {
      feedback = fmsg.error[0];
    }
    var html = template.HTML2(
      `
      로그인
      `,
      `
      <div style="color:red;">${feedback}</div>
      <div class="login_input">
      <form action="/auth/login_process" method="post">
      <p><input type="text" name="email" placeholder="email" ></p>
      <p><input type="password" name="pwd" placeholder="password"></p>
      </div>
      <div class="login_button">
        <input type="submit" class="button" value="Login">
      </div>  
      </form>
      <input type="button" class="button"  value="Register" onclick="location.href='/auth/register'" id="register">
      </div>
     
      
    `,
      auth.statusUI(request, response)
    );
    response.send(html);
  });

  router.post(
    "/login_process",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/auth/login",
      failureFlash: true,
      successFlash: true,
    })
  );

  router.get("/register", function (request, response) {
    var fmsg = request.flash();
    var feedback = "";
    if (fmsg.error) {
      feedback = fmsg.error[0];
    }

    var html = template.HTML2(
      `
      Register
     `,
      `<div class="register_input"> 
      <div style="color:red;">${feedback}</div>
      <form action="/auth/register_process" method="post">
      <p><input type="text" name="email" placeholder="email"></p>
      <p><input type="password" name="pwd" placeholder="password" ></p>
      <p><input type="password" name="pwd2" placeholder="password"></p>
      <p><input type="text" name="displayName" placeholder="display name" ></p>
      </div>
      <div class="register_button">
        <p>
          <input type="submit" class="button" value="register">
        </p>
        </div>
      </form>
      `,
      auth.statusUI(request, response)
    );
    response.send(html);
  });

  router.post("/register_process", function (request, response) {
    var post = request.body;
    var email = post.email;
    var pwd = post.pwd;
    var pwd2 = post.pwd2;
    var displayName = post.displayName;
    if (pwd !== pwd2) {
      request.flash("error", "Password must same!");
      response.redirect("/auth/register");
    } else {
      var user = {
        id: shortid.generate(),
        email: email,
        password: pwd,
        displayName: displayName,
      };
      db.get("users").push(user).write();
      request.login(user, function (err) {
        console.log("redirect");
        return response.redirect("/");
      });
    }
  });

  router.get("/logout", function (request, response) {
    request.logout();
    request.session.save(function () {
      response.redirect("/");
    });
  });
  return router;
};
