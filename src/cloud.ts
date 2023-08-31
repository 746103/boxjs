import VpnBox, { BaseErr } from "./lib/VpnBox";
require('./tpl/cloud.tpl.sgmodule');

class App extends VpnBox {

    public static readonly BASE_URL = "https://www.somersaultcloud.xyz/";

    public async doRequestAction($request: ScriptRequest): Promise<VpnResult> {
        if ($request.url.includes("cloud.log")) {
            return this.handelLogHttp();
        } else if ($request.url.includes("somersaultcloud.xyz/user/profile") || $request.url.includes("somersaultcloud.top/user/profile")) {
            if ($request.headers && $request.headers['Cookie']) {
                this.log("读取header成功", $request.headers);
                this.setStore('login_cookie', $request.headers['Cookie']);
                this.log("读取cookie成功", $request.headers['Cookie']);
                this.msg(this.appName, "读取cookie成功", '');
            } else {
                this.log("读取cookie失败", $request.headers);
                this.msg(this.appName, "读取cookie失败", '');
            }
            return {};
        }
        else if ($request.url.includes("cloud.json")) {
            const url = `${App.BASE_URL}user`;
            const opt = {
                url: url,
                headers: {
                    Cookie: this.getStore('login_cookie') ?? '',
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42",
                    referer: url
                }
            };
            const res = await this.get(opt);
            try {
                const data = this.exportData(res.body);
                return this.ajaxSuccessResult('获取个人信息', data);
            } catch (error) {
                throw new BaseErr('登录状态可能已经失效,' + error?.message);
            }
        }
        else {
            return false;
        }
    }
    public doResponseAction($request: ScriptRequest, $response: ScriptResponse): VpnResult | Promise<VpnResult> {
        return false;
    }
    public async doScriptAction(): Promise<VpnResult> {
        if($argument=='auto_sign_ip'){
            this.log(`IP白名单start $argument=${$argument}`);
            let url_arr=["http://hk-trail.somnode.top","http://us-trail.somnode.top","http://jp-trail.somnode.top","http://sg-trail.somnode.top","http://tw-trail.somnode.top","http://ru-trail.somnode.top","http://hk-i.somnode.top","http://hk-ii.somnode.top","http://hk-iii.somnode.top","http://hk-a.somnode.top","http://hk-b.somnode.top","http://hk-c.somnode.top","http://hk-d.somnode.top","http://hk-e.somnode.top","http://hk-f.somnode.top","http://hk-m.somnode.top"];
            let random_url=url_arr[Math.floor(Math.random()*url_arr.length)]+'/addallip.php';
            url_arr=url_arr.map((url=>{return url+'/addip.php'}));
            url_arr.push(random_url);
            const promises = url_arr.map(async url => {
                try {
                    let res=await this.get({url:url,headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.62"}});
                    if(res.body.includes('Cloudflare')){
                        this.log(`${url} 加白失败！Cloudflare User-Agent`);
                    }else{
                        this.log(`${url} 加白失败 Cloudflare！User-Agent`);
                    }
                } catch (error) {
                   this.log(`http request error:${error} url:${url}`);
                }
            });
            await Promise.all(promises).catch((err)=>{
                this.log('http promise all error:'+err);
            });
            this.log(`IP白名单end $random_url=${random_url}`);
            return {};
        }else{
            await this.handelSign();
            return {};
        }
    }

    public async handelSign() {
        this.log('运行 》 筋斗云签到');
        const url = `${App.BASE_URL}user/checkin`;
        const opts = {
            url: url,
            headers: {
                Cookie: this.getStore('login_cookie') ?? '',
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42",
                referer: url
            }
        };
        this.log('Http request:' + opts.url);
        let res = await this.post(opts);
        try {
            const data = JSON.parse(res.body);
            this.msg(this.appName, data.msg, (JSON.stringify(data)));
        } catch (error) {
            throw new BaseErr('登录状态可能已经失效,' + error?.message);
        }
    }


    private exportData(html: string) {
        let [, remain_flow, unit] = /<h4>剩余流量<\/h4>\n\s+<\/div>\n\s+<div class="card-body">\n\s+<span class="counter">(.*)?<\/span> (MB|GB|KB)/.exec(html) ?? [];
        let [, online, sum] = /<h4>同时在线设备数<\/h4>\n\s+<\/div>\n\s+<div class="card-body">\n\s+<span class="counter">(\d+)<\/span> \/ <span class="counterup">(\d+)<\/span>/.exec(html) ?? [];
        let [, used_flow] = /今日已用: (.*?)<\/li>/.exec(html) ?? [];
        let [, last_used_date] = /上次使用时间: (.*?)<\/li>/.exec(html) ?? [];
        let [, momey] = /<h4>钱包余额<\/h4>\n\s+<\/div>\n\s+<div class="card-body">\n\s+¥\s+<span class="counter">(.*)?<\/span>/.exec(html) ?? [];
        let [, commission] = /累计获得返利金额: ¥(.*?)<\/li>/.exec(html) ?? [];
        let res = {
            remain_flow: remain_flow + unit,
            online: online,
            sum: sum,
            used_flow: used_flow,
            last_used_date: last_used_date,
            momey: momey,
            commission: commission
        };
        this.log('↓ exportData');
        this.log(JSON.stringify(res));
        return res;
    }
}

new App("筋斗云", 'gsonhub.cloud').run();