/*
汽车之家自动签到脚本
*/

const $ = new Env('汽车之家签到');
const cookieKey = 'autohome_cookie';
const authUrlKey = 'autohome_auth_url';

if (typeof $request !== 'undefined') {
  // 抓包模式：捕获 Cookie 和 URL
  getCookie();
} else {
  // 定时任务模式：执行签到
  sign();
}

function getCookie() {
  if ($request.url && $request.url.indexOf('sign') >= 0) {
    const cookie = $request.headers['Cookie'] || $request.headers['cookie'];
    if (cookie) {
      $.setdata(cookie, cookieKey);
      $.setdata($request.url, authUrlKey);
      $.msg($.name, '获取Cookie成功', '已保存最新的签到凭证，可关闭重写开关。');
    }
  }
  $.done();
}

function sign() {
  const cookie = $.getdata(cookieKey);
  const url = $.getdata(authUrlKey);

  if (!cookie || !url) {
    $.msg($.name, '签到失败', '未获取到 Cookie，请先在 App 或小程序中触发签到以抓包。');
    $.done();
    return;
  }

  // 构造签到请求（根据实际接口可能需要微调 method 或 headers）
  const request = {
    url: url,
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Content-Type': 'application/json'
    }
  };

  $.post(request, (error, response, data) => {
    if (error) {
      $.msg($.name, '签到请求失败', error);
    } else {
      try {
        const result = JSON.parse(data);
        // 根据汽车之家实际返回的 JSON 结构进行判断（通常以 returncode 或 code 为准）
        if (result.returncode === 0 || result.code === 200) {
          $.msg($.name, '签到成功 🎉', result.message || '今日已完成签到');
        } else {
          $.msg($.name, '签到失败 ⚠️', result.message || '未知错误，可能凭证已过期');
        }
      } catch (e) {
        $.msg($.name, '解析失败 ⚠️', '接口返回数据非标准 JSON 格式');
      }
    }
    $.done();
  });
}

// ============================================
// 环境标准兼容库 (Env)
function Env(name) {
  this.name = name;
  this.setdata = (val, key) => $persistentStore.write(val, key);
  this.getdata = (key) => $persistentStore.read(key);
  this.msg = (title, subtitle, body) => $notification.post(title, subtitle, body);
  this.post = (opts, cb) => $httpClient.post(opts, cb);
  this.done = (val) => $done(val);
}
