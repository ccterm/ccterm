// common.js — 通用工具函数
// ── uni bridge ──
window._bridgeCbs = {}
document.addEventListener('UniAppJSBridgeReady', function() {
  console.log('uni bridge ready')
})

function callBridge(action, params, callback) {
  if (typeof uni === 'undefined' || typeof uni.webView === 'undefined') {
    console.warn('uni.webView 不可用')
    return
  }
  const callbackId = Date.now() + '_' + Math.random().toString(36).slice(2)
  if (callback) window._bridgeCbs[callbackId] = callback
  uni.webView.postMessage({ data: { action, params: Object.assign({}, params, { callbackId }) } })
}
// 格式化日期
function formatDate(date) {
    let y = date.getFullYear();
    let m = String(date.getMonth() + 1).padStart(2, '0');
    let d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
function getBaseUrl() {
  return 'https://xstarecn.xstare.club/api'
}
/**
 * 获取频道数据
 * @param {string} name - 频道名（如 "人气股"、"涨停天梯"）
 * @param {number} page - 页码
 * @param {string} [date] - 可选日期（YYYY-MM-DD）
 * @returns {Promise<{list: Array, hasMore: boolean}>}
 */
async function getChannelData(name, page, date){
  var res = await channelGetData(name, page, date);

  var list = (res && res.data && res.data.list) || [];

  var result = {
    list: list,
    hasMore: list.length > 0
  };
  if (res && res.data && res.data.date) {
    result.date = res.data.date;
  }
  if (res && res.data && res.data.short_code) {
    result.short_code = res.data.short_code;
    home_short_code = res.data.short_code;
    if (!window._channelShortCodes) window._channelShortCodes = {};
    window._channelShortCodes[name] = res.data.short_code;
  }
  return result;
}
function hbEsc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// 用来记录已经加载过的 JS
window.loadedScripts = window.loadedScripts || {};
window._loadingScripts = window._loadingScripts || {};

function loadScriptOnce(url) {
  if (window.loadedScripts[url]) {
    return Promise.resolve();
  }
  // 正在加载中的，复用同一个 Promise，避免重复创建 <script>
  if (window._loadingScripts[url]) {
    return window._loadingScripts[url];
  }

  // 非本地页面加载时，将相对路径补全为远程地址
  var isLocalPage = window.location.href.indexOf('hybrid/html') !== -1;
  if (!isLocalPage && url.indexOf('http') !== 0) {
    url = 'http://wap.mpsdk.com/static/xstarecn/' + url;
  }

  var p = new Promise(function(resolve, reject) {
    var script = document.createElement('script');
    script.src = url;
    script.onload = function() {
      window.loadedScripts[url] = true;
      delete window._loadingScripts[url];
      resolve();
    };
    script.onerror = function(e) {
      delete window._loadingScripts[url];
      reject(e);
    };
    document.body.appendChild(script);
  });
  window._loadingScripts[url] = p;
  return p;
}
/**
 * @param  {Object} data
 * @param  {string} data.title  - 列表标题（加粗红色）
 * @param  {{name:string, business:string}[]} data.stocks - 股票列表
 * @return {string} HTML div 片段
 *
 * @example
 * generateList({
 *   title: '热门板块龙头',
 *   stocks: [
 *     { name: '贵州茅台', business: '白酒' },
 *     { name: '宁德时代', business: '锂电池' }
 *   ]
 * })
 * // → 红色加粗标题 + 名称红色/业务灰色的列表行，每行底部有分隔线
 */
function generateList(data) {
    const title = data.title || '';
    const stocks = data.stocks || [];

    // 外层容器，12px 内边距
    let html = '<div style="padding:12px;font-family:sans-serif;font-size:14px;line-height:1.6;">';

    // 标题行：红色加粗 18px
    html += '<div style="color:#dc3232;font-weight:bold;font-size:18px;margin-bottom:8px;">'
          + hbEsc(title) + '</div>';

    // 逐股票输出：左列名称(红) + 右列业务(灰)，底部有分隔线
    for (const stock of stocks) {
        html += '<div style="display:flex;padding:3px 0;border-bottom:1px solid #eee;">';
        html += '<span style="color:#dc3232;font-weight:bold;min-width:80px;">'
              + hbEsc(stock.name) + '</span>';
        if (stock.business) {
            html += '<span style="color:#666;margin-left:8px;">' + hbEsc(stock.business) + '</span>';
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}

/* ── stock-business 映射（由 stock.js 注入，用于 kline 详情渲染） ── */
var _stockBusinessMap = null;

function getStockBusinessMap() {
	if (_stockBusinessMap) return Promise.resolve(_stockBusinessMap);
	if (window._stockBusinessMap) {
		_stockBusinessMap = window._stockBusinessMap;
		return Promise.resolve(_stockBusinessMap);
	}
	return Promise.reject(new Error('stock\u6570\u636e\u672a\u52a0\u8f7d'));
}
function formatKlineItems(klineArray) {
	var map = _stockBusinessMap || {};
	return (klineArray || []).map(function(k) {
		var lines = (k.result || '').split('\n').filter(Boolean);
		var stocks = lines.map(function(line) {
			var parts = line.split(',');
			var code = (parts[0] || '').trim();
			var name = parts[1] || code;
			var info = map[code];
			return { name: name, business: (info && (info.business || info.b)) || '' };
		});
		return { title: k.query, stocks: stocks };
	});
}

function toggleKlineDetail(btn) {
	var body = btn.parentNode.nextElementSibling;
	if (!body || (!body.classList.contains('kline-detail-body') && !body.classList.contains('rg-kline-detail-body'))) {
		// 按钮在 header 中（renderKlineRow 内），从容器查找 body
		var wrapper = btn.closest('.rg-card, [id$="Content"], .rg-html-content, .rg-gallery-body, .rg-md-body');
		body = wrapper ? wrapper.querySelector('.rg-kline-detail-body, .kline-detail-body') : null;
		if (!body) return;
	}

	if (body._loaded) {
		var isHidden = body.style.display === 'none';
		body.style.display = isHidden ? 'block' : 'none';
		btn.innerHTML = isHidden ? '▼ 收起' : '▶ 查看详情';
		return;
	}

	var klineData;
	try { klineData = JSON.parse(decodeURIComponent(btn.getAttribute('data-kline'))); } catch (e) { return; }

	getStockBusinessMap().then(function() {
		var items = formatKlineItems(klineData);
		var html = '<div style="border-top:1px solid var(--color-border-tertiary,rgba(0,0,0,0.1));margin:6px 0 0;padding:8px 0;">';
		items.forEach(function(item) { html += generateList(item); });
		html += '</div>';
		body.innerHTML = html;
		body._loaded = true;
		body.style.display = 'block';
		btn.innerHTML = '▼ 收起';
	}).catch(function(e) {
		console.error('[toggleKlineDetail]', e && e.message, 'map:', typeof window._stockBusinessMap);
		body._loaded = true;
		body.style.display = 'block';
		btn.innerHTML = '▼ 收起';
	});
}

function md2html(md) {
  if (!md) return ''
  let h = md

  h = h.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
       .replace(/"/g,'&quot;').replace(/'/g,'&#039;')

  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>')

  h = h.replace(/^### (.+)$/gm,'<h3>$1</h3>')
  h = h.replace(/^## (.+)$/gm,'<h2>$1</h2>')
  h = h.replace(/^# (.+)$/gm,'<h1>$1</h1>')

  h = h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
  h = h.replace(/__(.+?)__/g,'<strong>$1</strong>')
  h = h.replace(/\*(.+?)\*/g,'<em>$1</em>')
  h = h.replace(/_(.+?)_/g,'<em>$1</em>')

  h = h.replace(/\|(.+)\n\|[-:\s|]+\n((?:\|.+\n?)*)/g, function(match) {
    const lines = match.trim().split('\n')
    let table = '<table style="width:100%;border-collapse:collapse;">'
    const headerCells = lines[0].split('|')
    table += '<tr>'
    headerCells.forEach(function(cell) {
      cell = cell.trim()
      if (cell.length > 0) table += '<th style="border:1px solid #ddd;padding:8px;text-align:left;background-color:#f5f5f5;font-size:13px;">' + cell + '</th>'
    })
    table += '</tr>'
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|')
      if (cells.length > 0) {
        table += '<tr>'
        cells.forEach(function(cell) {
          cell = cell.trim()
          if (cell.length > 0) table += '<td style="border:1px solid #ddd;padding:8px;font-size:13px;">' + cell + '</td>'
        })
        table += '</tr>'
      }
    }
    table += '</table>'
    return table
  })

  h = h.replace(/^\s*[-*+] (.+)$/gm,'<li>$1</li>')
  h = h.replace(/(<li>[\s\S]+?<\/li>)/g,'<ul style="margin-left:16px;">$1</ul>')
  h = h.replace(/\n/g,'<br/>')

  return h
}

// ── 自定义弹窗（替代系统 alert / confirm，保持 App 原生体验） ──

function cmalert(msg, title) {
  return new Promise(resolve => {
    const bg = document.createElement('div');
    bg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9999;';
    bg.innerHTML = `
<div style="background:var(--color-background-primary,#fff);border-radius:14px;padding:24px 20px 16px;width:272px;box-sizing:border-box;">
  ${title ? `<div style="font-size:16px;font-weight:600;color:var(--color-text-primary,#1a1a1a);text-align:center;margin-bottom:8px;">${title}</div>` : ''}
  <div style="font-size:14px;color:var(--color-text-secondary,#666);text-align:center;line-height:1.6;margin-bottom:20px;">${msg}</div>
  <div id="_cmbtn" style="background:#E53935;color:#fff;border-radius:8px;padding:10px 0;text-align:center;font-size:15px;cursor:pointer;">确定</div>
</div>`;
    document.body.appendChild(bg);
    bg.querySelector('#_cmbtn').onclick = () => { bg.remove(); resolve(); };
  });
}

function cmconfirm(msg, title) {
  return new Promise(resolve => {
    const bg = document.createElement('div');
    bg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9999;';
    bg.innerHTML = `
<div style="background:var(--color-background-primary,#fff);border-radius:14px;padding:24px 20px 16px;width:272px;box-sizing:border-box;">
  ${title ? `<div style="font-size:16px;font-weight:600;color:var(--color-text-primary,#1a1a1a);text-align:center;margin-bottom:8px;">${title}</div>` : ''}
  <div style="font-size:14px;color:var(--color-text-secondary,#666);text-align:center;line-height:1.6;margin-bottom:20px;">${msg}</div>
  <div style="display:flex;gap:10px;">
    <div id="_cmcancel" style="flex:1;border:0.5px solid var(--color-border-secondary,rgba(0,0,0,0.18));border-radius:8px;padding:10px 0;text-align:center;font-size:15px;cursor:pointer;color:var(--color-text-secondary,#666);">取消</div>
    <div id="_cmok" style="flex:1;background:#E53935;color:#fff;border-radius:8px;padding:10px 0;text-align:center;font-size:15px;cursor:pointer;">确定</div>
  </div>
</div>`;
    document.body.appendChild(bg);
    bg.querySelector('#_cmok').onclick     = () => { bg.remove(); resolve(true); };
    bg.querySelector('#_cmcancel').onclick = () => { bg.remove(); resolve(false); };
  });
}
