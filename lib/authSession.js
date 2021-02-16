module.exports = {
  isOwner: function (request, response) {
    //passport를 이용해서 로그인을 하면 request.user객체가 생김
    if (request.user) {
      return true;
    } else {
      return false;
    }
  },
  statusUI: function (request, response) {
    var authStatusUI = "";
    if (this.isOwner(request, response)) {
      authStatusUI = `${request.user.displayName} | <a href="/auth/logout">logout</a>`;

      return authStatusUI;
    }
  },
  nickname: function (request, response) {
    var nickName = "";
    if (this.isOwner(request, response)) {
      nickName = `${request.user.displayName} `;

      return nickName;
    }
  },
};
