type CatProps = {
  className?: string;
};

/**
 * 「旮旯喵评」的猫猫吉祥物。
 *
 * 只画一只黑猫头和一条尾巴，不引入任何图片请求。颜色走 review-world 的 CSS 变量，
 * 在导航栏里单独使用时也有 fallback，不会变成透明或黑色块。
 */
export function CatMascot({ className }: CatProps) {
  return (
    <svg
      viewBox="0 0 240 210"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M190 174c28 1 40-28 29-50-6-12-19-18-30-14"
        fill="none"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path d="M54 62 40 10l50 23Z" fill="currentColor" />
      <path d="M186 62 200 10l-50 23Z" fill="currentColor" />
      <path d="M58 52 50 25l25 12Z" fill="var(--miao-pink, #f3a7b8)" />
      <path d="M182 52 190 25l-25 12Z" fill="var(--miao-pink, #f3a7b8)" />
      <path
        d="M38 92c0-38 36-60 82-60s82 22 82 60v42c0 28-24 48-54 48H92c-30 0-54-20-54-48Z"
        fill="currentColor"
      />
      <ellipse cx="92" cy="100" rx="15" ry="19" fill="#f2c75c" />
      <ellipse cx="148" cy="100" rx="15" ry="19" fill="#f2c75c" />
      <ellipse cx="95" cy="102" rx="6.5" ry="12" fill="#2f2a24" />
      <ellipse cx="145" cy="102" rx="6.5" ry="12" fill="#2f2a24" />
      <circle cx="97" cy="97" r="2.2" fill="#fff8ea" />
      <circle cx="147" cy="97" r="2.2" fill="#fff8ea" />
      <ellipse cx="120" cy="137" rx="39" ry="28" fill="#fff8ea" />
      <path d="M113 130h14l-7 9Z" fill="var(--miao-coral, #e86852)" />
      <path
        d="M120 139c0 7-7 11-14 9M120 139c0 7 7 11 14 9"
        fill="none"
        stroke="#2f2a24"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M72 130 44 122M72 141 42 144M168 130l28-8M168 141l30 3"
        fill="none"
        stroke="#2f2a24"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="78" cy="126" r="7" fill="var(--miao-pink, #f3a7b8)" opacity=".65" />
      <circle cx="162" cy="126" r="7" fill="var(--miao-pink, #f3a7b8)" opacity=".65" />
      <path
        d="M92 182h56v16a8 8 0 0 1-8 8H100a8 8 0 0 1-8-8Z"
        fill="#fff8ea"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path d="M102 190h28M102 197h18" stroke="#2f2a24" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="120" cy="181" r="5.5" fill="var(--miao-coral, #e86852)" />
    </svg>
  );
}

/** 导航栏/小标签用的小猫头，尺寸更小，细节更少。 */
export function CatMark({ className }: CatProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 18 5 4l12 6Z" fill="currentColor" />
      <path d="M40 18 43 4 31 10Z" fill="currentColor" />
      <path
        d="M6 24c0-9 8-15 18-15s18 6 18 15v8c0 8-6 13-14 13h-8C12 45 6 40 6 32Z"
        fill="currentColor"
      />
      <ellipse cx="18" cy="26" rx="3.2" ry="4.2" fill="#f2c75c" />
      <ellipse cx="30" cy="26" rx="3.2" ry="4.2" fill="#f2c75c" />
      <ellipse cx="24" cy="35" rx="8" ry="5.5" fill="#fff8ea" />
      <path d="M22 33h4l-2 2.5Z" fill="var(--miao-coral, #e86852)" />
    </svg>
  );
}
