import qs from "qs";

const domain: Record<string, Function> = {
  "172.16.11.210": ceshi, // 测试
  "dkgl.bnet.cn": shanghaiOrGuangdong, // 上海电信，广东惠州电信
  "dkgl.zjhcsoft.com.cn": zhejiang, // 浙江台州电信，浙江温州电信，浙江宁波电信
  "114.221.126.216": jiangsu, // 江苏苏州电信，江苏扬州电信
  "dde.crm.bmcc.com.cn": beijing, // 江苏苏州电信，江苏扬州电信
};

export function handleRequestData(request: any, currentPage: number): any {
  const hostname = window.location.hostname;
  return domain[hostname] ? domain[hostname](request, currentPage) : request;
}

function ceshi(request: any, currentPage: number): any {
  const { url, method, body, headers } = JSON.parse(JSON.stringify(request));
  body.pageNum = currentPage;

  // 处理url
  let requestUrl = url;
  if (!requestUrl.startsWith("http")) {
    requestUrl = window.location.origin + requestUrl;
  }

  return {
    url: requestUrl,
    method,
    body,
    headers,
  };
}

function shanghaiOrGuangdong(request: any, currentPage: number): any {
  const { url, method, body, headers } = JSON.parse(JSON.stringify(request));
  // qs转换成对象
  let parsedBody = qs.parse(body);
  parsedBody.data = JSON.parse(parsedBody.data);
  // 处理请求参数
  parsedBody.data.page = currentPage;
  parsedBody.data = JSON.stringify(parsedBody.data);
  parsedBody.timestamp = Date.now();
  parsedBody = qs.stringify(parsedBody);

  return {
    url,
    method,
    body: parsedBody,
    headers,
  };
}

function zhejiang(request: any, currentPage: number): any {
  return shanghaiOrGuangdong(request, currentPage);
}

function jiangsu(request: any, currentPage: number): any {
  const { url, method, headers } = JSON.parse(JSON.stringify(request));

  // 处理url
  const Url = new URL(url, window.location.origin);

  const urlParams: any = {};
  Url.searchParams.forEach((value, key) => (urlParams[key] = value));
  urlParams.current = currentPage;

  const newParams = new URLSearchParams(urlParams).toString();

  return {
    url: Url.origin + Url.pathname + "?" + newParams,
    method,
    headers,
  };
}

export function allCrawlByCporttabname(
  capturedRequests: any,
  currentPage: number,
  item: any
) {
  const { url, method, body, headers } = JSON.parse(
    JSON.stringify(capturedRequests[0])
  );
  // qs转换成对象
  let parsedBody = qs.parse(body);
  parsedBody.data = JSON.parse(parsedBody.data);
  // 处理请求参数
  parsedBody.data.page = currentPage;
  parsedBody.data.cporttabname = item.cporttabname;
  parsedBody.data.pportid = item.id;
  parsedBody.data = JSON.stringify(parsedBody.data);
  parsedBody.timestamp = Date.now();
  parsedBody = qs.stringify(parsedBody);

  return {
    url,
    method,
    body: parsedBody,
    headers,
  };
}

function beijing(request: any, currentPage: number): any {
   const { url, method, body, headers } = JSON.parse(JSON.stringify(request));
  body.currentPage = currentPage;

  // 处理url
  let requestUrl = url;
  if (!requestUrl.startsWith("http")) {
    requestUrl = window.location.origin + requestUrl;
  }
  console.log("beijing方法",{ url: requestUrl,
    method,
    body,
    headers,})
  return {
    url: requestUrl,
    method,
    body,
    headers,
  };
}
