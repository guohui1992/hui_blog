import{_ as s,c as a,o as n,d as e}from"./app.fb76cbe0.js";const y=JSON.parse('{"title":"Linux","description":"","frontmatter":{},"headers":[{"level":2,"title":"一、Address already in use.端口占用","slug":"一、address-already-in-use-端口占用","link":"#一、address-already-in-use-端口占用","children":[]}],"relativePath":"bug/服务器/2.linux.md"}'),l={name:"bug/服务器/2.linux.md"},o=e(`<h1 id="linux" tabindex="-1">Linux <a class="header-anchor" href="#linux" aria-hidden="true">#</a></h1><h2 id="一、address-already-in-use-端口占用" tabindex="-1">一、Address already in use.端口占用 <a class="header-anchor" href="#一、address-already-in-use-端口占用" aria-hidden="true">#</a></h2><ul><li>在linux下</li></ul><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki"><code><span class="line"><span style="color:#A6ACCD;">lsof -i:端口号</span></span>
<span class="line"><span style="color:#82AAFF;">kill</span><span style="color:#A6ACCD;"> 进程号，如果不行就kill -9 端口号</span></span>
<span class="line"></span></code></pre></div><ul><li>在windows下</li></ul><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki"><code><span class="line"><span style="color:#A6ACCD;">netstat-aon</span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;">findstr </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">端口号</span><span style="color:#89DDFF;">&quot;</span></span>
<span class="line"><span style="color:#A6ACCD;">taskkill/pid </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">进程号</span><span style="color:#89DDFF;">&quot;</span><span style="color:#A6ACCD;"> -f</span></span>
<span class="line"></span></code></pre></div>`,6),t=[o];function i(p,r,c,d,u,_){return n(),a("div",null,t)}const C=s(l,[["render",i]]);export{y as __pageData,C as default};
