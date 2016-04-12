//load weixin
var ua = navigator.userAgent.toLowerCase(),
    isWeixin = ua.indexOf('micromessenger') != -1;

isWeixin && document.write('<script src="http://res.wx.qq.com/open/js/jweixin-1.0.0.js"></script> ');
function WxApi(opts) {
    var doc = document,
        href = location.href,
        hArr = href.split('/');
    hArr.pop();

    this.opts = {
        title: doc.title,
        desc: doc.querySelector('meta[name=description]').getAttribute('content'),
        imgUrl: doc.querySelector('img') && doc.querySelector('img').src,
        url: href
    };
    for (var i in opts) {
        this.opts[i] = opts[i]
    }


    isWeixin ? this.init() : console.log('NOT IN WX!');
    //this.init()
}

WxApi.prototype.init = function () {
    $.ajax({
        url: 'http://api.wbh5.com/wxapi',
        data: {url: location.href.split('#')[0]},
        type: 'POST',
        success: function(res) {

            config(res.timestamp, res.nonceStr,res.signature);
        },
        error: function() {
            alert('LOC ERROR...')
        }
    });
    function config(time, ns, sign) {

        wx.config({
            debug: !1,
            appId: 'wx9c7d41dcecaee273',
            timestamp: time,
            nonceStr: ns,
            signature: sign,
            jsApiList: [
                'checkJsApi', 'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo'
            ]
        });
    }
};

WxApi.prototype.share = function (obj) {
    if (!isWeixin) return;
    var self = this;

    wx.ready(function () {
        wx.onMenuShareAppMessage({
            title: obj.title || self.opts.title,
            desc: obj.desc || self.opts.desc,
            link: obj.url || self.opts.url,
            imgUrl: obj.imgUrl || self.opts.imgUrl,
            trigger: function (res) {
            },
            success: function (res) {
            },
            cancel: function (res) {
            },
            fail: function (res) {
                alert(JSON.stringify(res));
            }
        });

        wx.onMenuShareTimeline({
            title: obj.title || self.opts.title,
            link: obj.url || self.opts.url,
            imgUrl: obj.imgUrl || self.opts.imgUrl,
            trigger: function (res) {
            },
            success: function (res) {
            },
            cancel: function (res) {
            },
            fail: function (res) {
                alert(JSON.stringify(res));
            }
        });

        wx.onMenuShareQQ({
            title: obj.title || self.opts.title,
            desc: obj.desc || self.opts.desc,
            link: obj.url || self.opts.url,
            imgUrl: obj.imgUrl || self.opts.imgUrl,
            trigger: function (res) {
            },
            complete: function (res) {
                console.log(JSON.stringify(res));
            },
            success: function (res) {
            },
            cancel: function (res) {
            },
            fail: function (res) {
                alert(JSON.stringify(res));
            }
        });

        wx.onMenuShareWeibo({
            title: obj.title || self.opts.title,
            desc: obj.desc || self.opts.desc,
            link: obj.url || self.opts.url,
            imgUrl: obj.imgUrl || self.opts.imgUrl,
            trigger: function (res) {
            },
            complete: function (res) {
                console.log(JSON.stringify(res));
            },
            success: function (res) {
            },
            cancel: function (res) {
            },
            fail: function (res) {
                alert(JSON.stringify(res));
            }
        });
    });
};
