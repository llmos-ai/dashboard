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

/**
 * 处理大模型 API 返回数据流
 * @param {string} url - API 端点地址
 * @param {Object} body - 请求体
 * @param {Object} headers - 请求头（可选）
 * @param {Function} onData - 处理数据块的回调
 * @param {Function} onError - 处理错误的回调
 * @param {Function} onDone - 请求完成后的回调
 * @param { Function } onBefore - 发送请求前
 */
export async function fetchLLMStream({
  url,
  body,
  headers = {},
  onData,
  onError,
  onDone,
  onBefore,
}) {
  try {
    if (typeof onBefore === 'function') {
      onBefore();
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    if (!response.ok) {
      // catch error
      const { value, done: readerDone } = await reader.read();
      const content = decoder.decode(value, { stream: true });

      const jsonContent = JSON.parse(content);
      const message = jsonContent?.error?.message;
      if (message) {
        throw new Error(message);
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    }

    let done = false;
    let buffer = '';

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
              const content = parsed.choices?.[0]?.delta?.content || '';

              // reasoning_content  (think)
              const reasoningContent =
                parsed.choices?.[0]?.delta?.reasoning_content || '';
              if (reasoningContent && typeof onData === 'function') {
                onData(reasoningContent, true);
              }

              // content
              // 7. 触发 onData 回调
              if (content && typeof onData === 'function') {
                onData(content);
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
    if (typeof onError === 'function') {
      onError(error);
    }
  }
}
