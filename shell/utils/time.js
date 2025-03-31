import dayjs from 'dayjs';

// 时间换算因子，依次为 秒 -> 分钟、分钟 -> 小时、小时 -> 天、天 -> 月、月 -> 年
const FACTORS = [60, 60, 24, 30, 12];
// 时间单位标签
const LABELS = ['sec', 'min', 'hour', 'day', 'month', 'year'];

// 计算两个日期的差值，并返回一个包含差值信息的对象
// 如果传入了 't' 函数，会在返回对象中添加 'string' 属性，用于格式化差值字符串
export function diffFrom(value, from, t) {
  const now = dayjs();

  from = from || now;
  const diff = value.diff(from, 'seconds');

  let absDiff = Math.abs(diff);

  let next = 1;
  let label = '?';

  let i = 0;

  while (absDiff >= FACTORS[i] && i < FACTORS.length) {
    absDiff /= FACTORS[i];
    next *= Math.floor(FACTORS[i] / 10);
    i++;
  }

  if (absDiff < 5) {
    label = Math.floor(absDiff * 10) / 10;
  } else {
    label = Math.floor(absDiff);
  }
  const ret = {
    diff,
    absDiff,
    label,
    unitsKey: `unit.${ LABELS[i] }`,
    units:    LABELS[i],
    next,
  };

  if (!!t) {
    ret.string = `${ ret.label } ${ t(ret.unitsKey, { count: ret.label }) }`;
  }

  return ret;
}

// 安全地设置定时器，避免超时时间超过最大值
export function safeSetTimeout(timeout, callback, that) {
  if (timeout <= 2147483647) {
    // Max value setTimeout can take is max 32 bit int (about 24.9 days)
    return setTimeout(() => {
      callback.apply(that);
    }, timeout);
  }
}

// 计算两个日期之间的秒数差值
export function getSecondsDiff(startDate, endDate) {
  return Math.round(
    Math.abs(Date.parse(endDate) - Date.parse(startDate)) / 1000
  );
}

/**
 * 返回一个包含更新频率和格式化时间差值的对象
 *
 * diff:  更新频率（秒）
 * label: 单元格列的内容
 */
export function elapsedTime(seconds) {
  if (!seconds) {
    return {};
  }

  if (seconds < 120) {
    return {
      diff:  1,
      label: `${ seconds }s`
    };
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 10) {
    return {
      diff:  1,
      label: `${ minutes }m${ seconds - (minutes * 60) }s`
    };
  }

  const hours = Math.floor(seconds / 3600);

  if (hours < 3) {
    return {
      diff:  60,
      label: `${ minutes }m`,
    };
  }

  const days = Math.floor(seconds / (3600 * 24));

  if (days > 1) {
    const months = Math.floor(days / 30);

    if (months > 1) {
      const years = Math.floor(months / 12);

      if (years > 1) {
        return {
          diff:  60 * 60 * 24 * 30 * 12, // 每年更新一次
          label: `${ years }y${ months - (years * 12) }mo`,
        };
      }

      return {
        diff:  60 * 60 * 24 * 30, // 每月更新一次
        label: `${ months }mo${ Math.floor(days - (months * 30)) }d`,
      };
    }

    return {
      diff:  60,
      label: `${ days }d${ hours - (days * 24) }h`,
    };
  }

  if (hours > 7) {
    return {
      diff:  60,
      label: `${ hours }h`,
    };
  }

  return {
    diff:  60,
    label: `${ hours }h${ minutes - (hours * 60) }m`,
  };
}
