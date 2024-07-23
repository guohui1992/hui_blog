import{_ as s,c as a,o as n,d as e}from"./app.44407a64.js";const x=JSON.parse('{"title":"一、语法","description":"","frontmatter":{"author":"coder-li","tags":"nginx/modules/ngx_http_header_module","aliases":"nginx页面缓存"},"headers":[{"level":2,"title":"1.开启nginx缓存模块","slug":"_1-开启nginx缓存模块","link":"#_1-开启nginx缓存模块","children":[]},{"level":2,"title":"2.响应头信息","slug":"_2-响应头信息","link":"#_2-响应头信息","children":[]},{"level":2,"title":"3.特点","slug":"_3-特点","link":"#_3-特点","children":[]},{"level":2,"title":"4.注意事项","slug":"_4-注意事项","link":"#_4-注意事项","children":[]}],"relativePath":"views/backend/nginx/基础知识/6.页面缓存模块.md"}'),l={name:"views/backend/nginx/基础知识/6.页面缓存模块.md"},i=e(`<h1 id="一、语法" tabindex="-1">一、语法 <a class="header-anchor" href="#一、语法" aria-hidden="true">#</a></h1><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki"><code><span class="line"><span style="color:#676E95;"># 默认 expires off;</span></span>
<span class="line"><span style="color:#676E95;"># Context: http,server,location</span></span>
<span class="line"><span style="color:#676E95;"># epoch代表具体时间，max代表10年</span></span>
<span class="line"><span style="color:#A6ACCD;">expires </span><span style="color:#89DDFF;">[</span><span style="color:#A6ACCD;">modified</span><span style="color:#89DDFF;">]</span><span style="color:#A6ACCD;"> </span><span style="color:#F78C6C;">time</span><span style="color:#89DDFF;">;</span></span>
<span class="line"><span style="color:#A6ACCD;">expires epoch</span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;">max</span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;">off</span><span style="color:#89DDFF;">;</span></span>
<span class="line"></span></code></pre></div><h1 id="二、观察浏览器缓存" tabindex="-1">二、观察浏览器缓存 <a class="header-anchor" href="#二、观察浏览器缓存" aria-hidden="true">#</a></h1><ol><li>禁用缓存的时候每次访问的http状态码都是[[HTTP状态码^200|200]]</li><li>开启缓存后，对于已经访问过的页面，再次访问的时候http状态码都是[[HTTP状态码#^66bfc7|304]]</li></ol><h1 id="三、理解nginx缓存" tabindex="-1">三、理解nginx缓存 <a class="header-anchor" href="#三、理解nginx缓存" aria-hidden="true">#</a></h1><h2 id="_1-开启nginx缓存模块" tabindex="-1">1.开启nginx缓存模块 <a class="header-anchor" href="#_1-开启nginx缓存模块" aria-hidden="true">#</a></h2><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki"><code><span class="line"><span style="color:#676E95;"># lj.conf</span></span>
<span class="line"><span style="color:#A6ACCD;">location / </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">	expires 24h</span><span style="color:#89DDFF;">;</span><span style="color:#A6ACCD;"> </span><span style="color:#676E95;">#24小时内不再从服务器请求资源，因为资源缓存在本地</span></span>
<span class="line"><span style="color:#89DDFF;">}</span></span>
<span class="line"></span></code></pre></div><h2 id="_2-响应头信息" tabindex="-1">2.响应头信息 <a class="header-anchor" href="#_2-响应头信息" aria-hidden="true">#</a></h2><p><img src="https://cdn.jsdelivr.net/gh/lijing-2008/PicGo/img/20220113071247.png" alt=""></p><h2 id="_3-特点" tabindex="-1">3.特点 <a class="header-anchor" href="#_3-特点" aria-hidden="true">#</a></h2><ul><li>加速浏览</li><li>==缺点是时效性降低==</li></ul><h2 id="_4-注意事项" tabindex="-1">4.注意事项 <a class="header-anchor" href="#_4-注意事项" aria-hidden="true">#</a></h2><p>对时效性要求较高的站点不要开启缓存</p>`,13),o=[i];function p(t,c,r,d,h,_){return n(),a("div",null,o)}const D=s(l,[["render",p]]);export{x as __pageData,D as default};
