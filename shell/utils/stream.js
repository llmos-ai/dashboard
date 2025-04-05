export function streamJson(url, opt, onData) {
  opt = opt || {};
  opt.method = opt.method || 'get';
  opt.headers = opt.headers || {};
  opt.headers.accept = 'application/jsonl';

  const decoder = new TextDecoder();
  let buf = '';

  return fetch(url, opt)
    .then((res) => {
      if (res.status >= 400) {
        // eslint-disable-next-line no-console
        console.error('Error Streaming', res);

        const out = { message: 'Error Streaming' };

        out.response = res;

        return Promise.reject(out);
      } else {
        return res.body.getReader();
      }
    })
    .then((reader) => {
      return reader.read().then(function process({ value, done }) {
        if (done) {
          onData(JSON.parse(buf));

          return;
        }

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split(/[\r\n](?=.)/);

        buf = lines.pop();
        lines.map(JSON.parse).forEach(onData);

        return reader.read().then(process);
      });
    });
}

export function streamingSupported() {
  const supported = typeof TextDecoder !== 'undefined';

  // console.log('Streaming Supported: ', supported);

  return supported;
}

export async function fetchLLMStream(options = {
  url:         '',
  body:        {},
  headers:     {},
  onData:      null,
  onError:     null,
  onDone:      null,
  beforeFetch: null,
  afterFetch:  null,
  method:      'POST',
  payload:     {},
  signal:      null
}) {
  let {
    url, body, headers, onData, onError, onDone, beforeFetch, afterFetch, method = 'POST', payload, signal
  } = options;

  try {
    if (typeof beforeFetch === 'function') {
      const options = beforeFetch({
        payload, headers, body, method, url
      });

      url = options?.url || url;
      body = options?.body || body;
      headers = options?.headers || headers;
      method = options?.method || method;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
      signal
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let done = false;
    let buffer = '';

    if (!response.ok) {
      // catch error
      while (!done) {
        try {
          const { value, done: readerDone } = await reader.read();

          done = readerDone;
          if (value) {
            const content = decoder.decode(value, { stream: true });

            try {
              const jsonContent = JSON.parse(content);
              const message = jsonContent?.error?.message || jsonContent?.message;

              throw new Error(message || `HTTP error! Status: ${ response.status }`);
            } catch (parseError) {
              throw new Error(content || `HTTP error! Status: ${ response.status }`);
            }
          }
        } finally {
          if (typeof onDone === 'function') {
            onDone();
          }
        }
      }
    }

    while (!done) {
      const { value, done: readerDone } = await reader.read();

      done = readerDone;

      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();

          // ✅ 检查 [DONE] 标志，提前结束
          if (line === 'data: [DONE]') {
            if (typeof onDone === 'function') {
              onDone();
            }

            return;
          }

          // ✅ 处理正常的数据
          if (line.startsWith('data:')) {
            const jsonStr = line.replace(/^data: /, '');

            try {
              // 6. 解析 JSON 数据
              const parsed = JSON.parse(jsonStr);

              if (typeof onData === 'function') {
                onData(parsed);
              }
            } catch (error) {
              if (typeof onError === 'function') {
                onError(error);
              }
            }
          }
        }

        // 8. 处理剩余数据
        buffer = lines[lines.length - 1];
      }
    }

    if (typeof onDone === 'function') {
      onDone();
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      // eslint-disable-next-line no-console
      console.warn('aborted fetch');

      if (typeof onDone === 'function') {
        onDone();
      }
    } else if (typeof onError === 'function') {
      onError(error);
    }
  }
}
