import 'server-only';
import type { Kind } from './types';

// Dịch prompt: người dùng không thấy gì, hệ thống tự quyết.
// Hiện dùng `translate_to_en` miễn phí của Gommo (chỉ cho video, chỉ khi prompt có dấu tiếng Việt).
// Khi chuyển sang tự dịch bằng Claude: đặt PROMPT_TRANSLATOR=claude và hiện thực nhánh đó ở đây.

const VIETNAMESE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

export interface PreparedPrompt {
  /** Prompt gửi đi Gommo. */
  prompt: string;
  /** Có bật `translate_to_en` của Gommo không. */
  translateToEn: boolean;
  /** Ghi vào DB để biết ai đã dịch: 'gommo' | null. */
  translator: string | null;
}

export async function preparePrompt(kind: Kind, prompt: string): Promise<PreparedPrompt> {
  const text = prompt.trim();
  if (kind !== 'video' || !VIETNAMESE.test(text)) {
    return { prompt: text, translateToEn: false, translator: null };
  }
  const mode = process.env.PROMPT_TRANSLATOR ?? 'gommo';
  if (mode === 'claude') {
    // Chưa làm: dịch bằng Claude rồi gửi bản tiếng Anh, translator = 'claude'.
    // Tạm thời rơi về cách của Gommo để không chặn người dùng.
  }
  return { prompt: text, translateToEn: true, translator: 'gommo' };
}
