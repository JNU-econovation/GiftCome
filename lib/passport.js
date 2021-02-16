var db = require("../lib/db");

module.exports = function (app) {
  //passport 설치
  var passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy;

  //passport 사용하겠다
  //우리 passport는 session을 사용한다.
  app.use(passport.initialize());
  app.use(passport.session());

  //session을 처리하는 방법
  //로그인했을 때 딱 한 번 식별자를 세션스토어에 저장하는 코드
  passport.serializeUser(function (user, done) {
    console.log("serializeUser", user);
    done(null, user.id);
  });
  //페이지를 바꿀때마다 로그인했는지 아닌지 확인하며 데이터 보내는? 코드
  passport.deserializeUser(function (id, done) {
    var user = db
      .get("users")
      .find({
        id: id,
      })
      .value();
    console.log("deserializeUser", id, user);
    done(null, user);
  });

  //로그인시 맞는지 확인하는 과정
  //Form에서 내가 뭘로 지정해놨는지 field로 알려주기
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "pwd",
      },
      function (email, password, done) {
        console.log("LocalStrategy", email, password);
        var user = db
          .get("users")
          .find({
            email: email,
            password: password,
          })
          .value();
        if (user) {
          return done(null, user, {
            message: "Welcome.",
          });
        } else {
          console.log(4);
          return done(null, false, {
            message: "Incorrect user information.",
          });
        }
      }
    )
  );

  app.post(
    "/auth/login_process",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/auth/login",
      failureFlash: true,
      successFlash: true,
    })
  );
  return passport;
};
