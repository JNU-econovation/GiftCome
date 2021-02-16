var http = require("http");
var cookie = require("cookie");

http
  .createServer(function (request, response) {
    console.log(request.headers.cookie);
    var cookies = {};
    if (request.headers.cookie !== undefined) {
      cookies = cookie.parse(request.headers.cookie);
    }

    //쿠키를 만드는 과정
    //Permanent는 쿠키를 언제까지 지속시킬 것인가
    //Secre, HttpOnly 는 보안적으로 제한하는 것.
    //Path는 어느 path로만? 제한할건지..Domain도 마찬가지
    response.writeHead(200, {
      "Set-Cookie": [
        "yummy_cookie=choco",
        "tasty_cookie=strawberry",
        `Permanent=cookies; Max-Age=${60 * 60 * 24 * 30}`,
        "Secure=Secure; Secure",
        "HttpOnly=HttpOnly; HttpOnly",
        "Path=Path; Path=/cookie",
        "Doamin=Domain; Domain=test.o2.org",
      ],
    });
    response.end("Cookie!!");
  })
  .listen(3000);
